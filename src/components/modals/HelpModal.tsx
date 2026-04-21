"use client";

import { Database, Workflow, Cpu, CircleHelp } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div className="bg-gradient-to-r from-[var(--color-primary)] to-[#1e3a8a] p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CircleHelp size={32} />
          </div>
          <h2 className="text-xl font-black tracking-wide">Pusat Bantuan ClassTrack</h2>
          <p className="text-xs text-white/80 mt-1 font-medium">Buku Panduan Integrasi Hardware IoT</p>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex gap-4 p-4 rounded-2xl bg-amber-50 text-amber-900 border border-amber-100">
            <Database className="shrink-0 mt-0.5 text-amber-600" size={20} />
            <div>
              <h4 className="font-bold text-sm">Integrasi Database MySQL</h4>
              <p className="text-xs mt-1 text-amber-700/80 leading-relaxed">
                Platform ini dapat menarik data langsung dari PhpMyAdmin. Eksekusi file `database.sql` ke dalam MySQL Anda, dan nyalakan XAMPP. Indikator Web akan menyala &apos;Online&apos;.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-blue-50 text-blue-900 border border-blue-100">
            <Workflow className="shrink-0 mt-0.5 text-blue-600" size={20} />
            <div>
              <h4 className="font-bold text-sm">Rute API Pengiriman (IoT POST)</h4>
              <p className="text-xs mt-1 text-blue-700/80 leading-relaxed font-mono">
                [POST] /api/iot/receive <br/>
                Kirim JSON: {"{ id, status, students, temp, humidity }"}
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 text-slate-700 border border-slate-100">
            <Cpu className="shrink-0 mt-0.5 text-slate-500" size={20} />
            <div>
              <h4 className="font-bold text-sm">Mode Pameran (Simulasi Fallback)</h4>
              <p className="text-xs mt-1 text-slate-500 leading-relaxed">
                Jika MySQL sedang mati, Website otomatis masuk ke &apos;Mode Simulasi&apos; yang memutar log buatan (dummy) meminimalisir layar kosong.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 flex justify-center border-t border-slate-100 bg-white">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full hover:bg-slate-200 transition-colors w-full uppercase tracking-widest">
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}