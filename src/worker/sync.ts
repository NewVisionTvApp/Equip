import { readState, requireStaff, type Viewer } from "./platform.ts";

export async function handleSyncRequest(request: Request, db: D1Database, viewer: Viewer | null): Promise<Response> {
  requireStaff(viewer);
  if (request.method !== "GET") return Response.json({ error: "Use the permitted action endpoint to change records." }, { status: 405, headers: { Allow: "GET" } });
  return Response.json(await readState(db));
}
