import { NextResponse } from "next/server";
import { getRoomStatusLogs } from "@/lib/services/room.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const logs = await getRoomStatusLogs(roomId || undefined, limit);

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
