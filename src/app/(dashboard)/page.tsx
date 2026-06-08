"use client";

import { useMemo, useState } from "react";
import { Search, Activity, Wind, ShieldAlert, CalendarDays, Bookmark, Loader2 } from "lucide-react";
import { useRoomData } from "@/contexts/RoomDataContext";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import SearchFilter from "@/components/dashboard/SearchFilter";
import RoomCard from "@/components/dashboard/RoomCard";

export default function Dashboard() {
  const { rooms, isLoading, error } = useRoomData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "scheduled" | "uncertain" | "empty" | "booked">("all");

  const {
    activeCount,
    scheduledCount,
    uncertainCount,
    emptyCount,
    bookedCount,
    filteredRooms,
  } = useMemo(() => {
    const normalizedStatus = (status: unknown) =>
      String(status ?? "").toUpperCase();

    const filtered = rooms.filter((r) => {
      const roomStatus = normalizedStatus(r.status);
      const matchSearch =
        (r.name ?? r.id).toLowerCase().includes(search.toLowerCase()) ||
        (r.wing || "").toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "active" && roomStatus === "ACTIVE") ||
        (filter === "scheduled" && roomStatus === "SCHEDULED") ||
        (filter === "uncertain" && roomStatus === "UNCERTAINED") ||
        (filter === "empty" && roomStatus === "EMPTY") ||
        (filter === "booked" && roomStatus === "BOOKED");
      return matchSearch && matchFilter;
    });

    return {
      activeCount: rooms.filter((r) => normalizedStatus(r.status) === "ACTIVE").length,
      scheduledCount: rooms.filter((r) => normalizedStatus(r.status) === "SCHEDULED").length,
      uncertainCount: rooms.filter((r) => normalizedStatus(r.status) === "UNCERTAINED").length,
      emptyCount: rooms.filter((r) => normalizedStatus(r.status) === "EMPTY").length,
      bookedCount: rooms.filter((r) => normalizedStatus(r.status) === "BOOKED").length,
      filteredRooms: filtered,
    };
  }, [rooms, search, filter]);

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-6 pb-12">
        <DashboardHeader />

        {isLoading ? (
          <div className="glass-panel p-14 text-center border border-slate-200 shadow-sm">
            <Loader2 size={42} className="mx-auto animate-spin text-[var(--color-primary)] mb-4" />
            <h3 className="text-2xl font-bold text-slate-800">Memuat data ruangan RT...</h3>
            <p className="text-slate-500 mt-2">Sedang mengambil data real-time dari Azure Cosmos DB. Mohon tunggu.</p>
          </div>
        ) : (
          <>
            {/* METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <MetricCard
                title="ACTIVE CLASS"
                value={activeCount}
                icon={<Activity size={20} />}
                badge="ACTIVE"
                borderColor="border-l-emerald-500"
                badgeColor="bg-emerald-50 text-emerald-600"
              />

              <MetricCard
                title="SCHEDULED CLASS"
                value={scheduledCount}
                icon={<CalendarDays size={20} />}
                badge="SCHEDULED"
                borderColor="border-l-sky-500"
                badgeColor="bg-sky-50 text-sky-700"
              />

              <MetricCard
                title="UNCERTAIN CLASS"
                value={uncertainCount}
                icon={<ShieldAlert size={20} />}
                badge="UNCERTAIN"
                borderColor="border-l-amber-400"
                badgeColor="bg-amber-50 text-amber-700"
              />

              <MetricCard
                title="EMPTY CLASS"
                value={emptyCount}
                icon={<Wind size={20} />}
                badge="EMPTY"
                borderColor="border-l-slate-300"
                badgeColor="bg-slate-100 text-slate-600"
              />

              <MetricCard
                title="BOOKED CLASS"
                value={bookedCount}
                icon={<Bookmark size={20} />}
                badge="BOOKED"
                borderColor="border-l-violet-500"
                badgeColor="bg-violet-50 text-violet-700"
              />
            </div>

            {/* SEARCH */}
            <SearchFilter
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
            />

            {error ? (
              <div className="glass-panel p-8 border border-amber-200 bg-amber-50 text-amber-700">
                <h3 className="text-lg font-bold">Gagal memuat data</h3>
                <p className="text-sm mt-2">{error}</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 glass-panel">
                <Search size={48} className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-600">Tidak ada data ruangan ditemukan di database</h3>
                <p className="text-slate-400 text-sm mt-1">Sesuaikan filter atau cek kembali koneksi ke database.</p>
                <button
                  onClick={() => { setSearch(""); setFilter("all"); }}
                  className="mt-6 px-6 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
