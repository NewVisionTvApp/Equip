import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import worker from "../src/worker.ts";
import { testDatabase } from "./helpers/database.ts";

const origin = "https://equip.app-f19.workers.dev";
function fixture(extraEnv: Record<string, string> = {}) {
  const db = testDatabase();
  const env = { DB: db.database, BETTER_AUTH_SECRET: randomBytes(48).toString("hex"), BETTER_AUTH_URL: origin, ASSETS: { fetch: async () => new Response("app shell") }, ...extraEnv };
  const request = (path: string, method = "GET", body?: unknown, cookie?: string, requestOrigin = origin) => worker.fetch(new Request(origin + path, {
    method, headers: { origin: requestOrigin, ...(body === undefined ? {} : { "content-type": "application/json" }), ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env);
  const signup = async (email: string, role = "attendee") => {
    const password = randomBytes(24).toString("hex");
    const response = await request("/api/auth/sign-up/email", "POST", { name: "Synthetic Account", email, password, role: "admin" });
    assert.equal(response.status, 200, await response.clone().text());
    const user = (await response.json()).user;
    assert.equal(user.role, "attendee");
    if (role !== "attendee") db.sqlite.prepare("UPDATE user SET role=? WHERE id=?").run(role, user.id);
    return { id: user.id, password, cookie: response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ") };
  };
  return { ...db, request, signup };
}
const profile = (phone = "+2348000000001") => ({ fullName: "Synthetic Member", phone, email: "member@example.invalid", churchName: "Synthetic Church", roleOffice: "Member", isOrdained: false, location: "Lagos" });
async function eventId(f: ReturnType<typeof fixture>) {
  const programme = await (await f.request("/api/public/programme")).json();
  return programme.activeEventId;
}

test("Public registration uses server IDs, preserves Member status, and cannot expose the shared roster", async () => {
  const f = fixture();
  try {
    assert.equal((await f.request("/api/sync")).status, 401);
    assert.equal((await f.request("/api/sync", "POST", {})).status, 401);
    const programme = await (await f.request("/api/public/programme")).json();
    assert.equal(programme.participants, undefined);
    assert.equal(programme.attendance, undefined);
    const input = { ...profile(), eventId: programme.activeEventId };
    const saved = await f.request("/api/public/register", "POST", input);
    assert.equal(saved.status, 200, await saved.clone().text());
    const participant = (await saved.json()).participant;
    assert.match(participant.id, /^EQ-/);
    assert.equal(participant.roleOffice, "Member");
    assert.equal(participant.isOrdained, false);
    assert.equal((await f.request("/api/public/register", "POST", input)).status, 409);
    assert.equal((await f.request("/api/public/lookup", "POST", { id: participant.id })).status, 400);
    assert.equal((await f.request("/api/public/lookup", "POST", { id: participant.id, phone: "+2348999999999" })).status, 404);
    const renewed = await f.request("/api/public/return", "POST", { id: participant.id, phone: input.phone, eventId: input.eventId });
    assert.equal(renewed.status, 200);
    assert.equal((await renewed.json()).participant.id, participant.id);
    const row = f.sqlite.prepare("SELECT state_json FROM platform_sync_state WHERE id='latest'").get();
    assert.equal(JSON.parse(row.state_json).registrations.length, 1);
  } finally { f.close(); }
});

test("Attendees can only read and edit their linked participant profile", async () => {
  const f = fixture();
  try {
    const user = await f.signup("attendee@example.invalid");
    const event = await eventId(f);
    const saved = await f.request("/api/public/register", "POST", { ...profile(), eventId: event }, user.cookie);
    assert.equal(saved.status, 200);
    const participant = (await saved.json()).participant;
    await f.request("/api/public/register", "POST", { ...profile("+2348000000002"), fullName: "Other Synthetic Attendee", eventId: event });
    const own = await (await f.request("/api/me", "GET", undefined, user.cookie)).json();
    assert.equal(own.participant.id, participant.id);
    assert.equal(own.registrations.length, 1);
    assert.equal(own.participants, undefined);
    assert.equal((await f.request("/api/sync", "GET", undefined, user.cookie)).status, 403);
    assert.equal((await f.request("/api/admin/users", "GET", undefined, user.cookie)).status, 403);
    const edited = await f.request("/api/me", "PATCH", { fullName: "Updated Synthetic Name", userId: "someone-else", role: "admin" }, user.cookie);
    assert.equal(edited.status, 200);
    assert.equal((await edited.json()).participant.fullName, "Updated Synthetic Name");
    assert.equal(f.sqlite.prepare("SELECT role FROM user WHERE id=?").get(user.id).role, "attendee");
  } finally { f.close(); }
});

test("Registration creates a pass, while an optional attendee account links to it later", async () => {
  const f = fixture();
  try {
    const event = await eventId(f);
    const admin = await f.signup("desk-admin@example.invalid", "admin");
    const first = await f.request("/api/public/register", "POST", { ...profile(), eventId: event }, admin.cookie);
    const second = await f.request("/api/public/register", "POST", { ...profile("+2348000000002"), fullName: "Second Synthetic Member", eventId: event }, admin.cookie);
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    const participant = (await first.json()).participant;
    assert.match(participant.id, /^EQ-/);
    assert.equal(participant.userId, undefined);
    const secondParticipant = (await second.json()).participant;
    assert.equal(secondParticipant.userId, undefined);
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS count FROM user").get().count, 1);
    assert.equal((await (await f.request("/api/me", "GET", undefined, admin.cookie)).json()).participant, null);

    const attendee = await f.signup("new-attendee@example.invalid");
    assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS count FROM user").get().count, 2);
    assert.equal((await (await f.request("/api/me", "GET", undefined, attendee.cookie)).json()).participant, null);
    const linked = await f.request("/api/me/link", "POST", { id: participant.id, phone: "+2348000000001" }, attendee.cookie);
    assert.equal(linked.status, 200, await linked.clone().text());
    const records = await linked.json();
    assert.equal(records.participant.id, participant.id);
    assert.equal(records.registrations.length, 1);
    assert.equal((await f.request("/api/sync", "GET", undefined, attendee.cookie)).status, 403);
    const staffPass = await f.request("/api/me/link", "POST", { id: secondParticipant.id, phone: "+2348000000002" }, admin.cookie);
    assert.equal(staffPass.status, 200, await staffPass.clone().text());
    assert.equal((await staffPass.json()).participant.id, secondParticipant.id);
  } finally { f.close(); }
});

test("Ushers can register walk-ins and set attendance but cannot change events, profiles, or access", async () => {
  const f = fixture();
  try {
    const user = await f.signup("usher@example.invalid", "usher");
    const event = await eventId(f);
    const saved = await f.request("/api/platform/actions", "POST", { type: "participant.register", data: { ...profile(), eventId: event } }, user.cookie);
    assert.equal(saved.status, 200, await saved.clone().text());
    const state = (await saved.json()).state;
    const id = Object.keys(state.participants)[0];
    const action = { type: "attendance.set", participantId: id, eventId: event, sessionKey: "mon_am", attended: true };
    for (let i = 0; i < 2; i++) {
      const result = await f.request("/api/platform/actions", "POST", action, user.cookie);
      assert.equal(result.status, 200);
      assert.equal((await result.json()).state.attendance[`${id}_${event}_mon_am`].attended, true);
    }
    const attendanceAudit = f.sqlite.prepare("SELECT actor_user_id,old_value,new_value FROM audit_log WHERE action='attendance.set'").all();
    assert.equal(attendanceAudit.length, 1);
    assert.deepEqual({ ...attendanceAudit[0] }, { actor_user_id: user.id, old_value: "false", new_value: "true" });
    for (const forbidden of [
      { type: "event.update", eventId: event, data: { title: "Forbidden" } },
      { type: "participant.update", participantId: id, data: { fullName: "Forbidden" } },
    ]) assert.equal((await f.request("/api/platform/actions", "POST", forbidden, user.cookie)).status, 403);
    assert.equal((await f.request("/api/admin/users", "POST", { userId: user.id, role: "admin" }, user.cookie)).status, 403);
    assert.equal((await f.request("/api/sync", "POST", state, user.cookie)).status, 405);
  } finally { f.close(); }
});

test("Admin role changes revoke sessions; cross-origin changes and self-demotion are rejected", async () => {
  const f = fixture();
  try {
    const admin = await f.signup("admin@example.invalid", "admin");
    const usher = await f.signup("staff@example.invalid", "usher");
    const event = await eventId(f);
    assert.equal((await f.request("/api/platform/actions", "POST", { type: "event.update", eventId: event, data: { title: "Updated Programme" } }, admin.cookie)).status, 200);
    assert.equal((await f.request("/api/admin/users", "GET", undefined, admin.cookie)).status, 200);
    assert.equal((await f.request("/api/admin/users", "POST", { userId: admin.id, role: "attendee" }, admin.cookie)).status, 400);
    assert.equal((await f.request("/api/admin/users", "POST", { userId: usher.id, role: "attendee" }, admin.cookie, "https://untrusted.example")).status, 403);
    assert.equal((await f.request("/api/admin/users", "POST", { userId: usher.id, role: "attendee" }, admin.cookie)).status, 200);
    const audit = await (await f.request("/api/admin/audit", "GET", undefined, admin.cookie)).json();
    assert.deepEqual(audit.entries.map((entry: { action: string; actorUserId: string; targetId: string; oldValue: string; newValue: string }) =>
      [entry.action, entry.actorUserId, entry.targetId, entry.oldValue, entry.newValue]), [["role.change", admin.id, usher.id, "usher", "attendee"]]);
    assert.equal((await f.request("/api/admin/audit", "GET", undefined, usher.cookie)).status, 401);
    assert.equal((await f.request("/api/sync", "GET", undefined, usher.cookie)).status, 401);
  } finally { f.close(); }
});

test("An administrator can promote an attendee who can then manage account access", async () => {
  const f = fixture();
  try {
    const owner = await f.signup("owner@example.invalid", "admin");
    const promoted = await f.signup("promoted@example.invalid");
    const another = await f.signup("another@example.invalid");
    assert.equal((await f.request("/api/admin/users", "POST", { userId: promoted.id, role: "admin" }, owner.cookie)).status, 200);
    assert.equal(f.sqlite.prepare("SELECT role FROM user WHERE id=?").get(promoted.id).role, "admin");
    assert.equal((await f.request("/api/admin/users", "GET", undefined, promoted.cookie)).status, 401);
    const login = await f.request("/api/auth/sign-in/email", "POST", { email: "promoted@example.invalid", password: promoted.password });
    assert.equal(login.status, 200, await login.clone().text());
    const cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    assert.equal((await f.request("/api/admin/users", "GET", undefined, cookie)).status, 200);
    assert.equal((await f.request("/api/admin/users", "POST", { userId: another.id, role: "usher" }, cookie)).status, 200);
    assert.equal(f.sqlite.prepare("SELECT role FROM user WHERE id=?").get(another.id).role, "usher");
    const audit = await (await f.request("/api/admin/audit", "GET", undefined, cookie)).json();
    assert.ok(audit.entries.some((entry: { actorUserId: string; targetId: string; oldValue: string; newValue: string }) =>
      entry.actorUserId === owner.id && entry.targetId === promoted.id && entry.oldValue === "attendee" && entry.newValue === "admin"));
  } finally { f.close(); }
});

test("Programme title edits appear in both public passes and the staff dashboard state", async () => {
  const f = fixture();
  try {
    const admin = await f.signup("editor@example.invalid", "admin");
    const eventId = "2026-11-EQUIP";
    const initial = await (await f.request("/api/public/programme")).json();
    const november = initial.events.find((event: { id: string }) => event.id === eventId);
    assert.equal(november.title, "Equip November 2026: Financing The Ministry");
    assert.equal(november.theme, "Financing The Ministry");
    const updated = await f.request("/api/platform/actions", "POST", {
      type: "event.update", eventId, data: { title: "Equip November 2026: Synthetic Updated Theme", theme: "Synthetic Updated Theme" },
    }, admin.cookie);
    assert.equal(updated.status, 200, await updated.clone().text());
    const publicEvent = (await (await f.request("/api/public/programme")).json()).events.find((event: { id: string }) => event.id === eventId);
    const staffEvent = (await (await f.request("/api/sync", "GET", undefined, admin.cookie)).json()).state.events.find((event: { id: string }) => event.id === eventId);
    assert.deepEqual({ title: publicEvent.title, theme: publicEvent.theme }, { title: staffEvent.title, theme: staffEvent.theme });
    assert.equal(publicEvent.title, "Equip November 2026: Synthetic Updated Theme");
  } finally { f.close(); }
});

test("Concurrent registrations merge without lost updates and stale imports cannot overwrite them", async () => {
  const f = fixture();
  try {
    const admin = await f.signup("restore@example.invalid", "admin");
    const original = await (await f.request("/api/sync", "GET", undefined, admin.cookie)).json();
    const event = await eventId(f);
    const results = await Promise.all([1, 2].map(i => f.request("/api/public/register", "POST", { ...profile(`+234800000000${i}`), eventId: event })));
    assert.deepEqual(results.map(r => r.status), [200, 200]);
    const state = await (await f.request("/api/sync", "GET", undefined, admin.cookie)).json();
    assert.equal(Object.keys(state.state.participants).length, 2);
    assert.equal((await f.request("/api/platform/actions", "POST", { type: "state.import", data: original.state, revision: original.revision }, admin.cookie)).status, 409);
  } finally { f.close(); }
});

test("Public profile lookup is rate limited", async () => {
  const f = fixture();
  try {
    for (let i = 0; i < 10; i++) assert.equal((await f.request("/api/public/lookup", "POST", { id: "EQ-23456", phone: "+2348000000001" })).status, 404);
    assert.equal((await f.request("/api/public/lookup", "POST", { id: "EQ-23456", phone: "+2348000000001" })).status, 429);
  } finally { f.close(); }
});

test("Public registration verifies a Turnstile token on the expected hostname and action", async () => {
  const f = fixture({ TURNSTILE_SITE_KEY: "synthetic-site-key", TURNSTILE_SECRET_KEY: "synthetic-secret" });
  const originalFetch = globalThis.fetch;
  try {
    const config = await (await f.request("/api/public/config")).json();
    assert.equal(config.turnstileSiteKey, "synthetic-site-key");
    const input = { ...profile(), eventId: await eventId(f) };
    assert.equal((await f.request("/api/public/register", "POST", input)).status, 403);
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
      const verification = JSON.parse(String(options?.body));
      assert.equal(verification.secret, "synthetic-secret");
      return Response.json({ success: true, hostname: origin.replace("https://", ""), action: verification.response === "right-token" ? "register" : "return" });
    };
    assert.equal((await f.request("/api/public/register", "POST", { ...input, turnstileToken: "wrong-action" })).status, 403);
    assert.equal((await f.request("/api/public/register", "POST", { ...input, turnstileToken: "right-token" })).status, 200);
  } finally { globalThis.fetch = originalFetch; f.close(); }
});
