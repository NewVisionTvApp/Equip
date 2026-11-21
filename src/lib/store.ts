import { SEED_PARTICIPANTS } from "../db/seed-data.ts";
import { generateParticipantId } from "./id-generator.ts";

export interface SessionConfig {
  key: "mon_am" | "mon_pm" | "tue_am" | "tue_pm" | "wed_am";
  name: string; // e.g. "Keynote Impartation & Vision Casting"
  short: string; // e.g. "Mon AM"
  day: string; // e.g. "Day 1 · Morning"
  time: string; // e.g. "09:00 AM – 12:30 PM"
  speaker: string; // Preacher / Minister Name (editable by admin)
  hall: string; // Hall / Venue
  capacity?: number;
}

export interface EquipEvent {
  id: string; // e.g. "2026-12-EQUIP"
  title: string;
  theme: string;
  monthYear: string;
  startDate: string;
  endDate: string;
  status: "active" | "open" | "draft" | "completed";
  sessions?: SessionConfig[];
}

/**
 * Formats an event date range into an unambiguous, natural human string.
 * e.g. "Mon, Nov 23 – Wed, Nov 25, 2026"
 */
export function formatEventFullDateRange(startDate?: string, endDate?: string, fallbackMonthYear?: string): string {
  if (!startDate || !endDate) return fallbackMonthYear || "Monthly 3-Day Gathering";

  try {
    const sParts = startDate.split("-").map(Number);
    const eParts = endDate.split("-").map(Number);
    const start = new Date(sParts[0], sParts[1] - 1, sParts[2]);
    const end = new Date(eParts[0], eParts[1] - 1, eParts[2]);

    const sDay = start.toLocaleDateString("en-US", { weekday: "short" }); // Mon
    const sMonth = start.toLocaleDateString("en-US", { month: "short" }); // Nov
    const sDate = start.getDate(); // 23

    const eDay = end.toLocaleDateString("en-US", { weekday: "short" }); // Wed
    const eMonth = end.toLocaleDateString("en-US", { month: "short" }); // Nov
    const eDate = end.getDate(); // 25
    const year = end.getFullYear(); // 2026

    return `${sDay}, ${sMonth} ${sDate} – ${eDay}, ${eMonth} ${eDate}, ${year}`;
  } catch {
    return fallbackMonthYear || `${startDate} – ${endDate}`;
  }
}

export interface StoredParticipant {
  userId?: string;
  id: string; // "EQ-XXXXX"
  fullName: string;
  phone: string;
  email: string;
  churchName: string;
  isHostChurch: boolean;
  roleOffice: string;
  isOrdained: boolean;
  location: string;
  createdAt: string;
}

export interface StoredRegistration {
  id: string;
  participantId: string;
  eventId: string;
  registeredAt: string;
}

export interface AttendeeViewRecord extends StoredParticipant {
  registrationId: string;
  registeredAt: string;
  sessions: {
    mon_am: boolean;
    mon_pm: boolean;
    tue_am: boolean;
    tue_pm: boolean;
    wed_am: boolean;
  };
  sessionTimes: {
    mon_am: string | null;
    mon_pm: string | null;
    tue_am: string | null;
    tue_pm: string | null;
    wed_am: string | null;
  };
  attendance: {
    mon_am: boolean;
    mon_pm: boolean;
    tue_am: boolean;
    tue_pm: boolean;
    wed_am: boolean;
  };
  timestamps: {
    mon_am: string | null;
    mon_pm: string | null;
    tue_am: string | null;
    tue_pm: string | null;
    wed_am: string | null;
  };
}

const STORAGE_KEY = "equip_platform_state_v1";

export interface PlatformState {
  events: EquipEvent[];
  activeEventId: string;
  participants: Record<string, StoredParticipant>; // keyed by participant ID
  registrations: StoredRegistration[];
  attendance: Record<string, { attended: boolean; timestamp: string | null }>; // key: `${participantId}_${eventId}_${sessionKey}`
  churches?: string[];
}

