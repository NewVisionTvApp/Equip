import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { apiRequest, type OwnRecords } from "@/lib/api-client";
import type { StoredParticipant } from "@/lib/store";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20";
const buttonClass = "min-h-11 rounded-xl bg-[#0F472A] px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60";
export type AccountUser = { id: string; name: string; email: string; role?: string | null };

export function SignInPanel({ onSuccess, onRegister }: { onSuccess: () => void; onRegister: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      const result = mode === "signup" ? await authClient.signUp.email({ name, email, password }) : await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message || "Sign in failed.");
      setPassword(""); onSuccess();
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  };
  return <main className="mx-auto max-w-md px-5 py-12 sm:py-20">
    <img src="/logo.png" alt="Equip" className="mb-8 h-20 w-auto rounded-xl bg-[#0B0F17] p-3 object-contain" />
    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">Keep your profile and programme passes in one place. Administrators assign access for staff.</p>
    <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
      {mode === "signup" && <label className="text-sm font-medium text-slate-800">Full name<input autoComplete="name" required maxLength={200} value={name} onChange={e => setName(e.target.value)} className={inputClass} /></label>}
      <label className="text-sm font-medium text-slate-800">Email address<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} /></label>
      <label className="text-sm font-medium text-slate-800">Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className={inputClass} /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={pending} className={buttonClass}>{pending ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
    </form>
    <button type="button" disabled={pending} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }} className="mt-5 min-h-11 text-sm font-semibold text-emerald-800 underline underline-offset-4">{mode === "signin" ? "Create an account" : "Already have an account? Sign in"}</button>
    <div className="mt-8 border-t border-slate-200 pt-5"><p className="text-sm text-slate-600">Just attending the programme?</p><button type="button" onClick={onRegister} className="mt-1 min-h-11 text-sm font-semibold text-emerald-800 underline underline-offset-4">Register without an account</button></div>
  </main>;
}

export function MyAccount({ user, onRegister }: { user: AccountUser; onRegister: () => void }) {
  const [records, setRecords] = useState<OwnRecords | null>(null);
  const [profile, setProfile] = useState<StoredParticipant | null>(null);
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    apiRequest<OwnRecords>("/api/me").then(data => { if (active) { setRecords(data); setProfile(data.participant); } }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [user.id]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    try {
      const data = profile
        ? await apiRequest<OwnRecords>("/api/me", { method: "PATCH", body: JSON.stringify(profile) })
        : await apiRequest<OwnRecords>("/api/me/link", { method: "POST", body: JSON.stringify({ id, phone }) });
      setRecords(data); setProfile(data.participant); setMessage(profile ? "Your profile is saved." : "Your pass is linked to your account.");
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  };
  const fields = [["fullName", "Full name"], ["phone", "Phone number"], ["email", "Contact email"], ["churchName", "Church / ministry"], ["roleOffice", "Ministerial / Service Role"], ["location", "Location"]] as const;
  const staff = user.role === "admin" || user.role === "usher";
  return <main className="mx-auto max-w-3xl px-5 py-10">
    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My account</h1>
    <p className="mt-2 break-words text-sm text-slate-600">{user.name} · {user.email}</p>
    <p className="mt-3 text-sm font-semibold text-emerald-800">{user.role === "admin" ? "Administrator" : user.role === "usher" ? "Usher" : "Attendee"} access</p>
    {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-5 text-sm text-emerald-800">{message}</p>}
    {!staff && records && <section className="mt-9 border-t border-slate-200 pt-7">
      <h2 className="text-xl font-semibold text-slate-900">{profile ? "Your participant profile" : "Link your existing pass"}</h2>
      {!profile && <p className="mt-2 text-sm leading-6 text-slate-600">Enter the Participant ID and phone number on your pass. You can also register below to create a new profile.</p>}
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        {profile ? <>
          <p className="font-mono text-lg font-semibold text-emerald-900 sm:col-span-2">{profile.id}</p>
          {fields.map(([key, label]) => <label key={key} className="text-sm font-medium text-slate-800">{label}<input required={key !== "email"} type={key === "phone" ? "tel" : key === "email" ? "email" : "text"} value={profile[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })} className={inputClass} /></label>)}
        </> : <>
          <label className="text-sm font-medium text-slate-800">Participant ID<input required placeholder="EQ-23456" value={id} onChange={e => setId(e.target.value)} className={inputClass} /></label>
          <label className="text-sm font-medium text-slate-800">Phone number<input type="tel" required autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} /></label>
        </>}
        <button disabled={pending} className={`${buttonClass} sm:justify-self-start`}>{pending ? "Saving…" : profile ? "Save profile" : "Link my pass"}</button>
      </form>
      {profile && <section className="mt-9 border-t border-slate-200 pt-7"><h2 className="text-xl font-semibold text-slate-900">Your programmes</h2>
        {records.registrations.length ? <ul className="mt-3 divide-y divide-slate-200">{records.registrations.map(reg => <li key={reg.id} className="flex flex-wrap justify-between gap-2 py-4 text-sm"><span>{records.events.find(e => e.id === reg.eventId)?.monthYear || reg.eventId}</span><span className="text-slate-600">{Object.entries(records.attendance).filter(([key, value]) => key.startsWith(`${profile.id}_${reg.eventId}_`) && value.attended).length} sessions attended</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No programme registrations yet.</p>}
      </section>}
      <button type="button" onClick={onRegister} className="mt-6 min-h-11 text-sm font-semibold text-emerald-800 underline underline-offset-4">Register for a programme</button>
    </section>}
    {!records && !error && <p role="status" className="mt-8 text-sm text-slate-600">Loading your account…</p>}
  </main>;
}

export function StaffAccess({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const refresh = () => apiRequest<{ users: AccountUser[] }>("/api/admin/users").then(data => { setUsers(data.users); setLoaded(true); });
  useEffect(() => { refresh().catch(error => setError(error.message)); }, []);
  const change = async (userId: string, role: string) => {
    setPending(true); setError("");
    try { await apiRequest("/api/admin/users", { method: "POST", body: JSON.stringify({ userId, role }) }); await refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : "Access could not be changed."); }
    finally { setPending(false); }
  };
  return <main className="mx-auto max-w-4xl px-5 py-10">
    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Account access</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Ask staff to create an account, then assign their access here. Changing access signs that account out so the new permissions apply.</p>
    {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
    {!loaded && !error && <p role="status" className="mt-8 text-sm text-slate-600">Loading accounts…</p>}
    <ul className="mt-8 divide-y divide-slate-200">{users.map(user => <li key={user.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold text-slate-900">{user.name}{user.id === currentUserId ? " (you)" : ""}</p><p className="break-words text-sm text-slate-600">{user.email}</p></div><label className="text-sm font-medium text-slate-700">Access<select aria-label={`Access for ${user.name}`} disabled={pending || user.id === currentUserId} value={user.role || "attendee"} onChange={e => void change(user.id, e.target.value)} className={`${inputClass} sm:w-44`}><option value="attendee">Attendee</option><option value="usher">Usher</option><option value="admin">Administrator</option></select></label></li>)}</ul>
    {loaded && !users.length && <p className="mt-6 text-sm text-slate-600">No accounts have been created yet.</p>}
  </main>;
}
