import { useState } from "react";
import Dashboard from "./components/Dashboard";

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

      {/* Main View */}
      {view === "dashboard" ? (
        <Dashboard onRegisterClick={() => setView("register")} />
      ) : (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-lime-100 text-[#0F472A] flex items-center justify-center font-extrabold text-lg">
              EQ
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Equip 3.0 Registration</h2>
            <p className="text-xs text-slate-500">
              Public attendee email sign-up and pass confirmation flow will be implemented in Phase 3.
            </p>
            <button
              type="button"
              onClick={() => setView("dashboard")}
              className="mt-4 px-4 py-2 bg-[#0F472A] text-white rounded-xl text-xs font-semibold hover:bg-[#165A36] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
