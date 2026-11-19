import { useState, useMemo } from "react";
import Dashboard from "./components/Dashboard";
import RegistrationFlow from "./components/RegistrationFlow";
import AdminDirectory from "./components/AdminDirectory";
import MultiSessionAttendance from "./components/MultiSessionAttendance";
import EventModal, { EquipEvent } from "./components/EventModal";
import { Calendar, ChevronDown, RotateCcw } from "lucide-react";
import {
  loadPlatformState,
  savePlatformState,
  resetPlatformState,
  getAttendeesForEvent,
  registerParticipantForEvent,
  toggleSessionAttendanceRecord,
  updateEventRecord,
  updateEventSessionRecord,
  SessionConfig,
} from "./lib/store";

export default function App() {
  const [view, setView] = useState<"dashboard" | "directory" | "attendance" | "register">("dashboard");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [platformState, setPlatformState] = useState(() => loadPlatformState());

  const activeEvent = useMemo(
    () => platformState.events.find((e) => e.id === platformState.activeEventId) || platformState.events[0],
    [platformState.events, platformState.activeEventId]
  );

  // Active attendees for the selected monthly event
  const activeAttendees = useMemo(
    () => getAttendeesForEvent(platformState, activeEvent.id),
    [platformState, activeEvent.id]
  );

  const ordainedCount = useMemo(
    () => activeAttendees.filter((a) => a.isOrdained).length,
    [activeAttendees]
  );

  // Events list with dynamic registration count
  const dynamicEvents = useMemo(() => {
    return platformState.events.map((ev) => ({
      ...ev,
      registeredCount: platformState.registrations.filter((r) => r.eventId === ev.id).length,
    }));
  }, [platformState.events, platformState.registrations]);

  const handleSelectEvent = (eventId: string) => {
    const updated = { ...platformState, activeEventId: eventId };
    setPlatformState(updated);
    savePlatformState(updated);
  };

  const handleCreateEvent = (newEvent: EquipEvent) => {
    const updated = {
      ...platformState,
      events: [...platformState.events, newEvent],
      activeEventId: newEvent.id,
    };
    setPlatformState(updated);
    savePlatformState(updated);
  };

  const handleUpdateEvent = (updatedEvent: EquipEvent) => {
    const updated = updateEventRecord(platformState, updatedEvent.id, updatedEvent);
    setPlatformState(updated);
  };

  const handleUpdateSession = (sessionKey: string, sessionData: Partial<SessionConfig>) => {
    const updated = updateEventSessionRecord(
      platformState,
      activeEvent.id,
      sessionKey,
      sessionData
    );
    setPlatformState(updated);
  };

  const handleRegisterParticipant = (participantData: any, _isReturning: boolean = false) => {
    const res = registerParticipantForEvent(platformState, {
      fullName: participantData.fullName,
      phone: participantData.phone,
      email: participantData.email,
      churchName: participantData.churchName,
      roleOffice: participantData.roleOffice,
      location: participantData.location || "Lagos",
      eventId: activeEvent.id,
    });
    setPlatformState(res.state);
  };

  const handleToggleAttendance = (participantId: string, sessionKey: string) => {
    const updated = toggleSessionAttendanceRecord(
      platformState,
      participantId,
      activeEvent.id,
      sessionKey
    );
    setPlatformState(updated);
  };

  const handleResetData = () => {
    if (confirm("Reset demo data back to initial seed state with 184 registrations?")) {
      const reset = resetPlatformState();
      setPlatformState(reset);
    }
  };

  return (
    <div>
      {/* Top Banner Navigation Bar */}
      <div className="bg-[#0B0F17] text-white px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
          <span className="font-bold text-slate-200">Equip 3.0 Platform</span>
          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Active Event Switcher Badge */}
          <button
            type="button"
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700/80 transition-all active:scale-95 shadow-2xs"
            title="Click to switch or create monthly programme event"
          >
            <Calendar className="w-3.5 h-3.5 text-[#A3E635]" />
            <span className="font-bold text-white">{activeEvent.monthYear}</span>
            <span className="text-[10px] text-slate-400 hidden md:inline">· {activeEvent.theme}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setView("dashboard")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              view === "dashboard"
                ? "bg-[#0F472A] text-[#A3E635]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => setView("directory")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              view === "directory"
                ? "bg-[#0F472A] text-[#A3E635]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Directory ({activeAttendees.length})
          </button>

          <button
            type="button"
            onClick={() => setView("attendance")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              view === "attendance"
                ? "bg-[#0F472A] text-[#A3E635]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            5-Session Desk
          </button>

          <button
            type="button"
            onClick={() => setView("register")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              view === "register"
                ? "bg-[#0F472A] text-[#A3E635]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Public Register
          </button>

          {/* Reset Demo Data Pill */}
          <button
            type="button"
            onClick={handleResetData}
            title="Reset platform demo data"
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main View Router */}
      {view === "dashboard" && (
        <Dashboard
          onRegisterClick={() => setView("register")}
          onDirectoryClick={() => setView("directory")}
          onSessionsClick={() => setView("attendance")}
          onOpenEventModal={() => setIsEventModalOpen(true)}
          activeEventName={activeEvent.title}
          activeEventTheme={activeEvent.theme}
          activeEventMonthYear={activeEvent.monthYear}
          totalRegistrations={activeAttendees.length}
          ordainedCount={ordainedCount}
          attendeesData={activeAttendees}
          sessionsData={activeEvent.sessions}
          onUpdateSession={handleUpdateSession}
        />
      )}

      {view === "directory" && (
        <AdminDirectory
          onBackToDashboard={() => setView("dashboard")}
          onOpenRegister={() => setView("register")}
          onOpenSessionAttendance={() => setView("attendance")}
          activeEventName={activeEvent.title}
          attendeesData={activeAttendees}
          sessionsData={activeEvent.sessions}
          onToggleSession={handleToggleAttendance}
        />
      )}

      {view === "attendance" && (
        <MultiSessionAttendance
          onBackToDashboard={() => setView("dashboard")}
          onOpenDirectory={() => setView("directory")}
          onOpenRegister={() => setView("register")}
          activeEventName={activeEvent.title}
          activeEventId={activeEvent.id}
          rosterData={activeAttendees}
          sessionsData={activeEvent.sessions}
          onToggleAttendance={handleToggleAttendance}
          onUpdateSession={handleUpdateSession}
        />
      )}

      {view === "register" && (
        <RegistrationFlow
          onBackToDashboard={() => setView("dashboard")}
          activeEventName={activeEvent.title}
          activeEventId={activeEvent.id}
          existingParticipants={platformState.participants}
          onParticipantRegistered={handleRegisterParticipant}
        />
      )}

      {/* Monthly Events Switcher & Creator Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        events={dynamicEvents}
        activeEventId={platformState.activeEventId}
        onSelectEvent={handleSelectEvent}
        onCreateEvent={handleCreateEvent}
        onUpdateEvent={handleUpdateEvent}
      />
    </div>
  );
}
