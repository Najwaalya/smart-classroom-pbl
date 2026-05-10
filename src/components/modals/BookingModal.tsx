"use client";

import { useState, useMemo } from "react";
import { X, CalendarCheck, Clock, User, CheckCircle2, AlertCircle } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import { schedules } from "@/lib/schedule";

interface Props { roomId: string; isOpen: boolean; onClose: () => void; }

const PURPOSES = ["Belajar kelompok","Rapat / BEM","Praktikum mandiri","Diskusi skripsi","Persiapan presentasi","Kegiatan UKM","Lainnya"];

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Ambil jadwal kelas hari ini untuk ruangan ini (sebagai blok terlarang)
function getTodaySchedules(roomId: string) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return schedules
    .filter(s => s.room === roomId && s.day === today)
    .sort((a, b) => toMin(a.start) - toMin(b.start));
}

// Cek apakah rentang waktu bentrok dengan jadwal kelas
function hasConflict(start: string, end: string, roomId: string): string | null {
  if (!start || !end) return null;
  const sMin = toMin(start), eMin = toMin(end);
  if (sMin >= eMin) return "Jam selesai harus lebih dari jam mulai.";
  if (sMin < toMin("07:00")) return "Jam mulai minimal 07:00.";
  if (eMin > toMin("17:00")) return "Jam selesai maksimal 17:00.";
  const taken = getTodaySchedules(roomId);
  for (const s of taken) {
    if (sMin < toMin(s.end) && eMin > toMin(s.start)) {
      return `Bentrok dengan jadwal kelas ${s.start}–${s.end}.`;
    }
  }
  return null;
}

// Generate pilihan jam (07:00 – 17:00, per 30 menit)
const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 17; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 17) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}


