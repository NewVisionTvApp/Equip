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
  Pencil,
  Camera,
  Volume2,
  VolumeX,
} from "lucide-react";
import { createDefaultSessions, isAudioMuted, setAudioMuted, type AttendeeViewRecord, type SessionConfig } from "@/lib/store";
import PrintableBadgeModal from "./PrintableBadgeModal";
import EditSessionModal from "./EditSessionModal";
import CameraScannerModal from "./CameraScannerModal";

interface MultiSessionAttendanceProps {
  canManage?: boolean;
  onBackToDashboard: () => void;
  onOpenDirectory: () => void;
  onOpenRegister?: () => void;
  activeEventName: string;
  activeEventDates: string;
  rosterData: AttendeeViewRecord[];
  sessionsData?: SessionConfig[];
  onToggleAttendance: (participantId: string, sessionKey: string) => void;
  onUpdateSession?: (sessionKey: string, sessionData: Partial<SessionConfig>) => void;
}

export default function MultiSessionAttendance({
  canManage = true,
  onBackToDashboard,
  onOpenDirectory,
  onOpenRegister,
  activeEventName,
  activeEventDates,
  rosterData,
  sessionsData,
  onToggleAttendance,
  onUpdateSession,
}: MultiSessionAttendanceProps) {
  const [activeSessionKey, setActiveSessionKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fastScanInput, setFastScanInput] = useState("");
  const [scanAlert, setScanAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [badgeParticipant, setBadgeParticipant] = useState<any | null>(null);
  const [editingSession, setEditingSession] = useState<SessionConfig | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => isAudioMuted());
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "checked_in" | "absent">("all");

  const roster = rosterData;
  const sessions = useMemo(() => sessionsData?.length ? sessionsData : createDefaultSessions(), [sessionsData]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.key === activeSessionKey) || sessions[0],
    [sessions, activeSessionKey]
  );

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setAudioMuted(next);
  };

  // Audio feedback (plays unless muted by user)
  const playHapticAudio = () => {
    if (isMuted) return;
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

  const isAttendeeCheckedIn = (p: AttendeeViewRecord, sKey: string): boolean => {
    return Boolean(sKey && p.sessions[sKey as SessionConfig["key"]]);
  };

  const getAttendeeCheckInTime = (p: AttendeeViewRecord, sKey: string): string | null => {
    return sKey ? p.sessionTimes[sKey as SessionConfig["key"]] : null;
  };

  // Toggle single session check-in
  const toggleAttendance = (participantId: string, sessionKey: string) => {
    if (!sessionKey) return;
    playHapticAudio();
    onToggleAttendance(participantId, sessionKey);
  };

  // Core Verification Logic (used by both Keyboard and Camera Scanner)
  const verifyAttendee = (query: string) => {
    if (!activeSessionKey) {
      setScanAlert({ message: "Choose the current session before checking anyone in.", type: "error" });
      return;
    }
    if (!query.trim()) return;

    const q = query.trim().toUpperCase();
    const match = roster.find(
      (p) =>
        p.id.toUpperCase() === q ||
        p.phone.includes(q) ||
        p.fullName.toUpperCase().includes(q)
    );

    if (match) {
      playHapticAudio();
      const isAlreadyChecked = isAttendeeCheckedIn(match, activeSessionKey);

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
        message: `No participant matching "${query}". Check ID or spelling.`,
        type: "error",
      });
    }

    setTimeout(() => setScanAlert(null), 3500);
  };

  // Handle Door Fast Scan Form Submit
  const handleFastScan = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAttendee(fastScanInput);
  };

  // Session Statistics
  const checkedInThisSession = roster.filter((p) => isAttendeeCheckedIn(p, activeSessionKey)).length;
  const totalRoster = roster.length;
  const absentThisSession = activeSessionKey ? totalRoster - checkedInThisSession : 0;
  const clergyCheckedIn = roster.filter((p) => p.isOrdained && isAttendeeCheckedIn(p, activeSessionKey)).length;
  const delegatesCheckedIn = checkedInThisSession - clergyCheckedIn;

  // Filtered attendees (combining search query and door attendance filter)
  const filteredRoster = useMemo(() => {
    return roster.filter((p) => {
      const isAttended = isAttendeeCheckedIn(p, activeSessionKey);
      if (attendanceFilter === "checked_in" && !isAttended) return false;
      if (attendanceFilter === "absent" && isAttended) return false;

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
  }, [roster, searchQuery, activeSessionKey, attendanceFilter]);

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
      isAttendeeCheckedIn(p, activeSessionKey) ? "Yes" : "No",
      getAttendeeCheckInTime(p, activeSessionKey) || "—",
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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/85 backdrop-blur-xl rounded-2xl px-4 sm:px-6 py-4 border border-slate-200/60 shadow-apple-card ring-1 ring-black/[0.02] gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex min-h-11 self-start items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/50 active:scale-95 transition-all duration-150 ease-apple-spring"
          >
            {canManage ? "Back to dashboard" : "My account"}
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Usher Mobile Desk · {sessions.length} Sessions</h1>
              <span className="text-[11px] font-extrabold bg-[#0F472A] text-[#A3E635] px-2 py-0.5 rounded-full">
                Live Door Scanner
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">{activeEventDates} · Shared attendance verification</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenRegister && (
            <button
              type="button"
              onClick={onOpenRegister}
              className="min-h-11 px-3.5 bg-emerald-50 text-[#0F472A] hover:bg-emerald-100 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title="Register a walk-in attendee on the spot"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Walk-in Registration</span>
            </button>
          )}

          {canManage && (<button
            type="button"
            onClick={onOpenDirectory}
            className="min-h-11 px-3.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Participant Directory</span>
          </button>)}

          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Turn sound on" : "Mute sound"}
            className={`min-h-11 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border shadow-2xs ${
              isMuted
                ? "bg-amber-50 text-amber-900 border-amber-300"
                : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200"
            }`}
            title={isMuted ? "Audio is MUTED (Silent scanning during prayer/sermon)" : "Audio chime is ON"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-600" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="hidden sm:inline">{isMuted ? "Silent Mode" : "Sound On"}</span>
          </button>

          {canManage && (<button
            type="button"
            onClick={handleExportSessionCSV}
            disabled={!activeSessionKey}
            className="min-h-11 px-3.5 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Session CSV</span>
          </button>)}
        </div>
      </header>

      {!activeSessionKey && <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">Choose the session you are checking people into before using the door scanner or check-in buttons.</p>}
      {/* 5-Session Pill Selector Bar (Apple Fluid Tabs) */}
      <div aria-label="Choose an attendance session" className="bg-white/90 backdrop-blur-md rounded-2xl p-2 border border-slate-200/60 shadow-apple-card flex gap-2 overflow-x-auto sm:grid sm:grid-cols-5">
        {sessions.map((s) => {
          const isSelected = activeSessionKey === s.key;
          const count = roster.filter((p) => isAttendeeCheckedIn(p, s.key)).length;

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                playHapticAudio();
                setActiveSessionKey(s.key);
              }}
              aria-pressed={isSelected}
              aria-label={`${s.day} ${s.short}, ${count} checked in`}
              className={`flex min-h-11 min-w-24 flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all duration-200 ease-apple-spring active:scale-95 sm:min-w-0 ${
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
                  {count}
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
        <div className="lg:col-span-5 bg-gradient-to-br from-[#064E3B] via-[#0F472A] to-[#041D11] text-white rounded-2xl p-5 shadow-apple-card ring-1 ring-inset ring-white/10 flex flex-col justify-between min-h-44 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] font-extrabold bg-[#A3E635] text-[#0F472A] px-2 py-0.5 rounded-full uppercase tracking-wider">
              {activeSessionKey ? activeSession.day : "Choose a session"}
            </span>
            <div className="flex items-center gap-2 text-xs text-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
              <span>{activeSessionKey ? activeSession.hall : "Select session"}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 z-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-white leading-snug">{activeSessionKey ? activeSession.name : "Select a session above"}</h2>
              {onUpdateSession && activeSessionKey && (<button
                type="button"
                onClick={() => setEditingSession(activeSession as any)}
                className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center gap-1 text-[10px] font-bold border border-white/20 shrink-0"
                title="Edit Preacher Name & Session Topic"
              >
                <Pencil className="w-2.5 h-2.5 text-[#A3E635]" />
                <span>Edit Preacher</span>
              </button>)}
            </div>
            <p className="text-xs text-emerald-200">
              {activeSessionKey && <>Presider: <strong className="text-white">{activeSession.speaker}</strong> · {activeSession.time}</>}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs z-10 pt-2 border-t border-white/10">
            <span>Verified at Doors: <strong className="text-[#A3E635] font-mono text-sm">{checkedInThisSession}</strong></span>
            <span className="font-bold text-emerald-200">{clergyCheckedIn} Ministers · {delegatesCheckedIn} Delegates</span>
          </div>
        </div>

        {/* Door Fast Scan Desk Input */}
        <div className="lg:col-span-7 bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/60 shadow-apple-card flex flex-col justify-between gap-3 min-h-44">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#0F472A]" />
              <span className="text-xs font-bold text-slate-900">Door Fast Scanner & Verification</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {activeSessionKey ? "Ready for Scans" : "Choose Session"}
            </span>
          </div>

          <form onSubmit={handleFastScan} className="grid grid-cols-2 gap-2 my-auto sm:flex sm:items-center">
            <input
              type="text"
              aria-label="Participant ID, phone number, or name for door check-in"
              disabled={!activeSessionKey}
              value={fastScanInput}
              onChange={(e) => setFastScanInput(e.target.value)}
              placeholder="Type EQ-XXXXX ID, phone number, or attendee name..."
              className="col-span-2 min-w-0 flex-1 h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:col-span-1 sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A]"
            />
            <button
              type="button"
              disabled={!activeSessionKey}
              onClick={() => setIsCameraScannerOpen(true)}
              aria-label="Open camera QR scanner"
              className="h-11 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
              title="Open Camera QR Scanner"
            >
              <Camera className="w-4 h-4 text-[#0F472A]" />
              <span>Camera Scan</span>
            </button>
            <button
              type="submit"
              disabled={!activeSessionKey}
              className="h-11 px-4 bg-[#0F472A] hover:bg-[#165A36] active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Verify</span>
            </button>
          </form>

          {/* Feedback Banner */}
          {scanAlert ? (
            <div role="status"
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
              <span>{activeSessionKey ? "Press Enter ↵ to check in participant" : "Choose a session to begin"}</span>
              <span>Ordained Ministers: {clergyCheckedIn} · Delegates: {delegatesCheckedIn}</span>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Session Attendance Roster Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-apple-card overflow-hidden">
        {/* Table Search Bar & Door Attendance Filter Tabs */}
        <div className="p-4 border-b border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Filter attendance roster by name, ID, or church"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter roster by name, ID, or church..."
              className="w-full min-h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
            />
          </div>

          {/* Door Usher Filter Segmented Control */}
          <div aria-label="Filter attendance roster" className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { key: "all", label: `All (${totalRoster})` },
              { key: "checked_in", label: `Checked In (${checkedInThisSession})` },
              { key: "absent", label: `Not Yet Arrived (${absentThisSession})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  playHapticAudio();
                  setAttendanceFilter(tab.key as any);
                }}
                disabled={!activeSessionKey && tab.key !== "all"}
                aria-pressed={attendanceFilter === tab.key}
                className={`min-h-11 px-3 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 active:scale-95 ${
                  attendanceFilter === tab.key
                    ? "bg-[#0F472A] text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Showing {filteredRoster.length}</span>
          </div>
        </div>

        {/* Mobile View: High-Touch Cards for Door Ushers (Visible on screens < md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredRoster.map((p) => {
            const isAttended = isAttendeeCheckedIn(p, activeSessionKey);
            const checkInTime = getAttendeeCheckInTime(p, activeSessionKey);

            return (
              <div key={p.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/80 transition-colors sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      p.isOrdained ? "bg-purple-100 text-purple-900" : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {p.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm truncate">{p.fullName}</span>
                      <span className="font-mono text-[10px] font-bold text-[#0F472A] bg-lime-100 px-1.5 py-0.5 rounded">
                        {p.id}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 truncate">{p.roleOffice} · {p.churchName}</span>
                    {checkInTime && (
                      <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Checked in at {checkInTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={!activeSessionKey}
                    onClick={() => toggleAttendance(p.id, activeSessionKey)}
                    aria-label={`${isAttended ? "Remove check-in for" : "Check in"} ${p.fullName}`}
                    className={`min-h-11 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-xs ${
                      isAttended
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {isAttended ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Checked In</span>
                      </>
                    ) : (
                      <span>Check In</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBadgeParticipant(p)}
                    aria-label={`View badge for ${p.fullName}`}
                    className="w-11 h-11 flex items-center justify-center text-slate-600 hover:text-slate-800 rounded-xl bg-slate-50 border border-slate-200 shrink-0"
                    title="View Badge & Punch-Card"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full 10-Column Multi-Session Matrix (Visible on screens >= md) */}
        <div className="hidden md:block overflow-x-auto">
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
                <th className="py-3 px-4 text-center">Wed AM</th>
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
                    {["mon_am", "mon_pm", "tue_am", "tue_pm", "wed_am"].map((sKey) => {
                      const isAttended = isAttendeeCheckedIn(p, sKey);
                      const isCurrentSessionColumn = activeSessionKey === sKey;

                      return (
                        <td key={sKey} className={`py-3 px-2 text-center ${isCurrentSessionColumn ? "bg-emerald-50/30" : ""}`}>
                          <button
                            type="button"
                            disabled={sKey !== activeSessionKey}
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

      {/* Edit Session Modal for Preachers & Topics */}
      <EditSessionModal
        isOpen={Boolean(editingSession)}
        onClose={() => setEditingSession(null)}
        session={editingSession}
        onSave={(key, updatedData) => {
          if (onUpdateSession) {
            onUpdateSession(key, updatedData);
          }
        }}
      />

      {/* Live Door Camera Scanner */}
      <CameraScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(id) => verifyAttendee(id)}
        activeSessionName={`${activeSession.short} · ${activeSession.name}`}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
