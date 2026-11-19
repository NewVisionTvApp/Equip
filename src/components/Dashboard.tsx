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
    key: "wed_pm",
    name: "Final Mantle Impartation & Commissioning",
    short: "Wed PM",
    day: "Day 3 · Grand Finale",
    time: "05:00 PM – 08:30 PM",
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

export default function Dashboard({ onRegisterClick }: { onRegisterClick?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionKey, setSelectedSessionKey] = useState("mon_pm");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "pastors" | "members" | "checked_in">("all");
  const [fastScanId, setFastScanId] = useState("");
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Attendees State with initial realistic statuses
  const [attendees, setAttendees] = useState(
    SEED_PARTICIPANTS.map((p, idx) => ({
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
    const match = attendees.find(
      (a) =>
        a.id.toUpperCase() === cleaned ||
        a.phone.includes(cleaned) ||
        a.fullName.toUpperCase().includes(cleaned)
    );

    if (match) {
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

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-900 flex p-4 lg:p-6 gap-6 font-sans antialiased selection:bg-[#A3E635] selection:text-[#0F472A]">
      {/* 1. LEFT SIDEBAR (Donezo Style: Rounded-2xl, crisp icons, dark green bottom card) */}
      <aside className="hidden lg:flex flex-col w-60 bg-white rounded-2xl p-5 justify-between border border-slate-200/70 shadow-xs shrink-0">
        <div className="flex flex-col gap-7">
          {/* Brand Header with real Equip 3.0 winged logo */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-[#0F472A] p-1.5 flex items-center justify-center shrink-0 shadow-xs">
              <img src="/logo.png" alt="Equip 3.0" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 tracking-tight">Equip 3.0</span>
              <span className="text-[11px] text-slate-400 font-medium">Church Suite</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                MENU
              </span>
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 bg-[#ECFDF5] text-[#065F46] rounded-xl font-semibold text-sm transition-colors text-left"
              >
                <LayoutDashboard className="w-4 h-4 text-[#065F46]" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-sm transition-colors text-left"
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
                className="flex items-center justify-between px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-sm transition-colors text-left"
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
                className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-sm transition-colors text-left"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Churches</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-sm transition-colors text-left"
              >
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Analytics</span>
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                GENERAL
              </span>
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-sm transition-colors text-left"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-sm transition-colors text-left"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Help</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-red-500" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Usher App Card (Matching Donezo "Download our Mobile App" aesthetic) */}
        <div className="bg-[#0A3D24] text-white rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-xs">
          {/* Subtle Organic Wave Texture */}
          <svg
            className="absolute -right-3 -bottom-3 w-28 h-28 text-white/10 pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="90" cy="90" r="30" />
            <circle cx="90" cy="90" r="50" />
            <circle cx="90" cy="90" r="70" />
          </svg>

          <div className="flex flex-col gap-1 z-10">
            <div className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#A3E635]" />
              <span className="text-xs font-bold text-white">Usher Mobile Desk</span>
            </div>
            <p className="text-[11px] text-emerald-200 leading-tight">
              Instant door badge scanning for active sessions.
            </p>
          </div>
          <button
            type="button"
            className="w-full h-8 bg-[#166534] hover:bg-[#15803d] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors z-10"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Launch Desk</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Top Header Bar (Donezo Search + User Pill) */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl px-6 py-3.5 border border-slate-200/70 shadow-xs gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search task, attendee, or EQ ID..."
              className="w-full h-10 pl-10 pr-12 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A] transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
              ⌘ F
            </span>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#84CC16] absolute top-2 right-2 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-200/60">
              <div className="w-9 h-9 rounded-full bg-[#0F472A] text-[#A3E635] flex items-center justify-center text-xs font-bold shadow-xs">
                PA
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">Pastor Admin</span>
                <span className="text-[11px] text-slate-400">admin@equipchurch.org</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Plan, prioritize, and track Equip 3.0 gathering attendance with ease.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRegisterClick}
              className="h-10 px-4 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Register Attendee</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Roster</span>
            </button>
          </div>
        </div>

        {/* Top 4 Stat Cards (Donezo Exact Layout: 1 Hero Dark Green Card + 3 Clean White Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Primary Dark Green Hero Card */}
          <div className="bg-[#0F472A] text-white rounded-2xl p-5 flex flex-col justify-between h-36 shadow-xs relative overflow-hidden group">
            {/* Subtle Donezo Wave Glow */}
            <svg
              className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 pointer-events-none"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <circle cx="80" cy="80" r="40" />
            </svg>

            <div className="flex justify-between items-center z-10">
              <span className="text-xs font-semibold text-[#86EFAC]">Total Registrations</span>
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="flex flex-col gap-1 z-10">
              <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                184
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-[#A3E635] text-[#0F472A] text-[10px] font-bold px-1.5 py-0.5 rounded">
                  +38
                </span>
                <span className="text-[11px] text-[#DCFCE7]">Registered this week</span>
              </div>
            </div>
          </div>

          {/* Card 2: Ordained Clergy */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between h-36">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">Ordained Clergy</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                72
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  39.1%
                </span>
                <span className="text-[11px] text-slate-400">Bishops & Pastors</span>
              </div>
            </div>
          </div>

          {/* Card 3: Church Delegations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between h-36">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">Members & Workers</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                112
              </span>
              <div className="flex items-center gap-1.5">
                <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  8 Churches
                </span>
                <span className="text-[11px] text-slate-400">Host & visiting delegations</span>
              </div>
            </div>
          </div>

          {/* Card 4: Session 2 Verified */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between h-36">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">{currentSession.short} Verified</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
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

        {/* Middle Section (Donezo 3-Column: Project Analytics, Reminders, Project List) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Col 1 (5 cols): Session Attendance (Donezo "Project Analytics") */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between h-64">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Session Attendance</span>
              <span className="text-[11px] font-semibold text-[#166534] bg-emerald-50 px-2 py-0.5 rounded-md">
                5 Sessions
              </span>
            </div>

            {/* Pillar Capsules */}
            <div className="flex items-end justify-between px-2 pt-2 h-44">
              {SESSIONS.map((s) => {
                const isSelected = selectedSessionKey === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSelectedSessionKey(s.key)}
                    className="flex flex-col items-center gap-2 group transition-all relative focus:outline-none"
                  >
                    {/* Floating Percentage Badge for Active Session (Donezo Style) */}
                    {isSelected && (
                      <div className="absolute -top-7 flex flex-col items-center animate-in fade-in zoom-in-90">
                        <span className="text-[10px] font-extrabold bg-[#0F472A] text-white px-1.5 py-0.5 rounded shadow-xs">
                          {s.percent}%
                        </span>
                        <div className="w-1.5 h-1.5 bg-[#0F472A] rotate-45 -mt-0.5" />
                      </div>
                    )}

                    {/* Capsule Bar */}
                    <div className="w-10 h-32 bg-slate-100 rounded-full flex flex-col justify-end p-1 transition-all group-hover:bg-slate-200/70">
                      <div
                        className={`w-full rounded-full transition-all duration-300 ${
                          isSelected
                            ? "bg-[#0F472A]"
                            : s.status === "Completed"
                            ? "bg-[#166534]/70"
                            : "bg-[#84CC16]/60"
                        }`}
                        style={{ height: `${s.percent}%` }}
                      />
                    </div>

                    <span
                      className={`text-[10px] font-semibold ${
                        isSelected ? "text-[#0F472A] font-bold" : "text-slate-500"
                      }`}
                    >
                      {s.short}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Col 2 (4 cols): Current Session Focus (Donezo "Reminders") */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between h-64">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                CURRENT SESSION
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {currentSession.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Time: {currentSession.time}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <Award className="w-3.5 h-3.5 text-[#0F472A]" />
                <span className="font-semibold text-slate-800">{currentSession.speaker}</span>
                <span className="text-slate-400">· {currentSession.hall}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-2.5 py-1.5 text-xs text-[#166534] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live door usher sync active</span>
              </div>
              <button
                type="button"
                className="w-full h-9 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch Session 2 Check-in</span>
              </button>
            </div>
          </div>

          {/* Col 3 (3 cols): Delegations List (Donezo "Project" List) */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between h-64">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Delegations</span>
              <span className="text-[11px] font-semibold text-[#0F472A] bg-lime-100 px-2 py-0.5 rounded-md">
                8 Churches
              </span>
            </div>

            <div className="flex flex-col gap-3 my-auto">
              {DELEGATIONS.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
                    <span className="font-medium text-slate-700 truncate">{c.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 tabular-nums shrink-0">{c.count}</span>
                </div>
              ))}
            </div>

            <span className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-2">
              184 Total Expected Attendees
            </span>
          </div>
        </section>

        {/* Bottom Section (Donezo 3-Column: Team Collaboration, Project Progress, Time Tracker) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Col 1 (5 cols): Live Attendee Roster (Donezo "Team Collaboration") */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between h-72">
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Attendee Roster</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {filteredAttendees.length} Shown
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="text-xs font-semibold text-[#166534] hover:underline"
                >
                  Export CSV →
                </button>
              </div>

              {/* Roster Filter Tabs */}
              <div className="flex items-center gap-1 text-xs">
                {[
                  { key: "all", label: "All" },
                  { key: "pastors", label: "Pastors" },
                  { key: "members", label: "Members" },
                  { key: "checked_in", label: "Checked In" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilterTab(tab.key as any)}
                    className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors ${
                      activeFilterTab === tab.key
                        ? "bg-[#0F472A] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List Rows */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-48 pr-1">
              {filteredAttendees.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
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
                      <span className="text-[11px] text-slate-500">
                        {a.roleOffice} · {a.churchName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0F472A] bg-lime-100 px-2 py-0.5 rounded-md">
                      {a.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCheckIn(a.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                        a.checkedIn
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      }`}
                    >
                      {a.checkedIn ? "Checked In" : "Check In"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 2 (3 cols): Turnout Progress Gauge (Donezo "Project Progress") */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs flex flex-col justify-between items-center text-center h-72">
            <div className="w-full text-left">
              <span className="text-sm font-bold text-slate-900">Project Progress</span>
            </div>

            {/* Half-Circle SVG Gauge (Donezo Green Arc) */}
            <div className="flex flex-col items-center justify-center my-auto">
              <svg width="160" height="85" viewBox="0 0 180 95" className="overflow-visible">
                {/* Track */}
                <path
                  d="M 15 90 A 75 75 0 0 1 165 90"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Donezo Dark Green Progress */}
                <path
                  d="M 15 90 A 75 75 0 0 1 155 52"
                  fill="none"
                  stroke="#0F472A"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-3xl font-extrabold text-slate-900 -mt-2 tracking-tight tabular-nums">
                {turnoutPercent}%
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Session Progress</span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-600">
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

          {/* Col 3 (4 cols): Time Tracker with 3D Wave Pattern (Donezo "Time Tracker") */}
          <div className="lg:col-span-4 bg-[#0D3821] text-white rounded-2xl p-5 flex flex-col justify-between h-72 shadow-xs relative overflow-hidden border border-emerald-900/40">
            {/* Donezo Exact 3D Wave Fluid Ribbons */}
            <svg
              className="absolute inset-0 w-full h-full text-[#A3E635]/15 pointer-events-none"
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
              <span className="text-xs font-semibold text-emerald-300">Time Tracker</span>
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
            </div>

            <div className="flex flex-col items-center justify-center my-auto gap-1 z-10">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-widest tabular-nums filter drop-shadow">
                {formatTimer(secondsRemaining)}
              </span>
              <span className="text-[11px] text-emerald-200">Main Auditorium Live</span>
            </div>

            <div className="flex items-center justify-center gap-3 z-10">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="w-10 h-10 rounded-full bg-white text-[#0D3821] hover:bg-emerald-50 flex items-center justify-center transition-all shadow-md active:scale-95"
                aria-label={isTimerRunning ? "Pause timer" : "Resume timer"}
              >
                {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => setSecondsRemaining(9910)}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-md active:scale-95"
                aria-label="Reset timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Door Fast Check-in Command Bar at Bottom */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0F472A] flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-[#0F472A]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Door Fast Check-in Desk</span>
              <span className="text-[11px] text-slate-400">Type participant ID (e.g. EQ-29402) or phone to verify pass</span>
            </div>
          </div>

          <form onSubmit={handleFastScanSubmit} className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <input
              type="text"
              value={fastScanId}
              onChange={(e) => setFastScanId(e.target.value)}
              placeholder="e.g. EQ-29402 or phone..."
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
            />
            <button
              type="submit"
              className="h-9 px-4 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          </form>

          {scanFeedback && (
            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                scanFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{scanFeedback.message}</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
