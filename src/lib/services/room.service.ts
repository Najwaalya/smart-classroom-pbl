import { roomContainer, sensorContainer, statusLogContainer } from "@/lib/cosmos";

export interface Room {
  id: string;
  name: string;
  wing?: string;
  capacity: number;
  status: "active" | "uncertain" | "empty";
  students: number;
  temp: number;
  humidity: number;
  lastUpdate?: string;
}

export interface SensorReading {
  id: string;
  roomId: string;
  temperature: number;
  humidity: number;
  pirStatus: boolean;
  irCount: number;
  timestamp: string;
}

export interface RoomStatusLog {
  id: string;
  roomId: string;
  status: string;
  students: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

/**
 * Get all rooms with latest sensor data
 */
export async function getAllRooms(): Promise<Room[]> {
  try {
    // Get all rooms
    const { resources: rooms } = await roomContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    // Get latest sensor reading for each room
    const roomsWithData = await Promise.all(
      rooms.map(async (room) => {
        const latestSensor = await getLatestSensorReading(room.id);
        
        return {
          id: room.id,
          name: room.name || room.id,
          wing: room.wing,
          capacity: room.capacity || 40,
          status: room.status || "empty",
          students: latestSensor?.irCount || 0,
          temp: latestSensor?.temperature || 25,
          humidity: latestSensor?.humidity || 60,
          lastUpdate: latestSensor?.timestamp || new Date().toISOString(),
        };
      })
    );

    return roomsWithData;
  } catch (error) {
    console.error("Get all rooms error:", error);
    return [];
  }
}

/**
 * Get room by ID with latest sensor data
 */
export async function getRoomById(roomId: string): Promise<Room | null> {
  try {
    const { resource: room } = await roomContainer.item(roomId, roomId).read();

    if (!room) return null;

    const latestSensor = await getLatestSensorReading(roomId);

    return {
      id: room.id,
      name: room.name || room.id,
      wing: room.wing,
      capacity: room.capacity || 40,
      status: room.status || "empty",
      students: latestSensor?.irCount || 0,
      temp: latestSensor?.temperature || 25,
      humidity: latestSensor?.humidity || 60,
      lastUpdate: latestSensor?.timestamp || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Get room by ID error:", error);
    return null;
  }
}

/**
 * Get latest sensor reading for a room
 */
export async function getLatestSensorReading(
  roomId: string
): Promise<SensorReading | null> {
  try {
    const querySpec = {
      query:
        "SELECT TOP 1 * FROM c WHERE c.roomId = @roomId ORDER BY c.timestamp DESC",
      parameters: [{ name: "@roomId", value: roomId }],
    };

    const { resources: readings } = await sensorContainer.items
      .query<SensorReading>(querySpec)
      .fetchAll();

    return readings.length > 0 ? readings[0] : null;
  } catch (error) {
    console.error("Get latest sensor reading error:", error);
    return null;
  }
}

/**
 * Get sensor readings for a room (with time range)
 */
export async function getSensorReadings(
  roomId: string,
  startTime?: string,
  endTime?: string,
  limit: number = 100
): Promise<SensorReading[]> {
  try {
    let query = "SELECT * FROM c WHERE c.roomId = @roomId";
    const parameters: any[] = [{ name: "@roomId", value: roomId }];

    if (startTime) {
      query += " AND c.timestamp >= @startTime";
      parameters.push({ name: "@startTime", value: startTime });
    }

    if (endTime) {
      query += " AND c.timestamp <= @endTime";
      parameters.push({ name: "@endTime", value: endTime });
    }

    query += ` ORDER BY c.timestamp DESC OFFSET 0 LIMIT ${limit}`;

    const querySpec = { query, parameters };

    const { resources: readings } = await sensorContainer.items
      .query<SensorReading>(querySpec)
      .fetchAll();

    return readings;
  } catch (error) {
    console.error("Get sensor readings error:", error);
    return [];
  }
}

/**
 * Get room status logs
 */
export async function getRoomStatusLogs(
  roomId?: string,
  limit: number = 50
): Promise<RoomStatusLog[]> {
  try {
    let query = "SELECT * FROM c";
    const parameters: any[] = [];

    if (roomId) {
      query += " WHERE c.roomId = @roomId";
      parameters.push({ name: "@roomId", value: roomId });
    }

    query += ` ORDER BY c.timestamp DESC OFFSET 0 LIMIT ${limit}`;

    const querySpec = { query, parameters };

    const { resources: logs } = await statusLogContainer.items
      .query<RoomStatusLog>(querySpec)
      .fetchAll();

    return logs;
  } catch (error) {
    console.error("Get room status logs error:", error);
    return [];
  }
}

/**
 * Update room status
 */
export async function updateRoomStatus(
  roomId: string,
  status: "active" | "uncertain" | "empty"
): Promise<boolean> {
  try {
    const { resource: room } = await roomContainer.item(roomId, roomId).read();

    if (!room) return false;

    room.status = status;
    room.lastUpdate = new Date().toISOString();

    await roomContainer.item(roomId, roomId).replace(room);

    // Log status change
    await statusLogContainer.items.create({
      id: `${roomId}-${Date.now()}`,
      roomId,
      status,
      students: 0,
      temperature: 0,
      humidity: 0,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Update room status error:", error);
    return false;
  }
}
