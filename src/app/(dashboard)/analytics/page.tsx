"use client";
"use no memo";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { useRoomData } from "@/contexts/RoomDataContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, ComposedChart
} from "recharts";
import { 
  Activity, Thermometer, Droplets, Users, BarChart3, PieChart as PieChartIcon, 
  Map, Gauge, LayoutDashboard 
} from "lucide-react";
import { FLOORS, FLOOR_SUFFIX } from "@/lib/schedule-utils";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AnalyticsPage() {
  const { rooms, isLoading: isLoadingRooms } = useRoomData();
  const [mounted, setMounted] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // ── Per-chart floor filter states ─────────────────────
  const [barFloor, setBarFloor] = useState<string>("5");
  const [trendFloor, setTrendFloor] = useState<string>("5");
  const [composedFloor, setComposedFloor] = useState<string>("5");
  const [heatmapFloor, setHeatmapFloor] = useState<string>("5");

  // SWR Hooks for schedules and telemetry with 30s auto-refresh
  const { data: scheduleData, isLoading: isLoadingSchedules } = useSWR(
    "/api/schedules", fetcher, { refreshInterval: 30000 }
  );
  
  const { data: telemetryData, isLoading: isLoadingTelemetry } = useSWR(
    "/api/telemetry", fetcher, { refreshInterval: 30000 }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  // ── Helper: check if a room belongs to a floor ────────
  function roomBelongsToFloor(roomName: string, floor: string): boolean {
    if (!roomName) return false;
    const suffixes = FLOOR_SUFFIX[floor] ?? [];
    if (suffixes.some(sfx => roomName.endsWith(sfx))) return true;
    // Fallback: contains "-{floor}" or "_{floor}"
    return roomName.includes(`-${floor}`) || roomName.includes(`_${floor}`);
  }

  // 1. Bar Chart Data (Room Usage) — filtered by barFloor
  //    Priority: motionDuration → students → activityLevel
  //    Include rooms with any sensor activity regardless of motionDuration value
  const usageData = useMemo(() => {
    return rooms
      .filter(r => {
        const roomName = r.roomId || r.name || r.roomName || r.id || "";
        return roomBelongsToFloor(roomName, barFloor);
      })
      .map(r => {
        const isActive =
          r.pirSensor?.status === "active" ||
          (r.students ?? 0) > 0 ||
          (r.pirSensor?.activityLevel ?? 0) > 0 ||
          (r.pirSensor?.motionCount ?? 0) > 0;

        // Choose best available metric for "jam terpakai"
        let jamTerpakai = 0;
        if ((r.pirSensor?.motionDuration ?? 0) > 0) {
          // motionDuration in ms → hours
          jamTerpakai = Number(((r.pirSensor!.motionDuration) / 3600000).toFixed(2));
        } else if (isActive) {
          // Fallback 1: use students count as proxy (treat each student ≈ 0.05h weight)
          const studentProxy = (r.students ?? 0) * 0.05;
          // Fallback 2: activityLevel as fraction of an hour
          const activityProxy = (r.pirSensor?.activityLevel ?? 0) / 100;
          // Fallback 3: motionCount * 1 minute per signal
          const motionProxy = ((r.pirSensor?.motionCount ?? 0) * 60) / 3600;
          jamTerpakai = Number(Math.max(studentProxy, activityProxy, motionProxy, 0.1).toFixed(2));
        }

        return {
          name: r.roomId || r.name || r.roomName || r.id,
          jamTerpakai,
          isActive,
        };
      })
      // Show ALL rooms on the floor (not just occupied), sorted by usage desc
      .sort((a, b) => b.jamTerpakai - a.jamTerpakai);
  }, [rooms, barFloor]);

  // 2. Line Chart Data — filtered by trendFloor
  //    Priority: /api/telemetry (jika ada), fallback ke realtime per ruangan
  const trendData = useMemo(() => {
    // Ambil ruangan di lantai terpilih
    const floorRooms = rooms.filter(r => {
      const roomName = r.roomId || r.name || r.roomName || r.id || "";
      return roomBelongsToFloor(roomName, trendFloor);
    });

    // Coba parse dari /api/telemetry terlebih dahulu
    const rawTelemetry = Array.isArray(telemetryData)
      ? telemetryData
      : (telemetryData?.data || telemetryData?.telemetry || []);

    if (rawTelemetry && rawTelemetry.length > 0) {
      // Filter telemetry agar hanya ruangan di lantai terpilih
      const filtered = rawTelemetry.filter((d: any) => {
        const roomName = d.roomId || d.room || d.name || "";
        return !roomName || roomBelongsToFloor(roomName, trendFloor);
      });
      const source = filtered.length > 0 ? filtered : rawTelemetry;
      return source.slice(-15).map((d: any) => {
        const timeObj = new Date(d.timestamp || d.createdAt || d.time || new Date());
        return {
          time: `${String(timeObj.getHours()).padStart(2, '0')}:${String(timeObj.getMinutes()).padStart(2, '0')}`,
          suhu: Number(d.temp || d.temperature || d.suhu || 0).toFixed(1),
          kelembapan: Number(d.humidity || d.kelembapan || 0).toFixed(1),
        };
      });
    }

    // FALLBACK: gunakan snapshot realtime useRoomData() — filtered by floor
    if (floorRooms.length > 0) {
      return floorRooms.map(r => ({
        time: r.roomId || r.name || r.id,
        suhu: Number(r.temp || r.dhtSensor?.temperature || 0).toFixed(1),
        kelembapan: Number(r.humidity || r.dhtSensor?.humidity || 0).toFixed(1),
      }));
    }

    // Final fallback: semua ruangan jika lantai tidak punya data
    return rooms.map(r => ({
      time: r.roomId || r.name || r.id,
      suhu: Number(r.temp || r.dhtSensor?.temperature || 0).toFixed(1),
      kelembapan: Number(r.humidity || r.dhtSensor?.humidity || 0).toFixed(1),
    }));
  }, [telemetryData, rooms, trendFloor]);

  // 3. Donut Chart Data (Status Distribusi)
  const statusData = useMemo(() => {
    const counts = { active: 0, uncertain: 0, empty: 0 };
    rooms.forEach(r => {
      if (r.status === "active") counts.active++;
      else if (r.status === "uncertain") counts.uncertain++;
      else counts.empty++;
    });
    return [
      { name: "Active", value: counts.active, color: "#10b981" },
      { name: "Uncertain", value: counts.uncertain, color: "#f59e0b" },
      { name: "Empty", value: counts.empty, color: "#94a3b8" }
    ];
  }, [rooms]);

  // 4. Heatmap Data (Kepadatan per Suhu)
  const heatmapData = useMemo(() => {
    return rooms
      .filter(r => {
        const roomName = r.roomId || r.name || r.roomName || r.id || "";
        return roomBelongsToFloor(roomName, heatmapFloor);
      })
      .map(r => ({
        name: r.roomId || r.name || r.roomName || r.id,
        suhu: r.temp || r.dhtSensor?.temperature || 0,
        orang: r.students || r.irSensor?.peopleCount || 0,
      }));
  }, [rooms, heatmapFloor]);

  // 5. Gauge Chart Data (Suhu Realtime)
  const selectedRoom = useMemo(() => rooms.find(r => r.id === selectedRoomId) || rooms[0], [rooms, selectedRoomId]);
  const gaugeData = useMemo(() => {
    const temp = selectedRoom ? selectedRoom.temp : 0;
    const color = temp >= 30 ? "#ef4444" : temp <= 20 ? "#3b82f6" : "#10b981";
    return [
      { name: "Suhu", value: temp, color },
      { name: "Sisa", value: 50 - temp > 0 ? 50 - temp : 0, color: "#f1f5f9" }
    ];
  }, [selectedRoom]);

  // 6. Composed Chart Data — filtered by composedFloor
  //    Fix: gunakan room.students || irSensor.peopleCount untuk okupansi
  //         gunakan room.temp || dhtSensor.temperature untuk suhu
  const composedData = useMemo(() => {
    const schedulesArray = Array.isArray(scheduleData) ? scheduleData : (scheduleData?.schedules || scheduleData?.data || []);
    return rooms
      .filter(r => {
        const roomName = r.roomId || r.name || r.roomName || r.id || "";
        return roomBelongsToFloor(roomName, composedFloor);
      })
      .map(r => {
        const roomSchedules = schedulesArray.filter((s: any) =>
          (s.roomId || s.room) === r.id || (s.roomId || s.room) === r.roomId
        ).length;
        return {
          name: r.roomId || r.name || r.id,
          okupansi: r.students || r.irSensor?.peopleCount || 0,
          suhu: r.temp || r.dhtSensor?.temperature || 0,
          jadwal: roomSchedules,
        };
      });
  }, [rooms, scheduleData, composedFloor]);

  // Custom Tooltip for Heatmap
  const CustomHeatmapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-xl rounded-xl border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-1">{data.name}</p>
          <p className="text-slate-600">Suhu: <span className="font-semibold text-orange-500">{data.suhu}°C</span></p>
          <p className="text-slate-600">Kepadatan: <span className="font-semibold text-blue-500">{data.orang} orang</span></p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white p-3 shadow-xl rounded-xl border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          <p className="text-slate-600">
            Jam Terpakai:{" "}
            <span className="font-semibold text-[var(--color-primary)]">
              {d.jamTerpakai} jam
            </span>
          </p>
          {d.isActive && d.jamTerpakai > 0 && (
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">● Sensor aktif (estimasi)</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Fix Bug 1: Loading screen hanya muncul saat initial load (bukan saat SWR refresh)
  const isLoading = (!mounted) || 
                    (rooms.length === 0 && isLoadingRooms) || 
                    (!scheduleData && isLoadingSchedules);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center p-8 flex-col gap-4">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Mengambil data analitik realtime...</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-8 pb-12">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-[var(--color-primary)]" size={32} />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Visualisasi data sensor dan okupansi ruangan secara real-time. Diperbarui otomatis.
            </p>
          </div>
        </div>

        {/* Grid Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. Bar Chart — dengan floor filter */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            {/* Header + Floor Filter */}
            <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <BarChart3 className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Perbandingan Penggunaan</h3>
                  <p className="text-xs text-slate-500">Total jam terpakai antar ruangan</p>
                </div>
              </div>
              {/* Floor filter buttons */}
              <div className="flex bg-slate-50 p-0.5 rounded-xl border border-slate-200 gap-0.5">
                {FLOORS.map(f => (
                  <button
                    key={f}
                    onClick={() => setBarFloor(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      barFloor === f
                        ? "bg-[var(--color-primary)] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    Lt. {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[260px] w-full">
              {usageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      label={{ value: "Jam", angle: -90, position: "insideLeft", offset: 20, style: { fontSize: 11, fill: "#94a3b8" } }}
                    />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomBarTooltip />} />
                    <Bar
                      dataKey="jamTerpakai"
                      name="Jam Terpakai"
                      radius={[6, 6, 0, 0]}
                      barSize={36}
                    >
                      {usageData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isActive && entry.jamTerpakai > 0
                            ? "var(--color-primary)"
                            : entry.isActive
                            ? "#93c5fd"   // light blue — active but no duration measured yet
                            : "#e2e8f0"}  // grey — inactive
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
                  <BarChart3 size={28} className="text-slate-200" />
                  <span>Tidak ada ruangan di lantai {barFloor}</span>
                </div>
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: "var(--color-primary)" }} />
                Aktif (terukur)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-300" />
                Aktif (sensor)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-200" />
                Tidak aktif
              </span>
            </div>
          </div>

          {/* 2. Line Chart — dengan floor filter */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Activity className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Tren Suhu &amp; Kelembapan</h3>
                  <p className="text-xs text-slate-500">Suhu &amp; kelembapan per ruangan (realtime)</p>
                </div>
              </div>
              {/* Floor filter */}
              <div className="flex bg-slate-50 p-0.5 rounded-xl border border-slate-200 gap-0.5">
                {FLOORS.map(f => (
                  <button
                    key={f}
                    onClick={() => setTrendFloor(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      trendFloor === f
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    Lt. {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px] w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="suhu" name="Suhu (°C)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="kelembapan" name="Kelembapan (%)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Tidak ada data historis telemetri</div>
              )}
            </div>
          </div>

          {/* 3. Donut Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <PieChartIcon className="text-emerald-500" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Distribusi Status</h3>
                <p className="text-xs text-slate-500">Proporsi status ruangan saat ini</p>
              </div>
            </div>
            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Heatmap (Scatter) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                  <Map className="text-purple-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Heatmap Kepadatan</h3>
                  <p className="text-xs text-slate-500">Sebaran jumlah orang berbanding suhu</p>
                </div>
              </div>
              {/* Floor filter */}
              <div className="flex bg-slate-50 p-0.5 rounded-xl border border-slate-200 gap-0.5">
                {FLOORS.map(f => (
                  <button
                    key={f}
                    onClick={() => setHeatmapFloor(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      heatmapFloor === f
                        ? "bg-purple-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    Lt. {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px] w-full">
              {heatmapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="suhu" name="Suhu" unit="°C" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={['dataMin - 2', 'dataMax + 2']} />
                    <YAxis type="category" dataKey="name" name="Ruangan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <ZAxis type="number" dataKey="orang" range={[50, 600]} name="Orang" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomHeatmapTooltip />} />
                    <Scatter name="Kepadatan" data={heatmapData} fill="var(--color-primary)" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Tidak ada ruangan di lantai {heatmapFloor}</div>
              )}
            </div>
          </div>

          {/* 5. Gauge Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Gauge className="text-rose-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Suhu Realtime</h3>
                  <p className="text-xs text-slate-500">Indikator suhu per ruangan</p>
                </div>
              </div>
              <select 
                className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.roomId || r.name}</option>
                ))}
              </select>
            </div>
            
            <div className="h-[240px] w-full relative mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="70%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={90}
                    outerRadius={120}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
                <span className="text-5xl font-black tracking-tighter" style={{ color: gaugeData[0].color }}>
                  {gaugeData[0].value.toFixed(1)}°C
                </span>
                <span className="text-sm font-semibold text-slate-400 mt-1 uppercase tracking-widest">Celcius</span>
              </div>
            </div>
          </div>

          {/* 6. Composed Chart — dengan floor filter */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Users className="text-indigo-500" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Okupansi vs Suhu vs Jadwal</h3>
                  <p className="text-xs text-slate-500">Korelasi real-time dengan referensi kelas</p>
                </div>
              </div>
              {/* Floor filter */}
              <div className="flex bg-slate-50 p-0.5 rounded-xl border border-slate-200 gap-0.5">
                {FLOORS.map(f => (
                  <button
                    key={f}
                    onClick={() => setComposedFloor(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      composedFloor === f
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    Lt. {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px] w-full">
              {composedData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={composedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar yAxisId="left" dataKey="jadwal" name="Jadwal Kelas" fill="#fcd34d" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar yAxisId="left" dataKey="okupansi" name="Okupansi Realtime" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={24} />
                    <Line yAxisId="right" type="monotone" dataKey="suhu" name="Suhu (°C)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data relasional</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}