import { NextResponse } from "next/server";
import { roomContainer, sensorContainer, scheduleContainer } from "@/lib/cosmos";

interface CosmosRoom {
  id: string;
  roomName?: string;
  wing?: string | null;
  floor?: string | number;
}

interface CosmosSensor {
  roomId: string;
  temperature?: number;
  humidity?: number;
  peopleCount?: number;
  motionCount?: number;
  motionDuration?: number;
  ledStatus?: string;
  timestamp?: string;
}

interface ScheduleEntry {
  id: string;
  roomId: string;
  day: string;
  startTime: string;
  endTime: string;
  subject?: string;
}

function getCurrentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function getCurrentDay() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findRoomId(query: string, roomIds: string[]) {
  const text = query.toLowerCase();
  const sorted = [...roomIds].sort((a, b) => b.length - a.length);
  for (const id of sorted) {
    const regex = new RegExp(`\\b${escapeRegExp(id.toLowerCase())}\\b`, "i");
    if (regex.test(text)) return id;
  }
  return undefined;
}

function isHelpQuestion(text: string) {
  return /cara|bagaimana|panduan|bantuan|help|gimana|menggunakan|login|daftar|mulai|start|tutorial|paham|bingung|gak paham|tidak paham|saran|tips|apa itu|mengapa|user/.test(text);
}

function isBookingQuestion(text: string) {
  return /booking|reservasi|pesan|pinjam|batal|batalkan|cancel/.test(text);
}

function isEmptyRoomQuestion(text: string) {
  return /ruangan .*kosong|ada ruangan.*kosong|ruangan kosong|kosong sekarang|available|tersedia/.test(text);
}

function isScheduleQuestion(text: string) {
  return /jadwal|kelas|jam|berjalan|mulai|berakhir|sesi/.test(text);
}

function isSensorQuestion(text: string) {
  return /sensor|suhu|kelembapan|pir|ir|dht|orang|aktivitas|pergerakan/.test(text);
}

function formatRoomTile(roomId: string) {
  return `"${roomId}"`;
}

function getScheduleStatusLabel(sensorStatus: string, hasSchedule: boolean) {
  if (hasSchedule && sensorStatus === "active") return "Kelas sedang berjalan";
  if (hasSchedule && sensorStatus === "empty") return "Jadwal ada tetapi tidak ada aktivitas";
  if (!hasSchedule && sensorStatus === "empty") return "Ruangan kosong";
  if (!hasSchedule && sensorStatus === "active") return "Ada aktivitas tanpa jadwal";
  return "Status tidak pasti";
}

async function fetchRoomsWithSensors() {
  const { resources: rooms } = await roomContainer.items
    .query<CosmosRoom>("SELECT * FROM c ORDER BY c.id ASC")
    .fetchAll();

  let sensors: CosmosSensor[] = [];
  try {
    const sensorResult = await sensorContainer.items
      .query<CosmosSensor>("SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT 200")
      .fetchAll();
    sensors = sensorResult.resources;
  } catch (error) {
    sensors = [];
  }

  const latestSensorMap = new Map<string, CosmosSensor>();
  for (const sensor of sensors) {
    if (!latestSensorMap.has(sensor.roomId)) {
      latestSensorMap.set(sensor.roomId, sensor);
    }
  }

  return rooms.map((room) => {
    const sensor = latestSensorMap.get(room.id);
    return {
      id: room.id,
      wing: room.wing ?? null,
      floor: room.floor ?? null,
      sensor,
    };
  });
}

async function fetchTodaySchedules() {
  const today = getCurrentDay();
  const querySpec = {
    query: "SELECT * FROM c WHERE c.day = @day ORDER BY c.startTime",
    parameters: [{ name: "@day", value: today }],
  };

  const { resources: schedules } = await scheduleContainer.items
    .query<ScheduleEntry>(querySpec)
    .fetchAll();

  return schedules;
}

function hasOngoingSchedule(schedule: ScheduleEntry, now: string) {
  return now >= schedule.startTime && now <= schedule.endTime;
}

