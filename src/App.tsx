import { useState, useMemo } from "react";
import Dashboard from "./components/Dashboard";
import RegistrationFlow from "./components/RegistrationFlow";
import AdminDirectory from "./components/AdminDirectory";
import MultiSessionAttendance from "./components/MultiSessionAttendance";
import EventModal, { EquipEvent } from "./components/EventModal";
import { Calendar, ChevronDown } from "lucide-react";

export default function App() {
  const [view, setView] = useState<"dashboard" | "directory" | "attendance" | "register">("dashboard");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Monthly Recurring Events State
  const [events, setEvents] = useState<EquipEvent[]>([
    {
      id: "2026-12-EQUIP",
      title: "Equip December 2026: Apostolic Mantles & Spiritual Leadership",
      theme: "Apostolic Mantles & Spiritual Leadership",
      monthYear: "December 2026",
      startDate: "2026-12-14",
      endDate: "2026-12-16",
      status: "active",
      registeredCount: 184,
    },
    {
      id: "2027-01-EQUIP",
      title: "Equip January 2027: Apostolic Foundation & Ministerial Alignment",
      theme: "Apostolic Foundation & Ministerial Alignment",
      monthYear: "January 2027",
      startDate: "2027-01-11",
      endDate: "2027-01-13",
      status: "open",
      registeredCount: 0,
    },
    {
      id: "2027-02-EQUIP",
      title: "Equip February 2027: Evangelical Fire & Church Growth",
      theme: "Evangelical Fire & Church Growth",
      monthYear: "February 2027",
      startDate: "2027-02-08",
      endDate: "2027-02-10",
      status: "draft",
      registeredCount: 0,
    },
  ]);

  const [activeEventId, setActiveEventId] = useState<string>("2026-12-EQUIP");

  const activeEvent = useMemo(
    () => events.find((e) => e.id === activeEventId) || events[0],
    [events, activeEventId]
  );

  const handleCreateEvent = (newEvent: EquipEvent) => {
    setEvents((prev) => [...prev, newEvent]);
    setActiveEventId(newEvent.id);
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
            Directory ({activeEvent.registeredCount})
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
        />
      )}

      {view === "directory" && (
        <AdminDirectory
          onBackToDashboard={() => setView("dashboard")}
          onOpenRegister={() => setView("register")}
          onOpenSessionAttendance={() => setView("attendance")}
          activeEventName={activeEvent.title}
        />
      )}

      {view === "attendance" && (
        <MultiSessionAttendance
          onBackToDashboard={() => setView("dashboard")}
          onOpenDirectory={() => setView("directory")}
        />
      )}

      {view === "register" && (
        <RegistrationFlow
          onBackToDashboard={() => setView("dashboard")}
          activeEventName={activeEvent.title}
        />
      )}

      {/* Monthly Events Switcher & Creator Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        events={events}
        activeEventId={activeEventId}
        onSelectEvent={(eventId) => setActiveEventId(eventId)}
        onCreateEvent={handleCreateEvent}
      />
    </div>
  );
}