export function createDefaultSessions(): SessionConfig[] {
  return [
    {
      key: "mon_am",
      name: "Day 1 Morning Session: Keynote & Vision",
      short: "Mon AM",
      day: "Day 1 · Morning",
      time: "09:00 AM – 12:30 PM",
      speaker: "Guest Minister (TBA)",
      hall: "Main Auditorium",
      capacity: 200,
    },
    {
      key: "mon_pm",
      name: "Day 1 Evening Session: Impartation Plenary",
      short: "Mon PM",
      day: "Day 1 · Evening",
      time: "05:30 PM – 08:30 PM",
      speaker: "Guest Minister (TBA)",
      hall: "Main Auditorium",
      capacity: 200,
    },
    {
      key: "tue_am",
      name: "Day 2 Morning Session: Pastoral Governance",
      short: "Tue AM",
      day: "Day 2 · Morning",
      time: "09:00 AM – 12:30 PM",
      speaker: "Guest Minister (TBA)",
      hall: "Synod Hall A",
      capacity: 200,
    },
    {
      key: "tue_pm",
      name: "Day 2 Evening Session: Signs & Leadership Mantle",
      short: "Tue PM",
      day: "Day 2 · Evening",
      time: "05:30 PM – 08:30 PM",
      speaker: "Guest Minister (TBA)",
      hall: "Main Auditorium",
      capacity: 200,
    },
    {
      key: "wed_am",
      name: "Day 3 Grand Finale: Final Commissioning",
      short: "Wed AM",
      day: "Day 3 · Morning",
      time: "09:00 AM – 01:00 PM",
      speaker: "Apostolic Council (TBA)",
      hall: "Main Auditorium",
      capacity: 200,
    },
  ];
}

