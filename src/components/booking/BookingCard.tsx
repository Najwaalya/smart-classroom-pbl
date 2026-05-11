import { CalendarCheck, X } from "lucide-react";
import { BookingRecord } from "./BookingForm";
import { getDayLabel } from "@/lib/schedule-utils";

export interface BookingCardProps {
  booking: BookingRecord;
  isOwner: boolean;
  onCancel?: (id: string) => void;
}

export function BookingCard({ booking, isOwner, onCancel }: BookingCardProps) {
  const dayLabel = getDayLabel(booking.day);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
          <CalendarCheck size={14} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-black text-slate-800">{booking.roomId} · {dayLabel}</p>
          <p className="text-[10px] text-slate-500 font-semibold">{booking.startTime}–{booking.endTime} · {booking.purpose}</p>
        </div>
      </div>
      {isOwner && onCancel && (
        <button
          onClick={() => onCancel(booking.id)}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg hover:bg-red-100 transition-colors border border-red-200 shrink-0"
        >
          <X size={11} /> Batal
        </button>
      )}
    </div>
  );
}
