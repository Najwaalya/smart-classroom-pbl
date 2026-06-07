import { bookingContainer } from "@/lib/cosmos";

export interface Booking {
  id: string;
  roomId: string;
  // Fields sent by BookingForm / booking page
  bookedById: string;    // userId dari frontend
  bookedBy: string;      // nama user
  userId?: string;       // alias opsional
  userName?: string;     // alias opsional
  userClass?: string;
  day: string;
  date: string;          // ISO date string (YYYY-MM-DD)
  startTime: string;     // "07:00"
  endTime: string;       // "08:40"
  // Opsional: nomor sesi (jika ada)
  sessionStart?: number;
  sessionEnd?: number;
  purpose: string;
  status: "booked" | "cancelled" | "completed";
  createdAt: string;
  updatedAt?: string;
}

// ── Tipe untuk parameter query CosmosDB ──────────────────────────────
interface QueryParameter {
  name: string;
  value: string | number | boolean;
}

/**
 * Get all bookings — cross-partition safe
 */
export async function getAllBookings(): Promise<Booking[]> {
  try {
    const { resources: bookings } = await bookingContainer.items
      .query<Booking>(
        "SELECT * FROM c ORDER BY c.createdAt DESC",
        { maxItemCount: -1 }
      )
      .fetchAll();

    console.log("[getAllBookings] Fetched:", bookings.length, "bookings");
    return bookings;
  } catch (error) {
    console.error("[getAllBookings] Error:", error);
    return [];
  }
}

/**
 * Get bookings by user
 */
export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  try {
    const querySpec = {
      query:
        "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC, c.sessionStart DESC",
      parameters: [{ name: "@userId", value: userId }],
    };

    const { resources: bookings } = await bookingContainer.items
      .query<Booking>(querySpec)
      .fetchAll();

    return bookings;
  } catch (error) {
    console.error("Get bookings by user error:", error);
    return [];
  }
}

/**
 * Get bookings by room
 */
export async function getBookingsByRoom(roomId: string): Promise<Booking[]> {
  try {
    const querySpec = {
      query:
        "SELECT * FROM c WHERE c.roomId = @roomId ORDER BY c.date DESC, c.sessionStart DESC",
      parameters: [{ name: "@roomId", value: roomId }],
    };

    const { resources: bookings } = await bookingContainer.items
      .query<Booking>(querySpec)
      .fetchAll();

    return bookings;
  } catch (error) {
    console.error("Get bookings by room error:", error);
    return [];
  }
}

/**
 * Get bookings by date
 */
export async function getBookingsByDate(date: string): Promise<Booking[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.date = @date ORDER BY c.sessionStart",
      parameters: [{ name: "@date", value: date }],
    };

    const { resources: bookings } = await bookingContainer.items
      .query<Booking>(querySpec)
      .fetchAll();

    return bookings;
  } catch (error) {
    console.error("Get bookings by date error:", error);
    return [];
  }
}

/**
 * Create new booking
 */
