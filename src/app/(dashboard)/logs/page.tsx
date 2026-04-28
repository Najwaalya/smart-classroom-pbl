"use client";

import { useState } from "react";
import { LogIn, LogOut, Thermometer, ArrowRightLeft, ArrowUpCircle, Filter } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";

type LogLevel = "all" | "entry" | "exit" | "temp" | "motion";

const allLogs = [
  { id: 1, type: "entry", icon: LogIn, colorClass: "bg-blue-50 text-[#183182]", room: "RT04_5B", msg: "Orang masuk terdeteksi oleh sensor di pintu masuk utama.", time: "14:42 WIB" },
  { id: 2, type: "temp", icon: Thermometer, colorClass: "bg-orange-50 text-orange-500", room: "LIG2_7T", msg: "Kenaikan suhu +1.4°C dalam interval 5 menit.", time: "14:38 WIB" },
  { id: 3, type: "exit", icon: LogOut, colorClass: "bg-red-50 text-red-400", room: "LSI1_6T", msg: "Semua occupant keluar — ruangan kosong.", time: "14:30 WIB" },
  { id: 4, type: "motion", icon: ArrowRightLeft, colorClass: "bg-slate-100 text-slate-500", room: "RT05_5B", msg: "Pergerakan dua arah terdeteksi di area pintu utama.", time: "14:20 WIB" },
  { id: 5, type: "entry", icon: LogIn, colorClass: "bg-blue-50 text-[#183182]", room: "LIG2_7T", msg: "Batch masuk: 12 orang terdeteksi dalam 2 menit.", time: "13:58 WIB" },
  { id: 6, type: "temp", icon: Thermometer, colorClass: "bg-orange-50 text-orange-500", room: "RT04_5B", msg: "Suhu stabil di 22.4°C — kondisi optimal.", time: "13:45 WIB" },
  { id: 7, type: "exit", icon: ArrowUpCircle, colorClass: "bg-red-50 text-red-400", room: "RT05_5B", msg: "3 orang keluar — status berubah menjadi Uncertain.", time: "13:30 WIB" },
  { id: 8, type: "entry", icon: LogIn, colorClass: "bg-blue-50 text-[#183182]", room: "LSI1_6T", msg: "Aktivitas masuk sesaat setelah jam 13.00.", time: "13:05 WIB" },
  { id: 9, type: "motion", icon: ArrowRightLeft, colorClass: "bg-slate-100 text-slate-500", room: "LIG2_7T", msg: "Sensor PIR mendeteksi pergerakan di sudut barat daya.", time: "12:50 WIB" },
  { id: 10, type: "temp", icon: Thermometer, colorClass: "bg-orange-50 text-orange-500", room: "LSI1_6T", msg: "Suhu fluktuatif: 19.2°C → 21.0°C dalam 10 menit.", time: "12:30 WIB" },
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
    useEffect(() => {
      const role = getRole();

      if (!role) {
        router.replace("/login");
        return;
      }

      // MAHASISWA TIDAK BOLEH
      if (role === "mahasiswa") {
        router.replace("/");
        return;
      }
    }, [router]);

  const [filter, setFilter] = useState<LogLevel>("all");

  const filtered = filter === "all" ? allLogs : allLogs.filter((l) => l.type === filter);

  return (
    <div className="page-wrapper anim-fade-up">
    <div className="flex flex-col gap-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Activity Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Catatan real-time dari semua sensor ruangan.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={15} className="text-slate-400 mr-1" />
        {filterLabels.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
              filter === f.key
                ? "bg-[#183182] text-white shadow-sm"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs font-semibold text-slate-400">{filtered.length} entri</span>
      </div>

      {/* Log Feed */}
      <div className="flex flex-col gap-3">
        {filtered.map((log) => {
          const Icon = log.icon;
          return (
            <div key={log.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${log.colorClass}`}>
                <Icon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap justify-between items-start gap-1">
                  <span className="text-sm font-bold text-slate-800 capitalize">{log.type === "entry" ? "Masuk" : log.type === "exit" ? "Keluar" : log.type === "temp" ? "Suhu" : "Pergerakan"}</span>
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{log.time}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{log.msg}</p>
                <span className="mt-1.5 inline-block text-[10px] font-bold text-[#183182] bg-blue-50 px-2 py-0.5 rounded-full">{log.room}</span>
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
