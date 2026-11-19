import { useState } from "react";
import Dashboard from "./components/Dashboard";
import RegistrationFlow from "./components/RegistrationFlow";

export default function App() {
  const [view, setView] = useState<"dashboard" | "register">("dashboard");

  return (
    <div>
      {/* Top Banner Navigation Bar */}
      <div className="bg-[#0B0F17] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
          <span className="font-bold text-slate-200">Equip 3.0 Platform</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">December Gathering · 3-Day Leadership Programme</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("dashboard")}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              view === "dashboard"
                ? "bg-[#0F472A] text-[#A3E635]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Admin Dashboard
          </button>
          <button
            type="button"
            onClick={() => setView("register")}
            className={`px-3 py-1 rounded-md font-semibold transition-colors ${
              view === "register"
                ? "bg-[#0F472A] text-[#A3E635]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Public Registration View
          </button>
        </div>
      </div>

      {/* Main View Router */}
      {view === "dashboard" ? (
        <Dashboard onRegisterClick={() => setView("register")} />
      ) : (
        <RegistrationFlow onBackToDashboard={() => setView("dashboard")} />
      )}
    </div>
  );
}
