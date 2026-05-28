"use client";

import Link from "next/link";

import {
  HelpCircle,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  KeyRound,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation";

import { useEffect, useRef, useState } from "react";

import BookingGuideModal from "../topbar/BookingGuideModal";
import TopbarIconButton from "../topbar/TopbarIconButton";

import {
  getUserInfo,
  logout,
} from "@/lib/auth";

import ChangePasswordModal from "@/components/auth/ChangePasswordModal";

interface TopbarProps {
  onMenuToggle: () => void;
}

export function Topbar({
  onMenuToggle,
}: TopbarProps) {

  const pathname = usePathname();

  const router = useRouter();

  const isRoomView =
    pathname.includes("/room/");

  const [isGuideOpen, setGuideOpen] =
    useState(false);

  const [isChangePwOpen, setChangePwOpen] =
    useState(false);

  const [isProfileOpen, setProfileOpen] =
    useState(false);

  const [userInfo] = useState<{
    name: string;
    id: string;
    role: string;
  } | null>(() => getUserInfo());

  const dropdownRef =
    useRef<HTMLDivElement>(null);

  // Close dropdown outside click
  useEffect(() => {

    function handleClickOutside(
      e: MouseEvent
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          e.target as Node
        )
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  function handleLogout() {
    logout();

    router.replace("/login");
  }

  // Avatar initials
  const initials = userInfo
    ? userInfo.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SC";

  // Short name
  const shortName = userInfo
    ? userInfo.name
        .split(" ")
        .slice(0, 2)
        .join(" ")
        .toUpperCase()
    : "";

  return (
    <>
      {/* GUIDE MODAL */}
      <BookingGuideModal
        isOpen={isGuideOpen}
        onClose={() =>
          setGuideOpen(false)
        }
      />

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={isChangePwOpen}
        onClose={() =>
          setChangePwOpen(false)
        }
      />

      <header className="h-16 bg-white/70 backdrop-blur-md border-b border-white/50 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-20 w-full shadow-[0_4px_30px_rgba(0,0,0,0.02)]">

        {/* LEFT */}
        <div className="flex items-center gap-4">

          {/* MOBILE MENU */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-slate-500 hover:text-[var(--color-primary)] transition-colors p-1.5 rounded-md hover:bg-slate-100/50"
          >
            <Menu size={22} />
          </button>

          {/* LOGO */}
          <Link
            href="/"
            className="text-[var(--color-primary)] font-black text-xl tracking-tight"
          >
            SmartClass
          </Link>

          {/* ROOM NAVIGATION */}
          {isRoomView && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-bold ml-6">
              {[
                {
                  href: "/",
                  label: "Ringkasan",
                },

                {
                  href: "/analytics",
                  label: "Analitik",
                },

                {
                  href: "/logs",
                  label: "Catatan Log",
                },
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

        {/* RIGHT */}
        <div className="flex items-center gap-2">

          {/* SEARCH */}
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

          {/* BOOKING GUIDE */}
          <TopbarIconButton
            onClick={() =>
              setGuideOpen(true)
            }
            title="Panduan Booking"
          >
            <HelpCircle size={16} />
          </TopbarIconButton>

          {/* PROFILE */}
          <div
            className="relative ml-1"
            ref={dropdownRef}
          >
            <button
              onClick={() =>
                setProfileOpen((p) => !p)
              }
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100/70 transition-all"
            >
              {/* AVATAR */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[#22c55e] flex items-center justify-center border-2 border-white shadow-sm text-white font-black text-xs shrink-0">
                {initials}
              </div>

              {/* USER INFO */}
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
                className={`text-slate-400 transition-transform duration-200 ${
                  isProfileOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            {/* DROPDOWN */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">

                {/* PROFILE HEADER */}
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
                        {userInfo?.role === "admin"
                          ? `NIP: ${userInfo?.id}`
                          : `NIM: ${userInfo?.id}`}
                      </p>

                      <span
                        className={`inline-block mt-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          userInfo?.role === "admin"
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {userInfo?.role === "admin"
                          ? "ADMIN"
                          : "MAHASISWA"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* MENU */}
                <div className="py-1.5">

                  {/* CHANGE PASSWORD */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setChangePwOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[var(--color-primary)] transition-colors text-left"
                  >
                    <KeyRound
                      size={16}
                      className="shrink-0"
                    />

                    Ganti Password
                  </button>

                  <div className="mx-4 border-t border-slate-100" />

                  {/* LOGOUT */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut
                      size={16}
                      className="shrink-0"
                    />

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