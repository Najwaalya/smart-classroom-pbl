/**
 * Schedule Loader - Load schedules from default + localStorage (CRUD support)
 */

import { schedules as defaultSchedules, ScheduleEntry } from "./schedule";

export type { ScheduleEntry as Schedule };

const STORAGE_KEY = "customSchedules";

/**
 * Get all schedules (default + custom from localStorage)
 */
export function getAllSchedules(): ScheduleEntry[] {
  if (typeof window === "undefined") {
    return [...defaultSchedules];
  }
  return [...defaultSchedules, ...getCustomSchedules()];
}

/**
 * Get only custom schedules from localStorage
 */
export function getCustomSchedules(): ScheduleEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ScheduleEntry[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save custom schedules to localStorage (overwrite)
 */
export function saveCustomSchedules(customs: ScheduleEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
}

/**
 * Add a single custom schedule entry
 */
export function addCustomSchedule(entry: ScheduleEntry): void {
  const customs = getCustomSchedules();
  customs.push(entry);
  saveCustomSchedules(customs);
}

/**
 * Delete a custom schedule entry by key (room_day_start_end)
 */
export function deleteCustomSchedule(room: string, day: string, start: string, end: string): void {
  const customs = getCustomSchedules();
  const key = `${room}_${day}_${start}_${end}`;
  saveCustomSchedules(customs.filter(s => `${s.room}_${s.day}_${s.start}_${s.end}` !== key));
}

/**
 * Get distinct class names across all schedules
 */
export function getDistinctClasses(): string[] {
  const all = getAllSchedules();
  return Array.from(new Set(all.map(s => s.class ?? "").filter(Boolean))).sort();
}

/**
 * Get schedules for a specific room and day
 */
export function getSchedulesForRoom(room: string, day: string): ScheduleEntry[] {
  return getAllSchedules().filter(s => s.room === room && s.day === day);
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
  excludeKey?: string
): boolean {
  const schedules = getSchedulesForRoom(room, day);
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  return schedules.some(s => {
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
