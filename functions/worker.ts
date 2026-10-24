import { handleEnquiryRequest, type EnquiryEnv } from "./api/enquiries.ts";
import { handleAdminRequest } from "./admin.ts";
import type { AccessEnv } from "./access.ts";

interface WorkerEnv extends EnquiryEnv, AccessEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/** Advanced-mode entry for a precompiled _worker.js, including dashboard Direct Upload. */
export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/admin" || path.startsWith("/admin/")) {
      return handleAdminRequest(request, env);
    }
    if (path === "/api/enquiries" || path === "/api/enquiries/") {
      return handleEnquiryRequest(request, env);
    }
    if (path.startsWith("/api/")) {
      return Response.json(
        { ok: false, error: "Not found." },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }
    return env.ASSETS.fetch(request);
  },
};
