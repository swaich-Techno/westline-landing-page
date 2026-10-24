/** Server-only Cloudflare Access configuration. Never expose these settings through VITE_ variables. */
export interface AccessEnv {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ADMIN_EMAIL?: string;
}

interface AccessConfig {
  issuer: string;
  audience: string;
  email: string;
}

interface SigningKey extends JsonWebKey {
  kid?: string;
}

type AccessResult =
  | { ok: true; email: string; issuer: string }
  | { ok: false; status: 403 | 503 };

let cachedKeys:
  | { issuer: string; expires: number; keys: SigningKey[] }
  | undefined;
let pendingKeys:
  | { issuer: string; promise: Promise<SigningKey[]> }
  | undefined;

function configuration(env: AccessEnv): AccessConfig | undefined {
  const team = env.ACCESS_TEAM_DOMAIN?.trim().toLowerCase();
  const audience = env.ACCESS_AUD?.trim();
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  // Only a Cloudflare Access team hostname is permitted, never a URL or user-supplied endpoint.
  if (
    !team ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com$/.test(team) ||
    !audience ||
    !/^[a-f0-9]{64}$/i.test(audience) ||
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) return undefined;
  return { issuer: `https://${team}`, audience, email };
}

function decode(segment: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(segment)) throw new Error("Invalid JWT");
  const binary = atob(segment.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function object(segment: string): Record<string, unknown> {
  const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decode(segment)));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid JWT");
  return value as Record<string, unknown>;
}

async function signingKeys(issuer: string): Promise<SigningKey[]> {
  if (cachedKeys?.issuer === issuer && cachedKeys.expires > Date.now()) return cachedKeys.keys;
  if (pendingKeys?.issuer === issuer) return pendingKeys.promise;
  const promise = (async () => {
    const response = await fetch(`${issuer}/cdn-cgi/access/certs`, {
      signal: AbortSignal.timeout(5000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("Access keys unavailable");
    const text = await response.text();
    if (text.length > 128 * 1024) throw new Error("Invalid Access keys");
    const data = JSON.parse(text) as { keys?: unknown };
    if (!Array.isArray(data.keys) || data.keys.length > 20) throw new Error("Invalid Access keys");
    const keys = data.keys.filter((key): key is SigningKey =>
      Boolean(key && typeof key === "object" && key.kty === "RSA" &&
        typeof key.kid === "string" && typeof key.n === "string" && typeof key.e === "string" &&
        (!key.alg || key.alg === "RS256") && (!key.use || key.use === "sig")),
    );
    if (!keys.length) throw new Error("Invalid Access keys");
    cachedKeys = { issuer, expires: Date.now() + 5 * 60 * 1000, keys };
    return keys;
  })();
  pendingKeys = { issuer, promise };
  try {
    return await promise;
  } finally {
    if (pendingKeys?.promise === promise) pendingKeys = undefined;
  }
}

/** Verify signature AND identity claims; a forged identity header alone never grants access. */
export async function authorizeAccess(request: Request, env: AccessEnv): Promise<AccessResult> {
  const config = configuration(env);
  if (!config) return { ok: false, status: 503 };
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || token.length > 16 * 1024) return { ok: false, status: 403 };
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  let parts: string[];
  try {
    parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT");
    header = object(parts[0]);
    payload = object(parts[1]);
    const now = Math.floor(Date.now() / 1000);
    const validTime = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value);
    if (
      header.alg !== "RS256" || typeof header.kid !== "string" || header.kid.length > 200 ||
      header.crit !== undefined || (header.typ !== undefined && header.typ !== "JWT") ||
      payload.iss !== config.issuer || payload.type !== "app" ||
      !Array.isArray(payload.aud) || !payload.aud.includes(config.audience) ||
      typeof payload.sub !== "string" || !payload.sub ||
      typeof payload.email !== "string" || payload.email.toLowerCase() !== config.email ||
      !validTime(payload.exp) || payload.exp <= now ||
      !validTime(payload.iat) || payload.iat > now + 30 || payload.iat >= payload.exp ||
      (payload.nbf !== undefined && (!validTime(payload.nbf) || payload.nbf > now + 30))
    ) throw new Error("Invalid JWT");
    decode(parts[2]);
  } catch {
    return { ok: false, status: 403 };
  }
  let keys: SigningKey[];
  try {
    keys = await signingKeys(config.issuer);
  } catch {
    return { ok: false, status: 503 };
  }
  try {
    const key = keys.find((candidate) => candidate.kid === header.kid);
    if (!key) return { ok: false, status: 403 };
    const publicKey = await crypto.subtle.importKey("jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, decode(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    return valid ? { ok: true, email: config.email, issuer: config.issuer } : { ok: false, status: 403 };
  } catch {
    return { ok: false, status: 403 };
  }
}
