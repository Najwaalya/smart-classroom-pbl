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
  dbStatus: "online" | "offline";
}

const initialRooms: Room[] = [
  { id: "RT04_5B", status: "active", students: 24, temp: 22.4, humidity: 45.2, pir: [40, 80, 50, 70], wing: null },
  { id: "RT05_5B", status: "uncertain", students: 8, temp: 19.8, humidity: 50.1, pir: [10, 20, 10, 20], wing: null },
  { id: "LSI1_6T", status: "empty", students: 0, temp: 18.0, humidity: 55.4, pir: [], wing: null },
  { id: "LIG2_7T", status: "active", students: 38, temp: 24.1, humidity: 60.5, pir: [60, 80, 70, 80], wing: "Sayap Selatan" },
  { id: "RT06_5B", status: "active", students: 35, temp: 21.2, humidity: 48.0, pir: [30, 60, 50, 60], wing: "Sayap Utara" },
  { id: "LSI2_6T", status: "empty", students: 0, temp: 17.5, humidity: 52.3, pir: [], wing: null },
  { id: "LIG1_7T", status: "uncertain", students: 5, temp: 20.0, humidity: 49.8, pir: [5, 10, 5, 15], wing: "Sayap Timur" },
  { id: "RT07_5B", status: "active", students: 36, temp: 23.0, humidity: 58.2, pir: [50, 70, 65, 80], wing: null },
];

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [dbStatus, setDbStatus] = useState<"online" | "offline">("offline");

  useEffect(() => {
    const syncIoTData = async () => {
      try {
        const response = await fetch("/api/iot/sync");
        const json = await response.json();

        if (json.success && json.data) {
          // DATABASE CONNECTED: Set state dari MySQL
          setRooms(json.data);
          setDbStatus("online");
        } else {
          // DB EXIST TAPI ERROR/KOSONG
          setDbStatus("offline");
        }
      } catch {
        // SERVER DB OFFLINE (XAMPP BELUM NYALA)
        setDbStatus("offline");
      }
    };

    // Sinkronisasi data utama (Setiap 3 Detik)
    const dbInterval = setInterval(syncIoTData, 3000);
    // Jalankan satu kali segera
    syncIoTData();

    // FALLBACK: Simulasi Visual untuk Pameran jika Database MySQL Offline
    const simulationInterval = setInterval(() => {
      if (dbStatus === "offline") {
        setRooms((currentRooms) =>
          currentRooms.map((room) => {
            let newStudents = room.students;
            // Simulasi penghitungan Mahasiswa Masuk/Keluar via Sensor Infrared
            if (room.status === "empty") {
              newStudents = 0;
            } else if (room.status === "uncertain") {
              const studentChange = Math.floor(Math.random() * 3) - 1;
              newStudents = Math.max(1, Math.min(9, room.students + studentChange));
            } else if (room.status === "active") {
              const studentChange = Math.floor(Math.random() * 5) - 2;
              newStudents = Math.max(10, Math.min(40, room.students + studentChange));
            }

            // DHT Fluctuation
            const tempChange = Math.random() * 0.2 - 0.1;
            const newTemp = Math.round((room.temp + tempChange) * 10) / 10;
            const humChange = Math.random() * 1.0 - 0.5;
            const newHum = Math.round((room.humidity + humChange) * 10) / 10;

            const newPir = [...room.pir];
            if (newPir.length > 0 && room.status !== "empty") {
              newPir.shift();
              newPir.push(Math.max(10, Math.min(90, newPir[newPir.length - 1] + (Math.floor(Math.random() * 30) - 15))));
            }

            return { ...room, students: newStudents, temp: newTemp, humidity: newHum, pir: newPir };
          })
        );
      }
    }, 3000);

    return () => {
      clearInterval(dbInterval);
      clearInterval(simulationInterval);
    };
  }, [dbStatus]);

  const getRoomById = (id: string) => rooms.find((r) => r.id === id);

  return (
    <RoomContext.Provider value={{ rooms, getRoomById, dbStatus }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomData = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoomData harus digunakan di dalam RoomDataProvider");
  }
  return context;
};
