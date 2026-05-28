"use client";

import { useState } from "react";
import { X, AlertTriangle, Clock, Calendar, UserX, DoorOpen, ChevronRight } from "lucide-react";
import { useBooking, ReportType } from "@/contexts/BookingContext";

interface Props { roomId: string; isOpen: boolean; onClose: () => void; }

const TYPES: { key: ReportType; icon: React.ElementType; label: string; desc: string; color: string; bg: string; border: string }[] = [
  { key: "mundur",         icon: Clock,    label: "Geser Jam Kelas",    desc: "Jam masuk diundur",          color: "text-orange-600", bg: "bg-orange-50",  border: "border-orange-300" },
  { key: "ganti_hari",     icon: Calendar, label: "Ganti Hari",        desc: "Kelas pindah ke hari lain",  color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-300" },
  { key: "tidak_hadir",    icon: UserX,    label: "Tidak Hadir",       desc: "Kelas kosong hari ini",      color: "text-red-600",    bg: "bg-red-50",     border: "border-red-300" },
  { key: "pindah_ruangan", icon: DoorOpen, label: "Pindah Ruangan",    desc: "Kelas di ruangan lain",      color: "text-purple-600", bg: "bg-purple-50",  border: "border-purple-300" },
];

const DAYS    = ["Senin","Selasa","Rabu","Kamis","Jumat"];
const TIMES   = ["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];

export function RescheduleModal({ roomId, isOpen, onClose }: Props) {
  const { reportReschedule } = useBooking();
  const [type,    setType]    = useState<ReportType | null>(null);
  const [newDay,  setNewDay]  = useState(DAYS[0]);
  const [newTime, setNewTime] = useState("09:00");
  const [note,    setNote]    = useState("");

  if (!isOpen) return null;

  const selected = TYPES.find(t => t.key === type);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return;
    const extra = type === "ganti_hari" ? { newDay } : type === "mundur" ? { newTime } : undefined;
    reportReschedule(roomId, type, note || selected!.label, extra);
    onClose();
    setType(null); setNote("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
              <AlertTriangle size={17} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800">Laporkan Perubahan Jadwal</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{roomId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

          {/* Panduan singkat */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-blue-500 text-base shrink-0">💡</span>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Pilih alasan kenapa kelas tidak jadi seperti biasa. Setelah laporan dikirim, mahasiswa lain bisa booking ruangan ini.
            </p>
          </div>

          {/* Pilih tipe — satu klik langsung */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Apa yang terjadi?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => {
                const Icon = t.icon;
                const active = type === t.key;
                return (
                  <button key={t.key} type="button" onClick={() => setType(t.key)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 text-left transition-all ${
                      active ? `${t.bg} ${t.border} shadow-sm` : "bg-white border-slate-200 hover:border-slate-300"
                    }`}>
                    <Icon size={18} className={active ? t.color : "text-slate-400"} />
                    <div>
                      <p className={`text-xs font-black leading-tight ${active ? t.color : "text-slate-700"}`}>{t.label}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail kondisional — hanya muncul jika relevan */}
          {type === "mundur" && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Kira-kira jam berapa masuknya?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIMES.map(t => (
                  <button key={t} type="button" onClick={() => setNewTime(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                      newTime === t ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"
                    }`}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {type === "ganti_hari" && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Pindah ke hari apa?
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => setNewDay(d)}
                    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                      newDay === d ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                    }`}>{d}</button>
                ))}
              </div>
            </div>
          )}

          {/* Catatan opsional */}
          {type && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Catatan tambahan <span className="normal-case font-medium text-slate-400">(opsional)</span>
              </label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                placeholder="Contoh: info dari grup kelas..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all" />
            </div>
          )}

          <button type="submit" disabled={!type}
            className="w-full py-3 bg-orange-500 text-white text-sm font-black rounded-xl hover:bg-orange-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <ChevronRight size={16} /> Kirim Laporan
          </button>
        </form>
      </div>
    </div>
  );
}
