"use client";


import { useMemo, useState, useEffect, useCallback } from "react";
import { schedules } from "@/lib/schedule";
import { useBooking } from "@/contexts/BookingContext";
import { useRoomData } from "@/contexts/RoomDataContext";
import { getRole, getUserInfo } from "@/lib/auth";
import {
  X, CalendarCheck, Clock, AlertTriangle,
  CheckCircle2, Info, Plus, Users,
} from "lucide-react";

// ── Konstanta ──────────────────────────────────────────────────────────────

const DAYS = [
  { key: "Monday",    label: "Senin",  short: "Sen" },
  { key: "Tuesday",   label: "Selasa", short: "Sel" },
  { key: "Wednesday", label: "Rabu",   short: "Rab" },
  { key: "Thursday",  label: "Kamis",  short: "Kam" },
  { key: "Friday",    label: "Jumat",  short: "Jum" },
];

const TIME_SLOTS = [
  { slot: 1,  start: "07:00", end: "07:50"  },
  { slot: 2,  start: "07:50", end: "08:40"  },
  { slot: 3,  start: "08:40", end: "09:30"  },
  { slot: 4,  start: "09:40", end: "10:30"  },
  { slot: 5,  start: "10:30", end: "11:20"  },
  { slot: 6,  start: "11:20", end: "12:10"  },
  { slot: 7,  start: "12:50", end: "13:40"  },
  { slot: 8,  start: "13:40", end: "14:30"  },
  { slot: 9,  start: "14:30", end: "15:20"  },
  { slot: 10, start: "15:30", end: "16:20"  },
  { slot: 11, start: "16:20", end: "17:10"  },
  { slot: 12, start: "17:10", end: "18:00"  },
];

const FLOOR_SUFFIX: Record<string, string[]> = {
  "5": ["_5B"], "6": ["_6T"], "7": ["_7T", "_7B"], "8": ["_8T"],
};
const FLOORS = ["5", "6", "7", "8"];

