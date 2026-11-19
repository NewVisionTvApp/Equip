import { useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  Users,
  Download,
  QrCode,
  Check,
  Printer,
  Plus,
} from "lucide-react";
import { SEED_PARTICIPANTS } from "@/db/seed-data";
import PrintableBadgeModal from "./PrintableBadgeModal";

interface MultiSessionAttendanceProps {
  onBackToDashboard: () => void;
  onOpenDirectory: () => void;
  onOpenRegister?: () => void;
  activeEventName?: string;
  activeEventId?: string;
  rosterData?: any[];
  onToggleAttendance?: (participantId: string, sessionKey: string) => void;
}

const SESSIONS_DATA = [
  {
    key: "mon_am",
    name: "Keynote Impartation & Vision Casting",
    short: "Mon AM",
    day: "Day 1 · Morning",
    time: "09:00 AM – 12:30 PM",
    speaker: "Apostle J. Mensah",
    hall: "Main Auditorium",
    capacity: 200,
  },
  {
    key: "mon_pm",
    name: "Evening Anointing & Deliverance Plenary",
    short: "Mon PM",
    day: "Day 1 · Evening",
    time: "05:30 PM – 08:30 PM",
    speaker: "Bishop David O.",
    hall: "Main Auditorium",
    capacity: 200,
  },
  {
    key: "tue_am",
    name: "Pastoral Governance & Ministry Ethics",
    short: "Tue AM",
    day: "Day 2 · Morning",
    time: "09:00 AM – 12:30 PM",
    speaker: "Rev. Dr. Grace E.",
    hall: "Synod Hall A",
    capacity: 200,
  },
  {
    key: "tue_pm",
    name: "Signs, Wonders & Leadership Mantle",
    short: "Tue PM",
    day: "Day 2 · Evening",
    time: "05:30 PM – 08:30 PM",
    speaker: "Pastor Samuel K.",
    hall: "Main Auditorium",
    capacity: 200,
  },
  {
    key: "wed_pm",
    name: "Final Mantle Impartation & Commissioning",
    short: "Wed PM",
    day: "Day 3 · Grand Finale",
    time: "05:00 PM – 08:30 PM",
    speaker: "Presiding Apostolic Council",
    hall: "Main Auditorium",
    capacity: 200,
  },
];

