/**
 * BOOKING VALIDATOR - Smart Classroom
 * Validasi booking ruangan
 */

import { schedules } from "./schedule";
import { timeToMinutes } from "./time-utils";

export interface BookingValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validasi booking ruangan
 */
export function validateBooking(
  roomId: string,
  day: string,
  startTime: string,
  endTime: string,
  existingBookings: Array<{
    roomId: string;
    day: string;
    startTime: string;
    endTime: string;
  }>
): BookingValidationResult {
  // 1. Validasi waktu
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin >= endMin) {
    return {
      valid: false,
      error: "Waktu selesai harus lebih dari waktu mulai",
    };
  }

  // 2. Validasi durasi minimum (minimal 30 menit)
  const durationMin = endMin - startMin;
  if (durationMin < 30) {
    return {
      valid: false,
      error: "Durasi booking minimal 30 menit",
    };
  }

  // 3. Validasi durasi maksimum (maksimal 4 jam)
  if (durationMin > 240) {
    return {
      valid: false,
      error: "Durasi booking maksimal 4 jam",
    };
  }

  // 4. Cek bentrok dengan jadwal kelas
  const scheduleConflict = schedules.find(
    (s) =>
      s.room === roomId &&
      s.day === day &&
      timeToMinutes(s.start) < endMin &&
      timeToMinutes(s.end) > startMin
  );

  if (scheduleConflict) {
    return {
      valid: false,
      error: `Bentrok dengan jadwal kelas (${scheduleConflict.start} - ${scheduleConflict.end})`,
    };
  }

  // 5. Cek bentrok dengan booking lain
  const bookingConflict = existingBookings.find(
    (b) =>
      b.roomId === roomId &&
      b.day === day &&
      timeToMinutes(b.startTime) < endMin &&
      timeToMinutes(b.endTime) > startMin
  );

  if (bookingConflict) {
    return {
      valid: false,
      error: `Bentrok dengan booking lain (${bookingConflict.startTime} - ${bookingConflict.endTime})`,
    };
  }

  // 6. Warning untuk booking di luar jam operasional (07:00 - 18:00)
  if (startMin < timeToMinutes("07:00") || endMin > timeToMinutes("18:00")) {
    return {
      valid: true,
      warning: "Booking di luar jam operasional normal (07:00 - 18:00)",
    };
  }

  return { valid: true };
}

/**
 * Cek apakah booking sudah expired
 */
export function isBookingExpired(
  day: string,
  endTime: string
): boolean {
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = now.toTimeString().slice(0, 5);

  // Jika hari berbeda, cek apakah sudah lewat
  if (day !== currentDay) {
    // Simplified: anggap expired jika bukan hari ini
    // TODO: Implement proper date comparison
    return true;
  }

  // Jika hari sama, cek waktu
  return timeToMinutes(currentTime) > timeToMinutes(endTime);
}

/**
 * Cek apakah booking sedang aktif
 */
export function isBookingActive(
  day: string,
  startTime: string,
  endTime: string
): boolean {
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = now.toTimeString().slice(0, 5);

  if (day !== currentDay) return false;

  const currentMin = timeToMinutes(currentTime);
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  return currentMin >= startMin && currentMin <= endMin;
}

/**
 * Get booking status
 */
export function getBookingStatus(
  day: string,
  startTime: string,
  endTime: string
): "upcoming" | "active" | "expired" {
  if (isBookingExpired(day, endTime)) return "expired";
  if (isBookingActive(day, startTime, endTime)) return "active";
  return "upcoming";
}