function getInitialState(): PlatformState {
  const initialEvents: EquipEvent[] = [
    {
      id: "2026-11-EQUIP",
      title: "Equip November 2026: Apostolic Mantles & Spiritual Leadership",
      theme: "Apostolic Mantles & Spiritual Leadership",
      monthYear: "November 2026",
      startDate: "2026-11-23",
      endDate: "2026-11-25",
      status: "active",
      sessions: [
        {
          key: "mon_am",
          name: "Keynote Impartation & Vision Casting",
          short: "Mon AM",
          day: "Day 1 · Morning",
          time: "09:00 AM – 12:30 PM",
          speaker: "Bishop / Guest Minister",
          hall: "Main Auditorium",
          capacity: 200,
        },
        {
          key: "mon_pm",
          name: "Evening Anointing & Deliverance Plenary",
          short: "Mon PM",
          day: "Day 1 · Evening",
          time: "05:30 PM – 08:30 PM",
          speaker: "Bishop / Preacher",
          hall: "Main Auditorium",
          capacity: 200,
        },
        {
          key: "tue_am",
          name: "Pastoral Governance & Ministry Ethics",
          short: "Tue AM",
          day: "Day 2 · Morning",
          time: "09:00 AM – 12:30 PM",
          speaker: "Guest Minister",
          hall: "Synod Hall A",
          capacity: 200,
        },
        {
          key: "tue_pm",
          name: "Signs, Wonders & Leadership Mantle",
          short: "Tue PM",
          day: "Day 2 · Evening",
          time: "05:30 PM – 08:30 PM",
          speaker: "Guest Minister",
          hall: "Main Auditorium",
          capacity: 200,
        },
        {
          key: "wed_am",
          name: "Final Mantle Impartation & Commissioning",
          short: "Wed AM",
          day: "Day 3 · Morning",
          time: "09:00 AM – 01:00 PM",
          speaker: "Presiding Council",
          hall: "Main Auditorium",
          capacity: 200,
        },
      ],
    },
    {
      id: "2026-12-EQUIP",
      title: "Equip December 2026: End-of-Year Anointing & Divine Alignment",
      theme: "End-of-Year Anointing & Divine Alignment",
      monthYear: "December 2026",
      startDate: "2026-12-14",
      endDate: "2026-12-16",
      status: "open",
      sessions: createDefaultSessions(),
    },
    {
      id: "2027-01-EQUIP",
      title: "Equip January 2027: Apostolic Foundation & New Horizons",
      theme: "Apostolic Foundation & New Horizons",
      monthYear: "January 2027",
      startDate: "2027-01-11",
      endDate: "2027-01-13",
      status: "draft",
      sessions: createDefaultSessions(),
    },
  ];

  const participants: Record<string, StoredParticipant> = {};
  const registrations: StoredRegistration[] = [];
  const attendance: Record<string, { attended: boolean; timestamp: string | null }> = {};

  // Populate November registrations from SEED_PARTICIPANTS
  SEED_PARTICIPANTS.forEach((p, idx) => {
    const isOrdained =
      p.roleOffice.toLowerCase().includes("pastor") ||
      p.roleOffice.toLowerCase().includes("bishop") ||
      p.roleOffice.toLowerCase().includes("reverend") ||
      p.roleOffice.toLowerCase().includes("minister") ||
      p.roleOffice.toLowerCase().includes("apostle");

    participants[p.id] = {
      id: p.id,
      fullName: p.fullName,
      phone: p.phone,
      email: p.email,
      churchName: p.churchName,
      isHostChurch: p.isHostChurch,
      roleOffice: p.roleOffice,
      isOrdained,
      location: p.location,
      createdAt: "2026-11-10T08:00:00Z",
    };

    const regId = `reg_202611_${p.id}`;
    registrations.push({
      id: regId,
      participantId: p.id,
      eventId: "2026-11-EQUIP",
      registeredAt: "2026-11-12T09:00:00Z",
    });

    // Populate initial attendance for demo
    const sessionKeys = ["mon_am", "mon_pm", "tue_am", "tue_pm", "wed_am"];
    sessionKeys.forEach((sKey) => {
      let attended = false;
      let timestamp: string | null = null;

      if (sKey === "mon_am" && idx < 148) {
        attended = true;
        timestamp = `08:${String(30 + (idx % 28)).padStart(2, "0")} AM`;
      } else if (sKey === "mon_pm" && idx < 162) {
        attended = true;
        timestamp = `05:${String(15 + (idx % 35)).padStart(2, "0")} PM`;
      } else if (sKey === "tue_am" && idx < 154) {
        attended = true;
        timestamp = `08:${String(45 + (idx % 14)).padStart(2, "0")} AM`;
      } else if (sKey === "tue_pm" && idx < 170) {
        attended = true;
        timestamp = `05:${String(20 + (idx % 30)).padStart(2, "0")} PM`;
      } else if (sKey === "wed_am" && idx < 178) {
        attended = true;
        timestamp = `08:${String(35 + (idx % 25)).padStart(2, "0")} AM`;
      }

      attendance[`${p.id}_2026-11-EQUIP_${sKey}`] = {
        attended,
        timestamp,
      };
    });
  });

  const churches = Array.from(
    new Set([
      "Charismatic Renaissance International Church (Host)",
      ...SEED_PARTICIPANTS.map((p) => p.churchName),
    ])
  ).sort();

  return {
    events: initialEvents,
    activeEventId: "2026-11-EQUIP",
    participants,
    registrations,
    attendance,
    churches,
  };
}

/**
 * Automatically resolves the active event based on real calendar date and event dates.
 * Matches current month/year or picks the active or closest gathering.
 */
