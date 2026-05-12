export interface ScheduleEntry {
  room: string;
  day: string;
  start: string;
  end: string;
  subject?: string;
  lecturer?: string;
  class?: string;    // kode kelas/prodi, misal "TI-2A"
  lecturerCode?: string; // inisial/kode dosen, misal "AF", "MMH"
}

export const schedules: ScheduleEntry[] = [

  // ================= SENIN =================
  {
    room: "LPY1_5B", day: "Monday", start: "07:00", end: "07:50",
    subject: "AG_TI", lecturer: "Ahmad Fauzi, M.Kom.", lecturerCode: "AF", class: "TI-2A",
  },
  {
    room: "LAI1_7T", day: "Monday", start: "08:40", end: "10:30",
    subject: "ASD_TI", lecturer: "M. Mukhsin Habibi, M.T.", lecturerCode: "MMH", class: "TI-2A",
  },
  {
    room: "RT05_5B", day: "Monday", start: "13:40", end: "16:20",
    subject: "DA_TI", lecturer: "Aris Nur Rohman, M.T.", lecturerCode: "ANR", class: "TI-2A",
  },

  // ================= SELASA =================
  {
    room: "LKJ3_7T", day: "Tuesday", start: "07:50", end: "09:30",
    subject: "SO_TI", lecturer: "Yudi Ardiansyah, M.Kom.", lecturerCode: "YA", class: "TI-2A",
  },

  // ================= RABU =================
  {
    room: "LPR2_7B", day: "Wednesday", start: "08:40", end: "11:20",
    subject: "PASD_TI", lecturer: "M. Mukhsin Habibi, M.T.", lecturerCode: "MMH", class: "TI-2A",
  },
  {
    room: "RT02_5B", day: "Wednesday", start: "12:50", end: "14:30",
    subject: "AL_TI", lecturer: "Tri Wahyudi, M.T.", lecturerCode: "TRI", class: "TI-2A",
  },

  // ================= KAMIS =================
  {
    room: "RT05_5B", day: "Thursday", start: "07:50", end: "09:30",
    subject: "BD_TI", lecturer: "Vita Pramadhani, M.Kom.", lecturerCode: "VIT", class: "TI-2A",
  },

  // ================= JUMAT =================
  {
    room: "RT05_5B", day: "Friday", start: "07:50", end: "09:30",
    subject: "RPL_TI", lecturer: "Ela Nurhayati, M.Kom.", lecturerCode: "ELA", class: "TI-2A",
  },
  {
    room: "LPR1_7B", day: "Friday", start: "10:30", end: "12:10",
    subject: "PBD_TI", lecturer: "Vita Pramadhani, M.Kom.", lecturerCode: "VIT", class: "TI-2A",
  },

  // ========== KELAS TI-3B (contoh kelas lain) ==========
  {
    room: "RT01_5B", day: "Monday", start: "07:30", end: "10:10",
    subject: "RPL_TI", lecturer: "Budi Santoso, M.T.", lecturerCode: "BSN", class: "TI-3B",
  },
  {
    room: "RT02_5B", day: "Monday", start: "08:10", end: "10:50",
    subject: "BD_TI", lecturer: "Vita Pramadhani, M.Kom.", lecturerCode: "VIT", class: "TI-3B",
  },
  {
    room: "RT04_5B", day: "Monday", start: "11:00", end: "13:20",
    subject: "AI_TI", lecturer: "Ahmad Fauzi, M.Kom.", lecturerCode: "AF", class: "TI-3B",
  },
  {
    room: "LSI1_6T", day: "Tuesday", start: "08:20", end: "11:00",
    subject: "PASD_TI", lecturer: "M. Mukhsin Habibi, M.T.", lecturerCode: "MMH", class: "TI-3B",
  },
  {
    room: "LPY3_6T", day: "Tuesday", start: "11:10", end: "14:00",
    subject: "SO_TI", lecturer: "Yudi Ardiansyah, M.Kom.", lecturerCode: "YA", class: "TI-3B",
  },
  {
    room: "LSI1_6T", day: "Wednesday", start: "09:30", end: "15:10",
    subject: "PKL", lecturer: "Budi Santoso, M.T.", lecturerCode: "BSN", class: "TI-3B",
  },
  {
    room: "LPY3_6T", day: "Thursday", start: "09:30", end: "12:10",
    subject: "DA_TI", lecturer: "Aris Nur Rohman, M.T.", lecturerCode: "ANR", class: "TI-3B",
  },
  {
    room: "RT02_5B", day: "Friday", start: "09:30", end: "14:10",
    subject: "AL_TI", lecturer: "Tri Wahyudi, M.T.", lecturerCode: "TRI", class: "TI-3B",
  },
];