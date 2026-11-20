import { useState, useMemo } from "react";
import {
  Search,
  Download,
  Clock,
  Eye,
  Plus,
  X,
  Copy,
  Check,
  Printer,
} from "lucide-react";
import { SEED_PARTICIPANTS } from "@/db/seed-data";
import { SessionConfig } from "@/lib/store";
import PrintableBadgeModal from "./PrintableBadgeModal";

interface AdminDirectoryProps {
  onBackToDashboard: () => void;
  onOpenRegister: () => void;
  onOpenSessionAttendance: () => void;
  activeEventName?: string;
  attendeesData?: any[];
  sessionsData?: SessionConfig[];
  onToggleSession?: (participantId: string, sessionKey: string) => void;
}

export default function AdminDirectory({
  onBackToDashboard,
  onOpenRegister,
  onOpenSessionAttendance,
  activeEventName = "Equip November 2026",
  attendeesData,
  sessionsData,
  onToggleSession,
}: AdminDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "pastors" | "members" | "host" | "visiting">("all");
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [badgeParticipant, setBadgeParticipant] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded attendees with 5-session attendance simulation
  const [directoryData, setDirectoryData] = useState(() =>
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
        sessions: {
          mon_am: idx < 8,
          mon_pm: idx < 9,
          tue_am: idx < 7,
          tue_pm: idx < 6,
          wed_am: idx < 9,
        },
        sessionTimes: {
          mon_am: idx < 8 ? `08:${35 + idx * 2} AM` : null,
          mon_pm: idx < 9 ? `05:${20 + idx * 3} PM` : null,
          tue_am: idx < 7 ? `08:${45 + idx * 2} AM` : null,
          tue_pm: idx < 6 ? `05:${30 + idx * 3} PM` : null,
          wed_am: idx < 9 ? `08:${50 + idx * 2} AM` : null,
        },
      };
    })
  );

  const dataSource = attendeesData || directoryData;

  // Filter logic
  const filteredData = useMemo(() => {
    return dataSource.filter((p) => {
      if (roleFilter === "pastors" && !p.isOrdained) return false;
      if (roleFilter === "members" && p.isOrdained) return false;
      if (roleFilter === "host" && !p.isHostChurch) return false;
      if (roleFilter === "visiting" && p.isHostChurch) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.churchName.toLowerCase().includes(q) ||
        p.roleOffice.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    });
  }, [directoryData, roleFilter, searchQuery]);

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

  const handleCopy = (id: string) => {
    playHapticAudio();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle individual session for selected participant
  const toggleSessionForParticipant = (participantId: string, sessionKey: string) => {
    playHapticAudio();
    if (onToggleSession) {
      onToggleSession(participantId, sessionKey);
    }
    setDirectoryData((prev) =>
      prev.map((p) => {
        if (p.id === participantId) {
          const currentVal = (p.sessions as any)[sessionKey];
          return {
            ...p,
            sessions: {
              ...p.sessions,
              [sessionKey]: !currentVal,
            },
            sessionTimes: {
              ...p.sessionTimes,
              [sessionKey]: !currentVal ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
            },
          };
        }
        return p;
      })
    );

    if (selectedParticipant && selectedParticipant.id === participantId) {
      const currentVal = (selectedParticipant.sessions as any)[sessionKey];
      setSelectedParticipant({
        ...selectedParticipant,
        sessions: {
          ...selectedParticipant.sessions,
          [sessionKey]: !currentVal,
        },
        sessionTimes: {
          ...selectedParticipant.sessionTimes,
          [sessionKey]: !currentVal ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
        },
      });
    }
  };

  // Export Comprehensive CSV
  const handleExportCSV = () => {
    const headers = [
      "Unique ID",
      "Full Name",
      "Phone",
      "Email",
      "Church",
      "Is Host Church",
      "Role / Office",
      "Location",
      "Mon AM Checked In",
      "Mon PM Checked In",
      "Tue AM Checked In",
      "Tue PM Checked In",
      "Wed AM Checked In",
    ];

    const rows = filteredData.map((p) => [
      p.id,
      `"${p.fullName}"`,
      p.phone,
      p.email,
      `"${p.churchName}"`,
      p.isHostChurch ? "Yes" : "No",
      p.roleOffice,
      `"${p.location}"`,
      p.sessions.mon_am ? "Yes" : "No",
      p.sessions.mon_pm ? "Yes" : "No",
      p.sessions.tue_am ? "Yes" : "No",
      p.sessions.tue_pm ? "Yes" : "No",
      p.sessions.wed_am ? "Yes" : "No",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `equip_directory_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(16,185,129,0.06),transparent)] text-slate-900 flex flex-col p-4 lg:p-6 gap-6 font-sans antialiased selection:bg-[#A3E635] selection:text-[#0F472A]">
      {/* Top Header Navigation */}
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
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Participant Directory</h1>
              <span className="text-[11px] font-extrabold bg-[#0F472A] text-[#A3E635] px-2 py-0.5 rounded-full">
                {filteredData.length} Records
              </span>
            </div>
            <span className="text-xs text-slate-400">Master attendee database across all monthly events</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSessionAttendance}
            className="h-9 px-3.5 bg-emerald-50 text-[#0F472A] hover:bg-emerald-100 border border-emerald-200/70 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Multi-Session Desk</span>
          </button>

          <button
            type="button"
            onClick={onOpenRegister}
            className="h-9 px-3.5 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Attendee</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Directory Filter & Search Controls */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/60 shadow-apple-card flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID, phone, church, or city..."
            className="w-full h-10 pl-10 pr-12 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
            ⌘ F
          </span>
        </div>

        {/* Role & Affiliation Filters (Apple Pill Segmented Control) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs">
          {[
            { key: "all", label: "All (184)" },
            { key: "pastors", label: "Ordained Pastors (72)" },
            { key: "members", label: "Members & Workers (112)" },
            { key: "host", label: "Host Church (68)" },
            { key: "visiting", label: "Visiting Delegations (116)" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                playHapticAudio();
                setRoleFilter(tab.key as any);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 active:scale-95 ${
                roleFilter === tab.key
                  ? "bg-[#0F472A] text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table Grid */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Participant</th>
                <th className="py-3.5 px-4">Unique ID</th>
                <th className="py-3.5 px-4">Role & Title</th>
                <th className="py-3.5 px-4">Affiliated Church</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">5-Session Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredData.map((p) => {
                const attendedCount = Object.values(p.sessions).filter(Boolean).length;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors duration-150 group cursor-pointer"
                    onClick={() => setSelectedParticipant(p)}
                  >
                    {/* Participant Name + Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            p.isOrdained
                              ? "bg-purple-100 text-purple-900 border border-purple-200"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          }`}
                        >
                          {p.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{p.fullName}</span>
                            {p.isOrdained && (
                              <span className="text-[9px] font-extrabold bg-[#0F472A] text-[#A3E635] px-1.5 py-0.2 rounded-full uppercase">
                                Clergy
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{p.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-[#0F472A] bg-lime-100/90 border border-lime-300/60 px-2.5 py-1 rounded-lg">
                        {p.id}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-700">{p.roleOffice}</span>
                    </td>

                    {/* Church */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            p.isHostChurch ? "bg-[#0F472A]" : "bg-emerald-500"
                          }`}
                        />
                        <span className="truncate max-w-[180px]">{p.churchName}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-slate-500">{p.location}</td>

                    {/* Session Pills Progress */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        {["mon_am", "mon_pm", "tue_am", "tue_pm", "wed_am"].map((sKey) => {
                          const isAttended = (p.sessions as any)[sKey];
                          return (
                            <span
                              key={sKey}
                              title={`${sKey.replace("_", " ").toUpperCase()}: ${isAttended ? "Verified" : "Pending"}`}
                              className={`w-2 h-5 rounded-sm transition-all ${
                                isAttended ? "bg-[#0F472A]" : "bg-slate-200"
                              }`}
                            />
                          );
                        })}
                        <span className="text-[10px] font-bold text-slate-500 ml-1.5 tabular-nums">
                          {attendedCount}/5
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBadgeParticipant(p);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 hover:text-slate-900 transition-colors"
                          title="Print Delegate Badge / Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParticipant(p);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Participant Profile Drawer / Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 flex flex-col gap-5 relative animate-in zoom-in-95 duration-200 ease-apple-spring">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedParticipant(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                  selectedParticipant.isOrdained
                    ? "bg-purple-100 text-purple-900 border border-purple-200"
                    : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                }`}
              >
                {selectedParticipant.fullName.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900">{selectedParticipant.fullName}</h3>
                  {selectedParticipant.isOrdained && (
                    <span className="text-[10px] font-extrabold bg-[#0F472A] text-[#A3E635] px-2 py-0.5 rounded-full uppercase">
                      Clergy VIP
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {selectedParticipant.roleOffice} · {selectedParticipant.churchName}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">{selectedParticipant.location}</span>
              </div>
            </div>

            {/* Unique ID Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400">Unique Participant ID</span>
                <span className="font-mono text-xl font-black text-[#0F472A]">{selectedParticipant.id}</span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(selectedParticipant.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs active:scale-95 transition-all"
              >
                {copiedId === selectedParticipant.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === selectedParticipant.id ? "Copied" : "Copy ID"}</span>
              </button>
            </div>

            {/* 5-Session Attendance Interactive Matrix for this Attendee */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-slate-900">5-Session Programme Attendance</span>
              <div className="flex flex-col gap-2">
                {(sessionsData && sessionsData.length > 0
                  ? sessionsData.map((s, idx) => ({
                      key: s.key,
                      name: `Session ${idx + 1}: ${s.short} (${s.name}) · Preacher: ${s.speaker}`,
                    }))
                  : [
                      { key: "mon_am", name: "Session 1: Monday Morning" },
                      { key: "mon_pm", name: "Session 2: Monday Evening" },
                      { key: "tue_am", name: "Session 3: Tuesday Morning" },
                      { key: "tue_pm", name: "Session 4: Tuesday Evening" },
                      { key: "wed_am", name: "Session 5: Wednesday Morning" },
                    ]
                ).map((s) => {
                  const isChecked = (selectedParticipant.sessions as any)[s.key];
                  const time = (selectedParticipant.sessionTimes as any)[s.key];
                  return (
                    <div
                      key={s.key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        {time && <span className="text-[10px] text-emerald-700 font-medium">Checked in at {time}</span>}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSessionForParticipant(selectedParticipant.id, s.key)}
                        className={`px-3 py-1 rounded-full font-bold text-xs transition-all active:scale-95 ${
                          isChecked
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-slate-200/70 text-slate-600 hover:bg-slate-300/60"
                        }`}
                      >
                        {isChecked ? "Attended" : "Mark Present"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBadgeParticipant(selectedParticipant);
                }}
                className="flex-1 h-11 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>Print Physical Badge / Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedParticipant(null)}
                className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

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
