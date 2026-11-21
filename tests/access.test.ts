import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import worker from "../src/worker.ts";
import { testDatabase } from "./helpers/database.ts";

const origin = "https://equip.app-f19.workers.dev";
function fixture() {
  const db = testDatabase();
  const env = { DB: db.database, BETTER_AUTH_SECRET: randomBytes(48).toString("hex"), BETTER_AUTH_URL: origin, ASSETS: { fetch: async () => new Response("app shell") } };
  const request = (path: string, method = "GET", body?: unknown, cookie?: string, requestOrigin = origin) => worker.fetch(new Request(origin + path, {
    method, headers: { origin: requestOrigin, ...(body === undefined ? {} : { "content-type": "application/json" }), ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env);
  const signup = async (email: string, role = "attendee") => {
    const response = await request("/api/auth/sign-up/email", "POST", { name: "Synthetic Account", email, password: randomBytes(24).toString("hex"), role: "admin" });
    assert.equal(response.status, 200, await response.clone().text());
    const user = (await response.json()).user;
    assert.equal(user.role, "attendee");
    if (role !== "attendee") db.sqlite.prepare("UPDATE user SET role=? WHERE id=?").run(role, user.id);
    return { id: user.id, cookie: response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ") };
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
    assert.equal((await second.json()).participant.userId, undefined);
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
    assert.equal((await f.request("/api/sync", "GET", undefined, usher.cookie)).status, 401);
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
