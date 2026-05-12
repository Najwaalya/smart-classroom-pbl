"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRoomData } from "@/contexts/RoomDataContext";
import {
  Info, CheckCircle, Plus, Download, Trash2, CalendarDays,
} from "lucide-react";
import {
  DAYS, FLOORS, TIME_SLOTS, toMin, getRoomsForFloor, getScheduleForSlot,
} from "@/lib/schedule-utils";
import {
  getAllSchedules, getCustomSchedules, saveCustomSchedules,
  getDistinctClasses,
} from "@/lib/schedule-loader";
import { ScheduleEntry } from "@/lib/schedule";
import { BookingRecord } from "@/components/booking/BookingForm";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleLegend } from "@/components/schedule/ScheduleLegend";
import { StatsCards } from "@/components/schedule/StatsCards";
import { SlotInfoModal } from "@/components/schedule/SlotInfoModal";
import { Timetable } from "@/components/schedule/Timetable";
import ScheduleCRUDModal, { ScheduleFormData } from "@/components/schedule/ScheduleCRUDModal";
import { getRole } from "@/lib/auth";
import { getScheduleStatus, RoomSensorData } from "@/lib/schedule-status";

type ModalState =
  | { open: false }
  | { open: true; mode: "add"; day: string }
  | { open: true; mode: "edit"; entry: ScheduleEntry; isCustom: boolean };

type DeleteConfirm = { entry: ScheduleEntry } | null;

