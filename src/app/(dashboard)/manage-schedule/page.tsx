"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";
import { Plus, Trash2, Calendar, Clock, MapPin, Search, Filter } from "lucide-react";
import { schedules as defaultSchedules } from "@/lib/schedule";
import { DAYS } from "@/lib/schedule-utils";

interface Schedule {
  id: string;
  room: string;
  day: string;
  start: string;
  end: string;
  subject?: string;
  lecturer?: string;
}

export default function ManageSchedulePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDay, setFilterDay] = useState<string>("all");
  
  // Form state
  const [formData, setFormData] = useState({
    room: "",
    day: "Monday",
    start: "",
    end: "",
    subject: "",
    lecturer: "",
  });

  // Check auth
  useEffect(() => {
    setMounted(true);
    const role = getRole();
    // Hanya dosen yang bisa akses kelola jadwal
    if (role !== "dosen") {
      router.replace("/");
    }
  }, [router]);

  // Load schedules from localStorage
  useEffect(() => {
    if (!mounted) return;
    
    try {
      const defaultList: Schedule[] = defaultSchedules.map((s, idx) => ({
        id: `default-${idx}`,
        ...s,
      }));

      const stored = localStorage.getItem("customSchedules");
      if (stored) {
        const raw = JSON.parse(stored) as Partial<Schedule>[];
        // Pastikan setiap custom entry punya field id (bisa tidak ada jika disimpan sistem baru)
        const custom: Schedule[] = raw.map((s, idx) => ({
          id: s.id ?? `custom-${Date.now()}-${idx}`,
          room: s.room ?? "",
          day: s.day ?? "Monday",
          start: s.start ?? "",
          end: s.end ?? "",
          subject: s.subject,
          lecturer: s.lecturer,
        }));
        setSchedules([...defaultList, ...custom]);
      } else {
        setSchedules(defaultList);
      }
    } catch (err) {
      console.error("Failed to load schedules:", err);
    }
  }, [mounted]);

  // Save custom schedules to localStorage
  const saveSchedules = (newSchedules: Schedule[]) => {
    const customOnly = newSchedules.filter(s => !s.id?.startsWith("default-"));
    localStorage.setItem("customSchedules", JSON.stringify(customOnly));
    setSchedules(newSchedules);
  };

  // Add new schedule
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newSchedule: Schedule = {
      id: `custom-${Date.now()}`,
      room: formData.room,
      day: formData.day,
      start: formData.start,
      end: formData.end,
      subject: formData.subject,
      lecturer: formData.lecturer,
    };

    const updated = [...schedules, newSchedule];
    saveSchedules(updated);

    // Reset form
    setFormData({
      room: "",
      day: "Monday",
      start: "",
      end: "",
      subject: "",
      lecturer: "",
    });
    setShowForm(false);
  };

  // Delete schedule
  const handleDeleteSchedule = (id: string) => {
    if (id?.startsWith("default-")) {
      alert("Tidak bisa menghapus jadwal default. Hanya jadwal custom yang bisa dihapus.");
      return;
    }

    if (confirm("Yakin ingin menghapus jadwal ini?")) {
      const updated = schedules.filter(s => s.id !== id);
      saveSchedules(updated);
    }
  };

  // Filter schedules
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
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-black text-sm hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30"
          >
            <Plus size={18} />
            Tambah Jadwal
          </button>
        </div>

        {/* INFO */}
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-black">💡 Info:</span> Jadwal yang ditambahkan akan tersimpan dan digunakan untuk semester berjalan. 
            Setiap 6 bulan atau naik semester, Anda dapat menambahkan jadwal baru atau menghapus jadwal lama.
          </p>
        </div>

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
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-black hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FILTERS */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
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

          {/* Filter Day */}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
            <p className="text-xs font-black text-blue-600 uppercase tracking-wider">Total Jadwal</p>
            <p className="text-3xl font-black text-blue-700 mt-1">{schedules.length}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
            <p className="text-xs font-black text-emerald-600 uppercase tracking-wider">Jadwal Custom</p>
            <p className="text-3xl font-black text-emerald-700 mt-1">
              {schedules.filter(s => s.id?.startsWith("custom-")).length}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
            <p className="text-xs font-black text-purple-600 uppercase tracking-wider">Jadwal Default</p>
            <p className="text-3xl font-black text-purple-700 mt-1">
              {schedules.filter(s => s.id?.startsWith("default-")).length}
            </p>
          </div>
        </div>

        {/* SCHEDULE TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                    Ruangan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                    Hari
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                    Mata Kuliah
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                    Dosen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase tracking-wider">
                    Aksi
                  </th>
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
                        <span className="text-sm text-slate-600">
                          {schedule.subject || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {schedule.lecturer || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-black ${
                          schedule.id?.startsWith("custom-")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {schedule.id?.startsWith("custom-") ? "Custom" : "Default"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {schedule.id?.startsWith("custom-") ? (
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus jadwal"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
