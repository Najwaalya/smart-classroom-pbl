"use client";

import Link from "next/link";
import { RefreshCw, Settings, HelpCircle, Search, Menu, ChevronDown, LogOut, KeyRound, X, Eye, EyeOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SettingsModal } from "../modals/SettingsModal";
import { HelpModal } from "../modals/HelpModal";
import { getUserInfo, logout, changePassword } from "@/lib/auth";

interface TopbarProps {
  onMenuToggle: () => void;
}

// ── Modal Ganti Password ───────────────────────────────────────────────────

function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [oldPw, setOldPw]       = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confirmPw, setConfirm] = useState("");
  const [showOld, setShowOld]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPw.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    const email = localStorage.getItem("email") ?? "";
    const ok = changePassword(email, oldPw, newPw);

    if (!ok) {
      setError("Password lama salah.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOldPw(""); setNewPw(""); setConfirm("");
      onClose();
    }, 1500);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <KeyRound size={18} />
            <h2 className="text-base font-black">Ganti Password</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Password Lama */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Password Lama
            </label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
              />
              <button type="button" onClick={() => setShowOld(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Password Baru */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
              />
              <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Konfirmasi */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          {/* Error / Success */}
          {error && (
            <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">Password berhasil diubah!</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[var(--color-primary)] text-white text-sm font-black rounded-xl hover:bg-[var(--color-primary-dark)] transition-all mt-1"
          >
            Simpan Password
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Topbar ─────────────────────────────────────────────────────────────────

export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const isRoomView = pathname.includes("/room/");

  const [isSettingsOpen,  setSettingsOpen]  = useState(false);
  const [isHelpOpen,      setHelpOpen]      = useState(false);
  const [isChangePwOpen,  setChangePwOpen]  = useState(false);
  const [isProfileOpen,   setProfileOpen]   = useState(false);

  const [userInfo, setUserInfo] = useState<{ name: string; id: string; role: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Baca info user dari localStorage (client-side)
  useEffect(() => {
    setUserInfo(getUserInfo());
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  // Inisial untuk avatar
  const initials = userInfo
    ? userInfo.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "ID";

  // Label singkat: NIM/NIP + nama singkat
  const shortName = userInfo
    ? userInfo.name.split(" ").slice(0, 2).join(" ").toUpperCase()
    : "";

  return (
    <>
      <SettingsModal    isOpen={isSettingsOpen}  onClose={() => setSettingsOpen(false)} />
      <HelpModal        isOpen={isHelpOpen}       onClose={() => setHelpOpen(false)} />
      <ChangePasswordModal isOpen={isChangePwOpen} onClose={() => setChangePwOpen(false)} />

      <header className="h-16 bg-white/70 backdrop-blur-md border-b border-white/50 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-20 w-full shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-all">

        {/* ── Kiri ── */}
        <div className="flex items-center gap-4">
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
              {[
                { href: "/",          label: "Ringkasan" },
                { href: "/analytics", label: "Analitik" },
                { href: "/logs",      label: "Catatan Log" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pb-[21px] pt-[21px] border-b-2 transition-all duration-300 ${
                    pathname === item.href
                      ? "text-[var(--color-primary)] border-[var(--color-primary)]"
                      : "text-slate-400 border-transparent hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* ── Kanan ── */}
        <div className="flex items-center gap-2">
          {isRoomView && (
            <div className="relative hidden md:block mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Pencarian Cepat..."
                className="pl-8 pr-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100/50 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-48 transition-all hover:bg-white"
              />
            </div>
          )}

          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all active:scale-90"
            title="Muat Ulang"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all active:scale-90"
            title="Pengaturan"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="w-8 h-8 hidden sm:flex items-center justify-center rounded-full text-slate-500 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-all active:scale-90"
            title="Bantuan"
          >
            <HelpCircle size={16} />
          </button>

          {/* ── Profile Button + Dropdown ── */}
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100/70 transition-all group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[#22c55e] flex items-center justify-center border-2 border-white shadow-sm text-white font-black text-xs shrink-0">
                {initials}
              </div>
              {/* ID / Nama — hanya desktop */}
              {userInfo && (
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-[10px] font-black text-slate-500 tracking-widest">
                    {userInfo.id}
                  </span>
                  <span className="text-xs font-black text-slate-700">
                    {shortName}
                  </span>
                </div>
              )}
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                {/* Info user */}
                <div className="px-4 py-4 bg-gradient-to-br from-[var(--color-primary)]/5 to-white border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[#22c55e] flex items-center justify-center text-white font-black text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">
                        {userInfo?.name ?? "—"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {userInfo?.role === "dosen" ? `NIP: ${userInfo.id}` : `NIM: ${userInfo?.id}`}
                      </p>
                      <span className={`inline-block mt-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        userInfo?.role === "dosen"
                          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {userInfo?.role === "dosen" ? "Dosen" : "Mahasiswa"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <button
                    onClick={() => { setProfileOpen(false); setChangePwOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)] transition-colors text-left"
                  >
                    <KeyRound size={16} className="shrink-0" />
                    Ganti Password
                  </button>

                  <div className="mx-4 border-t border-slate-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut size={16} className="shrink-0" />
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
