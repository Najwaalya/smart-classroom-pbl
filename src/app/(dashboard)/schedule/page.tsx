"use client";
"use no memo";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { useRoomData } from "@/contexts/RoomDataContext";
import {
  Info, CheckCircle, Plus, CalendarDays, Trash2
} from "lucide-react";
import {
  DAYS, FLOORS, TIME_SLOTS, sessionToTime, FLOOR_SUFFIX,
} from "@/lib/schedule-utils";
import { ScheduleEntry } from "@/lib/schedule";
import { Timetable } from "@/components/schedule/Timetable";
import ScheduleCRUDModal, { ScheduleFormData } from "@/components/schedule/ScheduleCRUDModal";
import { getRole } from "@/lib/auth";

type ModalState =
  | { open: false }
  | { open: true; mode: "add"; day: string }
  | { open: true; mode: "edit"; entry: ScheduleEntry; isCustom: boolean };

type DeleteConfirm = { entry: ScheduleEntry } | null;

export default function SchedulePage() {
  const { rooms } = useRoomData();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const isAdmin = role === "admin" || role === "dosen";

  // ── STATE ──────────────────────────────────
  const [allSchedules, setAllSchedules] = useState<ScheduleEntry[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedFloor, setSelectedFloor] = useState<string>("5");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // ── SWR ──────────────────────────────────────────
  const swrFetcher = (url: string) => fetch(url).then(r => r.json());

  interface SchedulesApiResponse {
    success: boolean;
    schedules: Record<string, unknown>[];
  }

  const { data: cosmosScheduleData, mutate: mutateSchedules } = useSWR<SchedulesApiResponse>(
    "/api/schedules", swrFetcher, { refreshInterval: 30000 }
  );

  // ── Mount: hanya set mounted ──────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Init role ───────
  useEffect(() => {
    if (!mounted) return;
    setRole(getRole());
  }, [mounted]);

  // ── Update schedules saat data Cosmos tiba ────────
  useEffect(() => {
    if (!cosmosScheduleData?.success || !Array.isArray(cosmosScheduleData.schedules)) return;
    if (cosmosScheduleData.schedules.length === 0) {
      setAllSchedules([]);
      return;
    }
    const cosmosEntries: ScheduleEntry[] = cosmosScheduleData.schedules.map(c => {
      const startNum = Number(c.sessionStart);
      const endNum   = Number(c.sessionEnd);

      const convertedStart = (!isNaN(startNum) && startNum > 0) ? sessionToTime(startNum) : null;
      const convertedEnd = (!isNaN(endNum) && endNum > 0) ? sessionToTime(endNum) : null;

      return {
        id:    String(c.id ?? ""),
        room:  String(c.roomId ?? c.room ?? ""),
        class: String(c.className ?? c.class ?? c.subject ?? ""),
        day:   String(c.day ?? ""),
        start: convertedStart?.startTime ?? String(c.startTime ?? c.start ?? ""),
        end:   convertedEnd?.endTime     ?? String(c.sessionEnd ?? c.endTime ?? c.end ?? ""),
      };
    });
    setAllSchedules(cosmosEntries);
  }, [cosmosScheduleData, rooms]);

  // ── Derived ──────────────────────────────────────
  const customIds = useMemo(() => new Set<string>(), []);

  const roomsOnFloor = useMemo(() => {
    const suffixes = FLOOR_SUFFIX[selectedFloor] ?? [];
    const seen = new Set<string>();
    rooms.forEach(r => {
      const roomName: string = r.roomId || r.id || r.roomName || "";
      if (!roomName) return;
      const matchesSuffix = suffixes.some((sfx: string) => roomName.endsWith(sfx));
      const matchesFallback = !matchesSuffix &&
        (roomName.includes(`-${selectedFloor}`) || roomName.includes(`_${selectedFloor}`));
      if (matchesSuffix || matchesFallback) seen.add(roomName);
    });
    return Array.from(seen).sort();
  }, [rooms, selectedFloor]);

  useEffect(() => {
    if (selectedRoom && !roomsOnFloor.includes(selectedRoom)) {
      setSelectedRoom(roomsOnFloor[0] ?? null);
    } else if (!selectedRoom && roomsOnFloor.length > 0) {
      setSelectedRoom(roomsOnFloor[0]);
    }
  }, [roomsOnFloor, selectedRoom]);

  const filteredSchedules = useMemo(() => {
    if (!selectedRoom) return [];
    return allSchedules.filter(s => (s.roomId || s.room) === selectedRoom);
  }, [allSchedules, selectedRoom]);

  // ── CRUD handlers ────────────────────────────────
  async function handleSave(data: ScheduleFormData, originalEntry?: ScheduleEntry) {
    const dayLabel = DAYS.find(d => d.key === data.day || d.label === data.day)?.label ?? data.day;
    const startSlotObj = TIME_SLOTS.find(ts => ts.start === data.start);
    const endSlotObj = TIME_SLOTS.find(ts => ts.end === data.end);
    const startSlot = startSlotObj ? startSlotObj.slot : 1;
    const endSlot = endSlotObj ? endSlotObj.slot : startSlot;

    const matchedRoom = rooms.find(r => r.id === data.room || r.roomId === data.room || r.roomName === data.room);
    const resolvedRoomId = matchedRoom ? (matchedRoom.roomId ?? matchedRoom.id) : data.room;

    const payload = {
      day: dayLabel,
      roomId: resolvedRoomId.trim(),
      className: data.className.trim(),
      startSlot,
      endSlot,
    };

    try {
      if (modalState.open && modalState.mode === "edit" && originalEntry && (originalEntry as ScheduleEntry & { id?: string }).id) {
        const id = (originalEntry as ScheduleEntry & { id: string }).id;
        const res = await fetch(`/api/schedules/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message ?? "Gagal memperbarui jadwal");
        }
        setSuccessMsg(`Jadwal di ruangan "${payload.roomId}" berhasil diperbarui.`);
      } else {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.message ?? "Gagal menambah jadwal");
        }
        setSuccessMsg(`Jadwal di ruangan "${payload.roomId}" berhasil ditambahkan.`);
      }

      await mutateSchedules();
      setModalState({ open: false });
    } catch (err) {
      console.error("[schedule] Gagal sync ke Cosmos:", err);
      setError(String((err as any)?.message ?? "Gagal menyimpan perubahan"));
    }

    setTimeout(() => setSuccessMsg(null), 3000);
  }

  async function handleDelete(entry: ScheduleEntry) {
    setDeleteConfirm(null);
    const entryWithId = entry as ScheduleEntry & { id?: string };
    if (entryWithId.id) {
      try {
        await fetch(`/api/schedules/${entryWithId.id}`, { method: "DELETE" });
        await mutateSchedules();
        setSuccessMsg(`Jadwal di ruangan "${entry.room}" berhasil dihapus.`);
      } catch (err) {
        console.error("Gagal hapus jadwal dari Cosmos:", err);
      }
    }
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  // ── Loading ───────────────────────────────────────
  if (!mounted) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col gap-6 pb-12">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal Perkuliahan</h1>
          <p className="text-sm text-slate-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // UNIFIED VIEW
  // ═══════════════════════════════════════════════════
  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal Perkuliahan</h1>
            <p className="text-sm text-slate-500 mt-1">
              {isAdmin
                ? "Kelola dan pantau jadwal kelas — Politeknik Negeri Malang"
                : "Lihat jadwal kelas per ruangan — Politeknik Negeri Malang"}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setModalState({ open: true, mode: "add", day: "Monday" })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-white text-sm font-black hover:from-[var(--color-primary-dark)] hover:to-blue-600 transition-all shadow-lg shadow-blue-900/20"
              >
                <Plus size={15} />
                Tambah Jadwal
              </button>
            </div>
          )}
        </div>

        {successMsg && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 anim-scale-in">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <p className="text-sm font-bold text-emerald-800">{successMsg}</p>
          </div>
        )}

        {isAdmin && (
          <div className="flex items-start gap-3 p-4 bg-[var(--color-primary)]/5 rounded-2xl border border-[var(--color-primary)]/15">
            <Info size={15} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-black text-slate-800">Panduan Admin:</span>{" "}
              Pilih lantai dan ruangan untuk melihat timetable. Hover sel jadwal untuk aksi Edit/Hapus.
              Klik <span className="font-black text-[var(--color-primary)]">+ Tambah Jadwal</span> untuk menambah jadwal baru.
              Semua jadwal tersimpan di Cosmos DB.
            </p>
          </div>
        )}

        {/* ── Filter Lantai & Ruangan ───────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lantai</span>
            <div className="flex bg-white/70 p-1 rounded-xl shadow-sm border border-slate-200 gap-0.5">
              {FLOORS.map(f => (
                <button
                  key={f}
                  onClick={() => {
                    setSelectedFloor(f);
                    setSelectedRoom(null);
                  }}
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

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruangan</span>
            {roomsOnFloor.length > 0 ? (
              <div className="flex bg-white/70 p-1 rounded-xl shadow-sm border border-slate-200 gap-0.5 flex-wrap">
                {roomsOnFloor.map(room => (
                  <button
                    key={room}
                    onClick={() => setSelectedRoom(room)}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                      selectedRoom === room
                        ? "bg-[var(--color-primary)] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Tidak ada jadwal di lantai ini.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-primary)]/40 border border-[var(--color-primary)]" />
            <span className="text-slate-500 font-bold">Jadwal Kelas</span>
          </div>
        </div>

        {/* ── Timetable atau placeholder ────────────── */}
        {selectedRoom ? (
          <Timetable
            schedules={filteredSchedules}
            selectedClass=""
            editable={isAdmin}
            customIds={customIds}
            onAdd={(day) => setModalState({ open: true, mode: "add", day })}
            onEdit={(entry, isCustom) => setModalState({ open: true, mode: "edit", entry, isCustom })}
            onDelete={(entry) => setDeleteConfirm({ entry })}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60">
            <CalendarDays size={36} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-400">Pilih lantai dan ruangan untuk melihat jadwal</p>
          </div>
        )}
      </div>

      {modalState.open && (
        <ScheduleCRUDModal
          mode={modalState.mode}
          initialDay={modalState.mode === "add" ? modalState.day : undefined}
          initialData={
            modalState.mode === "edit"
              ? modalState.entry
              : selectedRoom
                ? { room: selectedRoom, day: modalState.day, start: "", end: "", className: "" } as any
                : undefined
          }
          allSchedules={allSchedules}
          onSave={handleSave}
          onClose={() => setModalState({ open: false })}
          onRequestDelete={(entry) => setDeleteConfirm({ entry })}
          onDeleted={async () => {
            await mutateSchedules();
          }}
        />
      )}

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