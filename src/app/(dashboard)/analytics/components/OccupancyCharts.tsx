"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface OccupancyData {
  time: string;
  occupancy: number;
}

interface Props {
  data: OccupancyData[];
}

export default function OccupancyChart({
  data,
}: Props) {

  return (
    <div className="
      bg-white rounded-2xl
      border border-slate-200
      p-6
    ">

      <h2 className="
        text-lg font-black
        text-slate-800 mb-6
      ">
        Okupansi Ruangan
      </h2>

      <div className="h-72">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <AreaChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis dataKey="time" />

            <YAxis />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="occupancy"
              stroke="var(--color-primary)"
              fill="var(--color-secondary)"
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>
    </div>
  );
}