// Jam pilihan untuk form booking (07:00 – 21:00, per 30 menit)
const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2,"0")}:00`);
  if (h < 21) TIME_OPTIONS.push(`${String(h).padStart(2,"0")}:30`);
}

const PURPOSES = [
  "Belajar kelompok", "Rapat / BEM", "Praktikum mandiri",
  "Diskusi skripsi", "Persiapan presentasi", "Kegiatan UKM", "Lainnya",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getRoomsForFloor(floor: string): string[] {
  const suffixes = FLOOR_SUFFIX[floor] ?? [];
  return Array.from(new Set(
    schedules.filter(s => suffixes.some(sfx => s.room.endsWith(sfx))).map(s => s.room)
  )).sort();
}

function getAllRooms(): string[] {
  return Array.from(new Set(schedules.map(s => s.room))).sort();
}

// Cek apakah slot ini ada di jadwal resmi
function getScheduleForSlot(roomId: string, day: string, slot: typeof TIME_SLOTS[0]) {
  return schedules.find(s =>
    s.room === roomId && s.day === day &&
    toMin(s.start) < toMin(slot.end) && toMin(s.end) > toMin(slot.start)
  ) ?? null;
}

// Cek apakah slot masuk dalam rentang booking
function slotInRange(slot: typeof TIME_SLOTS[0], startTime: string, endTime: string): boolean {
  return toMin(startTime) < toMin(slot.end) && toMin(endTime) > toMin(slot.start);
}

// Validasi konflik dengan jadwal kelas
function checkConflict(roomId: string, day: string, startTime: string, endTime: string): string | null {
  if (toMin(startTime) >= toMin(endTime)) return "Jam selesai harus lebih dari jam mulai.";
  const conflict = schedules.find(s =>
    s.room === roomId && s.day === day &&
    toMin(startTime) < toMin(s.end) && toMin(endTime) > toMin(s.start)
  );
  if (conflict) return `Bentrok dengan jadwal kelas ${conflict.start}–${conflict.end}.`;
  return null;
}

// Booking key: roomId__day__startTime__endTime
function bookingKey(roomId: string, day: string, startTime: string, endTime: string) {
  return `${roomId}__${day}__${startTime}__${endTime}`;
}

// ── Tipe booking ───────────────────────────────────────────────────────────

interface BookingRecord {
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

// ── Form Booking ───────────────────────────────────────────────────────────

function BookingForm({
  selectedFloor,
  selectedDay,
  onBooked,
  checkSlotBlocked,
}: {
  selectedFloor: string;
  selectedDay: string;
  onBooked: (record: BookingRecord) => void;
  checkSlotBlocked: (roomId: string, day: string, slot: typeof TIME_SLOTS[0]) => boolean;
}) {
  const userInfo = getUserInfo();
  const allRooms = useMemo(() => getRoomsForFloor(selectedFloor), [selectedFloor]);
  const dayLabel = DAYS.find(d => d.key === selectedDay)?.label ?? selectedDay;

  const [roomId,    setRoomId]    = useState(allRooms[0] ?? "");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [purpose,   setPurpose]   = useState(PURPOSES[0]);
  const [custom,    setCustom]    = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState("");

  // Update roomId saat lantai berubah
  useMemo(() => { setRoomId(allRooms[0] ?? ""); setSelectedSlots([]); }, [allRooms]);

  // Hitung start & end time dari slot yang dipilih
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
    if (!userInfo) { setError("Kamu harus login."); return; }
    if (selectedSlots.length === 0) { setError("Pilih minimal 1 slot waktu."); return; }
    if (conflict)  { setError(conflict); return; }

    const record: BookingRecord = {
      id: Math.random().toString(36).slice(2, 9),
      roomId, day: selectedDay, startTime, endTime,
      purpose: useCustom ? custom.trim() : purpose,
      bookedBy: userInfo.name, bookedById: userInfo.id,
      bookedAt: new Date(),
    };
    onBooked(record);
    
    setSelectedSlots([]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (success) return (
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

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <Plus size={15} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">Form Booking Ruangan</p>
          <p className="text-[10px] text-slate-400 font-medium">Pilih slot waktu → kotak di jadwal otomatis berubah warna merah</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pilih Ruangan */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ruangan</label>
          <select value={roomId} onChange={e => setRoomId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all">
            {allRooms.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Hari (read-only, ikut tab hari) */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hari</label>
          <div className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-black text-slate-600">
            {dayLabel}
          </div>
        </div>
      </div>

      {/* Pilih Slot Waktu */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pilih Slot Waktu (Klik untuk pilih/batal)</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
          {TIME_SLOTS.map(slot => {
            const isSelected = selectedSlots.includes(slot.slot);
            const isBlocked  = checkSlotBlocked(roomId, selectedDay, slot);
            
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
              <button key={p} type="button" onClick={() => setPurpose(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                  purpose === p ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}>{p}</button>
            ))}
          </div>
        ) : (
          <input type="text" value={custom} onChange={e => setCustom(e.target.value)}
            placeholder="Tulis keperluan..." required
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-all" />
        )}
        <button type="button" onClick={() => setUseCustom(p => !p)}
          className="text-[10px] font-black text-[var(--color-primary)] hover:underline mt-1.5 block">
          {useCustom ? "← Pilih dari daftar" : "Tulis sendiri →"}
        </button>
      </div>

      <button type="submit" disabled={!!conflict || selectedSlots.length === 0}
        className="w-full py-3.5 bg-[var(--color-primary)] text-white text-sm font-black rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        <CalendarCheck size={16} /> Booking Sekarang
      </button>
    </form>
  );
}

// ── Halaman Utama ──────────────────────────────────────────────────────────

// ── Form Reschedule (slot-based) ───────────────────────────────────────────

function RescheduleForm({
  modal,
  onSave,
  onCancel,
}: {
  modal: { roomId: string; day: string; schedInfo: { start: string; end: string } };
  onSave: (newDay: string, newStart: string, newEnd: string) => void;
  onCancel: () => void;
}) {
  const [newDay, setNewDay] = useState(modal.day);
  const [selectedSlots, setSelectedSlots] = useState<number[]>(() => {
    // Pre-select slot yang sesuai jadwal asli
    return TIME_SLOTS
      .filter(s =>
        toMin(s.start) >= toMin(modal.schedInfo.start) &&
        toMin(s.end) <= toMin(modal.schedInfo.end)
      )
      .map(s => s.slot);
  });
  const [error, setError] = useState("");

  const { startTime, endTime } = useMemo(() => {
    if (selectedSlots.length === 0) return { startTime: "", endTime: "" };
    const sorted = [...selectedSlots].sort((a, b) => a - b);
    const first = TIME_SLOTS.find(s => s.slot === sorted[0]);
    const last  = TIME_SLOTS.find(s => s.slot === sorted[sorted.length - 1]);
    return { startTime: first?.start ?? "", endTime: last?.end ?? "" };
  }, [selectedSlots]);

  function toggleSlot(slotNum: number) {
    setSelectedSlots(prev =>
      prev.includes(slotNum)
        ? prev.filter(s => s !== slotNum)
        : [...prev, slotNum].sort((a, b) => a - b)
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedSlots.length === 0) { setError("Pilih minimal 1 slot waktu."); return; }
    onSave(newDay, startTime, endTime);
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
      {/* Info jadwal asli */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
        <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700">
          Jadwal asli:{" "}
          <span className="font-black">
            {DAYS.find(d => d.key === modal.day)?.label} · {modal.schedInfo.start}–{modal.schedInfo.end}
          </span>
        </p>
      </div>

      {/* Pilih Hari */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hari Baru</label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map(d => (
            <button
              key={d.key}
              type="button"
              onClick={() => setNewDay(d.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                newDay === d.key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pilih Slot Waktu */}
      <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Pilih Slot Waktu Baru
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TIME_SLOTS.map(slot => {
            const isSelected = selectedSlots.includes(slot.slot);
            return (
              <button
                key={slot.slot}
                type="button"
                onClick={() => toggleSlot(slot.slot)}
                className={`px-2 py-2 rounded-lg text-xs font-black border transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <div className="font-black">{slot.slot}</div>
                <div className="text-[9px] opacity-75">{slot.start}</div>
              </button>
            );
          })}
        </div>
        {selectedSlots.length > 0 && (
          <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-500" />
            <span className="font-black">{startTime} – {endTime}</span>
            {" · "}Slot {selectedSlots.join(", ")}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
          <AlertTriangle size={12} className="text-red-500 shrink-0" />
          <p className="text-[11px] font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* Tombol */}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-all">
          Batal
        </button>
        <button type="submit" disabled={selectedSlots.length === 0}
          className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          Simpan Perubahan
        </button>
      </div>
    </form>
  );
}

