"use client";

import { useMemo, useState } from "react";
import { schedules } from "@/lib/schedule";

// ── Konstanta ──────────────────────────────────────────────────────────────

const DAYS = [
  { key: "Monday",    label: "Senin" },
  { key: "Tuesday",   label: "Selasa" },
  { key: "Wednesday", label: "Rabu" },
  { key: "Thursday",  label: "Kamis" },
  { key: "Friday",    label: "Jumat" },
];

const TIME_SLOTS = [
  { slot: 1,  start: "07:00", end: "07:50",  label: "7:00\n7:50" },
  { slot: 2,  start: "07:50", end: "08:40",  label: "7:50\n8:40" },
  { slot: 3,  start: "08:40", end: "09:30",  label: "8:40\n9:30" },
  { slot: 4,  start: "09:40", end: "10:30",  label: "9:40\n10:30" },
  { slot: 5,  start: "10:30", end: "11:20",  label: "10:30\n11:20" },
  { slot: 6,  start: "11:20", end: "12:10",  label: "11:20\n12:10" },
  { slot: 7,  start: "12:50", end: "13:40",  label: "12:50\n13:40" },
  { slot: 8,  start: "13:40", end: "14:30",  label: "13:40\n14:30" },
  { slot: 9,  start: "14:30", end: "15:20",  label: "14:30\n15:20" },
  { slot: 10, start: "15:30", end: "16:20",  label: "15:30\n16:20" },
  { slot: 11, start: "16:20", end: "17:10",  label: "16:20\n17:10" },
  { slot: 12, start: "17:10", end: "18:00",  label: "17:10\n18:00" },
];

// Mapping lantai → suffix ID ruangan
const FLOOR_SUFFIX: Record<string, string[]> = {
  "5": ["_5B"],
  "6": ["_6T"],
  "7": ["_7T", "_7B"],
  "8": ["_8T"],
};

const FLOORS = ["5", "6", "7", "8"];

// ── Helpers ────────────────────────────────────────────────────────────────

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Hitung startSlot dan span berdasarkan waktu mulai/selesai jadwal */
function getSpan(start: string, end: string): { startSlot: number; span: number } | null {
  const sMin = timeToMin(start);
  const eMin = timeToMin(end);
  let first = -1, last = -1;
  for (const ts of TIME_SLOTS) {
    const tsS = timeToMin(ts.start);
    const tsE = timeToMin(ts.end);
    if (sMin < tsE && eMin > tsS) {
      if (first === -1) first = ts.slot;
      last = ts.slot;
    }
  }
  if (first === -1) return null;
  return { startSlot: first, span: last - first + 1 };
}

function getRoomsForFloor(floor: string): string[] {
  const suffixes = FLOOR_SUFFIX[floor] ?? [];
  const rooms = schedules
    .filter((s) => suffixes.some((sfx) => s.room.endsWith(sfx)))
    .map((s) => s.room);
  return Array.from(new Set(rooms)).sort();
}

// ── Tipe untuk slot map ────────────────────────────────────────────────────

type SlotEntry = {
  room: string;
  day: string;
  start: string;
  end: string;
  startSlot: number;
  span: number;
};

// ── Sub-komponen: Tabel jadwal ─────────────────────────────────────────────

