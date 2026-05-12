"use client";

import {
  Users,
  Thermometer,
  Droplets,
} from "lucide-react";

interface Sensor {
  id: string;
  roomId: string;
  temperature: number;
  humidity: number;
  peopleCount: number;
  motionCount: number;
  motionDuration: number;
  roomStatus: string;
  ledStatus: string;
  timestamp: string;
}

interface Props {
  sensors: Sensor[];
}

export default function KPICards({
  sensors,
}: Props) {

  const totalStudents =
    sensors.reduce(
      (sum, item) =>
        sum + (item.peopleCount || 0),
      0
    );

  const avgTemp =
    sensors.length > 0
      ? (
          sensors.reduce(
            (sum, item) =>
              sum + (item.temperature || 0),
            0
          ) / sensors.length
        ).toFixed(1)
      : "0";

  const avgHumidity =
    sensors.length > 0
      ? (
          sensors.reduce(
            (sum, item) =>
              sum + (item.humidity || 0),
            0
          ) / sensors.length
        ).toFixed(1)
      : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* STUDENTS */}
      <div className="
        bg-white rounded-2xl p-5
        border border-slate-200
      ">
        <div className="flex items-center gap-3">

          <div className="
            w-12 h-12 rounded-xl
            bg-blue-100
            flex items-center justify-center
          ">
            <Users className="text-blue-600" />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Total Mahasiswa
            </p>

            <h2 className="
              text-3xl font-black
              text-slate-800
            ">
              {totalStudents}
            </h2>
          </div>
        </div>
      </div>

      {/* TEMP */}
      <div className="
        bg-white rounded-2xl p-5
        border border-slate-200
      ">
        <div className="flex items-center gap-3">

          <div className="
            w-12 h-12 rounded-xl
            bg-red-100
            flex items-center justify-center
          ">
            <Thermometer className="text-red-500" />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Rata-rata Suhu
            </p>

            <h2 className="
              text-3xl font-black
              text-slate-800
            ">
              {avgTemp}°C
            </h2>
          </div>
        </div>
      </div>

      {/* HUMIDITY */}
      <div className="
        bg-white rounded-2xl p-5
        border border-slate-200
      ">
        <div className="flex items-center gap-3">

          <div className="
            w-12 h-12 rounded-xl
            bg-cyan-100
            flex items-center justify-center
          ">
            <Droplets className="text-cyan-600" />
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Rata-rata Kelembapan
            </p>

            <h2 className="
              text-3xl font-black
              text-slate-800
            ">
              {avgHumidity}%
            </h2>
          </div>
        </div>
      </div>

    </div>
  );
}