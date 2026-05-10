"use client";

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  badge: string;
  borderColor: string;
  badgeColor: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  badge,
  borderColor,
  badgeColor,
}: MetricCardProps) {
  return (
    <div
      className={`glass-panel p-6 flex flex-col gap-4 border-l-[4px] ${borderColor}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-inner">
          {icon}
        </div>

        <span
          className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${badgeColor}`}
        >
          {badge}
        </span>
      </div>

      <div>
        <div className="text-3xl font-black text-slate-800">{value}</div>

        <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wide">
          {title}
        </div>
      </div>
    </div>
  );
}