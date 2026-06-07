import { scheduleContainer, sessionContainer } from "@/lib/cosmos";

export interface Session {
  id: string;
  sessionNumber: number;
  startTime: string;
  endTime: string;
  label: string;
  durationMinutes: number;
  isBreak: boolean;
}

export interface Schedule {
  id: string;
  roomId: string;
  day: string;
  sessionStart: number;
  sessionEnd: number;
  subject?: string;
  lecturer?: string;
  class?: string;
  semester: string;
  academicYear: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassSession {
  id: string;
  scheduleId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  actualStartTime?: string;
  actualEndTime?: string;
  attendanceCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all schedules
 */
export async function getAllSchedules(): Promise<Schedule[]> {
  try {
    console.log("[getAllSchedules] Fetching schedules from Cosmos DB...");
    
    const { resources: schedules } = await scheduleContainer.items
      .query<Schedule>("SELECT * FROM c")
      .fetchAll();

    console.log(`[getAllSchedules] Found ${schedules.length} schedules`);
    
    if (schedules.length > 0) {
      console.log("[getAllSchedules] Sample:", JSON.stringify(schedules[0]));
    }

    return schedules;
  } catch (error) {
    console.error("[getAllSchedules] Error:", error);
    return [];
  }
}

/**
 * Get schedules by room
 */
export async function getSchedulesByRoom(roomId: string): Promise<Schedule[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.roomId = @roomId ORDER BY c.day, c.sessionStart",
      parameters: [{ name: "@roomId", value: roomId }],
    };

    const { resources: schedules } = await scheduleContainer.items
      .query<Schedule>(querySpec)
      .fetchAll();

    return schedules;
  } catch (error) {
    console.error("Get schedules by room error:", error);
    return [];
  }
}

/**
 * Get schedules by day
 */
export async function getSchedulesByDay(day: string): Promise<Schedule[]> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.day = @day ORDER BY c.sessionStart",
      parameters: [{ name: "@day", value: day }],
    };

    const { resources: schedules } = await scheduleContainer.items
      .query<Schedule>(querySpec)
      .fetchAll();

    return schedules;
  } catch (error) {
    console.error("Get schedules by day error:", error);
    return [];
  }
}

/**
 * Create new schedule
 */
export async function createSchedule(
  schedule: Omit<Schedule, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; schedules?: Schedule[]; message?: string }> {
  try {
    const created: Schedule[] = [];

    // Ensure start and end are numbers and define loop bounds
    const start = Number(schedule.sessionStart ?? 0);
    const end = Number(schedule.sessionEnd ?? start);

    if (isNaN(start) || isNaN(end) || start > end) {
      // Fallback: create a single entry using provided value
      const newSchedule: Schedule = {
        id: `${schedule.roomId}-${schedule.day}-${schedule.sessionStart}-${Date.now()}`,
        ...schedule,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const { resource } = await scheduleContainer.items.create(newSchedule);
      return { success: true, schedules: [resource] };
    }

    // Loop from start to end inclusive and create one document per hour slot
    for (let hour = start; hour <= end; hour++) {
      const slotSchedule: Schedule = {
        id: `${schedule.roomId}-${schedule.day}-${hour}-${Date.now()}-${hour}`,
        roomId: schedule.roomId,
        day: schedule.day,
        sessionStart: hour,
        sessionEnd: hour,
        subject: schedule.subject,
        lecturer: schedule.lecturer,
        class: schedule.class,
        semester: schedule.semester,
        academicYear: schedule.academicYear,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { resource } = await scheduleContainer.items.create(slotSchedule);
      created.push(resource);
    }

    return { success: true, schedules: created };
  } catch (error) {
    console.error("Create schedule error:", error);
    return {
      success: false,
      message: "Gagal membuat jadwal",
    };
  }
}

/**
 * Update schedule
 */
export async function updateSchedule(
  scheduleId: string,
  updates: Partial<Schedule>
): Promise<{ success: boolean; message?: string }> {
  try {
    // First, query to find the exact item to get its properties for partition key
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: scheduleId }],
    };

    const { resources: schedules } = await scheduleContainer.items
      .query<Schedule>(querySpec)
      .fetchAll();

    if (!schedules || schedules.length === 0) {
      return { success: false, message: "Jadwal tidak ditemukan" };
    }

    const schedule = schedules[0];

    const updatedSchedule: Schedule = {
      ...schedule,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as Schedule;

    // If partition key (roomId) is changing, Cosmos replace will fail because the
    // partition key value in the document must match the request partition key.
    // To handle room moves, delete the old item and create a new one under the
    // new partition key value.
    if (updates.roomId && updates.roomId !== schedule.roomId) {
      console.log("[updateSchedule] Partition key (roomId) changed. Recreating item under new partition key.");
      // delete old
      await scheduleContainer.item(schedule.id, schedule.roomId).delete();
      // create new under new partition key
      await scheduleContainer.items.create(updatedSchedule);
    } else {
      // same partition key — safe to replace
      await scheduleContainer.item(schedule.id, schedule.roomId).replace(updatedSchedule);
    }

    return { success: true };
  } catch (error) {
    console.error("Update schedule error:", error);
    return { success: false, message: "Gagal mengupdate jadwal" };
  }
}

