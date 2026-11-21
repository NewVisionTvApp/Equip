import { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  QrCode,
  Play,
  Download,
  CheckCircle2,
  Award,
  Check,
  Smartphone,
  Pencil,
  Camera,
} from "lucide-react";
import { createDefaultSessions, isAudioMuted, setAudioMuted, type AttendeeViewRecord, type EquipEvent, type SessionConfig } from "@/lib/store";
import { getDashboardMetrics } from "@/lib/dashboard-metrics";
import EditSessionModal from "./EditSessionModal";
import CameraScannerModal from "./CameraScannerModal";

interface DashboardProps {
  onRegisterClick?: () => void;
  onDirectoryClick?: () => void;
  onSessionsClick?: () => void;
  onOpenEventModal?: () => void;
  activeEventTheme: string;
  activeEventMonthYear: string;
  activeEventStatus: EquipEvent["status"];
  activeEventDates: string;
  adminName: string;
  adminEmail: string;
  attendeesData: AttendeeViewRecord[];
  sessionsData?: SessionConfig[];
  onToggleAttendance: (participantId: string, sessionKey: SessionConfig["key"]) => void;
  onUpdateSession?: (sessionKey: string, sessionData: Partial<SessionConfig>) => void;
}

export default function Dashboard({
  onRegisterClick,
  onDirectoryClick,
  onSessionsClick,
  onOpenEventModal,
  activeEventTheme,
  activeEventMonthYear,
  activeEventStatus,
  activeEventDates,
  adminName,
  adminEmail,
  attendeesData,
  sessionsData,
  onToggleAttendance,
  onUpdateSession,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionKey, setSelectedSessionKey] = useState<SessionConfig["key"]>("mon_am");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "pastors" | "members" | "checked_in">("all");
  const [fastScanId, setFastScanId] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [recentlyToggledId, setRecentlyToggledId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<SessionConfig | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => isAudioMuted());

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setAudioMuted(next);
  };

  const sessionList = useMemo(() => sessionsData?.length ? sessionsData : createDefaultSessions(), [sessionsData]);

  const currentSession = useMemo(
    () => sessionList.find((s) => s.key === selectedSessionKey) || sessionList[0],
    [sessionList, selectedSessionKey]
  );
  const attendees = useMemo(() => attendeesData.map(a => ({
    ...a,
    checkedIn: a.sessions[currentSession.key],
    checkedInAt: a.sessionTimes[currentSession.key],
  })), [attendeesData, currentSession.key]);
  const { totalRegistrations, ordainedCount, membersCount, checkedInCount, checkedInMinisters, checkedInDelegates, delegations, sessionTurnoutStats } = useMemo(
    () => getDashboardMetrics(attendeesData, sessionList, currentSession.key),
    [attendeesData, sessionList, currentSession.key]
  );
  const delegationDots = ["bg-[#0F472A]", "bg-[#166534]", "bg-[#84CC16]", "bg-emerald-500", "bg-lime-600"];
  const eventStatusLabel = activeEventStatus[0].toUpperCase() + activeEventStatus.slice(1);

  // Subtle Apple Audio feedback (synthesized lightweight pop)
  const playHapticAudio = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pleasant chime
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch {
      // AudioContext unavailable or blocked by autoplay
    }
  };

  // Filter attendees by Tab & Search
  const filteredAttendees = useMemo(() => {
    return attendees.filter((a) => {
      if (activeFilterTab === "pastors" && !a.isOrdained) return false;
      if (activeFilterTab === "members" && a.isOrdained) return false;
      if (activeFilterTab === "checked_in" && !a.checkedIn) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.fullName.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.churchName.toLowerCase().includes(q) ||
        a.roleOffice.toLowerCase().includes(q)
      );
    });
  }, [attendees, activeFilterTab, searchQuery]);

  // Toggle Check In with Apple fluid response
  const toggleCheckIn = (id: string) => {
    playHapticAudio();
    setRecentlyToggledId(id);
    setTimeout(() => setRecentlyToggledId(null), 800);

    onToggleAttendance(id, currentSession.key);
  };

  // Fast Door Scan verification logic
  const verifyDashboardAttendee = (query: string) => {
    if (!query.trim()) return;

    const cleaned = query.trim().toUpperCase();
    const match = attendees.find(
      (a) =>
        a.id.toUpperCase() === cleaned ||
        a.phone.includes(cleaned) ||
        a.fullName.toUpperCase().includes(cleaned)
    );

    if (match) {
      playHapticAudio();
      if (match.checkedIn) {
        setScanFeedback({
          message: `${match.fullName} (${match.id}) is already verified!`,
          type: "success",
        });
      } else {
        toggleCheckIn(match.id);
        setScanFeedback({
          message: `Verified: ${match.fullName} (${match.roleOffice}) checked in!`,
          type: "success",
        });
      }
      setFastScanId("");
    } else {
      setScanFeedback({
        message: `No participant matching "${query}". Check ID or register new.`,
        type: "error",
      });
    }

    setTimeout(() => setScanFeedback(null), 3500);
  };

  // Fast Door Scan form submit handler
  const handleFastScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyDashboardAttendee(fastScanId);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Unique ID",
      "Full Name",
      "Phone",
      "Email",
      "Church",
      "Role / Office",
      "Location",
      "Checked In",
      "Check-in Time",
    ];
    const rows = attendees.map((a) => [
      a.id,
      `"${a.fullName}"`,
      a.phone,
      a.email,
      `"${a.churchName}"`,
      a.roleOffice,
      `"${a.location}"`,
      a.checkedIn ? "Yes" : "No",
      a.checkedInAt || "—",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `equip_3.0_roster_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxSessionCheckedIn = Math.max(...sessionTurnoutStats.map(s => s.count), 1);

  return (
    <div className="min-h-screen bg-[#F8F9FA] bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(16,185,129,0.06),transparent)] text-slate-900 flex p-4 lg:p-6 gap-6 font-sans antialiased selection:bg-[#A3E635] selection:text-[#0F472A]">
      {/* 1. LEFT SIDEBAR (Apple Translucent Frosted Glass with Spring Micro-Interactions) */}
      <aside className="hidden lg:flex flex-col w-60 bg-white/85 backdrop-blur-xl rounded-2xl p-5 justify-between border border-slate-200/60 shadow-apple-card ring-1 ring-black/[0.02] shrink-0">
        <div className="flex flex-col gap-7">
          {/* Brand Header with real Equip 3.0 winged logo & Apple Spring Glow */}
          <div className="flex items-center gap-3 px-1 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F472A] to-[#064E3B] p-1.5 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/20 group-hover:scale-105 group-active:scale-95 transition-all duration-300 ease-apple-spring">
              <img src="/logo.png" alt="Equip 3.0" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Equip 3.0</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] animate-pulse" />
              </div>
              <span className="text-[11px] text-slate-400 font-medium tracking-tight">Church Suite</span>
            </div>
          </div>

          {/* Navigation Links with Apple Instant Press Response */}
          <nav className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                MENU
              </span>
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 bg-[#ECFDF5] text-[#065F46] rounded-xl font-bold text-sm shadow-2xs active:scale-[0.97] transition-all duration-150 ease-apple-spring text-left"
              >
                <LayoutDashboard className="w-4 h-4 text-[#065F46]" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={onDirectoryClick}
                className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl font-medium text-sm active:scale-[0.97] transition-all duration-150 ease-apple-spring text-left group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  <span>Attendees</span>
                </div>
                <span className="text-[11px] font-bold bg-slate-100/90 text-slate-600 px-2 py-0.5 rounded-full group-hover:bg-slate-200/80 transition-colors">
                  {totalRegistrations}
                </span>
              </button>

              <button
                type="button"
                onClick={onSessionsClick}
                className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl font-medium text-sm active:scale-[0.97] transition-all duration-150 ease-apple-spring text-left group"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  <span>{sessionList.length} Sessions</span>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  {eventStatusLabel}
                </span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl font-medium text-sm active:scale-[0.97] transition-all duration-150 ease-apple-spring text-left"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Churches</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl font-medium text-sm active:scale-[0.97] transition-all duration-150 ease-apple-spring text-left"
              >
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Analytics</span>
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                GENERAL
              </span>
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl font-medium text-sm active:scale-[0.97] transition-all duration-150 ease-apple-spring text-left"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl font-medium text-sm active:scale-[0.97] transition-all duration-150 ease-apple-spring text-left"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50/80 rounded-xl font-medium text-sm active:scale-[0.97] transition-all duration-150 ease-apple-spring text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Usher Card (Apple Depth with Subtle Ripple) */}
        <div className="bg-gradient-to-br from-[#0B3A23] to-[#041D11] text-white rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-xs ring-1 ring-inset ring-white/10 group">
          {/* Subtle Concentric Rings */}
          <svg
            className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700 ease-apple-spring"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="85" cy="85" r="28" />
            <circle cx="85" cy="85" r="48" />
            <circle cx="85" cy="85" r="68" />
          </svg>

          <div className="flex flex-col gap-1 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#A3E635]" />
                <span className="text-xs font-bold text-white tracking-tight">Usher Mobile Desk</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
            </div>
            <p className="text-[11px] text-emerald-200/90 leading-tight">
              Instant door badge scanning for active sessions.
            </p>
          </div>
          <button
            type="button"
            onClick={onSessionsClick}
            className="w-full h-8 bg-gradient-to-r from-[#166534] to-[#15803d] hover:brightness-110 active:scale-[0.96] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ease-apple-spring z-10 shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Launch Desk</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Top Header Bar (Apple Frosted Glass & Precision Alignment) */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/85 backdrop-blur-xl rounded-2xl px-6 py-3.5 border border-slate-200/60 shadow-apple-card ring-1 ring-black/[0.02] gap-4">
          {/* Search Bar with Spring Focus Bloom */}
          <div className="relative flex-1 max-w-md group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#0F472A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search attendee, phone, or EQ ID..."
              className="w-full h-10 pl-10 pr-12 bg-slate-50/80 border border-slate-200/70 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all duration-200 ease-apple-spring"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded-md shadow-2xs group-focus-within:border-[#0F472A]/40 group-focus-within:text-[#0F472A] transition-colors">
              ⌘ F
            </span>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            {/* Live Indicator */}
            <div className="hidden md:flex items-center gap-2 bg-emerald-50/80 text-[#166534] border border-emerald-200/60 rounded-full px-3 py-1 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>Programme records synced</span>
            </div>

            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-90 relative transition-all duration-150 ease-apple-spring"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#84CC16] absolute top-2 right-2 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-200/60">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0F472A] to-[#166534] text-[#A3E635] flex items-center justify-center text-xs font-bold shadow-xs ring-2 ring-emerald-50">
                {adminName.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">{adminName}</span>
                <span className="text-[11px] text-slate-400">{adminEmail}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Title & Quick Action CTAs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.03em]">
                Dashboard
              </h1>
              <button
                type="button"
                onClick={onOpenEventModal}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#0F472A] border border-emerald-200/80 text-xs font-extrabold hover:bg-emerald-100 transition-all active:scale-95 shadow-2xs"
                title="Switch or Create Monthly Programme"
              >
                <Calendar className="w-3.5 h-3.5 text-[#0F472A]" />
                <span>{activeEventMonthYear}</span>
                <span className="text-[10px] text-emerald-600 font-bold">▾ Switch</span>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-slate-500 font-medium">
              <span>Theme: <strong className="text-slate-800">{activeEventTheme}</strong></span>
              <span className="text-slate-300">·</span>
              <span className="text-[#0F472A] font-bold bg-lime-100 border border-lime-200 px-2.5 py-0.5 rounded-md text-xs">
                {activeEventDates} (3 Days · {sessionList.length} Sessions)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onSessionsClick}
              className="h-10 px-4 bg-gradient-to-r from-[#0F472A] to-[#165A36] hover:brightness-110 active:scale-[0.96] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-apple-card transition-all duration-200 ease-apple-spring"
            >
              <Smartphone className="w-4 h-4 text-[#A3E635]" />
              <span>Usher Mobile Desk</span>
            </button>

            <button
              type="button"
              onClick={onOpenEventModal}
              className="h-10 px-3.5 bg-white/90 hover:bg-slate-50 active:scale-[0.96] text-slate-800 border border-slate-200/80 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-apple-card transition-all duration-200 ease-apple-spring"
            >
              <Calendar className="w-4 h-4 text-[#0F472A]" />
              <span>Programme Events</span>
            </button>

            <button
              type="button"
              onClick={onRegisterClick}
              className="h-10 px-4 bg-[#0F472A] hover:bg-[#165A36] active:scale-[0.96] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs hover:shadow-apple-float transition-all duration-200 ease-apple-spring"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Register Attendee</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-4 bg-white/90 hover:bg-slate-50 active:scale-[0.96] text-slate-800 border border-slate-200/80 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-apple-card transition-all duration-200 ease-apple-spring"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Roster</span>
            </button>
          </div>
        </div>

        {/* Top 4 Stat Cards (Apple Materials & Hover Lifts) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Primary Dark Green Hero Card */}
          <div className="bg-gradient-to-br from-[#064E3B] via-[#0F472A] to-[#041D11] text-white rounded-2xl p-5 flex flex-col justify-between h-36 shadow-apple-card hover:shadow-apple-card-hover hover:-translate-y-0.5 transition-all duration-300 ease-apple-spring relative overflow-hidden group ring-1 ring-inset ring-white/10">
            {/* Luminous Glow Ambient Circle */}
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#A3E635]/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-apple-spring" />

            <div className="flex justify-between items-center z-10">
              <span className="text-xs font-semibold text-[#86EFAC] tracking-tight">Total Registrations</span>
              <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15 group-hover:bg-white/20 group-hover:rotate-45 transition-all duration-300 ease-apple-spring">
                <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="flex flex-col gap-1 z-10">
              <span className="text-3xl font-extrabold text-white tracking-[-0.04em] tabular-nums">
                {totalRegistrations}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-[#A3E635] text-[#0F472A] text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                  {eventStatusLabel}
                </span>
                <span className="text-[11px] text-[#DCFCE7] font-medium">Programme Roster</span>
              </div>
            </div>
          </div>

          {/* Card 2: Ordained Clergy */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover hover:-translate-y-0.5 transition-all duration-300 ease-apple-spring flex flex-col justify-between h-36 group">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 tracking-tight">Ordained Clergy</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200/80 group-hover:rotate-45 transition-all duration-300 ease-apple-spring">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-[-0.04em] tabular-nums">
                {ordainedCount}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {ordainedCount} Ministers
                </span>
                <span className="text-[11px] text-slate-400">Bishops, Apostles & Pastors</span>
              </div>
            </div>
          </div>

          {/* Card 3: Church Delegations */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover hover:-translate-y-0.5 transition-all duration-300 ease-apple-spring flex flex-col justify-between h-36 group">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 tracking-tight">Members & Workers</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200/80 group-hover:rotate-45 transition-all duration-300 ease-apple-spring">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-[-0.04em] tabular-nums">
                {membersCount}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {delegations.length} Churches
                </span>
                <span className="text-[11px] text-slate-400">Host & visiting delegations</span>
              </div>
            </div>
          </div>

          {/* Card 4: Session Verified */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover hover:-translate-y-0.5 transition-all duration-300 ease-apple-spring flex flex-col justify-between h-36 group">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 tracking-tight">{currentSession.short} Verified</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200/80 group-hover:rotate-45 transition-all duration-300 ease-apple-spring">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-[-0.04em] tabular-nums">
                {checkedInCount}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {checkedInCount} Present
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Verified at doors</span>
              </div>
            </div>
          </div>
        </section>

        {/* Middle Section (3-Column Layout with Smooth Spring Transitions) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Col 1 (5 cols): Session Attendance Pillars with Apple Fluid Spring Motion */}
          <div className="lg:col-span-5 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring flex flex-col justify-between h-64">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900 tracking-tight">Session Attendance</span>
              <span className="text-[11px] font-bold text-[#166534] bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                {sessionList.length} Sessions
              </span>
            </div>

            {/* Pillar Capsules with Spring Hover Lifts */}
            <div className="flex items-end justify-between px-2 pt-2 h-44">
              {sessionTurnoutStats.map((s) => {
                const isSelected = selectedSessionKey === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      playHapticAudio();
                      setSelectedSessionKey(s.key);
                    }}
                    className="flex flex-col items-center gap-2 group transition-all relative focus:outline-none"
                  >
                    {/* Floating Apple Bounce Badge for Active Session */}
                    {isSelected && (
                      <div className="absolute -top-7 flex flex-col items-center animate-in zoom-in-75 duration-200 ease-apple-bounce">
                        <span className="text-[10px] font-extrabold bg-[#0F472A] text-white px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                          {s.count} Present
                        </span>
                        <div className="w-1.5 h-1.5 bg-[#0F472A] rotate-45 -mt-0.5" />
                      </div>
                    )}

                    {/* Capsule Bar with smooth spring expansion */}
                    <div className="w-10 h-32 bg-slate-100 rounded-full flex flex-col justify-end p-1 transition-all group-hover:bg-slate-200/70 group-hover:scale-105 group-active:scale-95 duration-200 ease-apple-spring">
                      <div
                        className={`w-full rounded-full transition-all duration-500 ease-apple-spring ${
                          isSelected
                            ? "bg-[#0F472A] shadow-xs"
                            : "bg-[#84CC16]/70"
                        }`}
                        style={{ height: `${Math.round(s.count / maxSessionCheckedIn * 100)}%` }}
                      />
                    </div>

                    <span
                      className={`text-[10px] font-bold transition-colors ${
                        isSelected ? "text-[#0F472A]" : "text-slate-500"
                      }`}
                    >
                      {s.short}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Col 2 (4 cols): Current Session Focus */}
          <div className="lg:col-span-4 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring flex flex-col justify-between h-64">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  SELECTED SESSION
                </span>
                <button
                  type="button"
                  onClick={() => setEditingSession(currentSession as any)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0F472A] border border-emerald-200/70 transition-colors flex items-center gap-1 text-[10px] font-bold shadow-2xs"
                  title="Customize preacher name, topic, or venue"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>Edit Preacher</span>
                </button>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug tracking-tight">
                {currentSession.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Time: {currentSession.time}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <Award className="w-3.5 h-3.5 text-[#0F472A]" />
                <span className="font-bold text-slate-800">{currentSession.speaker}</span>
                <span className="text-slate-400">· {currentSession.hall}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-2.5 py-1.5 text-xs text-[#166534] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live door usher sync active</span>
              </div>
              <button
                type="button"
                onClick={onSessionsClick}
                className="w-full h-9 bg-[#0F472A] hover:bg-[#165A36] active:scale-[0.97] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 ease-apple-spring shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Open attendance desk</span>
              </button>
            </div>
          </div>

          {/* Col 3 (3 cols): Delegations List */}
          <div className="lg:col-span-3 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring flex flex-col justify-between h-64">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900 tracking-tight">Delegations</span>
              <span className="text-[11px] font-bold text-[#0F472A] bg-lime-100 border border-lime-200/60 px-2 py-0.5 rounded-md">
                {delegations.length} Churches
              </span>
            </div>

            <div className="flex flex-col gap-3 my-auto">
              {delegations.length === 0 && <p className="text-xs text-slate-500">No registrations yet.</p>}
              {delegations.slice(0, 4).map((c, index) => (
                <div key={c.name} className="flex items-center justify-between text-xs group cursor-pointer hover:translate-x-0.5 transition-transform duration-150">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${delegationDots[index % delegationDots.length]} shrink-0 group-hover:scale-125 transition-transform duration-200`} />
                    <span className="font-semibold text-slate-700 truncate">{c.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 tabular-nums shrink-0">{c.count}</span>
                </div>
              ))}
            </div>

            <span className="text-[11px] text-slate-400 font-medium text-center border-t border-slate-100 pt-2">
              {totalRegistrations} Total Registered Attendees
            </span>
          </div>
        </section>

        {/* Bottom Section (Roster, Apple Watch Style Gauge, Time Tracker) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Col 1 (5 cols): Live Attendee Roster with Apple Segmented Control */}
          <div className="lg:col-span-5 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring flex flex-col justify-between h-72">
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 tracking-tight">Attendee Roster</span>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {filteredAttendees.length} Shown
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onDirectoryClick}
                    className="text-xs font-bold text-[#0F472A] hover:underline"
                  >
                    Full Directory →
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    CSV
                  </button>
                </div>
              </div>

              {/* Apple Pill Segmented Control */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg text-xs">
                {[
                  { key: "all", label: "All" },
                  { key: "pastors", label: "Pastors" },
                  { key: "members", label: "Members" },
                  { key: "checked_in", label: "Checked In" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      playHapticAudio();
                      setActiveFilterTab(tab.key as any);
                    }}
                    className={`flex-1 py-1 rounded-md font-bold text-[11px] transition-all duration-200 ease-apple-spring text-center active:scale-95 ${
                      activeFilterTab === tab.key
                        ? "bg-[#0F472A] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List Rows with Spring Interactive Touch Feedback */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-48 pr-1">
              {filteredAttendees.slice(0, 4).map((a) => {
                const isJustToggled = recentlyToggledId === a.id;
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all duration-200 ease-apple-spring border border-transparent hover:border-slate-200/60 hover:bg-slate-50/80 ${
                      isJustToggled ? "ring-2 ring-emerald-400/50 bg-emerald-50/40 scale-[1.01]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-transform duration-200 ${
                          a.isOrdained
                            ? "bg-purple-100 text-purple-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}
                      >
                        {a.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {a.fullName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {a.roleOffice} · {a.churchName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0F472A] bg-lime-100/90 border border-lime-200/60 px-2 py-0.5 rounded-md">
                        {a.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCheckIn(a.id)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full active:scale-90 transition-all duration-150 ease-apple-spring ${
                          a.checkedIn
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80 shadow-2xs"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200/80 shadow-2xs"
                        }`}
                      >
                        {a.checkedIn ? "Checked In" : "Check In"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col 2 (3 cols): Active Session Headcount (Uncapped Volume Focus) */}
          <div className="lg:col-span-3 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring flex flex-col justify-between h-72">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 tracking-tight">Session Headcount</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {currentSession.short}
              </span>
            </div>

            {/* Central Headcount Display */}
            <div className="flex flex-col items-center justify-center my-auto text-center py-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-[-0.05em] tabular-nums">
                {checkedInCount}
              </span>
              <span className="text-xs font-bold text-emerald-800 mt-1">
                Attendees Verified at Doors
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Venue: {currentSession.hall}
              </span>
            </div>

            {/* Ministerial & Delegate Breakdown without Cap */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-800 font-mono text-sm">{checkedInMinisters}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ministers</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex flex-col text-right">
                <span className="font-extrabold text-slate-800 font-mono text-sm">{checkedInDelegates}</span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Delegates</span>
              </div>
            </div>
          </div>

          {/* Col 3 (4 cols): 5-Session Attendance Tracker */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#0B3A23] via-[#0D3821] to-[#041D11] text-white rounded-2xl p-5 flex flex-col justify-between h-72 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring relative overflow-hidden border border-emerald-900/40 ring-1 ring-inset ring-white/10 group">
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-300 tracking-tight">{sessionList.length}-Session Programme Turnout</span>
                <span className="text-[10px] font-extrabold bg-[#A3E635] text-[#0F472A] px-1.5 py-0.2 rounded-full">
                  Live
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
            </div>

            <div className="flex flex-col gap-1.5 my-auto z-10">
              {sessionTurnoutStats.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#A3E635] text-[11px]">{s.short}</span>
                    <span className="font-medium text-emerald-100 text-xs truncate max-w-[170px]">{s.name}</span>
                  </div>
                  <span className="font-mono text-xs text-[#A3E635] font-extrabold tabular-nums bg-black/30 px-2 py-0.5 rounded-md border border-white/10 shrink-0">
                    {s.count} Present
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onSessionsClick}
              className="w-full h-8 bg-white/15 hover:bg-white/25 active:scale-[0.98] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 z-10 border border-white/15 shadow-2xs"
            >
              <span>Open Usher Mobile Desk →</span>
            </button>
          </div>
        </section>

        {/* Door Fast Check-in Command Bar with Apple Bounce Feedback */}
        <section className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0F472A] border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs">
              <QrCode className="w-5 h-5 text-[#0F472A]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 tracking-tight">Door Fast Check-in Desk</span>
              <span className="text-[11px] text-slate-400 font-medium">Type participant ID (e.g. EQ-29402) or phone to verify pass</span>
            </div>
          </div>

          <form onSubmit={handleFastScanSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <input
              type="text"
              value={fastScanId}
              onChange={(e) => setFastScanId(e.target.value)}
              placeholder="e.g. EQ-29402 or phone..."
              className="w-full h-9 px-3 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all duration-150 ease-apple-spring"
            />
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
              title="Open Camera QR Scanner"
            >
              <Camera className="w-3.5 h-3.5 text-[#0F472A]" />
              <span className="hidden sm:inline">Camera</span>
            </button>
            <button
              type="submit"
              className="h-9 px-4 bg-[#0F472A] hover:bg-[#165A36] active:scale-[0.96] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-150 ease-apple-spring shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          </form>

          {scanFeedback && (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-1 zoom-in-95 duration-200 ease-apple-bounce ${
                scanFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs"
                  : "bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{scanFeedback.message}</span>
            </div>
          )}
        </section>
      </main>

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
        onScan={(id) => verifyDashboardAttendee(id)}
        activeSessionName={`${activeEventMonthYear} · Fast Verification`}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />
    </div>
  );
}
