import { bookingContainer } from "@/lib/cosmos";

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userNim: string;
  userClass: string;
  day: string;
  date: string;
  bookingDate: string;
  sessionStart: number;
  sessionEnd: number;
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
 * Get all bookings
 */
export async function getAllBookings(): Promise<Booking[]> {
  try {
    const { resources: bookings } = await bookingContainer.items
      .query<Booking>("SELECT * FROM c ORDER BY c.date DESC, c.sessionStart DESC")
      .fetchAll();

    return bookings;
  } catch (error) {
    console.error("Get all bookings error:", error);
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
  try {
    const conflicts = await checkBookingConflict(
      booking.roomId,
      booking.date,
      booking.sessionStart,
      booking.sessionEnd
    );

    if (conflicts.length > 0) {
      return {
        success: false,
        message: "Ruangan sudah dibooking pada waktu tersebut",
      };
    }

    const newBooking: Booking = {
      id: `${booking.roomId}-${booking.date}-${booking.sessionStart}-${Date.now()}`,
      ...booking,
      status: "booked",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await bookingContainer.items.create(newBooking);

    return { success: true, booking: resource };
  } catch (error) {
    console.error("Create booking error:", error);
    return { success: false, message: "Gagal membuat booking" };
  }
}

/**
 * Check booking conflict
 */
export async function checkBookingConflict(
  roomId: string,
  date: string,
  sessionStart: number,
  sessionEnd: number,
  excludeBookingId?: string
): Promise<Booking[]> {
  try {
    let query = `
      SELECT * FROM c 
      WHERE c.roomId = @roomId 
      AND c.date = @date 
      AND c.status IN ('booked', 'completed')
      AND (
        (c.sessionStart < @sessionEnd AND c.sessionEnd > @sessionStart)
      )
    `;

    const parameters: QueryParameter[] = [
      { name: "@roomId",       value: roomId },
      { name: "@date",         value: date },
      { name: "@sessionStart", value: sessionStart },
      { name: "@sessionEnd",   value: sessionEnd },
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
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: Booking["status"]
): Promise<{ success: boolean; message?: string }> {
  try {
    const { resource: booking } = await bookingContainer
      .item(bookingId, bookingId)
      .read<Booking>();

    if (!booking) {
      return { success: false, message: "Booking tidak ditemukan" };
    }

    const updatedBooking: Booking = {
      ...booking,
      status,
      updatedAt: new Date().toISOString(),
    };

    await bookingContainer.item(bookingId, bookingId).replace(updatedBooking);

    return { success: true };
  } catch (error) {
    console.error("Update booking status error:", error);
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
 * Delete booking
 */
export async function deleteBooking(
  bookingId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await bookingContainer.item(bookingId, bookingId).delete();
    return { success: true };
  } catch (error) {
    console.error("Delete booking error:", error);
    return { success: false, message: "Gagal menghapus booking" };
  }
}