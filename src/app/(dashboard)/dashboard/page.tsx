"use client";
"use no memo";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { Search, Activity, Wind, ShieldAlert, CalendarDays, Loader2 } from "lucide-react";
import { useRoomData } from "@/contexts/RoomDataContext";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import SearchFilter from "@/components/dashboard/SearchFilter";
import RoomCard from "@/components/dashboard/RoomCard";

import { getScheduleStatus, RoomSensorData, BookingData } from "@/lib/schedule-status";
import { ScheduleEntry } from "@/lib/schedule";
import { sessionToTime } from "@/lib/schedule-utils";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Dashboard() {
  const { rooms, isLoading, error } = useRoomData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "scheduled" | "uncertain" | "empty" | "booked">("all");
  
  // State untuk trigger re-render setiap menit agar perbandingan jam tetap update
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update tiap 1 menit
    return () => clearInterval(timer);
  }, []);

  // Fetch data schedules & bookings via SWR
  const { data: scheduleData } = useSWR("/api/schedules", fetcher, { refreshInterval: 30000 });
  const { data: bookingData } = useSWR("/api/bookings", fetcher, { refreshInterval: 30000 });

  // Map Schedules
  const schedules: ScheduleEntry[] = useMemo(() => {
    if (!scheduleData?.success || !Array.isArray(scheduleData.schedules)) return [];
    return scheduleData.schedules.map((c: any) => {
      const startNum = Number(c.sessionStart);
      const endNum = Number(c.sessionEnd);
      const convertedStart = (!isNaN(startNum) && startNum > 0) ? sessionToTime(startNum) : null;
      const convertedEnd = (!isNaN(endNum) && endNum > 0) ? sessionToTime(endNum) : null;
      return {
        id: String(c.id ?? ""),
        room: String(c.roomId ?? c.room ?? ""),
        class: String(c.className ?? c.class ?? c.subject ?? ""),
        day: String(c.day ?? ""),
        start: convertedStart?.startTime ?? String(c.startTime ?? c.start ?? ""),
        end: convertedEnd?.endTime ?? String(c.sessionEnd ?? c.endTime ?? c.end ?? ""),
      };
    });
  }, [scheduleData]);

  // Map Bookings
  const bookings: BookingData[] = useMemo(() => {
    if (!bookingData?.success || !Array.isArray(bookingData.bookings)) return [];
    return bookingData.bookings.map((b: any) => ({
      roomId: String(b.roomId ?? ""),
      day: String(b.day ?? ""),
      startTime: String(b.startTime ?? b.sessionStart ?? ""),
      endTime: String(b.endTime ?? b.sessionEnd ?? ""),
      status: String(b.status ?? "active"),
    })).filter((b: any) => b.status === "active");
  }, [bookingData]);

  // Calculate Dynamic Status based on time
  const dynamicallyEvaluatedRooms = useMemo(() => {
    // Kita panggil currentTime di dalam useMemo agar dia trigger evaluasi ulang
    const _now = currentTime; 

    return rooms.map(room => {
      const sensorData: RoomSensorData = {
        students: room.students || 0,
        pirActivity: room.pirSensor?.status === "active" || (room.pir && room.pir.length > 0 && room.pir[room.pir.length - 1] > 10),
        lastMotionMinutes: room.status === "active" ? 2 : room.status === "uncertain" ? 25 : 60,
      };

      // Evaluasi status asli secara dinamis (memperhitungkan waktu sekarang via schedule-status.ts)
      const dynamicStatus = getScheduleStatus(room.id, sensorData, bookings, schedules);

      return {
        ...room,
        // Override status bawaan cosmos dengan status dinamis
        dynamicStatus: dynamicStatus.status,
      };
    });
  }, [rooms, schedules, bookings, currentTime]);

  const {
    activeCount,
    scheduledCount,
    uncertainCount,
    emptyCount,
    filteredRooms,
  } = useMemo(() => {
    const normalizedStatus = (status: unknown) =>
      String(status ?? "").toUpperCase();

    const filtered = dynamicallyEvaluatedRooms.filter((r) => {
      const roomStatus = normalizedStatus(r.dynamicStatus); // Menggunakan dynamic status
      const matchSearch =
        (r.name ?? r.id).toLowerCase().includes(search.toLowerCase()) ||
        (r.wing || "").toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "active" && roomStatus === "ACTIVE") ||
        (filter === "scheduled" && roomStatus === "SCHEDULED") ||
        (filter === "uncertain" && (roomStatus === "UNCERTAINED" || roomStatus === "UNCERTAIN")) ||
        (filter === "empty" && roomStatus === "EMPTY") ||
        (filter === "booked" && roomStatus === "BOOKED");
      return matchSearch && matchFilter;
    });

    return {
      activeCount: dynamicallyEvaluatedRooms.filter((r) => normalizedStatus(r.dynamicStatus) === "ACTIVE").length,
      scheduledCount: dynamicallyEvaluatedRooms.filter((r) => normalizedStatus(r.dynamicStatus) === "SCHEDULED").length,
      uncertainCount: dynamicallyEvaluatedRooms.filter((r) => normalizedStatus(r.dynamicStatus) === "UNCERTAINED" || normalizedStatus(r.dynamicStatus) === "UNCERTAIN").length,
      emptyCount: dynamicallyEvaluatedRooms.filter((r) => normalizedStatus(r.dynamicStatus) === "EMPTY").length,
      filteredRooms: filtered,
    };
  }, [dynamicallyEvaluatedRooms, search, filter]);

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-6 pb-12">
        <DashboardHeader />

        {isLoading ? (
          <div className="glass-panel p-14 text-center border border-slate-200 shadow-sm">
            <Loader2 size={42} className="mx-auto animate-spin text-[var(--color-primary)] mb-4" />
            <h3 className="text-2xl font-bold text-slate-800">Memuat data ruangan RT...</h3>
            <p className="text-slate-500 mt-2">Sedang mengambil data real-time dari Azure Cosmos DB. Mohon tunggu.</p>
          </div>
        ) : (
          <>
            {/* METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                title="ACTIVE CLASS"
                value={activeCount}
                icon={<Activity size={20} />}
                badge="ACTIVE"
                borderColor="border-l-emerald-500"
                badgeColor="bg-emerald-50 text-emerald-600"
              />

              <MetricCard
                title="SCHEDULED CLASS"
                value={scheduledCount}
                icon={<CalendarDays size={20} />}
                badge="SCHEDULED"
                borderColor="border-l-sky-500"
                badgeColor="bg-sky-50 text-sky-700"
              />

              <MetricCard
                title="UNCERTAIN CLASS"
                value={uncertainCount}
                icon={<ShieldAlert size={20} />}
                badge="UNCERTAIN"
                borderColor="border-l-amber-400"
                badgeColor="bg-amber-50 text-amber-700"
              />

              <MetricCard
                title="EMPTY CLASS"
                value={emptyCount}
                icon={<Wind size={20} />}
                badge="EMPTY"
                borderColor="border-l-slate-300"
                badgeColor="bg-slate-100 text-slate-600"
              />

            </div>

            {/* SEARCH */}
            <SearchFilter
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
            />

            {error ? (
              <div className="glass-panel p-8 border border-amber-200 bg-amber-50 text-amber-700">
                <h3 className="text-lg font-bold">Gagal memuat data</h3>
                <p className="text-sm mt-2">{error}</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 glass-panel">
                <Search size={48} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-600">Tidak ada data ruangan ditemukan di database</h3>
                <p className="text-slate-400 text-sm mt-1">Sesuaikan filter atau cek kembali koneksi ke database.</p>
                <button
                  onClick={() => { setSearch(""); setFilter("all"); }}
                  className="mt-6 px-6 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRooms.map((room) => (
                  <RoomCard key={room.id} room={{ ...room, status: room.dynamicStatus as any }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
