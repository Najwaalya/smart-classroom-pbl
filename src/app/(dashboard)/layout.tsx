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
import { BookingProvider } from "@/contexts/BookingContext";
import { getRole } from "@/lib/auth";
import { ToastContainer } from "@/components/ToastContainer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hasCheckedRef = useRef(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const role = getRole();
    if (!role) {
      router.replace("/login");
    }
  }, [router]);

  // ── Sebelum mount: render shell yang SAMA antara server & client ──
  // Ini mencegah hydration mismatch karena getRole() hanya bisa
  // diakses di client (localStorage), bukan di server.
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[var(--background-base)]" />
    );
  }

  // ── Setelah mount: cek role, redirect jika tidak login ──
  const role = getRole();
  if (!role) return null;

  return (
    <RoomDataProvider>
      <BookingProvider>
        <div className="min-h-screen flex flex-col font-sans bg-[var(--background-base)]">
          {/* TOPBAR */}
          <Topbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

          <div className="flex flex-1 pt-16">
            {/* SIDEBAR */}
            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            {/* CONTENT */}
            <main className="flex-1 lg:ml-64 w-full h-full relative z-0 pb-12">
              {children}
            </main>
          </div>

          <ToastContainer />
        </div>
      </BookingProvider>
    </RoomDataProvider>
  );
}