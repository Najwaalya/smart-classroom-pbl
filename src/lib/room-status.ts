/**
 * SISTEM STATUS RUANGAN - Smart Classroom
 * 
 * Status yang tersedia:
 * - Active: Ada aktivitas (gerakan + orang)
 * - Scheduled: Ada jadwal tapi belum ada aktivitas
 * - Uncertain: Ada orang tapi tidak ada gerakan (perlu cek manual)
 * - Empty: Tidak ada aktivitas
 * - Booked: Sudah dibooking mahasiswa
 */

import { schedules } from "./schedule";

export type RoomStatus = "active" | "scheduled" | "uncertain" | "empty" | "booked";

export interface RoomSensorData {
  id: string;
  students: number;        // Jumlah orang dari IR sensor
  pirActivity: number;     // Level aktivitas PIR (0-100)
  lastMotionTime: Date;    // Waktu terakhir ada gerakan
  temp: number;
  humidity: number;
}

export interface BookingData {
  roomId: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface RoomStatusResult {
  status: RoomStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Cek apakah ada jadwal kelas pada waktu tertentu
 */
function hasSchedule(roomId: string, day: string, currentTime: string): boolean {
  const schedule = schedules.find(
    (s) =>
      s.room === roomId &&
      s.day === day &&
      currentTime >= s.start &&
      currentTime <= s.end
  );
  return !!schedule;
}

/**
 * Cek apakah ruangan sudah dibooking
 */
function hasBooking(
  roomId: string,
  day: string,
  currentTime: string,
  bookings: BookingData[]
): boolean {
  const booking = bookings.find(
    (b) =>
      b.roomId === roomId &&
      b.day === day &&
      currentTime >= b.startTime &&
      currentTime <= b.endTime
  );
  return !!booking;
}

/**
 * Hitung berapa menit sejak gerakan terakhir
 */
function getMinutesSinceLastMotion(lastMotionTime: Date): number {
  const now = new Date();
  return Math.floor((now.getTime() - lastMotionTime.getTime()) / 60000);
}

/**
 * LOGIKA UTAMA: Tentukan status ruangan berdasarkan kondisi
 * 
 * KONDISI:
 * 1. Ada jadwal + ada gerakan/orang = Active
 * 2. Ada jadwal + belum ada pergerakan selama 50 menit pertama = Scheduled
 * 3. Ada jadwal + tidak ada gerakan lama (20 menit) + people count > 0 = Uncertain
 * 4. Ada jadwal + tidak ada aktivitas 50 menit + people count = 0 = Empty
 * 5. Tidak ada jadwal + ada aktivitas = Active
 * 6. Tidak ada jadwal + tidak ada aktivitas 20 menit = Empty
 * 7. Tidak ada jadwal + sudah dibooking = Booked
 */
export function calculateRoomStatus(
  sensorData: RoomSensorData,
  bookings: BookingData[] = []
): RoomStatusResult {
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM

  const { id: roomId, students, pirActivity, lastMotionTime } = sensorData;
  const minutesSinceMotion = getMinutesSinceLastMotion(lastMotionTime);

  const hasScheduleNow = hasSchedule(roomId, currentDay, currentTime);
  const hasBookingNow = hasBooking(roomId, currentDay, currentTime, bookings);
  const hasActivity = pirActivity > 10 || minutesSinceMotion < 5; // Ada gerakan dalam 5 menit terakhir

  // ========== KONDISI 1: Ada jadwal + ada gerakan/orang = Active ==========
  if (hasScheduleNow && hasActivity && students > 0) {
    return {
      status: "active",
      label: "Kelas Aktif",
      description: "Perkuliahan sedang berlangsung",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-300",
    };
  }

  // ========== KONDISI 2: Ada jadwal + belum ada pergerakan 50 menit = Scheduled ==========
  if (hasScheduleNow && minutesSinceMotion < 50 && students === 0) {
    return {
      status: "scheduled",
      label: "Terjadwal",
      description: "Menunggu aktivitas perkuliahan",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
    };
  }

  // ========== KONDISI 3: Ada jadwal + tidak ada gerakan 20 menit + people > 0 = Uncertain ==========
  if (hasScheduleNow && minutesSinceMotion >= 20 && students > 0) {
    return {
      status: "uncertain",
      label: "Tidak Pasti",
      description: `Ada ${students} orang tapi tidak ada gerakan (cek manual)`,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-300",
    };
  }

  // ========== KONDISI 4: Ada jadwal + tidak ada aktivitas 50 menit + people = 0 = Empty ==========
  if (hasScheduleNow && minutesSinceMotion >= 50 && students === 0) {
    return {
      status: "empty",
      label: "Kosong",
      description: "Tidak ada aktivitas dalam 50 menit (kelas dibatalkan)",
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-300",
    };
  }

  // ========== KONDISI 5: Tidak ada jadwal + ada aktivitas = Active ==========
  if (!hasScheduleNow && hasActivity && students > 0) {
    return {
      status: "active",
      label: "Aktif",
      description: "Ada aktivitas di luar jadwal",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-300",
    };
  }

  // ========== KONDISI 7: Tidak ada jadwal + sudah dibooking = Booked ==========
  if (!hasScheduleNow && hasBookingNow) {
    return {
      status: "booked",
      label: "Dibooking",
      description: "Ruangan sudah dibooking mahasiswa",
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-300",
    };
  }

  // ========== KONDISI 6: Tidak ada jadwal + tidak ada aktivitas 20 menit = Empty ==========
  if (!hasScheduleNow && (minutesSinceMotion >= 20 || students === 0)) {
    return {
      status: "empty",
      label: "Kosong",
      description: "Tidak ada jadwal dan tidak ada aktivitas",
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-300",
    };
  }

  // Default fallback (seharusnya tidak pernah sampai sini)
  return {
    status: "empty",
    label: "Kosong",
    description: "Status tidak diketahui",
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
  };
}

/**
 * Helper: Get status badge component props
 */
export function getStatusBadgeProps(status: RoomStatus) {
  const statusMap: Record<RoomStatus, { label: string; color: string; bg: string }> = {
    active: {
      label: "AKTIF",
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    },
    scheduled: {
      label: "TERJADWAL",
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    uncertain: {
      label: "CEK MANUAL",
      color: "text-amber-700",
      bg: "bg-amber-100",
    },
    empty: {
      label: "KOSONG",
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    booked: {
      label: "DIBOOKING",
      color: "text-purple-700",
      bg: "bg-purple-100",
    },
  };

  return statusMap[status] || statusMap.empty;
}
