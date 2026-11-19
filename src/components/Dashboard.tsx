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
  Clock,
  Radio,
  Award,
  ChevronRight,
  Check,
  UserCheck,
  Smartphone,
} from "lucide-react";
import { SEED_PARTICIPANTS } from "@/db/seed-data";

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
    color: "#0F472A",
    barHeight: "h-24",
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
    color: "#166534",
    barHeight: "h-28",
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
    color: "#10B981",
    barHeight: "h-26",
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
    color: "#84CC16",
    barHeight: "h-32",
    status: "Upcoming",
  },
  {
    key: "wed_pm",
    name: "Final Mantle Impartation & Commissioning",
    short: "Wed PM",
    day: "Day 3 · Grand Finale",
    time: "05:00 PM – 08:30 PM",
    speaker: "Presiding Apostolic Council",
    hall: "Main Auditorium",
    checkedIn: 178,
    total: 184,
    color: "#0F472A",
    barHeight: "h-36",
    status: "Upcoming",
  },
];

// Delegation breakdown
const DELEGATIONS = [
  { name: "Grace Covenant Sanctuary (Host)", count: 68, pastors: 24, percent: 100, color: "bg-[#0F472A]" },
  { name: "Faith Apostolic Church", count: 34, pastors: 16, percent: 88, color: "bg-[#166534]" },
  { name: "Living Streams Assembly", count: 28, pastors: 12, percent: 75, color: "bg-[#84CC16]" },
  { name: "Redeemed Glory Center", count: 22, pastors: 10, percent: 82, color: "bg-emerald-500" },
  { name: "Christ Ambassadors Fellowship", count: 18, pastors: 6, percent: 67, color: "bg-teal-600" },
  { name: "Independent Visiting Ministers", count: 14, pastors: 4, percent: 71, color: "bg-lime-600" },
];

