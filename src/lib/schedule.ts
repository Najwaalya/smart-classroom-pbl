export interface ScheduleEntry {
  room: string;
  roomName?: string;
  roomId?: string;
  day: string;
  start: string;
  end: string;
  subject?: string;
  lecturer?: string;
  class?: string;    // kode kelas/prodi, misal "TI-2A"
  lecturerCode?: string; // inisial/kode dosen, misal "AF", "MMH"
}

// ─── NO STATIC DATA - All schedules come from Cosmos DB ─────────────────────
// Data statis dihapus, semua jadwal diambil dari Cosmos DB via API
export const schedules: ScheduleEntry[] = [];