export async function createBooking(
  booking: Omit<Booking, "id" | "createdAt" | "updatedAt" | "status">
): Promise<{ success: boolean; booking?: Booking; message?: string }> {
  console.log("[createBooking] START — payload received:", JSON.stringify(booking, null, 2));

  try {
    // Validasi field wajib
    if (!booking.roomId || !booking.date || !booking.startTime || !booking.endTime) {
      console.error("[createBooking] VALIDATION FAILED — missing required fields", {
        roomId: booking.roomId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
      });
      return { success: false, message: "Data booking tidak lengkap (roomId/date/startTime/endTime wajib diisi)" };
    }

    console.log("[createBooking] Checking conflicts for:", booking.roomId, booking.date, booking.startTime, "–", booking.endTime);
    const conflicts = await checkBookingConflict(
      booking.roomId,
      booking.date,
      booking.startTime,
      booking.endTime
    );
    console.log("[createBooking] Conflicts found:", conflicts.length);

    if (conflicts.length > 0) {
      return {
        success: false,
        message: "Ruangan sudah dibooking pada waktu tersebut",
      };
    }

    const newBooking: Booking = {
      id: `booking-${booking.roomId}-${booking.date}-${Date.now()}`,
      ...booking,
      // pastikan bookedById & bookedBy terisi
      bookedById: booking.bookedById ?? booking.userId ?? "unknown",
      bookedBy: booking.bookedBy ?? booking.userName ?? "Unknown User",
      status: "booked",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("[createBooking] Inserting to Cosmos DB:", JSON.stringify(newBooking, null, 2));
    const { resource } = await bookingContainer.items.create(newBooking);
    console.log("[createBooking] SUCCESS — inserted with id:", resource?.id);

    return { success: true, booking: resource };
  } catch (error) {
    console.error("[createBooking] ERROR:", error);
    return { success: false, message: "Gagal membuat booking: " + String(error) };
  }
}

/**
 * Check booking conflict
 */
export async function checkBookingConflict(
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<Booking[]> {
  try {
    let query = `
      SELECT * FROM c 
      WHERE c.roomId = @roomId 
      AND c.date = @date 
      AND c.status IN ('booked', 'completed')
      AND (
        (c.startTime < @endTime AND c.endTime > @startTime)
      )
    `;

    const parameters: QueryParameter[] = [
      { name: "@roomId",    value: roomId },
      { name: "@date",      value: date },
      { name: "@startTime", value: startTime },
      { name: "@endTime",   value: endTime },
    ];

    if (excludeBookingId) {
      query += " AND c.id != @excludeBookingId";
      parameters.push({ name: "@excludeBookingId", value: excludeBookingId });
    }

    const { resources: bookings } = await bookingContainer.items
      .query<Booking>({ query, parameters })
      .fetchAll();

    return bookings;
  } catch (error) {
    console.error("Check booking conflict error:", error);
    return [];
  }
}

/**
 * Update booking status — partition-key agnostic
 * Fetch dulu lewat query untuk dapat roomId & id yang benar,
 * lalu replace dengan partition key yang sesuai.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: Booking["status"]
): Promise<{ success: boolean; message?: string }> {
  try {
    // Query by id — works regardless of partition key (/id or /roomId)
    const { resources } = await bookingContainer.items
      .query<Booking>({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: bookingId }],
      })
      .fetchAll();

    if (!resources || resources.length === 0) {
      console.error("[updateBookingStatus] Booking not found:", bookingId);
      return { success: false, message: "Booking tidak ditemukan" };
    }

    const booking = resources[0];
    const partitionKey = booking.roomId ?? booking.id;

    const updatedBooking: Booking = {
      ...booking,
      status,
      updatedAt: new Date().toISOString(),
    };

    await bookingContainer.item(booking.id, partitionKey).replace(updatedBooking);
    console.log("[updateBookingStatus] Updated booking:", bookingId, "→", status);

    return { success: true };
  } catch (error) {
    console.error("[updateBookingStatus] ERROR:", error);
    return { success: false, message: "Gagal mengupdate status booking" };
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(
  bookingId: string
): Promise<{ success: boolean; message?: string }> {
  return updateBookingStatus(bookingId, "cancelled");
}

/**
 * Delete booking — partition-key agnostic
 */
export async function deleteBooking(
  bookingId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // Query dulu untuk dapat dokumen asli (termasuk roomId sebagai potential partition key)
    const { resources } = await bookingContainer.items
      .query<Booking>({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: bookingId }],
      })
      .fetchAll();

    if (!resources || resources.length === 0) {
      console.error("[deleteBooking] Booking not found:", bookingId);
      return { success: false, message: "Booking tidak ditemukan" };
    }

    const booking = resources[0];
    const partitionKey = booking.roomId ?? booking.id;

    await bookingContainer.item(booking.id, partitionKey).delete();
    console.log("[deleteBooking] Deleted booking:", bookingId);
    return { success: true };
  } catch (error) {
    console.error("[deleteBooking] ERROR:", error);
    return { success: false, message: "Gagal menghapus booking" };
  }
}