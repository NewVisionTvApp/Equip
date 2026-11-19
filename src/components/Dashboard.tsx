import { useState } from "react";
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
  Square,
  Download,
} from "lucide-react";
import { SEED_PARTICIPANTS } from "@/db/seed-data";

export default function Dashboard({ onRegisterClick }: { onRegisterClick?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSession, setSelectedSession] = useState("mon_am");
  const [attendees, setAttendees] = useState(
    SEED_PARTICIPANTS.map((p, idx) => ({
      ...p,
      checkedIn: idx < 7, // 7 out of 10 checked in initially
    }))
  );
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Filter attendees by search query
  const filteredAttendees = attendees.filter(
    (a) =>
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.churchName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCheckIn = (id: string) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === id ? { ...a, checkedIn: !a.checkedIn } : a))
    );
  };

  const handleExportCSV = () => {
    const headers = ["Unique ID", "Full Name", "Phone", "Email", "Church", "Role", "Location", "Checked In"];
    const rows = attendees.map((a) => [
      a.id,
      `"${a.fullName}"`,
      a.phone,
      a.email,
      `"${a.churchName}"`,
      a.roleOffice,
      `"${a.location}"`,
      a.checkedIn ? "Yes" : "No",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `equip_roster_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-900 flex p-4 md:p-6 gap-6 font-sans antialiased">
      {/* 1. LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white rounded-2xl p-6 justify-between border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex flex-col gap-7">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-[#0F472A] flex items-center justify-center shrink-0 shadow-sm">
              <span className="font-extrabold text-sm text-[#A3E635] tracking-wider">EQ</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">Equip 3.0</span>
              <span className="text-[11px] text-slate-500 font-medium">Programme Admin</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                MENU
              </span>
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 bg-emerald-50 text-[#0F472A] rounded-xl font-semibold text-sm transition-colors text-left"
              >
                <LayoutDashboard className="w-4 h-4 text-[#166534]" />
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
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  184
                </span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl font-medium text-sm transition-colors text-left"
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>5 Sessions</span>
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

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                ADMIN
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
                <span>Help Center</span>
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

        {/* Bottom Usher App Callout */}
        <div className="bg-[#0B2E1A] rounded-xl p-4 text-white flex flex-col gap-3 shadow-inner">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#A3E635]" />
              <span className="text-xs font-bold text-white tracking-wide">Usher Scanner</span>
            </div>
            <p className="text-[11px] text-[#86EFAC] leading-tight">
              Scan participant passes and verify attendance at church doors.
            </p>
          </div>
          <button
            type="button"
            className="w-full h-8 bg-[#166534] hover:bg-[#15803d] text-white rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
          >
            Launch Usher Desk
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 flex flex-col gap-6 max-w-7xl">
        {/* Top Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl px-6 py-3.5 border border-slate-200/80 shadow-sm gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search attendee, phone, or EQ ID..."
              className="w-full h-10 pl-10 pr-14 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A] transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
              ⌘ K
            </span>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
              <div className="w-9 h-9 rounded-full bg-[#0F472A] text-[#A3E635] flex items-center justify-center text-xs font-bold ring-2 ring-emerald-50">
                PA
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">Pastor Admin</span>
                <span className="text-[11px] text-slate-500">admin@equipchurch.org</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Equip 3.0 Programme Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Monthly 3-Day Leadership Gathering · 5 Sessions Attendance Tracker
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onRegisterClick}
              className="h-10 px-5 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Register Attendee</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Primary Dark Green Hero Card */}
          <div className="bg-[#0F472A] rounded-2xl p-5 text-white flex flex-col justify-between h-36 shadow-sm relative overflow-hidden">
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

          {/* Card 2: Pastors & Leaders */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-36">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">Pastors & Ministers</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                72
              </span>
              <span className="text-[11px] text-slate-500">39.1% of attendees</span>
            </div>
          </div>

          {/* Card 3: Church Members */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-36">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">Members & Workers</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                112
              </span>
              <span className="text-[11px] text-slate-500">Host & visiting delegations</span>
            </div>
          </div>

          {/* Card 4: Live Check-in Session 1 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-36">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">Session 1 Checked In</span>
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                148
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">
                80.4% verified (Mon AM)
              </span>
            </div>
          </div>
        </section>

        {/* Middle Section: 5 Sessions Pillar Chart, Live Session Card, Delegations */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pillar Chart: 5 Sessions Attendance */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-64">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Attendance by Session</span>
              <span className="text-[11px] font-semibold text-[#166534] bg-emerald-50 px-2 py-0.5 rounded-md">
                5 Sessions
              </span>
            </div>

            {/* Pillar Bars */}
            <div className="flex items-end justify-between px-2 pt-4 h-40">
              {[
                { session: "Mon AM", count: 148, height: "h-24", color: "bg-[#0F472A]", key: "mon_am" },
                { session: "Mon PM", count: 162, height: "h-28", color: "bg-[#166534]", key: "mon_pm" },
                { session: "Tue AM", count: 154, height: "h-24", color: "bg-emerald-500", key: "tue_am" },
                { session: "Tue PM", count: 170, height: "h-32", color: "bg-[#84CC16]", key: "tue_pm" },
                { session: "Wed PM", count: 178, height: "h-36", color: "bg-[#0F472A]", key: "wed_pm" },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSelectedSession(s.key)}
                  className={`flex flex-col items-center gap-2 group transition-all ${
                    selectedSession === s.key ? "scale-105" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-700 tabular-nums">{s.count}</span>
                  <div className={`w-9 ${s.height} ${s.color} rounded-xl shadow-sm`} />
                  <span
                    className={`text-[10px] font-semibold ${
                      selectedSession === s.key ? "text-[#0F472A] font-bold" : "text-slate-500"
                    }`}
                  >
                    {s.session}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Next Session Callout */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-64">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                CURRENT SESSION
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                Monday Evening Impartation
              </h3>
              <p className="text-xs text-slate-500">Time: 05:30 pm – 08:30 pm · Main Hall</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/60 rounded-xl px-3 py-2 text-xs text-[#166534] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live usher sync active (3 devices)</span>
              </div>
              <button
                type="button"
                className="w-full h-10 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch Session 2 Check-in</span>
              </button>
            </div>
          </div>

          {/* Church Delegations Breakdown */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-64">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Delegations</span>
              <span className="text-[11px] font-semibold text-[#0F472A] bg-lime-100 px-2 py-0.5 rounded-md">
                8 Churches
              </span>
            </div>

            <div className="flex flex-col gap-2.5 my-auto">
              {[
                { name: "Grace Covenant (Host)", count: "68", dot: "bg-[#0F472A]" },
                { name: "Faith Apostolic Church", count: "34", dot: "bg-[#166534]" },
                { name: "Living Streams Assembly", count: "28", dot: "bg-[#84CC16]" },
                { name: "Redeemed Glory Center", count: "22", dot: "bg-emerald-400" },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0`} />
                    <span className="font-medium text-slate-700 truncate">{c.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 tabular-nums shrink-0">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Section: Recent Attendees, Turnout Gauge, Countdown Timer */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Recent Attendees & Quick Check-in Table */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between h-72">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Live Attendee Roster</span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {filteredAttendees.length} Shown
                </span>
              </div>
              <span className="text-xs font-semibold text-[#166534] hover:underline cursor-pointer">
                Full List →
              </span>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-52 pr-1">
              {filteredAttendees.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {a.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 leading-tight">{a.fullName}</span>
                      <span className="text-[11px] text-slate-500">
                        {a.roleOffice} · {a.churchName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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

          {/* Turnout Donut Gauge */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between items-center h-72">
            <div className="w-full text-left">
              <span className="text-sm font-bold text-slate-900">Turnout Completion</span>
            </div>

            {/* Half-Circle SVG Gauge */}
            <div className="flex flex-col items-center justify-center my-auto">
              <svg width="160" height="85" viewBox="0 0 180 95" className="overflow-visible">
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
                  stroke="#0F472A"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-2xl font-extrabold text-slate-900 -mt-2 tracking-tight">
                80.4%
              </span>
              <span className="text-[11px] text-slate-500 font-medium">148 of 184 Checked In</span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0F472A]" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pending</span>
              </div>
            </div>
          </div>

          {/* Session Countdown Widget */}
          <div className="lg:col-span-3 bg-[#0B2E1A] rounded-2xl p-5 text-white flex flex-col justify-between h-72 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
                <span className="text-xs font-bold text-[#A3E635] tracking-wider uppercase">DAY 1</span>
              </div>
              <span className="text-[10px] font-bold bg-white/10 text-emerald-200 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </div>

            <div className="flex flex-col items-center justify-center my-auto gap-1">
              <span className="text-[10px] text-emerald-300 font-semibold tracking-wider">
                SESSION 2 COMMENCES IN
              </span>
              <span className="font-mono text-3xl font-extrabold text-white tracking-widest tabular-nums">
                02:45:10
              </span>
              <span className="text-[11px] text-emerald-200">Main Auditorium Ushers Ready</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="w-9 h-9 rounded-full bg-[#166534] hover:bg-[#15803d] flex items-center justify-center text-white transition-colors"
                aria-label="Pause timer"
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-red-600/80 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                aria-label="Stop timer"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
