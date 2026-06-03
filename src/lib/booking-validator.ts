/**
 * BOOKING VALIDATOR - Smart Classroom
 * Validasi booking ruangan
 */

import { scheduleContainer } from "./cosmos";
import { timeToMinutes } from "./time-utils";

export interface BookingValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

interface ScheduleEntry {
  id: string;
  roomId: string;
  day: string;
  sessionStart: number;
  sessionEnd: number;
  subject?: string;
  startTime?: string;
  endTime?: string;
}

/**
 * Get session time from session number
 */
function getSessionTime(sessionNumber: number): { start: string; end: string } | null {
  const TIME_SLOTS = [
    { slot: 1,  start: "07:00", end: "07:50"  },
    { slot: 2,  start: "07:50", end: "08:40"  },
    { slot: 3,  start: "08:40", end: "09:30"  },
    { slot: 4,  start: "09:40", end: "10:30"  },
    { slot: 5,  start: "10:30", end: "11:20"  },
    { slot: 6,  start: "11:20", end: "12:10"  },
    { slot: 7,  start: "12:50", end: "13:40"  },
    { slot: 8,  start: "13:40", end: "14:30"  },
    { slot: 9,  start: "14:30", end: "15:20"  },
    { slot: 10, start: "15:30", end: "16:20"  },
    { slot: 11, start: "16:20", end: "17:10"  },
    { slot: 12, start: "17:10", end: "18:00"  },
  ];
  
  const slot = TIME_SLOTS.find(s => s.slot === sessionNumber);
  return slot ? { start: slot.start, end: slot.end } : null;
}

/**
 * Get schedules for a specific date and room from CosmosDB
 */
async function getSchedulesForRoom(
  roomId: string,
  day: string
): Promise<ScheduleEntry[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.roomId = @roomId AND c.day = @day ORDER BY c.sessionStart",
      parameters: [
        { name: "@roomId", value: roomId },
        { name: "@day", value: day },
      ],
    };

    const { resources: schedules } = await scheduleContainer.items
      .query<ScheduleEntry>(querySpec)
      .fetchAll();

    // Add startTime and endTime for compatibility
    return schedules.map(s => ({
      ...s,
      startTime: getSessionTime(s.sessionStart)?.start || "",
      endTime: getSessionTime(s.sessionEnd)?.end || "",
    }));
  } catch (error) {
    console.error("Error fetching schedules from CosmosDB:", error);
    return [];
  }
}

/**
 * Validasi booking ruangan (updated to use CosmosDB)
 */
export async function validateBooking(
  roomId: string,
  day: string,
  sessionStart: number,
  sessionEnd: number,
  existingBookings: Array<{
    roomId: string;
    day: string;
    sessionStart: number;
    sessionEnd: number;
  }>
): Promise<BookingValidationResult> {
  // 1. Validasi session range
  if (sessionStart >= sessionEnd) {
    return {
      valid: false,
      error: "Session akhir harus lebih dari session mulai",
    };
  }

  // 2. Get session times for display
  const startTime = getSessionTime(sessionStart);
  const endTime = getSessionTime(sessionEnd);
  
  if (!startTime || !endTime) {
    return {
      valid: false,
      error: "Nomor sesi tidak valid",
    };
  }

  // 3. Cek bentrok dengan jadwal kelas dari CosmosDB
  const classSchedules = await getSchedulesForRoom(roomId, day);
  const scheduleConflict = classSchedules.find(
    (s) =>
      s.sessionStart < sessionEnd &&
      s.sessionEnd > sessionStart
  );

  if (scheduleConflict) {
    return {
      valid: false,
      error: `Bentrok dengan jadwal kelas (${scheduleConflict.startTime} - ${scheduleConflict.endTime})`,
    };
  }

  // 4. Cek bentrok dengan booking lain
  const bookingConflict = existingBookings.find(
    (b) =>
      b.roomId === roomId &&
      b.day === day &&
      b.sessionStart < sessionEnd &&
      b.sessionEnd > sessionStart
  );

  if (bookingConflict) {
    const conflictStart = getSessionTime(bookingConflict.sessionStart)?.start || "";
    const conflictEnd = getSessionTime(bookingConflict.sessionEnd)?.end || "";
    return {
      valid: false,
      error: `Bentrok dengan booking lain (${conflictStart} - ${conflictEnd})`,
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