export default function SchedulePage() {
  const role     = getRole();
  const userInfo = getUserInfo();
  const myId     = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const { rooms } = useRoomData();

  const [selectedFloor, setSelectedFloor] = useState<string>("5");
  const [selectedDay,   setSelectedDay]   = useState<string>(
    () => DAYS.find(d => d.key === new Date().toLocaleDateString("en-US", { weekday: "long" }))?.key ?? "Monday"
  );

  // Semua booking yang dibuat via form ini
  const [localBookings, setLocalBookings] = useState<BookingRecord[]>([]);
  // Notifikasi auto-cancel
  const [autoCancelMsg, setAutoCancelMsg] = useState<string | null>(null);

  // Modal detail slot
  const [detailSlot, setDetailSlot] = useState<{
    roomId: string; day: string; slot: typeof TIME_SLOTS[0];
    schedInfo: { start: string; end: string } | null;
    booking: BookingRecord | null;
  } | null>(null);

  // Modal reschedule jadwal kelas
  const [rescheduleModal, setRescheduleModal] = useState<{
    roomId: string; day: string; schedInfo: { start: string; end: string };
  } | null>(null);

  // State untuk jadwal yang dibatalkan/diubah oleh mahasiswa
  const [cancelledSchedules, setCancelledSchedules] = useState<Set<string>>(() => new Set());
  const [rescheduledClasses, setRescheduledClasses] = useState<Record<string, { newDay: string; newStart: string; newEnd: string }>>({});

  const roomsOnFloor = useMemo(() => getRoomsForFloor(selectedFloor), [selectedFloor]);

  // Helper untuk membuat key jadwal
  function scheduleKey(roomId: string, day: string, start: string, end: string) {
    return `${roomId}__${day}__${start}__${end}`;
  }

  // Fungsi untuk membatalkan jadwal kelas (dosen berhalangan)
  function cancelSchedule(roomId: string, day: string, start: string, end: string) {
    const key = scheduleKey(roomId, day, start, end);
    setCancelledSchedules(prev => new Set([...prev, key]));
    setDetailSlot(null);
  }

  // Fungsi untuk reschedule jadwal kelas
  function rescheduleClass(roomId: string, oldDay: string, oldStart: string, oldEnd: string, newDay: string, newStart: string, newEnd: string) {
    const oldKey = scheduleKey(roomId, oldDay, oldStart, oldEnd);
    setRescheduledClasses(prev => ({
      ...prev,
      [oldKey]: { newDay, newStart, newEnd }
    }));
    setRescheduleModal(null);
  }

  // Cek apakah jadwal ini sudah dibatalkan
  function isScheduleCancelled(roomId: string, day: string, start: string, end: string): boolean {
    return cancelledSchedules.has(scheduleKey(roomId, day, start, end));
  }

  // Modifikasi getScheduleForSlot untuk memperhitungkan pembatalan & reschedule
  function getActiveScheduleForSlot(roomId: string, day: string, slot: typeof TIME_SLOTS[0]) {
    const sched = schedules.find(s =>
      s.room === roomId && s.day === day &&
      toMin(s.start) < toMin(slot.end) && toMin(s.end) > toMin(slot.start)
    );
    
    if (!sched) return null;
    
    // Cek apakah jadwal ini dibatalkan
    if (isScheduleCancelled(roomId, day, sched.start, sched.end)) return null;
    
    // Cek apakah jadwal ini di-reschedule
    const reschedKey = scheduleKey(roomId, day, sched.start, sched.end);
    const resched = rescheduledClasses[reschedKey];
    if (resched) {
      // Jika di-reschedule, cek apakah slot ini masuk dalam jadwal baru
      if (resched.newDay !== day) return null; // Hari berbeda
      if (toMin(resched.newStart) >= toMin(slot.end) || toMin(resched.newEnd) <= toMin(slot.start)) return null;
      return { ...sched, start: resched.newStart, end: resched.newEnd };
    }
    
    return sched;
  }

  // ── Auto-cancel: batalkan booking jika sensor mendeteksi ada orang di kelas ──
  // Logika: jika ruangan yang di-booking ternyata sudah ada mahasiswa (students > 0)
  // dan waktu booking sudah dimulai → batalkan otomatis
  const autoCancel = useCallback(() => {
    const now     = new Date();
    const today   = now.toLocaleDateString("en-US", { weekday: "long" });
    const nowMin  = now.getHours() * 60 + now.getMinutes();

    setLocalBookings(prev => {
      const cancelled: string[] = [];
      const next = prev.filter(b => {
        if (b.day !== today) return true; // bukan hari ini, biarkan
        const bookingStartMin = toMin(b.startTime);
        const bookingEndMin   = toMin(b.endTime);
        // Hanya cek jika waktu booking sudah dimulai
        if (nowMin < bookingStartMin) return true;
        if (nowMin >= bookingEndMin)  return true; // sudah lewat, biarkan
        // Cek sensor: apakah ruangan sudah ada orang?
        const room = rooms.find(r => r.id === b.roomId);
        if (room && room.students > 0 && room.status === "active") {
          // Ada orang di dalam → batalkan booking
          if (b.bookedById === myId) {
            cancelled.push(`${b.roomId} (${b.startTime}–${b.endTime})`);
          }
          return false; // hapus booking ini
        }
        return true;
      });

      if (cancelled.length > 0) {
        setAutoCancelMsg(
          `Booking dibatalkan otomatis karena ruangan sudah terisi: ${cancelled.join(", ")}`
        );
        setTimeout(() => setAutoCancelMsg(null), 8000);
      }
      return next;
    });
  }, [rooms, myId]);

  // Jalankan auto-cancel setiap 30 detik
  useEffect(() => {
    autoCancel(); // jalankan sekali saat mount
    const interval = setInterval(autoCancel, 30_000);
    return () => clearInterval(interval);
  }, [autoCancel]);

  function addBooking(record: BookingRecord) {
    setLocalBookings(prev => [...prev, record]);
  }

  function cancelLocalBooking(id: string) {
    setLocalBookings(prev => prev.filter(b => b.id !== id));
  }

  // Cari booking yang overlap dengan slot tertentu
  function getBookingForSlot(roomId: string, day: string, slot: typeof TIME_SLOTS[0]): BookingRecord | null {
    return localBookings.find(b =>
      b.roomId === roomId && b.day === day &&
      slotInRange(slot, b.startTime, b.endTime)
    ) ?? null;
  }

  // Warna kotak
  function getBoxColor(roomId: string, day: string, slot: typeof TIME_SLOTS[0]): {
    bg: string; label: string; clickable: boolean;
  } {
    const booking = getBookingForSlot(roomId, day, slot);
    const sched   = getActiveScheduleForSlot(roomId, day, slot); // Gunakan yang sudah filter cancel/reschedule

    // Cek apakah jadwal kelas sudah selesai (otomatis hijau kembali)
    if (sched) {
      const now = new Date();
      const today = now.toLocaleDateString("en-US", { weekday: "long" });
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const schedEndMin = toMin(sched.end);
      
      // Jika hari ini dan jam sudah lewat, tampilkan hijau
      if (today === day && nowMin >= schedEndMin) {
        return { bg: "bg-emerald-500 border-emerald-600", label: slot.start, clickable: false };
      }
      
      // Jika masih dalam jadwal, tampilkan merah
      return { bg: "bg-red-500 border-red-600", label: slot.start, clickable: true };
    }

    // Booking ditampilkan merah (bukan biru)
    if (booking) {
      const isMe = booking.bookedById === myId;
      return isMe
        ? { bg: "bg-red-600 border-red-700 ring-2 ring-red-300 ring-offset-1", label: "✓", clickable: true }
        : { bg: "bg-slate-400 border-slate-500", label: slot.start, clickable: true };
    }
    
    return { bg: "bg-emerald-500 border-emerald-600", label: slot.start, clickable: false };
  }

  // Stat
  const stats = useMemo(() => {
    let kosong = 0, jadwal = 0, terbooked = 0;
    for (const room of roomsOnFloor) {
      for (const slot of TIME_SLOTS) {
        const booking = getBookingForSlot(room, selectedDay, slot);
        const sched   = getActiveScheduleForSlot(room, selectedDay, slot); // Gunakan yang sudah filter
        if (booking) terbooked++;
        else if (sched) jadwal++;
        else kosong++;
      }
    }
    return { kosong, jadwal, terbooked };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomsOnFloor, selectedDay, localBookings, cancelledSchedules, rescheduledClasses]);

  // Booking saya hari ini
  const myBookingsToday = useMemo(() =>
    localBookings.filter(b => b.bookedById === myId && b.day === selectedDay),
    [localBookings, myId, selectedDay]
  );

  const dayLabel = DAYS.find(d => d.key === selectedDay)?.label ?? selectedDay;

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal & Booking Ruangan</h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === "mahasiswa"
              ? "Isi form booking di bawah → kotak di jadwal otomatis berubah warna."
              : "Pantau status semua slot ruangan per hari."}
          </p>
        </div>

        {/* NOTIFIKASI AUTO-CANCEL */}
        {autoCancelMsg && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-200 anim-scale-in">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-black text-red-800">Booking Dibatalkan Otomatis</p>
              <p className="text-xs text-red-600 mt-0.5">{autoCancelMsg}</p>
            </div>
            <button onClick={() => setAutoCancelMsg(null)} className="text-red-400 hover:text-red-600 shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        {/* PANDUAN — hanya mahasiswa */}
        {role === "mahasiswa" && (
          <div className="flex items-start gap-3 p-4 bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/15">
            <Info size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-black text-slate-800">Cara booking:</span>{" "}
              Pilih lantai & hari → pilih slot waktu yang tersedia → isi keperluan → klik <span className="font-black">Booking Sekarang</span>.
              Kotak di jadwal akan otomatis berubah <span className="font-black text-red-600">merah</span> sesuai slot yang kamu booking.
              <br />
              <span className="font-black text-red-600">Merah</span> = ada jadwal kelas / terbooked · <span className="font-black text-emerald-600">Hijau</span> = kosong
              <br />
              <span className="font-black text-blue-600">💡 Fitur:</span> Klik kotak merah jadwal kelas untuk mengubah jam atau membatalkan jika dosen berhalangan.
              <br />
              <span className="font-black text-orange-600">⚠️ Auto-cancel:</span> Booking akan dibatalkan otomatis jika sensor mendeteksi ruangan sudah terisi saat jam booking dimulai.
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lantai</span>
            <div className="flex bg-white/70 p-1 rounded-xl shadow-sm border border-slate-200 gap-0.5">
              {FLOORS.map(f => (
                <button key={f} onClick={() => setSelectedFloor(f)}
                  className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${
                    selectedFloor === f ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}>Lt. {f}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hari</span>
            <div className="flex bg-white/70 p-1 rounded-xl shadow-sm border border-slate-200 gap-0.5">
              {DAYS.map(d => (
                <button key={d.key} onClick={() => setSelectedDay(d.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    selectedDay === d.key ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}>{d.short}</button>
              ))}
            </div>
          </div>
        </div>

        {/* FORM BOOKING — hanya mahasiswa */}
        {role === "mahasiswa" && (
          <BookingForm
            selectedFloor={selectedFloor}
            selectedDay={selectedDay}
            onBooked={addBooking}
            checkSlotBlocked={(roomId, day, slot) => !!getActiveScheduleForSlot(roomId, day, slot)}
          />
        )}

        {/* STAT */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Slot Kosong",  value: stats.kosong,    color: "bg-emerald-500" },
            { label: "Ada Jadwal",   value: stats.jadwal,    color: "bg-red-500" },
            { label: "Terbooked",    value: stats.terbooked, color: "bg-blue-600" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className={`w-3 h-3 rounded-sm ${s.color} shrink-0`} />
              <span className="text-xs font-black text-slate-700">{s.value}</span>
              <span className="text-[10px] font-bold text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>

        {/* GRID JADWAL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header slot waktu */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 overflow-x-auto">
            <div className="grid gap-1.5 min-w-[700px]" style={{ gridTemplateColumns: `110px repeat(${TIME_SLOTS.length}, 1fr)` }}>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">Ruangan</div>
              {TIME_SLOTS.map(ts => (
                <div key={ts.slot} className="text-center">
                  <div className="text-[9px] font-black text-slate-600">{ts.slot}</div>
                  <div className="text-[8px] text-slate-400 font-medium">{ts.start}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Baris per ruangan */}
          <div className="p-3 flex flex-col gap-2 overflow-x-auto">
            {roomsOnFloor.map(room => (
              <div key={room}
                className="grid gap-1.5 items-center min-w-[700px]"
                style={{ gridTemplateColumns: `110px repeat(${TIME_SLOTS.length}, 1fr)` }}
              >
                <div className="text-[10px] font-black text-slate-700 truncate pr-2 flex items-center gap-1.5">
                  {room}
                  {/* Sensor live */}
                  {(() => {
                    const liveRoom = rooms.find(r => r.id === room);
                    if (!liveRoom) return null;
                    return (
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                        liveRoom.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : liveRoom.status === "uncertain"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        <Users size={8} />
                        {liveRoom.students}
                      </span>
                    );
                  })()}
                </div>
                {TIME_SLOTS.map(slot => {
                  const box     = getBoxColor(room, selectedDay, slot);
                  const booking = getBookingForSlot(room, selectedDay, slot);
                  const sched   = getActiveScheduleForSlot(room, selectedDay, slot); // Gunakan yang sudah filter

                  let tooltip = `${slot.start}–${slot.end}`;
                  if (sched)   tooltip += ` · Jadwal kelas ${sched.start}–${sched.end}`;
                  if (booking) tooltip += ` · Booking: ${booking.bookedBy} (${booking.startTime}–${booking.endTime})`;

                  return (
                    <button
                      key={slot.slot}
                      type="button"
                      title={tooltip}
                      onClick={() => {
                        if (booking || sched) {
                          setDetailSlot({ roomId: room, day: selectedDay, slot, schedInfo: sched ? { start: sched.start, end: sched.end } : null, booking: booking ?? null });
                        }
                      }}
                      className={`
                        w-full aspect-square rounded-xl border-2 flex items-center justify-center
                        text-white text-[8px] font-black transition-all duration-200
                        ${box.bg}
                        ${(booking || sched) ? "cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95" : "cursor-default"}
                      `}
                    >
                      {box.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* LEGENDA */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
          <span className="text-slate-400 uppercase tracking-widest">Keterangan:</span>
          {[
            { color: "bg-emerald-500", label: "Kosong" },
            { color: "bg-red-500",     label: "Ada jadwal kelas / Terbooked" },
            { color: "bg-slate-400",   label: "Booking orang lain" },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`w-3.5 h-3.5 rounded-sm ${l.color} inline-block shrink-0`} />
              {l.label}
            </span>
          ))}
        </div>

        {/* BOOKING AKTIF SAYA HARI INI */}
        {role === "mahasiswa" && myBookingsToday.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <CalendarCheck size={15} className="text-[var(--color-primary)]" />
              Booking Saya — {dayLabel} ({myBookingsToday.length})
            </h2>
            <div className="flex flex-col gap-2">
              {myBookingsToday.map(b => (
                <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                      <CalendarCheck size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{b.roomId} · {dayLabel}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{b.startTime}–{b.endTime} · {b.purpose}</p>
                    </div>
                  </div>
                  <button onClick={() => cancelLocalBooking(b.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg hover:bg-red-100 transition-colors border border-red-200 shrink-0">
                    <X size={11} /> Batal
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL DETAIL SLOT ── */}
      {detailSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDetailSlot(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${detailSlot.booking ? "bg-blue-100" : "bg-red-100"}`}>
                  {detailSlot.booking ? <CalendarCheck size={17} className="text-blue-600" /> : <Clock size={17} className="text-red-600" />}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{detailSlot.roomId}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {DAYS.find(d => d.key === detailSlot.day)?.label} · {detailSlot.slot.start}–{detailSlot.slot.end}
                  </p>
                </div>
              </div>
              <button onClick={() => setDetailSlot(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {detailSlot.schedInfo && (
                <>
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                    <Clock size={13} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-red-800">Jadwal Kelas</p>
                      <p className="text-[11px] text-red-600 mt-0.5">{detailSlot.schedInfo.start} – {detailSlot.schedInfo.end}</p>
                    </div>
                  </div>
                  
                  {/* Tombol aksi untuk mahasiswa */}
                  {role === "mahasiswa" && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setRescheduleModal({
                            roomId: detailSlot.roomId,
                            day: detailSlot.day,
                            schedInfo: detailSlot.schedInfo!
                          });
                          setDetailSlot(null);
                        }}
                        className="w-full py-2.5 bg-blue-50 text-blue-600 text-xs font-black rounded-xl hover:bg-blue-100 transition-all border border-blue-200 flex items-center justify-center gap-2"
                      >
                        <Clock size={13} /> Ubah Jam Kelas
                      </button>
                      <button
                        onClick={() => {
                          cancelSchedule(detailSlot.roomId, detailSlot.day, detailSlot.schedInfo!.start, detailSlot.schedInfo!.end);
                        }}
                        className="w-full py-2.5 bg-amber-50 text-amber-600 text-xs font-black rounded-xl hover:bg-amber-100 transition-all border border-amber-200 flex items-center justify-center gap-2"
                      >
                        <AlertTriangle size={13} /> Kosongkan Kelas (Dosen Berhalangan)
                      </button>
                    </div>
                  )}
                </>
              )}
              {detailSlot.booking && (
                <div className="flex flex-col gap-2">
                  <div className={`flex items-start gap-2 p-3 rounded-xl border ${detailSlot.booking.bookedById === myId ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-200"}`}>
                    <CalendarCheck size={13} className={`shrink-0 mt-0.5 ${detailSlot.booking.bookedById === myId ? "text-blue-500" : "text-slate-400"}`} />
                    <div>
                      <p className={`text-xs font-black ${detailSlot.booking.bookedById === myId ? "text-blue-800" : "text-slate-800"}`}>
                        {detailSlot.booking.bookedById === myId ? "Booking Milikmu" : "Sudah Di-booking"}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {detailSlot.booking.bookedBy} · {detailSlot.booking.startTime}–{detailSlot.booking.endTime}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{detailSlot.booking.purpose}</p>
                    </div>
                  </div>
                  {detailSlot.booking.bookedById === myId && (
                    <button onClick={() => { cancelLocalBooking(detailSlot.booking!.id); setDetailSlot(null); }}
                      className="w-full py-2.5 bg-red-50 text-red-600 text-xs font-black rounded-xl hover:bg-red-100 transition-all border border-red-200">
                      Batalkan Booking
                    </button>
                  )}
                </div>
              )}
              {!detailSlot.booking && !detailSlot.schedInfo && (
                <p className="text-sm text-slate-400 text-center py-4">Slot kosong.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RESCHEDULE JADWAL KELAS ── */}
      {rescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setRescheduleModal(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Clock size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">Ubah Jadwal Kelas</p>
                  <p className="text-[10px] text-slate-400 font-bold">{rescheduleModal.roomId}</p>
                </div>
              </div>
              <button onClick={() => setRescheduleModal(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X size={16} /></button>
            </div>
            <RescheduleForm
              modal={rescheduleModal}
              onSave={(newDay, newStart, newEnd) =>
                rescheduleClass(
                  rescheduleModal.roomId,
                  rescheduleModal.day,
                  rescheduleModal.schedInfo.start,
                  rescheduleModal.schedInfo.end,
                  newDay, newStart, newEnd
                )
              }
              onCancel={() => setRescheduleModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
