import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { handleEnquiryRequest } from "../functions/api/enquiries.ts";
import worker from "../functions/worker.ts";

const migration = await readFile(
  new URL("../migrations/0001_enquiries.sql", import.meta.url),
  "utf8",
);
const origin = "https://westline.test";
const valid = {
  name: "Alex Repair",
  email: "owner@example.test",
  company: "Example Mobile Repair",
  requestType: "sample",
  message: "Please send a sample handover.",
};

function database(t) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(migration);
  t.after(() => sqlite.close());
  return {
    sqlite,
    env: {
      DB: {
        prepare(sql) {
          const statement = sqlite.prepare(sql);
          return {
            bind(...values) {
              return {
                async run() {
                  const result = statement.run(...values);
                  return {
                    success: true,
                    meta: { changes: Number(result.changes) },
                  };
                },
              };
            },
          };
        },
      },
    },
    rows: () =>
      sqlite.prepare("SELECT * FROM enquiries ORDER BY created_at").all(),
  };
}

function request(value = valid, options = {}) {
  return new Request(`${origin}/api/enquiries`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...options.headers },
    body: JSON.stringify(value),
    ...options,
  });
}

test("a successful sample request is persisted with a server ID/time and a minimal response", async (t) => {
  const db = database(t);
  const before = Date.now();
  const result = await handleEnquiryRequest(
    request({
      ...valid,
      name: " Alex Repair ",
      email: " OWNER@EXAMPLE.TEST ",
      website: "",
      ip: "do not store",
    }),
    db.env,
  );
  assert.equal(result.status, 201);
  const payload = await result.json();
  assert.deepEqual(Object.keys(payload).sort(), ["id", "ok"]);
  assert.equal(payload.ok, true);
  assert.match(
    payload.id,
    /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
  );
  const [row] = db.rows();
  assert.equal(row.id, payload.id);
  assert.equal(row.name, "Alex Repair");
  assert.equal(row.email, "owner@example.test");
  assert.equal(row.request_type, "sample");
  assert.ok(
    Date.parse(row.created_at) >= before &&
      Date.parse(row.created_at) <= Date.now(),
  );
  assert.ok(row.created_at.endsWith("Z"));
  assert.deepEqual(Object.keys(row).sort(), [
    "company",
    "created_at",
    "email",
    "id",
    "message",
    "name",
    "request_type",
  ]);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.equal(result.headers.get("access-control-allow-origin"), null);
});

test("an enquiry can omit the optional message and honeypot", async (t) => {
  const db = database(t);
  const { message, ...input } = valid;
  assert.ok(message);
  const result = await handleEnquiryRequest(
    request({ ...input, requestType: "enquiry" }),
    db.env,
  );
  assert.equal(result.status, 201);
  assert.equal(db.rows()[0].message, "");
  assert.equal(db.rows()[0].request_type, "enquiry");
});

test("SQL and HTML-looking user text are stored literally without changing the schema", async (t) => {
  const db = database(t);
  const company = "Robert'); DROP TABLE enquiries; --";
  const message = '<script>alert("example")</script>\nInvoice request';
  const result = await handleEnquiryRequest(
    request({ ...valid, company, message }),
    db.env,
  );
  assert.equal(result.status, 201);
  assert.equal(db.rows()[0].company, company);
  assert.equal(db.rows()[0].message, message);
  assert.equal(
    db.sqlite.prepare("SELECT count(*) AS count FROM enquiries").get().count,
    1,
  );
});

test("required fields, length boundaries, malformed values, and honeypot are enforced before storage", async (t) => {
  const db = database(t);
  const invalid = [
    null,
    [],
    "text",
    {},
    { ...valid, name: "" },
    { ...valid, name: "x".repeat(101) },
    { ...valid, name: 4 },
    { ...valid, email: "not-an-email" },
    { ...valid, email: "a".repeat(250) + "@a.test" },
    { ...valid, email: "name\n@example.test" },
    { ...valid, company: " " },
    { ...valid, company: "x".repeat(161) },
    { ...valid, requestType: "other" },
    { ...valid, message: "x".repeat(2001) },
    { ...valid, message: 4 },
    { ...valid, message: "a\u0000b" },
    { ...valid, website: "spam.test" },
    { ...valid, website: false },
  ];
  for (const input of invalid) {
    const result = await handleEnquiryRequest(request(input), db.env);
    assert.equal(result.status, 400);
    assert.equal((await result.json()).ok, false);
  }
  assert.equal(db.rows().length, 0);
  const boundary = await handleEnquiryRequest(
    request({
      ...valid,
      name: "n".repeat(100),
      company: "c".repeat(160),
      email: "a".repeat(242) + "@example.com",
      message: "m".repeat(2000),
    }),
    db.env,
  );
  assert.equal(boundary.status, 201);
});

