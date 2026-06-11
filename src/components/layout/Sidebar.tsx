"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  X,
  CalendarDays,
  BookOpen,
  History,
} from "lucide-react";
import { getRole } from "@/lib/auth";
import { useState, useEffect } from "react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();

  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRole(getRole());
  }, []);

  // NAVIGATION ITEMS
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Jadwal & Monitoring",
      href: "/schedule",
      icon: CalendarDays,
    },

    // MENU KHUSUS STUDENT
    ...(mounted && role === "student"
      ? [
          {
            name: "Booking Ruangan",
            href: "/booking",
            icon: BookOpen,
          },
        ]
      : []),

    // MENU KHUSUS ADMIN
    ...(mounted && role === "admin"
      ? [
          {
            name: "Analitik",
            href: "/analytics",
            icon: LineChart,
          },
          {
            name: "Riwayat Booking",
            href: "/booking-history",
            icon: History,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full
          bg-[var(--background-card)]
          border-r border-slate-200 shadow-sm
          flex flex-col
          transition-all duration-200
          overflow-x-hidden

          lg:top-16
          lg:h-[calc(100vh-64px)]

          ${sidebarOpen ? "w-56 translate-x-0" : "w-0 lg:w-16 -translate-x-full lg:translate-x-0"}
        `}
      >
        {/* MOBILE HEADER */}
        <div className="flex items-center justify-between px-4 pt-6 pb-2 lg:hidden">
          <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1">
            <X size={18} />
          </button>
        </div>

        {/* MENU */}
        <div
          className={`py-4 flex flex-col flex-1 overflow-hidden ${
            !sidebarOpen ? "px-2" : "px-3"
          }`}
        >
          {/* NAVIGATION */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  title={!sidebarOpen ? item.name : undefined}
                  className={`
                    flex items-center gap-3
                    px-3 py-3
                    rounded-xl
                    transition-all duration-200
                    ${!sidebarOpen ? "justify-center" : ""}
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-500 hover:bg-white hover:text-blue-600"
                    }
                  `}
                >
                  <Icon size={18} className="shrink-0" />

                  {sidebarOpen && (
                    <span className="text-sm font-bold whitespace-nowrap overflow-hidden">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}