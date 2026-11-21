import { z } from "zod";
import { createAuth } from "./lib/auth.ts";
import { actionSchema, claimSchema, profileInputSchema, registrationInputSchema, returningSchema, roleSchema } from "./lib/platform-schema.ts";
import { updateParticipantRecord } from "./lib/store.ts";
import { handleSyncRequest } from "./worker/sync.ts";
import { HttpError, readState, mutateState, requireAdmin, publicProgramme, findClaimedParticipant, linkParticipant, registerPublic, renewPublic, applyAction, ownRecords, readJson, type Viewer } from "./worker/platform.ts";

export type AppEnv = Env & { BETTER_AUTH_SECRET?: string };

async function viewerFor(request: Request, env: AppEnv): Promise<Viewer | null> {
  if (!env.BETTER_AUTH_SECRET || !request.headers.get("cookie")) return null;
  const session = await createAuth(env.DB, env.BETTER_AUTH_SECRET, env.BETTER_AUTH_URL).api.getSession({
    headers: request.headers, query: { disableCookieCache: true },
  });
  if (!session) return null;
  const role = roleSchema.safeParse(session.user.role);
  return { id: session.user.id, role: role.success ? role.data : "attendee" };
}

async function rateLimit(request: Request, db: D1Database, limit: number) {
  const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode((request.headers.get("CF-Connecting-IP") || "local") + new URL(request.url).pathname));
  const key = Array.from(new Uint8Array(keyBytes), b => b.toString(16).padStart(2, "0")).join("");
  const now = Date.now();
  const row = await db.prepare(`INSERT INTO request_limits (key,count,expires_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END,
    expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING count`)
    .bind(key, now + 60000, now, now).first<{ count: number }>();
  if (row && row.count > limit) throw new HttpError(429, "Too many attempts. Please wait a minute and try again.");
}

async function api(request: Request, env: AppEnv): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/\/$/, "");
  if (path === "/api/auth" || path.startsWith("/api/auth/")) {
    if (!env.DB || !env.BETTER_AUTH_SECRET) throw new HttpError(503, "Authentication is not configured.");
    return createAuth(env.DB, env.BETTER_AUTH_SECRET, env.BETTER_AUTH_URL).handler(request);
  }
  const known = ["/api/sync", "/api/platform/actions", "/api/public/programme", "/api/public/register", "/api/public/lookup", "/api/public/return", "/api/me", "/api/me/link", "/api/admin/users"];
  if (!known.includes(path)) throw new HttpError(404, "Not found.");
  if (!env.DB) throw new HttpError(503, "The database is not configured.");
  if (!["GET", "HEAD"].includes(request.method) && request.headers.get("origin") !== new URL(request.url).origin) throw new HttpError(403, "Requests must come from this website.");
  const viewer = await viewerFor(request, env);
  if (path === "/api/sync") return handleSyncRequest(request, env.DB, viewer);
  if (path === "/api/public/programme" && request.method === "GET") return Response.json(publicProgramme((await readState(env.DB)).state));
  if (path === "/api/platform/actions" && request.method === "POST") {
    const changed = await applyAction(env.DB, viewer, actionSchema.parse(await readJson(request)));
    return Response.json({ state: changed.state, revision: changed.revision });
  }
  if (path.startsWith("/api/public/") && request.method === "POST") {
    await rateLimit(request, env.DB, path === "/api/public/lookup" ? 10 : 60);
    const body = await readJson(request);
    if (path === "/api/public/lookup") {
      const claim = claimSchema.parse(body);
      return Response.json({ participant: findClaimedParticipant((await readState(env.DB)).state, claim.id, claim.phone) });
    }
    if (path === "/api/public/register") return Response.json({ participant: (await registerPublic(env.DB, registrationInputSchema.parse(body), viewer)).result });
    if (path === "/api/public/return") return Response.json({ participant: (await renewPublic(env.DB, returningSchema.parse(body), viewer)).result });
  }
  if (path === "/api/me" || path === "/api/me/link") {
    if (!viewer) throw new HttpError(401, "Sign in to view your profile.");
    if (path === "/api/me" && request.method === "GET") return Response.json(ownRecords((await readState(env.DB)).state, viewer));
    if (path === "/api/me/link" && request.method === "POST") {
      const claim = claimSchema.parse(await readJson(request));
      const changed = await mutateState(env.DB, state => {
        linkParticipant(state, findClaimedParticipant(state, claim.id, claim.phone), viewer);
        return { state, result: ownRecords(state, viewer) };
      });
      return Response.json(changed.result);
    }
    if (path === "/api/me" && request.method === "PATCH") {
      const data = profileInputSchema.partial().parse(await readJson(request));
      const changed = await mutateState(env.DB, state => {
        const participant = ownRecords(state, viewer).participant;
        if (!participant) throw new HttpError(404, "Link your Participant ID first.");
        if (data.phone && Object.values(state.participants).some(p => p.id !== participant.id && p.phone.replace(/\D/g, "") === data.phone!.replace(/\D/g, ""))) throw new HttpError(409, "This phone number belongs to another profile.");
        const updated = updateParticipantRecord(state, participant.id, data).state;
        return { state: updated, result: ownRecords(updated, viewer) };
      });
      return Response.json(changed.result);
    }
  }
  if (path === "/api/admin/users") {
    const admin = requireAdmin(viewer);
    if (request.method === "GET") {
      const users = await env.DB.prepare("SELECT id,name,email,role FROM user ORDER BY name LIMIT 500").all();
      return Response.json({ users: users.results });
    }
    if (request.method === "POST") {
      const data = z.object({ userId: z.string().min(1).max(200), role: roleSchema }).parse(await readJson(request));
      if (data.userId === admin.id && data.role !== "admin") throw new HttpError(400, "Keep your own administrator access. Ask another administrator to change it.");
      const user = await env.DB.prepare("SELECT id FROM user WHERE id=?").bind(data.userId).first();
      if (!user) throw new HttpError(404, "Account not found.");
      await env.DB.batch([
        env.DB.prepare("UPDATE user SET role=? WHERE id=?").bind(data.role, data.userId),
        env.DB.prepare("DELETE FROM session WHERE user_id=?").bind(data.userId),
      ]);
      return Response.json({ ok: true });
    }
  }
  throw new HttpError(405, "This request method is not allowed.");
}

export default {
  async fetch(request: Request, env: AppEnv): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith("/api/") && new URL(request.url).pathname !== "/api") return env.ASSETS.fetch(request);
    let response: Response;
    try { response = await api(request, env); }
    catch (error) {
      if (error instanceof HttpError) response = Response.json({ error: error.message }, { status: error.status });
      else if (error instanceof z.ZodError) response = Response.json({ error: error.issues[0]?.message || "Check the submitted fields." }, { status: 400 });
      else { console.error(JSON.stringify({ event: "api_request_failed", path: new URL(request.url).pathname })); response = Response.json({ error: "The request could not be completed. Please try again." }, { status: 500 }); }
    }
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<AppEnv>;