function calculateSensorStatus(sensor?: CosmosSensor) {
  if (!sensor?.timestamp) return "offline";
  const peopleCount = sensor.peopleCount ?? 0;
  const motionDuration = sensor.motionDuration ?? 0;
  if (peopleCount > 0) return "active";
  if (motionDuration < 60000) return "active";
  if (motionDuration < 300000) return "uncertain";
  return "empty";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = (body.question ?? "").toString().trim();
    if (!question) {
      return NextResponse.json({ success: false, answer: "Silakan ajukan pertanyaan terlebih dahulu." }, { status: 400 });
    }

    const lowerText = question.toLowerCase();
    const rooms = await fetchRoomsWithSensors();
    const schedules = await fetchTodaySchedules();
    const now = getCurrentTime();
    const roomIds = rooms.map((room) => room.id);
    const requestedRoomId = findRoomId(lowerText, roomIds);
    const hasScheduleQuestionFlag = isScheduleQuestion(lowerText);
    const hasEmptyQuestionFlag = isEmptyRoomQuestion(lowerText);
    const hasSensorQuestionFlag = isSensorQuestion(lowerText);
    const hasHelpFlag = isHelpQuestion(lowerText);
    const hasBookingFlag = isBookingQuestion(lowerText);

    if (hasHelpFlag && !requestedRoomId) {
      return NextResponse.json({
        success: true,
        answer:
          "Halo! Saya Asisten AI ClassTrack. Saya dapat membantu semua hal terkait penggunaan website dan data smart classroom. \n" +
          "Berikut yang bisa Anda tanyakan: \n" +
          "- Cara mencari ruangan kosong sekarang. \n" +
          "- Cara melihat jadwal kelas di ruangan tertentu. \n" +
          "- Cara membaca status sensor PIR/IR/DHT. \n" +
          "- Cara melakukan booking ruangan atau membatalkan jadwal. \n" +
          "- Jika Anda bingung menggunakan fitur, tulis saja apa yang ingin Anda lakukan, misalnya 'saya tidak paham cara booking'. \n" +
          "Setelah selesai, Anda dapat menutup Asisten dengan tombol Tutup.",
      });
    }

    if (hasBookingFlag && !requestedRoomId) {
      return NextResponse.json({
        success: true,
        answer:
          "Untuk memesan ruangan, cari terlebih dahulu ruangan yang kosong atau memiliki jadwal yang sesuai. \n" +
          "Kemudian gunakan fitur booking pada aplikasi jika tersedia, atau hubungi administrator jika belum tersedia. \n" +
          "Jika Anda ingin memeriksa ketersediaan, tanyakan 'Ruangan kosong mana sekarang?' atau sebutkan kode ruangan seperti 'Apakah ruangan A5 kosong?'.",
      });
    }

    if (hasSensorQuestionFlag && !requestedRoomId) {
      return NextResponse.json({
        success: true,
        answer:
          "Sensor PIR/IR/DHT membantu mendeteksi aktivitas, suhu, dan kelembapan di ruangan. \n" +
          "Jika Anda ingin tahu status untuk ruangan tertentu, sebutkan kodenya, misalnya 'Bagaimana status sensor di ruangan B3?'.",
      });
    }

    if (requestedRoomId) {
      const roomData = rooms.find((room) => room.id === requestedRoomId);
      const currentSchedule = schedules.find(
        (entry) => entry.roomId === requestedRoomId && hasOngoingSchedule(entry, now)
      );
      const sensorStatus = calculateSensorStatus(roomData?.sensor);
      const readableStatus = getScheduleStatusLabel(sensorStatus, Boolean(currentSchedule));

      if (hasEmptyQuestionFlag) {
        if (currentSchedule) {
          return NextResponse.json({
            success: true,
            answer: `Ruangan ${formatRoomTile(requestedRoomId)} saat ini terjadwal untuk kelas ${currentSchedule.subject ?? "(tidak disebutkan)"} ${currentSchedule.startTime}-${currentSchedule.endTime}. Sensor mencatat status ${sensorStatus}, jadi sebaiknya cek langsung jika diperlukan.`, 
          });
        }

        if (sensorStatus === "empty") {
          return NextResponse.json({
            success: true,
            answer: `Ruangan ${formatRoomTile(requestedRoomId)} saat ini kosong menurut data sensor. Tidak ada jadwal yang berjalan di ruangan ini sekarang.`, 
          });
        }

        return NextResponse.json({
          success: true,
          answer: `Ruangan ${formatRoomTile(requestedRoomId)} kemungkinan tidak kosong sekarang. Status sensor menunjukkan ${sensorStatus}.`, 
        });
      }

      if (hasScheduleQuestionFlag) {
        const todayScheduleForRoom = schedules.filter((entry) => entry.roomId === requestedRoomId);
        if (todayScheduleForRoom.length === 0) {
          return NextResponse.json({
            success: true,
            answer: `Ruangan ${formatRoomTile(requestedRoomId)} tidak memiliki jadwal kelas hari ini menurut database.`, 
          });
        }

        const lines = todayScheduleForRoom.map((entry) => `- ${entry.startTime}–${entry.endTime}: ${entry.subject ?? "Kelas"}`);
        return NextResponse.json({
          success: true,
          answer: `Jadwal hari ini untuk ${formatRoomTile(requestedRoomId)}:\n${lines.join("\n")}`,
        });
      }

      if (hasSensorQuestionFlag) {
        return NextResponse.json({
          success: true,
          answer: `Sensor untuk ${formatRoomTile(requestedRoomId)} menunjukkan status ${sensorStatus}. ${currentSchedule ? `Ada jadwal berjalan sekarang (${currentSchedule.startTime}-${currentSchedule.endTime}).` : "Tidak ada jadwal sekarang."}`,
        });
      }

      return NextResponse.json({
        success: true,
        answer: `Saya menemukan ruangan ${formatRoomTile(requestedRoomId)}. Status saat ini: ${readableStatus}. ${currentSchedule ? `Saat ini kelas berjalan dari ${currentSchedule.startTime} sampai ${currentSchedule.endTime}.` : "Tidak ada kelas saat ini."}`,
      });
    }

    if (hasEmptyQuestionFlag) {
      const freeRooms = rooms.filter((room) => {
        const roomSchedule = schedules.some((entry) => entry.roomId === room.id && hasOngoingSchedule(entry, now));
        const sensorStatus = calculateSensorStatus(room.sensor);
        return !roomSchedule && sensorStatus === "empty";
      });

      if (freeRooms.length === 0) {
        return NextResponse.json({
          success: true,
          answer: "Saat ini tidak ada ruangan yang terdeteksi kosong berdasarkan data jadwal dan sensor. Coba lagi beberapa saat lagi atau daftar ruangan khusus jika diperlukan.",
        });
      }

      return NextResponse.json({
        success: true,
        answer: `Ruangan kosong saat ini: ${freeRooms.slice(0, 5).map((room) => room.id).join(", ")}.`, 
      });
    }

    if (hasScheduleQuestionFlag) {
      const countToday = schedules.length;
      return NextResponse.json({
        success: true,
        answer: `Saat ini ada ${countToday} entri jadwal untuk hari ini dalam database. Anda bisa tanyakan nama ruangan tertentu, misalnya 'Apakah ruangan A5 kosong?' untuk jawaban lebih spesifik.`, 
      });
    }

    if (hasSensorQuestionFlag) {
      const activeRooms = rooms.filter((room) => calculateSensorStatus(room.sensor) === "active");
      return NextResponse.json({
        success: true,
        answer: `Berdasarkan data sensor, ada ${activeRooms.length} ruangan yang sedang terdeteksi aktivitas sekarang. Jika Anda ingin tahu status ruangan tertentu, tanyakan dengan menyebutkan kode ruangannya.`, 
      });
    }

    return NextResponse.json({
      success: true,
      answer:
        "Saya siap membantu dengan pertanyaan tentang ruangan, jadwal, sensor, dan cara menggunakan website. " +
        "Coba tanyakan: 'Ruangan kosong mana sekarang?' atau 'Bagaimana cara booking ruangan?' atau 'Apakah ruangan A5 kosong?'.",
    });
  } catch (error) {
    console.error("/api/assistant error:", error);
    return NextResponse.json(
      { success: false, answer: "Terjadi kesalahan server saat menanyakan Asisten AI." },
      { status: 500 }
    );
  }
}
