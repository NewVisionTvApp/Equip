import { createAuth } from "./lib/auth.ts";
import { handleSyncRequest } from "./worker/sync.ts";

// These remain optional until the existing Worker has its database and secret configured.
export type AppEnv = Env & {
  DB?: D1Database;
  BETTER_AUTH_SECRET?: string;
};

export default {
  async fetch(request: Request, env: AppEnv): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/sync" || pathname === "/api/sync/") {
      return handleSyncRequest(request, env.DB);
    }

    if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
      if (!env.DB || !env.BETTER_AUTH_SECRET) {
        return Response.json({ error: "Authentication is not configured" }, { status: 503 });
      }
      return createAuth(env.DB, env.BETTER_AUTH_SECRET).handler(request);
    }

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<AppEnv>;
