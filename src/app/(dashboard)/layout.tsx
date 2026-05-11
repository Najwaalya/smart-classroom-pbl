"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";

import { Topbar } from "@/components/layout/Topbar";

import { RoomDataProvider } from "@/contexts/RoomDataContext";

import { getRole } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();
  const hasCheckedRef = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // CEK AUTH DAN REDIRECT
  useEffect(() => {
    if (hasCheckedRef.current) return;

    hasCheckedRef.current = true;

    const userRole = getRole();

    if (!userRole) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <RoomDataProvider>

      <div className="min-h-screen flex flex-col font-sans bg-[var(--background-base)]">

        {/* TOPBAR */}
        <Topbar
          onMenuToggle={() =>
            setSidebarOpen((prev) => !prev)
          }
        />

        <div className="flex flex-1 pt-16">

          {/* SIDEBAR */}
          <Sidebar
            open={sidebarOpen}
            onClose={() =>
              setSidebarOpen(false)
            }
          />

          {/* CONTENT */}
          <main className="flex-1 lg:ml-64 w-full h-full relative z-0 pb-12">
            {children}
          </main>

        </div>
      </div>
    </RoomDataProvider>
  );
}