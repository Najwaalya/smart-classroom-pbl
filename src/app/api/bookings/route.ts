import { NextResponse } from "next/server";
import { bookingContainer } from "@/lib/cosmos";

// =====================================
// GET BOOKINGS
// =====================================
export async function GET() {

  try {

    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.createdAt DESC",
    };

    const { resources } = await bookingContainer.items
      .query(querySpec)
      .fetchAll();

    return NextResponse.json(resources);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// =====================================
// CREATE BOOKING
// =====================================
export async function POST(req: Request) {

  try {

    const body = await req.json();

    const booking = {
      id: `booking-${Date.now()}`,
      roomId: body.roomId,
      userId: body.userId,
      userClass: body.userClass,
      bookingDate: body.bookingDate,
      day: body.day,
      sessionStart: body.sessionStart,
      sessionEnd: body.sessionEnd,
      purpose: body.purpose,
      status: "booked",
      createdAt: new Date().toISOString(),
    };

    const { resource } =
      await bookingContainer.items.create(booking);

    return NextResponse.json(resource);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}