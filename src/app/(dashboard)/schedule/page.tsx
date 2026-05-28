"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { useRoomData } from "@/contexts/RoomDataContext";
import {
  Info, CheckCircle, Plus, Download, Trash2, CalendarDays,
} from "lucide-react";
import {
  DAYS, FLOORS, TIME_SLOTS, toMin, getRoomsForFloor, getScheduleForSlot,
} from "@/lib/schedule-utils";
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
  const swrFetcher = (url: string) => fetch(url).then(r => r.json());

  interface SchedulesApiResponse {
    success: boolean;
    schedules: Record<string, any>[];
  }

  // Fetch jadwal dari Cosmos DB
  const { data: cosmosScheduleData } = useSWR<SchedulesApiResponse>("/api/schedules", swrFetcher, {
    refreshInterval: 30000,
  });

  // Fetch bookings dari Cosmos DB
  const { data: cosmosBookingsData } = useSWR<{ success: boolean; bookings: any[] }>("/api/bookings", swrFetcher, {
    refreshInterval: 30000,
  });

  useEffect(() => {
    setMounted(true);
    const r = getRole();
    setRole(r);
    const today = DAYS.find(d => d.key === new Date().toLocaleDateString("en-US", { weekday: "long" }))?.key ?? "Monday";
    setSelectedDay(today);
  }, []);

  // Update bookings saat data Cosmos tiba
  useEffect(() => {
    if (cosmosBookingsData?.success && Array.isArray(cosmosBookingsData.bookings)) {
      const mapped = cosmosBookingsData.bookings.map(b => ({
        id: b.id,
        roomId: b.roomId,
        bookedBy: b.bookedBy ?? b.userId ?? "—",
        bookedById: b.bookedById ?? b.userId ?? "",
        bookedAt: new Date(b.createdAt ?? new Date()),
        startTime: b.startTime ?? b.sessionStart ?? "",
        endTime: b.endTime ?? b.sessionEnd ?? "",
        purpose: b.purpose ?? "",
        groupSize: b.groupSize ?? 0,
        status: b.status ?? "active",
        day: b.day ?? "",
      }));
      setBookings(mapped.filter(b => b.status === "active"));
    }
  }, [cosmosBookingsData]);

  // Saat data Cosmos tiba, set schedules
  useEffect(() => {
    if (!cosmosScheduleData?.success || !Array.isArray(cosmosScheduleData.schedules)) return;
    if (cosmosScheduleData.schedules.length === 0) {
      setAllSchedules([]);
      setSchedules([]);
      return;
    }

    // Konversi dokumen Cosmos ke ScheduleEntry
    const cosmosEntries: ScheduleEntry[] = cosmosScheduleData.schedules.map(c => ({
      id: c.id,
      room: c.roomId ?? c.room ?? "",
      day: c.day ?? "",
      start: c.startTime ?? c.sessionStart ?? c.start ?? "",
      end: c.endTime ?? c.sessionEnd ?? c.end ?? "",
    }));

    setAllSchedules(cosmosEntries);
    setSchedules(cosmosEntries);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cosmosScheduleData]);




  // ── Derived ──────────────────────────────────────
  const customIds = useMemo(() => new Set<string>(), []);

  // ── CRUD handlers ────────────────────────────────

  async function handleSave(data: ScheduleFormData, originalEntry?: ScheduleEntry) {
    const newEntry = {
      roomId: data.room.trim(),
      day: data.day,
      sessionStart: data.start,
      sessionEnd: data.end,
      scheduleStatus: "scheduled",
      isRescheduled: false,
    };

    setModalState({ open: false });

    try {
      if (modalState.open && modalState.mode === "edit" && originalEntry && (originalEntry as any).id) {
        // Update to Cosmos DB
        await fetch(`/api/schedules/${(originalEntry as any).id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEntry),
        });
        setSuccessMsg(`Jadwal di ruangan "${newEntry.roomId}" berhasil diperbarui.`);
      } else {
        // Insert to Cosmos DB
        await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newEntry),
        });
        setSuccessMsg(`Jadwal di ruangan "${newEntry.roomId}" berhasil ditambahkan.`);
      }

      // Refresh data (akan di-handle SWR polling tapi kita re-fetch manual juga bisa)
      fetch("/api/schedules")
        .then(res => res.json())
        .then(json => {
           if (Array.isArray(json)) {
             const cosmosEntries = json.map(c => ({
              id: c.id,
              room: c.roomId ?? c.room ?? "",
              day: c.day ?? "",
              start: c.sessionStart ?? c.start ?? "",
              end: c.sessionEnd ?? c.end ?? "",
            }));
            setAllSchedules(cosmosEntries);
            setSchedules(cosmosEntries);
           }
        });
        
    } catch (err) {
      console.error("[schedule] Gagal sync ke Cosmos:", err);
    }

    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleDelete(entry: ScheduleEntry) {
    setDeleteConfirm(null);
    if ((entry as any).id) {
      try {
        await fetch(`/api/schedules/${(entry as any).id}`, {
          method: "DELETE",
        });
        setAllSchedules(prev => prev.filter(s => (s as any).id !== (entry as any).id));
        setSchedules(prev => prev.filter(s => (s as any).id !== (entry as any).id));
        setSuccessMsg(`Jadwal di ruangan "${entry.room}" berhasil dihapus.`);
      } catch (err) {
        console.error("Gagal hapus jadwal dari Cosmos:", err);
      }
    }
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

  function isRoomOccupiedBySensor(roomId: string) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    const pirActive = room.pirSensor?.status === "active";
    const irHasPeople = (room.irSensor?.peopleCount ?? 0) > 0;
    return pirActive || irHasPeople;
  }

  const getBoxColor = useCallback((roomId: string, day: string, slot: typeof TIME_SLOTS[0]) => {
    if (!mounted) return { bg: "bg-slate-200 border-slate-300", label: slot.start, clickable: false };
    const sched = getScheduleForSlot(roomId, day, slot, schedules);
    const booking = getBookingForSlot(roomId, day, slot);
    const sensorOccupied = isRoomOccupiedBySensor(roomId);

    if (sched) return { bg: "bg-red-500 border-red-600", label: slot.start, clickable: false };
    if (sensorOccupied) return { bg: "bg-red-500 border-red-600", label: slot.start, clickable: false };
    if (booking) return { bg: "bg-slate-400 border-slate-500", label: slot.start, clickable: false };
    return { bg: "bg-emerald-500 border-emerald-600", label: slot.start, clickable: role === "mahasiswa" };
  }, [bookings, role, schedules, mounted, rooms]);

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
  // ADMIN/DOSEN VIEW — Timetable klasik + CRUD
  // ═══════════════════════════════════════════════════
  if (role === "admin") {
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
              <span className="font-black text-slate-800">Panduan Admin:</span>{" "}
              Pilih kelas untuk melihat timetable. Hover sel jadwal untuk aksi Edit/Hapus.
              Klik <span className="font-black text-[var(--color-primary)]">+ Tambah Jadwal</span> atau
              tombol <span className="font-black">+</span> di samping hari untuk menambah jadwal baru.
              Semua jadwal tersimpan di Cosmos DB.
            </p>
          </div>

          {/* CLASS SELECTOR + STATS */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="sm:ml-auto flex gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-300" />
                <span className="text-slate-500 font-bold">Jadwal Kelas</span>
              </div>
            </div>
          </div>

          {/* TIMETABLE */}
          <Timetable
            schedules={allSchedules}
            selectedClass=""
            editable={true}
            customIds={customIds}
            onAdd={(day) => setModalState({ open: true, mode: "add", day })}
            onEdit={(entry, isCustom) => setModalState({ open: true, mode: "edit", entry, isCustom })}
            onDelete={(entry) => setDeleteConfirm({ entry })}
          />



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
                Yakin hapus jadwal di ruangan <span className="font-black">{deleteConfirm.entry.room}</span>?
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
