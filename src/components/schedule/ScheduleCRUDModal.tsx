"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertTriangle, Plus } from "lucide-react";
import { ScheduleEntry } from "@/lib/schedule";
import { DAYS, TIME_SLOTS, toMin, normalizeDayKey } from "@/lib/schedule-utils";

export interface ScheduleFormData {
  room: string;
  day: string;
  start: string;
  end: string;
  className: string;
}

interface ScheduleCRUDModalProps {
  mode: "add" | "edit";
  initialDay?: string;
  initialData?: ScheduleEntry;
  /** All existing schedules for conflict check */
  allSchedules: ScheduleEntry[];
  onSave: (data: ScheduleFormData, originalEntry?: ScheduleEntry) => void;
  onClose: () => void;
  onDeleted?: () => void;
  /** Called when admin clicks "Hapus Jadwal" — parent shows its own confirm dialog */
  onRequestDelete?: (entry: ScheduleEntry) => void;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function ScheduleCRUDModal({
  mode,
  initialDay,
  initialData,
  allSchedules,
  onSave,
  onClose,
  onDeleted,
  onRequestDelete,
}: ScheduleCRUDModalProps) {
  const [form, setForm] = useState<ScheduleFormData>({
    room: initialData?.room ?? "",
    day: normalizeDayKey(initialData?.day ?? initialDay ?? "Monday"),
    start: initialData?.start ?? "07:00",
    end: initialData?.end ?? "08:40",
    className: initialData?.class ?? (initialData as any)?.className ?? "",
  });

  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<{ id: string; roomId?: string; name: string }[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedDayLabel = DAYS.find(d => d.key === form.day)?.label ?? form.day;

  // Fetch active rooms from Cosmos DB
  useEffect(() => {
    async function fetchRooms() {
      setIsLoadingRooms(true);
      try {
        const res = await fetch("/api/rooms");
        const json = await res.json();
        if (json.success && Array.isArray(json.rooms)) {
          setRooms(json.rooms);
          // Set default room if none selected and in "add" mode
          if (mode === "add" && !form.room && json.rooms.length > 0) {
            const defaultRoom = json.rooms[0];
            setForm(f => ({ ...f, room: defaultRoom.roomId ?? defaultRoom.id }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      } finally {
        setIsLoadingRooms(false);
      }
    }
    fetchRooms();
  }, [mode]);

  // Validate + conflict check
  function validate(): string | null {
    if (!form.room.trim()) return "Nama ruangan wajib diisi.";
    if (!form.day) return "Hari wajib dipilih.";
    if (!form.start || !form.end) return "Jam mulai dan selesai wajib diisi.";
    if (!form.className.trim()) return "Kelas wajib diisi.";
    if (timeToMinutes(form.start) >= timeToMinutes(form.end)) {
      return "Jam selesai harus lebih besar dari jam mulai.";
    }

    const excludeKey = mode === "edit" && initialData
      ? `${initialData.room}_${initialData.day}_${initialData.start}_${initialData.end}`
      : undefined;

    const startMin = timeToMinutes(form.start);
    const endMin = timeToMinutes(form.end);

    const conflict = allSchedules.find(s => {
      const key = `${s.room}_${s.day}_${s.start}_${s.end}`;
      if (excludeKey && key === excludeKey) return false;
      if (s.room !== form.room || normalizeDayKey(s.day) !== normalizeDayKey(form.day)) return false;
      const sStart = toMin(s.start);
      const sEnd = toMin(s.end);
      return startMin < sEnd && endMin > sStart;
    });

    if (conflict) {
      return `Bentrok dengan jadwal di ruangan "${conflict.room}" (${conflict.start}–${conflict.end}).`;
    }

    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    onSave(form, initialData);
  }

  // Time slot quick-pick
  const startOptions = TIME_SLOTS.map(ts => ts.start);
  const endOptions = TIME_SLOTS.map(ts => ts.end);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden anim-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[var(--color-primary)]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
              <Plus size={18} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">
                {mode === "add" ? "Tambah Jadwal Baru" : "Edit Jadwal"}
              </h2>
              {form.day && (
                <p className="text-xs text-slate-400">{selectedDayLabel}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Hari + Ruangan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hari *</label>
              <select
                value={form.day}
                onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                required
              >
                {DAYS.map(d => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ruangan *</label>
              <select
                value={form.room}
                onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                required
                disabled={isLoadingRooms}
              >
                {isLoadingRooms ? (
                  <option value="">Memuat...</option>
                ) : rooms.length === 0 ? (
                  <option value="">Tidak ada ruangan</option>
                ) : (
                  rooms.map(r => {
                    const val = r.roomId ?? r.id;
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          {/* Kelas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kelas *</label>
            <input
              type="text"
              value={form.className}
              onChange={e => setForm(f => ({ ...f, className: e.target.value }))}
              placeholder="Contoh: TI-2A"
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              required
              autoComplete="off"
            />
          </div>

          {/* Jam */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jam Mulai *</label>
              <select
                value={form.start}
                onChange={e => setForm(f => ({ ...f, start: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                required
              >
                {startOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jam Selesai *</label>
              <select
                value={form.end}
                onChange={e => setForm(f => ({ ...f, end: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                required
              >
                {endOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Preview */}
          {form.room && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800">
              <span className="font-bold">{rooms.find(r => (r.roomId ?? r.id) === form.room)?.name ?? form.room}</span>
              {form.className && <span className="font-bold"> · {form.className}</span>}
              <br />
              <span>{DAYS.find(d => d.key === form.day)?.label}</span>
              {" · "}
              <span>{form.start} – {form.end}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>

            {mode === "edit" && initialData && (
              <button
                type="button"
                onClick={() => {
                  if (!initialData || !(initialData as any).id) {
                    setError("Tidak ada ID jadwal untuk dihapus.");
                    return;
                  }
                  // Close CRUD modal first, then let parent show its confirm dialog
                  onClose();
                  onRequestDelete?.(initialData);
                }}
                className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-black transition-colors"
              >
                Hapus Jadwal
              </button>
            )}

            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-white text-sm font-black hover:from-[var(--color-primary-dark)] hover:to-blue-600 transition-all shadow-lg shadow-blue-900/20"
            >
              <Save size={15} />
              {mode === "add" ? "Simpan Jadwal" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