export function BookingModal({ roomId, isOpen, onClose }: Props) {
  const { bookRoom, isBooked, getBooking, cancelBooking, getReschedule } = useBooking();

  const existing   = getBooking(roomId);
  const reschedule = getReschedule(roomId);
  const todaySched = useMemo(() => getTodaySchedules(roomId), [roomId]);

  const [startTime, setStartTime] = useState("08:00");
  const [endTime,   setEndTime]   = useState("10:00");
  const [purpose,   setPurpose]   = useState(PURPOSES[0]);
  const [custom,    setCustom]    = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [groupSize, setGroupSize] = useState(1);
  const [success,   setSuccess]   = useState(false);

  const conflict = useMemo(() => hasConflict(startTime, endTime, roomId), [startTime, endTime, roomId]);

  if (!isOpen) return null;

  const myId     = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isMyBook = existing?.bookedById === myId;

  // ── Sudah di-booking orang lain ──────────────────────────────────────────
  if (isBooked(roomId) && !isMyBook && existing) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><User size={17} className="text-slate-500" /></div>
            <div><p className="text-sm font-black text-slate-800">Ruangan Sudah Di-booking</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{roomId}</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <User size={18} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">{existing.bookedBy}</p>
              <p className="text-[10px] text-slate-400">NIM: {existing.bookedById}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "Waktu",   v: `${existing.startTime} – ${existing.endTime}` },
              { l: "Orang",   v: `${existing.groupSize} orang` },
              { l: "Keperluan", v: existing.purpose },
              { l: "Pukul",   v: existing.bookedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) },
            ].map(i => (
              <div key={i.l} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{i.l}</p>
                <p className="text-xs font-black text-slate-700">{i.v}</p>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-700 text-sm font-black rounded-xl hover:bg-slate-200 transition-all">Tutup</button>
        </div>
      </div>
    </div>
  );

  // ── Booking milik saya ────────────────────────────────────────────────────
  if (isMyBook && existing) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle2 size={17} className="text-emerald-600" /></div>
            <div><p className="text-sm font-black text-slate-800">Booking Aktif Milikmu</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{roomId}</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "Waktu",   v: `${existing.startTime} – ${existing.endTime}` },
              { l: "Orang",   v: `${existing.groupSize} orang` },
              { l: "Keperluan", v: existing.purpose },
              { l: "Pukul",   v: existing.bookedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) },
            ].map(i => (
              <div key={i.l} className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">{i.l}</p>
                <p className="text-xs font-black text-slate-700">{i.v}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { cancelBooking(roomId); onClose(); }}
            className="w-full py-3 bg-red-50 text-red-600 text-sm font-black rounded-xl hover:bg-red-100 transition-all border border-red-200">
            Batalkan Booking
          </button>
        </div>
      </div>
    </div>
  );

  // ── Sukses ────────────────────────────────────────────────────────────────
  if (success) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-base font-black text-slate-800">Booking Berhasil! 🎉</p>
          <p className="text-sm text-slate-500 mt-1">Ruangan <span className="font-black">{roomId}</span> sudah kamu booking.</p>
          <p className="text-xs text-slate-400 mt-2">Cek tab <span className="font-black">Booking Saya</span> untuk melihat detailnya.</p>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-[var(--color-primary)] text-white text-sm font-black rounded-xl hover:bg-[var(--color-primary-dark)] transition-all">
          Oke, Mengerti!
        </button>
      </div>
    </div>
  );

  // ── Form booking baru ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <CalendarCheck size={17} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Booking Ruangan</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{roomId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <form onSubmit={e => {
            e.preventDefault();
            if (conflict) return;
            const ok = bookRoom(roomId, startTime, endTime, useCustom ? custom.trim() : purpose, groupSize);
            if (ok) setSuccess(true);
          }}
          className="p-5 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">

          {/* Konteks laporan */}
          {reschedule && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <span className="text-base shrink-0">📢</span>
              <p className="text-[11px] text-orange-700 leading-relaxed">
                <span className="font-black">{reschedule.reportedBy}</span> melaporkan: &ldquo;{reschedule.note}&rdquo;
                {reschedule.newTime && <span> · Jam baru: <span className="font-black">{reschedule.newTime}</span></span>}
                {reschedule.newDay  && <span> · Pindah ke: <span className="font-black">{reschedule.newDay}</span></span>}
              </p>
            </div>
          )}

          {/* Langkah 1: Pilih waktu bebas */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-black flex items-center justify-center shrink-0">1</span>
              <label className="text-xs font-black text-slate-700">Pilih Waktu</label>
            </div>

            {/* Jadwal kelas hari ini — sebagai referensi */}
            {todaySched.length > 0 && (
              <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  ⚠️ Jadwal kelas hari ini (tidak bisa di-booking):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {todaySched.map((s, i) => (
                    <span key={i} className="text-[10px] font-black px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg">
                      {s.start} – {s.end}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Input jam mulai & selesai */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Jam Mulai</label>
                <div className="relative">
                  <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Jam Selesai</label>
                <div className="relative">
                  <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview durasi atau pesan error */}
            {startTime && endTime && (
              conflict ? (
                <div className="mt-2 flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle size={13} className="text-red-500 shrink-0" />
                  <p className="text-[11px] font-bold text-red-600">{conflict}</p>
                </div>
              ) : toMin(endTime) > toMin(startTime) ? (
                <div className="mt-2 flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <p className="text-[11px] font-bold text-emerald-700">
                    {startTime} – {endTime} · Durasi {Math.round((toMin(endTime) - toMin(startTime)) / 60 * 10) / 10} jam ✓
                  </p>
                </div>
              ) : null
            )}
          </div>

          {/* Langkah 2: Jumlah orang */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-black flex items-center justify-center shrink-0">2</span>
              <label className="text-xs font-black text-slate-700">Berapa Orang?</label>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <button type="button" onClick={() => setGroupSize(g => Math.max(1, g-1))}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg hover:bg-slate-100 transition-colors flex items-center justify-center shadow-sm">−</button>
              <div className="flex-1 text-center">
                <span className="text-2xl font-black text-slate-800">{groupSize}</span>
                <span className="text-xs text-slate-400 ml-1">orang</span>
              </div>
              <button type="button" onClick={() => setGroupSize(g => Math.min(35, g+1))}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg hover:bg-slate-100 transition-colors flex items-center justify-center shadow-sm">+</button>
            </div>
          </div>

          {/* Langkah 3: Keperluan */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-[10px] font-black flex items-center justify-center shrink-0">3</span>
              <label className="text-xs font-black text-slate-700">Untuk Apa?</label>
            </div>
            {!useCustom ? (
              <div className="flex flex-wrap gap-2">
                {PURPOSES.map(p => (
                  <button key={p} type="button" onClick={() => setPurpose(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                      purpose === p
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}>{p}</button>
                ))}
              </div>
            ) : (
              <input type="text" value={custom} onChange={e => setCustom(e.target.value)}
                placeholder="Tulis keperluan kamu..." required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 transition-all" />
            )}
            <button type="button" onClick={() => setUseCustom(p => !p)}
              className="text-[10px] font-black text-[var(--color-primary)] hover:underline mt-1.5 block">
              {useCustom ? "← Pilih dari daftar" : "Tulis sendiri →"}
            </button>
          </div>

          <button type="submit" disabled={!!conflict || toMin(endTime) <= toMin(startTime)}
            className="w-full py-3.5 bg-[var(--color-primary)] text-white text-sm font-black rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <CalendarCheck size={16} /> Konfirmasi Booking
          </button>
        </form>
      </div>
    </div>
  );
}
