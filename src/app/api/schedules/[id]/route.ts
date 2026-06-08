import { NextResponse } from "next/server";
import { scheduleContainer } from "@/lib/cosmos";
import { deleteSchedule, updateSchedule } from "@/lib/services/schedule.service";

// =====================================================
// DELETE /api/schedules/[id]
// Hapus satu jadwal dari Cosmos DB berdasarkan ID
// =====================================================

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "ID jadwal diperlukan" },
      { status: 400 }
    );
  }

  try {
    const result = await deleteSchedule(id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    console.error("[DELETE /api/schedules/[id]] Error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus jadwal" },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH /api/schedules/[id]
// Update sebagian field jadwal (misal: reschedule)
// =====================================================

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "ID jadwal diperlukan" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    const mappedUpdates: any = {};
    if (body.roomId !== undefined || body.room !== undefined) {
      mappedUpdates.roomId = body.roomId ?? body.room;
    }
    if (body.day !== undefined) {
      mappedUpdates.day = body.day;
    }
    if (body.className !== undefined || body.class !== undefined) {
      mappedUpdates.class = body.className ?? body.class;
    }
    if (body.startSlot !== undefined || body.sessionStart !== undefined) {
      mappedUpdates.sessionStart = Number(body.startSlot ?? body.sessionStart);
    }
    if (body.endSlot !== undefined || body.sessionEnd !== undefined) {
      mappedUpdates.sessionEnd = Number(body.endSlot ?? body.sessionEnd);
    }
    if (body.subject !== undefined) mappedUpdates.subject = body.subject;
    if (body.lecturer !== undefined) mappedUpdates.lecturer = body.lecturer;
    if (body.semester !== undefined) mappedUpdates.semester = body.semester;
    if (body.academicYear !== undefined) mappedUpdates.academicYear = body.academicYear;

    const result = await updateSchedule(id, mappedUpdates);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: result.message === "Jadwal tidak ditemukan" ? 404 : 400 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[PATCH /api/schedules/[id]] Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui jadwal" },
      { status: 500 }
    );
  }
}
