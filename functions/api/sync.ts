interface Env {
  DB?: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

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

  // If Cloudflare D1 is bound in production
  if (env.DB) {
    try {
      // Ensure sync state table exists
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS platform_sync_state (
          id TEXT PRIMARY KEY,
          state_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )`
      ).run();

      if (request.method === "GET") {
        const result = await env.DB.prepare(
          `SELECT state_json FROM platform_sync_state WHERE id = 'latest'`
        ).first<{ state_json: string }>();

        if (result?.state_json) {
          return new Response(result.state_json, { headers: corsHeaders });
        }
        return new Response(JSON.stringify({}), { headers: corsHeaders });
      }

      if (request.method === "POST") {
        const bodyText = await request.text();
        if (bodyText) {
          await env.DB.prepare(
            `INSERT INTO platform_sync_state (id, state_json, updated_at)
             VALUES ('latest', ?, ?)
             ON CONFLICT(id) DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at`
          ).bind(bodyText, Date.now()).run();
        }
        return new Response(JSON.stringify({ ok: true, timestamp: Date.now() }), { headers: corsHeaders });
      }
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // Graceful fallback if DB binding is not yet attached
  if (request.method === "GET") {
    return new Response(JSON.stringify({}), { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true, note: "standalone" }), { headers: corsHeaders });
};
