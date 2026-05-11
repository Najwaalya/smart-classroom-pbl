import { NextResponse } from "next/server";

export async function GET() {
  // Simulasi data analytics
  // Nanti bisa diganti dengan data real dari database
  
  const hourlyData = [
    { time: "07:00", occupancy: 12, temp: 22.5 },
    { time: "08:00", occupancy: 28, temp: 23.1 },
    { time: "09:00", occupancy: 45, temp: 24.2 },
    { time: "10:00", occupancy: 52, temp: 24.8 },
    { time: "11:00", occupancy: 48, temp: 25.1 },
    { time: "12:00", occupancy: 35, temp: 24.5 },
    { time: "13:00", occupancy: 42, temp: 24.9 },
    { time: "14:00", occupancy: 55, temp: 25.3 },
    { time: "15:00", occupancy: 38, temp: 24.7 },
    { time: "16:00", occupancy: 22, temp: 23.8 },
  ];

  const weeklyData = [
    { day: "Mon", rooms: 8, avg: 42 },
    { day: "Tue", rooms: 7, avg: 38 },
    { day: "Wed", rooms: 8, avg: 45 },
    { day: "Thu", rooms: 6, avg: 35 },
    { day: "Fri", rooms: 5, avg: 28 },
  ];

  return NextResponse.json({
    success: true,
    hourly: hourlyData,
    weekly: weeklyData,
  });
}
