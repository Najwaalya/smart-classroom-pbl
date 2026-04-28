import { NextResponse } from "next/server";

interface IoTData {
  timestamp: string;
  occupancy: number;
  temperature: number;
}

interface HourlyData {
  time: string;
  occupancy: number;
  temp: number;
}

interface WeeklyData {
  day: string;
  rooms: number;
  avg: number;
}

interface AnalyticsResponse {
  data: IoTData[];
}

export async function GET() {
  try {
    // 🔥 nanti ganti ini dengan fetch dari Azure / DB
    const res = await fetch(process.env.ANALYTICS_API_URL as string, {
      cache: "no-store",
    });

    const raw: AnalyticsResponse = await res.json();

    // 🧠 mapping data dari IoT → format chart
    const hourly: HourlyData[] = raw.data.map((item: IoTData) => ({
      time: new Date(item.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      occupancy: item.occupancy,
      temp: item.temperature,
    }));

    // contoh weekly aggregation (simple)
    const weekly: WeeklyData[] = aggregateWeekly();

    return NextResponse.json({ hourly, weekly });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// 🔥 helper untuk weekly
function aggregateWeekly(): WeeklyData[] {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return days.map((day) => ({
    day,
    rooms: Math.floor(Math.random() * 25),
    avg: Math.floor(Math.random() * 400),
  }));
}