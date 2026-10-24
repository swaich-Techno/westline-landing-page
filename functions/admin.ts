import { authorizeAccess, type AccessEnv } from "./access.ts";
import type { EnquiryEnv } from "./api/enquiries.ts";

const PAGE_SIZE = 25;
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
};

function json(status: number, body: unknown, extra?: Record<string, string>): Response {
  return Response.json(body, { status, headers: { ...headers, ...extra } });
}

function escape(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function cursor(value: string | null): [string, string] | undefined {
  if (value === null) return undefined;
  if (value.length > 256 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid cursor");
  const decoded: unknown = JSON.parse(atob(value.replace(/-/g, "+").replace(/_/g, "/")));
  if (!Array.isArray(decoded) || decoded.length !== 2 ||
    typeof decoded[0] !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(decoded[0]) ||
    !Number.isFinite(Date.parse(decoded[0])) ||
    typeof decoded[1] !== "string" || !/^[a-z0-9-]{1,100}$/i.test(decoded[1])) throw new Error("Invalid cursor");
  return [decoded[0], decoded[1]];
}

function encodeCursor(row: Record<string, unknown>): string {
  return btoa(JSON.stringify([row.created_at, row.id])).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function document(rows: Record<string, unknown>[], next: string | null, email: string, issuer: string, nonce: string): string {
  const cards = rows.map((row) => `<article><div class="row"><h2>${escape(row.company)}</h2><span class="badge">${row.request_type === "sample" ? "Sample request" : "Operations enquiry"}</span></div><p class="muted">Received ${escape(row.created_at)} · UTC</p><dl><div><dt>Contact</dt><dd>${escape(row.name)}</dd></div><div><dt>Email</dt><dd><a href="mailto:${escape(encodeURIComponent(String(row.email)))}">${escape(row.email)}</a></dd></div><div><dt>Reference</dt><dd class="reference">${escape(row.id)}</dd></div></dl><h3>Message</h3><p class="message">${row.message ? escape(row.message) : "No message supplied."}</p></article>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>Enquiries | Westline Dispatch</title><style nonce="${nonce}">:root{font-family:Inter,system-ui,sans-serif;color:#102538;background:#f8fafc}*{box-sizing:border-box}body{margin:0}header{background:#102538;color:#fff;padding:1.5rem max(1.25rem,calc((100vw - 1000px)/2))}header p{color:#d7e0e8}header a{color:#efb787}main{max-width:1000px;margin:0 auto;padding:2rem 1.25rem 4rem}h1{font-size:clamp(1.8rem,5vw,2.5rem);margin:0 0 .8rem}h2{font-size:1.2rem;margin:0}h3,dt{font-size:.85rem;font-weight:650}p{line-height:1.6}a{color:#345976;text-underline-offset:3px}a:focus-visible{outline:3px solid #c9874c;outline-offset:5px}.row{display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap}.muted{color:#526579;font-size:.85rem}.badge{font-size:.78rem;background:#e9eff3;border-radius:99px;padding:.45rem .7rem}article{padding:1.5rem;background:#fff;border:1px solid #dbe3e9;border-radius:12px;margin:1.25rem 0}dl{display:grid;grid-template-columns:1fr 1.5fr;gap:1rem;margin:1.2rem 0}dd{margin:.35rem 0;overflow-wrap:anywhere}dl div:last-child{grid-column:1/-1}.reference{font-size:.8rem}.message{white-space:pre-wrap;overflow-wrap:anywhere}.notice{border-left:3px solid #c9874c;padding-left:1rem}nav{display:flex;gap:1.5rem;flex-wrap:wrap}footer{margin-top:2rem;color:#526579;font-size:.85rem}@media(max-width:600px){dl{grid-template-columns:1fr}article{padding:1.2rem}.row{align-items:flex-start}}</style></head><body><header><p>WESTLINE DISPATCH · PRIVATE WORKSPACE</p><h1>Website enquiries</h1><div class="row"><p>Signed in as ${escape(email)}</p><a href="${escape(issuer)}/cdn-cgi/access/logout">Sign out</a></div></header><main><nav aria-label="Enquiry navigation"><a href="/admin/">Refresh / newest requests</a><a href="/">View public website</a></nav><p class="notice">Review new enquiries here and reply from the team inbox. This viewer is read-only; opening a record does not send a reply or mark it handled. Email notifications are not enabled.</p>${cards || "<p>No enquiries to display.</p>"}<nav aria-label="Pagination">${next ? `<a href="/admin/?cursor=${encodeURIComponent(next)}">Older enquiries →</a>` : "<p>No older enquiries.</p>"}</nav><footer>Showing up to ${PAGE_SIZE} enquiries, newest first. Keep this workspace private. Manage retention and deletion in the Cloudflare D1 console.</footer></main></body></html>`;
}

/** Every admin path is authorized before database access, including unknown paths. */
export async function handleAdminRequest(request: Request, env: EnquiryEnv & AccessEnv): Promise<Response> {
  const identity = await authorizeAccess(request, env);
  if (!identity.ok) return json(identity.status, { ok: false, error: identity.status === 503 ? "Private workspace unavailable." : "Sign in with the authorized Cloudflare Access account." });
  if (request.method !== "GET") return json(405, { ok: false, error: "This workspace is read-only." }, { Allow: "GET" });
  const url = new URL(request.url);
  if (!["/admin", "/admin/", "/admin/api/enquiries"].includes(url.pathname)) return json(404, { ok: false, error: "Not found." });
  let before: [string, string] | undefined;
  try {
    before = cursor(url.searchParams.get("cursor"));
  } catch {
    return json(400, { ok: false, error: "Invalid page cursor. Return to the newest enquiries." });
  }
  if (!env.DB) return json(503, { ok: false, error: "Enquiries are temporarily unavailable." });
  try {
    const statement = env.DB.prepare(`SELECT id, created_at, name, email, company, request_type, message FROM enquiries ${before ? "WHERE created_at < ? OR (created_at = ? AND id < ?)" : ""} ORDER BY created_at DESC, id DESC LIMIT ?`).bind(...(before ? [before[0], before[0], before[1], PAGE_SIZE + 1] : [PAGE_SIZE + 1]));
    if (!statement.all) throw new Error("Unavailable binding");
    const result = await statement.all();
    if (!result.success || !Array.isArray(result.results)) throw new Error("Unavailable results");
    const rows = result.results.slice(0, PAGE_SIZE);
    const next = result.results.length > PAGE_SIZE ? encodeCursor(rows[rows.length - 1]) : null;
    if (url.pathname === "/admin/api/enquiries") return json(200, { ok: true, enquiries: rows, nextCursor: next });
    const nonce = btoa(crypto.randomUUID());
    return new Response(document(rows, next, identity.email, identity.issuer, nonce), {
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": `${headers["Content-Security-Policy"]}; style-src 'nonce-${nonce}'` },
    });
  } catch {
    return json(503, { ok: false, error: "Enquiries are temporarily unavailable." });
  }
}
