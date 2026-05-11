"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { schedules } from "@/lib/schedule";
import { useRoomData } from "@/contexts/RoomDataContext";
import { Info } from "lucide-react";
import {
  DAYS,
  FLOORS,
  TIME_SLOTS,
  toMin,
  getRoomsForFloor,
  getScheduleForSlot,
} from "@/lib/schedule-utils";
import { BookingRecord } from "@/components/booking/BookingForm";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleLegend } from "@/components/schedule/ScheduleLegend";
import { StatsCards } from "@/components/schedule/StatsCards";

export default function SchedulePage() {
  const { rooms } = useRoomData();
  const [selectedFloor, setSelectedFloor] = useState<string>("5");
  const [selectedDay, setSelectedDay] = useState<string>(
    () => DAYS.find(d => d.key === new Date().toLocaleDateString("en-US", { weekday: "long" }))?.key ?? "Monday"
  );
  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  // Load bookings dari localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("classroomBookings");
      if (stored) {
        const data = JSON.parse(stored) as BookingRecord[];
        setBookings(data);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  }, []);

  const roomsOnFloor = useMemo(() => getRoomsForFloor(selectedFloor, schedules), [selectedFloor]);

  // Helper: check booking untuk slot tertentu
  function getBookingForSlot(roomId: string, day: string, slot: typeof TIME_SLOTS[0]): BookingRecord | null {
    return bookings.find(b =>
      b.roomId === roomId && b.day === day &&
      toMin(b.startTime) < toMin(slot.end) && toMin(b.endTime) > toMin(slot.start)
    ) ?? null;
  }

  // Get box color untuk setiap slot
  const getBoxColor = useCallback((
    roomId: string,
    day: string,
    slot: typeof TIME_SLOTS[0]
  ) => {
    const sched = getScheduleForSlot(roomId, day, slot, schedules);
    const booking = getBookingForSlot(roomId, day, slot);

    // Jadwal kelas (prioritas) - tetap merah selamanya (tidak bisa di-booking)
    if (sched) {
      return { bg: "bg-red-500 border-red-600", label: slot.start, clickable: false };
    }

    // Booking orang lain (ditampilkan dengan warna slate)
    if (booking) {
      return { bg: "bg-slate-400 border-slate-500", label: slot.start, clickable: false };
    }

    // Kosong (hijau)
    return { bg: "bg-emerald-500 border-emerald-600", label: slot.start, clickable: false };
  }, [bookings]);

  // Hitung statistik
  const stats = useMemo(() => {
    let kosong = 0, jadwal = 0, terbooked = 0;
    for (const room of roomsOnFloor) {
      for (const slot of TIME_SLOTS) {
        const sched = getScheduleForSlot(room, selectedDay, slot, schedules);
        const booking = getBookingForSlot(room, selectedDay, slot);

        if (sched) {
          jadwal++;
        } else if (booking) {
          terbooked++;
        } else {
          kosong++;
        }
      }
    }
    return { kosong, jadwal, terbooked };
  }, [roomsOnFloor, selectedDay, bookings]);

  // Get room status dari sensor
  const getRoomStatus = useCallback((roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { status: "empty" as const, students: 0 };

    const statusMap: Record<typeof room.status, typeof room.status> = {
      active: "active",
      uncertain: "uncertain",
      empty: "empty",
      scheduled: "scheduled",
    };

    return {
      status: statusMap[room.status] || "empty",
      students: room.students || 0,
    };
  }, [rooms]);

  const dayLabel = DAYS.find(d => d.key === selectedDay)?.label ?? selectedDay;

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal & Monitoring Ruangan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau status semua slot ruangan per hari. Lihat jadwal kelas dan slot kosong yang tersedia.
          </p>
        </div>

        {/* PANDUAN */}
        <div className="flex items-start gap-3 p-4 bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/15">
          <Info size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-black text-slate-800">Cara menggunakan:</span>{" "}
            Pilih lantai & hari untuk melihat jadwal kelas dan slot kosong.
            <br />
            <span className="font-black text-red-600">Merah</span> = ada jadwal kelas · <span className="font-black text-emerald-600">Hijau</span> = kosong
            <br />
            Untuk booking ruangan, kunjungi halaman <span className="font-black">Booking Ruangan</span>.
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lantai</span>
            <div className="flex bg-white/70 p-1 rounded-xl shadow-sm border border-slate-200 gap-0.5">
              {FLOORS.map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFloor(f)}
                  className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${
                    selectedFloor === f ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  Lt. {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hari</span>
            <div className="flex bg-white/70 p-1 rounded-xl shadow-sm border border-slate-200 gap-0.5">
              {DAYS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setSelectedDay(d.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    selectedDay === d.key ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {d.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STAT */}
        <StatsCards kosong={stats.kosong} jadwal={stats.jadwal} terbooked={stats.terbooked} />

        {/* GRID JADWAL */}
        <ScheduleGrid
          rooms={roomsOnFloor}
          selectedDay={selectedDay}
          getBoxColor={getBoxColor}
          getRoomStatus={getRoomStatus}
        />

        {/* LEGENDA */}
        <ScheduleLegend />

      </div>
    </div>
  );
}
