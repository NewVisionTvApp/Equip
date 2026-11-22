import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { createAuth } from "../src/lib/auth.ts";
import { testDatabase } from "./helpers/database.ts";

test("Migrated SQLite schema supports sign-up, password login, and session lookup through the D1 adapter", async () => {
  const { database, close } = testDatabase();
  try {
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
    close();
  }
});

test("Password reset sends a link and revokes the old password", async () => {
  const { database, close } = testDatabase();
  const originalFetch = globalThis.fetch;
  let resetLink = "";
  try {
    const origin = "https://equip.example";
    globalThis.fetch = async (input, options) => {
      assert.equal(input, "https://api.resend.com/emails");
      const message = JSON.parse(String(options?.body));
      assert.deepEqual(message.to, ["recovery@example.invalid"]);
      resetLink = message.text.match(/https:\/\/\S+/)?.[0] || "";
      return Response.json({ id: "synthetic-email" });
    };
    const auth = createAuth(database, randomBytes(48).toString("hex"), origin, { apiKey: "synthetic-key", from: "Equip <noreply@example.invalid>" });
    const post = (path: string, body: object) => auth.handler(new Request(`${origin}/api/auth/${path}`, {
      method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body),
    }));
    const email = "recovery@example.invalid";
    const password = randomBytes(24).toString("hex");
    assert.equal((await post("sign-up/email", { name: "Synthetic Recovery", email, password })).status, 200);
    const requested = await post("request-password-reset", { email, redirectTo: `${origin}/reset-password` });
    assert.equal(requested.status, 200, await requested.clone().text());
    assert.ok(resetLink.startsWith(`${origin}/api/auth/reset-password/`));
    const redirect = await auth.handler(new Request(resetLink));
    assert.equal(redirect.status, 302);
    const token = new URL(redirect.headers.get("location")!).searchParams.get("token");
    assert.ok(token);
    const newPassword = randomBytes(24).toString("hex");
    assert.equal((await post("reset-password", { token, newPassword })).status, 200);
    assert.equal((await post("sign-in/email", { email, password })).status, 401);
    assert.equal((await post("sign-in/email", { email, password: newPassword })).status, 200);
  } finally {
    globalThis.fetch = originalFetch;
    close();
  }
});

test("Two-factor enrollment requires a code and challenges the next sign-in", async () => {
  const { database, close } = testDatabase();
  try {
    const origin = "https://equip.example";
    const auth = createAuth(database, randomBytes(48).toString("hex"), origin);
    const email = "two-factor@example.invalid";
    const password = randomBytes(24).toString("hex");
    let cookie = "";
    const post = (path: string, body: object, withCookie = false) => auth.handler(new Request(`${origin}/api/auth/${path}`, {
      method: "POST", headers: { "content-type": "application/json", origin, ...(withCookie ? { cookie } : {}) }, body: JSON.stringify(body),
    }));
    const signup = await post("sign-up/email", { name: "Synthetic Staff", email, password });
    assert.equal(signup.status, 200, await signup.clone().text());
    cookie = signup.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    const enabled = await post("two-factor/enable", { password, method: "totp" }, true);
    assert.equal(enabled.status, 200, await enabled.clone().text());
    const setup = await enabled.json();
    assert.equal(setup.method, "totp");
    assert.ok(setup.backupCodes.length > 0);
    const secret = new URL(setup.totpURI).searchParams.get("secret")!;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    for (const character of secret.toUpperCase()) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
    const key = Buffer.from(bits.match(/.{8}/g)!.map(byte => parseInt(byte, 2)));
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const digest = createHmac("sha1", key).update(counter).digest();
    const offset = digest[digest.length - 1] & 15;
    const code = ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
    const verified = await post("two-factor/verify-totp", { code }, true);
    assert.equal(verified.status, 200, await verified.clone().text());
    const login = await post("sign-in/email", { email, password });
    assert.equal(login.status, 200, await login.clone().text());
    assert.equal((await login.json()).twoFactorRedirect, true);
    cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    const challengedSession = await auth.handler(new Request(`${origin}/api/auth/get-session`, { headers: { cookie } }));
    assert.equal(await challengedSession.text(), "null");
    const secondFactor = await post("two-factor/verify-backup-code", { code: setup.backupCodes[0] }, true);
    assert.equal(secondFactor.status, 200, await secondFactor.clone().text());
    cookie = secondFactor.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    const session = await auth.handler(new Request(`${origin}/api/auth/get-session`, { headers: { cookie } }));
    assert.equal((await session.json()).user.email, email);
  } finally { close(); }
});
