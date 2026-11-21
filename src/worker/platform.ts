import {
  createEmptyPlatformState, registerParticipantForEvent, updateParticipantRecord,
  updateEventRecord, updateEventSessionRecord, getRegisteredChurches,
  type PlatformState, type StoredParticipant,
} from "../lib/store.ts";
import { type UserRole, type PlatformAction, type RegistrationInput } from "../lib/platform-schema.ts";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export type Viewer = { id: string; role: UserRole };
const normalizePhone = (value: string) => value.replace(/[^\d]/g, "");

export async function readState(db: D1Database): Promise<{ state: PlatformState; revision: number }> {
  const row = await db.prepare("SELECT state_json, updated_at FROM platform_sync_state WHERE id = 'latest'")
    .first<{ state_json: string; updated_at: number }>();
  return row ? { state: JSON.parse(row.state_json), revision: row.updated_at } : { state: createEmptyPlatformState(), revision: 0 };
}

async function writeState(db: D1Database, state: PlatformState, revision: number) {
  const next = Math.max(Date.now(), revision + 1);
  const result = await db.prepare(`INSERT INTO platform_sync_state (id, state_json, updated_at) VALUES ('latest', ?, ?)
    ON CONFLICT(id) DO UPDATE SET state_json=excluded.state_json, updated_at=excluded.updated_at
    WHERE platform_sync_state.updated_at = ?`).bind(JSON.stringify(state), next, revision).run();
  return result.meta.changes === 1 ? next : null;
}

export async function mutateState<T>(db: D1Database, mutate: (state: PlatformState) => { state: PlatformState; result: T }, expectedRevision?: number) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readState(db);
    if (expectedRevision !== undefined && current.revision !== expectedRevision) throw new HttpError(409, "The records changed. Refresh before importing a backup.");
    const changed = mutate(current.state);
    const revision = await writeState(db, changed.state, current.revision);
    if (revision !== null) return { ...changed, revision };
  }
  throw new HttpError(409, "Another desk updated these records. Please try again.");
}

export function requireStaff(viewer: Viewer | null) {
  if (!viewer) throw new HttpError(401, "Sign in to continue.");
  if (viewer.role !== "admin" && viewer.role !== "usher") throw new HttpError(403, "This page is for administrators and ushers.");
  return viewer;
}
export function requireAdmin(viewer: Viewer | null) {
  requireStaff(viewer);
  if (viewer!.role !== "admin") throw new HttpError(403, "Administrator access is required.");
  return viewer!;
}

export function publicProgramme(state: PlatformState) {
  const events = state.events.filter(event => event.status !== "draft");
  return { events, activeEventId: events.some(event => event.id === state.activeEventId) ? state.activeEventId : events[0]?.id, churches: getRegisteredChurches(state) };
}

function requireEvent(state: PlatformState, eventId: string, publicOnly = false) {
  const event = state.events.find(event => event.id === eventId);
  if (!event || (publicOnly && !["active", "open"].includes(event.status))) throw new HttpError(400, "Registration is not open for this programme.");
  return event;
}
export function findClaimedParticipant(state: PlatformState, id: string, phone: string) {
  const participant = state.participants[id];
  if (!participant || normalizePhone(participant.phone) !== normalizePhone(phone)) throw new HttpError(404, "The Participant ID and phone number do not match.");
  return participant;
}
function requireUniquePhone(state: PlatformState, phone: string, exceptId?: string) {
  if (Object.values(state.participants).some(p => p.id !== exceptId && normalizePhone(p.phone) === normalizePhone(phone))) {
    throw new HttpError(409, "This phone number already has a profile. Use Returning Attendee with your Participant ID and phone number.");
  }
}
export function linkParticipant(state: PlatformState, participant: StoredParticipant, viewer: Viewer | null) {
  if (!viewer || viewer.role !== "attendee") return;
  if (participant.userId && participant.userId !== viewer.id) throw new HttpError(409, "This profile is already linked to another account.");
  if (Object.values(state.participants).some(p => p.userId === viewer.id && p.id !== participant.id)) throw new HttpError(409, "Your account is already linked to a different profile.");
  participant.userId = viewer.id;
  state.participants[participant.id] = participant;
}

