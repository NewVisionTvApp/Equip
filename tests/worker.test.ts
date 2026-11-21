import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.ts";

function makeEnv() {
  const assetRequests: string[] = [];
  return {
    assetRequests,
    ASSETS: {
      async fetch(request: Request) {
        assetRequests.push(new URL(request.url).pathname);
        return new Response("app shell");
      },
    },
  };
}

test("Worker forwards frontend routes and static files to the assets binding", async () => {
  const env = makeEnv();
  for (const path of ["/", "/register", "/attendance", "/directory", "/assets/app.js"]) {
    const response = await worker.fetch(new Request(`https://equip.example${path}`), env);
    assert.equal(await response.text(), "app shell");
  }
  assert.deepEqual(env.assetRequests, ["/", "/register", "/attendance", "/directory", "/assets/app.js"]);
});

test("Worker never serves the SPA for API requests", async () => {
  const env = makeEnv();
  for (const path of ["/api", "/api/missing", "/api/authentication", "/api/sync-other"]) {
    const response = await worker.fetch(new Request(`https://equip.example${path}`), env);
    assert.equal(response.status, 404);
  }
  assert.deepEqual(env.assetRequests, []);
});

test("Sync requests fail clearly without D1 instead of acknowledging unsaved attendance", async () => {
  const env = makeEnv();
  for (const method of ["GET", "POST"]) {
    const response = await worker.fetch(new Request("https://equip.example/api/sync", { method }), env);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /database/);
  }
  const preflight = await worker.fetch(new Request("https://equip.example/api/sync", { method: "OPTIONS" }), env);
  assert.equal(preflight.status, 204);
  const unsupported = await worker.fetch(new Request("https://equip.example/api/sync", { method: "DELETE" }), env);
  assert.equal(unsupported.status, 405);
  assert.deepEqual(env.assetRequests, []);
});

test("Authentication requires both D1 and a production secret", async () => {
  const env = makeEnv();
  for (const path of ["/api/auth", "/api/auth/get-session", "/api/auth/sign-in/email"]) {
    const response = await worker.fetch(new Request(`https://equip.example${path}`), env);
    assert.equal(response.status, 503);
  }
  assert.deepEqual(env.assetRequests, []);
});

test("Sync API persists a synthetic snapshot through D1 and returns it on GET", async () => {
  let savedState: string | undefined;
  const env = {
    ...makeEnv(),
    DB: {
      prepare(sql: string) {
        let values: unknown[] = [];
        return {
          bind(...args: unknown[]) { values = args; return this; },
          async run() {
            if (sql.startsWith("INSERT")) savedState = values[0] as string;
            return { success: true };
          },
          async first() { return savedState ? { state_json: savedState } : null; },
        };
      },
    },
  };
  const snapshot = JSON.stringify({ participants: [{ id: "EQ-23456", fullName: "Synthetic Attendee" }] });
  const saved = await worker.fetch(new Request("https://equip.example/api/sync", {
    method: "POST", body: snapshot,
  }), env);
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).ok, true);
  const restored = await worker.fetch(new Request("https://equip.example/api/sync/"), env);
  assert.equal(await restored.text(), snapshot);
  assert.deepEqual(env.assetRequests, []);
});
