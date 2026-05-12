/**
 * TIME UTILITIES - Smart Classroom
 * Helper functions untuk manipulasi waktu
 */

/**
 * Get current time in HH:MM format
 */
export function getCurrentTime(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

/**
 * Get current day in English (Monday, Tuesday, etc.)
 */
export function getCurrentDayEnglish(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if current time is within a time range
 */
export function isTimeInRange(startTime: string, endTime: string): boolean {
  const now = getCurrentTime();
  return now >= startTime && now <= endTime;
}

/**
 * Get minutes difference between two times
 */
export function getMinutesDifference(time1: string, time2: string): number {
  return Math.abs(timeToMinutes(time1) - timeToMinutes(time2));
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format time to readable string
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get time ago string (e.g., "5 menit yang lalu")
 */
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari yang lalu`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get schedule time slot label
 */
export function getTimeSlotLabel(start: string, end: string): string {
  return `${start} - ${end}`;
}
