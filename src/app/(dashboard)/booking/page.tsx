"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { schedules } from "@/lib/schedule";
import { useRoomData } from "@/contexts/RoomDataContext";
import { getRole, getUserInfo } from "@/lib/auth";
import { AlertTriangle, CalendarCheck, X, Info } from "lucide-react";
import {
  DAYS,
  FLOORS,
  TIME_SLOTS,
  toMin,
  getRoomsForFloor,
  getScheduleForSlot,
  getCurrentDay,
} from "@/lib/schedule-utils";
import { BookingForm, BookingRecord } from "@/components/booking/BookingForm";
import { BookingCard } from "@/components/booking/BookingCard";

export default function BookingPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const { rooms } = useRoomData();

  const [selectedFloor, setSelectedFloor] = useState<string>("5");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  // Semua booking yang dibuat via form ini (synced dengan localStorage)
  const [localBookings, setLocalBookings] = useState<BookingRecord[]>([]);
  // Notifikasi auto-cancel
  const [autoCancelMsg, setAutoCancelMsg] = useState<string | null>(null);

  // Initialize client-side only data
  useEffect(() => {
    setRole(getRole());
    setUserInfo(getUserInfo());
    setMyId(localStorage.getItem("userId"));
    setSelectedDay(getCurrentDay());
  }, []);

  // Load bookings dari localStorage saat mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("classroomBookings");
      if (stored) {
        const bookings = JSON.parse(stored) as BookingRecord[];
        setLocalBookings(bookings);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  }, []);

  // Sync bookings ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem("classroomBookings", JSON.stringify(localBookings));
  }, [localBookings]);

  const roomsOnFloor = useMemo(() => getRoomsForFloor(selectedFloor, schedules), [selectedFloor]);

  // Cari booking yang overlap dengan slot tertentu
  function getBookingForSlot(roomId: string, day: string, slot: typeof TIME_SLOTS[0]): BookingRecord | null {
    return localBookings.find(b =>
      b.roomId === roomId && b.day === day &&
      toMin(b.startTime) < toMin(slot.end) && toMin(b.endTime) > toMin(slot.start)
    ) ?? null;
  }

  // Check slot blocked: schedule OR booking
  function checkSlotBlocked(roomId: string, day: string, slot: typeof TIME_SLOTS[0]): boolean {
    // Check schedule kelas
    if (getScheduleForSlot(roomId, day, slot, schedules)) return true;
    // Check booking dari orang lain
    const existingBooking = getBookingForSlot(roomId, day, slot);
    if (existingBooking) return true;
    return false;
  }

  // ── Auto-cancel: batalkan booking jika sensor mendeteksi ada orang di kelas ──
  const autoCancel = useCallback(() => {
    const now = new Date();
    const today = now.toLocaleDateString("en-US", { weekday: "long" });
    const nowMin = now.getHours() * 60 + now.getMinutes();

    setLocalBookings(prev => {
      const cancelled: string[] = [];
      const next = prev.filter(b => {
        if (b.day !== today) return true; // bukan hari ini, biarkan
        const bookingStartMin = toMin(b.startTime);
        const bookingEndMin = toMin(b.endTime);
        // Hanya cek jika waktu booking sudah dimulai
        if (nowMin < bookingStartMin) return true;
        if (nowMin >= bookingEndMin) return true; // sudah lewat, biarkan
        // Cek sensor: apakah ruangan sudah ada orang?
        const room = rooms.find(r => r.id === b.roomId);
        if (room && room.students > 0 && room.status === "active") {
          // Ada orang di dalam → batalkan booking
          if (b.bookedById === myId) {
            cancelled.push(`${b.roomId} (${b.startTime}–${b.endTime})`);
          }
          return false; // hapus booking ini
        }
        return true;
      });

      if (cancelled.length > 0) {
        setAutoCancelMsg(
          `Booking dibatalkan otomatis karena ruangan sudah terisi: ${cancelled.join(", ")}`
        );
        setTimeout(() => setAutoCancelMsg(null), 8000);
      }
      return next;
    });
  }, [rooms, myId]);

  // Jalankan auto-cancel setiap 30 detik
  useEffect(() => {
    autoCancel();
    const interval = setInterval(autoCancel, 30_000);
    return () => clearInterval(interval);
  }, [autoCancel]);

  function addBooking(record: BookingRecord) {
    setLocalBookings(prev => [...prev, record]);
  }

  function cancelLocalBooking(id: string) {
    setLocalBookings(prev => prev.filter(b => b.id !== id));
  }

  // Booking saya hari ini
  const myBookingsToday = useMemo(() =>
    localBookings.filter(b => b.bookedById === myId && b.day === selectedDay),
    [localBookings, myId, selectedDay]
  );

  const dayLabel = DAYS.find(d => d.key === selectedDay)?.label ?? selectedDay;

  // Redirect jika bukan mahasiswa
  if (role !== "mahasiswa") {
    return (
      <div className="page-wrapper anim-fade-up">
        <div className="flex flex-col gap-6 pb-12">
          <div className="flex items-center gap-3 p-6 bg-amber-50 rounded-2xl border border-amber-200">
            <AlertTriangle size={20} className="text-amber-600" />
            <div>
              <p className="font-black text-amber-900">Akses Terbatas</p>
              <p className="text-sm text-amber-700 mt-1">Halaman booking hanya dapat diakses oleh mahasiswa.</p>
            </div>
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
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Booking Ruangan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Booking ruangan kosong untuk kegiatan mahasiswa. Pilih lantai, hari, dan slot waktu.
          </p>
        </div>

        {/* NOTIFIKASI AUTO-CANCEL */}
        {autoCancelMsg && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-200 anim-scale-in">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-black text-red-800">Booking Dibatalkan Otomatis</p>
              <p className="text-xs text-red-600 mt-0.5">{autoCancelMsg}</p>
            </div>
            <button onClick={() => setAutoCancelMsg(null)} className="text-red-400 hover:text-red-600 shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        {/* PANDUAN */}
        <div className="flex items-start gap-3 p-4 bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/15">
          <Info size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-black text-slate-800">Cara booking:</span>{" "}
            Pilih lantai & hari → pilih slot waktu yang tersedia (hijau) → isi keperluan → klik <span className="font-black">Booking Sekarang</span>.
            <br />
            <span className="font-black text-red-600">⚠️ Auto-cancel:</span> Booking akan dibatalkan otomatis jika sensor mendeteksi ruangan sudah terisi saat jam booking dimulai.
            <br />
            <span className="font-black text-blue-600">💡 Tip:</span> Lihat jadwal kelas di halaman <span className="font-black">Jadwal & Monitoring</span> untuk menghindari bentrok.
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

        {/* FORM BOOKING */}
        <BookingForm
          selectedFloor={selectedFloor}
          selectedDay={selectedDay}
          roomsForFloor={roomsOnFloor}
          onBooked={addBooking}
          checkSlotBlocked={checkSlotBlocked}
        />

        {/* BOOKING AKTIF SAYA */}
        {myBookingsToday.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <CalendarCheck size={15} className="text-[var(--color-primary)]" />
              Booking Saya — {dayLabel} ({myBookingsToday.length})
            </h2>
            <div className="flex flex-col gap-2">
              {myBookingsToday.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  isOwner={true}
                  onCancel={cancelLocalBooking}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
