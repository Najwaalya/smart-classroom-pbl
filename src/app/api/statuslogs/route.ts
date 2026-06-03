import { NextResponse } from "next/server";
import { statusLogContainer } from "@/lib/cosmos";

// =====================================================
// GET /api/statuslogs
// Mengambil room_status_logs dari CosmosDB
// Query param: ?roomId=RT5-5T&limit=50
// =====================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const limit  = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    // ── Build query ────────────────────────────────
    let query  = "SELECT * FROM c";
    const params: { name: string; value: string | number }[] = [];

    if (roomId) {
      query += " WHERE c.roomId = @roomId";
      params.push({ name: "@roomId", value: roomId });
    }

    query += ` ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit`;
    params.push({ name: "@limit", value: limit });

    const { resources } = await statusLogContainer.items
      .query({ query, parameters: params })
      .fetchAll();

    // ── Normalise eventType ────────────────────────
    // Pastikan setiap dokumen punya field eventType yang bersih.
    // Kalau di CosmosDB belum ada / tidak konsisten, derive dari
    // currentStatus / previousStatus supaya mapping di frontend tepat.
    // Sertakan juga sensorReadingId jika ada.
    const normalised = resources.map((doc: Record<string, unknown>) => ({
      ...doc,
      sensorReadingId: doc.sensorReadingId || undefined,
      eventType: deriveEventType(doc),
    }));

    return NextResponse.json({
      success: true,
      data: normalised,
      total: normalised.length,
    });

  } catch (error) {
    console.error("[/api/statuslogs] Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data logs dari CosmosDB" },
      { status: 500 }
    );
  }
}

// ── Derive eventType dari field CosmosDB yang ada ────────────────────
// Urutan prioritas:
//   1. Field eventType sudah ada dan valid → pakai langsung
//   2. Derive dari currentStatus / previousStatus
//   3. Fallback ke "motion"
type EventType = "entry" | "exit" | "temperature" | "motion";

function deriveEventType(doc: Record<string, unknown>): EventType {
  const existing = ((doc.eventType as string) ?? "").toLowerCase().trim();

  // Sudah valid → langsung pakai
  if (["entry", "exit", "temperature", "motion"].includes(existing)) {
    return existing as EventType;
  }

  // Derive dari perubahan status
  const curr = ((doc.currentStatus  as string) ?? "").toUpperCase();
  const prev = ((doc.previousStatus as string) ?? "").toUpperCase();

  // Orang masuk: dari EMPTY / SCHEDULED ke OCCUPIED / ACTIVE
  if (
    ["EMPTY", "SCHEDULED"].includes(prev) &&
    ["OCCUPIED", "ACTIVE"].includes(curr)
  ) {
    return "entry";
  }

  // Orang keluar: dari OCCUPIED / ACTIVE ke EMPTY
  if (
    ["OCCUPIED", "ACTIVE"].includes(prev) &&
    ["EMPTY", "SCHEDULED"].includes(curr)
  ) {
    return "exit";
  }

  // Ada perubahan suhu / kelembapan yang dicatat
  if (
    existing.includes("temp") ||
    existing.includes("suhu") ||
    existing.includes("humidity") ||
    existing.includes("kelembapan")
  ) {
    return "temperature";
  }

  // Default → pergerakan
  return "motion";
}