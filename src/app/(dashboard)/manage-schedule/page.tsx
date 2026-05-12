"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";
import {
  Plus, Trash2, Calendar, Clock, MapPin, Search,
  Filter, RefreshCw, Database, WifiOff,
} from "lucide-react";
import { DAYS } from "@/lib/schedule-utils";

interface Schedule {
  id: string;
  room: string;
  day: string;
  start: string;
  end: string;
  subject?: string;
  lecturer?: string;
  // Field Cosmos
  roomId?: string;
  classCode?: string;
  courseName?: string;
  sessionStart?: string;
  sessionEnd?: string;
  scheduleStatus?: string;
  _source?: "cosmos" | "local";
}

// Konversi dokumen Cosmos ke format Schedule lokal
function cosmosToSchedule(c: Record<string, string>): Schedule {
  return {
    id: c.id,
    room: c.roomId ?? c.room ?? "",
    day: c.day ?? "",
    start: c.sessionStart ?? c.start ?? "",
    end: c.sessionEnd ?? c.end ?? "",
    subject: c.courseName ?? c.subject ?? "",
    lecturer: c.lecturer ?? "",
    roomId: c.roomId,
    classCode: c.classCode,
    courseName: c.courseName,
    sessionStart: c.sessionStart,
    sessionEnd: c.sessionEnd,
    scheduleStatus: c.scheduleStatus,
    _source: "cosmos",
  };
}

