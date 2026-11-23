import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Plus,
  CheckCircle2,
  X,
  Sparkles,
  Clock,
  Pencil,
  User,
  BookOpen,
  MapPin,
  Save,
} from "lucide-react";
import { SessionConfig, createDefaultSessions } from "@/lib/store";

export interface EquipEvent {
  id: string; // e.g. "2026-12-EQUIP"
  title: string;
  theme: string;
  monthYear: string;
  startDate: string;
  endDate: string;
  status: "active" | "open" | "draft" | "completed";
  registeredCount: number;
  sessions?: SessionConfig[];
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EquipEvent[];
  activeEventId: string;
  onSelectEvent: (eventId: string) => void;
  onCreateEvent: (newEvent: EquipEvent) => Promise<boolean>;
  onUpdateEvent?: (updatedEvent: EquipEvent) => Promise<boolean>;
}

export default function EventModal({
  isOpen,
  onClose,
  events,
  activeEventId,
  onSelectEvent,
  onCreateEvent,
  onUpdateEvent,
}: EventModalProps) {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [editingEvent, setEditingEvent] = useState<EquipEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled])')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [isOpen]);

  // Form state for Create / Edit
  const [formData, setFormData] = useState({
    month: "January",
    year: "2027",
    theme: "Apostolic Foundation & Ministerial Alignment",
    startDate: "2027-01-11",
    endDate: "2027-01-13",
    status: "open" as "open" | "active" | "draft",
    sessions: createDefaultSessions(),
  });

  if (!isOpen) return null;

  // Start Editing an existing event
  const handleStartEdit = (ev: EquipEvent) => {
    setSaveError("");
    setEditingEvent(ev);
    const [month = "January", year = "2027"] = ev.monthYear.split(" ");
    setFormData({
      month,
      year,
      theme: ev.theme,
      startDate: ev.startDate,
      endDate: ev.endDate,
      status: ev.status === "completed" ? "active" : ev.status,
      sessions: ev.sessions && ev.sessions.length > 0 ? [...ev.sessions] : createDefaultSessions(),
    });
    setViewMode("edit");
  };

  // Start Creating a new event
  const handleStartCreate = () => {
    setSaveError("");
    setEditingEvent(null);
    setFormData({
      month: "January",
      year: "2027",
      theme: "Apostolic Foundation & Ministerial Alignment",
      startDate: "2027-01-11",
      endDate: "2027-01-13",
      status: "open",
      sessions: createDefaultSessions(),
    });
    setViewMode("create");
  };

  // Update session field inside form
  const handleSessionChange = (
    index: number,
    field: "name" | "speaker" | "time" | "hall",
    value: string
  ) => {
    setFormData((prev) => {
      const updatedSessions = [...prev.sessions];
      updatedSessions[index] = {
        ...updatedSessions[index],
        [field]: value,
      };
      return {
        ...prev,
        sessions: updatedSessions,
      };
    });
  };

  // Handle Form Submission (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");

    try {
      if (viewMode === "create") {
        const id = `${formData.year}-${formData.month === "January" ? "01" : formData.month === "February" ? "02" : "03"}-EQUIP`;
        const title = `Equip ${formData.month} ${formData.year}: ${formData.theme}`;

        const newEvent: EquipEvent = {
          id,
          title,
          theme: formData.theme,
          monthYear: `${formData.month} ${formData.year}`,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          registeredCount: 0,
          sessions: formData.sessions,
        };

        if (await onCreateEvent(newEvent)) setViewMode("list");
        else setSaveError("The programme was not saved. Please try again.");
      } else if (viewMode === "edit" && editingEvent) {
        const updatedEvent: EquipEvent = {
          ...editingEvent,
          title: `Equip ${formData.month} ${formData.year}: ${formData.theme}`,
          theme: formData.theme,
          monthYear: `${formData.month} ${formData.year}`,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          sessions: formData.sessions,
        };

        if (onUpdateEvent && await onUpdateEvent(updatedEvent)) setViewMode("list");
        else setSaveError("The programme was not saved. Please try again.");
      }
    } catch {
      setSaveError("The programme was not saved. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="programme-dialog-title" className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-7 shadow-2xl border border-slate-200 flex flex-col gap-5 relative animate-in zoom-in-95 duration-200 ease-apple-spring max-h-[calc(100dvh-1rem)] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close programme editor"
          className="absolute right-3 top-3 w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pr-10">
          <div className="w-12 h-12 rounded-2xl bg-[#0F472A] p-2 flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-6 h-6 text-[#A3E635]" />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="programme-dialog-title" className="text-xl font-extrabold text-slate-900 tracking-tight">Monthly Programme Events</h2>
              <span className="text-[10px] font-bold bg-[#A3E635] text-[#0F472A] px-2 py-0.5 rounded-full uppercase">
                Admin Hub
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Create, configure, and customize monthly 3-day Equip gatherings, session topics, and preachers.
            </p>
          </div>
        </div>

        {/* View Mode 1: Event List */}
        {viewMode === "list" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">All Monthly Programmes</span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="min-h-11 px-3 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Next Month's Equip</span>
              </button>
            </div>

            {/* List of Monthly Events */}
            <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
              {events.map((ev) => {
                const isActive = ev.id === activeEventId;
                return (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? "bg-emerald-50/80 border-[#0F472A] ring-2 ring-[#0F472A]/20 shadow-xs"
                        : "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{ev.monthYear}</span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                            ev.status === "active"
                              ? "bg-[#0F472A] text-[#A3E635]"
                              : ev.status === "open"
                              ? "bg-lime-100 text-[#0F472A]"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {ev.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{ev.title}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Dates: {ev.startDate} to {ev.endDate}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <div className="text-right mr-2 hidden sm:block">
                        <span className="text-xs font-black text-slate-900 tabular-nums">{ev.registeredCount}</span>
                        <span className="text-[10px] text-slate-400 block">Registered</span>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(ev)}
                        className="min-h-11 px-2.5 bg-white hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center gap-1 shadow-2xs"
                        title="Edit programme theme, preachers, and session details"
                      >
                        <Pencil className="w-3 h-3 text-[#0F472A]" />
                        <span>Edit</span>
                      </button>

                      {isActive ? (
                        <span className="px-3 py-1.5 bg-[#0F472A] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectEvent(ev.id);
                            onClose();
                          }}
                          className="min-h-11 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors active:scale-95 shadow-2xs"
                        >
                          Switch Event
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 2 & 3: Create / Edit Event & 5 Sessions Form */}
        {(viewMode === "create" || viewMode === "edit") && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-in fade-in">
            {saveError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{saveError}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="text-sm font-extrabold text-slate-900">
                {viewMode === "create" ? "Create New Monthly Programme" : `Edit ${editingEvent?.monthYear} Gathering`}
              </span>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="min-h-11 text-xs text-slate-700 hover:text-slate-900 font-medium"
              >
                ← Back to List
              </button>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="programme-month" className="text-sm font-bold text-slate-700">Programme Month</label>
                <select
                  id="programme-month"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full min-h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
                >
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="programme-year" className="text-sm font-bold text-slate-700">Year</label>
                <select
                  id="programme-year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full min-h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="programme-theme" className="text-sm font-bold text-slate-700">Programme Theme / Title</label>
              <input
                id="programme-theme"
                type="text"
                required
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="e.g. Apostolic Foundation & Power"
                className="w-full min-h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="programme-start" className="text-sm font-bold text-slate-700">Day 1 (Start Date)</label>
                <input
                  id="programme-start"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full min-h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="programme-end" className="text-sm font-bold text-slate-700">Day 3 (End Date)</label>
                <input
                  id="programme-end"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full min-h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="programme-status" className="text-sm font-bold text-slate-700">Registration Status</label>
              <select
                id="programme-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full min-h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
              >
                <option value="open">Open for Public Registration</option>
                <option value="active">Active Gathering (Currently In Session)</option>
                <option value="draft">Draft (Planning Only)</option>
              </select>
            </div>

            {/* 5 SESSIONS CONFIGURATION (Preachers, Topics, Times, Venue) */}
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-900">
                    5 Gathering Sessions & Preachers
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Customize the specific ministers, sermon topics, and schedules for all 5 sessions.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {formData.sessions.map((sess, idx) => (
                  <div
                    key={sess.key}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase bg-[#0F472A] text-[#A3E635] px-2 py-0.5 rounded-full">
                        Session {idx + 1}: {sess.short} · {sess.day}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Topic */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`session-${idx}-topic`} className="text-sm font-bold text-slate-700 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#0F472A]" />
                          <span>Topic / Session Title</span>
                        </label>
                        <input
                          id={`session-${idx}-topic`}
                          type="text"
                          required
                          value={sess.name}
                          onChange={(e) => handleSessionChange(idx, "name", e.target.value)}
                          placeholder="Session topic..."
                          className="min-h-11 px-2.5 bg-white border border-slate-200 rounded-lg text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F472A]"
                        />
                      </div>

                      {/* Preacher / Minister Name */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`session-${idx}-speaker`} className="text-sm font-bold text-slate-700 flex items-center gap-1">
                          <User className="w-3 h-3 text-[#0F472A]" />
                          <span>Preacher / Minister</span>
                        </label>
                        <input
                          id={`session-${idx}-speaker`}
                          type="text"
                          required
                          value={sess.speaker}
                          onChange={(e) => handleSessionChange(idx, "speaker", e.target.value)}
                          placeholder="e.g. Bishop David, or Guest Minister (TBA)"
                          className="min-h-11 px-2.5 bg-white border border-slate-200 rounded-lg text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F472A]"
                        />
                      </div>

                      {/* Time */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`session-${idx}-time`} className="text-sm font-bold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Time Range</span>
                        </label>
                        <input
                          id={`session-${idx}-time`}
                          type="text"
                          required
                          value={sess.time}
                          onChange={(e) => handleSessionChange(idx, "time", e.target.value)}
                          placeholder="09:00 AM – 12:30 PM"
                          className="min-h-11 px-2.5 bg-white border border-slate-200 rounded-lg text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F472A]"
                        />
                      </div>

                      {/* Hall */}
                      <div className="flex flex-col gap-1">
                        <label htmlFor={`session-${idx}-hall`} className="text-sm font-bold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Hall / Venue</span>
                        </label>
                        <input
                          id={`session-${idx}-hall`}
                          type="text"
                          required
                          value={sess.hall}
                          onChange={(e) => handleSessionChange(idx, "hall", e.target.value)}
                          placeholder="Main Auditorium"
                          className="min-h-11 px-2.5 bg-white border border-slate-200 rounded-lg text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0F472A]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 h-11 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
              >
                {isSaving ? <span>Saving programme…</span> : viewMode === "create" ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#A3E635]" />
                    <span>Create Programme & Initialize 5 Sessions</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-[#A3E635]" />
                    <span>Save Programme & Preacher Changes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
