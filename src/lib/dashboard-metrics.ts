import type { AttendeeViewRecord, SessionConfig } from "./store.ts";

export function getDashboardMetrics(attendees: AttendeeViewRecord[], sessions: SessionConfig[], selectedSessionKey: SessionConfig["key"]) {
  const totalRegistrations = attendees.length;
  const ordainedCount = attendees.filter(attendee => attendee.isOrdained).length;
  const checkedInCount = attendees.filter(attendee => attendee.sessions[selectedSessionKey]).length;
  const checkedInMinisters = attendees.filter(attendee => attendee.isOrdained && attendee.sessions[selectedSessionKey]).length;
  const churches = new Map<string, { name: string; count: number }>();
  for (const attendee of attendees) {
    const name = attendee.churchName.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    const current = churches.get(key);
    churches.set(key, { name: current?.name || name, count: (current?.count || 0) + 1 });
  }
  return {
    totalRegistrations,
    ordainedCount,
    membersCount: totalRegistrations - ordainedCount,
    checkedInCount,
    checkedInMinisters,
    checkedInDelegates: checkedInCount - checkedInMinisters,
    delegations: [...churches.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    sessionTurnoutStats: sessions.map(session => ({ ...session, count: attendees.filter(attendee => attendee.sessions[session.key]).length })),
  };
}
