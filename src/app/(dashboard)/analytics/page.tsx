"use client";

import useSWR from "swr";
import { TrendingUp, BarChart2, Users, Thermometer } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  useEffect(() => {
    const role = getRole();

    if (!role) {
      router.replace("/login");
      return;
    }

    if (role !== "dosen") {
      router.replace("/");
      return;
    }
  }, [router]);

  const { data, error, isLoading } = useSWR<AnalyticsData>("/api/analytics", fetcher);

  if (isLoading) return <div className="p-6">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading data</div>;

  const hourlyData: HourlyData[] = data?.hourly || [];
  const weeklyData: WeeklyData[] = data?.weekly || [];

  // KPI
  const avgOccupancy =
    Math.round(hourlyData.reduce((acc, cur) => acc + cur.occupancy, 0) / (hourlyData.length || 1));

  const peakHour = hourlyData.reduce((max, cur) =>
    cur.occupancy > max.occupancy ? cur : max,
    hourlyData[0] || { time: "-", occupancy: 0, temp: 0 }
  );

  const avgTemp =
    (hourlyData.reduce((acc, cur) => acc + cur.temp, 0) / (hourlyData.length || 1)).toFixed(1);

  const kpi = [
    {
      label: "Avg Daily Occupancy",
      value: avgOccupancy,
      icon: Users,
      trend: "Live",
      color: "#183182",
    },
    {
      label: "Peak Hour",
      value: peakHour?.time || "-",
      icon: BarChart2,
      trend: "Realtime",
      color: "#0f6244",
    },
    {
      label: "Avg Temperature",
      value: `${avgTemp}°C`,
      icon: Thermometer,
      trend: "Live",
      color: "#dc2626",
    },
  ];

  return (
    <div className="page-wrapper anim-fade-up">
    <div className="flex flex-col gap-8 pb-12">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time smart classroom monitoring.</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpi.map((item) => (
          <div key={item.label} className="bg-white rounded-3xl p-6 shadow-sm border flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">{item.label}</span>
              <item.icon size={18} style={{ color: item.color }} />
            </div>
            <div className="text-3xl font-bold">{item.value}</div>
            <div className="text-xs text-emerald-500 flex items-center gap-1">
              <TrendingUp size={13} />
              {item.trend}
            </div>
          </div>
        ))}
      </div>

      {/* LINE CHART */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="mb-4 font-bold">Live Occupancy Flow</h3>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="occupancy" stroke="#183182" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BAR CHART */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="mb-4 font-bold">Weekly Insights</h3>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="rooms" fill="#183182" />
              <Bar dataKey="avg" fill="#bfdbfe" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
    </div>
  );
}