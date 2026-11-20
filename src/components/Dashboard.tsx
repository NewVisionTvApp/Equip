import { useState, useEffect, useMemo } from "react";
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
  Pause,
  RotateCcw,
  Download,
  CheckCircle2,
  Award,
  Check,
  Smartphone,
  Sparkles,
  Pencil,
} from "lucide-react";
import { SEED_PARTICIPANTS } from "@/db/seed-data";
import { SessionConfig } from "@/lib/store";
import EditSessionModal from "./EditSessionModal";

// The 5 Gathering Sessions
const SESSIONS = [
  {
    key: "mon_am",
    name: "Keynote Impartation & Vision Casting",
    short: "Mon AM",
    day: "Day 1 · Morning",
    time: "09:00 AM – 12:30 PM",
    speaker: "Apostle J. Mensah",
    hall: "Main Auditorium",
    checkedIn: 148,
    total: 184,
    percent: 80,
    status: "Completed",
  },
  {
    key: "mon_pm",
    name: "Evening Anointing & Deliverance Plenary",
    short: "Mon PM",
    day: "Day 1 · Evening",
    time: "05:30 PM – 08:30 PM",
    speaker: "Bishop David O.",
    hall: "Main Auditorium",
    checkedIn: 162,
    total: 184,
    percent: 88,
    status: "Active Now",
  },
  {
    key: "tue_am",
    name: "Pastoral Governance & Ministry Ethics",
    short: "Tue AM",
    day: "Day 2 · Morning",
    time: "09:00 AM – 12:30 PM",
    speaker: "Rev. Dr. Grace E.",
    hall: "Synod Hall A",
    checkedIn: 154,
    total: 184,
    percent: 84,
    status: "Upcoming",
  },
  {
    key: "tue_pm",
    name: "Signs, Wonders & Leadership Mantle",
    short: "Tue PM",
    day: "Day 2 · Evening",
    time: "05:30 PM – 08:30 PM",
    speaker: "Pastor Samuel K.",
    hall: "Main Auditorium",
    checkedIn: 170,
    total: 184,
    percent: 92,
    status: "Upcoming",
  },
  {
    key: "wed_am",
    name: "Final Mantle Impartation & Commissioning",
    short: "Wed AM",
    day: "Day 3 · Morning",
    time: "09:00 AM – 01:00 PM",
    speaker: "Presiding Apostolic Council",
    hall: "Main Auditorium",
    checkedIn: 178,
    total: 184,
    percent: 97,
    status: "Upcoming",
  },
];

// Delegation breakdown
const DELEGATIONS = [
  { name: "Grace Covenant (Host)", count: 68, dot: "bg-[#0F472A]", type: "Host Ministry" },
  { name: "Faith Apostolic Church", count: 34, dot: "bg-[#166534]", type: "Visiting Delegation" },
  { name: "Living Streams Assembly", count: 28, dot: "bg-[#84CC16]", type: "Visiting Delegation" },
  { name: "Redeemed Glory Center", count: 22, dot: "bg-emerald-500", type: "Visiting Delegation" },
];

interface DashboardProps {
  onRegisterClick?: () => void;
  onDirectoryClick?: () => void;
  onSessionsClick?: () => void;
  onOpenEventModal?: () => void;
  activeEventName?: string;
  activeEventTheme?: string;
  activeEventMonthYear?: string;
  totalRegistrations?: number;
  ordainedCount?: number;
  attendeesData?: any[];
  sessionsData?: SessionConfig[];
  onUpdateSession?: (sessionKey: string, sessionData: Partial<SessionConfig>) => void;
}

