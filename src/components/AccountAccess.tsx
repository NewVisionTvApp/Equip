import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { apiRequest, type OwnRecords } from "@/lib/api-client";
import type { StoredParticipant } from "@/lib/store";
import QRCodeView from "./QRCodeView";

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20";
const buttonClass = "min-h-11 rounded-xl bg-[#0F472A] px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60";
export type AccountUser = { id: string; name: string; email: string; role?: string | null; twoFactorEnabled?: boolean | null };

export function SignInPanel({ onSuccess, onRegister }: { onSuccess: () => void; onRegister: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [resetEnabled, setResetEnabled] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  useEffect(() => { apiRequest<{ passwordResetEnabled: boolean }>("/api/public/config").then(data => setResetEnabled(data.passwordResetEnabled)).catch(() => {}); }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw new Error(result.error.message || "Could not request a reset link.");
        setResetSent(true);
        return;
      }
      const result = mode === "signup" ? await authClient.signUp.email({ name, email, password }) : await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message || "Sign in failed.");
      if (result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) return;
      setPassword(""); onSuccess();
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  };
  return <main className="mx-auto max-w-md px-5 py-12 sm:py-20">
    <img src="/logo.png" alt="Equip" className="mb-8 h-20 w-auto rounded-xl bg-[#0B0F17] p-3 object-contain" />
    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}</h1>
    <p className="mt-3 text-sm leading-6 text-slate-600">{mode === "forgot" ? "Enter your account email and we’ll send a password-reset link." : "Keep your profile and programme passes in one place. Administrators assign access for staff."}</p>
    <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
      {mode === "signup" && <label className="text-sm font-medium text-slate-800">Full name<input autoComplete="name" required maxLength={200} value={name} onChange={e => setName(e.target.value)} className={inputClass} /></label>}
      <label className="text-sm font-medium text-slate-800">Email address<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} /></label>
      {mode !== "forgot" && <label className="text-sm font-medium text-slate-800">Password<input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} className={inputClass} /></label>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {resetSent && <p role="status" className="text-sm text-emerald-800">If that address has an account, a reset link is on its way.</p>}
      <button disabled={pending || (mode === "forgot" && !resetEnabled)} className={buttonClass}>{pending ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</button>
    </form>
    <button type="button" disabled={pending} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setResetSent(false); }} className="mt-5 min-h-11 text-sm font-semibold text-emerald-800 underline underline-offset-4">{mode === "signin" ? "Create an account" : "Back to sign in"}</button>
    {mode === "signin" && resetEnabled && <button type="button" onClick={() => setMode("forgot")} className="ml-4 min-h-11 text-sm font-semibold text-emerald-800 underline underline-offset-4">Forgot password?</button>}
    <div className="mt-8 border-t border-slate-200 pt-5"><p className="text-sm text-slate-600">Just attending the programme?</p><button type="button" onClick={onRegister} className="mt-1 min-h-11 text-sm font-semibold text-emerald-800 underline underline-offset-4">Register without an account</button></div>
  </main>;
}

export function ResetPasswordPanel({ onSuccess }: { onSuccess: () => void }) {
  const token = new URLSearchParams(window.location.search).get("token");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setPending(true); setError("");
    try {
      const result = await authClient.resetPassword({ token, newPassword: password });
      if (result.error) throw new Error(result.error.message || "The reset link could not be used.");
      setPassword(""); onSuccess();
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  };
  return <main className="mx-auto max-w-md px-5 py-12 sm:py-20"><h1 className="text-3xl font-semibold text-slate-900">Choose a new password</h1>
    {!token ? <p role="alert" className="mt-5 text-sm text-red-700">This reset link is missing its token. Request a new link from the sign-in page.</p> : <form onSubmit={submit} className="mt-8 flex flex-col gap-5"><label className="text-sm font-medium text-slate-800">New password<input type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} className={inputClass} /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={pending} className={buttonClass}>{pending ? "Saving…" : "Save new password"}</button></form>}
    <button type="button" onClick={onSuccess} className="mt-5 min-h-11 text-sm font-semibold text-emerald-800 underline">Back to sign in</button>
  </main>;
}