export default function Dashboard({ onRegisterClick }: { onRegisterClick?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionKey, setSelectedSessionKey] = useState("mon_pm");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "pastors" | "members" | "checked_in" | "pending">("all");
  const [fastScanId, setFastScanId] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Attendees State with initial realistic statuses
  const [attendees, setAttendees] = useState(
    SEED_PARTICIPANTS.map((p, idx) => ({
      ...p,
      checkedIn: idx < 7,
      checkedInAt: idx < 7 ? `08:${40 + (idx * 3)} AM` : null,
      isOrdained: p.roleOffice.toLowerCase().includes("pastor") ||
                  p.roleOffice.toLowerCase().includes("bishop") ||
                  p.roleOffice.toLowerCase().includes("reverend") ||
                  p.roleOffice.toLowerCase().includes("minister") ||
                  p.roleOffice.toLowerCase().includes("apostle"),
    }))
  );

  // Active Session Object
  const currentSession = useMemo(
    () => SESSIONS.find((s) => s.key === selectedSessionKey) || SESSIONS[1],
    [selectedSessionKey]
  );

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

  // Filter attendees by Tab & Search
  const filteredAttendees = useMemo(() => {
    return attendees.filter((a) => {
      // Tab filter
      if (activeFilterTab === "pastors" && !a.isOrdained) return false;
      if (activeFilterTab === "members" && a.isOrdained) return false;
      if (activeFilterTab === "checked_in" && !a.checkedIn) return false;
      if (activeFilterTab === "pending" && a.checkedIn) return false;

      // Query filter
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

  // Toggle Check In with smooth timestamp
  const toggleCheckIn = (id: string) => {
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
    const match = attendees.find((a) => a.id.toUpperCase() === cleaned || a.phone.includes(cleaned) || a.fullName.toUpperCase().includes(cleaned));

    if (match) {
      if (match.checkedIn) {
        setScanFeedback({
          message: `${match.fullName} (${match.id}) is ALREADY verified!`,
          type: "success",
        });
      } else {
        toggleCheckIn(match.id);
        setScanFeedback({
          message: `SUCCESS: ${match.fullName} (${match.roleOffice}) checked in!`,
          type: "success",
        });
      }
      setFastScanId("");
    } else {
      setScanFeedback({
        message: `No participant found matching "${fastScanId}". Check ID or register new.`,
        type: "error",
      });
    }

    setTimeout(() => setScanFeedback(null), 4000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Unique ID", "Full Name", "Phone", "Email", "Church", "Role / Office", "Location", "Checked In", "Check-in Time"];
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
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `equip_3.0_roster_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic calculated stats
  const totalRegistered = 184;
  const checkedInCount = currentSession.checkedIn;
  const turnoutPercent = Math.round((checkedInCount / totalRegistered) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex p-3 sm:p-5 md:p-6 gap-6 font-sans antialiased selection:bg-[#A3E635] selection:text-[#0F472A]">
      {/* 1. LEFT SIDEBAR (Donezo + Apple Aesthetic) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white rounded-3xl p-6 justify-between border border-slate-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
        <div className="flex flex-col gap-8">
          {/* Brand Header with real Equip 3.0 winged logo */}
          <div className="flex items-center gap-3.5 px-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#064E3B] to-[#022C22] p-2 flex items-center justify-center shrink-0 shadow-md ring-1 ring-white/20">
              <img src="/logo.png" alt="Equip 3.0" className="w-full h-full object-contain filter drop-shadow" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">Equip 3.0</span>
                <span className="text-[9px] font-extrabold bg-[#A3E635]/30 text-[#0F472A] border border-[#A3E635] px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Programme Admin Suite</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                MENU
              </span>
              <button
                type="button"
                className="flex items-center gap-3 px-3.5 py-2.5 bg-[#0F472A] text-white rounded-2xl font-semibold text-sm shadow-sm transition-all text-left group"
              >
                <LayoutDashboard className="w-4 h-4 text-[#A3E635] group-hover:scale-110 transition-transform" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className="flex items-center justify-between px-3.5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-2xl font-medium text-sm transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Attendees</span>
                </div>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  184
                </span>
              </button>

              <button
                type="button"
                className="flex items-center justify-between px-3.5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-2xl font-medium text-sm transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>5 Sessions</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-2xl font-medium text-sm transition-colors text-left"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Churches</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-2xl font-medium text-sm transition-colors text-left"
              >
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Analytics</span>
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                ADMINISTRATION
              </span>
              <button
                type="button"
                className="flex items-center gap-3 px-3.5 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-2xl font-medium text-sm transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3.5 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-2xl font-medium text-sm transition-colors text-left"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help Center</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-2xl font-medium text-sm transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Usher Desk Launch Card (High-end Emerald Surface) */}
        <div className="bg-gradient-to-br from-[#072B19] via-[#0F472A] to-[#041D11] rounded-2xl p-4 text-white flex flex-col gap-3 shadow-lg relative overflow-hidden border border-emerald-900/60">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#A3E635]/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-[#A3E635]" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">Usher Terminal</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
          </div>
          <p className="text-[11px] text-emerald-200/90 leading-relaxed z-10">
            Instant door badge scanning & badge accreditation desk.
          </p>
          <button
            type="button"
            className="w-full h-8 bg-gradient-to-r from-[#166534] to-[#15803d] hover:brightness-110 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 z-10"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Launch Scanner</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-3xl px-6 py-3.5 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] gap-4">
          {/* Search Bar with instant shortcut */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search participant, church, or EQ ID..."
              className="w-full h-10 pl-10 pr-16 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A] focus:bg-white transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-2xs">
                ⌘ K
              </span>
            </div>
          </div>

          {/* Right Header Controls & Profile */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            {/* Live Door Sync Status */}
            <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-[#166534] border border-emerald-200/60 rounded-full px-3 py-1 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>3 Door Terminals Syncing</span>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 relative transition-colors shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16] absolute top-2 right-2 ring-2 ring-white" />
            </button>

            {/* Pastor Admin Identity */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0F472A] to-[#166534] text-[#A3E635] flex items-center justify-center text-xs font-black shadow-sm ring-2 ring-emerald-50">
                PA
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-900 leading-tight">Pastor Admin</span>
                  <Award className="w-3 h-3 text-[#0F472A]" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Head of Registration</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0F472A] bg-lime-100/80 border border-lime-300/60 px-2.5 py-0.5 rounded-full">
                {currentSession.day}
              </span>
              <span className="text-xs text-slate-400 font-medium">·</span>
              <span className="text-xs font-semibold text-slate-500">Live Gathering Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Equip 3.0 Programme Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRegisterClick}
              className="h-10 px-5 bg-gradient-to-r from-[#0F472A] to-[#166534] hover:brightness-110 text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-emerald-950/10 hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register Attendee</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Fast Door Check-in Command Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-lime-50 text-[#0F472A] border border-lime-200/60 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-[#0F472A]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Door Fast Check-in Desk</span>
              <span className="text-[11px] text-slate-400">Type ID or scan participant pass to verify arrival</span>
            </div>
          </div>

          <form onSubmit={handleFastScanSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-lg">
            <div className="relative flex-1">
              <input
                type="text"
                value={fastScanId}
                onChange={(e) => setFastScanId(e.target.value)}
                placeholder="e.g. EQ-29402 or participant phone/name..."
                className="w-full h-10 pl-3.5 pr-20 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A] font-mono"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-sans font-medium">
                Press Enter ↵
              </span>
            </div>
            <button
              type="submit"
              className="h-10 px-4 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Verify Pass</span>
            </button>
          </form>

          {/* Feedback banner */}
          {scanFeedback && (
            <div
              className={`w-full md:w-auto px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
                scanFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{scanFeedback.message}</span>
            </div>
          )}
        </div>

        {/* 4 Stat Cards Row (Elevated with Donezo Gradients & Apple Craft) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Primary Dark Green Hero Card (Donezo Style with Topography Glow) */}
          <div className="bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#022C22] rounded-3xl p-5 text-white flex flex-col justify-between h-40 shadow-md shadow-emerald-950/15 relative overflow-hidden group hover:shadow-lg transition-all">
            {/* Background SVG Wave Ribbon (Donezo Reference) */}
            <svg
              className="absolute -right-6 -bottom-6 w-44 h-44 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700"
              viewBox="0 0 200 200"
              fill="currentColor"
            >
              <path d="M42.7,-62.9C53.8,-52.9,60.2,-38.7,66.1,-23.7C72,-8.7,77.5,7.1,73.4,20.8C69.3,34.5,55.6,46.1,41.2,55.6C26.8,65,11.8,72.3,-4.2,78C-20.2,83.7,-37.2,87.8,-49.8,80.1C-62.4,72.4,-70.6,52.8,-74.6,34C-78.7,15.2,-78.6,-2.8,-73.4,-19C-68.2,-35.1,-58,-49.4,-44.6,-58.8C-31.2,-68.2,-14.7,-72.7,0.8,-73.8C16.3,-74.9,31.6,-72.9,42.7,-62.9Z" transform="translate(100 100)" />
            </svg>

            <div className="flex justify-between items-center z-10">
              <span className="text-xs font-semibold text-[#86EFAC] tracking-wide">
                Total Gathering Delegates
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
                  184
                </span>
                <span className="text-xs text-emerald-200 font-medium">/ 200 Max Capacity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#A3E635] text-[#064E3B] text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                  +38 This Week
                </span>
                <span className="text-[11px] text-[#DCFCE7] font-medium">92% Target Reached</span>
              </div>
            </div>
          </div>

          {/* Card 2: Pastors & Ministers (Clergy Leadership) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between h-40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0F472A]" />
                <span className="text-xs font-semibold text-slate-500">Pastors & Ministers</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                72
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span className="font-semibold text-[#0F472A]">39.1% Ordained Clergy</span>
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  VIP Passes
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Church Members & Workers */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between h-40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-500">Delegations & Workers</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                112
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>8 Participating Churches</span>
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                  General Passes
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Live Check-in for Selected Session */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between h-40">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-500 truncate">
                  {currentSession.short} Verified
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                  {currentSession.checkedIn}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ 184</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-emerald-700 font-bold">{turnoutPercent}% Verified Arrival</span>
                <span className="text-amber-600 font-semibold">{totalRegistered - currentSession.checkedIn} Pending</span>
              </div>
            </div>
          </div>
        </section>

        {/* Middle Section: 5 Sessions Pillar Chart & Current Hall Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pillar Chart: 5 Sessions Interactive Attendance View */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Attendance Across 5 Programme Sessions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any session pillar to inspect attendance details
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F472A] bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-xl">
                  {currentSession.status}
                </span>
              </div>
            </div>

            {/* Pillar Bars with interactive hover & active state */}
            <div className="grid grid-cols-5 gap-3 sm:gap-4 items-end pt-8 pb-3 h-52 px-2">
              {SESSIONS.map((s) => {
                const isSelected = selectedSessionKey === s.key;
                const percentage = Math.round((s.checkedIn / totalRegistered) * 100);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSelectedSessionKey(s.key)}
                    className="flex flex-col items-center gap-2 group transition-all text-center focus:outline-none"
                  >
                    <span
                      className={`text-xs font-bold tabular-nums transition-colors ${
                        isSelected ? "text-[#0F472A] scale-110" : "text-slate-500 group-hover:text-slate-800"
                      }`}
                    >
                      {s.checkedIn}
                    </span>

                    {/* Pillar Tube */}
                    <div className="w-full max-w-[48px] h-36 bg-slate-100/80 rounded-2xl p-1 flex flex-col justify-end transition-all group-hover:bg-slate-200/60">
                      <div
                        className={`w-full rounded-xl transition-all duration-500 shadow-sm ${
                          isSelected
                            ? "bg-gradient-to-t from-[#064E3B] to-[#84CC16] ring-2 ring-[#0F472A]/30"
                            : "bg-[#0F472A]/85 hover:bg-[#0F472A]"
                        }`}
                        style={{ height: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex flex-col items-center">
                      <span
                        className={`text-xs font-bold transition-colors ${
                          isSelected ? "text-[#0F472A]" : "text-slate-700"
                        }`}
                      >
                        {s.short}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{percentage}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pillar Legend & Active Session Highlight */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#0F472A] to-[#84CC16]" />
                  <span>Selected Session</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span>Capacity Gap (184 Total)</span>
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">Equip 3.0 Real-time Log</span>
            </div>
          </div>

          {/* Current Active Session Card & Lead Speaker Plenary */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#0F472A] bg-lime-100/90 border border-lime-300/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  SESSION FOCUS
                </span>
                <span className="text-xs text-slate-400 font-medium">{currentSession.hall}</span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {currentSession.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentSession.time}</span>
                </p>
              </div>

              {/* Minister in Charge */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F472A] to-[#166534] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {currentSession.speaker.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">{currentSession.speaker}</span>
                    <span className="text-[11px] text-slate-500 font-medium">Session Minister & Presider</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Confirmed
                </span>
              </div>
            </div>

            {/* Quick Live Session Usher Action */}
            <div className="flex flex-col gap-2.5 pt-4">
              <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-emerald-900">Live Hall Sync Active</span>
                </span>
                <span className="font-bold text-slate-900">{currentSession.checkedIn} in Sanctuary</span>
              </div>

              <button
                type="button"
                className="w-full h-11 bg-gradient-to-r from-[#0F472A] to-[#166534] hover:brightness-110 text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Open {currentSession.short} Door Check-in View</span>
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Section: Roster Table, Turnout Semi-circle Gauge, Session Countdown */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Recent Attendees Roster with Filter Tabs */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Live Attendee Roster
                  </h3>
                  <span className="text-[11px] font-extrabold bg-[#0F472A] text-[#A3E635] px-2 py-0.5 rounded-full">
                    {filteredAttendees.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="text-xs font-bold text-[#0F472A] hover:underline flex items-center gap-1"
                >
                  <span>Export CSV</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { key: "all", label: "All (184)" },
                  { key: "pastors", label: "Pastors (72)" },
                  { key: "members", label: "Members (112)" },
                  { key: "checked_in", label: "Checked In (148)" },
                  { key: "pending", label: "Pending (36)" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilterTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs shrink-0 ${
                      activeFilterTab === tab.key
                        ? "bg-[#0F472A] text-white shadow-xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendee List Cards */}
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[300px] pr-1">
              {filteredAttendees.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-slate-50/60 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        a.isOrdained
                          ? "bg-purple-100 text-purple-900 border border-purple-200"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      }`}
                    >
                      {a.fullName.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                          {a.fullName}
                        </span>
                        {a.isOrdained && (
                          <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded uppercase">
                            Clergy
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                        {a.roleOffice} · {a.churchName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="font-mono text-xs font-bold text-[#0F472A] bg-lime-100/90 border border-lime-300/60 px-2 py-0.5 rounded-lg">
                        {a.id}
                      </span>
                      {a.checkedInAt && (
                        <span className="text-[10px] text-slate-400 mt-0.5">At {a.checkedInAt}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCheckIn(a.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs ${
                        a.checkedIn
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300/60"
                          : "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300/60"
                      }`}
                    >
                      {a.checkedIn ? "Checked In" : "Check In"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Turnout Donut / Semi-Circle Completion Gauge (Donezo Reference) */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between items-center text-center">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Turnout Completion</span>
              <span className="text-[11px] font-bold text-[#0F472A] bg-lime-100 px-2 py-0.5 rounded-full">
                {currentSession.short}
              </span>
            </div>

            {/* Semi-Circular SVG Gauge */}
            <div className="flex flex-col items-center justify-center my-auto py-2">
              <svg width="170" height="95" viewBox="0 0 180 95" className="overflow-visible">
                <path
                  d="M 15 90 A 75 75 0 0 1 165 90"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <path
                  d="M 15 90 A 75 75 0 0 1 150 45"
                  fill="none"
                  stroke="url(#gauge-emerald-lime)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gauge-emerald-lime" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0F472A" />
                    <stop offset="100%" stopColor="#84CC16" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="flex flex-col items-center -mt-3">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                  {turnoutPercent}%
                </span>
                <span className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  {currentSession.checkedIn} of {totalRegistered} Verified
                </span>
              </div>
            </div>

            {/* Gauge Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F472A]" />
                <span>Verified ({currentSession.checkedIn})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Pending ({totalRegistered - currentSession.checkedIn})</span>
              </div>
            </div>
          </div>

          {/* Session Countdown Timer (Donezo Reference Wave Card) */}
          <div className="lg:col-span-3 bg-gradient-to-br from-[#06381E] via-[#0B2E1A] to-[#041D11] rounded-3xl p-6 text-white flex flex-col justify-between shadow-md shadow-emerald-950/20 relative overflow-hidden border border-emerald-900/60">
            {/* 3D Wave Topology Background like Donezo Time Tracker */}
            <svg
              className="absolute inset-0 w-full h-full text-[#A3E635]/10 pointer-events-none"
              viewBox="0 0 300 300"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M -50,150 Q 75,50 150,150 T 350,150" />
              <path d="M -50,180 Q 75,80 150,180 T 350,180" />
              <path d="M -50,210 Q 75,110 150,210 T 350,210" />
              <path d="M -50,240 Q 75,140 150,240 T 350,240" />
              <path d="M -50,270 Q 75,170 150,270 T 350,270" />
            </svg>

            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
                <span className="text-xs font-extrabold text-[#A3E635] tracking-widest uppercase">
                  ACTIVE SESSION
                </span>
              </div>
              <span className="text-[10px] font-bold bg-white/10 text-emerald-200 border border-white/15 px-2 py-0.5 rounded-full">
                HALL LIVE
              </span>
            </div>

            <div className="flex flex-col items-center justify-center my-auto gap-1 z-10">
              <span className="text-[10px] text-emerald-300/80 font-bold tracking-widest uppercase">
                ESTIMATED CONCLUDING IN
              </span>
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-widest tabular-nums filter drop-shadow">
                {formatTimer(secondsRemaining)}
              </span>
              <span className="text-[11px] text-emerald-200 font-medium">Main Sanctuary Overflow Open</span>
            </div>

            <div className="flex items-center justify-center gap-3 z-10">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#166534] to-[#15803d] hover:brightness-110 flex items-center justify-center text-white transition-all shadow-md active:scale-95"
                aria-label={isTimerRunning ? "Pause session timer" : "Resume session timer"}
              >
                {isTimerRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                type="button"
                onClick={() => setSecondsRemaining(10800)}
                className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all active:scale-95"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Church Delegations Leaderboard */}
        <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Participating Church Delegations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Attendance quota & minister presence breakdown across host & visiting congregations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F472A] bg-lime-100 border border-lime-300/60 px-3 py-1 rounded-full">
                8 Partner Ministries
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {DELEGATIONS.map((del) => (
              <div
                key={del.name}
                className="bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${del.color} shrink-0`} />
                    <span className="text-xs font-bold text-slate-800 truncate">{del.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 tabular-nums shrink-0">
                    {del.count} delegates
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${del.color} rounded-full transition-all duration-500`}
                      style={{ width: `${del.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{del.pastors} Ordained Ministers</span>
                    <span className="font-bold text-slate-700">{del.percent}% Checked In</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
