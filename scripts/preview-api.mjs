import { createServer } from "node:http";
import { readFile, mkdir, stat } from "node:fs/promises";
import { resolve, relative, isAbsolute, extname, join } from "node:path";
import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { parseArgs } from "node:util";
import { handleEnquiryRequest } from "../functions/api/enquiries.ts";

// Local verification only. No account credentials or remote database are used.
const { values } = parseArgs({
  options: {
    host: { type: "string", default: "127.0.0.1" },
    port: { type: "string", default: "4175" },
    "database-unavailable": { type: "boolean", default: false },
  },
});
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Choose a port between 1 and 65535.");
const root = process.cwd();
const dist = resolve(root, "dist");
await stat(join(dist, "index.html"));

let database;
const env = {};
const databasePath = resolve(root, "test-results/enquiries-preview.sqlite");
if (!values["database-unavailable"]) {
  await mkdir(resolve(root, "test-results"), { recursive: true });
  database = new DatabaseSync(databasePath);
  database.exec(
    await readFile(resolve(root, "migrations/0001_enquiries.sql"), "utf8"),
  );
  env.DB = {
    prepare(sql) {
      const statement = database.prepare(sql);
      return {
        bind(...parameters) {
          return {
            async run() {
              const result = statement.run(...parameters);
              return {
                success: true,
                meta: { changes: Number(result.changes) },
              };
            },
          };
        },
      };
    },
  };
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

async function staticResponse(url, method) {
  if (method !== "GET" && method !== "HEAD")
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (
    pathname.includes("\0") ||
    /^\/(?:_worker\.js|_routes\.json|_headers|_redirects)(?:\/|$)/.test(
      pathname,
    )
  ) {
    return new Response("Not found", { status: 404 });
  }
  let filename = resolve(dist, `.${pathname}`);
  const within = relative(dist, filename);
  if (within.startsWith("..") || isAbsolute(within))
    return new Response("Not found", { status: 404 });
  let status = 200;
  try {
    if ((await stat(filename)).isDirectory()) {
      if (!url.pathname.endsWith("/"))
        return new Response(null, {
          status: 308,
          headers: { Location: `${url.pathname}/${url.search}` },
        });
      filename = join(filename, "index.html");
    }
    await stat(filename);
  } catch {
    filename = join(dist, "404.html");
    status = 404;
  }
  const bytes = await readFile(filename);
  return new Response(method === "HEAD" ? null : bytes, {
    status,
    headers: {
      "Content-Type":
        contentTypes[extname(filename)] ?? "application/octet-stream",
      "Content-Length": String(bytes.byteLength),
    },
  });
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value))
        for (const item of value) headers.append(key, item);
      else if (value !== undefined) headers.set(key, value);
    }
    const url = new URL(
      incoming.url ?? "/",
      `http://${headers.get("host") ?? `127.0.0.1:${port}`}`,
    );
    let result;
    if (
      url.pathname === "/api/enquiries" ||
      url.pathname === "/api/enquiries/"
    ) {
      const method = incoming.method ?? "GET";
      const request = new Request(url, {
        method,
        headers,
        ...(method !== "GET" && method !== "HEAD"
          ? { body: Readable.toWeb(incoming), duplex: "half" }
          : {}),
      });
      result = await handleEnquiryRequest(request, env);
    } else if (url.pathname.startsWith("/api/")) {
      result = Response.json(
        { ok: false, error: "Not found." },
        { status: 404 },
      );
    } else {
      result = await staticResponse(url, incoming.method ?? "GET");
    }
    outgoing.statusCode = result.status;
    result.headers.forEach((value, key) => outgoing.setHeader(key, value));
    outgoing.setHeader("Cache-Control", "no-store");
    outgoing.setHeader("X-Content-Type-Options", "nosniff");
    outgoing.setHeader("X-Robots-Tag", "noindex");
    outgoing.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    outgoing.statusCode = 500;
    outgoing.setHeader("Content-Type", "text/plain; charset=utf-8");
    outgoing.end("Local preview unavailable.");
  }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.on("error", (error) => {
  console.error(
    `Local preview could not start (${error.code ?? "unknown error"}).`,
  );
  database?.close();
  process.exitCode = 1;
});
server.listen(port, values.host, () => {
  const visibleHost = values.host.includes(":")
    ? `[${values.host}]`
    : values.host;
  console.log(`Local API preview: http://${visibleHost}:${port}`);
  console.log(
    values["database-unavailable"]
      ? "Database intentionally unavailable: valid form requests return503."
      : `Local SQLite: ${databasePath}`,
  );
  console.log(
    "Use synthetic test enquiries only. No request bodies are logged.",
  );
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      database?.close();
      process.exit(0);
    });
    server.closeAllConnections();
  });
}