export function resolveDateAwareActiveEvent(events: EquipEvent[], preferredEventId?: string): EquipEvent {
  // If user explicitly picked an event that exists, honour it
  if (preferredEventId) {
    const found = events.find((e) => e.id === preferredEventId);
    if (found) return found;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. Try to find an event whose date range covers today
  const ongoing = events.find((e) => {
    if (!e.startDate || !e.endDate) return false;
    const s = new Date(e.startDate);
    const end = new Date(e.endDate);
    end.setHours(23, 59, 59, 999);
    return now >= s && now <= end;
  });
  if (ongoing) return ongoing;

  // 2. Try to find an event matching current calendar month & year
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  const currentMonthName = monthNames[currentMonth];
  const sameMonth = events.find((e) => {
    const matchesMonth = e.monthYear.toLowerCase().includes(currentMonthName);
    const matchesYear =
      e.monthYear.includes(String(currentYear)) ||
      (e.startDate && e.startDate.startsWith(String(currentYear)));
    return matchesMonth && matchesYear;
  });
  if (sameMonth) return sameMonth;

  // 3. Fallback to active event
  const activeStatus = events.find((e) => e.status === "active");
  if (activeStatus) return activeStatus;

  // 4. Default to first event
  return events[0];
}

// Load state from localStorage or fallback
export function loadPlatformState(): PlatformState {
  if (typeof window === "undefined") {
    return getInitialState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialState();
      savePlatformState(initial);
      return initial;
    }

    const state: PlatformState = JSON.parse(raw);

    // Date-Aware Auto-Migration:
    // If November 2026 event is missing from stored events, inject it from getInitialState()
    const hasNovember = state.events.some(
      (e) => e.id === "2026-11-EQUIP" || e.monthYear.toLowerCase().includes("november 2026")
    );

    if (!hasNovember) {
      const fresh = getInitialState();
      const novEvent = fresh.events.find((e) => e.id === "2026-11-EQUIP");
      if (novEvent) {
        state.events = [novEvent, ...state.events];
        // Populate demo attendees for November as well
        Object.assign(state.participants, fresh.participants);
        state.registrations = [...fresh.registrations, ...state.registrations];
        Object.assign(state.attendance, fresh.attendance);
      }
    }

    // If activeEventId was pointing to 2026-12-EQUIP (the old hardcoded default), switch to date-aware current month
    if (state.activeEventId === "2026-12-EQUIP") {
      const dateAware = resolveDateAwareActiveEvent(state.events);
      state.activeEventId = dateAware.id;
    } else {
      const currentActive = state.events.find((e) => e.id === state.activeEventId);
      if (!currentActive) {
        state.activeEventId = resolveDateAwareActiveEvent(state.events).id;
      }
    }

    savePlatformState(state);
    return state;
  } catch {
    const initial = getInitialState();
    savePlatformState(initial);
    return initial;
  }
}

export function createEmptyPlatformState(): PlatformState {
  const initial = getInitialState();
  return { ...initial, participants: {}, registrations: [], attendance: {}, churches: [] };
}

const SYNC_CHANNEL_NAME = "equip_platform_sync_v1";
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  } catch {
    // BroadcastChannel unsupported or blocked
  }
}

export function broadcastPlatformChange(type: string = "sync"): void {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, timestamp: Date.now() });
    } catch {
      // Ignore broadcast errors
    }
  }
}

export function subscribeToPlatformSync(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback();
    }
  };

  const handleBroadcast = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", handleBroadcast);
  }

  // Periodic LAN sync pull (checks server state every 5 seconds for multi-device usher synchronization)
  let pollTimer: any = null;
  if (typeof fetch === "function") {
    pollTimer = setInterval(async () => {
      try {
        const res = await fetch("/api/sync");
        if (res.ok) {
          const serverData = (await res.json()) as any;
          if (serverData && serverData.participants && serverData.events) {
            const currentRaw = localStorage.getItem(STORAGE_KEY);
            const serverRaw = JSON.stringify(serverData);
            if (currentRaw !== serverRaw) {
              localStorage.setItem(STORAGE_KEY, serverRaw);
              callback();
            }
          }
        }
      } catch {
        // Offline / server unreachable
      }
    }, 5000);
  }

  return () => {
    window.removeEventListener("storage", handleStorage);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", handleBroadcast);
    }
    if (pollTimer) {
      clearInterval(pollTimer);
    }
  };
}

