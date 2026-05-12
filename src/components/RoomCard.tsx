"use client";

import Link from "next/link";
import {
  Users, Thermometer, Droplets, ChevronRight, Star,
} from "lucide-react";
import { Room } from "@/contexts/RoomDataContext";
import { useBooking } from "@/contexts/BookingContext";
import { getRole } from "@/lib/auth";
import { useEffect, useState } from "react";

interface RoomCardProps { room: Room; index: number; }

const STATUS_CFG = {
  active:    { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "AKTIF" },
  uncertain: { bar: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500",   label: "TIDAK PASTI" },
  empty:     { bar: "bg-slate-300",   badge: "bg-slate-50 text-slate-600 border-slate-200",       dot: "bg-slate-400",   label: "KOSONG" },
};

export function RoomCard({ room, index }: RoomCardProps) {
  const { toggleFavorite, isFavorite } = useBooking();
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRole(getRole());
  }, []);

  const favorite = isFavorite(room.id);
  const cfg      = STATUS_CFG[room.status];

  return (
    <div
      className="glass-panel flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 p-0 overflow-hidden anim-fade-up"
      style={{ animationDelay: `${300 + index * 50}ms` }}
    >
      {/* Top bar */}
      <div className={`h-1.5 w-full ${cfg.bar} opacity-90`} />

      <div className="p-5 flex-1 flex flex-col gap-3">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{room.id}</h3>
              <button
                onClick={() => toggleFavorite(room.id)}
                className={`p-1 rounded-lg transition-all ${favorite ? "text-amber-400 hover:text-amber-500" : "text-slate-300 hover:text-amber-400"}`}
                title={favorite ? "Hapus dari favorit" : "Tambah ke favorit"}
              >
                <Star size={14} fill={favorite ? "currentColor" : "none"} />
              </button>
            </div>
            {room.wing && <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{room.wing}</p>}
          </div>
          <div className={`text-[9px] font-black px-2.5 py-1 rounded border uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
            {cfg.label}
          </div>
        </div>

        {/* Mahasiswa */}
        <div className="flex items-end gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Users size={22} />
          </div>
          <div>
            <div className="text-4xl font-black text-slate-800 leading-none tracking-tighter">{room.students}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Mahasiswa</div>
          </div>
        </div>

        {/* Sensors */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
              SUHU <Thermometer size={12} className={room.temp > 24 ? "text-orange-500" : "text-blue-500"} />
            </div>
            <div className={`text-lg font-black ${room.temp > 24 ? "text-orange-600" : "text-slate-700"}`}>{room.temp.toFixed(1)}°C</div>
          </div>
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
              LEMBAP <Droplets size={12} className="text-blue-500" />
            </div>
            <div className="text-lg font-black text-slate-700">{room.humidity.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Footer — hanya link ke detail */}
      <div className="border-t border-slate-100">
        <Link href={`/room/${room.id}`}
          className="w-full flex items-center justify-between px-5 py-3 text-xs font-black text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
          <span className="uppercase tracking-widest text-[10px]">Lihat Analitik</span>
          <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
