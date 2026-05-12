import { NextResponse } from "next/server";
import {
  bookingContainer,
  sensorContainer,
  roomContainer,
} from "@/lib/cosmos";

export async function GET() {

  try {

    const bookings = await bookingContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    const sensors = await sensorContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    const rooms = await roomContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    const analytics = {
      totalBookings:
        bookings.resources.length,

      totalRooms:
        rooms.resources.length,

      activeRooms:
        sensors.resources.filter(
          (s) => s.roomStatus === "OCCUPIED"
        ).length,

      latestSensors:
        sensors.resources.slice(0, 10),
    };

    return NextResponse.json(analytics);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}