import { NextResponse } from "next/server";
import { getAllSchedules, createSchedule, deleteSchedule } from "@/lib/services/schedule.service";

export async function GET() {
  try {
    console.log("[API] GET /api/schedules called");
    const schedules = await getAllSchedules();
    console.log(`[API] Returning ${schedules.length} schedules`);
    return NextResponse.json({ success: true, schedules });
  } catch (error) {
    console.error("[API] GET /api/schedules error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Support both new payload structure and old format
    const roomId = body.roomId ?? body.room;
    const day = body.day;
    const sessionStart = body.startSlot !== undefined ? Number(body.startSlot) : Number(body.sessionStart ?? 0);
    const sessionEnd = body.endSlot !== undefined ? Number(body.endSlot) : Number(body.sessionEnd ?? sessionStart);
    const className = body.className ?? body.class ?? "";

    const mappedSchedule = {
      roomId,
      day,
      sessionStart,
      sessionEnd,
      class: className,
      semester: body.semester || "Genap",
      academicYear: body.academicYear || "2025/2026",
      subject: body.subject || "",
      lecturer: body.lecturer || ""
    };

    const result = await createSchedule(mappedSchedule);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/schedules error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("id");

    console.log("[API DELETE] ========================================");
    console.log("[API DELETE] Received delete request");
    console.log("[API DELETE] Schedule ID:", scheduleId);
    console.log("[API DELETE] URL:", request.url);

    if (!scheduleId) {
      console.error("[API DELETE] No schedule ID provided");
      return NextResponse.json(
        { success: false, message: "Schedule ID is required" },
        { status: 400 }
      );
    }

    console.log("[API DELETE] Calling deleteSchedule service...");
    const result = await deleteSchedule(scheduleId);
    
    console.log("[API DELETE] Service result:", JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error("[API DELETE] Delete failed:", result.message);
      return NextResponse.json(result, { status: 400 });
    }

    console.log("[API DELETE] Delete successful!");
    console.log("[API DELETE] ========================================");
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API DELETE] ========================================");
    console.error("[API DELETE] Unexpected error:", error);
    console.error("[API DELETE] Error message:", error.message);
    console.error("[API DELETE] Error stack:", error.stack);
    console.error("[API DELETE] ========================================");
    return NextResponse.json(
      { success: false, message: `Failed to delete schedule: ${error.message}` },
      { status: 500 }
    );
  }
}
