import { useState, useMemo, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import RegistrationFlow from "./components/RegistrationFlow";
import AdminDirectory from "./components/AdminDirectory";
import MultiSessionAttendance from "./components/MultiSessionAttendance";
import EventModal, { EquipEvent } from "./components/EventModal";
import { Calendar, ChevronDown, RotateCcw, Smartphone, Download, Upload } from "lucide-react";
import {
  loadPlatformState,
  savePlatformState,
  resetPlatformState,
  getAttendeesForEvent,
  registerParticipantForEvent,
  updateParticipantRecord,
  toggleSessionAttendanceRecord,
  updateEventRecord,
  updateEventSessionRecord,
  getRegisteredChurches,
  addRegisteredChurch,
  formatEventFullDateRange,
  subscribeToPlatformSync,
  exportPlatformStateJSON,
  importPlatformStateJSON,
  SessionConfig,
} from "./lib/store";

type AppView = "dashboard" | "directory" | "attendance" | "register";

function getRouteFromLocation(): AppView {
  if (typeof window === "undefined") return "dashboard";
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase().replace("#", "").replace("/", "");

  if (path === "/register" || hash === "register") return "register";
  if (path === "/attendance" || path === "/usher" || hash === "attendance" || hash === "usher") return "attendance";
  if (path === "/directory" || hash === "directory") return "directory";
  return "dashboard";
}

export default function App() {
  const [view, setView] = useState<AppView>(() => getRouteFromLocation());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [platformState, setPlatformState] = useState(() => loadPlatformState());

  // Listen for browser Back / Forward buttons & cross-tab / cross-device synchronization
  useEffect(() => {
    const handlePopState = () => {
      setView(getRouteFromLocation());
    };
    window.addEventListener("popstate", handlePopState);

    // Cross-tab real-time sync subscription
    const unsubscribeSync = subscribeToPlatformSync(() => {
      setPlatformState(loadPlatformState());
    });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      unsubscribeSync();
    };
  }, []);

  // Navigate to a view and update browser URL
  const navigateTo = (newView: AppView) => {
    setView(newView);
    const targetPath = newView === "dashboard" ? "/" : `/${newView}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, "", targetPath);
    }
  };

  const activeEvent = useMemo(
    () => platformState.events.find((e) => e.id === platformState.activeEventId) || platformState.events[0],
    [platformState.events, platformState.activeEventId]
  );

  // Active attendees for the selected monthly event
  const activeAttendees = useMemo(
    () => getAttendeesForEvent(platformState, activeEvent.id),
    [platformState, activeEvent.id]
  );

  // Registered churches list
  const registeredChurches = useMemo(
    () => getRegisteredChurches(platformState),
    [platformState]
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

  const handleAddNewChurch = (churchName: string) => {
    const updated = addRegisteredChurch(platformState, churchName);
    setPlatformState(updated);
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

  const handleUpdateParticipant = (participantId: string, updates: any) => {
    const res = updateParticipantRecord(platformState, participantId, updates);
    setPlatformState(res.state);
  };

  const handleExportBackup = () => {
    const json = exportPlatformStateJSON(platformState);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `equip_database_snapshot_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = importPlatformStateJSON(content);
          setPlatformState(imported);
          alert("Platform database snapshot restored successfully!");
        } catch (err: any) {
          alert(`Failed to restore backup: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
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
          <img src="/logo.png" alt="Equip Logo" className="w-6 h-5 object-contain" />
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
            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded ml-0.5">
              {formatEventFullDateRange(activeEvent.startDate, activeEvent.endDate, activeEvent.monthYear)}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigateTo("dashboard")}
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
            onClick={() => navigateTo("directory")}
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
            onClick={() => navigateTo("attendance")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              view === "attendance"
                ? "bg-[#0F472A] text-[#A3E635]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Usher Mobile Desk</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo("register")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              view === "register"
                ? "bg-[#0F472A] text-[#A3E635]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Public Register
          </button>

          {/* Backup Snapshot Export & Import Pills */}
          <button
            type="button"
            onClick={handleExportBackup}
            title="Download full JSON database snapshot backup"
            className="p-1 text-slate-400 hover:text-[#A3E635] transition-colors ml-1"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleImportBackup}
            title="Restore database snapshot from JSON file"
            className="p-1 text-slate-400 hover:text-emerald-300 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
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
          onRegisterClick={() => navigateTo("register")}
          onDirectoryClick={() => navigateTo("directory")}
          onSessionsClick={() => navigateTo("attendance")}
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
          onBackToDashboard={() => navigateTo("dashboard")}
          onOpenRegister={() => navigateTo("register")}
          onOpenSessionAttendance={() => navigateTo("attendance")}
          activeEventName={activeEvent.title}
          attendeesData={activeAttendees}
          sessionsData={activeEvent.sessions}
          onToggleSession={handleToggleAttendance}
          onUpdateParticipant={handleUpdateParticipant}
        />
      )}

      {view === "attendance" && (
        <MultiSessionAttendance
          onBackToDashboard={() => navigateTo("dashboard")}
          onOpenDirectory={() => navigateTo("directory")}
          onOpenRegister={() => navigateTo("register")}
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
          onBackToDashboard={() => navigateTo("dashboard")}
          activeEventName={activeEvent.title}
          activeEventId={activeEvent.id}
          activeEventMonthYear={activeEvent.monthYear}
          activeEventTheme={activeEvent.theme}
          activeEventDates={formatEventFullDateRange(
            activeEvent.startDate,
            activeEvent.endDate,
            activeEvent.monthYear
          )}
          existingParticipants={platformState.participants}
          churchesList={registeredChurches}
          onAddNewChurch={handleAddNewChurch}
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
