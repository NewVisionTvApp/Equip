import { useState, useEffect } from "react";
import { X, Save, Clock, MapPin, User, BookOpen } from "lucide-react";
import { SessionConfig } from "@/lib/store";

interface EditSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionConfig | null;
  onSave: (sessionKey: string, updatedData: Partial<SessionConfig>) => void;
}

export default function EditSessionModal({
  isOpen,
  onClose,
  session,
  onSave,
}: EditSessionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    speaker: "",
    time: "",
    hall: "",
  });

  useEffect(() => {
    if (session) {
      setFormData({
        name: session.name || "",
        speaker: session.speaker || "",
        time: session.time || "",
        hall: session.hall || "",
      });
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(session.key, {
      name: formData.name.trim(),
      speaker: formData.speaker.trim() || "Guest Minister (TBA)",
      time: formData.time.trim(),
      hall: formData.hall.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 flex flex-col gap-5 relative animate-in zoom-in-95 duration-200 ease-apple-spring">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1 pr-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-[#0F472A] px-2 py-0.5 rounded-full">
              {session.short} · {session.day}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Edit Session & Preacher
          </h2>
          <p className="text-xs text-slate-500">
            Customize the minister, topic, hall, and schedule for this programme session.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Preacher / Speaker Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0F472A]" />
              <span>Preacher / Minister Name</span>
            </label>
            <input
              type="text"
              required
              value={formData.speaker}
              onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
              placeholder="e.g. Bishop David O., Rev. Dr. Grace, or Guest Minister (TBA)"
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
            />
            <span className="text-[10px] text-slate-400">
              Leave as "TBA" if the guest minister is yet to be announced.
            </span>
          </div>

          {/* Session Topic / Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#0F472A]" />
              <span>Session Topic / Name</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Evening Anointing & Deliverance Plenary"
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
            />
          </div>

          {/* Time & Venue Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Time Range</span>
              </label>
              <input
                type="text"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="e.g. 05:30 PM – 08:30 PM"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Hall / Room Venue</span>
              </label>
              <input
                type="text"
                required
                value={formData.hall}
                onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                placeholder="e.g. Main Auditorium"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F472A]/20 focus:border-[#0F472A]"
              />
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 h-11 bg-[#0F472A] hover:bg-[#165A36] active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Save className="w-4 h-4 text-[#A3E635]" />
              <span>Save Session Details</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
