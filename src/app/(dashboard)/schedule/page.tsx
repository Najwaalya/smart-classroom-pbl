"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRoomData } from "@/contexts/RoomDataContext";
import { Info, CheckCircle } from "lucide-react";
import {
  DAYS,
  FLOORS,
  TIME_SLOTS,
  toMin,
  getRoomsForFloor,
  getScheduleForSlot,
} from "@/lib/schedule-utils";
import { getAllSchedules } from "@/lib/schedule-loader";
import { BookingRecord } from "@/components/booking/BookingForm";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleLegend } from "@/components/schedule/ScheduleLegend";
import { StatsCards } from "@/components/schedule/StatsCards";
import { SlotInfoModal } from "@/components/schedule/SlotInfoModal";
import { getRole } from "@/lib/auth";
import { getScheduleStatus, RoomSensorData } from "@/lib/schedule-status";

export default function SchedulePage() {
  const { rooms } = useRoomData();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>("5");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    roomId: string;
    day: string;
    slot: typeof TIME_SLOTS[0];
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize role and selected day on client side only
  useEffect(() => {
    setMounted(true);
    setRole(getRole());
    const today = DAYS.find(d => d.key === new Date().toLocaleDateString("en-US", { weekday: "long" }))?.key ?? "Monday";
    setSelectedDay(today);
    
    // Load schedules (default + custom)
    setSchedules(getAllSchedules());
  }, []);

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

  const roomsOnFloor = useMemo(() => getRoomsForFloor(selectedFloor, schedules), [selectedFloor, schedules]);

  // Helper: check booking untuk slot tertentu
  function getBookingForSlot(roomId: string, day: string, slot: typeof TIME_SLOTS[0]): BookingRecord | null {
    return bookings.find(b =>
      b.roomId === roomId && b.day === day &&
      toMin(b.startTime) < toMin(slot.end) && toMin(b.endTime) > toMin(slot.start)
    ) ?? null;
  }

  // Handle booking dari modal - DIHAPUS, booking hanya di halaman booking
  // const handleBooking = useCallback(...);

  // Handle slot click - mahasiswa hanya show info, admin bisa lihat semua
  const handleSlotClick = useCallback((roomId: string, day: string, slot: typeof TIME_SLOTS[0]) => {
    // Admin tidak perlu modal info (sudah bisa lihat semua di grid)
    // Mahasiswa bisa lihat info untuk slot kosong
    if (role !== "mahasiswa") {
      return; // Admin tidak perlu modal info
    }

    // Cek apakah slot kosong (hijau)
    const sched = getScheduleForSlot(roomId, day, slot, schedules);
    const booking = getBookingForSlot(roomId, day, slot);

    if (!sched && !booking) {
      // Slot kosong, tampilkan info untuk mahasiswa
      setSelectedSlot({ roomId, day, slot });
    }
  }, [role, bookings, schedules]);

  // Get box color untuk setiap slot
  const getBoxColor = useCallback((
    roomId: string,
    day: string,
    slot: typeof TIME_SLOTS[0]
  ) => {
    if (!mounted) {
      // Return default state before mounted
      return { bg: "bg-slate-200 border-slate-300", label: slot.start, clickable: false };
    }

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

    // Kosong (hijau) - bisa diklik jika mahasiswa
    return { 
      bg: "bg-emerald-500 border-emerald-600", 
      label: slot.start, 
      clickable: role === "mahasiswa" 
    };
  }, [bookings, role, schedules, mounted]);

  // Hitung statistik
  const stats = useMemo(() => {
    if (!mounted) {
      return { kosong: 0, jadwal: 0, terbooked: 0 };
    }
    
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
  }, [roomsOnFloor, selectedDay, bookings, schedules, mounted]);

  // Get room status dari sensor dengan logika baru
  const getRoomStatus = useCallback((roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { status: "empty" as const, students: 0 };

    // Simulasi sensor data (nanti diganti dengan data real dari sensor)
    const sensorData: RoomSensorData = {
      students: room.students,
      pirActivity: room.pir && room.pir.length > 0 && room.pir[room.pir.length - 1] > 10,
      lastMotionMinutes: room.status === "active" ? 2 : room.status === "uncertain" ? 25 : 60,
    };

    const statusResult = getScheduleStatus(room.id, sensorData, bookings);

    return {
      status: statusResult.status,
      students: room.students,
    };
  }, [rooms, bookings]);

  const dayLabel = DAYS.find(d => d.key === selectedDay)?.label ?? selectedDay;

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="page-wrapper anim-fade-up">
        <div className="flex flex-col gap-6 pb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal & Monitoring Ruangan</h1>
            <p className="text-sm text-slate-500 mt-1">
              Memuat data...
            </p>
          </div>
        </div>
      </div>
    );
  }

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

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 anim-scale-in">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-800">Booking Berhasil!</p>
              <p className="text-xs text-emerald-600 mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* PANDUAN */}
        <div className="flex items-start gap-3 p-4 bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/15">
          <Info size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-black text-slate-800">Cara menggunakan:</span>{" "}
            Pilih lantai & hari untuk melihat jadwal kelas dan slot kosong.
            <br />
            <span className="font-black text-red-600">Merah</span> = ada jadwal kelas (tidak bisa di-booking) · <span className="font-black text-emerald-600">Hijau</span> = kosong (klik untuk info)
            {role === "mahasiswa" && (
              <>
                <br />
                <span className="font-black text-blue-600">💡 Tip:</span> Klik kotak hijau untuk melihat info slot. Untuk booking, kunjungi halaman <span className="font-black">Booking Ruangan</span>.
              </>
            )}
            {role === "admin" && (
              <>
                <br />
                <span className="font-black text-purple-600">👨‍🏫 Admin:</span> Anda dapat melihat semua jadwal dan monitoring status ruangan secara real-time. Gunakan menu <span className="font-black">Analitik</span> untuk laporan detail dan <span className="font-black">Riwayat</span> untuk log aktivitas.
              </>
            )}
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
          onSlotDetail={handleSlotClick}
        />

        {/* LEGENDA */}
        <ScheduleLegend />

      </div>

      {/* SLOT INFO MODAL */}
      {selectedSlot && (
        <SlotInfoModal
          roomId={selectedSlot.roomId}
          day={selectedSlot.day}
          slot={selectedSlot.slot}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
