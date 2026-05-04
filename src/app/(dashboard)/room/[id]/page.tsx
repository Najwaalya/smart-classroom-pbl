"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  ChevronRight,
  Thermometer,
  Droplets,
  Wifi,
  Download,
  Users,
  CalendarDays,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useRoomData } from "@/contexts/RoomDataContext";
import { schedules } from "@/lib/schedule";

// ── helpers ──────────────────────────────────────────────────────────────────

const CAPACITY = 35;

function getFloorLabel(id: string) {
  const m = id.match(/_(\d+)/);
  return m ? `Lantai ${m[1]}` : "Lantai ?";
}

function getWingLabel(wing: string | null) {
  return wing ?? "Sayap Umum";
}

// Dummy hourly occupancy data (simulasi arus kepadatan)
function buildHourlyData(peak: number) {
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
  return hours.map((h, i) => {
    const curve = Math.sin((i / (hours.length - 1)) * Math.PI);
    const occ = Math.round(curve * peak);
    const ref = Math.round(curve * CAPACITY * 0.6);
    return { time: h, occupancy: occ, reference: ref };
  });
}

// Jadwal ruangan untuk hari ini
function getTodaySchedules(roomId: string) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return schedules.filter((s) => s.room === roomId && s.day === today);
}

// Semua jadwal ruangan (semua hari)
function getAllSchedules(roomId: string) {
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return schedules
    .filter((s) => s.room === roomId)
    .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));
}

const DAY_ID: Record<string, string> = {
  Monday: "Senin",
  Tuesday: "Selasa",
  Wednesday: "Rabu",
  Thursday: "Kamis",
  Friday: "Jumat",
};

// ── component ─────────────────────────────────────────────────────────────────