// Audio Mute setting persistence
export function isAudioMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("equip_audio_muted") === "true";
  } catch {
    return false;
  }
}

export function setAudioMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("equip_audio_muted", String(muted));
  } catch {
    // Ignore storage errors
  }
}

// Save state to localStorage, broadcast across tabs & sync to LAN endpoint
export function savePlatformState(state: PlatformState): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, raw);
    broadcastPlatformChange("state_updated");

    // Async push to multi-device sync endpoint if reachable
    if (typeof fetch === "function") {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw,
      }).catch(() => {
        // Silently ignore if offline
      });
    }
  } catch {
    // Ignore quota issues
  }
}

// Reset platform to clean seed state
export function resetPlatformState(): PlatformState {
  const initial = getInitialState();
  savePlatformState(initial);
  return initial;
}

// Helper: Get attendees for a specific event
export function getAttendeesForEvent(
  state: PlatformState,
  eventId: string
): AttendeeViewRecord[] {
  const eventRegs = state.registrations.filter((r) => r.eventId === eventId);

  return eventRegs
    .map((reg) => {
      const p = state.participants[reg.participantId];
      if (!p) return null;

      const sessions = {
        mon_am: state.attendance[`${p.id}_${eventId}_mon_am`]?.attended ?? false,
        mon_pm: state.attendance[`${p.id}_${eventId}_mon_pm`]?.attended ?? false,
        tue_am: state.attendance[`${p.id}_${eventId}_tue_am`]?.attended ?? false,
        tue_pm: state.attendance[`${p.id}_${eventId}_tue_pm`]?.attended ?? false,
        wed_am: state.attendance[`${p.id}_${eventId}_wed_am`]?.attended ?? false,
      };

      const sessionTimes = {
        mon_am: state.attendance[`${p.id}_${eventId}_mon_am`]?.timestamp ?? null,
        mon_pm: state.attendance[`${p.id}_${eventId}_mon_pm`]?.timestamp ?? null,
        tue_am: state.attendance[`${p.id}_${eventId}_tue_am`]?.timestamp ?? null,
        tue_pm: state.attendance[`${p.id}_${eventId}_tue_pm`]?.timestamp ?? null,
        wed_am: state.attendance[`${p.id}_${eventId}_wed_am`]?.timestamp ?? null,
      };

      return {
        ...p,
        registrationId: reg.id,
        registeredAt: reg.registeredAt,
        sessions,
        sessionTimes,
        attendance: sessions,
        timestamps: sessionTimes,
      };
    })
    .filter((a): a is AttendeeViewRecord => a !== null);
}

