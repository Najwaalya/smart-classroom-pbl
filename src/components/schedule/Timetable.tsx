"use client";

import { useMemo } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { TIME_SLOTS, DAYS, toMin, normalizeDayKey } from "@/lib/schedule-utils";
import { ScheduleEntry } from "@/lib/schedule";

// unused helper kept for potential future use
// function slotIndex removed

export interface TimetableProps {
  /** All schedules to render (default + custom) */
  schedules: ScheduleEntry[];
  /** Selected class name, e.g. "TI-2A" — if empty, show all */
  selectedClass: string;
  /** If true, show CRUD action buttons on each cell */
  editable?: boolean;
  onAdd?: (day: string) => void;
  onEdit?: (entry: ScheduleEntry, isCustom: boolean) => void;
  onDelete?: (entry: ScheduleEntry, isCustom: boolean) => void;
  /** Ids of custom entries (room_day_start_end) */
  customIds?: Set<string>;
}

function makeId(s: ScheduleEntry) {
  return `${s.room}_${s.day}_${s.start}_${s.end}`;
}

/** Map from slot number to TIME_SLOTS index */
function slotIndex(slot: typeof TIME_SLOTS[0]) {
  return TIME_SLOTS.findIndex(t => t.slot === slot.slot);
}

export function Timetable({
  schedules,
  selectedClass,
  editable = false,
  onAdd,
  onEdit,
  onDelete,
  customIds = new Set(),
}: TimetableProps) {

  /** Filter by selected class */
  const filtered = useMemo(() => {
    if (!selectedClass) return schedules;
    return schedules.filter(s => s.class === selectedClass);
  }, [schedules, selectedClass]);

  /**
   * For each day × entry, calculate which TIME_SLOTS it spans.
   * Returns: map[day] → list of {entry, startIdx, spanCount}
   */
  const rows = useMemo(() => {
    return DAYS.map(day => {
      const dayEntries = filtered.filter(s => normalizeDayKey(s.day) === day.key);

      // ── Sort by start time ─────────────────────────────────────────────────
      const sorted = [...dayEntries].sort((a, b) => toMin(a.start) - toMin(b.start));

      // ── Merge adjacent entries with the same room into one block ───────────
      // Two entries merge if: same room AND end-time of first === start-time of next
      const merged: ScheduleEntry[] = [];
      for (const entry of sorted) {
        const last = merged[merged.length - 1];
        const sameRoom =
          last &&
          (last.roomId || last.room) === (entry.roomId || entry.room);
        const touching =
          last &&
          toMin(last.end) === toMin(entry.start);
        if (last && sameRoom && touching) {
          // Extend the previous block's end time; keep first entry's class label
          merged[merged.length - 1] = { ...last, end: entry.end };
        } else {
          merged.push({ ...entry });
        }
      }

      // ── Compute TIME_SLOTS span for each (possibly merged) entry ───────────
      const items = merged.map(entry => {
        const entryStartMin = toMin(entry.start);
        const entryEndMin   = toMin(entry.end);

        // first slot that overlaps with this entry
        const startIdx = TIME_SLOTS.findIndex(
          ts => toMin(ts.start) < entryEndMin && toMin(ts.end) > entryStartMin
        );
        if (startIdx === -1) return null; // entry doesn't overlap any slot — skip

        // last slot that overlaps
        let endIdx = startIdx;
        for (let i = startIdx + 1; i < TIME_SLOTS.length; i++) {
          if (toMin(TIME_SLOTS[i].start) < entryEndMin && toMin(TIME_SLOTS[i].end) > entryStartMin) {
            endIdx = i;
          }
        }
        return { entry, startIdx, span: endIdx - startIdx + 1 };
      }).filter(Boolean) as { entry: ScheduleEntry; startIdx: number; span: number }[];

      return { day, items };
    });
  }, [filtered]);

  // Single consistent color for all occupied slots
  const CELL_COLOR = "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]";
  const CELL_COLOR_CUSTOM = "bg-emerald-50 border-emerald-300 text-emerald-800";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Scroll wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 900 }}>
          {/* ── HEADER ── */}
          <thead>
            <tr>
              {/* Day column header */}
              <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left w-20 min-w-[80px]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hari</span>
              </th>
              {/* Time slot columns */}
              {TIME_SLOTS.map(ts => (
                <th
                  key={ts.slot}
                  className="border border-slate-200 bg-slate-50 px-1 py-2 text-center min-w-[68px]"
                >
                  <div className="text-xs font-black text-slate-700">{ts.slot}</div>
                  <div className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                    {ts.start} - {ts.end}
                  </div>
                </th>
              ))}
              {/* Add column for dosen */}
              {editable && (
                <th className="border border-slate-200 bg-slate-50 px-2 py-2 text-center w-10">
                  <span className="text-[10px] text-slate-400">+</span>
                </th>
              )}
            </tr>
          </thead>

          {/* ── BODY ── */}
          <tbody>
            {rows.map(({ day, items }) => {
              /**
               * Build a cell array for this row.
               * We must handle overlapping / gaps:
               * - Start at col 0 (TIME_SLOTS[0])
               * - For each slot, if an entry starts here, place it with its colspan; else place an empty cell.
               */
              type Cell =
                | { kind: "entry"; entry: ScheduleEntry; span: number }
                | { kind: "empty" };

              const cells: Cell[] = [];
              let cursor = 0; // current slot index

              // Sort items by startIdx
              const sorted = [...items].sort((a, b) => a.startIdx - b.startIdx);

              for (const item of sorted) {
                // Fill empty cells before this entry
                while (cursor < item.startIdx) {
                  cells.push({ kind: "empty" });
                  cursor++;
                }
                cells.push({ kind: "entry", entry: item.entry, span: item.span });
                cursor += item.span;
              }

              // Fill remaining empty cells
              while (cursor < TIME_SLOTS.length) {
                cells.push({ kind: "empty" });
                cursor++;
              }

              return (
                <tr key={day.key} className="group">
                  {/* Day label */}
                  <td className="border border-slate-200 bg-slate-50/60 px-3 py-0 align-top">
                    <span className="text-base font-black text-slate-700 block py-3 leading-none">
                      {day.label}
                    </span>
                  </td>

                  {/* Render cells */}
                  {cells.map((cell, ci) => {
                    if (cell.kind === "empty") {
                      return (
                        <td key={ci} className="border border-slate-100 bg-white p-0 align-middle h-20 min-w-[68px]">
                          <div className="w-full h-full flex items-center justify-center text-slate-200 text-xs">
                            —
                          </div>
                        </td>
                      );
                    }

                    // Entry cell
                    const { entry, span } = cell;
                    const isCustom = customIds.has(makeId(entry));
                    const colorClass = isCustom ? CELL_COLOR_CUSTOM : CELL_COLOR;

                    return (
                      <td
                        key={ci}
                        colSpan={span}
                        className="border border-slate-200 p-0 align-middle h-16"
                      >
                        <div className={`h-full mx-0.5 my-0.5 rounded-lg border ${colorClass} flex items-center justify-center relative group/cell overflow-hidden`}>
                          <span className="text-[11px] font-black text-center px-1 leading-tight">
                            {entry.class || entry.subject || "Terisi"}
                          </span>

                          {/* CRUD buttons on hover */}
                          {editable && (
                            <div className="absolute inset-0 bg-black/0 group-hover/cell:bg-black/15 flex items-center justify-center gap-1.5 opacity-0 group-hover/cell:opacity-100 transition-all rounded-lg">
                              <button
                                onClick={() => onEdit?.(entry, isCustom)}
                                className="w-6 h-6 rounded-md bg-white shadow-md flex items-center justify-center hover:bg-blue-50 transition-colors"
                                title="Edit jadwal"
                              >
                                <Edit2 size={11} className="text-blue-600" />
                              </button>
                              {isCustom && (
                                <button
                                  onClick={() => onDelete?.(entry, isCustom)}
                                  className="w-6 h-6 rounded-md bg-white shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                                  title="Hapus jadwal"
                                >
                                  <Trash2 size={11} className="text-red-500" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Add button column */}
                  {editable && (
                    <td className="border border-slate-100 p-1 align-middle text-center w-10">
                      <button
                        onClick={() => onAdd?.(day.key)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[var(--color-primary)] hover:text-white flex items-center justify-center mx-auto transition-all"
                        title={`Tambah jadwal ${day.label}`}
                      >
                        <Plus size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