export default function RoomDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { rooms } = useRoomData();

  const room = rooms.find((r) => r.id === id);

  // Hooks harus dipanggil sebelum early return
  const hourlyData = useMemo(() => room ? buildHourlyData(room.students) : [], [room]);
  const todaySchedules = useMemo(() => getTodaySchedules(id), [id]);
  const allSchedules = useMemo(() => getAllSchedules(id), [id]);

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500 text-lg font-bold">Ruangan tidak ditemukan.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-[var(--color-primary)] text-white text-sm font-bold rounded-xl"
        >
          Kembali
        </button>
      </div>
    );
  }

  const fillPct = Math.min(100, Math.round((room.students / CAPACITY) * 100));

  const statusConfig = {
    active: { label: "AKTIF", bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    uncertain: { label: "TIDAK PASTI", bg: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    empty: { label: "KOSONG", bg: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
  };
  const sc = statusConfig[room.status];

  // PIR activity level
  const pirAvg = room.pir.length > 0 ? room.pir.reduce((a, b) => a + b, 0) / room.pir.length : 0;
  const pirLabel =
    pirAvg > 60 ? "TERDETEKSI AKTIVITAS INTENS" : pirAvg > 20 ? "AKTIVITAS SEDANG" : "TIDAK ADA AKTIVITAS";

  // Circular progress SVG
  const R = 70;
  const CIRC = 2 * Math.PI * R;
  const dash = (fillPct / 100) * CIRC;

  return (
    <div className="w-full px-6 py-6 md:px-10 md:py-8 flex flex-col gap-6 pb-16 anim-fade-up">

      {/* ── BREADCRUMB ── */}
      <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
        <Link href="/" className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors">
          <Home size={13} /> RINGKASAN
        </Link>
        <ChevronRight size={12} />
        <span className="text-slate-500">{getWingLabel(room.wing).toUpperCase()}</span>
        <ChevronRight size={12} />
        <span className="text-[var(--color-primary)]">{room.id}</span>
      </nav>

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-5xl font-black text-slate-800 tracking-tight">{room.id}</h1>
            <span className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 ${sc.bg}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${sc.dot}`} />
              {sc.label}
            </span>
          </div>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            {getFloorLabel(room.id)} · {getWingLabel(room.wing)} · Data Waktu Nyata
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors self-start whitespace-nowrap shadow-sm">
          <Download size={14} />
          Unduh Laporan LENGKAP
        </button>
      </div>

      {/* ── TOP ROW: Occupancy + DHT + PIR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Occupancy Donut */}
        <div className="glass-panel p-6 flex flex-col justify-between gap-4">
          <div className="flex justify-center">
            <svg width="180" height="180" viewBox="0 0 180 180">
              {/* Track */}
              <circle cx="90" cy="90" r={R} fill="none" stroke="#e2e8f0" strokeWidth="14" />
              {/* Progress */}
              <circle
                cx="90" cy="90" r={R}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${CIRC}`}
                strokeDashoffset={CIRC / 4}
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
              <text x="90" y="84" textAnchor="middle" className="font-black" style={{ fontSize: 36, fontWeight: 900, fill: "#1e293b" }}>
                {room.students}
              </text>
              <text x="90" y="104" textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8", letterSpacing: 1 }}>
                MAHASISWA
              </text>
              <text x="90" y="118" textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8", letterSpacing: 1 }}>
                DI DALAM
              </text>
            </svg>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-[var(--color-primary)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]" />
              Terisi: {room.students}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              Kapasitas: {CAPACITY}
            </span>
          </div>
        </div>

        {/* DHT Sensor */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Label */}
          <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
            <Thermometer size={14} className="text-blue-500" />
            Sensor DHT-22 Climate System
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Suhu */}
            <div className="glass-panel p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Suhu Ruangan</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-black leading-none ${room.temp > 26 ? "text-orange-500" : "text-slate-800"}`}>
                      {room.temp.toFixed(1)}
                    </span>
                    <span className="text-xl font-bold text-slate-400 mb-1">°C</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${room.temp > 26 ? "bg-orange-100" : "bg-blue-100"}`}>
                  <Thermometer size={22} className={room.temp > 26 ? "text-orange-500" : "text-blue-500"} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                {room.temp > 26 ? "SUHU TINGGI, PERIKSA AC." : "SUHU IDEAL, SIRKULASI UDARA BAIK."}
              </p>
            </div>

            {/* Kelembapan */}
            <div className="glass-panel p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kelembapan Udara</p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black leading-none text-blue-600">
                      {room.humidity.toFixed(1)}
                    </span>
                    <span className="text-xl font-bold text-slate-400 mb-1">%</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Droplets size={22} className="text-blue-500" />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                {room.humidity < 40 ? "TERLALU KERING." : room.humidity > 60 ? "TERLALU LEMBAP." : "IDEAL: 40% – 60%"}
              </p>
            </div>
          </div>

          {/* PIR Sensor */}
          <div className="glass-panel p-4 bg-gradient-to-r from-emerald-50 to-white border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Jaringan Sensor PIR Cahaya
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                {room.pir.length} Sensor Memantau
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                  <Wifi size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">Status Pergerakan</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{pirLabel}</p>
                </div>
              </div>
              {/* PIR bar visualizer */}
              <div className="flex items-end gap-1 h-8">
                {room.pir.length > 0
                  ? room.pir.map((v, i) => (
                      <div
                        key={i}
                        className="w-2.5 rounded-sm bg-emerald-500 transition-all duration-700"
                        style={{ height: `${Math.max(20, v)}%`, opacity: 0.6 + i * 0.1 }}
                      />
                    ))
                  : Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-2.5 rounded-sm bg-slate-200" style={{ height: "20%" }} />
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Chart + Jadwal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Line Chart */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-black text-slate-800">Analisis Arus Kepadatan</h3>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-4 py-1.5 rounded-xl uppercase tracking-widest">JAM</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12, fontWeight: 700 }}
                />
                <Line type="monotone" dataKey="occupancy" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }} name="Arus Nyata" />
                <Line type="monotone" dataKey="reference" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Garis Acuan" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[var(--color-primary)] rounded" /> Arus Nyata
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-slate-300 rounded border-dashed" /> Garis Acuan
            </span>
          </div>
        </div>

        {/* Jadwal Kelas */}
        <div className="glass-panel p-5 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-[var(--color-primary)]" />
              <h3 className="text-sm font-black text-slate-800">Jadwal Kelas</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {new Date().toLocaleDateString("id-ID", { weekday: "long" })}
            </span>
          </div>

          {/* Jadwal hari ini */}
          {todaySchedules.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Hari Ini</p>
              {todaySchedules.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-1.5 h-8 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-800">{s.start} – {s.end}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{s.room}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 gap-1">
              <CalendarDays size={28} className="text-slate-200" />
              <p className="text-xs font-bold text-slate-400">Tidak ada kelas hari ini</p>
            </div>
          )}

          {/* Semua jadwal minggu ini */}
          {allSchedules.length > 0 && (
            <div className="flex flex-col gap-2 mt-1 overflow-y-auto max-h-52 pr-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jadwal Mingguan</p>
              {allSchedules.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-1.5 h-8 rounded-full bg-[var(--color-primary)]/30 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-[var(--color-primary)]">{DAY_ID[s.day] ?? s.day}</p>
                      <p className="text-[10px] font-bold text-slate-400">{s.start} – {s.end}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">{s.room}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {allSchedules.length === 0 && todaySchedules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Users size={32} className="text-slate-200" />
              <p className="text-xs font-bold text-slate-400 text-center">Belum ada jadwal terdaftar untuk ruangan ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
