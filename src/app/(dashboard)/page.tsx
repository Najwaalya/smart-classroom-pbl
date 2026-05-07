"use client";

import { useMemo, useState } from "react";

import { Activity, Wind, ShieldAlert } from "lucide-react";

import { useRoomData } from "@/contexts/RoomDataContext";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import SearchFilter from "@/components/dashboard/SearchFilter";
import RoomCard from "@/components/dashboard/RoomCard";

export default function Dashboard() {
  const { rooms } = useRoomData();

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "all" | "active" | "empty" | "uncertain"
  >("all");

  const { activeCount, uncertainCount, emptyCount, filteredRooms } =
    useMemo(() => {
      const activeData = rooms.filter((r) => r.status === "active");

      const uncertainData = rooms.filter(
        (r) => r.status === "uncertain"
      );

      const emptyData = rooms.filter((r) => r.status === "empty");

      const filtered = rooms.filter((r) => {
        const matchSearch =
          r.id.toLowerCase().includes(search.toLowerCase()) ||
          (r.wing || "")
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchFilter =
          filter === "all" || r.status === filter;

        return matchSearch && matchFilter;
      });

      return {
        activeCount: activeData.length,
        uncertainCount: uncertainData.length,
        emptyCount: emptyData.length,
        filteredRooms: filtered,
      };
    }, [rooms, search, filter]);

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-6 pb-12">

        <DashboardHeader />

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Kelas Aktif"
            value={activeCount}
            icon={<Activity size={20} />}
            badge="DIGUNAKAN"
            borderColor="border-l-emerald-500"
            badgeColor="bg-emerald-50 text-emerald-600"
          />

          <MetricCard
            title="Kelas Kosong"
            value={emptyCount}
            icon={<Wind size={20} />}
            badge="TIDAK DIGUNAKAN"
            borderColor="border-l-slate-300"
            badgeColor="bg-slate-100 text-slate-500"
          />

          <MetricCard
            title="Status Tidak Pasti"
            value={uncertainCount}
            icon={<ShieldAlert size={20} />}
            badge="CEK MANUAL"
            borderColor="border-l-amber-400"
            badgeColor="bg-amber-50 text-amber-600"
          />
        </div>

        {/* SEARCH */}
        <SearchFilter
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
        />

        {/* ROOM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
}