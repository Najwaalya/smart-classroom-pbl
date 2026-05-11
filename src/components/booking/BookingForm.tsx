"use client";

import { useMemo, useState } from "react";
import {
  Plus, CheckCircle2, AlertTriangle, CalendarCheck, Clock,
} from "lucide-react";
import { TIME_SLOTS, DAYS, PURPOSES, toMin, getDayLabel } from "@/lib/schedule-utils";
import { getUserInfo } from "@/lib/auth";

export interface BookingRecord {
  id: string;
  roomId: string;
  day: string;
  startTime: string;
  endTime: string;
  purpose: string;
  bookedBy: string;
  bookedById: string;
  bookedAt: Date;
}

export interface BookingFormProps {
  selectedFloor: string;
  selectedDay: string;
  roomsForFloor: string[];
  onBooked: (record: BookingRecord) => void;
  checkSlotBlocked: (roomId: string, day: string, slot: typeof TIME_SLOTS[0]) => boolean;
}

export function BookingForm({
  selectedFloor,
  selectedDay,
  roomsForFloor,
  onBooked,
  checkSlotBlocked,
}: BookingFormProps) {
  const userInfo = getUserInfo();
  const dayLabel = getDayLabel(selectedDay);

  const [roomId, setRoomId] = useState(roomsForFloor[0] ?? "");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useMemo(() => {
    setRoomId(roomsForFloor[0] ?? "");
    setSelectedSlots([]);
  }, [roomsForFloor]);

  const { startTime, endTime } = useMemo(() => {
    if (selectedSlots.length === 0) return { startTime: "", endTime: "" };
    const sorted = [...selectedSlots].sort((a, b) => a - b);
    const firstSlot = TIME_SLOTS.find(s => s.slot === sorted[0]);
    const lastSlot = TIME_SLOTS.find(s => s.slot === sorted[sorted.length - 1]);
    return {
      startTime: firstSlot?.start ?? "",
      endTime: lastSlot?.end ?? "",
    };
  }, [selectedSlots]);

  const conflict = useMemo(() => {
    if (selectedSlots.length === 0) return null;
    for (const slotNum of selectedSlots) {
      const slot = TIME_SLOTS.find(s => s.slot === slotNum);
      if (!slot) continue;
      if (checkSlotBlocked(roomId, selectedDay, slot))
        return `Slot ${slotNum} bentrok dengan jadwal kelas.`;
    }
    return null;
  }, [roomId, selectedDay, selectedSlots, checkSlotBlocked]);

  const duration = useMemo(() => {
    if (!startTime || !endTime) return null;
    const diff = toMin(endTime) - toMin(startTime);
    if (diff <= 0) return null;
    const h = Math.floor(diff / 60), m = diff % 60;
    return h > 0 ? `${h} jam${m > 0 ? ` ${m} menit` : ""}` : `${m} menit`;
  }, [startTime, endTime]);

  function toggleSlot(slotNum: number) {
    setSelectedSlots(prev => {
      if (prev.includes(slotNum)) return prev.filter(s => s !== slotNum);
      return [...prev, slotNum].sort((a, b) => a - b);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!userInfo) {
      setError("Kamu harus login.");
      return;
    }
    if (selectedSlots.length === 0) {
      setError("Pilih minimal 1 slot waktu.");
      return;
    }
    if (conflict) {
      setError(conflict);
      return;
    }

    const record: BookingRecord = {
      id: Math.random().toString(36).slice(2, 9),
      roomId,
      day: selectedDay,
      startTime,
      endTime,
      purpose: useCustom ? custom.trim() : purpose,
      bookedBy: userInfo.name,
      bookedById: userInfo.id,
      bookedAt: new Date(),
    };
    onBooked(record);

    setSelectedSlots([]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3 anim-scale-in">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-emerald-800">Booking Berhasil! 🎉</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            <span className="font-black">{roomId}</span> · {dayLabel} · {startTime}–{endTime}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <Plus size={15} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">Form Booking Ruangan</p>
          <p className="text-[10px] text-slate-400 font-medium">Pilih ruangan & slot waktu kosong untuk booking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pilih Ruangan */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ruangan</label>
          <select
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
          >
            {roomsForFloor.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Hari (read-only) */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hari</label>
          <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-black text-slate-600">
            {dayLabel}
          </div>
        </div>
      </div>

      {/* Pilih Slot Waktu */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Slot Waktu</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
          {TIME_SLOTS.map(slot => {
            const isSelected = selectedSlots.includes(slot.slot);
            const isBlocked = checkSlotBlocked(roomId, selectedDay, slot);

            return (
              <button
                key={slot.slot}
                type="button"
                onClick={() => !isBlocked && toggleSlot(slot.slot)}
                disabled={isBlocked}
                className={`px-3 py-2 rounded-lg text-xs font-black border transition-all ${
                  isBlocked
                    ? "bg-red-100 text-red-400 border-red-200 cursor-not-allowed opacity-50"
                    : isSelected
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div>{slot.slot}</div>
                <div className="text-[9px] opacity-75">{slot.start}</div>
              </button>
            );
          })}
        </div>
        {selectedSlots.length > 0 && (
          <p className="text-[10px] text-slate-500 mt-1.5">
            Slot terpilih: <span className="font-black">{selectedSlots.join(", ")}</span>
          </p>
        )}
      </div>

      {/* Preview durasi */}
      {duration && !conflict && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
          <p className="text-[11px] font-bold text-emerald-700">
            {startTime} – {endTime} · Durasi <span className="font-black">{duration}</span> ✓
          </p>
        </div>
      )}

      {/* Error konflik */}
      {(conflict || error) && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
          <AlertTriangle size={13} className="text-red-500 shrink-0" />
          <p className="text-[11px] font-bold text-red-600">{conflict ?? error}</p>
        </div>
      )}

      {/* Keperluan */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Keperluan</label>
        {!useCustom ? (
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPurpose(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                  purpose === p ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Tulis keperluan..."
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-all"
          />
        )}
        <button
          type="button"
          onClick={() => setUseCustom(p => !p)}
          className="text-[10px] font-black text-[var(--color-primary)] hover:underline mt-1.5 block"
        >
          {useCustom ? "← Pilih dari daftar" : "Tulis sendiri →"}
        </button>
      </div>

      <button
        type="submit"
        disabled={!!conflict || selectedSlots.length === 0}
        className="w-full py-3.5 bg-[var(--color-primary)] text-white text-sm font-black rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <CalendarCheck size={16} /> Booking Sekarang
      </button>
    </form>
  );
}
