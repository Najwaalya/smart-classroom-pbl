"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertTriangle, Plus } from "lucide-react";
import { ScheduleEntry } from "@/lib/schedule";
import { DAYS, TIME_SLOTS, toMin } from "@/lib/schedule-utils";

export interface ScheduleFormData {
  room: string;
  day: string;
  start: string;
  end: string;
  subject: string;
  lecturer: string;
  lecturerCode: string;
  class: string;
}

interface ScheduleCRUDModalProps {
  mode: "add" | "edit";
  initialDay?: string;
  initialData?: ScheduleEntry;
  /** All existing schedules for conflict check */
  allSchedules: ScheduleEntry[];
  onSave: (data: ScheduleFormData, originalEntry?: ScheduleEntry) => void;
  onClose: () => void;
}

// Room suggestions
const ROOM_SUGGESTIONS = [
  "RT01_5B", "RT02_5B", "RT03_5B", "RT04_5B", "RT05_5B", "RT06_5B", "RT07_5B",
  "LSI1_6T", "LSI2_6T", "LPY3_6T",
  "LAI1_7T", "LIG2_7T", "LKJ2_7T", "LKJ3_7T", "LERP_7T",
  "LPR1_7B", "LPR2_7B", "LPR3_7B", "LPR4_7B", "LPR5_7B", "LPR6_7B",
  "RT09_8T", "RT10_8T", "RT11_8T", "RT12_8T",
];

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
}: ScheduleCRUDModalProps) {
  const [form, setForm] = useState<ScheduleFormData>({
    room: initialData?.room ?? "",
    day: initialData?.day ?? initialDay ?? "Monday",
    start: initialData?.start ?? "07:00",
    end: initialData?.end ?? "08:40",
    subject: initialData?.subject ?? "",
    lecturer: initialData?.lecturer ?? "",
    lecturerCode: initialData?.lecturerCode ?? "",
    class: initialData?.class ?? "",
  });

  const [error, setError] = useState<string | null>(null);
  const [roomSuggestions, setRoomSuggestions] = useState<string[]>([]);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);

  const selectedDayLabel = DAYS.find(d => d.key === form.day)?.label ?? form.day;

  // Validate + conflict check
  function validate(): string | null {
    if (!form.room.trim()) return "Nama ruangan wajib diisi.";
    if (!form.day) return "Hari wajib dipilih.";
    if (!form.start || !form.end) return "Jam mulai dan selesai wajib diisi.";
    if (timeToMinutes(form.start) >= timeToMinutes(form.end)) {
      return "Jam selesai harus lebih besar dari jam mulai.";
    }
    if (!form.subject.trim()) return "Nama mata kuliah wajib diisi.";

    // Conflict check
    const excludeKey = mode === "edit" && initialData
      ? `${initialData.room}_${initialData.day}_${initialData.start}_${initialData.end}`
      : undefined;

    const startMin = timeToMinutes(form.start);
    const endMin = timeToMinutes(form.end);

    const conflict = allSchedules.find(s => {
      const key = `${s.room}_${s.day}_${s.start}_${s.end}`;
      if (excludeKey && key === excludeKey) return false;
      if (s.room !== form.room || s.day !== form.day) return false;
      const sStart = toMin(s.start);
      const sEnd = toMin(s.end);
      return startMin < sEnd && endMin > sStart;
    });

    if (conflict) {
      return `Bentrok dengan jadwal "${conflict.subject ?? conflict.room}" (${conflict.start}–${conflict.end}).`;
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

  function handleRoomInput(val: string) {
    setForm(f => ({ ...f, room: val }));
    if (val.length > 0) {
      setRoomSuggestions(
        ROOM_SUGGESTIONS.filter(r => r.toLowerCase().includes(val.toLowerCase()))
      );
      setShowRoomDropdown(true);
    } else {
      setShowRoomDropdown(false);
    }
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

            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ruangan *</label>
              <input
                type="text"
                value={form.room}
                onChange={e => handleRoomInput(e.target.value)}
                onBlur={() => setTimeout(() => setShowRoomDropdown(false), 150)}
                placeholder="Contoh: RT04_5B"
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
                autoComplete="off"
              />
              {showRoomDropdown && roomSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-10 max-h-40 overflow-y-auto">
                  {roomSuggestions.map(r => (
                    <button
                      key={r}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-[var(--color-primary)] font-medium transition-colors"
                      onClick={() => { setForm(f => ({ ...f, room: r })); setShowRoomDropdown(false); }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Jam */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jam Mulai *</label>
              <select
                value={form.start}
                onChange={e => setForm(f => ({ ...f, start: e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              >
                {endOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Mata Kuliah */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kode Mata Kuliah *</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Contoh: RPL_TI"
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              required
            />
          </div>

          {/* Dosen + Kode */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Dosen</label>
              <input
                type="text"
                value={form.lecturer}
                onChange={e => setForm(f => ({ ...f, lecturer: e.target.value }))}
                placeholder="Contoh: Dr. Budi Santoso"
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inisial</label>
              <input
                type="text"
                value={form.lecturerCode}
                onChange={e => setForm(f => ({ ...f, lecturerCode: e.target.value.toUpperCase() }))}
                placeholder="BSN"
                maxLength={5}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Kelas */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kelas / Prodi</label>
            <input
              type="text"
              value={form.class}
              onChange={e => setForm(f => ({ ...f, class: e.target.value }))}
              placeholder="Contoh: TI-2A"
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Preview */}
          {form.subject && form.room && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800">
              <span className="font-black">{form.subject}</span>
              {form.class && <> · <span className="font-bold">{form.class}</span></>}
              {form.lecturer && <> · <span>{form.lecturer}</span></>}
              <br />
              <span className="font-bold">{form.room}</span>
              {" · "}
              {DAYS.find(d => d.key === form.day)?.label}
              {" · "}
              {form.start} – {form.end}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
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
