"use client";

import { useState, useEffect } from "react";
import { LogIn, LogOut, Thermometer, ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";

type LogLevel = "all" | "entry" | "exit" | "temp" | "motion";

const allLogs = [
  { id: 1, type: "entry", icon: LogIn, iconBg: "bg-blue-100", iconColor: "text-blue-600", room: "RT04_5B", msg: "Orang masuk terdeteksi oleh sensor di pintu masuk utama.", time: "14:42 WIB" },
  { id: 2, type: "temp", icon: Thermometer, iconBg: "bg-orange-100", iconColor: "text-orange-600", room: "LIG2_7T", msg: "Kenaikan suhu +1.4°C dalam interval 5 menit.", time: "14:38 WIB" },
  { id: 3, type: "exit", icon: LogOut, iconBg: "bg-red-100", iconColor: "text-red-600", room: "LSI1_6T", msg: "Semua occupant keluar — ruangan kosong.", time: "14:30 WIB" },
  { id: 4, type: "motion", icon: ArrowRightLeft, iconBg: "bg-slate-100", iconColor: "text-slate-600", room: "RT05_5B", msg: "Pergerakan dua arah terdeteksi di area pintu utama.", time: "14:20 WIB" },
  { id: 5, type: "entry", icon: LogIn, iconBg: "bg-blue-100", iconColor: "text-blue-600", room: "LIG2_7T", msg: "Batch masuk: 12 orang terdeteksi dalam 2 menit.", time: "13:58 WIB" },
  { id: 6, type: "temp", icon: Thermometer, iconBg: "bg-orange-100", iconColor: "text-orange-600", room: "RT04_5B", msg: "Suhu stabil di 22.4°C — kondisi optimal.", time: "13:45 WIB" },
  { id: 7, type: "exit", icon: LogOut, iconBg: "bg-red-100", iconColor: "text-red-600", room: "RT05_5B", msg: "3 orang keluar — status berubah menjadi Uncertain.", time: "13:30 WIB" },
  { id: 8, type: "entry", icon: LogIn, iconBg: "bg-blue-100", iconColor: "text-blue-600", room: "LSI1_6T", msg: "Aktivitas masuk sesaat setelah jam 13.00.", time: "13:05 WIB" },
  { id: 9, type: "motion", icon: ArrowRightLeft, iconBg: "bg-slate-100", iconColor: "text-slate-600", room: "LIG2_7T", msg: "Sensor PIR mendeteksi pergerakan di sudut barat daya.", time: "12:50 WIB" },
  { id: 10, type: "temp", icon: Thermometer, iconBg: "bg-orange-100", iconColor: "text-orange-600", room: "LSI1_6T", msg: "Suhu fluktuatif: 19.2°C → 21.0°C dalam 10 menit.", time: "12:30 WIB" },
];

const filterLabels: { key: LogLevel; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "entry", label: "Masuk" },
  { key: "exit", label: "Keluar" },
  { key: "temp", label: "Suhu" },
  { key: "motion", label: "Gerak" },
];

export default function Logs() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<LogLevel>("all");

  useEffect(() => {
    setMounted(true);
    const role = getRole();

    if (!role) {
      router.replace("/login");
      return;
    }

    // Only admin can access logs
    // @ts-expect-error - TypeScript has issues with UserRole comparison, but this is correct
    if (role !== "admin") {
      router.replace("/");
      return;
    }
  }, [router]);

  if (!mounted) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col gap-6 pb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Activity Logs</h1>
            <p className="text-sm text-slate-500 mt-1">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  const filtered = filter === "all" ? allLogs : allLogs.filter((l) => l.type === filter);

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-1">Catatan real-time dari semua sensor ruangan.</p>
        </div>

        {/* FILTER BAR */}
        <div className="flex flex-wrap items-center gap-3">
          {filterLabels.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 text-xs font-black rounded-xl transition-all ${
                filter === f.key
                  ? "bg-[#183182] text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-auto text-xs font-bold text-slate-400">{filtered.length} entri</span>
        </div>

        {/* LOG FEED */}
        <div className="flex flex-col gap-3">
          {filtered.map((log) => {
            const Icon = log.icon;
            return (
              <div 
                key={log.id} 
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${log.iconBg}`}>
                    <Icon size={20} className={log.iconColor} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-black text-slate-800 capitalize">
                        {log.type === "entry" ? "Masuk" : 
                         log.type === "exit" ? "Keluar" : 
                         log.type === "temp" ? "Suhu" : 
                         "Pergerakan"}
                      </span>
                      <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                        {log.time}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 leading-relaxed mb-2">
                      {log.msg}
                    </p>
                    
                    <span className="inline-block text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                      {log.room}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm">
              Tidak ada log untuk filter ini.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
