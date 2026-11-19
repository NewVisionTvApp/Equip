import { SEED_PARTICIPANTS } from "@/db/seed-data";
import { generateParticipantId } from "./id-generator";

export interface EquipEvent {
  id: string; // e.g. "2026-12-EQUIP"
  title: string;
  theme: string;
  monthYear: string;
  startDate: string;
  endDate: string;
  status: "active" | "open" | "draft" | "completed";
}

export interface StoredParticipant {
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
    wed_pm: boolean;
  };
  sessionTimes: {
    mon_am: string | null;
    mon_pm: string | null;
    tue_am: string | null;
    tue_pm: string | null;
    wed_pm: string | null;
  };
}

const STORAGE_KEY = "equip_platform_state_v1";

interface PlatformState {
  events: EquipEvent[];
  activeEventId: string;
  participants: Record<string, StoredParticipant>; // keyed by participant ID
  registrations: StoredRegistration[];
  attendance: Record<string, { attended: boolean; timestamp: string | null }>; // key: `${participantId}_${eventId}_${sessionKey}`
}

function getInitialState(): PlatformState {
  const initialEvents: EquipEvent[] = [
    {
      id: "2026-12-EQUIP",
      title: "Equip December 2026: Apostolic Mantles & Spiritual Leadership",
      theme: "Apostolic Mantles & Spiritual Leadership",
      monthYear: "December 2026",
      startDate: "2026-12-14",
      endDate: "2026-12-16",
      status: "active",
    },
    {
      id: "2027-01-EQUIP",
      title: "Equip January 2027: Apostolic Foundation & Ministerial Alignment",
      theme: "Apostolic Foundation & Ministerial Alignment",
      monthYear: "January 2027",
      startDate: "2027-01-11",
      endDate: "2027-01-13",
      status: "open",
    },
    {
      id: "2027-02-EQUIP",
      title: "Equip February 2027: Evangelical Fire & Church Growth",
      theme: "Evangelical Fire & Church Growth",
      monthYear: "February 2027",
      startDate: "2027-02-08",
      endDate: "2027-02-10",
      status: "draft",
    },
  ];

  const participants: Record<string, StoredParticipant> = {};
  const registrations: StoredRegistration[] = [];
  const attendance: Record<string, { attended: boolean; timestamp: string | null }> = {};

  // Populate December registrations from SEED_PARTICIPANTS
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
      createdAt: "2026-12-01T08:00:00Z",
    };

    const regId = `reg_202612_${p.id}`;
    registrations.push({
      id: regId,
      participantId: p.id,
      eventId: "2026-12-EQUIP",
      registeredAt: "2026-12-01T09:00:00Z",
    });

    // Populate initial attendance for demo
    const sessionKeys = ["mon_am", "mon_pm", "tue_am", "tue_pm", "wed_pm"];
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
      } else if (sKey === "wed_pm" && idx < 178) {
        attended = true;
        timestamp = `05:${String(10 + (idx % 40)).padStart(2, "0")} PM`;
      }

      attendance[`${p.id}_2026-12-EQUIP_${sKey}`] = {
        attended,
        timestamp,
      };
    });
  });

  return {
    events: initialEvents,
    activeEventId: "2026-12-EQUIP",
    participants,
    registrations,
    attendance,
  };
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
    return JSON.parse(raw);
  } catch {
    return getInitialState();
  }
}

// Save state to localStorage
export function savePlatformState(state: PlatformState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
        wed_pm: state.attendance[`${p.id}_${eventId}_wed_pm`]?.attended ?? false,
      };

      const sessionTimes = {
        mon_am: state.attendance[`${p.id}_${eventId}_mon_am`]?.timestamp ?? null,
        mon_pm: state.attendance[`${p.id}_${eventId}_mon_pm`]?.timestamp ?? null,
        tue_am: state.attendance[`${p.id}_${eventId}_tue_am`]?.timestamp ?? null,
        tue_pm: state.attendance[`${p.id}_${eventId}_tue_pm`]?.timestamp ?? null,
        wed_pm: state.attendance[`${p.id}_${eventId}_wed_pm`]?.timestamp ?? null,
      };

      return {
        ...p,
        registrationId: reg.id,
        registeredAt: reg.registeredAt,
        sessions,
        sessionTimes,
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
  const isOrdained =
    input.roleOffice.toLowerCase().includes("pastor") ||
    input.roleOffice.toLowerCase().includes("bishop") ||
    input.roleOffice.toLowerCase().includes("reverend") ||
    input.roleOffice.toLowerCase().includes("minister") ||
    input.roleOffice.toLowerCase().includes("apostle");

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
        input.churchName.includes("Grace Covenant"),
      roleOffice: input.roleOffice.trim(),
      isOrdained,
      location: input.location.trim() || "Lagos",
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

  const newState: PlatformState = {
    ...state,
    participants: updatedParticipants,
    registrations: updatedRegistrations,
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
