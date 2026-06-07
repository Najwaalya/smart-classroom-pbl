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

    const result = await updateSchedule(id, body);
    
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
