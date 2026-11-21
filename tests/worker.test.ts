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
  assert.equal(preflight.status, 503);
  const unsupported = await worker.fetch(new Request("https://equip.example/api/sync", { method: "DELETE" }), env);
  assert.equal(unsupported.status, 503);
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
