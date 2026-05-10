"use client";

import { useEffect, useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const role = getRole();
    if (!role) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) return null;

  return (
    <RoomDataProvider>
      <BookingProvider>
        <div className="min-h-screen flex flex-col font-sans bg-[var(--background-base)]">
          <Topbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
          <div className="flex flex-1 pt-16">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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