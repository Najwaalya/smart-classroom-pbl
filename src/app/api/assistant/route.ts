import { NextResponse } from "next/server";
import {
  roomContainer,
  sensorContainer,
  scheduleContainer,
  bookingContainer,
} from "@/lib/cosmos";

// ─── Tipe DB ──────────────────────────────────────────────────────────────────

interface DBRoom {
  id: string;
  name?: string;
  wing?: string;
  capacity?: number;
  floor?: string | number;
}

interface DBSensor {
  roomId: string;
  temperature?: number;
  humidity?: number;
  peopleCount?: number;
  motionDuration?: number; // ms sejak gerakan terakhir
  ledStatus?: string;
  timestamp?: string;
}

interface DBSchedule {
  id: string;
  roomId: string;
  day: string;          // "Monday", "Tuesday", dst
  startTime: string;    // "07:00"
  endTime: string;      // "09:30"
  subject?: string;
  lecturer?: string;
  class?: string;
}

interface DBBooking {
  id: string;
  roomId: string;
  day: string;
  startTime: string;
  endTime: string;
  status?: string;      // "approved" | "pending" | "rejected"
  purpose?: string;
  userName?: string;
}

interface IncomingMsg { role: "user" | "assistant"; text: string; }

// ─── Waktu (WIB UTC+7) ───────────────────────────────────────────────────────

