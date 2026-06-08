"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { RoomDataProvider } from "@/contexts/RoomDataContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { getRole } from "@/lib/auth";
import { ToastContainer } from "@/components/ToastContainer";

const STORAGE_KEY = "sidebar_open";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hasCheckedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // ── Lifted sidebarOpen state (default: true) ───
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setMounted(true);

    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const role = getRole();
    if (!role) {
      router.replace("/login");
    }

    // Restore sidebar preference
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setSidebarOpen(stored === "true");
      }
    } catch { /* ignore */ }
  }, [router]);

  // Save preference to localStorage whenever state changes
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORAGE_KEY, String(sidebarOpen));
      } catch { /* ignore */ }
    }
  }, [sidebarOpen, mounted]);

  // ── Before mount: identical server & client shell to prevent mismatch ─
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col font-sans bg-[var(--background-base)]" />
    );
  }

  const role = getRole();
  if (!role) return null;

  return (
    <RoomDataProvider>
      <BookingProvider>
        <div className="min-h-screen flex flex-col font-sans bg-[var(--background-base)]">
          {/* TOPBAR — receives toggle state & handler */}
          <Topbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <div className="flex flex-1 pt-16">
            {/* SIDEBAR — controlled collapse from layout */}
            <Sidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />

            {/* CONTENT — left margin animates with sidebar width on desktop */}
            <main className="flex-1 w-full h-full relative z-0 pb-12">
              {/* Hidden spacer that pushes content right on lg screens */}
              <div
                aria-hidden
                className={`hidden lg:block transition-all duration-200 float-left h-1 ${
                  sidebarOpen ? "w-56" : "w-16"
                }`}
              />
              <div style={{ overflow: "hidden" }}>
                {children}
              </div>
            </main>
          </div>

          <ToastContainer />
        </div>
      </BookingProvider>
    </RoomDataProvider>
  );
}