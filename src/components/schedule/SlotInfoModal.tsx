"use client";

import { X, Calendar, Clock, MapPin, Info } from "lucide-react";
import { getDayLabel, TIME_SLOTS } from "@/lib/schedule-utils";
import Link from "next/link";

interface SlotInfoModalProps {
  roomId: string;
  day: string;
  slot: typeof TIME_SLOTS[0];
  onClose: () => void;
  canEdit?: boolean;
}

export function SlotInfoModal({
  roomId,
  day,
  slot,
  onClose,
  canEdit = false,
}: SlotInfoModalProps) {
  const dayLabel = getDayLabel(day);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden anim-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
          <h2 className="text-xl font-black">Slot Tersedia</h2>
          <p className="text-xs text-emerald-100 mt-1">Ruangan kosong dan bisa dibooking</p>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Info Slot */}
          <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-slate-500" />
              <span className="font-black text-slate-800">{roomId}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={16} className="text-slate-500" />
              <span className="text-slate-600">{dayLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={16} className="text-slate-500" />
              <span className="text-slate-600">{slot.start} – {slot.end}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 leading-relaxed">
              <span className="font-black">Untuk booking ruangan ini:</span>
              <br />
              Silakan kunjungi halaman <span className="font-black">Booking Ruangan</span> untuk melakukan booking dengan mengisi keperluan dan jumlah orang.
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
            <Link
              href="/booking"
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-black hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30 text-center"
            >
              Ke Halaman Booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
