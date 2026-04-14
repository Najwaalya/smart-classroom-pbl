"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type ActivityData = {
  time: string;
  value: number;
};

const data: ActivityData[] = [
  { time: "08:00", value: 5 },
  { time: "09:00", value: 12 },
  { time: "10:00", value: 18 },
];

export default function ActivityChart() {
  return (
    <div className="glass">
      <h3 className="font-semibold mb-2">Aktivitas Kelas</h3>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}