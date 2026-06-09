// ── Konstanta ──────────────────────────────────────────────────────────────

export const DAYS = [
  { key: "Monday",    label: "Senin",  short: "Sen" },
  { key: "Tuesday",   label: "Selasa", short: "Sel" },
  { key: "Wednesday", label: "Rabu",   short: "Rab" },
  { key: "Thursday",  label: "Kamis",  short: "Kam" },
  { key: "Friday",    label: "Jumat",  short: "Jum" },
];

export const TIME_SLOTS = [
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

export const FLOOR_SUFFIX: Record<string, string[]> = {
  "5": ["_5B", "-5T", "-5B"],
  "6": ["_6T", "-6T"],
  "7": ["_7T", "_7B", "-7T", "-7B"],
  "8": ["_8T", "-8T"],
};
export const FLOORS = ["5", "6", "7", "8"];

export const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2,"0")}:00`);
  if (h < 21) TIME_OPTIONS.push(`${String(h).padStart(2,"0")}:30`);
}

export const PURPOSES = [
  "Belajar kelompok", "Rapat / BEM", "Praktikum mandiri",
  "Diskusi skripsi", "Persiapan presentasi", "Kegiatan UKM", "Lainnya",
];

// ── Helpers ────────────────────────────────────────────────────────────────

export function toMin(t: string): number {
  if (!t || !t.includes(":")) return 0; // guard tambahan
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

/**
 * Normalisasi nama hari ke English key ("Monday", "Tuesday", dst.)
 * Menerima format: English ("Monday"), Indonesian ("Senin"), short ("Sen")
 */
export function normalizeDayKey(day: string): string {
  if (!day) return day;
  const lower = day.toLowerCase().trim();
  const found = DAYS.find(
    d =>
      d.key.toLowerCase() === lower ||
      d.label.toLowerCase() === lower ||
      d.short.toLowerCase() === lower ||
      // prefix match: "senin" starts with "sen", "monday" starts with "mon"
      lower.startsWith(d.short.toLowerCase()) ||
      d.label.toLowerCase().startsWith(lower.substring(0, 3))
  );
  return found ? found.key : day;
}

export function getRoomsForFloor(floor: string, schedules: any[]): string[] {
  const suffixes = FLOOR_SUFFIX[floor] ?? [];
  return Array.from(new Set(
    schedules
      .filter(s => {
        const roomName: string = s.roomId || s.room || "";
        if (!roomName) return false;
        // 1. Try suffix matching (e.g. "_5B", "-5T")
        if (suffixes.some(sfx => roomName.endsWith(sfx))) return true;
        // 2. Fallback: extract floor number from room name directly
        //    Handles formats like "RT5-5T", "RT5_5B", "RK6-6T", etc.
        const match = roomName.match(/[-_](\d+)[A-Za-z]?$/);
        if (match) return match[1] === floor;
        // 3. Looser fallback: check if room name contains "-{floor}" or "_{floor}"
        return roomName.includes(`-${floor}`) || roomName.includes(`_${floor}`);
      })
      .map(s => s.roomId || s.room || "")
      .filter(Boolean) // Remove empty strings
  )).sort();
}

export function getAllRooms(schedules: any[]): string[] {
  return Array.from(new Set(
    schedules
      .map(s => s.roomId || s.room || "")
      .filter(Boolean) // Remove empty strings
  )).sort();
}

// Normalisasi nama ruangan: hapus separator agar fuzzy match bisa bekerja
// "RT5-5T" == "RT55T" == "rt5_5t"
function normalizeRoomId(id: string): string {
  return id.toLowerCase().replace(/[-_\s]/g, "");
}

export function getScheduleForSlot(
  roomId: string,
  day: string,
  slot: typeof TIME_SLOTS[0],
  schedules: any[]
) {
  const normalizedDay = normalizeDayKey(day);
  const normRoom = normalizeRoomId(roomId);

  return schedules.find(s => {
    const scheduleRoom = s.roomId || s.room || "";
    const scheduleDay  = normalizeDayKey(s.day || "");
    const scheduleStart = s.startTime || s.start || "";
    const scheduleEnd   = s.endTime   || s.end   || "";

    // Fuzzy room match: exact OR strip-separator match
    const roomMatch = scheduleRoom === roomId ||
                      normalizeRoomId(scheduleRoom) === normRoom;
    if (!roomMatch) return false;
    if (scheduleDay !== normalizedDay) return false;

    // ── Metode 1: Session number (paling andal untuk data CosmosDB) ──
    const sStart = Number(s.sessionStart);
    if (!isNaN(sStart) && sStart > 0 && String(s.sessionStart).trim() !== "") {
      const sEndNum = Number(s.sessionEnd);
      if (!isNaN(sEndNum) && sEndNum > 0) {
        return slot.slot >= sStart && slot.slot <= sEndNum;
      }
      if (scheduleEnd) {
        return slot.slot >= sStart &&
               toMin(scheduleEnd) > toMin(slot.start);
      }
      return slot.slot === sStart;
    }

    // ── Metode 2: Time range (fallback) ──
    if (!scheduleStart || !scheduleEnd) return false;
    return toMin(scheduleStart) < toMin(slot.end) &&
           toMin(scheduleEnd)   > toMin(slot.start);
  }) ?? null;
}


export function slotInRange(slot: typeof TIME_SLOTS[0], startTime: string, endTime: string): boolean {
  return toMin(startTime) < toMin(slot.end) && toMin(endTime) > toMin(slot.start);
}

export function checkConflict(
  roomId: string,
  day: string,
  startTime: string,
  endTime: string,
  schedules: any[]
): string | null {
  if (toMin(startTime) >= toMin(endTime)) return "Jam selesai harus lebih dari jam mulai.";
  
  const conflict = schedules.find(s => {
    const scheduleRoom = s.roomId || s.room || "";
    const scheduleDay = s.day || "";
    const scheduleStart = s.startTime || s.start || "";
    const scheduleEnd = s.endTime || s.end || "";
    
    return scheduleRoom === roomId && 
           normalizeDayKey(scheduleDay) === normalizeDayKey(day) &&
           toMin(startTime) < toMin(scheduleEnd) && 
           toMin(endTime) > toMin(scheduleStart);
  });
  
  if (conflict) {
    const conflictStart = conflict.startTime || conflict.start || "";
    const conflictEnd = conflict.endTime || conflict.end || "";
    return `Bentrok dengan jadwal kelas ${conflictStart}–${conflictEnd}.`;
  }
  
  return null;
}

export function bookingKey(roomId: string, day: string, startTime: string, endTime: string): string {
  return `${roomId}__${day}__${startTime}__${endTime}`;
}

export function scheduleKey(roomId: string, day: string, start: string, end: string): string {
  return `${roomId}__${day}__${start}__${end}`;
}

export function getDayLabel(dayKey: string): string {
  return DAYS.find(d => d.key === dayKey)?.label ?? dayKey;
}

export function getCurrentDay(): string {
  return DAYS.find(d => d.key === new Date().toLocaleDateString("en-US", { weekday: "long" }))?.key ?? "Monday";
}

/**
 * Convert session number (1-12) to time slot { startTime, endTime }
 * @param sessionNumber Session number (1-12)
 * @returns Object with startTime and endTime, or null if invalid
 */
export function sessionToTime(sessionNumber: number): { startTime: string; endTime: string } | null {
  const session = TIME_SLOTS.find(s => s.slot === sessionNumber);
  if (!session) return null;
  return { startTime: session.start, endTime: session.end };
}
