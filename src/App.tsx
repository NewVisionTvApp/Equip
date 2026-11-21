import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import RegistrationFlow from "./components/RegistrationFlow";
import AdminDirectory from "./components/AdminDirectory";
import MultiSessionAttendance from "./components/MultiSessionAttendance";
import EventModal from "./components/EventModal";
import { SignInPanel, MyAccount, StaffAccess } from "./components/AccountAccess";
import { authClient } from "./lib/auth-client";
import { apiRequest, type Programme } from "./lib/api-client";
import { getAttendeesForEvent, formatEventFullDateRange, type PlatformState, type SessionConfig, type StoredParticipant } from "./lib/store";
import type { PlatformAction } from "./lib/platform-schema";

type AppView = "dashboard" | "directory" | "attendance" | "register" | "account" | "staff";
type Snapshot = { state: PlatformState; revision: number; identity: string };
function route(): AppView {
  const path = window.location.pathname;
  if (path === "/register") return "register";
  if (path === "/attendance" || path === "/usher") return "attendance";
  if (path === "/directory") return "directory";
  if (path === "/account" || path === "/login") return "account";
  if (path === "/staff") return "staff";
  return "dashboard";
}

export default function App() {
  const { data: session, isPending, refetch } = authClient.useSession();
  const role = session?.user.role || "attendee";
  const isAdmin = Boolean(session && role === "admin");
  const isStaff = Boolean(session && (role === "admin" || role === "usher"));
  const identity = `${session?.user.id || "guest"}:${role}`;
  const [view, setView] = useState<AppView>(route);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [eventId, setEventId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const state = snapshot?.identity === identity && isStaff ? snapshot.state : null;
  const navigate = (target: AppView) => {
    window.history.pushState(null, "", target === "dashboard" ? "/" : `/${target}`);
    setView(target); setError("");
  };
  const acceptSnapshot = (data: { state: PlatformState; revision: number }, owner = identity) => {
    setSnapshot(current => current?.identity === owner && current.revision > data.revision ? current : { ...data, identity: owner });
  };

  useEffect(() => {
    const pop = () => setView(route());
    window.addEventListener("popstate", pop);
    // Remove the legacy shared roster cache; protected records now stay in memory only.
    localStorage.removeItem("equip_platform_state_v1");
    return () => window.removeEventListener("popstate", pop);
  }, []);

  useEffect(() => {
    let active = true;
    setIsEventModalOpen(false);
    const refresh = async () => {
      try {
        const publicData = await apiRequest<Programme>("/api/public/programme");
        if (active) setProgramme(publicData);
        if (isStaff) {
          const data = await apiRequest<{ state: PlatformState; revision: number }>("/api/sync");
          if (active) acceptSnapshot(data, identity);
        }
      } catch (error) {
        if (active) { setError(error instanceof Error ? error.message : "Could not load programme data."); if (isStaff) void refetch(); }
      }
    };
    void refresh();
    const timer = isStaff ? window.setInterval(refresh, 5000) : undefined;
    return () => { active = false; if (timer) window.clearInterval(timer); };
  }, [identity, isStaff]);

  const events = state?.events || programme?.events || [];
  const activeEvent = events.find(event => event.id === eventId) || events.find(event => event.id === (state?.activeEventId || programme?.activeEventId)) || events[0];
  const attendees = state && activeEvent ? getAttendeesForEvent(state, activeEvent.id) : [];
  const mutate = async (action: PlatformAction) => {
    setSaving(true); setError("");
    try { acceptSnapshot(await apiRequest<{ state: PlatformState; revision: number }>("/api/platform/actions", { method: "POST", body: JSON.stringify(action) })); }
    catch (error) { setError(error instanceof Error ? error.message : "The change could not be saved."); }
    finally { setSaving(false); }
  };
  const updateSession = (sessionKey: string, data: Partial<SessionConfig>) => {
    if (activeEvent) void mutate({ type: "session.update", eventId: activeEvent.id, sessionKey: sessionKey as SessionConfig["key"], data });
  };
  const toggleAttendance = (participantId: string, sessionKey: string) => {
    if (!activeEvent || !state) return;
    const attended = !state.attendance[`${participantId}_${activeEvent.id}_${sessionKey}`]?.attended;
    void mutate({ type: "attendance.set", participantId, eventId: activeEvent.id, sessionKey: sessionKey as SessionConfig["key"], attended });
  };
  const exportBackup = () => {
    if (!state || !isAdmin) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `equip-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
  };
  const importBackup = (file?: File) => {
    if (!file || !snapshot || !isAdmin) return;
    file.text().then(text => mutate({ type: "state.import", data: JSON.parse(text), revision: snapshot.revision })).catch(() => setError("The backup file could not be read. Choose an Equip JSON backup."));
  };
  const afterRegistration = () => {
    apiRequest<Programme>("/api/public/programme").then(setProgramme).catch(() => {});
    if (isStaff) apiRequest<{ state: PlatformState; revision: number }>("/api/sync").then(data => acceptSnapshot(data)).catch(() => {});
  };
  const signOut = async () => {
    setSaving(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
      setSnapshot(null); navigate("account"); await refetch();
    } catch (error) { setError(error instanceof Error ? error.message : "Sign out failed. Please try again."); }
    finally { setSaving(false); }
  };
  const effectiveView = view === "dashboard" && role === "usher" ? "attendance" : view;
  const needsAdmin = ["dashboard", "directory", "staff"].includes(effectiveView);
  const allowedStaffView = isStaff && (!needsAdmin || isAdmin);
  const navClass = "min-h-11 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300";

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="bg-[#0B0F17] text-white">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-3">
        <button onClick={() => navigate(isStaff ? "dashboard" : "register")} className={`${navClass} mr-auto text-base`}>Equip</button>
        {isAdmin && <><button className={navClass} onClick={() => navigate("dashboard")}>Dashboard</button><button className={navClass} onClick={() => navigate("directory")}>Directory</button><button className={navClass} onClick={() => navigate("staff")}>Account access</button></>}
        {isStaff && <button className={navClass} onClick={() => navigate("attendance")}>Attendance</button>}
        <button className={navClass} onClick={() => navigate("register")}>Register</button>
        <button className={navClass} onClick={() => navigate("account")}>{session ? "My account" : "Sign in / Create account"}</button>
        {session && <button className={navClass} disabled={saving} onClick={() => void signOut()}>Sign out</button>}
      </nav>
    </header>
    {error && <div role="alert" className="mx-auto max-w-7xl px-5 py-4 text-sm font-medium text-red-700">{error}<button className="ml-3 min-h-11 underline underline-offset-4" onClick={() => window.location.reload()}>Reload</button></div>}
    {saving && <p role="status" className="mx-auto max-w-7xl px-5 py-2 text-sm text-emerald-800">Saving…</p>}
    {isPending ? <p role="status" className="px-5 py-12 text-center text-sm text-slate-600">Checking your session…</p>
      : view === "register" ? activeEvent ? <RegistrationFlow onBackToDashboard={() => navigate("account")} activeEventName={activeEvent.title} activeEventId={activeEvent.id} activeEventMonthYear={activeEvent.monthYear} activeEventTheme={activeEvent.theme} activeEventDates={formatEventFullDateRange(activeEvent.startDate, activeEvent.endDate, activeEvent.monthYear)} churchesList={programme?.churches || []} onParticipantRegistered={afterRegistration} /> : <p role="status" className="px-5 py-12 text-center text-sm text-slate-600">{programme ? "Registration opens soon." : "Loading programme details…"}</p>
      : !session ? <SignInPanel onSuccess={() => { void refetch(); navigate("account"); }} onRegister={() => navigate("register")} />
      : view === "account" || !isStaff ? <MyAccount key={session.user.id} user={session.user} onRegister={() => navigate("register")} />
      : !allowedStaffView ? <main className="mx-auto max-w-xl px-5 py-12"><h1 className="text-2xl font-semibold">Administrator access required</h1><p className="mt-3 text-sm text-slate-600">Your usher account can register walk-ins and record attendance.</p><button className="mt-5 min-h-11 font-semibold text-emerald-800 underline" onClick={() => navigate("attendance")}>Open attendance desk</button></main>
      : effectiveView === "staff" ? <StaffAccess currentUserId={session.user.id} />
      : !state || !activeEvent ? <p role="status" className="px-5 py-12 text-center text-sm text-slate-600">Loading protected programme records…</p>
      : <>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-4">
          <label className="text-sm font-medium">Programme<select value={activeEvent.id} onChange={e => setEventId(e.target.value)} className="ml-2 min-h-11 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{events.map(event => <option key={event.id} value={event.id}>{event.monthYear}</option>)}</select></label>
          {isAdmin && <><button className="min-h-11 px-3 text-sm font-semibold text-emerald-800 underline underline-offset-4" onClick={() => setIsEventModalOpen(true)}>Manage programmes</button><button className="min-h-11 px-3 text-sm font-semibold text-emerald-800 underline underline-offset-4" onClick={exportBackup}>Export backup</button><label className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-semibold text-emerald-800 underline underline-offset-4">Import backup<input type="file" accept="application/json,.json" className="sr-only" onChange={e => { importBackup(e.target.files?.[0]); e.target.value = ""; }} /></label></>}
        </div>
        <fieldset disabled={saving} className="contents" aria-busy={saving}>
          {effectiveView === "dashboard" && <Dashboard onRegisterClick={() => navigate("register")} onDirectoryClick={() => navigate("directory")} onSessionsClick={() => navigate("attendance")} onOpenEventModal={() => setIsEventModalOpen(true)} activeEventName={activeEvent.title} activeEventTheme={activeEvent.theme} activeEventMonthYear={activeEvent.monthYear} totalRegistrations={attendees.length} ordainedCount={attendees.filter(p => p.isOrdained).length} attendeesData={attendees} sessionsData={activeEvent.sessions} onUpdateSession={updateSession} />}
          {effectiveView === "directory" && <AdminDirectory onBackToDashboard={() => navigate("dashboard")} onOpenRegister={() => navigate("register")} onOpenSessionAttendance={() => navigate("attendance")} activeEventName={activeEvent.title} attendeesData={attendees} sessionsData={activeEvent.sessions} onToggleSession={toggleAttendance} onUpdateParticipant={(participantId: string, data: Partial<StoredParticipant>) => void mutate({ type: "participant.update", participantId, data })} />}
          {effectiveView === "attendance" && <MultiSessionAttendance onBackToDashboard={() => navigate(isAdmin ? "dashboard" : "account")} onOpenDirectory={() => navigate("directory")} onOpenRegister={() => navigate("register")} activeEventName={activeEvent.title} activeEventId={activeEvent.id} rosterData={attendees} sessionsData={activeEvent.sessions} onToggleAttendance={toggleAttendance} onUpdateSession={isAdmin ? updateSession : undefined} canManage={isAdmin} />}
          {isAdmin && <EventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} events={events.map(event => ({ ...event, registeredCount: state.registrations.filter(r => r.eventId === event.id).length }))} activeEventId={activeEvent.id} onSelectEvent={id => { setEventId(id); void mutate({ type: "event.select", eventId: id }); }} onCreateEvent={data => void mutate({ type: "event.create", data })} onUpdateEvent={data => void mutate({ type: "event.update", eventId: data.id, data })} />}
        </fieldset>
      </>}
  </div>;
}
