import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  ArrowRight,
  Sparkles,
  Award,
  Lock,
  ChevronLeft,
  Smartphone,
  ShieldCheck,
  Search,
  Printer,
  Plus,
  Share2,
} from "lucide-react";
import QRCodeView from "./QRCodeView";
import { generateParticipantId } from "@/lib/id-generator";
import { authClient } from "@/lib/auth-client";
import { SEED_PARTICIPANTS, SyntheticParticipantSeed } from "@/db/seed-data";
import PrintableBadgeModal from "./PrintableBadgeModal";

export interface RegistrationFlowProps {
  onBackToDashboard: () => void;
  onParticipantRegistered?: (participant: any, isReturning?: boolean) => void;
  activeEventName?: string;
  activeEventId?: string;
  activeEventMonthYear?: string;
  activeEventTheme?: string;
  activeEventDates?: string;
  existingParticipants?: Record<string, any>;
  churchesList?: string[];
  onAddNewChurch?: (churchName: string) => void;
}

export default function RegistrationFlow({
  onBackToDashboard,
  onParticipantRegistered,
  activeEventName,
  activeEventId: _activeEventId,
  activeEventMonthYear,
  activeEventTheme,
  activeEventDates,
  existingParticipants,
  churchesList,
  onAddNewChurch,
}: RegistrationFlowProps) {
  // Navigation / View Modes
  const [mode, setMode] = useState<"register" | "returning" | "signin" | "confirmed">("register");
  const [isPrintBadgeOpen, setIsPrintBadgeOpen] = useState(false);
  const [isAddingNewChurch, setIsAddingNewChurch] = useState(false);

  // Dynamic Month / Year badge computation
  const displayEventMonth = useMemo(() => {
    if (activeEventMonthYear) return activeEventMonthYear;
    if (activeEventName) {
      const match = activeEventName.match(
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)(\s+\d{4})?/i
      );
      if (match) return match[0];
    }
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date());
  }, [activeEventMonthYear, activeEventName]);

  const displayEventDates = useMemo(() => {
    if (activeEventDates) return activeEventDates;
    return `${displayEventMonth} · 3-Day Programme`;
  }, [activeEventDates, displayEventMonth]);

  // Available churches derived from database + props
  const availableChurches = useMemo(() => {
    const set = new Set<string>([
      "Grace Covenant Sanctuary (Host)",
      "Faith Apostolic Church",
      "Living Streams Assembly",
      "Redeemed Glory Center",
      "Christ Ambassadors Fellowship",
    ]);

    if (churchesList && churchesList.length > 0) {
      churchesList.forEach((c) => set.add(c));
    }

    if (existingParticipants) {
      Object.values(existingParticipants).forEach((p: any) => {
        if (p.churchName) set.add(p.churchName);
      });
    }

    SEED_PARTICIPANTS.forEach((p) => set.add(p.churchName));
    return Array.from(set).sort();
  }, [churchesList, existingParticipants]);

  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    roleType: "pastor" as "pastor" | "member",
    roleOffice: "Senior Pastor",
    churchName: "Grace Covenant Sanctuary (Host)",
    customChurch: "",
    location: "Lagos Central",
  });

  // Returning lookup state
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState<SyntheticParticipantSeed | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Sign-in state
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Confirmed Pass State
  const [confirmedPass, setConfirmedPass] = useState<{
    id: string;
    fullName: string;
    roleOffice: string;
    churchName: string;
    isOrdained: boolean;
    location: string;
    date: string;
  } | null>(null);

  // Copied state
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Haptic audio feedback
  const playHapticAudio = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.08);
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

  // Copy ID to clipboard
  const handleCopyId = (id: string) => {
    playHapticAudio();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit New Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) return;

    setIsSubmitting(true);
    playHapticAudio();

    setTimeout(() => {
      const newId = generateParticipantId();
      const finalChurch =
        (isAddingNewChurch && formData.customChurch.trim()) ||
        (formData.churchName === "Other" && formData.customChurch.trim())
          ? formData.customChurch.trim()
          : formData.churchName;

      if (isAddingNewChurch && formData.customChurch.trim() && onAddNewChurch) {
        onAddNewChurch(formData.customChurch.trim());
      }

      const isOrdained = formData.roleType === "pastor";

      const newParticipant: SyntheticParticipantSeed = {
        id: newId,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || `${newId.toLowerCase()}@equipchurch.org`,
        churchName: finalChurch,
        isHostChurch: finalChurch.includes("Host") || finalChurch.includes("Grace Covenant"),
        roleOffice: formData.roleOffice,
        location: formData.location,
      };

      if (onParticipantRegistered) {
        onParticipantRegistered(newParticipant);
      }

      setConfirmedPass({
        id: newId,
        fullName: newParticipant.fullName,
        roleOffice: newParticipant.roleOffice,
        churchName: newParticipant.churchName,
        isOrdained,
        location: newParticipant.location || "Lagos",
        date: displayEventDates,
      });

      setIsSubmitting(false);
      setMode("confirmed");
    }, 600);
  };

  // Returning Participant Lookup
  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    const q = lookupQuery.trim().toUpperCase();
    const candidateList = existingParticipants
      ? Object.values(existingParticipants)
      : SEED_PARTICIPANTS;

    const found = candidateList.find(
      (p: any) =>
        p.id.toUpperCase() === q ||
        p.phone.replace(/\s+/g, "").includes(q.replace(/\s+/g, "")) ||
        (p.email && p.email.toUpperCase().includes(q)) ||
        p.fullName.toUpperCase().includes(q)
    );

    if (found) {
      playHapticAudio();
      setLookupResult(found as any);
      setLookupError(null);
    } else {
      setLookupResult(null);
      setLookupError(`No previous registration found for "${lookupQuery}". Register as a new participant.`);
    }
  };

  // Confirm Returning Attendee
  const handleConfirmReturning = () => {
    if (!lookupResult) return;
    playHapticAudio();

    if (onParticipantRegistered) {
      onParticipantRegistered(lookupResult, true);
    }

    const isOrdained =
      lookupResult.roleOffice.toLowerCase().includes("pastor") ||
      lookupResult.roleOffice.toLowerCase().includes("bishop") ||
      lookupResult.roleOffice.toLowerCase().includes("reverend") ||
      lookupResult.roleOffice.toLowerCase().includes("apostle");

    setConfirmedPass({
      id: lookupResult.id,
      fullName: lookupResult.fullName,
      roleOffice: lookupResult.roleOffice,
      churchName: lookupResult.churchName,
      isOrdained,
      location: lookupResult.location || "Lagos",
      date: displayEventDates,
    });

    setMode("confirmed");
  };

  // 1-Tap WhatsApp Share for Delegates
  const handleShareWhatsApp = () => {
    if (!confirmedPass) return;
    const text =
      `*Equip 3.0 Ministerial Pass*\n` +
      `*Name:* ${confirmedPass.fullName}\n` +
      `*Unique ID:* ${confirmedPass.id}\n` +
      `*Ministry:* ${confirmedPass.churchName}\n` +
      `*Role:* ${confirmedPass.roleOffice}\n` +
      `*Gathering:* ${displayEventMonth} 3-Day Programme\n\n` +
      `Please save this message or present this ID at church entrance doors during each of the 5 sessions for fast check-in.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Handle Better Auth Sign-In
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await authClient.signIn.email({
        email: authEmail,
        password: authPassword,
      });

      if (res.error) {
        setAuthError(res.error.message || "Failed to sign in. Verify email and password.");
      } else {
        playHapticAudio();
        // Redirect or show profile
        setMode("register");
      }
    } catch (err: any) {
      setAuthError(err.message || "Sign in failed. Using simulated profile.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] bg-[radial-gradient(ellipse_100%_40%_at_50%_-10%,rgba(16,185,129,0.06),transparent)] text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased selection:bg-[#A3E635] selection:text-[#0F472A]">
      {/* Top Header & Back Link */}
      <header className="w-full max-w-xl flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-apple-card active:scale-95 transition-all duration-150 ease-apple-spring"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Admin Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
          <span className="text-xs font-bold text-[#0F472A] bg-lime-100/90 border border-lime-200/60 px-2.5 py-0.5 rounded-full">
            {displayEventDates}
          </span>
        </div>
      </header>

      {/* Main Container Card */}
      <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-apple-card ring-1 ring-black/[0.02] flex flex-col gap-6">
        {/* Brand Emblem & Heading */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0F472A] to-[#064E3B] p-2 flex items-center justify-center shadow-md ring-1 ring-white/20">
            <img src="/logo.png" alt="Equip 3.0" className="w-full h-full object-contain filter drop-shadow" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.03em]">
              Equip 3.0 Registration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {activeEventTheme ? `Theme: ${activeEventTheme}` : "Monthly Leadership Impartation & Ministry Alignment Gathering"}
            </p>
          </div>

          {/* Mode Switcher Tabs (iOS Segmented Control) */}
          {mode !== "confirmed" && (
            <div className="w-full flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs mt-3">
              <button
                type="button"
                onClick={() => {
                  playHapticAudio();
                  setMode("register");
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 ease-apple-spring active:scale-95 ${
                  mode === "register"
                    ? "bg-[#0F472A] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                New Registration
              </button>

              <button
                type="button"
                onClick={() => {
                  playHapticAudio();
                  setMode("returning");
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 ease-apple-spring active:scale-95 ${
                  mode === "returning"
                    ? "bg-[#0F472A] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Returning Attendee
              </button>

              <button
                type="button"
                onClick={() => {
                  playHapticAudio();
                  setMode("signin");
                }}
                className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 ease-apple-spring active:scale-95 ${
                  mode === "signin"
                    ? "bg-[#0F472A] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Account Sign In
              </button>
            </div>
          )}
        </div>

        {/* 1. NEW REGISTRATION FORM */}
        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
            {/* Clergy vs General Delegate Toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Participation Category</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playHapticAudio();
                    setFormData((prev) => ({
                      ...prev,
                      roleType: "pastor",
                      roleOffice: "Senior Pastor",
                    }));
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all duration-200 ease-apple-spring active:scale-95 ${
                    formData.roleType === "pastor"
                      ? "bg-emerald-50/80 border-[#0F472A] text-[#0F472A] ring-2 ring-[#0F472A]/20 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Ordained Minister / Pastor</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playHapticAudio();
                    setFormData((prev) => ({
                      ...prev,
                      roleType: "member",
                      roleOffice: "Church Worker",
                    }));
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all duration-200 ease-apple-spring active:scale-95 ${
                    formData.roleType === "member"
                      ? "bg-emerald-50/80 border-[#0F472A] text-[#0F472A] ring-2 ring-[#0F472A]/20 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Church Member / Worker</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Full Name (with Title)</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={
                    formData.roleType === "pastor"
                      ? "e.g. Pastor / Rev. Emmanuel Addo"
                      : "e.g. Brother Samuel Okon"
                  }
                  className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all duration-150 ease-apple-spring"
                />
              </div>
            </div>

            {/* Phone & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">WhatsApp / Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234 803 123 4567"
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all duration-150 ease-apple-spring"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="minister@example.com"
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all duration-150 ease-apple-spring"
                  />
                </div>
              </div>
            </div>

            {/* Role / Office Specific dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Ministerial / Service Role</label>
              <select
                value={formData.roleOffice}
                onChange={(e) => setFormData({ ...formData, roleOffice: e.target.value })}
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all duration-150 ease-apple-spring"
              >
                {formData.roleType === "pastor" ? (
                  <>
                    <option value="Senior Pastor">Senior Pastor</option>
                    <option value="Resident Pastor">Resident Pastor</option>
                    <option value="Associate Minister">Associate Minister</option>
                    <option value="Bishop">Bishop</option>
                    <option value="Apostle">Apostle</option>
                    <option value="Evangelist">Evangelist</option>
                    <option value="Deacon / Elder">Deacon / Elder</option>
                  </>
                ) : (
                  <>
                    <option value="Church Worker">Church Worker</option>
                    <option value="Choir / Music Ministry">Choir / Music Ministry</option>
                    <option value="Ushering / Protocol">Ushering / Protocol</option>
                    <option value="Youth Leader">Youth Leader</option>
                    <option value="General Delegate">General Delegate</option>
                  </>
                )}
              </select>
            </div>

            {/* Home Church Affiliation */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Home Church / Affiliation</label>
                <button
                  type="button"
                  onClick={() => {
                    playHapticAudio();
                    setIsAddingNewChurch(!isAddingNewChurch);
                  }}
                  className="text-[11px] font-bold text-[#0F472A] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAddingNewChurch ? "Select from database" : "+ Add new church"}</span>
                </button>
              </div>

              {!isAddingNewChurch ? (
                <>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={formData.churchName}
                      onChange={(e) => {
                        if (e.target.value === "ADD_NEW") {
                          setIsAddingNewChurch(true);
                        } else {
                          setFormData({ ...formData, churchName: e.target.value });
                        }
                      }}
                      className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all duration-150 ease-apple-spring"
                    >
                      <optgroup label="Registered Churches in Database">
                        {availableChurches.map((c: string) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="New Church Registration">
                        <option value="ADD_NEW">+ Add a new church to database...</option>
                      </optgroup>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {availableChurches.length} churches currently in database. Don't see yours? Click "+ Add new church".
                  </span>
                </>
              ) : (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col gap-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F472A] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#0F472A]" />
                      <span>Enter New Church / Ministry Name</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-[#A3E635] text-[#0F472A] px-2 py-0.2 rounded-full uppercase">
                      Will Save to DB
                    </span>
                  </div>

                  <input
                    type="text"
                    required={isAddingNewChurch}
                    value={formData.customChurch}
                    onChange={(e) => setFormData({ ...formData, customChurch: e.target.value })}
                    placeholder="e.g. Victorious Christian Assembly, City Gate Church..."
                    className="w-full h-10 px-3.5 bg-white border border-emerald-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
                    autoFocus
                  />

                  <div className="flex items-center justify-between text-[11px] text-emerald-800">
                    <span>This church will be permanently saved for all future registrants.</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewChurch(false)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 underline ml-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* City / Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">City / Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Lagos Central, Ikeja, Ibadan"
                  className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all duration-150 ease-apple-spring"
                />
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-2 bg-[#0F472A] hover:bg-[#165A36] active:scale-[0.98] text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-apple-float transition-all duration-200 ease-apple-spring disabled:opacity-70"
            >
              {isSubmitting ? (
                <span>Generating Ministerial Pass...</span>
              ) : (
                <>
                  <span>Complete Registration & Get Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. RETURNING ATTENDEE FAST LOOKUP */}
        {mode === "returning" && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-500">
              Enter your phone number or persistent Participant ID (<span className="font-mono text-[#0F472A] font-bold">EQ-XXXXX</span>) to immediately renew your pass for this month.
            </p>

            <form onSubmit={handleLookupSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="e.g. EQ-82914 or +2348031234567..."
                  className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-[#0F472A] hover:bg-[#165A36] active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find My Profile</span>
              </button>
            </form>

            {lookupError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                {lookupError}
              </div>
            )}

            {/* Found Record Confirmation */}
            {lookupResult && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950">Profile Verified</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#0F472A] bg-lime-100 border border-lime-200 px-2 py-0.5 rounded-md">
                    {lookupResult.id}
                  </span>
                </div>

                <div className="flex flex-col text-xs text-slate-700">
                  <span className="font-extrabold text-sm text-slate-900">{lookupResult.fullName}</span>
                  <span>{lookupResult.roleOffice} · {lookupResult.churchName}</span>
                  <span className="text-slate-400 text-[11px] mt-0.5">Location: {lookupResult.location}</span>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmReturning}
                  className="w-full h-10 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#A3E635]" />
                  <span>Confirm {displayEventMonth} Programme Pass</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. BETTER AUTH SIGN-IN FORM */}
        {mode === "signin" && (
          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            <p className="text-xs text-slate-500">
              Sign in with your email account to view past event attendance and edit your minister profile.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="minister@equipchurch.org"
                  className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-[#0F472A]/15 focus:border-[#0F472A] focus:bg-white transition-all"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] disabled:opacity-70"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{authLoading ? "Authenticating..." : "Sign In with Better Auth"}</span>
            </button>
          </form>
        )}

        {/* 4. PASS CONFIRMATION CARD (Apple Wallet Style Pass) */}
        {mode === "confirmed" && confirmedPass && (
          <div className="flex flex-col gap-6 items-center animate-in zoom-in-95 duration-300 ease-apple-spring">
            {/* Success Banner */}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Registration Confirmed · Pass Active for 5 Sessions</span>
            </div>

            {/* Apple Wallet Style Digital Pass Card */}
            <div className="w-full bg-gradient-to-br from-[#064E3B] via-[#0F472A] to-[#041D11] text-white rounded-3xl p-6 shadow-apple-float ring-1 ring-inset ring-white/15 relative overflow-hidden flex flex-col gap-5">
              {/* Luminous Topography Curves */}
              <svg
                className="absolute inset-0 w-full h-full text-[#A3E635]/10 pointer-events-none"
                viewBox="0 0 300 300"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M -40,160 Q 60,60 160,160 T 360,160" />
                <path d="M -40,190 Q 60,90 160,190 T 360,190" />
                <path d="M -40,220 Q 60,120 160,220 T 360,220" />
              </svg>

              {/* Pass Header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center">
                    <img src="/logo.png" alt="Equip 3.0" className="w-full h-full object-contain filter drop-shadow" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold tracking-tight">Equip 3.0 Official Pass</span>
                    <span className="text-[10px] text-emerald-300 font-medium">Leadership Impartation</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    confirmedPass.isOrdained
                      ? "bg-[#A3E635] text-[#0F472A] shadow-xs"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {confirmedPass.isOrdained ? "Clergy VIP" : "Delegate"}
                </span>
              </div>

              {/* Unique ID Hero Bar */}
              <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                    Participant ID
                  </span>
                  <span className="font-mono text-2xl font-black text-white tracking-widest tabular-nums">
                    {confirmedPass.id}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyId(confirmedPass.id)}
                  className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ease-apple-spring border border-white/15"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#A3E635]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Participant Details */}
              <div className="grid grid-cols-2 gap-3 text-xs z-10 pt-1 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase">Delegate Name</span>
                  <span className="font-extrabold text-white text-sm truncate">{confirmedPass.fullName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase">Role / Office</span>
                  <span className="font-extrabold text-white text-sm truncate">{confirmedPass.roleOffice}</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase">Affiliated Church</span>
                  <span className="font-medium text-emerald-100 text-xs truncate">{confirmedPass.churchName}</span>
                </div>
              </div>

              {/* Real Scannable QR Code (Large & High Contrast) */}
              <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center z-10 text-slate-900 shadow-lg border border-slate-100">
                <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200/90 mb-2">
                  <QRCodeView value={confirmedPass.id} size={160} darkColor="#000000" />
                </div>
                
                <span className="font-mono text-xl font-black text-[#0F472A] tracking-wider">
                  {confirmedPass.id}
                </span>

                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Door Usher Scannable Pass · 5 Sessions</span>
                </div>

                <span className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {confirmedPass.date}
                </span>
              </div>
            </div>

            {/* Next Steps / Reassurance Callout */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 text-xs text-slate-600">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#0F472A]" />
                <span>Save This Pass to Your Phone</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                Take a screenshot of this digital pass or save your Unique ID (<strong className="font-mono text-[#0F472A]">{confirmedPass.id}</strong>). Ushers will scan this pass at church entrance doors during each of the 5 sessions.
              </p>
            </div>

            {/* Quick Action Grid: WhatsApp Share & Physical Print */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="h-11 bg-[#25D366] hover:bg-[#20BD5A] active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-apple-card transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Send Pass to WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPrintBadgeOpen(true)}
                className="h-11 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-apple-card transition-all"
              >
                <Printer className="w-4 h-4 text-[#A3E635]" />
                <span>Print Badge Slip</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playHapticAudio();
                  setMode("register");
                }}
                className="flex-1 h-11 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-apple-card"
              >
                Register Another Person
              </button>

              <button
                type="button"
                onClick={onBackToDashboard}
                className="flex-1 h-11 bg-[#0F472A] hover:bg-[#165A36] active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-apple-float"
              >
                View on Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Physical Badge Print Modal */}
      <PrintableBadgeModal
        isOpen={isPrintBadgeOpen}
        onClose={() => setIsPrintBadgeOpen(false)}
        participant={confirmedPass}
        eventName={activeEventName || `Equip ${displayEventMonth}`}
      />
    </div>
  );
}
