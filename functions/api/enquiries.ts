/** The D1 methods this endpoint needs. These structural types match the binding API. */
export interface EnquiryDatabase {
  prepare(sql: string): {
    bind(...values: (string | number | null)[]): {
      run(): Promise<{ success: boolean; meta?: { changes?: number } }>;
      all?(): Promise<{
        success: boolean;
        results?: Record<string, unknown>[];
      }>;
    };
  };
}

export interface EnquiryEnv {
  DB?: EnquiryDatabase;
}

interface Enquiry {
  name: string;
  email: string;
  company: string;
  requestType: "sample" | "enquiry";
  message: string;
}

const MAX_BODY_BYTES = 16 * 1024;
const MAX_REQUESTS_PER_EMAIL = 5;
const MAX_REQUESTS_TOTAL = 100;
const HOUR_MS = 60 * 60 * 1000;
const INVALID_CONTROLS = /[\u0000-\u001f\u007f]/;
const INVALID_MESSAGE_CONTROLS =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

const INSERT_ENQUIRY = `
  INSERT INTO enquiries (id, created_at, name, email, company, request_type, message)
  SELECT ?, ?, ?, ?, ?, ?, ?
  WHERE (SELECT COUNT(*) FROM enquiries WHERE created_at >= ?) < ?
    AND (SELECT COUNT(*) FROM enquiries WHERE email = ? AND created_at >= ?) < ?
`;

function response(
  status: number,
  body: { ok: boolean; error?: string; id?: string },
  headers?: Record<string, string>,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
      ...headers,
    },
  });
}

class InputError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new InputError(
      413,
      "Your request is too large. Please shorten the message.",
    );
  }
  if (!request.body)
    throw new InputError(400, "Please complete the required fields.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        throw new InputError(
          413,
          "Your request is too large. Please shorten the message.",
        );
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  ) as unknown;
}

function validate(input: unknown): Enquiry {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new InputError(400, "Please complete the required fields.");
  }
  const value = input as Record<string, unknown>;
  if (
    value.website !== undefined &&
    (typeof value.website !== "string" || value.website.trim() !== "")
  ) {
    throw new InputError(
      400,
      "We could not accept this request. Please email Westline instead.",
    );
  }

  const required = (key: string, maximum: number): string => {
    const field = value[key];
    if (
      typeof field !== "string" ||
      !field.trim() ||
      field.trim().length > maximum ||
      INVALID_CONTROLS.test(field)
    ) {
      throw new InputError(
        400,
        "Please check your name, email address, and company.",
      );
    }
    return field.trim();
  };

  const name = required("name", 100);
  const email = required("email", 254).toLowerCase();
  const company = required("company", 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputError(400, "Please enter a valid email address.");
  }
  if (value.requestType !== "sample" && value.requestType !== "enquiry") {
    throw new InputError(
      400,
      "Please choose a sample request or a website enquiry.",
    );
  }
  if (
    value.message !== undefined &&
    (typeof value.message !== "string" ||
      value.message.length > 2000 ||
      INVALID_MESSAGE_CONTROLS.test(value.message))
  ) {
    throw new InputError(
      400,
      "Please keep your message within 2,000 characters.",
    );
  }

  return {
    name,
    email,
    company,
    requestType: value.requestType,
    message: typeof value.message === "string" ? value.message.trim() : "",
  };
}

export async function handleEnquiryRequest(
  request: Request,
  env: EnquiryEnv,
): Promise<Response> {
  if (request.method !== "POST") {
    return response(
      405,
      { ok: false, error: "This endpoint accepts POST requests only." },
      { Allow: "POST" },
    );
  }

  const origin = request.headers.get("origin");
  if (
    (origin !== null && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return response(403, {
      ok: false,
      error: "Please submit this request from the Westline website.",
    });
  }
  if (
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() !== "application/json"
  ) {
    return response(415, {
      ok: false,
      error: "Please submit the form as JSON.",
    });
  }

  let enquiry: Enquiry;
  try {
    enquiry = validate(await readBoundedJson(request));
  } catch (error) {
    return error instanceof InputError
      ? response(error.status, { ok: false, error: error.message })
      : response(400, {
          ok: false,
          error:
            "We could not read your request. Please check the form and try again.",
        });
  }

  const unavailable = () =>
    response(503, {
      ok: false,
      error: "We could not save your request. Please email Westline instead.",
    });
  if (!env.DB) return unavailable();

  const now = new Date();
  const id = crypto.randomUUID();
  const since = new Date(now.getTime() - HOUR_MS).toISOString();
  try {
    // One SQL statement checks both limits and inserts atomically. User text is bound, never SQL.
    const result = await env.DB.prepare(INSERT_ENQUIRY)
      .bind(
        id,
        now.toISOString(),
        enquiry.name,
        enquiry.email,
        enquiry.company,
        enquiry.requestType,
        enquiry.message,
        since,
        MAX_REQUESTS_TOTAL,
        enquiry.email,
        since,
        MAX_REQUESTS_PER_EMAIL,
      )
      .run();

    if (!result.success) return unavailable();
    if (result.meta?.changes === 0) {
      return response(
        429,
        {
          ok: false,
          error: "Too many requests. Please try again later or email Westline.",
        },
        { "Retry-After": "3600" },
      );
    }
    if (result.meta?.changes !== 1) return unavailable();
    return response(201, { ok: true, id });
  } catch {
    // Do not log submitted information, SQL values, or database error details.
    return unavailable();
  }
}

export const onRequest = ({
  request,
  env,
}: {
  request: Request;
  env: EnquiryEnv;
}): Promise<Response> => handleEnquiryRequest(request, env);
