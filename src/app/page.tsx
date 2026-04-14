"use client";

import { classes } from "../lib/mockData";
import { getStatus } from "../lib/utils";
import ClassCard from "../components/ClassCard";

export default function Home() {
  const totalPeople = classes.reduce((sum, c) => sum + c.people, 0);
  const active = classes.filter(c => getStatus(c.people) === "Aktif").length;
  const empty = classes.filter(c => getStatus(c.people) === "Kosong").length;
  const uncertain = classes.filter(c => getStatus(c.people) === "Tidak Pasti").length;

  return (
    <div className="flex min-h-screen">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white p-6 border-r">
        <h1 className="text-xl font-bold text-blue-600 mb-8">
          ClassTrack
        </h1>

        <div className="space-y-3 text-sm">
          <p className="text-blue-600 font-semibold">Overview</p>
          <p className="text-gray-500">Analytics</p>
          <p className="text-gray-500">Logs</p>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 max-w-7xl mx-auto">

        {/* TOP INFO */}
        <div className="flex justify-between mb-6">
          <p className="text-sm text-gray-500">
            🟢 Live Sync Active · 98% Sensor Health
          </p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <Stat title="Total Occupancy" value={totalPeople} color="blue" />
          <Stat title="Active Classes" value={active} color="green" />
          <Stat title="Empty Classes" value={empty} color="red" />
          <Stat title="Uncertain" value={uncertain} color="yellow" />
        </div>

        {/* TITLE */}
        <h2 className="text-lg font-semibold mb-4">
          Campus Facility Overview
        </h2>

        {/* CLASS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(c => (
            <ClassCard key={c.id} data={c} />
          ))}
        </div>

      </main>
    </div>
  );
}

/* ===== STAT CARD ===== */
function Stat({
  title,
  value,
  color
}: {
  title: string;
  value: number;
  color: "blue" | "green" | "red" | "yellow";
}) {
  const colorMap = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-500",
    yellow: "text-yellow-500"
  };

  return (
    <div className="card">
      <p className="text-xs text-gray-400 mb-2">{title}</p>
      <h2 className={`text-3xl font-bold ${colorMap[color]}`}>
        {value}
      </h2>
    </div>
  );
}