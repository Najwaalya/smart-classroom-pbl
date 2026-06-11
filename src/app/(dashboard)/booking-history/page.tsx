"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { 
  RefreshCw, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  History,
  Layers,
  CalendarCheck,
  CalendarX,
  X
} from "lucide-react";
import { getRole } from "@/lib/auth";

// Fetcher helper for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Gagal mengambil data dari server");
  }
  return res.json();
};

interface Booking {
  id: string;
  roomId: string;
  userName: string;
  userNim: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "booked" | "cancelled" | "completed";
  createdAt: string;
}

export default function AdminBookingHistoryPage() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // States
  const [localBookings, setLocalBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "booked" | "completed" | "cancelled">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal confirmation state
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // SWR for fetching bookings
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; bookings: any[] }>(
    "/api/bookings",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Set mounted and auth role
  useEffect(() => {
    setMounted(true);
    setRole(getRole());
  }, []);

  // Update local bookings state when fetch completes
  useEffect(() => {
    if (data?.success && Array.isArray(data.bookings)) {
      // Map API fields (bookedBy & bookedById) to required Booking interface fields
      const mapped: Booking[] = data.bookings.map((b: any) => ({
        id: b.id,
        roomId: b.roomId,
        userName: b.userName || b.bookedBy || "Unknown User",
        userNim: b.userNim || b.bookedById || b.userId || "-",
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        purpose: b.purpose || "-",
        status: b.status,
        createdAt: b.createdAt,
      }));
      setLocalBookings(mapped);
    }
  }, [data]);

  // Toast auto-hide effect (3 seconds)
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle Refresh Action
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
      setToast({ message: "Data booking berhasil diperbarui", type: "success" });
    } catch (err) {
      setToast({ message: "Gagal memperbarui data booking", type: "error" });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open cancel modal
  const openCancelModal = (booking: Booking) => {
    setBookingToCancel(booking);
  };

  // Close cancel modal
  const closeCancelModal = () => {
    if (!isCancelling) {
      setBookingToCancel(null);
    }
  };

  // Confirm cancel action
  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);

    try {
      const response = await fetch(`/api/bookings?id=${encodeURIComponent(bookingToCancel.id)}`, {
        method: "DELETE",
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || "Gagal membatalkan booking");
      }

      // Update local state directly without re-fetching
      setLocalBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToCancel.id ? { ...b, status: "cancelled" } : b
        )
      );

      setToast({
        message: `Booking ruangan ${bookingToCancel.roomId} berhasil dibatalkan`,
        type: "success",
      });
      setBookingToCancel(null);
    } catch (err: any) {
      console.error("[cancelBooking] Error:", err);
      setToast({
        message: err.message || "Koneksi gagal. Gagal membatalkan booking.",
        type: "error",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Date and time formatter (id-ID) without timezone offset issues
  const formatBookingDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts.map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Creation timestamp formatter (id-ID)
  const formatCreatedAt = (createdAtStr: string) => {
    if (!createdAtStr) return "-";
    try {
      const dateObj = new Date(createdAtStr);
      return dateObj.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    } catch {
      return createdAtStr;
    }
  };

  // Calculate booking counters
  const counters = useMemo(() => {
    const counts = { total: 0, booked: 0, completed: 0, cancelled: 0 };
    localBookings.forEach((b) => {
      counts.total++;
      if (b.status === "booked") counts.booked++;
      else if (b.status === "completed") counts.completed++;
      else if (b.status === "cancelled") counts.cancelled++;
    });
    return counts;
  }, [localBookings]);

  // Filter & Search processing
  const filteredBookings = useMemo(() => {
    return localBookings.filter((b) => {
      // 1. Status Filter
      if (selectedFilter !== "all" && b.status !== selectedFilter) {
        return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const nameMatch = b.userName.toLowerCase().includes(query);
        const nimMatch = b.userNim.toLowerCase().includes(query);
        const roomMatch = b.roomId.toLowerCase().includes(query);
        const purposeMatch = b.purpose.toLowerCase().includes(query);
        return nameMatch || nimMatch || roomMatch || purposeMatch;
      }

      return true;
    });
  }, [localBookings, selectedFilter, searchQuery]);

  // Prevent hydration mismatch / render loading state before mounted
  if (!mounted) {
    return (
      <div className="page-wrapper">
        <div className="flex h-[80vh] w-full items-center justify-center p-8 flex-col gap-4">
          <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat panel administrasi...</p>
        </div>
      </div>
    );
  }

  // Admin access restriction check
  if (role && role !== "admin") {
    return (
      <div className="page-wrapper anim-fade-up">
        <div className="flex flex-col gap-6 pb-12">
          <div className="flex items-center gap-3 p-6 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
            <AlertTriangle size={24} className="text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-red-900 text-lg">Akses Terbatas</p>
              <p className="text-sm text-red-700 mt-1">
                Halaman Riwayat Booking Admin hanya dapat diakses oleh administrator sistem.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper anim-fade-up relative">
      <div className="flex flex-col gap-8 pb-12">
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                Panel Admin
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <History className="text-[var(--color-primary)] shrink-0" size={32} />
              Riwayat Booking
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitoring dan pengelolaan data penggunaan ruangan smart classroom.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCw 
              size={16} 
              className={`text-slate-500 ${(isLoading || isRefreshing) ? "animate-spin" : "transition-transform hover:rotate-180"}`} 
            />
            Refresh
          </button>
        </div>

        {/* SUMMARY CARDS */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-28">
                <div className="w-8 h-8 bg-slate-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-16 mb-2"></div>
                <div className="h-6 bg-slate-200 rounded w-8"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: Total */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                <Layers size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Booking</p>
                <p className="text-2xl font-black text-slate-800 mt-0.5">{counters.total}</p>
              </div>
            </div>

            {/* CARD 2: Aktif / Booked */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <CalendarCheck size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktif (Booked)</p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">{counters.booked}</p>
              </div>
            </div>

            {/* CARD 3: Selesai / Completed */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai</p>
                <p className="text-2xl font-black text-blue-600 mt-0.5">{counters.completed}</p>
              </div>
            </div>

            {/* CARD 4: Dibatalkan / Cancelled */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                <XCircle size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dibatalkan</p>
                <p className="text-2xl font-black text-rose-600 mt-0.5">{counters.cancelled}</p>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH AND FILTERS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                selectedFilter === "all"
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              Semua ({counters.total})
            </button>
            <button
              onClick={() => setSelectedFilter("booked")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                selectedFilter === "booked"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              Aktif ({counters.booked})
            </button>
            <button
              onClick={() => setSelectedFilter("completed")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                selectedFilter === "completed"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              Selesai ({counters.completed})
            </button>
            <button
              onClick={() => setSelectedFilter("cancelled")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                selectedFilter === "cancelled"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              Dibatalkan ({counters.cancelled})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari mahasiswa, NIM, ruangan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-sm rounded-xl font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* BOOKINGS LIST */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-slate-200 rounded w-28"></div>
                  <div className="h-5 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded w-48"></div>
                <div className="h-4 bg-slate-200 rounded w-36"></div>
                <div className="h-12 bg-slate-100 rounded-xl"></div>
                <div className="h-8 bg-slate-200 rounded w-full mt-2"></div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          /* EMPTY STATE */
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto mt-6">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <CalendarX size={32} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Tidak Ada Riwayat Booking</h3>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery 
                ? "Tidak ada hasil yang cocok dengan kata kunci pencarian Anda." 
                : "Belum ada riwayat pemesanan ruangan pada status yang dipilih."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold text-xs transition-all"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          /* BOOKING CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBookings.map((booking) => {
              // Set border style based on status
              let borderLeftStyle = "border-l-4 border-l-slate-400";
              let badgeStyle = "bg-slate-100 text-slate-500 border-slate-200";
              let statusLabel = "Dibatalkan";

              if (booking.status === "booked") {
                borderLeftStyle = "border-l-4 border-l-emerald-500";
                badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                statusLabel = "Aktif";
              } else if (booking.status === "completed") {
                borderLeftStyle = "border-l-4 border-l-blue-500";
                badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                statusLabel = "Selesai";
              }

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden ${borderLeftStyle}`}
                >
                  {/* CARD HEADER */}
                  <div className="p-5 pb-3 flex justify-between items-start gap-3 border-b border-slate-50">
                    <div>
                      <h4 className="font-black text-slate-800 text-lg tracking-tight">
                        {booking.roomId}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Info size={12} />
                        <span>ID: {booking.id}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeStyle}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* CARD BODY */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* User Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Pemesan</p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5">{booking.userName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">NIM. {booking.userNim}</p>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tanggal & Waktu</p>
                        <p className="text-sm font-bold text-slate-700 mt-0.5">
                          {formatBookingDate(booking.date)}
                        </p>
                        <div className="flex items-center gap-1 text-slate-500 mt-1">
                          <Clock size={13} />
                          <span className="text-xs font-bold">
                            {booking.startTime} – {booking.endTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Purpose (Keperluan) */}
                    <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keperluan / Acara</p>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                        "{booking.purpose}"
                      </p>
                    </div>

                    {/* Timestamp Created */}
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-auto">
                      <Clock size={11} />
                      <span>Dibuat pada: {formatCreatedAt(booking.createdAt)}</span>
                    </div>
                  </div>

                  {/* CARD ACTIONS (Only if booked) */}
                  {booking.status === "booked" && (
                    <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100/60 flex justify-end">
                      <button
                        onClick={() => openCancelModal(booking)}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 focus:ring-4 focus:ring-red-100 rounded-xl text-xs font-black transition-all"
                      >
                        Batalkan Booking
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all scale-100">
            {/* Modal Header */}
            <div className="p-6 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Konfirmasi Pembatalan</h3>
                  <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 border-t border-b border-slate-50 flex flex-col gap-4 text-sm">
              <p className="text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin membatalkan booking berikut? Status booking akan langsung diubah menjadi <strong>Dibatalkan</strong>.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/70 flex flex-col gap-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-xs uppercase">Ruangan</span>
                  <span className="font-bold text-slate-700">{bookingToCancel.roomId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-xs uppercase">Pemesan</span>
                  <span className="font-bold text-slate-700">{bookingToCancel.userName} ({bookingToCancel.userNim})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold text-xs uppercase">Waktu</span>
                  <span className="font-bold text-slate-700">{bookingToCancel.startTime} – {bookingToCancel.endTime}</span>
                </div>
                <div className="flex flex-col gap-1 border-t border-slate-200/50 pt-2 mt-1">
                  <span className="text-slate-400 font-bold text-xs uppercase">Keperluan</span>
                  <span className="text-xs text-slate-600 italic">"{bookingToCancel.purpose}"</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={closeCancelModal}
                disabled={isCancelling}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={isCancelling}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isCancelling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Membatalkan...
                  </>
                ) : (
                  "Ya, Batalkan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm max-w-sm ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
            ) : (
              <XCircle className="text-red-500 shrink-0" size={18} />
            )}
            <span className="font-semibold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 ml-2 shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
