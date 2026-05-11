export interface StatsCardsProps {
  kosong: number;
  jadwal: number;
  terbooked: number;
}

export function StatsCards({ kosong, jadwal, terbooked }: StatsCardsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { label: "Slot Kosong",  value: kosong,    color: "bg-emerald-500" },
        { label: "Ada Jadwal",   value: jadwal,    color: "bg-red-500" },
        { label: "Terbooked",    value: terbooked, color: "bg-blue-600" },
      ].map(s => (
        <div key={s.label} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className={`w-3 h-3 rounded-sm ${s.color} shrink-0`} />
          <span className="text-xs font-black text-slate-700">{s.value}</span>
          <span className="text-[10px] font-bold text-slate-400">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
