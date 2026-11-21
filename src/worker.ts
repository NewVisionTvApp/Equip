import { createAuth } from "./lib/auth.ts";
import { handleSyncRequest } from "./worker/sync.ts";

// Secrets are provisioned outside the repository and checked before handling auth requests.
export type AppEnv = Env & {
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
      return createAuth(env.DB, env.BETTER_AUTH_SECRET, env.BETTER_AUTH_URL).handler(request);
    }

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<AppEnv>;
