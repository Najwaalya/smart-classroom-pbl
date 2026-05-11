import { Users } from "lucide-react";

export interface RoomStatusBadgeProps {
  status: "active" | "scheduled" | "uncertain" | "empty" | "booked";
  students: number;
}

export function RoomStatusBadge({ status, students }: RoomStatusBadgeProps) {
  const statusConfig = {
    active: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Aktif" },
    scheduled: { bg: "bg-blue-100", text: "text-blue-700", label: "Terjadwal" },
    uncertain: { bg: "bg-amber-100", text: "text-amber-700", label: "Ragu" },
    empty: { bg: "bg-slate-100", text: "text-slate-500", label: "Kosong" },
    booked: { bg: "bg-purple-100", text: "text-purple-700", label: "Dibooking" },
  };

  const config = statusConfig[status];

  return (
    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${config.bg} ${config.text}`}>
      <Users size={8} />
      {students}
    </span>
  );
}
