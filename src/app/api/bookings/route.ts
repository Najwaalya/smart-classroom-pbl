import { NextResponse } from "next/server";
import { 
  getAllBookings, 
  createBooking, 
  updateBookingStatus, 
  cancelBooking 
} from "@/lib/services/booking.service";

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

    const result = await createBooking(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, status, approvedBy, rejectedReason } = body;

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, message: "Booking ID and status are required" },
        { status: 400 }
      );
    }

    const result = await updateBookingStatus(
      bookingId,
      status,
      approvedBy,
      rejectedReason
    );

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