function ScheduleTable({ roomFilter }: { roomFilter: string | null }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              {/* Kolom hari */}
              <th className="border border-slate-200 bg-slate-50 w-24 min-w-[96px]" />
              {TIME_SLOTS.map((ts) => (
                <th
                  key={ts.slot}
                  className="border border-slate-200 bg-slate-50 text-center px-1 py-2 min-w-[72px]"
                >
                  <div className="text-xs font-bold text-slate-700">{ts.slot}</div>
                  <div className="text-[9px] text-slate-400 font-medium mt-0.5 leading-tight whitespace-pre-line">
                    {ts.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              // Ambil jadwal hari ini dari lib/schedule, filter ruangan jika ada
              const dayEntries = schedules.filter(
                (s) =>
                  s.day === day.key &&
                  (roomFilter === null || s.room === roomFilter)
              );

              // Bangun slot map dengan tipe eksplisit
              const slotMap: Record<number, SlotEntry | "skip" | null> = {};
              TIME_SLOTS.forEach((ts) => { slotMap[ts.slot] = null; });

              for (const entry of dayEntries) {
                const result = getSpan(entry.start, entry.end);
                if (!result) continue;
                const { startSlot, span } = result;
                if (slotMap[startSlot] !== null) continue; // skip overlap
                slotMap[startSlot] = { ...entry, startSlot, span };
                for (let i = 1; i < span; i++) {
                  if (startSlot + i <= 12) slotMap[startSlot + i] = "skip";
                }
              }

              return (
                <tr key={day.key} className="border-b border-slate-200">
                  {/* Label hari */}
                  <td className="border border-slate-200 px-3 py-4 align-middle bg-slate-50 min-w-[96px]">
                    <span className="text-lg font-black text-slate-700 whitespace-nowrap">
                      {day.label}
                    </span>
                  </td>

                  {TIME_SLOTS.map((ts) => {
                    const cell = slotMap[ts.slot];
                    if (cell === "skip") return null;

                    if (cell === null) {
                      return (
                        <td
                          key={ts.slot}
                          className="border border-slate-200 h-20"
                        />
                      );
                    }

                    // Slot terisi — pakai start/end langsung dari lib/schedule
                    return (
                      <td
                        key={ts.slot}
                        colSpan={cell.span}
                        className="border border-slate-200 px-3 py-3 align-middle"
                      >
                        <div className="flex flex-col justify-between min-h-[56px] h-full">
                          {/* Nama ruangan — tengah */}
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-sm font-black text-slate-800 tracking-tight text-center leading-tight">
                              {cell.room}
                            </span>
                          </div>
                          {/* Jam asli dari lib/schedule di pojok bawah */}
                          <div className="flex justify-between items-end mt-2">
                            <span className="text-[9px] text-slate-400 font-semibold">{cell.start}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{cell.end}</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Halaman Utama ──────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [selectedFloor, setSelectedFloor] = useState<string>("5");
  const [selectedRoom, setSelectedRoom]   = useState<string | null>(
    () => getRoomsForFloor("5")[0] ?? null
  );

  const roomsOnFloor = useMemo(() => getRoomsForFloor(selectedFloor), [selectedFloor]);

  function handleFloorChange(floor: string) {
    setSelectedFloor(floor);
    setSelectedRoom(getRoomsForFloor(floor)[0] ?? null);
  }

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">

        {/* ── HEADER ── */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal Kelas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pilih lantai lalu pilih ruangan untuk melihat jadwal pemakaiannya.
          </p>
        </div>

        {/* ── CONTROLS ── */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">

          {/* Pilih Lantai */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lantai</span>
            <div className="flex bg-white/70 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200 gap-0.5">
              {FLOORS.map((f) => (
                <button
                  key={f}
                  onClick={() => handleFloorChange(f)}
                  className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${
                    selectedFloor === f
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  Lt. {f}
                </button>
              ))}
            </div>
          </div>

          {/* Pilih Ruangan */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruangan</span>
            <div className="flex flex-wrap gap-2">
              {roomsOnFloor.map((room) => (
                <button
                  key={room}
                  onClick={() => setSelectedRoom(room)}
                  className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                    selectedRoom === room
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── INFO RUANGAN TERPILIH ── */}
        {selectedRoom && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-sm font-black text-[var(--color-primary)]">{selectedRoom}</span>
            <span className="text-xs text-slate-500 font-semibold">
              — menampilkan jadwal pemakaian ruangan ini sepanjang minggu
            </span>
          </div>
        )}

        {/* ── TABEL JADWAL ── */}
        <ScheduleTable roomFilter={selectedRoom} />

        {/* ── KETERANGAN ── */}
        <div className="flex flex-wrap gap-4 items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Keterangan:</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-4 h-3 rounded border border-slate-300 bg-white inline-block" />
            Kosong
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-4 h-3 rounded border border-slate-300 bg-slate-100 inline-block" />
            Terpakai
          </span>
        </div>

      </div>
    </div>
  );
}
