"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type RoomStatus = "active" | "uncertain" | "empty";

export interface Room {
  id: string;
  status: RoomStatus;
  students: number;
  temp: number;
  humidity: number;
  pir: number[];
  wing: string | null;
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
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const json = await res.json();
      
      console.log("[RoomDataContext] Response:", json);

      if (json.success && Array.isArray(json.data)) {
        if (json.data.length > 0) {
          // Transform data to match Room interface
          const transformedRooms: Room[] = json.data.map((room: any) => ({
            id: room.id,
            status: room.status || "empty",
            students: room.students || 0,
            temp: room.temp || 25,
            humidity: room.humidity || 60,
            pir: room.pir || [],
            wing: room.wing || null,
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
