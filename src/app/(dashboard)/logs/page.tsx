"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { LogIn, LogOut, Thermometer, ArrowRightLeft, Search, Download, RefreshCw, Filter, Database, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";
import { useRoomData } from "@/contexts/RoomDataContext";

type LogType = "entry" | "exit" | "temp" | "motion";
type LogLevel = "all" | LogType;

interface LogEntry {
  id: number;
  type: LogType;
  room: string;
  msg: string;
  time: string;
  timestamp: number;
}

// Cosmos status_logs eventType → LogType mapping
function mapEventType(eventType: string): LogType {
  const t = (eventType ?? "").toLowerCase();
  if (t.includes("entry") || t.includes("masuk") || t.includes("in")) return "entry";
  if (t.includes("exit") || t.includes("keluar") || t.includes("out")) return "exit";
  if (t.includes("temp") || t.includes("suhu") || t.includes("temperature")) return "temp";
  return "motion";
}

// Konversi dokumen Cosmos ke LogEntry
interface CosmosLog {
  id: string;
  roomId?: string;
  room?: string;
  eventType?: string;
  message?: string;
  msg?: string;
  timestamp?: string;
}

function cosmosToLog(c: CosmosLog, idx: number): LogEntry {
  const ts = c.timestamp ? new Date(c.timestamp) : new Date();
  const type = mapEventType(c.eventType ?? "");
  return {
    id: idx,
    type,
    room: c.roomId ?? c.room ?? "—",
    msg: c.message ?? c.msg ?? `Event: ${c.eventType}`,
    time: ts.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    timestamp: ts.getTime(),
  };
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const LOG_CONFIG = {
  entry: {
    icon: LogIn,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    label: "Masuk",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  exit: {
    icon: LogOut,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    label: "Keluar",
    badgeBg: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
  },
  temp: {
    icon: Thermometer,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
    label: "Suhu",
    badgeBg: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  motion: {
    icon: ArrowRightLeft,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    label: "Pergerakan",
    badgeBg: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

const FILTER_OPTIONS: { key: LogLevel; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "entry", label: "Masuk" },
  { key: "exit", label: "Keluar" },
  { key: "temp", label: "Suhu" },
  { key: "motion", label: "Gerak" },
];

export default function LogsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<LogLevel>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { rooms } = useRoomData();

  // ── Fetch dari Cosmos via SWR ────────────────────────────────────────────
  const { data: cosmosData, error: cosmosError, mutate: mutateLogs } = useSWR(
    mounted ? "/api/statuslogs" : null,
    fetcher,
    { refreshInterval: 10000 }
  );
  const dbOnline = !cosmosError && Array.isArray(cosmosData) && cosmosData.length > 0;

  // Saat Cosmos mengembalikan data, pakai sebagai logs
  useEffect(() => {
    if (dbOnline && cosmosData) {
      const cosmosLogs = (cosmosData as CosmosLog[]).map(cosmosToLog);
      setLogs(cosmosLogs.slice(0, 50));
    } else if (!dbOnline) {
      // Jika Cosmos offline, set logs kosong
      setLogs([]);
    }
  }, [cosmosData, dbOnline]);


  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const role = getRole();
    if (!role) { router.replace("/login"); return; }
    if (role !== "admin") { router.replace("/"); return; }
  }, [router]);

  // No simulation - only use real data from Cosmos DB

  const uniqueRooms = useMemo(() => {
    const roomSet = new Set(logs.map((l) => l.room));
    return Array.from(roomSet).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const matchType = filter === "all" || l.type === filter;
      const matchRoom = roomFilter === "all" || l.room === roomFilter;
      const matchSearch =
        searchQuery === "" ||
        l.msg.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        LOG_CONFIG[l.type].label.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchRoom && matchSearch;
    });
  }, [logs, filter, roomFilter, searchQuery]);

  // Statistik
  const stats = useMemo(() => ({
    entry: logs.filter((l) => l.type === "entry").length,
    exit: logs.filter((l) => l.type === "exit").length,
    temp: logs.filter((l) => l.type === "temp").length,
    motion: logs.filter((l) => l.type === "motion").length,
  }), [logs]);

  function handleRefresh() {
    setIsRefreshing(true);
    mutateLogs();
    setTimeout(() => setIsRefreshing(false), 800);
  }

  function handleExport() {
    const rows = [
      ["No", "Tipe", "Ruangan", "Pesan", "Waktu"],
      ...filtered.map((l, i) => [
        String(i + 1),
        LOG_CONFIG[l.type].label,
        l.room,
        l.msg,
        l.time,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!mounted) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col gap-6 pb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Riwayat Aktivitas</h1>
            <p className="text-sm text-slate-500 mt-1">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Riwayat Aktivitas</h1>
            <p className="text-sm text-slate-500 mt-1">Catatan real-time dari semua sensor ruangan kelas.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* DB Status Badge */}
            <span className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${
              dbOnline
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
            }`}>
              {dbOnline ? <><Database size={12} /> Cosmos DB</> : <><WifiOff size={12} /> Simulasi</>}
            </span>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              Perbarui
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-black hover:bg-[var(--color-primary-dark)] transition-all shadow-md shadow-blue-900/20"
            >
              <Download size={14} />
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(LOG_CONFIG) as LogType[]).map((type) => {
            const cfg = LOG_CONFIG[type];
            const Icon = cfg.icon;
            return (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? "all" : type)}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  filter === type
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] shadow-lg shadow-blue-900/20"
                    : "bg-white border-slate-200 hover:shadow-md"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  filter === type ? "bg-white/20" : cfg.iconBg
                }`}>
                  <Icon size={16} className={filter === type ? "text-white" : cfg.iconColor} />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${filter === type ? "text-blue-200" : "text-slate-400"}`}>
                    {cfg.label}
                  </p>
                  <p className={`text-xl font-black ${filter === type ? "text-white" : "text-slate-800"}`}>
                    {stats[type]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari log berdasarkan pesan, ruangan, atau tipe..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white placeholder:text-slate-400"
            />
          </div>

          {/* Filter by Type */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                  filter === f.key
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filter by Room */}
          <div className="relative">
            <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white appearance-none"
            >
              <option value="all">Semua Ruangan</option>
              {uniqueRooms.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* RESULT COUNT + LIVE INDICATOR */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">
            Menampilkan <span className="text-slate-700 font-black">{filtered.length}</span> dari{" "}
            <span className="text-slate-700 font-black">{logs.length}</span> entri
          </span>
          <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {dbOnline ? "Data real dari Cosmos DB · refresh 10 detik" : "Simulasi lokal · refresh 10 detik"}
          </span>
        </div>

        {/* LOG FEED */}
        <div className="flex flex-col gap-2.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Search size={40} className="text-slate-200 mb-4" />
              <p className="text-slate-500 font-black">Tidak ada log yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci atau filter</p>
              <button
                onClick={() => { setFilter("all"); setSearchQuery(""); setRoomFilter("all"); }}
                className="mt-4 px-4 py-2 text-xs font-black text-[var(--color-primary)] bg-[var(--color-primary)]/10 rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            filtered.map((log, idx) => {
              const cfg = LOG_CONFIG[log.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={log.id}
                  className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all ${
                    idx === 0 && logs[0].id === log.id ? "ring-2 ring-[var(--color-primary)]/20 border-[var(--color-primary)]/30" : ""
                  }`}
                >
                  <div className="flex gap-3.5">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                      <Icon size={18} className={cfg.iconColor} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.badgeBg}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs font-black text-[var(--color-primary)] bg-blue-50 px-2 py-0.5 rounded-md">
                            {log.room}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                          {log.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {log.msg}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER INFO */}
        <div className="flex items-center justify-center py-4">
          <p className="text-xs text-slate-400 text-center">
            Log diperbarui secara otomatis • Data dari sensor infrared, DHT, dan PIR
          </p>
        </div>

      </div>
    </div>
  );
}
