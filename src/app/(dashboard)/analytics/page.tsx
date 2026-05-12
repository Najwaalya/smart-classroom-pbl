"use client";

import useSWR from "swr";
import { Users, BarChart2, Thermometer, TrendingUp, TrendingDown, Activity, Wind, ShieldAlert, RefreshCw, Droplets } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";
import { getRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRoomData } from "@/contexts/RoomDataContext";

interface HourlyData {
  time: string;
  occupancy: number;
  temp: number;
  timestamp?: string;
}

interface WeeklyData {
  day: string;
  rooms: number;
  avg: number;
}

interface AnalyticsData {
  hourly: HourlyData[];
  weekly: WeeklyData[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-3 text-xs">
        <p className="font-black text-slate-700 mb-2">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-black text-slate-800">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { rooms } = useRoomData();

  useEffect(() => {
    setMounted(true);
    const userRole = getRole();
    if (!userRole) {
      router.replace("/login");
      return;
    }
    // Hanya dosen yang bisa akses analitik
    if (userRole !== "dosen") {
      router.replace("/");
      return;
    }
  }, [router]);

  const { data, isLoading, mutate } = useSWR<AnalyticsData>("/api/analytics", fetcher, {
    refreshInterval: 5000,
  });

  if (!mounted) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col gap-6 pb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analitik</h1>
            <p className="text-sm text-slate-500 mt-1">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  const hourlyData: HourlyData[] = data?.hourly || [];
  const weeklyData: WeeklyData[] = data?.weekly || [];

  // KPI
  const avgOccupancy = hourlyData.length > 0
    ? Math.round(hourlyData.reduce((acc, cur) => acc + cur.occupancy, 0) / hourlyData.length)
    : 0;

  const peakHour = hourlyData.length > 0
    ? hourlyData.reduce((max, cur) => cur.occupancy > max.occupancy ? cur : max, hourlyData[0])
    : { time: "-", occupancy: 0, temp: 0 };

  const avgTemp = hourlyData.length > 0
    ? (hourlyData.reduce((acc, cur) => acc + cur.temp, 0) / hourlyData.length).toFixed(1)
    : "0.0";

  const maxOccupancy = hourlyData.length > 0
    ? Math.max(...hourlyData.map(d => d.occupancy))
    : 0;

  // Room stats from context
  const activeRooms = rooms.filter(r => r.status === "active").length;
  const emptyRooms = rooms.filter(r => r.status === "empty").length;
  const uncertainRooms = rooms.filter(r => r.status === "uncertain").length;
  const totalStudents = rooms.reduce((sum, r) => sum + r.students, 0);
  const avgRoomTemp = rooms.length > 0
    ? (rooms.reduce((sum, r) => sum + r.temp, 0) / rooms.length).toFixed(1)
    : "0.0";
  const avgHumidity = rooms.length > 0
    ? (rooms.reduce((sum, r) => sum + r.humidity, 0) / rooms.length).toFixed(1)
    : "0.0";

  // Pie data untuk distribusi status ruangan
  const pieData = [
    { name: "Aktif", value: activeRooms, color: "#10b981" },
    { name: "Kosong", value: emptyRooms, color: "#94a3b8" },
    { name: "Tidak Pasti", value: uncertainRooms, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  // Room detail table
  const roomRows = [...rooms].sort((a, b) => b.students - a.students);

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analitik</h1>
            <p className="text-sm text-slate-500 mt-1">Monitoring smart classroom secara real-time untuk dosen.</p>
          </div>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-600 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all shadow-sm"
          >
            <RefreshCw size={14} />
            Perbarui
          </button>
        </div>

        {/* KPI CARDS TOP ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Mahasiswa */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Users size={20} className="text-blue-600" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Total Mahasiswa</p>
            <p className="text-3xl font-black text-slate-800 mt-0.5">{totalStudents}</p>
            <p className="text-[10px] text-slate-400 mt-1">Di seluruh ruangan aktif</p>
          </div>

          {/* Peak Hour */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <BarChart2 size={20} className="text-purple-600" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Peak
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Jam Puncak</p>
            <p className="text-3xl font-black text-slate-800 mt-0.5">{peakHour.time}</p>
            <p className="text-[10px] text-slate-400 mt-1">Max {maxOccupancy} mhs</p>
          </div>

          {/* Avg Temperature */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <Thermometer size={20} className="text-red-500" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingDown size={10} /> Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Rata-rata Suhu</p>
            <p className="text-3xl font-black text-slate-800 mt-0.5">{avgRoomTemp}°C</p>
            <p className="text-[10px] text-slate-400 mt-1">Dari {rooms.length} ruangan</p>
          </div>

          {/* Avg Humidity */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-cyan-50 rounded-xl">
                <Droplets size={20} className="text-cyan-600" />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp size={10} /> Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Rata-rata Kelembapan</p>
            <p className="text-3xl font-black text-slate-800 mt-0.5">{avgHumidity}%</p>
            <p className="text-[10px] text-slate-400 mt-1">Rata-rata semua ruangan</p>
          </div>
        </div>

        {/* STATUS RUANGAN ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Aktif */}
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Activity size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kelas Aktif</p>
              <p className="text-3xl font-black text-emerald-700">{activeRooms}</p>
              <p className="text-xs text-slate-400 mt-0.5">Sedang digunakan</p>
            </div>
          </div>

          {/* Kosong */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Wind size={22} className="text-slate-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kelas Kosong</p>
              <p className="text-3xl font-black text-slate-600">{emptyRooms}</p>
              <p className="text-xs text-slate-400 mt-0.5">Tidak ada aktivitas</p>
            </div>
          </div>

          {/* Tidak Pasti */}
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-5 border border-amber-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <ShieldAlert size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Status Tidak Pasti</p>
              <p className="text-3xl font-black text-amber-700">{uncertainRooms}</p>
              <p className="text-xs text-slate-400 mt-0.5">Perlu cek manual</p>
            </div>
          </div>
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* AREA CHART - Alur Okupansi */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-black text-slate-800">Alur Okupansi Harian</h3>
                <p className="text-xs text-slate-400 mt-0.5">Jumlah mahasiswa per jam hari ini</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            {isLoading ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Memuat data grafik...</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="time"
                      stroke="#94a3b8"
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="occupancy"
                      name="Mahasiswa"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#colorOccupancy)"
                      dot={{ fill: '#3b82f6', r: 3 }}
                      activeDot={{ r: 5, fill: '#3b82f6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* PIE CHART - Distribusi Status */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-base font-black text-slate-800">Distribusi Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Status ruangan saat ini</p>
            </div>
            {pieData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Tidak ada data</div>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #f1f5f9',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs font-bold text-slate-600">{entry.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-800">{entry.value} ruangan</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* CHARTS ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* BAR CHART - Weekly Insights */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-base font-black text-slate-800">Wawasan Mingguan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Rata-rata jumlah ruangan & mahasiswa per hari</p>
            </div>
            {isLoading ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Memuat...</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="day"
                      stroke="#94a3b8"
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar dataKey="rooms" name="Ruangan" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="avg" name="Rata-rata Mhs" fill="#93c5fd" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* LINE CHART - Suhu Harian */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h3 className="text-base font-black text-slate-800">Tren Suhu Harian</h3>
              <p className="text-xs text-slate-400 mt-0.5">Rata-rata suhu ruangan per jam</p>
            </div>
            {isLoading ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">Memuat...</div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="time"
                      stroke="#94a3b8"
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: '11px', fontWeight: 600 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      name="Suhu (°C)"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ fill: '#ef4444', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* TABEL DETAIL RUANGAN */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-800">Detail Kondisi Ruangan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Data real-time dari semua sensor ruangan</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Ruangan</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Mahasiswa</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Suhu</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Kelembapan</th>
                  <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roomRows.map((room) => {
                  const statusConfig = {
                    active: { label: "Aktif", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
                    empty: { label: "Kosong", badge: "bg-slate-50 text-slate-500 border-slate-200", dot: "bg-slate-400" },
                    uncertain: { label: "Tidak Pasti", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
                  };
                  const s = statusConfig[room.status];
                  return (
                    <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-[var(--color-primary)] bg-blue-50 px-2.5 py-1 rounded-lg">{room.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-full border ${s.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-700">{room.students}</span>
                        <span className="text-xs text-slate-400 ml-1">mhs</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${room.temp > 25 ? "text-red-600" : room.temp < 20 ? "text-blue-600" : "text-emerald-600"}`}>
                          {room.temp.toFixed(1)}°C
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-600">{room.humidity.toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">{room.wing || "Gedung Utama"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}