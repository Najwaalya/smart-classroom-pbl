import { NextResponse } from "next/server";
import { roomContainer, sensorContainer } from "@/lib/cosmos";

// =====================================================
// GET /api/rooms/combined
// Menggabungkan data rooms + sensor terbaru per ruangan
// Dipakai oleh RoomDataContext untuk live monitoring
// =====================================================

interface CosmosRoom {
  id: string;
  roomId?: string;
  roomName?: string;
  name?: string;
  wing?: string | null;
  floor?: string | number;
}

interface CosmosSensor {
  id: string;
  roomId: string;
  temperature: number;
  humidity: number;
  peopleCount: number;
  motionCount: number;
  motionDuration: number;
  roomStatus: string;
  ledStatus: string;
  timestamp: string;
}

function deriveStatus(
  sensor: CosmosSensor | undefined
): "active" | "uncertain" | "empty" {

  // tidak ada data sensor
  if (!sensor) return "empty";

  // masih ada orang
  if ((sensor.peopleCount ?? 0) > 0) {
    return "active";
  }

  // motion duration dalam millisecond
  const motionDuration =
    sensor.motionDuration ?? 0;

  // < 1 menit
  if (motionDuration < 60000) {
    return "active";
  }

  // 1 - 5 menit
  if (motionDuration < 300000) {
    return "uncertain";
  }

  // > 5 menit
  return "empty";
}

function roomMatchesSensor(roomId: string, sensorRoomId?: string) {
  if (!sensorRoomId) return false;
  const normalizedRoomId = roomId.trim().toLowerCase();
  const normalizedSensorRoomId = sensorRoomId.trim().toLowerCase();

  if (normalizedRoomId === normalizedSensorRoomId) return true;
  if (normalizedSensorRoomId.startsWith(`${normalizedRoomId}-`)) return true;
  if (normalizedRoomId.startsWith(`${normalizedSensorRoomId}-`)) return true;
  return false;
}

export async function GET() {
  try {
    // 1. Ambil semua rooms
    const { resources: rooms } = await roomContainer.items
      .query<CosmosRoom>("SELECT * FROM c ORDER BY c.id ASC")
      .fetchAll();

    // 2. Ambil sensor terbaru (order by timestamp desc), lalu map ke rooms secara fleksibel
    let sensors: CosmosSensor[] = [];
    try {
      const sensorResult = await sensorContainer.items
        .query<CosmosSensor>(
          "SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT 200"
        )
        .fetchAll();

      sensors = sensorResult.resources;
    } catch (error: unknown) {
      const cosmosError = error as { code?: number | string };
      if (cosmosError?.code === 404 || cosmosError?.code === "NotFound") {
        console.warn(
          "[/api/rooms/combined] Sensor container not found, continuing without sensor data",
          error
        );
        sensors = [];
      } else {
        throw error;
      }
    }

    // 3. Buat map sensor terbaru per roomId, dengan mapping fleksibel
    const latestSensorMap = new Map<string, CosmosSensor>();
    const unmatchedRooms = new Set(
      rooms.map((room) => room.roomId?.trim() ?? room.id)
    );

    for (const s of sensors) {
      if (unmatchedRooms.size === 0) break;
      for (const roomId of Array.from(unmatchedRooms)) {
        if (roomMatchesSensor(roomId, s.roomId)) {
          latestSensorMap.set(roomId, s);
          unmatchedRooms.delete(roomId);
        }
      }
    }

    const MAX_SENSOR_AGE_MS = 1000 * 60 * 5; // 5 menit (stale sensor threshold)
    const isSensorFresh = (timestamp?: string | null) => {
      if (!timestamp) return false;
      const time = new Date(timestamp).getTime();
      return !Number.isNaN(time) && Date.now() - time < MAX_SENSOR_AGE_MS;
    };

    // 4. Gabungkan room + sensor
    const combined = rooms.map((room) => {
      const roomLookupId = room.roomId?.trim() || room.id;
      const rawSensor = latestSensorMap.get(roomLookupId);
      const sensor = rawSensor && isSensorFresh(rawSensor.timestamp) ? rawSensor : undefined;
      const hasSensor = Boolean(sensor);
      const dhtWarning =
        sensor &&
        (sensor.temperature > 28 || sensor.humidity < 40 || sensor.humidity > 60);
      const pirActivityLevel = sensor
        ? Math.min(
            100,
            Math.round((sensor.motionCount ?? 0) * 2 + (sensor.motionDuration ?? 0) / 1000)
          )
        : 0;

      const displayName = sensor?.roomId && roomMatchesSensor(roomLookupId, sensor.roomId)
        ? sensor.roomId
        : room.roomId || room.roomName || room.name || room.id;

      return {
        id: room.id,
        roomId: room.roomId ?? room.id,
        name: displayName,
        roomName: room.roomName,
        status: deriveStatus(sensor),
        students: sensor?.peopleCount ?? 0,
        temp: sensor?.temperature ?? 0,
        humidity: sensor?.humidity ?? 0,
        pir: sensor
          ? [
              sensor.motionCount ?? 0,
              sensor.motionDuration ?? 0,
              sensor.peopleCount ?? 0,
              sensor.motionCount ?? 0,
            ]
          : [],
        wing: room.wing ?? null,
        ledStatus: sensor?.ledStatus ?? "off",
        lastUpdated: sensor?.timestamp ?? null,
        sensorHealth: {
          overall: !hasSensor ? "offline" : dhtWarning ? "warning" : "ok",
          message: !hasSensor
            ? "Sensor offline atau belum terhubung"
            : dhtWarning
            ? "Periksa suhu / kelembapan DHT"
            : "Sensor bekerja normal",
        },
        dhtSensor: {
          temperature: sensor?.temperature ?? 0,
          humidity: sensor?.humidity ?? 0,
          status: !hasSensor
            ? "offline"
            : (sensor?.temperature ?? 0) > 28
            ? "high"
            : (sensor?.humidity ?? 0) < 40
            ? "low"
            : (sensor?.humidity ?? 0) > 60
            ? "high"
            : "normal",
          health: !hasSensor
            ? "offline"
            : dhtWarning
            ? "warning"
            : "ok",
          lastUpdated: sensor?.timestamp ?? null,
        },
        irSensor: {
          peopleCount: sensor?.peopleCount ?? 0,
          status: !hasSensor
            ? "offline"
            : (sensor?.peopleCount ?? 0) > 0
            ? "present"
            : "absent",
          lastUpdated: sensor?.timestamp ?? null,
        },
        pirSensor: {
          motionCount: sensor?.motionCount ?? 0,
          motionDuration: sensor?.motionDuration ?? 0,
          activityLevel: pirActivityLevel,
          status: !hasSensor
            ? "offline"
            : pirActivityLevel > 10
            ? "active"
            : "inactive",
          lastUpdated: sensor?.timestamp ?? null,
        },
      };
    });

    return NextResponse.json({ success: true, data: combined });
  } catch (error) {
    console.error("[/api/rooms/combined] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? `Gagal mengambil data ruangan: ${error.message}`
            : "Gagal mengambil data ruangan",
      },
      { status: 500 }
    );
  }
}
