"use client";

import { X, Sliders, BellDot, Shield, Save } from "lucide-react";
import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [tempThreshold, setTempThreshold] = useState(26);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal View */}
      <div className="relative bg-white/90 backdrop-blur-xl border border-white/50 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Sliders size={20} className="text-[var(--color-primary)]"/>
            <h2 className="text-lg font-black tracking-wide">Pengaturan Sistem</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Section 1 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <BellDot size={14} /> Sinkronisasi IoT
            </h3>
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <p className="text-sm font-bold text-slate-700">Interval Tarik Data</p>
                <p className="text-[10px] text-slate-500">Seberapa sering Web menarik data IoT.</p>
              </div>
              <select className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-3 py-1.5 focus:ring-2 outline-none cursor-pointer">
                <option>3 Detik</option>
                <option>5 Detik</option>
                <option>10 Detik</option>
              </select>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield size={14} /> Parameter Alarm
            </h3>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">Batas Suhu Tinggi (+AC)</label>
                <span className="text-xs font-bold text-orange-500 px-2 py-1 bg-orange-50 rounded-md">{tempThreshold}°C</span>
              </div>
              <input 
                type="range" min="20" max="35" 
                value={tempThreshold}
                onChange={(e) => setTempThreshold(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)]" 
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Jika sensor melampaui suhu ini, perangkat pendingin IoT dapat diatur untuk menyala otomatis.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
            Batal
          </button>
          <button onClick={onClose} className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-full hover:shadow-lg transition-all flex items-center gap-1.5">
            <Save size={14} /> Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}
