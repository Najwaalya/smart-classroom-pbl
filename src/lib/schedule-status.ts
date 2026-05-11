/**
 * SCHEDULE STATUS LOGIC - Smart Classroom
 * Logika status ruangan untuk halaman jadwal
 * 
 * KONDISI:
 * 1. Ada jadwal + ada gerakan/orang = Active
 * 2. Ada jadwal + JAM PERTAMA (0-50 menit) + belum ada gerakan = Scheduled
 * 3. Ada jadwal + JAM KE-2+ (>50 menit) + tidak ada gerakan = Empty (otomatis kosong)
 * 4. Ada jadwal + tidak ada gerakan 20 menit + people count > 0 = Uncertain
 * 5. Tidak ada jadwal + ada aktivitas = Active
 * 6. Tidak ada jadwal + tidak ada aktivitas 20 menit = Empty
 * 7. Tidak ada jadwal + sudah dibooking = Booked
 */

import { schedules } from "./schedule";

export type ScheduleStatus = "active" | "scheduled" | "uncertain" | "empty" | "booked";

export interface RoomSensorData {
  students: number;          // Jumlah orang dari IR sensor
  pirActivity: boolean;      // Ada gerakan atau tidak (dari PIR)
  lastMotionMinutes: number; // Berapa menit sejak gerakan terakhir
}

export interface BookingData {
  roomId: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleStatusResult {
  status: ScheduleStatus;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

/**
 * Cek apakah ada jadwal pada waktu tertentu
 */
function hasScheduleNow(roomId: string): { hasSchedule: boolean; minutesSinceStart: number } {
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = now.toTimeString().slice(0, 5);

  const schedule = schedules.find(
    (s) =>
      s.room === roomId &&
      s.day === currentDay &&
      currentTime >= s.start &&
      currentTime <= s.end
  );

  if (!schedule) {
    return { hasSchedule: false, minutesSinceStart: 0 };
  }

  // Hitung berapa menit sejak jadwal dimulai
  const [startHour, startMin] = schedule.start.split(":").map(Number);
  const [currentHour, currentMin] = currentTime.split(":").map(Number);
  
  const startTotalMin = startHour * 60 + startMin;
  const currentTotalMin = currentHour * 60 + currentMin;
  const minutesSinceStart = currentTotalMin - startTotalMin;

  return { hasSchedule: true, minutesSinceStart };
}

/**
 * Cek apakah ada booking pada waktu tertentu
 */
function hasBookingNow(roomId: string, bookings: BookingData[]): boolean {
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = now.toTimeString().slice(0, 5);

  const booking = bookings.find(
    (b) =>
      b.roomId === roomId &&
      b.day === currentDay &&
      currentTime >= b.startTime &&
      currentTime <= b.endTime
  );

  return !!booking;
}

/**
 * LOGIKA UTAMA: Tentukan status ruangan untuk jadwal
 */
export function getScheduleStatus(
  roomId: string,
  sensorData: RoomSensorData,
  bookings: BookingData[] = []
): ScheduleStatusResult {
  const { hasSchedule, minutesSinceStart } = hasScheduleNow(roomId);
  const hasBooking = hasBookingNow(roomId, bookings);
  const { students, pirActivity, lastMotionMinutes } = sensorData;

  // ========== KONDISI 1: Ada jadwal + ada gerakan/orang = Active ==========
  if (hasSchedule && (pirActivity || students > 0)) {
    return {
      status: "active",
      label: "Kelas Aktif",
      color: "text-emerald-700",
      bgColor: "bg-emerald-100",
      description: "Perkuliahan sedang berlangsung",
    };
  }

  // ========== KONDISI 2: Ada jadwal + JAM PERTAMA (0-50 menit) + belum ada gerakan = Scheduled ==========
  if (hasSchedule && minutesSinceStart <= 50 && students === 0 && !pirActivity) {
    return {
      status: "scheduled",
      label: "Terjadwal",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      description: `Menunggu aktivitas (${minutesSinceStart} menit sejak jadwal dimulai)`,
    };
  }

  // ========== KONDISI 3: Ada jadwal + JAM KE-2+ (>50 menit) + tidak ada gerakan = Empty ==========
  // OTOMATIS KOSONG - Ketua kelas harus booking ulang
  if (hasSchedule && minutesSinceStart > 50 && students === 0 && !pirActivity) {
    return {
      status: "empty",
      label: "Kosong",
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      description: "Tidak ada aktivitas >50 menit. Jadwal otomatis kosong. Ketua kelas harus booking ulang.",
    };
  }

  // ========== KONDISI 4: Ada jadwal + tidak ada gerakan 20 menit + people > 0 = Uncertain ==========
  if (hasSchedule && lastMotionMinutes >= 20 && students > 0) {
    return {
      status: "uncertain",
      label: "Tidak Pasti",
      color: "text-amber-700",
      bgColor: "bg-amber-100",
      description: `Ada ${students} orang tapi tidak ada gerakan ${lastMotionMinutes} menit (cek manual)`,
    };
  }

  // ========== KONDISI 5: Tidak ada jadwal + ada aktivitas = Active ==========
  if (!hasSchedule && (pirActivity || students > 0)) {
    return {
      status: "active",
      label: "Aktif",
      color: "text-emerald-700",
      bgColor: "bg-emerald-100",
      description: "Ada aktivitas di luar jadwal",
    };
  }

  // ========== KONDISI 7: Tidak ada jadwal + sudah dibooking = Booked ==========
  if (!hasSchedule && hasBooking) {
    return {
      status: "booked",
      label: "Dibooking",
      color: "text-purple-700",
      bgColor: "bg-purple-100",
      description: "Ruangan sudah dibooking mahasiswa",
    };
  }

  // ========== KONDISI 6: Tidak ada jadwal + tidak ada aktivitas 20 menit = Empty ==========
  if (!hasSchedule && (lastMotionMinutes >= 20 || students === 0)) {
    return {
      status: "empty",
      label: "Kosong",
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      description: "Tidak ada jadwal dan tidak ada aktivitas",
    };
  }

  // Default fallback
  return {
    status: "empty",
    label: "Kosong",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    description: "Status tidak diketahui",
  };
}

/**
 * Get status badge props untuk display
 */
export function getStatusBadgeProps(status: ScheduleStatus) {
  const statusMap: Record<ScheduleStatus, { label: string; color: string; bg: string }> = {
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

/**
 * Cek apakah jadwal sudah otomatis kosong (untuk notifikasi)
 */
export function isScheduleAutoCancelled(roomId: string): boolean {
  const { hasSchedule, minutesSinceStart } = hasScheduleNow(roomId);
  return hasSchedule && minutesSinceStart > 50;
}
