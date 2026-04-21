"use client";

import Link from "next/link";
import { RefreshCw, Settings, HelpCircle, Search, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SettingsModal } from "../modals/SettingsModal";
import { HelpModal } from "../modals/HelpModal";

interface TopbarProps {
  onMenuToggle: () => void;
}


export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const isRoomView = pathname.includes("/room/");
  
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isHelpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setHelpOpen(false)} />
      
      <header className="h-16 bg-white/70 backdrop-blur-md border-b border-white/50 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-20 w-full shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-all">
        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-slate-500 hover:text-[var(--color-primary)] transition-colors p-1.5 rounded-md hover:bg-slate-100/50"
            aria-label="Buka Menu"
          >
            <Menu size={22} />
          </button>

          <Link href="/" className="text-[var(--color-primary)] font-black text-xl tracking-tight flex items-center gap-2">
            ClassTrack
          </Link>

          {isRoomView && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-bold ml-6">
              <Link
                href="/"
                className={`pb-[21px] pt-[21px] border-b-2 transition-all duration-300 ${
                  pathname === "/"
                    ? "text-[var(--color-primary)] border-[var(--color-primary)]"
                    : "text-slate-400 border-transparent hover:text-slate-800"
                }`}
              >
                Ringkasan
              </Link>
              <Link
                href="/analytics"
                className={`pb-[21px] pt-[21px] border-b-2 transition-all duration-300 ${
                  pathname === "/analytics"
                    ? "text-[var(--color-primary)] border-[var(--color-primary)]"
                    : "text-slate-400 border-transparent hover:text-slate-800"
                }`}
              >
                Analitik
              </Link>
              <Link
                href="/logs"
                className={`pb-[21px] pt-[21px] border-b-2 transition-all duration-300 ${
                  pathname === "/logs"
                    ? "text-[var(--color-primary)] border-[var(--color-primary)]"
                    : "text-slate-400 border-transparent hover:text-slate-800"
                }`}
              >
                Catatan Log
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isRoomView && (
            <div className="relative hidden md:block mr-2">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={13}
              />
              <input
                type="text"
                placeholder="Pencarian Cepat..."
                className="pl-8 pr-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100/50 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-48 transition-all hover:bg-white"
              />
            </div>
          )}

          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all font-bold active:scale-90"
            title="Muat Ulang"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all font-bold active:scale-90" 
            title="Pengaturan"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={() => setHelpOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all hidden sm:flex font-bold active:scale-90" 
            title="Bantuan Pusat"
          >
            <HelpCircle size={16} />
          </button>

          <Link href="/login">
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[#22c55e] ml-2 flex items-center justify-center border-2 border-white shadow-sm cursor-pointer hover:shadow-md hover:scale-105 transition-all text-white font-black text-xs"
              title="Akses Akun"
            >
              ID
            </div>
          </Link>
        </div>
      </header>
    </>
  );
}
