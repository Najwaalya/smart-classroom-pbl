import { NextResponse } from "next/server";
import { bookingContainer } from "@/lib/cosmos";

// =====================================================
// PATCH /api/bookings/[id]
// Update status booking (cancel, complete, reschedule)
// =====================================================

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "ID booking diperlukan" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Ambil dokumen booking lama
    const { resource: existing } = await bookingContainer.item(id, id).read();
    if (!existing) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan" },
        { status: 404 }
      );
    }

    // Merge update (hanya field yang dikirim)
    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await bookingContainer
      .item(id, id)
      .replace(updated);

    return NextResponse.json(resource);
  } catch (error) {
    console.error("[PATCH /api/bookings/[id]] Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui booking" },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE /api/bookings/[id]
// Hapus booking dari Cosmos DB
// =====================================================

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "ID booking diperlukan" },
      { status: 400 }
    );
  }

  try {
    await bookingContainer.item(id, id).delete();
    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    console.error("[DELETE /api/bookings/[id]] Error:", error);
    const cosmosError = error as { code?: number };
    if (cosmosError?.code === 404) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menghapus booking" },
      { status: 500 }
    );
  }
}
