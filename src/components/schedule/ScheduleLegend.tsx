export function ScheduleLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
      <span className="text-slate-400 uppercase tracking-widest">Keterangan:</span>
      {[
        { color: "bg-emerald-500", label: "Kosong" },
        { color: "bg-red-500",     label: "Ada jadwal kelas / Terbooked" },
        { color: "bg-slate-400",   label: "Booking orang lain" },
      ].map(l => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className={`w-3.5 h-3.5 rounded-sm ${l.color} inline-block shrink-0`} />
          {l.label}
        </span>
      ))}
    </div>
  );
}
