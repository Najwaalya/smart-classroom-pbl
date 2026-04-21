"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { RoomDataProvider } from "@/contexts/RoomDataContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RoomDataProvider>
      <div className="min-h-screen flex flex-col font-sans bg-[var(--background-base)]">
        <Topbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <div className="flex flex-1 pt-16">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <main className="flex-1 lg:ml-64 w-full h-full relative z-0 pb-12">
            <div className="page-wrapper anim-fade-up">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RoomDataProvider>
  );
}