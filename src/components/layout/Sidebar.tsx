"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  History,
  X,
  CalendarDays,
} from "lucide-react";
import { useRoomData } from "@/contexts/RoomDataContext";
import { getRole } from "@/lib/auth";
import { useEffect, useState } from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { dbStatus } = useRoomData();

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const roleValue = getRole();
    // eslint-disable-next-line
    setRole(roleValue);
  }, []);

  // NAV ITEMS BASED ON ROLE
  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Jadwal", href: "/jadwal", icon: CalendarDays },

    ...(role === "dosen"
      ? [
          { name: "Analitik", href: "/analytics", icon: LineChart },
          { name: "Riwayat", href: "/logs", icon: History },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-white/60 backdrop-blur-xl border-r border-white/50 shadow
          flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-64px)] lg:bg-transparent lg:shadow-none
        `}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 lg:hidden">
          <span className="font-black text-xl">ClassTrack</span>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Menu */}
        <div className="px-5 py-8 flex flex-col flex-1">
          <h2 className="font-black text-lg mb-1 hidden lg:block">
            Pusat Global
          </h2>
          <p className="text-[10px] text-slate-400 mb-8 hidden lg:block">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:bg-white hover:text-blue-600"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-bold">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}