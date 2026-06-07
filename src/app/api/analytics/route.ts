import { NextResponse } from "next/server";

import {
  sensorContainer,
} from "@/lib/cosmos";

declare global {
  // store per-room empty timers on globalThis to survive Next.js HMR
  var emptyStartTimeMap: Record<string, number> | undefined;
}

interface SensorData {
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

export async function GET() {
  try {
    const MAX_SENSOR_AGE_MS = 1000 * 60 * 5; // 5 minutes (stale sensor threshold)
    const SATU_MENIT = 1 * 60 * 1000; // Untuk batas 1 menit
    const DETIK_30 = 30 * 1000; // Untuk batas 30 detik

    const isFresh = (ts?: string | null) => {
      if (!ts) return false;
      const t = new Date(ts).getTime();
      if (Number.isNaN(t)) return false;
      return Date.now() - t < MAX_SENSOR_AGE_MS;
    };

    const { resources: rawSensors } = await sensorContainer.items
      .query<SensorData>(`
        SELECT * FROM c
        WHERE IS_DEFINED(c.roomId)
        ORDER BY c._ts DESC
      `)
      .fetchAll();

    // ensure global map exists and is accessible across HMR reloads
    if (!globalThis.emptyStartTimeMap) {
      globalThis.emptyStartTimeMap = {};
    }

    const latestSensorMap = new Map<string, SensorData>();

    for (const item of rawSensors) {
      const roomId = item.roomId?.toString().trim();
      if (!roomId) continue;
      if (!latestSensorMap.has(roomId)) {
        latestSensorMap.set(roomId, item);
      }
    }

    const latestSensors = Array.from(latestSensorMap.values())
      .map((item) => {
        const context = {
          hasSchedule: false,
          isBooked: false,
          scheduleStartTime: Date.now(),
        };

        const fresh = isFresh(item.timestamp);

        // If sensor is stale (> MAX_SENSOR_AGE_MS), force occupancy data to zero
        // and mark the room as EMPTY to reflect offline/no-data state.
        if (!fresh) {
          const forcedPeople = 0;
          const forcedTemp = 0;
          const forcedHumidity = 0;
          const forcedStatus = "EMPTY";

          return {
            ...item,
            roomId: item.roomId,
            room: item.roomId,
            students: forcedPeople,
            peopleCount: forcedPeople,
            temp: forcedTemp,
            temperature: forcedTemp,
            humidity: forcedHumidity,
            roomStatus: forcedStatus,
            status: forcedStatus,
          };
        }

        const peopleCount = item.peopleCount ?? 0;
        const temperature = item.temperature ?? 0;
        const humidity = item.humidity ?? 0;
        const hasMotion = fresh && item.motionCount > 0;
        const lastUpdateTs = item.timestamp ? new Date(item.timestamp).getTime() : Date.now();
        const timeElapsedMs = Date.now() - lastUpdateTs;
        const timeSinceScheduleStart = Date.now() - context.scheduleStartTime;
        const roomKey = item.roomId?.toString().trim() || "unknown";
        const isCurrentlyEmpty = peopleCount === 0 && !hasMotion;
        let currentEmptyDuration = 0;

        if (isCurrentlyEmpty) {
          if (globalThis.emptyStartTimeMap && typeof globalThis.emptyStartTimeMap[roomKey] !== "number") {
            globalThis.emptyStartTimeMap[roomKey] = Date.now();
          }
          currentEmptyDuration = Date.now() - (globalThis.emptyStartTimeMap?.[roomKey] ?? Date.now());
        } else {
          // remove timer for this room when activity resumes
          if (globalThis.emptyStartTimeMap && globalThis.emptyStartTimeMap[roomKey] !== undefined) {
            delete globalThis.emptyStartTimeMap[roomKey];
          }
          currentEmptyDuration = 0;
        }

        let finalStatus = "EMPTY";

        if (context.hasSchedule) {
          if (!hasMotion && peopleCount === 0 && timeElapsedMs >= SATU_MENIT) {
            finalStatus = "EMPTY";
          } else if (!hasMotion && peopleCount === 0 && timeSinceScheduleStart <= SATU_MENIT) {
            finalStatus = "SCHEDULED";
          } else if (!hasMotion && peopleCount > 0 && timeElapsedMs >= DETIK_30) {
            finalStatus = "UNCERTAINED";
          } else if (hasMotion || peopleCount > 0) {
            finalStatus = "ACTIVE";
          }
        } else {
          if (context.isBooked) {
            finalStatus = "BOOKED";
          } else if (!hasMotion && timeElapsedMs >= DETIK_30) {
            finalStatus = "EMPTY";
          } else if (hasMotion || peopleCount > 0) {
            finalStatus = "ACTIVE";
          }
        }

        if (isCurrentlyEmpty && currentEmptyDuration >= SATU_MENIT) {
          finalStatus = "EMPTY";
        }

        if (!isCurrentlyEmpty && (peopleCount > 0 || hasMotion)) {
          finalStatus = "ACTIVE";
        }

        return {
          ...item,
          roomId: item.roomId,
          room: item.roomId,
          students: peopleCount,
          peopleCount,
          temp: temperature,
          temperature,
          humidity,
          roomStatus: finalStatus,
          status: finalStatus,
        };
      })
      .sort((a, b) => a.roomId.localeCompare(b.roomId));

    const hourly = latestSensors.slice(0, 10).map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      occupancy: item.peopleCount || 0,
      temp: item.temperature || 0,
    }));

    const weeklyMap: Record<
      string,
      {
        totalPeople: number;
        totalRooms: number;
        count: number;
      }
    > = {};

    latestSensors.forEach((item) => {
      const day = new Date(item.timestamp).toLocaleDateString("id-ID", {
        weekday: "short",
      });

      if (!weeklyMap[day]) {
        weeklyMap[day] = {
          totalPeople: 0,
          totalRooms: 0,
          count: 0,
        };
      }

      weeklyMap[day].totalPeople += item.peopleCount || 0;
      weeklyMap[day].totalRooms += 1;
      weeklyMap[day].count += 1;
    });

    const weekly = Object.entries(weeklyMap).map(([day, value]) => ({
      day,
      rooms: value.totalRooms,
      avg: Math.round(value.totalPeople / Math.max(1, value.count)),
    }));

    return NextResponse.json({
      sensors: latestSensors,
      hourly,
      weekly,
    });
  } catch (error: unknown) {
    console.error(error);

    const cosmosError = error as { code?: number | string };
    if (cosmosError?.code === 404 || cosmosError?.code === "NotFound") {
      console.warn(
        "[/api/analytics] Sensor container not found, returning empty analytics",
        error
      );
      return NextResponse.json(
        {
          sensors: [],
          hourly: [],
          weekly: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed fetch analytics",
      },
      {
        status: 500,
      }
    );
  }
}
