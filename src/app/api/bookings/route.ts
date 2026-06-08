import { NextResponse } from "next/server";
import { 
  getAllBookings, 
  createBooking, 
  updateBookingStatus, 
  cancelBooking 
} from "@/lib/services/booking.service";
import { sensorContainer } from "@/lib/cosmos";

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

/**
 * Check if room is occupied based on sensor data
 */
async function isRoomOccupied(roomId: string): Promise<boolean> {
  try {
    const querySpec = {
      query: "SELECT TOP 1 * FROM c WHERE c.roomId = @roomId ORDER BY c.timestamp DESC",
      parameters: [{ name: "@roomId", value: roomId }],
    };

    const { resources: sensors } = await sensorContainer.items
      .query<CosmosSensor>(querySpec)
      .fetchAll();

    if (sensors.length === 0) {
      console.log(`[isRoomOccupied] No sensor data for ${roomId} — treating as empty`);
      return false;
    }

    const latestSensor = sensors[0];
    console.log(`[isRoomOccupied] Latest sensor for ${roomId}:`, JSON.stringify(latestSensor));

    // Room is considered occupied only if people count > 0
    // motionDuration alone is NOT reliable (0 would pass < 300000)
    const hasPeople = (latestSensor.peopleCount ?? 0) > 0;

    console.log(`[isRoomOccupied] ${roomId} — hasPeople: ${hasPeople}`);
    return hasPeople;
  } catch (error) {
    console.error("[isRoomOccupied] Error:", error);
    // Default: allow booking when sensor check fails
    return false;
  }
}

export async function GET() {
  try {
    const bookings = await getAllBookings();
    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[POST /api/bookings] Request body:", JSON.stringify(body, null, 2));

    // Validasi field wajib
    if (!body.roomId || !body.date || !body.startTime || !body.endTime) {
      console.error("[POST /api/bookings] Missing required fields", body);
      return NextResponse.json(
        { success: false, message: "Field wajib (roomId, date, startTime, endTime) tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Check if room is currently occupied
    const isOccupied = await isRoomOccupied(body.roomId);
    console.log(`[POST /api/bookings] Room ${body.roomId} occupied: ${isOccupied}`);

    if (isOccupied) {
      return NextResponse.json(
        {
          success: false,
          message: "Ruangan terdeteksi ada orang. Booking tidak bisa dilakukan saat ruangan sedang digunakan.",
        },
        { status: 400 }
      );
    }

    const result = await createBooking(body);
    console.log("[POST /api/bookings] createBooking result:", JSON.stringify(result));

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/bookings] ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create booking: " + String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, message: "Booking ID and status are required" },
        { status: 400 }
      );
    }

    if (!['booked', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Allowed: booked, cancelled, completed" },
        { status: 400 }
      );
    }

    const result = await updateBookingStatus(bookingId, status);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const result = await cancelBooking(bookingId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
