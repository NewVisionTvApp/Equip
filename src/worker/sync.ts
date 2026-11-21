export async function handleSyncRequest(request: Request, db?: D1Database): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (request.method !== "GET" && request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, Allow: "GET, POST, OPTIONS" },
    });
  }

  if (!db) {
    return new Response(JSON.stringify({ error: "Shared attendance database is not configured" }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  try {
    // Ensure sync state table exists
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS platform_sync_state (
        id TEXT PRIMARY KEY,
        state_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`
    ).run();

    if (request.method === "GET") {
      const result = await db.prepare(
        `SELECT state_json FROM platform_sync_state WHERE id = 'latest'`
      ).first<{ state_json: string }>();

      if (result?.state_json) {
        return new Response(result.state_json, { headers: corsHeaders });
      }
      return new Response(JSON.stringify({}), { headers: corsHeaders });
    }

    const bodyText = await request.text();
    if (bodyText) {
      await db.prepare(
        `INSERT INTO platform_sync_state (id, state_json, updated_at)
         VALUES ('latest', ?, ?)
         ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`
      ).bind(bodyText, Date.now()).run();
    }
    return new Response(JSON.stringify({ ok: true, timestamp: Date.now() }), { headers: corsHeaders });
  } catch {
    console.error(JSON.stringify({ event: "attendance_sync_failed" }));
    return new Response(JSON.stringify({ error: "Unable to synchronize attendance" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