/**
 * Delete schedule
 */
export async function deleteSchedule(
  scheduleId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`[deleteSchedule] ========================================`);
    console.log(`[deleteSchedule] Attempting to delete schedule: ${scheduleId}`);
    
    // First, query to find the exact item to get its properties for partition key
    console.log(`[deleteSchedule] Querying for item...`);
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: scheduleId }],
    };

    const { resources: schedules } = await scheduleContainer.items
      .query<Schedule>(querySpec)
      .fetchAll();

    if (!schedules || schedules.length === 0) {
      console.error(`[deleteSchedule] Schedule not found in database: ${scheduleId}`);
      return { success: false, message: "Jadwal tidak ditemukan di database" };
    }

    const schedule = schedules[0];
    console.log(`[deleteSchedule] Found schedule:`, {
      id: schedule.id,
      roomId: schedule.roomId,
      day: schedule.day,
    });

    console.log(`[deleteSchedule] Deleting with partition key: ${schedule.roomId}`);
    await scheduleContainer.item(schedule.id, schedule.roomId).delete();
    console.log(`[deleteSchedule] Successfully deleted schedule`);

    return { success: true };
  } catch (error: any) {
    console.error(`[deleteSchedule] FATAL ERROR:`, error.message);
    
    let errorMessage = "Gagal menghapus jadwal";
    
    if (error.code === 404 || error.statusCode === 404) {
      errorMessage = "Jadwal tidak ditemukan";
    } else if (error.message) {
      errorMessage = `Gagal menghapus: ${error.message.split('\n')[0]}`;
    }
    
    return { success: false, message: errorMessage };
  }
}

/**
 * Get class sessions
 */
export async function getClassSessions(
  roomId?: string,
  date?: string
): Promise<ClassSession[]> {
  try {
    let query = "SELECT * FROM c";
    const parameters: any[] = [];

    const conditions: string[] = [];

    if (roomId) {
      conditions.push("c.roomId = @roomId");
      parameters.push({ name: "@roomId", value: roomId });
    }

    if (date) {
      conditions.push("c.date = @date");
      parameters.push({ name: "@date", value: date });
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY c.date DESC, c.startTime DESC";

    const querySpec = { query, parameters };

    const { resources: sessions } = await sessionContainer.items
      .query<ClassSession>(querySpec)
      .fetchAll();

    return sessions;
  } catch (error) {
    console.error("Get class sessions error:", error);
    return [];
  }
}

/**
 * Create class session
 */
export async function createClassSession(
  session: Omit<ClassSession, "id" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; session?: ClassSession; message?: string }> {
  try {
    const newSession: ClassSession = {
      id: `${session.scheduleId}-${session.date}-${Date.now()}`,
      ...session,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await sessionContainer.items.create(newSession);

    return {
      success: true,
      session: resource,
    };
  } catch (error) {
    console.error("Create class session error:", error);
    return {
      success: false,
      message: "Gagal membuat sesi kelas",
    };
  }
}

/**
 * Update class session
 */
export async function updateClassSession(
  sessionId: string,
  updates: Partial<ClassSession>
): Promise<{ success: boolean; message?: string }> {
  try {
    const { resource: session } = await sessionContainer
      .item(sessionId, sessionId)
      .read<ClassSession>();

    if (!session) {
      return { success: false, message: "Sesi tidak ditemukan" };
    }

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await sessionContainer.item(sessionId, sessionId).replace(updatedSession);

    return { success: true };
  } catch (error) {
    console.error("Update class session error:", error);
    return { success: false, message: "Gagal mengupdate sesi" };
  }
}
