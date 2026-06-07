"use client";

import Link from "next/link";
import {
  Users,
  Thermometer,
  Droplets,
  ChevronRight,
} from "lucide-react";

interface SensorHealth {
  overall: "ok" | "warning" | "offline";
  message: string;
}

interface DhtSensorData {
  temperature: number;
  humidity: number;
  status: "normal" | "high" | "low" | "offline";
  health: "ok" | "warning" | "offline";
  lastUpdated: string | null;
}

interface IrSensorData {
  peopleCount: number;
  status: "present" | "absent" | "offline";
  lastUpdated: string | null;
}

interface PirSensorData {
  motionCount: number;
  motionDuration: number;
  activityLevel: number;
  status: "active" | "inactive" | "offline";
  lastUpdated: string | null;
}

interface Room {
  id: string;
  name?: string;
  wing: string | null;
  status: "active" | "empty" | "uncertain";
  students: number;
  temp: number;
  humidity: number;
  pir: number[];
  ledStatus: string;
  lastUpdated: string | null;
  sensorHealth: SensorHealth;
  dhtSensor: DhtSensorData;
  irSensor: IrSensorData;
  pirSensor: PirSensorData;
}

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  const statusValue = String(room.status ?? "").toUpperCase();
  const statusConfig = {
    ACTIVE: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      label: "ACTIVE",
    },

    SCHEDULED: {
      bg: "bg-sky-50 text-sky-700 border-sky-200",
      dot: "bg-sky-500",
      label: "SCHEDULED",
    },

    UNCERTAINED: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      dot: "bg-amber-500",
      label: "UNCERTAIN",
    },

    EMPTY: {
      bg: "bg-slate-50 text-slate-600 border-slate-200",
      dot: "bg-slate-400",
      label: "EMPTY",
    },

    BOOKED: {
      bg: "bg-violet-50 text-violet-700 border-violet-200",
      dot: "bg-violet-500",
      label: "BOOKED",
    },
  } as const;

  const config = statusConfig[statusValue as keyof typeof statusConfig] ?? statusConfig.EMPTY;

  return (
    <div className="glass-panel flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className={`h-1.5 w-full ${config.dot}`} />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-black text-slate-800">
              {room.roomId ?? room.name ?? room.id}
            </h3>

            {room.wing && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                {room.wing}
              </p>
            )}
          </div>

          <div
            className={`text-[9px] font-black px-2.5 py-1 rounded border uppercase tracking-widest flex items-center gap-1.5 ${config.bg}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
            />

            {config.label}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5 text-[10px] font-bold uppercase tracking-widest">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 border text-slate-500">
            IR: {room.irSensor.peopleCount} orang
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 border text-slate-500">
            PIR: {room.pirSensor.status === "offline" ? "Offline" : room.pirSensor.status === "active" ? "Aktif" : "Inaktif"}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-50 border text-slate-500">
            DHT: {room.dhtSensor.health === "ok" ? "OK" : room.dhtSensor.health === "warning" ? "Warning" : "Offline"}
          </span>
        </div>

        <div className="flex items-end gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Users size={22} />
          </div>

          <div>
            <div className="text-4xl font-black text-slate-800">
              {room.students}
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Mahasiswa
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className="bg-slate-50/80 p-3 rounded-xl border">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
              SUHU
              <Thermometer size={12} />
            </div>

            <div className="text-lg font-black text-slate-700">
              {room.temp.toFixed(1)}°C
            </div>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
              KELEMBAPAN
              <Droplets size={12} />
            </div>

            <div className="text-lg font-black text-slate-700">
              {room.humidity.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-slate-500">
          {room.sensorHealth.message} • terakhir {room.lastUpdated ? new Date(room.lastUpdated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "tidak ada data"}
        </div>
      </div>

      <Link
        href={`/room/${room.id}`}
        className="px-5 py-3.5 bg-slate-50 border-t flex items-center justify-between text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
      >
        <span className="uppercase tracking-widest text-[10px]">
          Lihat Analitik
        </span>

        <ChevronRight size={14} />
      </Link>
    </div>
  );
}
