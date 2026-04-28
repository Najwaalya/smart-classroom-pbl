"use client";

import { useState } from "react";
import { schedules as initialSchedules } from "@/lib/schedule";

export default function SchedulePage() {
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  const schedules = initialSchedules;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 1);

  // ambil lantai dari room
  const getFloor = (room: string) => {
    const match = room.match(/_(\d)/);
    return match ? match[1] : null;
  };

  // mapping jam ke slot
  const getSlotIndex = (time: string) => {
    const map: Record<string, number> = {
      "07:30": 1, "07:40": 1, "07:50": 1,
      "08:10": 2, "08:20": 2, "08:40": 2,
      "09:20": 3, "09:30": 3, "09:40": 3,
      "10:10": 4, "10:20": 4, "10:30": 4,
      "11:00": 5, "11:10": 5, "11:20": 6,
      "12:40": 7,
      "13:20": 8, "13:30": 8, "13:40": 8,
      "14:30": 10,
      "15:30": 11,
      "16:20": 12,
    };

    return map[time];
  };

  // floors & rooms
  const floors = Array.from(
    new Set(schedules.map((s) => getFloor(s.room)).filter((f): f is string => f !== null))
  );

  const rooms = Array.from(
    new Set(
      schedules
        .filter((s) => getFloor(s.room) === selectedFloor)
        .map((s) => s.room)
    )
  );

  const filteredSchedules = schedules.filter(
    (s) => s.room === selectedRoom
  );

  return (
    <div className="p-6 flex flex-col gap-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Jadwal Kelas
        </h1>
        <p className="text-sm text-slate-500">
          Lihat jadwal berdasarkan lantai dan ruangan
        </p>
      </div>

      {/* ================= SELECT FLOOR ================= */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm">
        <label className="text-sm font-semibold">
          Pilih Lantai
        </label>

        <select
          value={selectedFloor}
          onChange={(e) => {
            setSelectedFloor(e.target.value);
            setSelectedRoom("");
          }}
          className="mt-2 border p-2 rounded-xl w-full"
        >
          <option value="">-- Pilih Lantai --</option>
          {floors.map((floor) => (
            <option key={floor} value={floor}>
              Lantai {floor}
            </option>
          ))}
        </select>
      </div>

      {/* ================= ROOM LIST ================= */}
      {selectedFloor && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {rooms.map((room) => (
            <button
              key={room}
              onClick={() => setSelectedRoom(room)}
              className={`p-4 rounded-xl border transition ${
                selectedRoom === room
                  ? "bg-blue-600 text-white"
                  : "bg-white hover:bg-slate-100"
              }`}
            >
              {room}
            </button>
          ))}
        </div>
      )}

      {/* ================= TABLE ================= */}
      {selectedRoom && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

          <div className="p-4 border-b">
            <h2 className="font-bold">
              Jadwal {selectedRoom}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead>
                <tr className="bg-slate-100">
                  <th className="p-3 border">Hari</th>
                  {timeSlots.map((slot) => (
                    <th key={slot} className="p-3 border">
                      Jam {slot}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {days.map((day) => (
                  <tr key={day}>
                    <td className="p-3 border font-semibold">
                      {day.slice(0, 3)}
                    </td>

                    {timeSlots.map((slot) => {
                      const schedule = filteredSchedules.find((s) => {
                        const startIndex = getSlotIndex(s.start);
                        return s.day === day && startIndex === slot;
                      });

                      return (
                        <td key={slot} className="p-2 border text-center">
                          {schedule ? (
                            <div className="bg-blue-500 text-white text-xs rounded-lg py-1">
                              {schedule.room}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </div>
      )}
    </div>
  );
}