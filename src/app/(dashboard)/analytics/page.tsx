"use client";

import useSWR from "swr";
import { Users, BarChart2, Thermometer } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function Analytics() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userRole = getRole();

    if (!userRole) {
      router.replace("/login");
      return;
    }

    // Only admin can access analytics
    // @ts-expect-error - TypeScript has issues with UserRole comparison, but this is correct
    if (userRole !== "admin") {
      router.replace("/");
      return;
    }
  }, [router]);

  const { data, error, isLoading } = useSWR<AnalyticsData>("/api/analytics", fetcher);

  if (!mounted) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col gap-6 pb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col gap-6 pb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col gap-6 pb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics</h1>
            <p className="text-sm text-red-500 mt-1">Error loading data</p>
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

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time smart classroom monitoring.</p>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Avg Daily Occupancy */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-medium">Avg Daily Occupancy</span>
                <span className="text-4xl font-black text-slate-800">{avgOccupancy}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span>↗</span>
              <span>Live</span>
            </div>
          </div>

          {/* Peak Hour */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-medium">Peak Hour</span>
                <span className="text-4xl font-black text-slate-800">{peakHour.time}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <BarChart2 size={24} className="text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span>↗</span>
              <span>Realtime</span>
            </div>
          </div>

          {/* Avg Temperature */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-medium">Avg Temperature</span>
                <span className="text-4xl font-black text-slate-800">{avgTemp}°C</span>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <Thermometer size={24} className="text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span>↗</span>
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* LINE CHART */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6">Live Occupancy Flow</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BAR CHART */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6">Weekly Insights</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="rooms" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="avg" fill="#93c5fd" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}