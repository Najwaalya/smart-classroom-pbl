"use client";

import { TIME_SLOTS, toMin, getDayLabel } from "@/lib/schedule-utils";
import { RoomStatusBadge } from "./RoomStatusBadge";
import { Clock, Info, AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export interface ScheduleGridProps {
  rooms: string[];
  selectedDay: string;
  onSlotDetail?: (roomId: string, day: string, slot: typeof TIME_SLOTS[0]) => void;
  getBoxColor: (roomId: string, day: string, slot: typeof TIME_SLOTS[0]) => {
    bg: string;
    label: string;
    clickable: boolean;
  };
  getRoomStatus?: (roomId: string) => {
    status: "active" | "scheduled" | "uncertain" | "empty" | "booked";
    students: number;
  };
}

export function ScheduleGrid({
  rooms,
  selectedDay,
  onSlotDetail,
  getBoxColor,
  getRoomStatus,
}: ScheduleGridProps) {
  const [detail, setDetail] = useState<{
    roomId: string;
    slot: typeof TIME_SLOTS[0];
  } | null>(null);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header slot waktu */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 overflow-x-auto">
          <div className="grid gap-1.5 min-w-[700px]" style={{ gridTemplateColumns: `110px repeat(${TIME_SLOTS.length}, 1fr)` }}>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">Ruangan</div>
            {TIME_SLOTS.map(ts => (
              <div key={ts.slot} className="text-center">
                <div className="text-[9px] font-black text-slate-600">{ts.slot}</div>
                <div className="text-[8px] text-slate-400 font-medium">{ts.start}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Baris per ruangan */}
        <div className="p-3 flex flex-col gap-2 overflow-x-auto">
          {rooms.map(room => (
            <div key={room}
              className="grid gap-1.5 items-center min-w-[700px]"
              style={{ gridTemplateColumns: `110px repeat(${TIME_SLOTS.length}, 1fr)` }}
            >
              <div className="text-[10px] font-black text-slate-700 truncate pr-2 flex items-center gap-1.5">
                {room}
                {/* Sensor live */}
                {getRoomStatus && (
                  <RoomStatusBadge {...getRoomStatus(room)} />
                )}
              </div>
              {TIME_SLOTS.map(slot => {
                const box = getBoxColor(room, selectedDay, slot);

                return (
                  <button
                    key={slot.slot}
                    type="button"
                    title={`${slot.start}–${slot.end}`}
                    onClick={() => {
                      if (box.clickable && onSlotDetail) {
                        onSlotDetail(room, selectedDay, slot);
                      } else {
                        setDetail({ roomId: room, slot });
                      }
                    }}
                    className={`
                      w-full aspect-square rounded-xl border-2 flex items-center justify-center
                      text-white text-[8px] font-black transition-all duration-200
                      ${box.bg}
                      ${box.clickable ? "cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95" : "cursor-default"}
                    `}
                  >
                    {box.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Detail slot modal simple */}
      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5">
            <button
              onClick={() => setDetail(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-slate-600" />
              <div>
                <p className="text-sm font-black text-slate-800">{detail.roomId}</p>
                <p className="text-[10px] text-slate-400">{getDayLabel(selectedDay)}</p>
              </div>
            </div>
            <div className="text-center py-4">
              <p className="text-xs text-slate-500">Slot kosong</p>
              <p className="text-sm font-black text-slate-700 mt-1">{detail.slot.start} – {detail.slot.end}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
