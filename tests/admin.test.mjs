import assert from "node:assert/strict";
import { test } from "node:test";
import { handleAdminRequest } from "../functions/admin.ts";
import worker from "../functions/worker.ts";

const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const publicKey = { ...await crypto.subtle.exportKey("jwk", pair.publicKey), kid: "test-key", alg: "RS256", use: "sig" };
const config = { ACCESS_TEAM_DOMAIN: "westline-test.cloudflareaccess.com", ACCESS_AUD: "a".repeat(64), ADMIN_EMAIL: "operator@example.test" };
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
async function token(overrides = {}, header = {}) {
  const now = Math.floor(Date.now() / 1000);
  const content = encode({ alg: "RS256", kid: "test-key", typ: "JWT", ...header }) + "." + encode({ iss: "https://" + config.ACCESS_TEAM_DOMAIN, aud: [config.ACCESS_AUD], type: "app", email: config.ADMIN_EMAIL, sub: "operator", iat: now - 10, exp: now + 300, ...overrides });
  return content + "." + Buffer.from(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(content))).toString("base64url");
}
function request(jwt, path = "/admin/", method = "GET") {
  return new Request("https://westline.test" + path, { method, headers: jwt ? { "cf-access-jwt-assertion": jwt } : {} });
}

test("private viewer validates signatures and claims before any database read", async (context) => {
  context.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "https://" + config.ACCESS_TEAM_DOMAIN + "/cdn-cgi/access/certs");
    return Response.json({ keys: [publicKey] });
  });
  let reads = 0;
  const env = { ...config, DB: { prepare() { reads++; return { bind() { return { async all() { return { success: true, results: [{ id: "test-id", created_at: "2026-10-23T00:00:00.000Z", name: "<script>alert(1)</script>", company: "<img src=x>", email: "qa@example.test", request_type: "enquiry", message: "<script>bad()</script>" }] }; } }; } }; } } };
  assert.equal((await handleAdminRequest(request(), {})).status, 503);
  assert.equal((await handleAdminRequest(request(), env)).status, 403);
  for (const changes of [{ email: "attacker@example.test" }, { aud: ["wrong"] }, { iss: "https://other.cloudflareaccess.com" }, { exp: 1 }, { iat: 9999999999 }, { nbf: 9999999999 }, { type: "service" }, { sub: "" }]) {
    assert.equal((await handleAdminRequest(request(await token(changes)), env)).status, 403);
  }
  assert.equal((await handleAdminRequest(request(await token({}, { alg: "none" })), env)).status, 403);
  const signed = await token();
  const parts = signed.split(".");
  parts[2] = Buffer.alloc(256).toString("base64url");
  assert.equal((await handleAdminRequest(request(parts.join(".")), env)).status, 403);
  assert.equal(reads, 0);
  const response = await handleAdminRequest(request(signed), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
  assert.equal((await handleAdminRequest(request(signed, "/admin/api/enquiries"), env)).status, 200);
  assert.equal((await handleAdminRequest(request(signed, "/admin/?cursor=invalid!"), env)).status, 400);
  assert.equal((await handleAdminRequest(request(signed, "/admin/", "POST"), env)).status, 405);
  assert.equal((await handleAdminRequest(request(signed, "/admin/unknown"), env)).status, 404);
});

test("every private route fails closed and never falls back to static assets", async () => {
  for (const path of ["/admin", "/admin/", "/admin/api/enquiries", "/admin/unknown"]) {
    const response = await worker.fetch(request(null, path), { ASSETS: { fetch() { throw new Error("Private request reached assets"); } } });
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes("enquiries:"));
  }
});
