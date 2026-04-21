"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LineChart, History, X } from "lucide-react";
import { useRoomData } from "@/contexts/RoomDataContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { name: "Ringkasan", href: "/",          icon: LayoutDashboard },
  { name: "Analitik",  href: "/analytics", icon: LineChart },
  { name: "Riwayat",   href: "/logs",      icon: History },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { dbStatus } = useRoomData();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-64px)] lg:z-10 lg:bg-transparent lg:backdrop-blur-none lg:shadow-none
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 lg:hidden">
          <span className="text-[var(--color-primary)] font-black text-xl">ClassTrack</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-all"
            aria-label="Tutup menu navigasi"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-8 flex flex-col flex-1">
          <h2 className="text-[var(--color-primary)] font-black text-lg leading-tight mb-1 hidden lg:block">
            Pusat Global
          </h2>
          <p className="text-[10px] text-slate-400 font-bold mb-8 uppercase tracking-widest hidden lg:block">
            Pemantauan Langsung
          </p>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20"
                      : "text-slate-500 hover:bg-white/80 hover:shadow-sm hover:text-[var(--color-primary)]"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`transition-transform duration-300 ${isActive ? "text-white scale-110" : "text-slate-400 group-hover:scale-110 group-hover:text-[var(--color-primary)]"}`}
                  />
                  <span className={`text-sm font-bold tracking-wide ${isActive ? "text-white" : ""}`}>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Bottom Status Indicator */}
        <div className="p-5 mt-auto">
          <div className="bg-white/80 border border-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konektor IoT</span>
              {dbStatus === 'online' ? (
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_theme(colors.emerald.500)]"></span>
              ) : (
                 <span className="w-2 h-2 rounded-full border-2 border-slate-300 border-dashed animate-spin"></span>
              )}
            </div>
            <div className={`text-xs font-bold ${dbStatus === 'online' ? 'text-slate-800' : 'text-slate-500'}`}>
               {dbStatus === 'online' ? 'Terhubung Database' : 'Mode Simulasi (Lokal)'}
            </div>
            <div className="text-[9px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
               {dbStatus === 'online' ? 'Sinkronisasi Aktif' : 'XAMPP OFFLINE'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}