/**
 * Schedule Loader - Load schedules from default + localStorage
 */

import { schedules as defaultSchedules } from "./schedule";

export interface Schedule {
  room: string;
  day: string;
  start: string;
  end: string;
  subject?: string;
  lecturer?: string;
}

/**
 * Get all schedules (default + custom from localStorage)
 */
export function getAllSchedules(): Schedule[] {
  if (typeof window === "undefined") {
    return defaultSchedules;
  }

  try {
    const stored = localStorage.getItem("customSchedules");
    if (stored) {
      const custom = JSON.parse(stored) as Schedule[];
      return [...defaultSchedules, ...custom];
    }
  } catch (err) {
    console.error("Failed to load custom schedules:", err);
  }

  return defaultSchedules;
}

/**
 * Get schedules for a specific room and day
 */
export function getSchedulesForRoom(room: string, day: string): Schedule[] {
  const allSchedules = getAllSchedules();
  return allSchedules.filter(s => s.room === room && s.day === day);
}

/**
 * Check if a time slot conflicts with existing schedules
 */
export function hasScheduleConflict(
  room: string,
  day: string,
  start: string,
  end: string
): boolean {
  const schedules = getSchedulesForRoom(room, day);
  
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  return schedules.some(s => {
    const sStartMin = timeToMinutes(s.start);
    const sEndMin = timeToMinutes(s.end);

    // Check overlap
    return (
      (startMin >= sStartMin && startMin < sEndMin) ||
      (endMin > sStartMin && endMin <= sEndMin) ||
      (startMin <= sStartMin && endMin >= sEndMin)
    );
  });
}

/**
 * Convert time string (HH:MM) to minutes
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
