import { NextResponse } from "next/server";
import { getAllRooms } from "@/lib/services/room.service";

export async function GET() {
  try {
    const rooms = await getAllRooms();
    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