export function VerifyTwoFactorPanel({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      const result = backup
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
        : await authClient.twoFactor.verifyTotp({ code: code.trim() });
      if (result.error) throw new Error(result.error.message || "The code could not be verified.");
      setCode(""); onSuccess();
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  };
  return <main className="mx-auto max-w-md px-5 py-12 sm:py-20"><h1 className="text-3xl font-semibold text-slate-900">Verify your sign-in</h1>
    <p className="mt-3 text-sm text-slate-600">{backup ? "Enter one of the backup codes you saved when you enabled two-factor sign-in." : "Enter the six-digit code from your authenticator app."}</p>
    <form onSubmit={submit} className="mt-8 flex flex-col gap-5"><label className="text-sm font-medium text-slate-800">{backup ? "Backup code" : "Authenticator code"}<input required autoComplete="one-time-code" inputMode={backup ? "text" : "numeric"} pattern={backup ? undefined : "[0-9]{6}"} value={code} onChange={event => setCode(event.target.value)} className={inputClass} /></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={pending} className={buttonClass}>{pending ? "Verifying…" : "Verify code"}</button></form>
    <button type="button" onClick={() => { setBackup(!backup); setCode(""); setError(""); }} className="mt-5 min-h-11 text-sm font-semibold text-emerald-800 underline">{backup ? "Use authenticator app" : "Use a backup code"}</button>
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
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user.twoFactorEnabled));
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
  const activeRegistration = records?.registrations.find(registration => registration.eventId === records.activeEventId);
  const activeEvent = records?.events.find(event => event.id === records.activeEventId);
  const startTwoFactor = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      const result = await authClient.twoFactor.enable({ password: twoFactorPassword, method: "totp" });
      if (result.error) throw new Error(result.error.message || "Two-factor setup could not start.");
      if (!result.data || result.data.method !== "totp") throw new Error("Authenticator setup is unavailable.");
      setTotpUri(result.data.totpURI); setBackupCodes(result.data.backupCodes); setTwoFactorPassword("");
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  };
  const confirmTwoFactor = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      const result = await authClient.twoFactor.verifyTotp({ code: twoFactorCode.trim() });
      if (result.error) throw new Error(result.error.message || "The code could not be verified.");
      setTwoFactorEnabled(true); setTotpUri(""); setTwoFactorCode(""); setMessage("Two-factor sign-in is enabled. Save your backup codes now.");
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setPending(false); }
  };
  return <main className="mx-auto max-w-3xl px-5 py-10">
    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My account</h1>
    <p className="mt-2 break-words text-sm text-slate-600">{user.name} · {user.email}</p>
    <p className="mt-3 text-sm font-semibold text-emerald-800">{user.role === "admin" ? "Administrator" : user.role === "usher" ? "Usher" : "Attendee"} access</p>
    {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-5 text-sm text-emerald-800">{message}</p>}
    {staff && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold text-slate-900">Two-factor sign-in</h2>
      {twoFactorEnabled ? <p className="mt-2 text-sm text-emerald-800">Enabled. Your authenticator code is required when you sign in.</p> : <p className="mt-2 text-sm text-slate-600">Protect staff access with an authenticator app. You’ll need your account password to set it up.</p>}
      {!twoFactorEnabled && !totpUri && <form onSubmit={startTwoFactor} className="mt-5 flex flex-col gap-4"><label className="text-sm font-medium text-slate-800">Current password<input type="password" autoComplete="current-password" required value={twoFactorPassword} onChange={event => setTwoFactorPassword(event.target.value)} className={inputClass} /></label><button disabled={pending} className={`${buttonClass} self-start`}>{pending ? "Please wait…" : "Set up authenticator"}</button></form>}
      {totpUri && !twoFactorEnabled && <><p className="mt-5 text-sm text-slate-600">Scan this QR code with your authenticator app, then enter its six-digit code.</p><div className="mt-4 w-fit rounded-xl border border-slate-200 bg-white p-3"><QRCodeView value={totpUri} size={192} darkColor="#000000" /></div><form onSubmit={confirmTwoFactor} className="mt-5 flex flex-col gap-4"><label className="text-sm font-medium text-slate-800">Authenticator code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" value={twoFactorCode} onChange={event => setTwoFactorCode(event.target.value)} className={inputClass} /></label><button disabled={pending} className={`${buttonClass} self-start`}>{pending ? "Verifying…" : "Enable two-factor sign-in"}</button></form></>}
      {backupCodes.length > 0 && <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4"><h3 className="font-semibold text-slate-900">Save your backup codes</h3><p className="mt-2 text-sm text-slate-700">Each code works once if you lose your authenticator. Store them somewhere private; they will disappear when you leave this page.</p><ul className="mt-3 grid gap-2 font-mono text-sm sm:grid-cols-2">{backupCodes.map(code => <li key={code}>{code}</li>)}</ul>{twoFactorEnabled && <button type="button" onClick={() => setBackupCodes([])} className="mt-4 min-h-11 text-sm font-semibold text-emerald-800 underline">I saved these codes</button>}</div>}
    </section>}
      {records && <section className="mt-9 border-t border-slate-200 pt-7">
      <h2 className="text-xl font-semibold text-slate-900">{profile ? "Your participant profile" : "Link your existing pass"}</h2>
        {!profile && <p className="mt-2 text-sm leading-6 text-slate-600">Enter the Participant ID and phone number on your pass. {staff ? "Staff can register other people without linking their passes here; link only your own pass." : "You can also register below to create a new profile."}</p>}
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
        {profile && activeRegistration && <section className="mt-9 rounded-2xl bg-[#0F472A] px-6 py-7 text-center text-white"><h2 className="text-xl font-semibold">Your current programme pass</h2><p className="mt-2 text-sm text-emerald-100">{activeEvent?.title || activeRegistration.eventId}</p><div className="mx-auto mt-5 w-fit rounded-xl bg-white p-4"><QRCodeView value={profile.id} size={176} darkColor="#000000" /></div><p className="mt-4 font-mono text-2xl font-bold tracking-widest">{profile.id}</p><p className="mt-2 text-sm text-emerald-100">Show this QR code or Participant ID at check-in.</p></section>}
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
  const [audit, setAudit] = useState<Array<{ actorUserId: string; action: string; targetId: string; eventId: string | null; sessionKey: string | null; oldValue: string | null; newValue: string | null; createdAt: number }>>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const refresh = async () => {
    const [accounts, changes] = await Promise.all([
      apiRequest<{ users: AccountUser[] }>("/api/admin/users"),
      apiRequest<{ entries: typeof audit }>("/api/admin/audit"),
    ]);
    setUsers(accounts.users); setAudit(changes.entries); setLoaded(true);
  };
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
    {loaded && <section className="mt-12 border-t border-slate-200 pt-8"><h2 className="text-xl font-semibold text-slate-900">Recent access and attendance changes</h2>
      {audit.length ? <ul className="mt-4 divide-y divide-slate-200">{audit.map((entry, index) => <li key={`${entry.createdAt}-${index}`} className="py-3 text-sm text-slate-700"><span className="font-medium">{entry.action === "role.change" ? `Access: ${entry.oldValue} → ${entry.newValue}` : `${entry.newValue === "true" ? "Checked in" : "Check-in removed"} · ${entry.eventId} · ${entry.sessionKey}`}</span><span className="mt-1 block break-words text-slate-500">Target {entry.targetId} · by {users.find(user => user.id === entry.actorUserId)?.name || entry.actorUserId} · {new Date(entry.createdAt).toLocaleString()}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No changes recorded yet.</p>}
    </section>}
  </main>;
}
