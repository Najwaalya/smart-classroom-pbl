import { NextResponse } from "next/server";
import { roomContainer, sensorContainer } from "@/lib/cosmos";

// =====================================================
// GET /api/rooms/combined
// Menggabungkan data rooms + sensor terbaru per ruangan
// Dipakai oleh RoomDataContext untuk live monitoring
// =====================================================

interface CosmosRoom {
  id: string;
  roomName?: string;
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

function deriveStatus(sensor: CosmosSensor | undefined): "active" | "uncertain" | "empty" {
  if (!sensor) return "empty";
  const status = (sensor.roomStatus ?? "").toLowerCase();
  if (status === "aktif" || status === "active" || status === "occupied") return "active";
  if (status === "uncertain" || status === "tidak pasti" || status === "unknown") return "uncertain";
  if (sensor.peopleCount > 0) return "active";
  return "empty";
}

export async function GET() {
  try {
    // 1. Ambil semua rooms
    const { resources: rooms } = await roomContainer.items
      .query<CosmosRoom>("SELECT * FROM c ORDER BY c.id ASC")
      .fetchAll();

    // 2. Ambil sensor terbaru per ruangan (top 100, sort desc timestamp)
    const { resources: sensors } = await sensorContainer.items
      .query<CosmosSensor>(
        "SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT 100"
      )
      .fetchAll();

    // 3. Buat map sensor terbaru per roomId
    const latestSensorMap = new Map<string, CosmosSensor>();
    for (const s of sensors) {
      if (!latestSensorMap.has(s.roomId)) {
        latestSensorMap.set(s.roomId, s);
      }
    }

    // 4. Gabungkan room + sensor
    const combined = rooms.map((room) => {
      const sensor = latestSensorMap.get(room.id);
      return {
        id: room.id,
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
      };
    });

    return NextResponse.json({ success: true, data: combined });
  } catch (error) {
    console.error("[/api/rooms/combined] Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data ruangan" },
      { status: 500 }
    );
  }
}