export default function ManageSchedulePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDay, setFilterDay] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState<"online" | "offline" | "loading">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    room: "",
    day: "Monday",
    start: "",
    end: "",
    subject: "",
    lecturer: "",
  });

  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const role = getRole();
    if (role !== "admin") {
      router.replace("/");
    }
  }, [router]);

  // ── Load jadwal dari Cosmos ────────────────────────────────────────────────
  const loadSchedules = useCallback(async () => {
    setIsLoading(true);
    setDbStatus("loading");

    try {
      const res  = await fetch("/api/schedules");
      const data = await res.json();

      if (data.success && Array.isArray(data.schedules)) {
        // Cosmos berhasil - gunakan data dari Cosmos DB saja
        setDbStatus("online");
        const cosmosSchedules = data.schedules.map((s: any) => ({
          id: s.id,
          room: s.roomId || s.room || "",
          day: s.day || "",
          start: s.startTime || s.sessionStart || s.start || "",
          end: s.endTime || s.sessionEnd || s.end || "",
          subject: s.subject || s.courseName || "",
          lecturer: s.lecturer || "",
          roomId: s.roomId,
          classCode: s.class,
          courseName: s.subject,
          sessionStart: s.startTime,
          sessionEnd: s.endTime,
          scheduleStatus: s.scheduleStatus,
          _source: "cosmos" as const,
        }));
        
        console.log("[loadSchedules] Loaded schedules:", cosmosSchedules);
        
        setSchedules(cosmosSchedules);
        setDbStatus("online");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Load schedules error:", err);
      // Fallback: custom dari localStorage saja
      setDbStatus("offline");
      try {
        const stored = localStorage.getItem("customSchedules");
        const custom: Schedule[] = stored
          ? (JSON.parse(stored) as Partial<Schedule>[]).map((s, idx) => ({
              id: s.id ?? `custom-${Date.now()}-${idx}`,
              room: s.room ?? "",
              day: s.day ?? "Monday",
              start: s.start ?? "",
              end: s.end ?? "",
              subject: s.subject,
              lecturer: s.lecturer,
              _source: "local" as const,
            }))
          : [];
        setSchedules(custom);
      } catch {
        setSchedules([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      loadSchedules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // ── Tambah jadwal ─────────────────────────────────────────────────────────
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const payload = {
      roomId: formData.room,
      day: formData.day,
      startTime: formData.start,
      endTime: formData.end,
      subject: formData.subject,
      lecturer: formData.lecturer,
      class: "",
      semester: "Ganjil",
      academicYear: "2025/2026",
    };

    if (dbStatus === "online") {
      // Simpan ke Cosmos
      try {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Gagal menyimpan ke Cosmos");
        }

        setSuccessMsg(`Jadwal "${formData.subject || formData.room}" berhasil ditambahkan ke database.`);
        await loadSchedules(); // Reload dari DB
      } catch (err) {
        setErrorMsg(`Gagal menyimpan: ${err instanceof Error ? err.message : "Unknown error"}`);
        setIsSaving(false);
        return;
      }
    } else {
      // Fallback: simpan ke localStorage
      const newSchedule: Schedule = {
        id: `custom-${Date.now()}`,
        room: formData.room,
        day: formData.day,
        start: formData.start,
        end: formData.end,
        subject: formData.subject,
        lecturer: formData.lecturer,
        _source: "local",
      };
      const updated = [...schedules, newSchedule];
      const customOnly = updated.filter(s => s._source === "local");
      localStorage.setItem("customSchedules", JSON.stringify(customOnly));
      setSchedules(updated);
      setSuccessMsg("Jadwal disimpan secara lokal (Cosmos offline).");
    }

    setFormData({ room: "", day: "Monday", start: "", end: "", subject: "", lecturer: "" });
    setShowForm(false);
    setIsSaving(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ── Hapus jadwal ──────────────────────────────────────────────────────────
  const handleDeleteSchedule = async (schedule: Schedule) => {
    if (!confirm(`Yakin ingin menghapus jadwal "${schedule.subject || schedule.room}"?`)) return;

    if (schedule._source === "cosmos" && dbStatus === "online") {
      // Hapus dari Cosmos
      try {
        console.log("[handleDeleteSchedule] ========================================");
        console.log("[handleDeleteSchedule] Deleting schedule:", {
          id: schedule.id,
          room: schedule.room,
          subject: schedule.subject,
        });
        
        const res = await fetch(`/api/schedules?id=${encodeURIComponent(schedule.id)}`, { 
          method: "DELETE" 
        });
        
        const data = await res.json();
        
        console.log("[handleDeleteSchedule] Response status:", res.status);
        console.log("[handleDeleteSchedule] Response data:", data);
        console.log("[handleDeleteSchedule] ========================================");
        
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Gagal menghapus dari Cosmos");
        }
        
        setSuccessMsg("Jadwal berhasil dihapus dari database.");
        await loadSchedules();
      } catch (err) {
        console.error("[handleDeleteSchedule] ========================================");
        console.error("[handleDeleteSchedule] Error:", err);
        console.error("[handleDeleteSchedule] ========================================");
        
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        
        // Show user-friendly error message
        setErrorMsg(`Gagal menghapus jadwal: ${errorMessage}`);
        
        // Auto-hide error after 5 seconds
        setTimeout(() => setErrorMsg(null), 5000);
      }
    } else {
      // Hapus dari localStorage
      const updated = schedules.filter(s => s.id !== schedule.id);
      const customOnly = updated.filter(s => s._source === "local");
      localStorage.setItem("customSchedules", JSON.stringify(customOnly));
      setSchedules(updated);
      setSuccessMsg("Jadwal dihapus dari penyimpanan lokal.");
    }
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      const matchSearch =
        s.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.subject && s.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.lecturer && s.lecturer.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchDay = filterDay === "all" || s.day === filterDay;
      return matchSearch && matchDay;
    });
  }, [schedules, searchQuery, filterDay]);

  if (!mounted) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col gap-6 pb-12">
          <h1 className="text-3xl font-black text-slate-800">Kelola Jadwal</h1>
          <p className="text-sm text-slate-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  const cosmosCount  = schedules.filter(s => s._source === "cosmos").length;
  const localCount   = schedules.filter(s => s._source === "local").length;

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Kelola Jadwal Perkuliahan
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tambah, edit, atau hapus jadwal kelas untuk semester baru
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSchedules()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-60"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-black text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30"
            >
              <Plus size={18} />
              Tambah Jadwal
            </button>
          </div>
        </div>

        {/* DB STATUS BADGE */}
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border ${
          dbStatus === "online"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : dbStatus === "offline"
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "bg-slate-50 border-slate-200 text-slate-500"
        }`}>
          {dbStatus === "online" ? (
            <><Database size={14} /> Terhubung ke Cosmos DB — menampilkan data real</>
          ) : dbStatus === "offline" ? (
            <><WifiOff size={14} /> Cosmos DB offline — menampilkan data lokal sebagai fallback</>
          ) : (
            <><RefreshCw size={14} className="animate-spin" /> Menghubungkan ke database...</>
          )}
        </div>

        {/* TOAST */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm font-bold text-emerald-700 anim-scale-in">
            ✅ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-sm font-bold text-red-700 anim-scale-in">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ADD FORM */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 anim-scale-in">
            <h2 className="text-xl font-black text-slate-800 mb-4">Tambah Jadwal Baru</h2>
            <form onSubmit={handleAddSchedule} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Room */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Ruangan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Contoh: RT04_5B"
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Day */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Hari *
                  </label>
                  <select
                    required
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DAYS.map(d => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Waktu Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* End Time */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Waktu Selesai *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Mata Kuliah (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Contoh: Pemrograman Web"
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Lecturer */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                    Dosen (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.lecturer}
                    onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
                    placeholder="Contoh: Dr. Budi Santoso"
                    className="px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-black hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-60"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ruangan, mata kuliah, atau dosen..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="pl-12 pr-8 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">Semua Hari</option>
              {DAYS.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
            <p className="text-xs font-black text-blue-600 uppercase tracking-wider">Total Jadwal</p>
            <p className="text-3xl font-black text-blue-700 mt-1">{schedules.length}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
            <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">
              {dbStatus === "online" ? "Dari Cosmos DB" : "Jadwal Lokal"}
            </p>
            <p className="text-3xl font-black text-emerald-700 mt-1">
              {dbStatus === "online" ? cosmosCount : localCount}
            </p>
          </div>
        </div>

        {/* SCHEDULE TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <RefreshCw size={24} className="animate-spin mr-3" />
              Mengambil data dari database...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Ruangan</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Hari</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Waktu</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Mata Kuliah</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Dosen</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Sumber</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                        Tidak ada jadwal ditemukan
                      </td>
                    </tr>
                  ) : (
                    filteredSchedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-400" />
                            <span className="text-sm font-black text-slate-800">{schedule.room}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {DAYS.find(d => d.key === schedule.day)?.label || schedule.day}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {schedule.start} - {schedule.end}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{schedule.subject || "-"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{schedule.lecturer || "-"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-black ${
                            schedule._source === "cosmos"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {schedule._source === "cosmos" ? "Cosmos DB" : "Lokal"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteSchedule(schedule)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus jadwal"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
