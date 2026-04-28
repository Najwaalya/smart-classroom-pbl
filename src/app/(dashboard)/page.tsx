"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Activity,
  Wind,
  Thermometer,
  ShieldAlert,
  ChevronRight,
  Droplets,
} from "lucide-react";
import { useRoomData } from "@/contexts/RoomDataContext";
import { schedules } from "../../lib/schedule";


export default function Dashboard() {
  const { rooms, dbStatus } = useRoomData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "empty" | "uncertain">("all");

  const { activeCount, uncertainCount, emptyCount, filteredRooms } = useMemo(() => {
    const activeData = rooms.filter((r) => r.status === "active");
    const uncertainData = rooms.filter((r) => r.status === "uncertain");
    const emptyData = rooms.filter((r) => r.status === "empty");

    const filtered = rooms.filter((r) => {
      const matchSearch =
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        (r.wing || "").toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || r.status === filter;
      return matchSearch && matchFilter;
    });

    return {
      activeCount: activeData.length,
      uncertainCount: uncertainData.length,
      emptyCount: emptyData.length,
      filteredRooms: filtered,
    };
  }, [rooms, search, filter]);

  // Animated totals
  const totalOccupancy = useMemo(() => rooms.reduce((acc, curr) => acc + curr.students, 0), [rooms]);

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="anim-fade-up" style={{ animationDelay: "0ms" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-white shadow-sm mb-3">
            <span className={`w-2 h-2 rounded-full animate-pulse ${dbStatus === 'online' ? 'bg-[var(--color-primary)]' : 'bg-orange-500'}`} />
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
              {dbStatus === 'online' ? "Sinkronisasi Waktu Nyata" : "Koneksi IoT Terhambat (Simulasi)"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none drop-shadow-sm">
            Ringkasan Ruangan
          </h1>
        </div>

        <div className="flex gap-4 anim-fade-up" style={{ animationDelay: "100ms" }}>
          <div className="glass-panel px-6 py-4 flex flex-col items-end min-w-[140px] hover:shadow-md transition-all">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">
              Total Mahasiswa
            </span>
            <div className="text-4xl font-black text-[var(--color-primary)]">
              {totalOccupancy}
            </div>
          </div>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-panel p-6 flex flex-col gap-4 border-l-[4px] border-l-emerald-500 anim-fade-up" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <Activity size={20} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-widest">
              Aman
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800">{activeCount}</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">Kelas Aktif</div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4 border-l-[4px] border-l-slate-300 anim-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shadow-inner">
              <Wind size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-widest text-right">
              Hemat Energi
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800">{emptyCount}</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">Kelas Kosong</div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4 border-l-[4px] border-l-amber-400 anim-fade-up" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
              <ShieldAlert size={20} />
            </div>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-widest">
              Cek Manual
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-800">{uncertainCount}</div>
            <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">Status Tidak Pasti</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div className="flex bg-white/60 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-white/50 overflow-x-auto hide-scrollbar">
          {(["all", "active", "empty", "uncertain"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${
                filter === f
                  ? "bg-white text-[var(--color-primary)] shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              {f === "all" ? "SEMUA RUANG" : f === "active" ? "AKTIF" : f === "empty" ? "KOSONG" : "TIDAK PASTI"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari ruangan/sayap..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md rounded-xl text-sm font-semibold placeholder:text-slate-400 border border-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all shadow-sm focus:bg-white"
          />
        </div>
      </div>

      {/* ROOM GRID */}
      {filteredRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 glass-panel">
          <Search size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-600">Tidak ada ruangan ditemukan</h3>
          <p className="text-slate-400 text-sm mt-1">Coba sesuaikan kata kunci pencarian atau filter.</p>
          <button
            onClick={() => { setSearch(""); setFilter("all"); }}
            className="mt-6 px-6 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredRooms.map((room, index) => {
            const statusConfig = {
              active: {
                bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
                dot: "bg-emerald-500",
                label: "AKTIF",
              },
              uncertain: {
                bg: "bg-amber-50 text-amber-700 border-amber-200",
                dot: "bg-amber-500",
                label: "TIDAK PASTI",
              },
              empty: {
                bg: "bg-slate-50 text-slate-600 border-slate-200",
                dot: "bg-slate-400",
                label: "KOSONG",
              },
            };

            const config = statusConfig[room.status];

            return (
              <div
                key={room.id}
                className="glass-panel flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 p-0 overflow-hidden anim-fade-up cursor-pointer"
                style={{ animationDelay: `${300 + index * 50}ms` }}
              >
                {/* Status Bar Top */}
                <div className={`h-1.5 w-full ${config.dot} opacity-80`} />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        {room.id}
                      </h3>
                      {room.wing && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                          {room.wing}
                        </p>
                      )}
                    </div>
                    <div
                      className={`text-[9px] font-black px-2.5 py-1 rounded border uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${config.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
                      {config.label}
                    </div>
                  </div>

                  {/* Main Stats (Students) */}
                  <div className="flex items-end gap-3 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      <Users size={22} />
                    </div>
                    <div>
                      <div className="text-4xl font-black text-slate-800 leading-none tracking-tighter">
                        {room.students}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Mahasiswa
                      </div>
                    </div>
                  </div>

                  {/* IoT Sensors (DHT & PIR) */}
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-col justify-between group-hover:bg-white transition-colors">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                        SUHU{" "}
                        <Thermometer
                          size={12}
                          className={room.temp > 24 ? "text-orange-500" : "text-blue-500"}
                        />
                      </div>
                      <div className={`text-lg font-black transition-all duration-1000 ${room.temp > 24 ? "text-orange-600" : "text-slate-700"}`}>
                        {room.temp.toFixed(1)}°C
                      </div>
                    </div>

                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-col justify-between group-hover:bg-white transition-colors">
                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                        KELEMBAPAN{" "}
                        <Droplets size={12} className="text-blue-500" />
                      </div>
                      <div className="justify-between items-end flex">
                         <div className="text-lg font-black text-slate-700 transition-all duration-1000">
                          {room.humidity.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <Link
                  href={`/room/${room.id}`}
                  className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white"
                >
                  <span className="uppercase tracking-widest text-[10px]">Lihat Analitik Lengkap</span>
                  <ChevronRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}