// Helper: Register (New or Returning) Participant for an event
export function registerParticipantForEvent(
  state: PlatformState,
  input: {
    fullName: string;
    phone: string;
    email?: string;
    churchName: string;
    roleOffice: string;
    location: string;
    eventId: string;
    isOrdained?: boolean;
  }
): {
  state: PlatformState;
  participant: StoredParticipant;
  registration: StoredRegistration;
  isExistingParticipant: boolean;
  isAlreadyRegisteredForEvent: boolean;
} {
  const normalizedPhone = input.phone.trim().replace(/\s+/g, "");

  // Check if persistent participant already exists by phone
  let participant: StoredParticipant | undefined;
  for (const p of Object.values(state.participants)) {
    if (p.phone.replace(/\s+/g, "") === normalizedPhone) {
      participant = p;
      break;
    }
  }

  let isExistingParticipant = Boolean(participant);
  const isOrdained = input.isOrdained ?? (
    input.roleOffice.toLowerCase().includes("pastor") ||
    input.roleOffice.toLowerCase().includes("bishop") ||
    input.roleOffice.toLowerCase().includes("reverend") ||
    input.roleOffice.toLowerCase().includes("minister") ||
    input.roleOffice.toLowerCase().includes("apostle"));

  if (!participant) {
    const existingIds = new Set(Object.keys(state.participants));
    const newId = generateParticipantId(existingIds);

    participant = {
      id: newId,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || `${newId.toLowerCase()}@equipchurch.org`,
      churchName: input.churchName.trim(),
      isHostChurch:
        input.churchName.includes("Host") ||
        input.churchName.includes("Charismatic Renaissance"),
      roleOffice: input.roleOffice.trim(),
      isOrdained,
      location: input.location.trim() || "Yenagoa, Bayelsa State",
      createdAt: new Date().toISOString(),
    };
  } else {
    // Update contact info if supplied
    participant = {
      ...participant,
      fullName: input.fullName.trim() || participant.fullName,
      churchName: input.churchName.trim() || participant.churchName,
      roleOffice: input.roleOffice.trim() || participant.roleOffice,
      isOrdained,
      location: input.location.trim() || participant.location,
    };
  }

  // Check if already registered for this specific event
  const existingReg = state.registrations.find(
    (r) => r.participantId === participant!.id && r.eventId === input.eventId
  );

  let registration = existingReg;
  let isAlreadyRegisteredForEvent = Boolean(existingReg);

  const updatedParticipants = {
    ...state.participants,
    [participant.id]: participant,
  };

  let updatedRegistrations = [...state.registrations];

  if (!registration) {
    registration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      participantId: participant.id,
      eventId: input.eventId,
      registeredAt: new Date().toISOString(),
    };
    updatedRegistrations.push(registration);
  }

  // Ensure new church is stored in churches database
  const churchNameTrimmed = participant.churchName.trim();
  let updatedChurches = state.churches ? [...state.churches] : [];
  if (churchNameTrimmed && !updatedChurches.includes(churchNameTrimmed)) {
    updatedChurches.push(churchNameTrimmed);
    updatedChurches.sort();
  }

  const newState: PlatformState = {
    ...state,
    participants: updatedParticipants,
    registrations: updatedRegistrations,
    churches: updatedChurches,
  };

  savePlatformState(newState);

  return {
    state: newState,
    participant,
    registration,
    isExistingParticipant,
    isAlreadyRegisteredForEvent,
  };
}

// Helper: Get all registered churches
export function getRegisteredChurches(state: PlatformState): string[] {
  const fromState = state.churches || [];
  const fromParticipants = Object.values(state.participants).map((p) => p.churchName);
  return Array.from(
    new Set(["Charismatic Renaissance International Church (Host)", ...fromState, ...fromParticipants])
  )
    .filter((c) => c && c.trim().length > 0)
    .sort();
}

// Helper: Add a new church to the database
export function addRegisteredChurch(
  state: PlatformState,
  churchName: string
): PlatformState {
  const trimmed = churchName.trim();
  if (!trimmed) return state;

  const current = state.churches ? [...state.churches] : [];
  if (current.includes(trimmed)) return state;

  const updated = [...current, trimmed].sort();
  const newState: PlatformState = {
    ...state,
    churches: updated,
  };

  savePlatformState(newState);
  return newState;
}

// Helper: Toggle Attendance
export function toggleSessionAttendanceRecord(
  state: PlatformState,
  participantId: string,
  eventId: string,
  sessionKey: string
): PlatformState {
  const key = `${participantId}_${eventId}_${sessionKey}`;
  const current = state.attendance[key]?.attended ?? false;
  const newAttended = !current;
  const newTimestamp = newAttended
    ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const newState: PlatformState = {
    ...state,
    attendance: {
      ...state.attendance,
      [key]: {
        attended: newAttended,
        timestamp: newTimestamp,
      },
    },
  };

  savePlatformState(newState);
  return newState;
}

