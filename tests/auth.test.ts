import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createAuth } from "../src/lib/auth.ts";

test("Migrated SQLite schema supports sign-up, password login, and session lookup through the D1 adapter", async () => {
  const sqlite = new DatabaseSync(":memory:");
  try {
    for (const file of readdirSync("drizzle/migrations").filter(file => file.endsWith(".sql")).sort()) {
      sqlite.exec(readFileSync(`drizzle/migrations/${file}`, "utf8"));
    }
    const database = {
      prepare(sql: string) {
        const statement = sqlite.prepare(sql);
        let params: unknown[] = [];
        return {
          bind(...values: unknown[]) { params = values; return this; },
          async run() { statement.run(...params); return { success: true }; },
          async all() { return { success: true, results: statement.all(...params) }; },
          async raw() { statement.setReturnArrays(true); return statement.all(...params); },
        };
      },
    };
    const origin = "https://equip.example";
    const auth = createAuth(database, randomBytes(48).toString("hex"), origin);
    const email = "auth-test@example.invalid";
    const password = randomBytes(24).toString("hex");
    const post = (path: string, body: object) => auth.handler(new Request(`${origin}/api/auth/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(body),
    }));

    const signup = await post("sign-up/email", { name: "Synthetic Auth Test", email, password, role: "admin" });
    assert.equal(signup.status, 200, await signup.clone().text());
    assert.equal((await signup.json()).user.role, "attendee");
    const rejected = await post("sign-in/email", { email, password: "incorrect-synthetic-password" });
    assert.equal(rejected.status, 401);
    const login = await post("sign-in/email", { email, password });
    assert.equal(login.status, 200, await login.clone().text());
    const cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    assert.ok(cookie);
    const session = await auth.handler(new Request(`${origin}/api/auth/get-session`, { headers: { cookie } }));
    assert.equal(session.status, 200);
    assert.equal((await session.json()).user.email, email);
  } finally {
    sqlite.close();
  }
});
