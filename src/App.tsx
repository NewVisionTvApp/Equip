import { useState } from "react";
import Dashboard from "./components/Dashboard";
import RegistrationFlow from "./components/RegistrationFlow";
import AdminDirectory from "./components/AdminDirectory";
import MultiSessionAttendance from "./components/MultiSessionAttendance";

export default function App() {
  const [view, setView] = useState<"dashboard" | "directory" | "attendance" | "register">("dashboard");

  return (
    <div>
      {/* Top Banner Navigation Bar */}
      <div className="bg-[#0B0F17] text-white px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
          <span className="font-bold text-slate-200">Equip 3.0 Platform</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">December Gathering · 3-Day Leadership Programme</span>
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
            Directory (184)
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
        />
      )}

      {view === "directory" && (
        <AdminDirectory
          onBackToDashboard={() => setView("dashboard")}
          onOpenRegister={() => setView("register")}
          onOpenSessionAttendance={() => setView("attendance")}
        />
      )}

      {view === "attendance" && (
        <MultiSessionAttendance
          onBackToDashboard={() => setView("dashboard")}
          onOpenDirectory={() => setView("directory")}
        />
      )}

      {view === "register" && (
        <RegistrationFlow onBackToDashboard={() => setView("dashboard")} />
      )}
    </div>
  );
}