// Helper: Update Event (Title, Theme, Dates, Status, Sessions)
export function updateEventRecord(
  state: PlatformState,
  eventId: string,
  partial: Partial<EquipEvent>
): PlatformState {
  const updatedEvents = state.events.map((ev) => {
    if (ev.id === eventId) {
      return {
        ...ev,
        ...partial,
      };
    }
    return ev;
  });

  const newState: PlatformState = {
    ...state,
    events: updatedEvents,
  };

  savePlatformState(newState);
  return newState;
}

// Helper: Update a specific session's speaker/preacher, topic, time, or venue
export function updateEventSessionRecord(
  state: PlatformState,
  eventId: string,
  sessionKey: string,
  sessionData: Partial<SessionConfig>
): PlatformState {
  const updatedEvents = state.events.map((ev) => {
    if (ev.id === eventId) {
      const currentSessions = ev.sessions || createDefaultSessions();
      const updatedSessions = currentSessions.map((s) => {
        if (s.key === sessionKey) {
          return {
            ...s,
            ...sessionData,
          };
        }
        return s;
      });

      return {
        ...ev,
        sessions: updatedSessions,
      };
    }
    return ev;
  });

  const newState: PlatformState = {
    ...state,
    events: updatedEvents,
  };

  savePlatformState(newState);
  return newState;
}

// Helper: Update an existing participant's profile details (Name, Phone, Email, Church, Role, Location)
export function updateParticipantRecord(
  state: PlatformState,
  participantId: string,
  updates: Partial<Omit<StoredParticipant, "id" | "createdAt">>
): { state: PlatformState; participant: StoredParticipant | null } {
  const existing = state.participants[participantId];
  if (!existing) return { state, participant: null };

  const roleOfficeVal = updates.roleOffice !== undefined ? updates.roleOffice.trim() : existing.roleOffice;
  const isOrdained =
    updates.isOrdained !== undefined
      ? updates.isOrdained
      : roleOfficeVal.toLowerCase().includes("pastor") ||
        roleOfficeVal.toLowerCase().includes("bishop") ||
        roleOfficeVal.toLowerCase().includes("reverend") ||
        roleOfficeVal.toLowerCase().includes("minister") ||
        roleOfficeVal.toLowerCase().includes("apostle");

  const churchNameVal = updates.churchName !== undefined ? updates.churchName.trim() : existing.churchName;
  const isHostChurch =
    updates.isHostChurch !== undefined
      ? updates.isHostChurch
      : churchNameVal.includes("Host") || churchNameVal.includes("Charismatic Renaissance");

  const updated: StoredParticipant = {
    ...existing,
    ...updates,
    roleOffice: roleOfficeVal,
    churchName: churchNameVal,
    isOrdained,
    isHostChurch,
  };

  const updatedParticipants = {
    ...state.participants,
    [participantId]: updated,
  };

  // If a new church was entered, register it
  let updatedChurches = state.churches ? [...state.churches] : [];
  if (churchNameVal && !updatedChurches.includes(churchNameVal)) {
    updatedChurches.push(churchNameVal);
    updatedChurches.sort();
  }

  const updatedState: PlatformState = {
    ...state,
    participants: updatedParticipants,
    churches: updatedChurches,
  };

  savePlatformState(updatedState);
  return { state: updatedState, participant: updated };
}

// Helper: Export full platform database snapshot as JSON string
export function exportPlatformStateJSON(state: PlatformState): string {
  return JSON.stringify(state, null, 2);
}

// Helper: Import full platform database snapshot from JSON string
export function importPlatformStateJSON(jsonString: string): PlatformState {
  const parsed = JSON.parse(jsonString) as PlatformState;
  if (!parsed || !parsed.participants || !parsed.events) {
    throw new Error("Invalid platform state file format.");
  }
  savePlatformState(parsed);
  return parsed;
}
