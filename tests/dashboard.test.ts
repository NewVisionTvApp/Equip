import { test } from "node:test";
import assert from "node:assert/strict";
import { getDashboardMetrics } from "../src/lib/dashboard-metrics.ts";
import { createDefaultSessions, createEmptyPlatformState, getAttendeesForEvent, registerParticipantForEvent } from "../src/lib/store.ts";

test("Dashboard counts reflect registrations and saved session check-ins", () => {
  const sessions = createDefaultSessions();
  const empty = createEmptyPlatformState();
  const eventId = empty.activeEventId;
  const before = getDashboardMetrics(getAttendeesForEvent(empty, eventId), sessions, "mon_am");
  assert.equal(before.totalRegistrations, 0);
  assert.equal(before.ordainedCount, 0);
  assert.equal(before.membersCount, 0);
  assert.equal(before.checkedInCount, 0);
  assert.equal(before.delegations.length, 0);
  assert.ok(before.sessionTurnoutStats.every(session => session.count === 0));

  const first = registerParticipantForEvent(empty, {
    eventId, fullName: "Synthetic Pastor", phone: "+2348000000001", email: "pastor@example.invalid",
    churchName: "Synthetic Church", roleOffice: "Pastor", isOrdained: true, location: "Lagos",
  });
  const second = registerParticipantForEvent(first.state, {
    eventId, fullName: "Synthetic Member", phone: "+2348000000002", email: "member@example.invalid",
    churchName: "synthetic church", roleOffice: "Member", isOrdained: false, location: "Lagos",
  });
  second.state.attendance[`${first.participant.id}_${eventId}_mon_am`] = { attended: true, timestamp: new Date().toISOString() };
  second.state.attendance[`${second.participant.id}_${eventId}_tue_am`] = { attended: true, timestamp: new Date().toISOString() };
  const attendees = getAttendeesForEvent(second.state, eventId);
  const monday = getDashboardMetrics(attendees, sessions, "mon_am");
  assert.equal(monday.totalRegistrations, 2);
  assert.equal(monday.ordainedCount, 1);
  assert.equal(monday.membersCount, 1);
  assert.equal(monday.checkedInCount, 1);
  assert.equal(monday.checkedInMinisters, 1);
  assert.equal(monday.checkedInDelegates, 0);
  assert.deepEqual(monday.delegations, [{ name: "Synthetic Church", count: 2 }]);
  assert.deepEqual(monday.sessionTurnoutStats.map(session => session.count), [1, 0, 1, 0, 0]);

  const tuesday = getDashboardMetrics(attendees, sessions, "tue_am");
  assert.equal(tuesday.checkedInMinisters, 0);
  assert.equal(tuesday.checkedInDelegates, 1);
});
