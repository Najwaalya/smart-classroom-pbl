"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, BookOpen } from "lucide-react";

export default function JadwalPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ke schedule sebagai default
    router.push("/schedule");
  }, [router]);

  return (
    <div className="page-wrapper anim-fade-up">
      <div className="flex flex-col gap-6 pb-12">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal & Booking</h1>
          <p className="text-sm text-slate-500 mt-1">Pilih halaman yang ingin Anda kunjungi.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/schedule"
            className="group flex flex-col gap-4 p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Calendar size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Jadwal & Monitoring</h2>
              <p className="text-sm text-slate-500 mt-1">Lihat jadwal kelas dan monitoring status ruangan secara realtime.</p>
            </div>
            <div className="text-xs font-black text-blue-600 group-hover:translate-x-1 transition-transform">
              Buka Jadwal →
            </div>
          </Link>

          <Link
            href="/booking"
            className="group flex flex-col gap-4 p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <BookOpen size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Booking Ruangan</h2>
              <p className="text-sm text-slate-500 mt-1">Booking ruangan kosong untuk kegiatan belajar dan rapat.</p>
            </div>
            <div className="text-xs font-black text-emerald-600 group-hover:translate-x-1 transition-transform">
              Buka Booking →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