export default function MultiSessionAttendance({
  onBackToDashboard,
  onOpenDirectory,
  onOpenRegister,
  activeEventName = "Equip December 2026",
  rosterData,
  onToggleAttendance,
}: MultiSessionAttendanceProps) {
  const [activeSessionKey, setActiveSessionKey] = useState("mon_pm");
  const [searchQuery, setSearchQuery] = useState("");
  const [fastScanInput, setFastScanInput] = useState("");
  const [scanAlert, setScanAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [badgeParticipant, setBadgeParticipant] = useState<any | null>(null);

  // Attendees with session attendance map (using rosterData if provided, or default seeds)
  const [internalRoster, setInternalRoster] = useState(() =>
    SEED_PARTICIPANTS.map((p, idx) => {
      const isOrdained =
        p.roleOffice.toLowerCase().includes("pastor") ||
        p.roleOffice.toLowerCase().includes("bishop") ||
        p.roleOffice.toLowerCase().includes("reverend") ||
        p.roleOffice.toLowerCase().includes("minister") ||
        p.roleOffice.toLowerCase().includes("apostle");

      return {
        ...p,
        isOrdained,
        attendance: {
          mon_am: idx < 8,
          mon_pm: idx < 9,
          tue_am: idx < 7,
          tue_pm: idx < 6,
          wed_pm: idx < 9,
        },
        timestamps: {
          mon_am: idx < 8 ? `08:${40 + idx * 2} AM` : null,
          mon_pm: idx < 9 ? `05:${25 + idx * 3} PM` : null,
          tue_am: idx < 7 ? `08:${50 + idx * 2} AM` : null,
          tue_pm: idx < 6 ? `05:${35 + idx * 3} PM` : null,
          wed_pm: idx < 9 ? `05:${15 + idx * 2} PM` : null,
        },
      };
    })
  );

  const roster = rosterData || internalRoster;

  const activeSession = useMemo(
    () => SESSIONS_DATA.find((s) => s.key === activeSessionKey) || SESSIONS_DATA[1],
    [activeSessionKey]
  );

  // Audio feedback
  const playHapticAudio = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // AudioContext unavailable
    }
  };

  // Toggle single session check-in
  const toggleAttendance = (participantId: string, sessionKey: string) => {
    playHapticAudio();
    if (onToggleAttendance) {
      onToggleAttendance(participantId, sessionKey);
    }
    setInternalRoster((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          const current = (p.attendance as any)?.[sessionKey];
          return {
            ...p,
            attendance: {
              ...p.attendance,
              [sessionKey]: !current,
            },
            timestamps: {
              ...p.timestamps,
              [sessionKey]: !current
                ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : null,
            },
          };
        }
        return p;
      })
    );
  };

  // Handle Door Fast Scan
  const handleFastScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastScanInput.trim()) return;

    const q = fastScanInput.trim().toUpperCase();
    const match = roster.find(
      (p) =>
        p.id.toUpperCase() === q ||
        p.phone.includes(q) ||
        p.fullName.toUpperCase().includes(q)
    );

    if (match) {
      playHapticAudio();
      const isAlreadyChecked = (match.attendance as any)[activeSessionKey];

      if (isAlreadyChecked) {
        setScanAlert({
          message: `${match.fullName} (${match.id}) is already verified for ${activeSession.short}!`,
          type: "success",
        });
      } else {
        toggleAttendance(match.id, activeSessionKey);
        setScanAlert({
          message: `DOOR VERIFIED: ${match.fullName} (${match.roleOffice}) checked in!`,
          type: "success",
        });
      }
      setFastScanInput("");
    } else {
      setScanAlert({
        message: `No participant matching "${fastScanInput}". Check ID.`,
        type: "error",
      });
    }

    setTimeout(() => setScanAlert(null), 3500);
  };

  // Filtered attendees
  const filteredRoster = useMemo(() => {
    return roster.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.churchName.toLowerCase().includes(q) ||
        p.roleOffice.toLowerCase().includes(q)
      );
    });
  }, [roster, searchQuery]);

  // Session Statistics
  const checkedInThisSession = roster.filter((p) => (p.attendance as any)[activeSessionKey]).length;
  const totalRoster = 184;
  const attendanceRate = Math.round((checkedInThisSession / totalRoster) * 100);
  const clergyCheckedIn = roster.filter((p) => p.isOrdained && (p.attendance as any)[activeSessionKey]).length;
  const delegatesCheckedIn = checkedInThisSession - clergyCheckedIn;

  // Export Session CSV
  const handleExportSessionCSV = () => {
    const headers = [
      "Unique ID",
      "Full Name",
      "Phone",
      "Church",
      "Role / Office",
      `${activeSession.short} Attended`,
      "Timestamp",
    ];

    const rows = filteredRoster.map((p) => [
      p.id,
      `"${p.fullName}"`,
      p.phone,
      `"${p.churchName}"`,
      p.roleOffice,
      (p.attendance as any)[activeSessionKey] ? "Yes" : "No",
      (p.timestamps as any)[activeSessionKey] || "—",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `equip_session_${activeSessionKey}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(16,185,129,0.06),transparent)] text-slate-900 flex flex-col p-4 lg:p-6 gap-6 font-sans antialiased selection:bg-[#A3E635] selection:text-[#0F472A]">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/85 backdrop-blur-xl rounded-2xl px-6 py-4 border border-slate-200/60 shadow-apple-card ring-1 ring-black/[0.02] gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/50 active:scale-95 transition-all duration-150 ease-apple-spring"
          >
            ← Dashboard
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">5-Session Attendance Desk</h1>
              <span className="text-[11px] font-extrabold bg-[#0F472A] text-[#A3E635] px-2 py-0.5 rounded-full">
                Usher Terminal
              </span>
            </div>
            <span className="text-xs text-slate-400">Real-time door check-in & verification across all 5 programme sessions</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenRegister && (
            <button
              type="button"
              onClick={onOpenRegister}
              className="h-9 px-3.5 bg-emerald-50 text-[#0F472A] hover:bg-emerald-100 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title="Register a walk-in attendee on the spot"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Walk-in Registration</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenDirectory}
            className="h-9 px-3.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Participant Directory</span>
          </button>

          <button
            type="button"
            onClick={handleExportSessionCSV}
            className="h-9 px-3.5 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Session CSV</span>
          </button>
        </div>
      </header>

      {/* 5-Session Pill Selector Bar (Apple Fluid Tabs) */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 border border-slate-200/60 shadow-apple-card grid grid-cols-5 gap-2">
        {SESSIONS_DATA.map((s) => {
          const isSelected = activeSessionKey === s.key;
          const count = roster.filter((p) => (p.attendance as any)[s.key]).length;
          const pct = Math.round((count / totalRoster) * 100);

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                playHapticAudio();
                setActiveSessionKey(s.key);
              }}
              className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all duration-200 ease-apple-spring active:scale-95 ${
                isSelected
                  ? "bg-[#0F472A] text-white shadow-xs"
                  : "bg-slate-50/70 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm">{s.short}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-[#A3E635] text-[#0F472A]" : "bg-slate-200/80 text-slate-700"
                  }`}
                >
                  {pct}%
                </span>
              </div>
              <span className={`text-[10px] mt-0.5 truncate max-w-full ${isSelected ? "text-emerald-200" : "text-slate-400"}`}>
                {s.day}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Session Info & Door Fast Scan Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Active Session Highlight Card */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#064E3B] via-[#0F472A] to-[#041D11] text-white rounded-2xl p-5 shadow-apple-card ring-1 ring-inset ring-white/10 flex flex-col justify-between h-44 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] font-extrabold bg-[#A3E635] text-[#0F472A] px-2 py-0.5 rounded-full uppercase tracking-wider">
              {activeSession.day}
            </span>
            <div className="flex items-center gap-2 text-xs text-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
              <span>{activeSession.hall}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 z-10">
            <h2 className="text-lg font-extrabold text-white leading-snug">{activeSession.name}</h2>
            <p className="text-xs text-emerald-200">
              Presider: <strong className="text-white">{activeSession.speaker}</strong> · {activeSession.time}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs z-10 pt-2 border-t border-white/10">
            <span>Verified at Doors: <strong className="text-[#A3E635] font-mono">{checkedInThisSession} / {totalRoster}</strong></span>
            <span className="font-bold text-white">{attendanceRate}% Turnout</span>
          </div>
        </div>

        {/* Door Fast Scan Desk Input */}
        <div className="lg:col-span-7 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#0F472A]" />
              <span className="text-xs font-bold text-slate-900">Door Fast Scanner & Verification</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Ready for Scans
            </span>
          </div>

          <form onSubmit={handleFastScan} className="flex items-center gap-2 my-auto">
            <input
              type="text"
              value={fastScanInput}
              onChange={(e) => setFastScanInput(e.target.value)}
              placeholder="Type EQ-XXXXX ID, phone number, or attendee name..."
              className="flex-1 h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A]"
            />
            <button
              type="submit"
              className="h-11 px-5 bg-[#0F472A] hover:bg-[#165A36] active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Verify Entrance</span>
            </button>
          </form>

          {/* Feedback Banner */}
          {scanAlert ? (
            <div
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                scanAlert.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{scanAlert.message}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Press Enter ↵ to immediately check in participant</span>
              <span>Ordained Ministers: {clergyCheckedIn} · Delegates: {delegatesCheckedIn}</span>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Session Attendance Roster Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-apple-card overflow-hidden">
        {/* Table Search Bar */}
        <div className="p-4 border-b border-slate-200/60 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter roster by name, ID, or church..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Showing {filteredRoster.length} Attendees</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Delegate</th>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Affiliated Church</th>
                <th className="py-3 px-4 text-center">Mon AM</th>
                <th className="py-3 px-4 text-center">Mon PM</th>
                <th className="py-3 px-4 text-center">Tue AM</th>
                <th className="py-3 px-4 text-center">Tue PM</th>
                <th className="py-3 px-4 text-center">Wed PM</th>
                <th className="py-3 px-4 text-right">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredRoster.map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            p.isOrdained ? "bg-purple-100 text-purple-900" : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {p.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 leading-tight">{p.fullName}</span>
                          <span className="text-[10px] text-slate-400">{p.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-[#0F472A] bg-lime-100 px-2 py-0.5 rounded-md">
                        {p.id}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className="text-slate-600">{p.roleOffice}</span>
                    </td>

                    {/* Church */}
                    <td className="py-3 px-4">
                      <span className="text-slate-700 truncate max-w-[150px] inline-block">{p.churchName}</span>
                    </td>

                    {/* 5 Sessions Toggles */}
                    {["mon_am", "mon_pm", "tue_am", "tue_pm", "wed_pm"].map((sKey) => {
                      const isAttended = (p.attendance as any)?.[sKey];
                      const isCurrentSessionColumn = activeSessionKey === sKey;

                      return (
                        <td key={sKey} className={`py-3 px-2 text-center ${isCurrentSessionColumn ? "bg-emerald-50/30" : ""}`}>
                          <button
                            type="button"
                            onClick={() => toggleAttendance(p.id, sKey)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all active:scale-90 ${
                              isAttended
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                            {isAttended ? "Present" : "Absent"}
                          </button>
                        </td>
                      );
                    })}

                    {/* Print Badge Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setBadgeParticipant(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
                        title="Print Physical Lanyard Badge / Slip"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Physical Badge Modal */}
      <PrintableBadgeModal
        isOpen={Boolean(badgeParticipant)}
        onClose={() => setBadgeParticipant(null)}
        participant={badgeParticipant}
        eventName={activeEventName}
      />
    </div>
  );
}
