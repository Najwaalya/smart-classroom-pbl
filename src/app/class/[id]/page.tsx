"use client";

import { useParams } from "next/navigation";
import { classes } from "../../../lib/mockData";
import { getStatus } from "../../../lib/utils";
import { ClassData } from "../../../types/class";

export default function DetailPage() {
  const params = useParams();

  // id dari URL itu string → harus di-convert ke number
  const id = Number(params.id);

  const data: ClassData | undefined = classes.find(
    (c) => c.id === id
  );

  if (!data) {
    return <p>Data tidak ditemukan</p>;
  }

  const status = getStatus(data.people);

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">{data.name}</h1>

      <div className="glass">
        <h2>👥 {data.people} orang</h2>
        <p>Status: {status}</p>
        <p>🌡️ Suhu: {data.temp}°C</p>
        <p>
          🕺 PIR: {data.pir ? "Ada Gerakan" : "Tidak Ada"}
        </p>
      </div>

      <div className="glass mt-5">
        <h3 className="font-semibold">Log Aktivitas</h3>
        <ul>
          <li>10:00 - 5 orang masuk</li>
          <li>10:30 - 2 orang keluar</li>
        </ul>
      </div>
    </div>
  );
}