function nowWIB() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}
function getCurrentTime(): string {
  const d = nowWIB();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function getCurrentDayEN(): string {
  return nowWIB().toLocaleDateString("en-US", { weekday: "long" });
}
function getCurrentDayID(): string {
  const map: Record<string, string> = {
    Sunday: "Minggu", Monday: "Senin", Tuesday: "Selasa",
    Wednesday: "Rabu", Thursday: "Kamis", Friday: "Jumat", Saturday: "Sabtu",
  };
  return map[getCurrentDayEN()] ?? getCurrentDayEN();
}
function isWeekday() { return !["Saturday", "Sunday"].includes(getCurrentDayEN()); }
function isOperationalHour() {
  const [h, m] = getCurrentTime().split(":").map(Number);
  const t = h * 60 + m;
  return t >= 7 * 60 && t < 18 * 60;
}
function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ─── Deteksi Intent ───────────────────────────────────────────────────────────

const outOfScopeWords = [
  "cuaca","politik","olahraga","sepak bola","resep","masak","film","lagu",
  "musik","artis","berita","gosip","chatgpt","gemini","openai","investasi",
  "saham","bitcoin","kripto","kesehatan","obat","dokter","agama","hukum","pajak",
];

function isOutOfScope(t: string) { return outOfScopeWords.some((w) => t.includes(w)); }
function isEmptyRoomQ(t: string) { return /ruang(an)?\s*(yang\s*)?(kosong|tersedia|available|free)|kosong\s*(sekarang|hari)|ada.*ruang.*kosong/.test(t); }
function isScheduleQ(t: string)  { return /jadwal|kelas\s*(jam|hari)|jam\s*kelas|sesi\s*kelas|kapan\s*kelas/.test(t); }
function isSensorQ(t: string)    { return /sensor|suhu|kelembapan|pir|\bir\b|dht|led|gerakan|pergerakan|orang\s*di/.test(t); }
function isMeaningQ(t: string)   { return /(arti|apa\s*itu|maksud|fungsi|penjelasan)\s*(pir|ir|dht|sensor|led)|(pir|ir|dht|led)\s*(itu|adalah|artinya)/.test(t); }
function isBookingQ(t: string)   { return /booking|reservasi|pesan\s*ruang|pinjam\s*ruang|cara\s*book|gimana\s*book|langkah\s*book|bingung\s*book/.test(t); }
function isGreeting(t: string)   { return /^(halo|hai|hi|hei|selamat|help|bantuan|tolong|mulai|siapa\s*kamu|apa\s*yang\s*bisa)/.test(t); }

/** Cari room ID yang cocok dari teks bebas */
function findRoomId(text: string, roomIds: string[]): string | undefined {
  const sorted = [...roomIds].sort((a, b) => b.length - a.length);
  for (const id of sorted) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${esc}\\b`, "i").test(text)) return id;
  }
  return undefined;
}

// ─── Fetch DB ─────────────────────────────────────────────────────────────────

async function fetchRooms(): Promise<DBRoom[]> {
  try {
    const { resources } = await roomContainer.items
      .query<DBRoom>("SELECT c.id, c.name, c.wing, c.capacity, c.floor FROM c ORDER BY c.id")
      .fetchAll();
    return resources;
  } catch { return []; }
}

async function fetchLatestSensors(): Promise<Map<string, DBSensor>> {
  const map = new Map<string, DBSensor>();
  try {
    const { resources } = await sensorContainer.items
      .query<DBSensor>("SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT 300")
      .fetchAll();
    for (const s of resources) {
      if (!map.has(s.roomId)) map.set(s.roomId, s);
    }
  } catch { /* sensor offline */ }
  return map;
}

async function fetchTodaySchedules(): Promise<DBSchedule[]> {
  try {
    const { resources } = await scheduleContainer.items
      .query<DBSchedule>({
        query: "SELECT * FROM c WHERE c.day = @day ORDER BY c.startTime",
        parameters: [{ name: "@day", value: getCurrentDayEN() }],
      })
      .fetchAll();
    return resources;
  } catch { return []; }
}

async function fetchTodayBookings(): Promise<DBBooking[]> {
  try {
    const { resources } = await bookingContainer.items
      .query<DBBooking>({
        query: "SELECT * FROM c WHERE c.day = @day AND (c.status = 'approved' OR c.status = 'pending')",
        parameters: [{ name: "@day", value: getCurrentDayEN() }],
      })
      .fetchAll();
    return resources;
  } catch { return []; }
}

// ─── Status Ruangan ───────────────────────────────────────────────────────────

type RoomStatus = "active" | "scheduled" | "booked" | "empty" | "offline";

interface RoomInfo {
  room: DBRoom;
  sensor?: DBSensor;
  activeSchedule?: DBSchedule;  // jadwal yang sedang berjalan sekarang
  todaySchedules: DBSchedule[];
  activeBooking?: DBBooking;
  status: RoomStatus;
  statusLabel: string;
  statusEmoji: string;
}

function isScheduleNow(s: DBSchedule, time: string): boolean {
  return time >= s.startTime && time <= s.endTime;
}

function isBookingNow(b: DBBooking, time: string): boolean {
  return time >= b.startTime && time <= b.endTime;
}

function calcStatus(sensor: DBSensor | undefined, hasScheduleNow: boolean, hasBookingNow: boolean): RoomStatus {
  if (!sensor?.timestamp) return hasScheduleNow ? "scheduled" : hasBookingNow ? "booked" : "offline";
  const people = sensor.peopleCount ?? 0;
  const motionMs = sensor.motionDuration ?? 999999;
  const isActive = people > 0 || motionMs < 60_000;
  if (isActive) return "active";
  if (hasScheduleNow) return "scheduled";
  if (hasBookingNow) return "booked";
  return "empty";
}

const STATUS_META: Record<RoomStatus, { label: string; emoji: string }> = {
  active:    { label: "Kelas Aktif / Ada Aktivitas", emoji: "🔴" },
  scheduled: { label: "Terjadwal",                  emoji: "🟡" },
  booked:    { label: "Sudah Di-booking",            emoji: "🔵" },
  empty:     { label: "Kosong",                      emoji: "🟢" },
  offline:   { label: "Sensor Offline",              emoji: "⚫" },
};

function buildRoomInfos(
  rooms: DBRoom[],
  sensors: Map<string, DBSensor>,
  schedules: DBSchedule[],
  bookings: DBBooking[],
  time: string,
): RoomInfo[] {
  return rooms.map((room) => {
    const sensor = sensors.get(room.id);
    const todaySchedules = schedules.filter((s) => s.roomId === room.id);
    const activeSchedule = todaySchedules.find((s) => isScheduleNow(s, time));
    const activeBooking = bookings.find((b) => b.roomId === room.id && isBookingNow(b, time));
    const status = calcStatus(sensor, !!activeSchedule, !!activeBooking);
    return {
      room,
      sensor,
      activeSchedule,
      todaySchedules,
      activeBooking,
      status,
      statusLabel: STATUS_META[status].label,
      statusEmoji: STATUS_META[status].emoji,
    };
  });
}

// ─── Format Respons ───────────────────────────────────────────────────────────

function ok(answer: string, type = "general") {
  return NextResponse.json({ success: true, answer, type });
}

function fmtRoomBrief(info: RoomInfo): string {
  const sensor = info.sensor;
  const suhu = sensor?.temperature != null ? `${sensor.temperature}°C` : "N/A";
  const humid = sensor?.humidity != null ? `${sensor.humidity}%` : "N/A";
  const orang = sensor?.peopleCount != null ? `${sensor.peopleCount} orang` : "N/A";
  const sched = info.activeSchedule
    ? `📚 **${info.activeSchedule.subject ?? "Kelas"}** (${info.activeSchedule.startTime}–${info.activeSchedule.endTime})`
    : info.activeBooking
    ? `📌 Booking: ${info.activeBooking.purpose ?? "Kegiatan"} oleh ${info.activeBooking.userName ?? "Pengguna"}`
    : "Tidak ada kelas/booking aktif";
  return (
    `${info.statusEmoji} **${info.room.id}** — ${info.statusLabel}\n` +
    `   🌡️ ${suhu}  💧 ${humid}  👥 ${orang}\n` +
    `   ${sched}`
  );
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question: string = (body.question ?? "").toString().trim();
    const history: IncomingMsg[] = Array.isArray(body.messages) ? body.messages : [];

    if (!question) {
      return NextResponse.json(
        { success: false, answer: "Silakan ajukan pertanyaan terlebih dahulu ya!" },
        { status: 400 }
      );
    }

    const lq = question.toLowerCase();

    // ── Guardrail ─────────────────────────────────────────────────────────
    if (isOutOfScope(lq)) {
      return ok(
        "Maaf, sebagai **Asisten ClassTrack** saya hanya bisa membantu seputar ruangan, jadwal, sensor IoT, dan panduan sistem ini. 😊\n\nAda yang bisa saya bantu terkait kelas atau ruangan?",
        "out_of_scope"
      );
    }

    // ── Hari libur (pertanyaan operasional) ───────────────────────────────
    if (!isWeekday() && (isEmptyRoomQ(lq) || isScheduleQ(lq))) {
      return ok(
        `Hari ini **${getCurrentDayID()}** — hari libur, jadi tidak ada jadwal kelas aktif. 🎉\n\nSilakan tanyakan kembali pada hari Senin–Jumat untuk data yang akurat!`,
        "holiday"
      );
    }

    // ── Sapaan / bantuan umum ─────────────────────────────────────────────
    if (isGreeting(lq) && !isEmptyRoomQ(lq) && !isSensorQ(lq) && !isBookingQ(lq) && !isScheduleQ(lq)) {
      return ok(
        "Halo! 👋 Saya **Asisten AI ClassTrack** — siap bantu kamu seputar smart classroom.\n\n" +
        "Yang bisa kamu tanyakan:\n" +
        "• *\"Ruangan mana yang kosong sekarang?\"*\n" +
        "• *\"Jadwal hari ini di ruangan TI-1A?\"*\n" +
        "• *\"Apa arti sensor PIR, IR, DHT?\"*\n" +
        "• *\"Bagaimana cara booking ruangan?\"*\n\n" +
        "Ketik pertanyaanmu dan saya carikan datanya langsung dari sistem! 😊",
        "help"
      );
    }

    // ── Penjelasan sensor (tidak perlu DB) ────────────────────────────────
    if (isMeaningQ(lq)) {
      return ok(
        "Berikut penjelasan sensor IoT yang terpasang di setiap ruangan ClassTrack:\n\n" +
        "🔴 **Sensor PIR** — Mendeteksi pergerakan manusia di dalam kelas. Jika aktif, berarti ada orang bergerak di ruangan.\n\n" +
        "🟡 **Sensor IR (Infrared)** — Dipasang di kursi/meja untuk mendeteksi ocupansi fisik dan menghitung jumlah orang secara akurat.\n\n" +
        "🔵 **Sensor DHT11/DHT22** — Memonitor suhu dan kelembapan ruangan untuk kenyamanan belajar.\n\n" +
        "💡 **Indikator LED**:\n" +
        "   • 🟢 **Hijau** = Kosong/tersedia\n" +
        "   • 🔴 **Merah** = Sedang terisi\n" +
        "   • 🔵 **Biru** = Sudah di-booking\n\n" +
        "Semua data dikirim real-time dari perangkat **ESP32** di tiap kelas. 💡",
        "sensor_info"
      );
    }

    // ── Cara booking (tidak perlu DB) ─────────────────────────────────────
    if (isBookingQ(lq)) {
      return ok(
        "Berikut cara **booking ruangan** di ClassTrack:\n\n" +
        "1️⃣ Masuk ke menu **Jadwal & Booking** di sidebar.\n" +
        "2️⃣ Pilih ruangan yang statusnya **Kosong** 🟢 — artinya tidak ada kelas/booking aktif.\n" +
        "3️⃣ Klik **\"Booking Ruangan\"**, isi jam penggunaan dan keperluan, lalu klik **\"Konfirmasi\"**.\n\n" +
        "✅ Setelah dikonfirmasi admin, status ruangan akan berubah menjadi **Biru** (Di-booking).\n\n" +
        "Ada yang masih bingung? Tanya aja! 😊",
        "booking_guide"
      );
    }

    // ── Fetch semua data DB sekarang ──────────────────────────────────────
    const time = getCurrentTime();
    const [rooms, sensors, schedules, bookings] = await Promise.all([
      fetchRooms(),
      fetchLatestSensors(),
      fetchTodaySchedules(),
      fetchTodayBookings(),
    ]);

    if (rooms.length === 0) {
      return ok(
        "Maaf, saya tidak bisa mengambil data ruangan dari database saat ini. Coba refresh halaman atau hubungi admin ya! 🙏",
        "error"
      );
    }

    const roomIds = rooms.map((r) => r.id);
    const roomInfos = buildRoomInfos(rooms, sensors, schedules, bookings, time);

    // Cari ruangan yang disebut — cek pertanyaan sekarang + history
    const prevText = history.filter((m) => m.role === "user").map((m) => m.text).join(" ");
    const mentionedId = findRoomId(lq, roomIds) ?? findRoomId(prevText, roomIds);
    const targetInfo = mentionedId ? roomInfos.find((r) => r.room.id === mentionedId) : undefined;

    // ── Query ruangan spesifik ────────────────────────────────────────────
    if (targetInfo) {
      const { room, sensor, activeSchedule, activeBooking, todaySchedules, status, statusLabel, statusEmoji } = targetInfo;
      const suhu = sensor?.temperature != null ? `${sensor.temperature}°C` : "N/A";
      const humid = sensor?.humidity != null ? `${sensor.humidity}%` : "N/A";
      const orang = sensor?.peopleCount != null ? `${sensor.peopleCount} orang` : "N/A";
      const led = sensor?.ledStatus ?? "N/A";

      // Sub-intent: apakah kosong?
      if (isEmptyRoomQ(lq)) {
        if (status === "empty" || status === "offline") {
          return ok(
            `${statusEmoji} **Ruangan ${room.id}** saat ini **KOSONG** dan tersedia! ✅\n\n` +
            `📡 Sensor: Suhu ${suhu} | Kelembapan ${humid} | Orang: ${orang}\n\n` +
            `Kamu bisa langsung booking lewat menu **Jadwal & Booking**! 🟢`,
            "room_status"
          );
        }
        if (status === "active") {
          const info = activeSchedule
            ? `Sedang ada kelas **${activeSchedule.subject ?? ""}** (${activeSchedule.startTime}–${activeSchedule.endTime}).`
            : "Sensor mendeteksi ada aktivitas di ruangan.";
          return ok(
            `🔴 **Ruangan ${room.id}** saat ini **TERISI**.\n\n${info}\n\n` +
            `📡 Sensor: Suhu ${suhu} | Orang: ${orang}\n\n` +
            `Coba ruangan lain yang kosong ya!`,
            "room_status"
          );
        }
        if (status === "booked") {
          const bk = activeBooking;
          return ok(
            `🔵 **Ruangan ${room.id}** saat ini **SUDAH DI-BOOKING**.\n\n` +
            (bk ? `📌 Oleh: ${bk.userName ?? "Pengguna"} | Keperluan: ${bk.purpose ?? "-"} (${bk.startTime}–${bk.endTime})\n\n` : "") +
            `Coba cek ruangan lain yang masih kosong!`,
            "room_status"
          );
        }
        return ok(
          `${statusEmoji} **Ruangan ${room.id}** — Status: **${statusLabel}**\n\n` +
          `📡 Suhu: ${suhu} | Kelembapan: ${humid} | Orang: ${orang}`,
          "room_status"
        );
      }

      // Sub-intent: jadwal ruangan ini
      if (isScheduleQ(lq)) {
        if (todaySchedules.length === 0) {
          return ok(
            `📅 **Ruangan ${room.id}** tidak memiliki jadwal kelas hari ini (**${getCurrentDayID()}**).\n\n` +
            `Ruangan ini ${status === "empty" ? "**kosong dan bisa di-booking**! 🟢" : `saat ini berstatus: **${statusLabel}** ${statusEmoji}`}`,
            "schedule"
          );
        }
        const lines = todaySchedules.map((s) =>
          `• **${s.startTime}–${s.endTime}** — ${s.subject ?? "Kelas"}${s.lecturer ? ` (${s.lecturer})` : ""}${s.class ? ` | Kelas: ${s.class}` : ""}`
        );
        return ok(
          `📅 Jadwal **${room.id}** hari ini (**${getCurrentDayID()}**):\n\n${lines.join("\n")}\n\n` +
          `Status saat ini: ${statusEmoji} **${statusLabel}**`,
          "schedule"
        );
      }

      // Sub-intent: data sensor ruangan ini
      if (isSensorQ(lq)) {
        const motionMin = sensor?.motionDuration != null
          ? `${Math.round(sensor.motionDuration / 60000)} menit lalu`
          : "N/A";
        return ok(
          `📡 Data sensor real-time **Ruangan ${room.id}**:\n\n` +
          `🌡️ **Suhu**: ${suhu}\n` +
          `💧 **Kelembapan**: ${humid}\n` +
          `👥 **Jumlah Orang (IR)**: ${orang}\n` +
          `⏱️ **Gerakan Terakhir**: ${motionMin}\n` +
          `💡 **LED**: ${led}\n` +
          `📊 **Status**: ${statusEmoji} ${statusLabel}\n\n` +
          (activeSchedule
            ? `📚 Sedang berjalan: **${activeSchedule.subject ?? "Kelas"}** (${activeSchedule.startTime}–${activeSchedule.endTime})`
            : `Tidak ada kelas berjalan saat ini.`),
          "sensor_data"
        );
      }

      // Info umum ruangan
      return ok(fmtRoomBrief(targetInfo), "room_info");
    }

    // ── Daftar ruangan kosong ─────────────────────────────────────────────
    if (isEmptyRoomQ(lq)) {
      if (!isOperationalHour()) {
        return ok(
          `Di luar jam operasional (07:00–18:00) — sensor sedang tidak aktif memantau.\n\nTanyakan kembali saat jam kelas ya! 😊`,
          "empty_rooms"
        );
      }
      const empty = roomInfos.filter((r) => r.status === "empty" || r.status === "offline");
      const busy  = roomInfos.filter((r) => r.status === "active" || r.status === "scheduled" || r.status === "booked");

      if (empty.length === 0) {
        return ok(
          `Saat ini **semua ruangan sedang terisi atau terjadwal** berdasarkan data real-time. 🔴\n\n` +
          busy.map(fmtRoomBrief).join("\n\n") +
          `\n\nCoba cek lagi beberapa saat atau lihat halaman Booking untuk slot tersedia!`,
          "empty_rooms"
        );
      }

      const emptyList = empty.map(fmtRoomBrief).join("\n\n");
      const busySummary = busy.length > 0
        ? `\n\n**Sedang Terisi/Terjadwal:**\n${busy.map((r) => `${r.statusEmoji} **${r.room.id}** — ${r.statusLabel}`).join("\n")}`
        : "";

      return ok(
        `Berikut status ruangan saat ini (**${getCurrentDayID()}**, ${time} WIB):\n\n` +
        `**Ruangan Kosong & Tersedia:**\n${emptyList}` +
        busySummary +
        `\n\nBooking bisa dilakukan lewat menu **Jadwal & Booking** di sidebar! 🟢`,
        "empty_rooms"
      );
    }

    // ── Jadwal hari ini (semua ruangan) ───────────────────────────────────
    if (isScheduleQ(lq)) {
      if (schedules.length === 0) {
        return ok(
          `Tidak ada jadwal kelas yang terdaftar untuk hari **${getCurrentDayID()}** di database.\n\nMungkin jadwal belum diinput atau hari ini memang libur!`,
          "schedule"
        );
      }
      // Kelompokkan per ruangan
      const byRoom = new Map<string, DBSchedule[]>();
      for (const s of schedules) {
        if (!byRoom.has(s.roomId)) byRoom.set(s.roomId, []);
        byRoom.get(s.roomId)!.push(s);
      }
      const lines: string[] = [];
      for (const [roomId, ss] of byRoom) {
        lines.push(`📍 **${roomId}**:`);
        for (const s of ss) {
          lines.push(`   • ${s.startTime}–${s.endTime}: ${s.subject ?? "Kelas"}${s.lecturer ? ` (${s.lecturer})` : ""}`);
        }
      }
      return ok(
        `📅 Jadwal kelas hari **${getCurrentDayID()}** (${schedules.length} sesi total):\n\n${lines.join("\n")}\n\n` +
        `Untuk detail ruangan tertentu, sebutkan nama ruangannya — misal *"Jadwal TI-1A"*!`,
        "schedule"
      );
    }

    // ── Sensor umum (semua ruangan) ───────────────────────────────────────
    if (isSensorQ(lq)) {
      const active = roomInfos.filter((r) => r.status === "active").length;
      const offline = roomInfos.filter((r) => r.status === "offline").length;
      const summary = roomInfos.map(fmtRoomBrief).join("\n\n");
      return ok(
        `📡 Status sensor semua ruangan saat ini:\n\n${summary}\n\n` +
        `📊 **Ringkasan**: ${active} ruangan aktif, ${offline} sensor offline dari ${rooms.length} total ruangan.\n\n` +
        `Untuk data spesifik, sebutkan nama ruangannya!`,
        "sensor_data"
      );
    }

    // ── Fallback ──────────────────────────────────────────────────────────
    const allStatus = roomInfos.map((r) => `${r.statusEmoji} **${r.room.id}** — ${r.statusLabel}`).join("\n");
    return ok(
      `Saya siap membantu! Coba tanyakan:\n\n` +
      `• *"Ruangan mana yang kosong sekarang?"*\n` +
      `• *"Jadwal hari ini di TI-1A?"*\n` +
      `• *"Status sensor TI-2A?"*\n` +
      `• *"Cara booking ruangan?"*\n\n` +
      `**Status semua ruangan saat ini (${time} WIB):**\n${allStatus}`,
      "fallback"
    );

  } catch (err) {
    console.error("[/api/assistant] Error:", err);
    return NextResponse.json(
      { success: false, answer: "Ada gangguan di server. Coba ulangi beberapa detik lagi ya! 🙏" },
      { status: 500 }
    );
  }
}
