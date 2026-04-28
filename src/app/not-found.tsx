"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRole } from "@/lib/auth";

export default function NotFound() {
  const [href, setHref] = useState("/");

  useEffect(() => {
    const role = getRole();
    if (!role) {
      setHref("/login");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background-base)] gap-6 px-4">
      <div className="text-center">
        <h1 className="text-8xl font-black text-[var(--color-primary)] leading-none">404</h1>
        <p className="text-xl font-bold text-slate-700 mt-4">Halaman tidak ditemukan</p>
        <p className="text-sm text-slate-400 mt-2">
          Halaman yang kamu cari belum tersedia atau sudah dipindahkan.
        </p>
      </div>
      <Link
        href={href}
        className="px-8 py-3 bg-[var(--color-primary)] text-white text-sm font-bold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all shadow-md hover:shadow-lg"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