export async function registerPublic(db: D1Database, data: RegistrationInput, viewer: Viewer | null) {
  return mutateState(db, state => {
    requireEvent(state, data.eventId, true);
    requireUniquePhone(state, data.phone);
    const registered = registerParticipantForEvent(state, data);
    linkParticipant(registered.state, registered.participant, viewer);
    return { state: registered.state, result: registered.participant };
  });
}

export async function renewPublic(db: D1Database, data: { id: string; phone: string; eventId: string }, viewer: Viewer | null) {
  return mutateState(db, state => {
    requireEvent(state, data.eventId, true);
    const participant = findClaimedParticipant(state, data.id, data.phone);
    const registered = registerParticipantForEvent(state, { ...participant, eventId: data.eventId });
    linkParticipant(registered.state, registered.participant, viewer);
    return { state: registered.state, result: registered.participant };
  });
}

export async function applyAction(db: D1Database, viewer: Viewer | null, action: PlatformAction) {
  requireStaff(viewer);
  if (action.type !== "attendance.set" && action.type !== "participant.register") requireAdmin(viewer);
  return mutateState(db, state => {
    switch (action.type) {
      case "attendance.set": {
        const event = requireEvent(state, action.eventId);
        if (!state.participants[action.participantId] || !state.registrations.some(r => r.participantId === action.participantId && r.eventId === action.eventId)) throw new HttpError(404, "The participant is not registered for this programme.");
        if (event.sessions && !event.sessions.some(s => s.key === action.sessionKey)) throw new HttpError(400, "Invalid programme session.");
        state = { ...state, attendance: { ...state.attendance, [`${action.participantId}_${action.eventId}_${action.sessionKey}`]: { attended: action.attended, timestamp: action.attended ? new Date().toISOString() : null } } };
        break;
      }
      case "participant.register": {
        requireEvent(state, action.data.eventId);
        const existing = Object.values(state.participants).find(p => normalizePhone(p.phone) === normalizePhone(action.data.phone));
        state = registerParticipantForEvent(state, existing ? { ...existing, eventId: action.data.eventId } : action.data).state;
        break;
      }
      case "participant.update": {
        const participant = state.participants[action.participantId];
        if (!participant) throw new HttpError(404, "Participant not found.");
        if (action.data.phone) requireUniquePhone(state, action.data.phone, participant.id);
        state = updateParticipantRecord(state, participant.id, action.data).state;
        break;
      }
      case "event.create":
        if (state.events.some(e => e.id === action.data.id)) throw new HttpError(409, "This programme already exists.");
        state = { ...state, events: [...state.events, action.data] };
        break;
      case "event.update":
        requireEvent(state, action.eventId);
        state = updateEventRecord(state, action.eventId, action.data);
        break;
      case "event.select":
        requireEvent(state, action.eventId);
        state = { ...state, activeEventId: action.eventId };
        break;
      case "session.update":
        requireEvent(state, action.eventId);
        state = updateEventSessionRecord(state, action.eventId, action.sessionKey, action.data);
        break;
      case "state.import":
        state = action.data;
        break;
    }
    return { state, result: null };
  }, action.type === "state.import" ? action.revision : undefined);
}

export function ownRecords(state: PlatformState, viewer: Viewer) {
  const participant = Object.values(state.participants).find(p => p.userId === viewer.id) || null;
  const registrations = state.registrations.filter(r => r.participantId === participant?.id);
  const attendance = Object.fromEntries(Object.entries(state.attendance).filter(([key]) => participant && key.startsWith(participant.id + "_")));
  return { participant, registrations, attendance, ...publicProgramme(state) };
}

export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new HttpError(415, "Send JSON data.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "A request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new HttpError(413, "The submitted data is too large."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new HttpError(400, "The submitted JSON is invalid."); }
}
