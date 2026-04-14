"use client";

import { ClassData } from "../types/class";
import { getStatus, getStatusColor } from "../lib/utils";

type Props = {
  data: ClassData;
};

export default function ClassCard({ data }: Props) {
  const status = getStatus(data.people);
  const statusClassName = getStatusColor(status);

  return (
    <div className="card hover:shadow-md transition">
      {/* STATUS */}
      <span className={`badge ${statusClassName}`}>
        {status}
      </span>

      {/* NAME */}
      <h3 className="mt-4 font-semibold text-gray-700">
        {data.name}
      </h3>

      {/* PEOPLE */}
      <div className="flex justify-between items-end mt-4">
        <h2 className="text-4xl font-bold text-blue-600">
          {data.people}
        </h2>
        <p className="text-xs text-gray-400">orang</p>
      </div>

      {/* INFO */}
      <div className="flex justify-between mt-5 text-sm text-gray-500">
        <p>🌡 {data.temp}°C</p>
        <p>{data.pir ? "🟢 Aktif" : "⚪ Idle"}</p>
      </div>
    </div>
  );
}