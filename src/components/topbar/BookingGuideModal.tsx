"use client";

import { X, CalendarClock, DoorOpen, AlertTriangle } from "lucide-react";

interface BookingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingGuideModal({
  isOpen,
  onClose,
}: BookingGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <CalendarClock size={18} />
            <h2 className="text-lg font-black">
              Panduan Booking & Pengunduran Kelas
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Sinkronisasi */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock
                size={18}
                className="text-[var(--color-primary)]"
              />

              <h3 className="font-black text-slate-800">
                Sinkronisasi Jadwal
              </h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Sistem SmartClass Monitoring secara otomatis menyinkronkan
              status ruangan dengan jadwal perkuliahan aktif.
            </p>

            <ul className="mt-3 text-sm text-slate-600 space-y-2 list-disc pl-5">
              <li>
                Ruangan akan otomatis masuk ke status <b>AKTIF</b> saat
                jadwal kuliah dimulai.
              </li>

              <li>
                Sistem memberikan toleransi deteksi aktivitas selama
                maksimal <b>1 jam perkuliahan</b>.
              </li>

              <li>
                Sensor PIR dan infrared digunakan untuk mendeteksi
                keberadaan dan aktivitas di dalam kelas.
              </li>
            </ul>
          </div>

          {/* Kelas Kosong */}
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <DoorOpen
                size={18}
                className="text-amber-600"
              />

              <h3 className="font-black text-slate-800">
                Perubahan Status Menjadi Kosong
              </h3>
            </div>

            <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
              <li>
                Jika pada jam perkuliahan berikutnya tidak terdeteksi
                aktivitas mahasiswa maupun dosen, maka kelas akan
                otomatis berubah menjadi <b>KOSONG</b>.
              </li>

              <li>
                Status kosong dapat terjadi meskipun jadwal kuliah masih
                tersedia di sistem akademik.
              </li>

              <li>
                Mekanisme ini digunakan untuk menghindari penggunaan
                ruangan yang tidak efisien.
              </li>
            </ul>
          </div>

            {/* Booking & Reschedule */}
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                size={18}
                className="text-emerald-600"
                />

                <h3 className="font-black text-slate-800">
                Aturan Booking Kelas
                </h3>
            </div>

            <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
                <li>
                Jika dosen meminta perkuliahan dimulai pada jam ke-2,
                ke-3, atau setelah jeda tertentu, maka ketua kelas
                wajib melakukan booking ulang ruangan.
                </li>

                <li>
                Booking diperlukan karena sistem dapat mengubah status
                ruangan menjadi <b>KOSONG</b> apabila tidak terdeteksi
                aktivitas pada jam perkuliahan sebelumnya.
                </li>

                <li>
                Pengajuan pengunduran wajib memeriksa status ketersediaan 
                kelas terlebih dahulu.
                </li>

                <li>
                Sistem akan memvalidasi ketersediaan ruangan secara
                realtime sebelum booking diproses.
                </li>

                <li>
                Jika ruangan sedang digunakan oleh kelas lain, maka
                pengajuan booking tidak dapat dilakukan.
                </li>

                <li>
                Setelah booking berhasil diverifikasi, status ruangan
                akan kembali menjadi <b>AKTIF</b>.
                </li>

                <li>
                Seluruh aktivitas booking dan perubahan jadwal akan
                tercatat pada log sistem monitoring.
                </li>
            </ul>
            </div>
        </div>
      </div>
    </div>
  );
}