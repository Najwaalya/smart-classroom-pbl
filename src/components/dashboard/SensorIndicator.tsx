"use client";

import { Activity, Users, Thermometer, Droplets, Clock } from "lucide-react";
import { getTimeAgo } from "@/lib/time-utils";

interface SensorIndicatorProps {
  students: number;
  pirActivity: number;
  temp: number;
  humidity: number;
  lastMotionTime: Date;
  compact?: boolean;
}

export function SensorIndicator({
  students,
  pirActivity,
  temp,
  humidity,
  lastMotionTime,
  compact = false,
}: SensorIndicatorProps) {
  const getPirColor = (activity: number) => {
    if (activity >= 70) return "text-emerald-600 bg-emerald-100";
    if (activity >= 40) return "text-blue-600 bg-blue-100";
    if (activity >= 10) return "text-amber-600 bg-amber-100";
    return "text-slate-500 bg-slate-100";
  };

  const getTempColor = (temp: number) => {
    if (temp >= 28) return "text-red-600 bg-red-100";
    if (temp >= 24) return "text-amber-600 bg-amber-100";
    if (temp >= 20) return "text-emerald-600 bg-emerald-100";
    return "text-blue-600 bg-blue-100";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Users size={12} className="text-slate-500" />
          <span className="font-bold">{students}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity size={12} className={getPirColor(pirActivity).split(" ")[0]} />
          <span className="font-bold">{pirActivity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Thermometer size={12} className="text-slate-500" />
          <span className="font-bold">{temp.toFixed(1)}°C</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* People Count */}
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Users size={14} className="text-blue-600" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Orang</div>
          <div className="text-lg font-black text-slate-800">{students}</div>
        </div>
      </div>

      {/* PIR Activity */}
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPirColor(pirActivity)}`}>
          <Activity size={14} />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">PIR</div>
          <div className="text-lg font-black text-slate-800">{pirActivity}%</div>
        </div>
      </div>

      {/* Temperature */}
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTempColor(temp)}`}>
          <Thermometer size={14} />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Suhu</div>
          <div className="text-lg font-black text-slate-800">{temp.toFixed(1)}°C</div>
        </div>
      </div>

      {/* Humidity */}
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
          <Droplets size={14} className="text-cyan-600" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Lembap</div>
          <div className="text-lg font-black text-slate-800">{humidity.toFixed(1)}%</div>
        </div>
      </div>

      {/* Last Motion */}
      <div className="col-span-2 flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Clock size={14} className="text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-slate-500 font-medium">Gerakan Terakhir</div>
          <div className="text-sm font-bold text-slate-800">{getTimeAgo(lastMotionTime)}</div>
        </div>
      </div>
    </div>
  );
}
