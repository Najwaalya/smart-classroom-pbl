"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  X,
  CalendarDays,
  BookOpen,
} from "lucide-react";
import { getRole } from "@/lib/auth";
import { useState, useEffect } from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
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
      href: "/",
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
        ]
      : []),
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64
          bg-white/60 backdrop-blur-xl
          border-r border-white/50 shadow
          flex flex-col
          transition-transform duration-300

          ${open ? "translate-x-0" : "-translate-x-full"}

          lg:translate-x-0
          lg:top-16
          lg:h-[calc(100vh-64px)]
          lg:bg-transparent
          lg:shadow-none
        `}
      >
        {/* MOBILE HEADER */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 lg:hidden">
          <span className="font-black text-xl">
            SmartClass
          </span>

          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* MENU */}
        <div className="px-5 py-8 flex flex-col flex-1">
          {/* DESKTOP TITLE */}
          <h2 className="font-black text-lg mb-1 hidden lg:block">
            SmartClass
          </h2>

          <p className="text-[10px] text-slate-400 mb-8 hidden lg:block">
            Monitoring Kelas IoT
          </p>

          {/* NAVIGATION */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3
                    px-4 py-3
                    rounded-xl
                    transition-all duration-200

                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-500 hover:bg-white hover:text-blue-600"
                    }
                  `}
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