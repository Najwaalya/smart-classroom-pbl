import { bookingContainer } from "@/lib/cosmos";

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userNim: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  createdAt: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

/**
 * Get all bookings
 */
export async function getAllBookings(): Promise<Booking[]> {
  try {
    const { resources: bookings } = await bookingContainer.items
      .query<Booking>("SELECT * FROM c ORDER BY c.date DESC, c.startTime DESC")
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
        "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC, c.startTime DESC",
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
        "SELECT * FROM c WHERE c.roomId = @roomId ORDER BY c.date DESC, c.startTime DESC",
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
      query: "SELECT * FROM c WHERE c.date = @date ORDER BY c.startTime",
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
    // Check for conflicts
    const conflicts = await checkBookingConflict(
      booking.roomId,
      booking.date,
      booking.startTime,
      booking.endTime
    );

    if (conflicts.length > 0) {
      return {
        success: false,
        message: "Ruangan sudah dibooking pada waktu tersebut",
      };
    }

    const newBooking: Booking = {
      id: `${booking.roomId}-${booking.date}-${booking.startTime}-${Date.now()}`,
      ...booking,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await bookingContainer.items.create(newBooking);

    return {
      success: true,
      booking: resource,
    };
  } catch (error) {
    console.error("Create booking error:", error);
    return {
      success: false,
      message: "Gagal membuat booking",
    };
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
      AND c.status IN ('pending', 'approved')
      AND (
        (c.startTime < @endTime AND c.endTime > @startTime)
      )
    `;

    const parameters: any[] = [
      { name: "@roomId", value: roomId },
      { name: "@date", value: date },
      { name: "@startTime", value: startTime },
      { name: "@endTime", value: endTime },
    ];

    if (excludeBookingId) {
      query += " AND c.id != @excludeBookingId";
      parameters.push({ name: "@excludeBookingId", value: excludeBookingId });
    }

    const querySpec = { query, parameters };

    const { resources: bookings } = await bookingContainer.items
      .query<Booking>(querySpec)
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
  status: Booking["status"],
  approvedBy?: string,
  rejectedReason?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { resource: booking } = await bookingContainer
      .item(bookingId, bookingId)
      .read<Booking>();

    if (!booking) {
      return { success: false, message: "Booking tidak ditemukan" };
    }

    const updates: Partial<Booking> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === "approved" && approvedBy) {
      updates.approvedBy = approvedBy;
      updates.approvedAt = new Date().toISOString();
    }

    if (status === "rejected" && rejectedReason) {
      updates.rejectedReason = rejectedReason;
    }

    const updatedBooking = { ...booking, ...updates };

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