export default function SchedulePage() {
  const { rooms } = useRoomData();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // ── DOSEN state ──────────────────────────────────
  const [allSchedules, setAllSchedules] = useState<ScheduleEntry[]>([]);
  const [customSchedules, setCustomSchedules] = useState<ScheduleEntry[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── MAHASISWA state ──────────────────────────────
  const [selectedFloor, setSelectedFloor] = useState<string>("5");
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{
    roomId: string; day: string; slot: typeof TIME_SLOTS[0];
  } | null>(null);

  // ── Init ─────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const r = getRole();
    setRole(r);
    const today = DAYS.find(d => d.key === new Date().toLocaleDateString("en-US", { weekday: "long" }))?.key ?? "Monday";
    setSelectedDay(today);

    const all = getAllSchedules();
    const custom = getCustomSchedules();
    setAllSchedules(all);
    setCustomSchedules(custom);
    setSchedules(all);

    // Set default class selection for dosen
    const classes = Array.from(new Set(all.map(s => s.class ?? "").filter(Boolean))).sort();
    if (classes.length > 0) setSelectedClass(classes[0]);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem("classroomBookings");
      if (stored) setBookings(JSON.parse(stored) as BookingRecord[]);
    } catch { /* empty */ }
  }, [mounted]);

  // ── Derived ──────────────────────────────────────
  const classes = useMemo(
    () => Array.from(new Set(allSchedules.map(s => s.class ?? "").filter(Boolean))).sort(),
    [allSchedules]
  );

  const customIds = useMemo(
    () => new Set(customSchedules.map(s => `${s.room}_${s.day}_${s.start}_${s.end}`)),
    [customSchedules]
  );

  // ── CRUD handlers ────────────────────────────────

  function refreshSchedules(newCustom: ScheduleEntry[]) {
    saveCustomSchedules(newCustom);
    setCustomSchedules(newCustom);
    const all = getAllSchedules(); // re-read from memory (default) + saved custom
    setAllSchedules(all);
    setSchedules(all);
  }

  function handleSave(data: ScheduleFormData, originalEntry?: ScheduleEntry) {
    const newEntry: ScheduleEntry = {
      room: data.room.trim(),
      day: data.day,
      start: data.start,
      end: data.end,
      subject: data.subject.trim(),
      lecturer: data.lecturer.trim(),
      lecturerCode: data.lecturerCode.trim(),
      class: data.class.trim(),
    };

    let newCustom = [...customSchedules];

    if (modalState.open && modalState.mode === "edit" && originalEntry) {
      // Replace existing custom
      const origKey = `${originalEntry.room}_${originalEntry.day}_${originalEntry.start}_${originalEntry.end}`;
      const isOldCustom = customIds.has(origKey);
      if (isOldCustom) {
        newCustom = newCustom.map(s =>
          `${s.room}_${s.day}_${s.start}_${s.end}` === origKey ? newEntry : s
        );
      } else {
        // Default schedule edited → create a custom override (add new)
        newCustom.push(newEntry);
      }
      setSuccessMsg(`Jadwal "${newEntry.subject}" berhasil diperbarui.`);
    } else {
      newCustom.push(newEntry);
      if (!selectedClass && newEntry.class) setSelectedClass(newEntry.class);
      setSuccessMsg(`Jadwal "${newEntry.subject}" berhasil ditambahkan.`);
    }

    refreshSchedules(newCustom);
    setModalState({ open: false });
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function handleDelete(entry: ScheduleEntry) {
    const key = `${entry.room}_${entry.day}_${entry.start}_${entry.end}`;
    const newCustom = customSchedules.filter(s =>
      `${s.room}_${s.day}_${s.start}_${s.end}` !== key
    );
    refreshSchedules(newCustom);
    setDeleteConfirm(null);
    setSuccessMsg(`Jadwal "${entry.subject}" berhasil dihapus.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function handleDeleteAll() {
    if (!confirm("Hapus semua jadwal custom? Jadwal default tidak akan terpengaruh.")) return;
    refreshSchedules([]);
    setSuccessMsg("Semua jadwal custom berhasil dihapus.");
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // ── MAHASISWA helpers ─────────────────────────────
  const roomsOnFloor = useMemo(() => getRoomsForFloor(selectedFloor, schedules), [selectedFloor, schedules]);

  function getBookingForSlot(roomId: string, day: string, slot: typeof TIME_SLOTS[0]): BookingRecord | null {
    return bookings.find(b =>
      b.roomId === roomId && b.day === day &&
      toMin(b.startTime) < toMin(slot.end) && toMin(b.endTime) > toMin(slot.start)
    ) ?? null;
  }

  const getBoxColor = useCallback((roomId: string, day: string, slot: typeof TIME_SLOTS[0]) => {
    if (!mounted) return { bg: "bg-slate-200 border-slate-300", label: slot.start, clickable: false };
    const sched = getScheduleForSlot(roomId, day, slot, schedules);
    const booking = getBookingForSlot(roomId, day, slot);
    if (sched) return { bg: "bg-red-500 border-red-600", label: slot.start, clickable: false };
    if (booking) return { bg: "bg-slate-400 border-slate-500", label: slot.start, clickable: false };
    return { bg: "bg-emerald-500 border-emerald-600", label: slot.start, clickable: role === "mahasiswa" };
  }, [bookings, role, schedules, mounted]);

  const stats = useMemo(() => {
    if (!mounted) return { kosong: 0, jadwal: 0, terbooked: 0 };
    let kosong = 0, jadwal = 0, terbooked = 0;
    for (const room of roomsOnFloor) {
      for (const slot of TIME_SLOTS) {
        const sched = getScheduleForSlot(room, selectedDay, slot, schedules);
        const booking = getBookingForSlot(room, selectedDay, slot);
        if (sched) jadwal++;
        else if (booking) terbooked++;
        else kosong++;
      }
    }
    return { kosong, jadwal, terbooked };
  }, [roomsOnFloor, selectedDay, bookings, schedules, mounted]);

  const getRoomStatus = useCallback((roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { status: "empty" as const, students: 0 };
    const sensorData: RoomSensorData = {
      students: room.students,
      pirActivity: room.pir && room.pir.length > 0 && room.pir[room.pir.length - 1] > 10,
      lastMotionMinutes: room.status === "active" ? 2 : room.status === "uncertain" ? 25 : 60,
    };
    const statusResult = getScheduleStatus(room.id, sensorData, bookings);
    return { status: statusResult.status, students: room.students };
  }, [rooms, bookings]);

  // ── Loading ───────────────────────────────────────
  if (!mounted) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col gap-6 pb-12">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal & Monitoring Ruangan</h1>
          <p className="text-sm text-slate-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // DOSEN VIEW — Timetable klasik + CRUD
  // ═══════════════════════════════════════════════════
  if (role === "dosen") {
    return (
      <div className="page-wrapper anim-fade-up">
        <div className="flex flex-col gap-6 pb-12">

          {/* HEADER */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal Perkuliahan</h1>
              <p className="text-sm text-slate-500 mt-1">
                Kelola dan pantau jadwal kelas — Politeknik Negeri Malang
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {customSchedules.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-black hover:bg-red-50 transition-all"
                >
                  <Trash2 size={13} />
                  Hapus Semua Custom
                </button>
              )}
              <button
                onClick={() => setModalState({ open: true, mode: "add", day: "Monday" })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-white text-sm font-black hover:from-[var(--color-primary-dark)] hover:to-blue-600 transition-all shadow-lg shadow-blue-900/20"
              >
                <Plus size={15} />
                Tambah Jadwal
              </button>
            </div>
          </div>

          {/* SUCCESS */}
          {successMsg && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 anim-scale-in">
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              <p className="text-sm font-bold text-emerald-800">{successMsg}</p>
            </div>
          )}

          {/* INFO */}
          <div className="flex items-start gap-3 p-4 bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/15">
            <Info size={15} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-black text-slate-800">Panduan dosen:</span>{" "}
              Pilih kelas untuk melihat timetable. Hover sel jadwal untuk aksi Edit/Hapus.
              Klik <span className="font-black text-[var(--color-primary)]">+ Tambah Jadwal</span> atau
              tombol <span className="font-black">+</span> di samping hari untuk menambah jadwal baru.
              Jadwal bawaan (default) tidak dapat dihapus, hanya jadwal custom yang bisa dihapus.
            </p>
          </div>

          {/* CLASS SELECTOR + STATS */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Kelas</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedClass("")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    !selectedClass
                      ? "bg-[var(--color-primary)] text-white shadow-md"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Semua Kelas
                </button>
                {classes.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      selectedClass === cls
                        ? "bg-[var(--color-primary)] text-white shadow-md"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:ml-auto flex gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-300" />
                <span className="text-slate-500 font-bold">Default</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-300" />
                <span className="text-slate-500 font-bold">Custom ({customSchedules.length})</span>
              </div>
            </div>
          </div>

          {/* TIMETABLE */}
          <Timetable
            schedules={allSchedules}
            selectedClass={selectedClass}
            editable={true}
            customIds={customIds}
            onAdd={(day) => setModalState({ open: true, mode: "add", day })}
            onEdit={(entry, isCustom) => setModalState({ open: true, mode: "edit", entry, isCustom })}
            onDelete={(entry) => setDeleteConfirm({ entry })}
          />

          {/* TABEL DETAIL CUSTOM */}
          {customSchedules.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Jadwal Custom yang Ditambahkan</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{customSchedules.length} jadwal custom aktif</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Mata Kuliah", "Ruangan", "Hari", "Waktu", "Kelas", "Dosen", "Aksi"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customSchedules.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <span className="text-sm font-black text-slate-800">{s.subject ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-black text-[var(--color-primary)] bg-blue-50 px-2 py-1 rounded-lg">{s.room}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600">{DAYS.find(d => d.key === s.day)?.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-slate-600">{s.start} – {s.end}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">{s.class ?? "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500">{s.lecturer ?? "—"}</span>
                          {s.lecturerCode && (
                            <span className="ml-1.5 text-[10px] font-black text-slate-400">({s.lecturerCode})</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setModalState({ open: true, mode: "edit", entry: s, isCustom: true })}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <CalendarDays size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ entry: s })}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* ── CRUD MODAL ── */}
        {modalState.open && (
          <ScheduleCRUDModal
            mode={modalState.mode}
            initialDay={modalState.mode === "add" ? modalState.day : undefined}
            initialData={modalState.mode === "edit" ? modalState.entry : undefined}
            allSchedules={allSchedules}
            onSave={handleSave}
            onClose={() => setModalState({ open: false })}
          />
        )}

        {/* ── DELETE CONFIRM ── */}
        {deleteConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 anim-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 size={18} className="text-red-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">Hapus Jadwal</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tindakan ini tidak bisa dibatalkan</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Yakin hapus jadwal <span className="font-black">"{deleteConfirm.entry.subject}"</span> di{" "}
                <span className="font-bold">{deleteConfirm.entry.room}</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.entry)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-black hover:bg-red-600 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // MAHASISWA VIEW — Grid per lantai (view only, booking via halaman booking)
  // ═══════════════════════════════════════════════════
  const dayLabel = DAYS.find(d => d.key === selectedDay)?.label ?? selectedDay;

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal & Monitoring Ruangan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau status semua slot ruangan per hari. Lihat jadwal kelas dan slot kosong yang tersedia.
          </p>
        </div>

        {/* PANDUAN */}
        <div className="flex items-start gap-3 p-4 bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/15">
          <Info size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-black text-slate-800">Cara menggunakan:</span>{" "}
            Pilih lantai & hari untuk melihat jadwal kelas dan slot kosong.
            <br />
            <span className="font-black text-red-600">Merah</span> = ada jadwal kelas (tidak bisa di-booking) ·{" "}
            <span className="font-black text-emerald-600">Hijau</span> = kosong (klik untuk info)
            <br />
            <span className="font-black text-blue-600">💡 Tip:</span> Klik kotak hijau untuk melihat info slot.
            Untuk booking, kunjungi halaman <span className="font-black">Booking Ruangan</span>.
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lantai</span>
            <div className="flex bg-white/70 p-1 rounded-xl shadow-sm border border-slate-200 gap-0.5">
              {FLOORS.map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFloor(f)}
                  className={`px-5 py-2 rounded-lg text-xs font-black transition-all ${
                    selectedFloor === f ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  Lt. {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hari</span>
            <div className="flex bg-white/70 p-1 rounded-xl shadow-sm border border-slate-200 gap-0.5">
              {DAYS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setSelectedDay(d.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    selectedDay === d.key ? "bg-[var(--color-primary)] text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {d.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STATS */}
        <StatsCards kosong={stats.kosong} jadwal={stats.jadwal} terbooked={stats.terbooked} />

        {/* GRID */}
        <ScheduleGrid
          rooms={roomsOnFloor}
          selectedDay={selectedDay}
          getBoxColor={getBoxColor}
          getRoomStatus={getRoomStatus}
          onSlotDetail={(roomId, day, slot) => {
            const sched = getScheduleForSlot(roomId, day, slot, schedules);
            const booking = getBookingForSlot(roomId, day, slot);
            if (!sched && !booking) setSelectedSlot({ roomId, day, slot });
          }}
        />

        {/* LEGENDA */}
        <ScheduleLegend />

      </div>

      {/* SLOT INFO MODAL */}
      {selectedSlot && (
        <SlotInfoModal
          roomId={selectedSlot.roomId}
          day={selectedSlot.day}
          slot={selectedSlot.slot}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
