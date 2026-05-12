import { NextResponse } from "next/server";

import {
  sensorContainer,
} from "@/lib/cosmos";

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

    const { resources } =
      await sensorContainer.items
        .query<SensorData>(`
          SELECT * FROM c
          ORDER BY c.timestamp DESC
        `)
        .fetchAll();

    // =====================================
    // HOURLY
    // =====================================

    const hourly = resources
      .slice(0, 10)
      .map((item) => ({

        time:
          new Date(item.timestamp)
            .toLocaleTimeString(
              "id-ID",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),

        occupancy:
          item.peopleCount || 0,

        temp:
          item.temperature || 0,
      }));

    // =====================================
    // WEEKLY REAL DATA
    // =====================================

    const weeklyMap: Record<
      string,
      {
        totalPeople: number;
        totalRooms: number;
        count: number;
      }
    > = {};

    resources.forEach((item) => {

      const day =
        new Date(item.timestamp)
          .toLocaleDateString(
            "id-ID",
            {
              weekday: "short",
            }
          );

      if (!weeklyMap[day]) {

        weeklyMap[day] = {
          totalPeople: 0,
          totalRooms: 0,
          count: 0,
        };
      }

      weeklyMap[day].totalPeople +=
        item.peopleCount || 0;

      weeklyMap[day].totalRooms += 1;

      weeklyMap[day].count += 1;
    });

    const weekly = Object.entries(weeklyMap)
      .map(([day, value]) => ({

        day,

        rooms:
          value.totalRooms,

        avg:
          Math.round(
            value.totalPeople /
            value.count
          ),
      }));

    return NextResponse.json({
      sensors: resources,
      hourly,
      weekly,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed fetch analytics",
      },
      {
        status: 500,
      }
    );
  }
}