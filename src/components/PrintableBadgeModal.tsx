import { Printer, X } from "lucide-react";
import QRCodeView from "./QRCodeView";

interface PrintableBadgeProps {
  isOpen: boolean;
  onClose: () => void;
  participant: {
    id: string;
    fullName: string;
    roleOffice: string;
    churchName: string;
    isOrdained: boolean;
    location?: string;
  } | null;
  eventName: string;
}

export default function PrintableBadgeModal({
  isOpen,
  onClose,
  participant,
  eventName,
}: PrintableBadgeProps) {
  if (!isOpen || !participant) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-6 relative print:shadow-none print:border-none print:max-w-none print:w-full print:p-0">
        {/* Screen-only Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="print:hidden absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Screen-only Explanatory Notice */}
        <div className="print:hidden flex flex-col gap-1 pr-6">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#0F472A]" />
            <h3 className="text-base font-extrabold text-slate-900">Physical Delegate Badge / Slip</h3>
          </div>
          <p className="text-xs text-slate-500">
            For attendees who do not use smartphones or email. Print this badge or write their Unique ID on a card for lanyards.
          </p>
        </div>

        {/* THE PHYSICAL BADGE CARD (Formatted for standard 3" x 4" Lanyard or Thermal Slip) */}
        <div className="border-2 border-dashed border-slate-400 rounded-3xl p-6 bg-slate-50/50 flex flex-col gap-4 text-center items-center print:border-2 print:border-black print:rounded-2xl print:bg-white print:p-6 print:m-4">
          {/* Badge Brand Header */}
          <div className="flex items-center justify-between w-full border-b pb-3 border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0F472A] p-1 flex items-center justify-center print:border print:border-black">
                <img src="/logo.png" alt="Equip" className="w-full h-full object-contain filter invert" />
              </div>
              <span className="font-extrabold text-xs tracking-tight text-slate-900">EQUIP 3.0</span>
            </div>

            <span
              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                participant.isOrdained
                  ? "bg-[#0F472A] text-[#A3E635] print:border print:border-black"
                  : "bg-slate-200 text-slate-800"
              }`}
            >
              {participant.isOrdained ? "Ordained Clergy" : "Delegate"}
            </span>
          </div>

          {/* Delegate Name & Role */}
          <div className="flex flex-col items-center my-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">
              {participant.fullName}
            </span>
            <span className="text-xs font-bold text-slate-600 mt-1">{participant.roleOffice}</span>
            <span className="text-xs font-medium text-slate-500 mt-0.5">{participant.churchName}</span>
          </div>

          {/* Huge Unique ID (For Verbal or Usher Check-in) */}
          <div className="w-full bg-white border border-slate-300 rounded-2xl p-3 flex flex-col items-center shadow-xs print:border-2 print:border-black">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Permanent Participant ID
            </span>
            <span className="font-mono text-3xl font-black text-[#0F472A] tracking-widest my-0.5">
              {participant.id}
            </span>
            <span className="text-[10px] text-slate-400">Keep this ID for every monthly gathering</span>
          </div>

          {/* QR Code Graphic for Usher Entrance Door Scanner */}
          <div className="flex items-center justify-center gap-3 w-full pt-1">
            <div className="w-16 h-16 bg-white border border-slate-300 rounded-xl p-1 flex items-center justify-center shadow-xs overflow-hidden print:border-black">
              <QRCodeView value={participant.id} size={58} darkColor="#000000" />
            </div>
            <div className="text-left text-[11px] text-slate-500 flex flex-col">
              <span className="font-bold text-slate-900">Door Usher Scanner</span>
              <span>Valid for all 5 sessions</span>
              <span className="text-[10px] text-slate-400">{eventName}</span>
            </div>
          </div>

          {/* 5-Session Physical Punch-Card Grid */}
          <div className="w-full pt-3 border-t border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
              Programme Sessions Check-in
            </span>
            <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-slate-700">
              <div className="border border-slate-300 rounded p-1 text-center bg-white">
                <div>Mon AM</div>
                <div className="text-slate-300 mt-0.5">[ &nbsp; ]</div>
              </div>
              <div className="border border-slate-300 rounded p-1 text-center bg-white">
                <div>Mon PM</div>
                <div className="text-slate-300 mt-0.5">[ &nbsp; ]</div>
              </div>
              <div className="border border-slate-300 rounded p-1 text-center bg-white">
                <div>Tue AM</div>
                <div className="text-slate-300 mt-0.5">[ &nbsp; ]</div>
              </div>
              <div className="border border-slate-300 rounded p-1 text-center bg-white">
                <div>Tue PM</div>
                <div className="text-slate-300 mt-0.5">[ &nbsp; ]</div>
              </div>
              <div className="border border-slate-300 rounded p-1 text-center bg-white">
                <div>Wed AM</div>
                <div className="text-slate-300 mt-0.5">[ &nbsp; ]</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Print / Close) */}
        <div className="print:hidden flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 h-11 bg-[#0F472A] hover:bg-[#165A36] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Physical Badge</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
