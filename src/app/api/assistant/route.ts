import { NextResponse } from "next/server";
import { roomContainer, sensorContainer, scheduleContainer } from "@/lib/cosmos";

const SYSTEM_PROMPT = `Anda adalah Asisten AI ClassTrack, sebuah sistem Monitoring Kelas berbasis IoT dan Smart Classroom di Gedung TI. Tugas utama Anda adalah membantu mahasiswa dan admin.

Berikut adalah panduan dan basis data terintegrasi Anda (diambil dari Azure Cosmos DB):
1. Kontainer 'rooms': Menyimpan daftar kelas (TI-1A, TI-1B, TI-2A, TI-2B, RT02_5B).
2. Kontainer 'schedules' & 'bookings': Menyimpan slot waktu penggunaan ruangan. Jika slot kosong, ruangan bisa dibooking oleh mahasiswa.
3. Kontainer 'sensors_readings': Menampung data sensor nyata (PIR untuk gerakan, IR untuk jumlah orang, DHT untuk suhu/kelembapan).

Aturan Menjawab:
- Jika user bertanya 'Ruangan kosong mana sekarang?', analisis data sensor (jika PIR offline atau IR = 0 orang DAN tidak ada jadwal tetap), lalu sebutkan ruangan yang benar-benar kosong.
- Jika user bingung cara booking, jelaskan langkahnya: 'Silakan masuk ke halaman Booking Ruangan, pilih lantai dan hari, lalu klik pada slot waktu yang berwarna hijau'.
- Jika user bertanya arti sensor: PIR = mendeteksi gerakan manusia, IR = menghitung jumlah orang di dalam kelas, DHT = mengukur suhu dan kelembapan ruangan.
- Jawablah dengan bahasa Indonesia yang ramah, natural, santai, mudah dipahami, singkat, dan hindari jawaban yang terlalu kaku atau berbelit-belit.`;

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

function hasBookingHelpQuestion(text: string) {
  return /\bbingung\b.*\bbooking\b|\bcara\b.*\bbooking\b|\bgimana\b.*\bbooking\b|\bbook\b.*\bruangan\b|\bhelp\b.*\bbooking\b|\bpinjam\b.*\bruangan\b/.test(text);
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

function isSensorMeaningQuestion(text: string) {
  return /(arti sensor|apa itu pir|apa itu ir|apa itu dht|sensor.*arti|sensor.*maksud|maksud sensor|definisi sensor|penjelasan sensor)/.test(text);
}

function getSensorDescription() {
  return "PIR mendeteksi gerakan manusia di dalam kelas, IR menghitung jumlah orang, DHT mengukur suhu dan kelembapan ruangan.";
}

function isRoomActuallyEmpty(sensor?: CosmosSensor, hasSchedule = false) {
  const noSchedule = !hasSchedule;
  const irEmpty = sensor?.peopleCount === 0;
  const pirOffline = !sensor?.timestamp || sensor.motionDuration === undefined || sensor.motionDuration === null;
  return noSchedule && (pirOffline || irEmpty);
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
  const motionDuration = sensor.motionDuration ?? -1;
  if (peopleCount > 0) return "active";
  if (motionDuration < 0) return "uncertain";
  if (motionDuration < 60000) return "active";
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

    if ((hasBookingFlag || hasBookingHelpQuestion(lowerText)) && !requestedRoomId) {
      return NextResponse.json({
        success: true,
        answer:
          "Silakan masuk ke halaman Booking Ruangan, pilih lantai dan hari, lalu klik pada slot waktu yang berwarna hijau. " +
          "Jika Anda belum menemukan slot yang sesuai, periksa kembali apakah ruangan tersebut sudah terjadwal atau minta bantuan admin.",
      });
    }

    if (hasSensorQuestionFlag && !requestedRoomId) {
      if (isSensorMeaningQuestion(lowerText)) {
        return NextResponse.json({
          success: true,
          answer: getSensorDescription(),
        });
      }

      return NextResponse.json({
        success: true,
        answer:
          "Sensor PIR/IR/DHT membantu mendeteksi aktivitas, suhu, dan kelembapan di ruangan. " +
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

        if (isRoomActuallyEmpty(roomData?.sensor, false)) {
          const reason = !roomData?.sensor?.timestamp
            ? "PIR tidak aktif atau data sensor belum tersedia"
            : "IR menunjukkan 0 orang di dalam ruangan";
          return NextResponse.json({
            success: true,
            answer: `Ruangan ${formatRoomTile(requestedRoomId)} saat ini kosong berdasarkan data jadwal dan sensor. ${reason}.`, 
          });
        }

        return NextResponse.json({
          success: true,
          answer: `Ruangan ${formatRoomTile(requestedRoomId)} saat ini tidak tampak kosong. Sensor menunjukkan status ${sensorStatus}, sementara tidak ada jadwal tetap berjalan sekarang.`, 
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
        if (isSensorMeaningQuestion(lowerText)) {
          return NextResponse.json({
            success: true,
            answer: `${getSensorDescription()} Saat ini untuk ${formatRoomTile(requestedRoomId)} status sensor tercatat ${sensorStatus}.`, 
          });
        }

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
        return isRoomActuallyEmpty(room.sensor, roomSchedule);
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
