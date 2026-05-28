"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type RoomStatus = "active" | "uncertain" | "empty";

export interface SensorHealth {
  overall: "ok" | "warning" | "offline";
  message: string;
}

export interface DhtSensorData {
  temperature: number;
  humidity: number;
  status: "normal" | "high" | "low" | "offline";
  health: "ok" | "warning" | "offline";
  lastUpdated: string | null;
}

export interface IrSensorData {
  peopleCount: number;
  status: "present" | "absent" | "offline";
  lastUpdated: string | null;
}

export interface PirSensorData {
  motionCount: number;
  motionDuration: number;
  activityLevel: number;
  status: "active" | "inactive" | "offline";
  lastUpdated: string | null;
}

export interface Room {
  id: string;
  status: RoomStatus;
  students: number;
  temp: number;
  humidity: number;
  pir: number[];
  wing: string | null;
  ledStatus: string;
  lastUpdated: string | null;
  sensorHealth: SensorHealth;
  dhtSensor: DhtSensorData;
  irSensor: IrSensorData;
  pirSensor: PirSensorData;
}

interface RoomContextType {
  rooms: Room[];
  getRoomById: (id: string) => Room | undefined;
  dbStatus: "online" | "offline" | "loading";
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dbStatus, setDbStatus] = useState<"online" | "offline" | "loading">("loading");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch dari Cosmos DB via /api/rooms/combined ───────────────────────────────────
  const syncFromCosmos = async () => {
    try {
      console.log("[RoomDataContext] Fetching rooms from Cosmos DB...");
      
      const res = await fetch("/api/rooms/combined", {
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type") || "";
      const json = contentType.includes("application/json")
        ? await res.json()
        : { success: false, error: `Unexpected response from /api/rooms/combined (${res.status})` };

      console.log("[RoomDataContext] Response:", json);

      if (!res.ok) {
        throw new Error(
          json && typeof json.error === "string"
            ? json.error
            : `Request failed with status ${res.status}`
        );
      }

      if (json.success && Array.isArray(json.data)) {
        if (json.data.length > 0) {
          // Transform data to match Room interface
          const transformedRooms: Room[] = json.data.map((room: any) => ({
            id: room.id,
            status: room.status || "empty",
            students: room.students ?? 0,
            temp: room.temp ?? 0,
            humidity: room.humidity ?? 0,
            pir: Array.isArray(room.pir) ? room.pir : [],
            wing: room.wing ?? null,
            ledStatus: room.ledStatus ?? "off",
            lastUpdated: room.lastUpdated ?? null,
            sensorHealth: room.sensorHealth || {
              overall: room.lastUpdated ? "ok" : "offline",
              message: room.lastUpdated ? "Sensor bekerja normal" : "Sensor offline",
            },
            dhtSensor: room.dhtSensor || {
              temperature: room.temp ?? 0,
              humidity: room.humidity ?? 0,
              status: room.lastUpdated
                ? room.temp > 28 || room.humidity > 60
                  ? "high"
                  : room.humidity < 40
                  ? "low"
                  : "normal"
                : "offline",
              health: room.lastUpdated
                ? room.temp > 28 || room.humidity > 60 || room.humidity < 40
                  ? "warning"
                  : "ok"
                : "offline",
              lastUpdated: room.lastUpdated ?? null,
            },
            irSensor: room.irSensor || {
              peopleCount: room.students ?? 0,
              status:
                room.lastUpdated == null
                  ? "offline"
                  : room.students > 0
                  ? "present"
                  : "absent",
              lastUpdated: room.lastUpdated ?? null,
            },
            pirSensor: room.pirSensor || {
              motionCount: room.pir?.[0] ?? 0,
              motionDuration: room.pir?.[1] ?? 0,
              activityLevel: room.pir?.[0] ?? 0,
              status:
                room.lastUpdated == null
                  ? "offline"
                  : (room.pir?.[0] ?? 0) > 10 || (room.pir?.[1] ?? 0) > 0
                  ? "active"
                  : "inactive",
              lastUpdated: room.lastUpdated ?? null,
            },
          }));
          
          setRooms(transformedRooms);
          setDbStatus("online");
          setLastUpdated(new Date());
          setError(null);
          
          console.log("[RoomDataContext] Successfully loaded", transformedRooms.length, "rooms");
        } else {
          console.warn("[RoomDataContext] No rooms found in database");
          setRooms([]);
          setDbStatus("offline");
          setError("No rooms found in database");
        }
      } else {
        throw new Error(json.error || "Failed to fetch rooms");
      }
    } catch (err) {
      console.error("[RoomDataContext] Error fetching rooms:", err);
      setDbStatus("offline");
      setError(err instanceof Error ? err.message : "Failed to connect to database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    syncFromCosmos();

    // Polling every 5 seconds for real-time updates
    const interval = setInterval(syncFromCosmos, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRoomById = (id: string) => rooms.find((r) => r.id === id);

  return (
    <RoomContext.Provider value={{ 
      rooms, 
      getRoomById, 
      dbStatus, 
      isLoading, 
      lastUpdated,
      error 
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomData = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoomData must be used within RoomDataProvider");
  }
  return context;
};
