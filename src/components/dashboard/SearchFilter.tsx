"use client";

import { Search } from "lucide-react";

interface SearchFilterProps {
  search: string;
  setSearch: (value: string) => void;

  filter: "all" | "active" | "scheduled" | "uncertain" | "empty" | "booked";
  setFilter: (
    value: "all" | "active" | "scheduled" | "uncertain" | "empty" | "booked"
  ) => void;
}

export default function SearchFilter({
  search,
  setSearch,
  filter,
  setFilter,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
      <div className="flex bg-white/60 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-white/50 overflow-x-auto">
        {(["all", "active", "scheduled", "uncertain", "empty", "booked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${
              filter === f
                ? "bg-white text-[var(--color-primary)] shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            {f === "all"
              ? "SEMUA"
              : f === "active"
              ? "ACTIVE"
              : f === "scheduled"
              ? "SCHEDULED"
              : f === "uncertain"
              ? "UNCERTAIN"
              : f === "empty"
              ? "EMPTY"
              : "BOOKED"}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-72">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          size={16}
        />

        <input
          type="text"
          placeholder="Cari ruangan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white/70 backdrop-blur-md rounded-xl text-sm font-semibold border border-white outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      </div>
    </div>
  );
}