export default function Dashboard({
  onRegisterClick,
  onDirectoryClick,
  onSessionsClick,
  onOpenEventModal,
  activeEventTheme = "Apostolic Mantles & Spiritual Leadership",
  activeEventMonthYear = "December 2026",
  totalRegistrations,
  ordainedCount,
  attendeesData,
  sessionsData,
  onUpdateSession,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionKey, setSelectedSessionKey] = useState("mon_pm");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "pastors" | "members" | "checked_in">("all");
  const [fastScanId, setFastScanId] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [recentlyToggledId, setRecentlyToggledId] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<SessionConfig | null>(null);

  // Attendees State with initial realistic statuses (using attendeesData when available)
  const [attendees, setAttendees] = useState(() =>
    attendeesData && attendeesData.length > 0
      ? attendeesData.map((a, idx) => ({
          ...a,
          checkedIn: idx < 7,
          checkedInAt: idx < 7 ? `08:${40 + (idx * 3)} AM` : null,
        }))
      : SEED_PARTICIPANTS.map((p, idx) => ({
          ...p,
          checkedIn: idx < 7,
          checkedInAt: idx < 7 ? `08:${40 + (idx * 3)} AM` : null,
          isOrdained:
            p.roleOffice.toLowerCase().includes("pastor") ||
            p.roleOffice.toLowerCase().includes("bishop") ||
            p.roleOffice.toLowerCase().includes("reverend") ||
            p.roleOffice.toLowerCase().includes("minister") ||
            p.roleOffice.toLowerCase().includes("apostle"),
        }))
  );

  // Active Session Object (dynamically reflects admin configured preachers & topics)
  const sessionList = useMemo(() => {
    if (sessionsData && sessionsData.length > 0) {
      return sessionsData.map((s, idx) => {
        const matchingSeed = SESSIONS[idx] || SESSIONS[0];
        return {
          ...matchingSeed,
          ...s,
        };
      });
    }
    return SESSIONS;
  }, [sessionsData]);

  const currentSession = useMemo(
    () => sessionList.find((s) => s.key === selectedSessionKey) || sessionList[1],
    [sessionList, selectedSessionKey]
  );

  // Dynamic delegation counts from registered attendees
  const delegationsList = useMemo(() => {
    const counts: Record<string, number> = {};
    attendees.forEach((a) => {
      counts[a.churchName] = (counts[a.churchName] || 0) + 1;
    });

    const dots = ["bg-[#0F472A]", "bg-[#166534]", "bg-[#84CC16]", "bg-emerald-500", "bg-lime-600"];
    const entries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        dot: dots[idx % dots.length],
        type: name.includes("Host") ? "Host Ministry" : "Visiting Delegation",
      }));

    return entries.length > 0 ? entries : DELEGATIONS;
  }, [attendees]);

  // Timer State (Countdown to session end or next event)
  const [secondsRemaining, setSecondsRemaining] = useState(9910); // 02:45:10
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Subtle Apple Audio feedback (synthesized lightweight pop)
  const playHapticAudio = () => {
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

    setAttendees((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const newStatus = !a.checkedIn;
          return {
            ...a,
            checkedIn: newStatus,
            checkedInAt: newStatus
              ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : null,
          };
        }
        return a;
      })
    );
  };

  // Fast Door Scan handler
  const handleFastScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastScanId.trim()) return;

    const cleaned = fastScanId.trim().toUpperCase();
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
        message: `No participant matching "${fastScanId}". Check ID or register new.`,
        type: "error",
      });
    }

    setTimeout(() => setScanFeedback(null), 3500);
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

  const totalRegistered = 184;
  const checkedInCount = currentSession.checkedIn;
  const turnoutPercent = Math.round((checkedInCount / totalRegistered) * 100);

  // Apple Watch style gauge parameters
  // Semi-circle arc length for radius 70 = Math.PI * 70 ≈ 220
  const arcLength = 220;
  const arcOffset = arcLength - (arcLength * turnoutPercent) / 100;

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
                  184
                </span>
              </button>

              <button
                type="button"
                onClick={onSessionsClick}
                className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl font-medium text-sm active:scale-[0.97] transition-all duration-150 ease-apple-spring text-left group"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  <span>5 Sessions</span>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                  Active
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
              <span>3 Terminals Synced</span>
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
                PA
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">Pastor Admin</span>
                <span className="text-[11px] text-slate-400">admin@equipchurch.org</span>
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
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Active Programme: <strong className="text-slate-700">{activeEventTheme}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
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
                {totalRegistrations !== undefined ? totalRegistrations : 184}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-[#A3E635] text-[#0F472A] text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                  Active
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
                {ordainedCount !== undefined ? ordainedCount : 72}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {totalRegistrations ? `${Math.round(((ordainedCount ?? 72) / totalRegistrations) * 100)}%` : "39.1%"}
                </span>
                <span className="text-[11px] text-slate-400">Bishops & Pastors</span>
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
                112
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  8 Churches
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
                {currentSession.checkedIn}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {turnoutPercent}%
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Verified arrival</span>
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
                5 Sessions
              </span>
            </div>

            {/* Pillar Capsules with Spring Hover Lifts */}
            <div className="flex items-end justify-between px-2 pt-2 h-44">
              {SESSIONS.map((s) => {
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
                        <span className="text-[10px] font-extrabold bg-[#0F472A] text-white px-2 py-0.5 rounded-full shadow-xs">
                          {s.percent}%
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
                            : s.status === "Completed"
                            ? "bg-[#166534]/70"
                            : "bg-[#84CC16]/70"
                        }`}
                        style={{ height: `${s.percent}%` }}
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
                  CURRENT SESSION
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
                <span>Launch Session 2 Check-in</span>
              </button>
            </div>
          </div>

          {/* Col 3 (3 cols): Delegations List */}
          <div className="lg:col-span-3 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring flex flex-col justify-between h-64">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900 tracking-tight">Delegations</span>
              <span className="text-[11px] font-bold text-[#0F472A] bg-lime-100 border border-lime-200/60 px-2 py-0.5 rounded-md">
                {delegationsList.length} Churches
              </span>
            </div>

            <div className="flex flex-col gap-3 my-auto">
              {delegationsList.slice(0, 4).map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs group cursor-pointer hover:translate-x-0.5 transition-transform duration-150">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0 group-hover:scale-125 transition-transform duration-200`} />
                    <span className="font-semibold text-slate-700 truncate">{c.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 tabular-nums shrink-0">{c.count}</span>
                </div>
              ))}
            </div>

            <span className="text-[11px] text-slate-400 font-medium text-center border-t border-slate-100 pt-2">
              {totalRegistrations ?? attendees.length} Total Registered Attendees
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

          {/* Col 2 (3 cols): Turnout Progress Gauge (Apple Watch Style Arc Sweeping Transition) */}
          <div className="lg:col-span-3 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200/60 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring flex flex-col justify-between items-center text-center h-72">
            <div className="w-full text-left">
              <span className="text-sm font-bold text-slate-900 tracking-tight">Project Progress</span>
            </div>

            {/* Apple Watch Fluid Arc Gauge */}
            <div className="flex flex-col items-center justify-center my-auto relative">
              <svg width="160" height="90" viewBox="0 0 180 95" className="overflow-visible">
                {/* Background Track */}
                <path
                  d="M 15 90 A 75 75 0 0 1 165 90"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="15"
                  strokeLinecap="round"
                />
                {/* Dynamic Spring Progress Arc */}
                <path
                  d="M 15 90 A 75 75 0 0 1 165 90"
                  fill="none"
                  stroke="url(#apple-gauge-gradient)"
                  strokeWidth="15"
                  strokeLinecap="round"
                  strokeDasharray={arcLength}
                  strokeDashoffset={arcOffset}
                  className="transition-[stroke-dashoffset] duration-700 ease-apple-spring"
                />
                <defs>
                  <linearGradient id="apple-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0F472A" />
                    <stop offset="100%" stopColor="#84CC16" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="flex flex-col items-center -mt-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-[-0.04em] tabular-nums">
                  {turnoutPercent}%
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">Session Progress</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F472A]" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Pending</span>
              </div>
            </div>
          </div>

          {/* Col 3 (4 cols): Time Tracker with Fluid Topographic Wave Motion */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#0B3A23] via-[#0D3821] to-[#041D11] text-white rounded-2xl p-5 flex flex-col justify-between h-72 shadow-apple-card hover:shadow-apple-card-hover transition-all duration-300 ease-apple-spring relative overflow-hidden border border-emerald-900/40 ring-1 ring-inset ring-white/10 group">
            {/* Apple 3D Wave Ribbons with gentle hover shift */}
            <svg
              className="absolute inset-0 w-full h-full text-[#A3E635]/15 pointer-events-none group-hover:scale-105 transition-transform duration-700 ease-apple-spring"
              viewBox="0 0 300 300"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M -40,160 Q 60,60 160,160 T 360,160" />
              <path d="M -40,190 Q 60,90 160,190 T 360,190" />
              <path d="M -40,220 Q 60,120 160,220 T 360,220" />
              <path d="M -40,250 Q 60,150 160,250 T 360,250" />
            </svg>

            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-300 tracking-tight">Time Tracker</span>
                <Sparkles className="w-3 h-3 text-[#A3E635]" />
              </div>
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
            </div>

            <div className="flex flex-col items-center justify-center my-auto gap-1 z-10">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-widest tabular-nums filter drop-shadow">
                {formatTimer(secondsRemaining)}
              </span>
              <span className="text-[11px] text-emerald-200/90 font-medium">Main Auditorium Live</span>
            </div>

            <div className="flex items-center justify-center gap-3 z-10">
              <button
                type="button"
                onClick={() => {
                  playHapticAudio();
                  setIsTimerRunning(!isTimerRunning);
                }}
                className="w-10 h-10 rounded-full bg-white text-[#0D3821] hover:bg-emerald-50 active:scale-90 flex items-center justify-center transition-all duration-150 ease-apple-spring shadow-md"
                aria-label={isTimerRunning ? "Pause timer" : "Resume timer"}
              >
                {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  playHapticAudio();
                  setSecondsRemaining(9910);
                }}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 active:scale-90 flex items-center justify-center text-white transition-all duration-150 ease-apple-spring shadow-md"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
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
    </div>
  );
}
