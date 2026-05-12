/**
 * Schedule Loader - Load schedules from Cosmos DB (NO STATIC DATA)
 */

import { ScheduleEntry } from "./schedule";

export type { ScheduleEntry as Schedule };

/**
 * Get distinct class names from provided schedules array
 */
export function getDistinctClasses(schedules: ScheduleEntry[] = []): string[] {
  return Array.from(new Set(schedules.map(s => s.class ?? "").filter(Boolean))).sort();
}

/**
 * Get schedules for a specific room and day from provided schedules array
 */
export function getSchedulesForRoom(room: string, day: string, schedules: ScheduleEntry[] = []): ScheduleEntry[] {
  return schedules.filter(s => s.room === room && s.day === day);
}

/**
 * Check if a time slot conflicts with existing schedules
 * @param excludeKey - key to exclude from check (room_day_start_end), for edit mode
 */
export function hasScheduleConflict(
  room: string,
  day: string,
  start: string,
  end: string,
  schedules: ScheduleEntry[] = [],
  excludeKey?: string
): boolean {
  const roomSchedules = getSchedulesForRoom(room, day, schedules);
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  return roomSchedules.some(s => {
    const key = `${s.room}_${s.day}_${s.start}_${s.end}`;
    if (excludeKey && key === excludeKey) return false;
    const sStart = timeToMinutes(s.start);
    const sEnd = timeToMinutes(s.end);
    return startMin < sEnd && endMin > sStart;
  });
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