test("non-JSON, cross-origin, and public read requests cannot write or read records", async (t) => {
  const db = database(t);
  for (const method of ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]) {
    const result = await handleEnquiryRequest(
      new Request(`${origin}/api/enquiries`, { method }),
      db.env,
    );
    assert.equal(result.status, 405);
    assert.equal(result.headers.get("allow"), "POST");
  }
  for (const headers of [
    { "content-type": "application/json", origin: "https://other.test" },
    { "content-type": "application/json", origin: "null" },
    { "content-type": "application/json", "sec-fetch-site": "cross-site" },
  ]) {
    assert.equal(
      (await handleEnquiryRequest(request(valid, { headers }), db.env)).status,
      403,
    );
  }
  assert.equal(
    (
      await handleEnquiryRequest(
        request(valid, { headers: { "content-type": "text/plain" } }),
        db.env,
      )
    ).status,
    415,
  );
  assert.equal(db.rows().length, 0);
});

test("missing origin is allowed for non-browser clients while JSON remains required", async (t) => {
  const db = database(t);
  const result = await handleEnquiryRequest(
    request(valid, {
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
    db.env,
  );
  assert.equal(result.status, 201);
});

test("malformed JSON, invalid UTF-8, and oversized declared or streamed bodies are rejected", async (t) => {
  const db = database(t);
  const headers = { "content-type": "application/json", origin };
  assert.equal(
    (
      await handleEnquiryRequest(
        new Request(`${origin}/api/enquiries`, {
          method: "POST",
          headers,
          body: "{",
        }),
        db.env,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleEnquiryRequest(
        new Request(`${origin}/api/enquiries`, {
          method: "POST",
          headers,
          body: new Uint8Array([0xc3, 0x28]),
        }),
        db.env,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleEnquiryRequest(
        request(valid, { headers: { ...headers, "content-length": "16385" } }),
        db.env,
      )
    ).status,
    413,
  );
  const chunk = new TextEncoder().encode("界".repeat(3000));
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(chunk);
      controller.enqueue(chunk);
      controller.close();
    },
  });
  const streamed = new Request(`${origin}/api/enquiries`, {
    method: "POST",
    headers,
    body: stream,
    duplex: "half",
  });
  assert.equal((await handleEnquiryRequest(streamed, db.env)).status, 413);
  assert.equal(db.rows().length, 0);
});

test("missing binding and all database failure shapes return 503, never success or PII", async () => {
  const failures = [
    {},
    {
      DB: {
        prepare() {
          throw new Error("private database detail");
        },
      },
    },
    ...[
      { success: false },
      { success: true },
      { success: true, meta: { changes: 2 } },
    ].map((result) => ({
      DB: { prepare: () => ({ bind: () => ({ run: async () => result }) }) },
    })),
    {
      DB: {
        prepare: () => ({
          bind: () => ({
            run: async () => {
              throw new Error(valid.email);
            },
          }),
        }),
      },
    },
  ];
  for (const env of failures) {
    const result = await handleEnquiryRequest(request(), env);
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), {
      ok: false,
      error: "We could not save your request. Please email Westline instead.",
    });
  }
});

test("the per-email cap is atomic and case-normalized; a different email remains usable", async (t) => {
  const db = database(t);
  const statuses = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      handleEnquiryRequest(
        request({
          ...valid,
          email: index % 2 ? "OWNER@EXAMPLE.TEST" : valid.email,
        }),
        db.env,
      ).then((result) => result.status),
    ),
  );
  assert.equal(statuses.filter((status) => status === 201).length, 5);
  assert.equal(statuses.filter((status) => status === 429).length, 1);
  assert.equal(db.rows().length, 5);
  const other = await handleEnquiryRequest(
    request({ ...valid, email: "another@example.test" }),
    db.env,
  );
  assert.equal(other.status, 201);
});

test("the global hourly cap rejects without insertion and expired rows no longer block", async (t) => {
  const db = database(t);
  const insert = db.sqlite.prepare(
    "INSERT INTO enquiries (id,created_at,name,email,company,request_type,message) VALUES (?,?,?,?,?,?,?)",
  );
  for (let index = 0; index < 100; index += 1)
    insert.run(
      `seed-${index}`,
      new Date().toISOString(),
      "Test",
      `seed-${index}@example.test`,
      "Example",
      "enquiry",
      "",
    );
  const capped = await handleEnquiryRequest(request(), db.env);
  assert.equal(capped.status, 429);
  assert.equal(capped.headers.get("retry-after"), "3600");
  assert.equal(db.rows().length, 100);
  db.sqlite
    .prepare("UPDATE enquiries SET created_at = ?")
    .run(new Date(Date.now() - 61 * 60 * 1000).toISOString());
  assert.equal((await handleEnquiryRequest(request(), db.env)).status, 201);
});

test("the advanced worker routes only the enquiry API and preserves static assets", async (t) => {
  const db = database(t);
  const assets = [];
  const env = {
    ...db.env,
    ASSETS: {
      fetch: async (request) => {
        assets.push(request.url);
        return new Response("static asset");
      },
    },
  };
  assert.equal((await worker.fetch(request(), env)).status, 201);
  assert.equal(
    (await worker.fetch(new Request(`${origin}/api/private-list`), env)).status,
    404,
  );
  assert.equal(
    await (await worker.fetch(new Request(`${origin}/privacy/`), env)).text(),
    "static asset",
  );
  assert.deepEqual(assets, [`${origin}/privacy/`]);
});
