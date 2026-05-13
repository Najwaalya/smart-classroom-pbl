"use client";

import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from "react";
import { getUserInfo } from "@/lib/auth";

// ── Tipe ──────────────────────────────────────────────────────────────────────

export type ReportType = "mundur" | "ganti_hari" | "tidak_hadir" | "pindah_ruangan";

export interface RescheduleReport {
  roomId: string;
  type: ReportType;
  reportedBy: string;
  reportedById: string;
  reportedAt: Date;
  note: string;
  newDay?: string;
  newTime?: string;
}

export interface BookingEntry {
  id: string;
  roomId: string;
  bookedBy: string;
  bookedById: string;
  bookedAt: Date;
  startTime: string;
  endTime: string;
  purpose: string;
  groupSize: number;
  status: "active" | "completed" | "cancelled";
}

export interface Toast {
  id: string;
  type: "success" | "warning" | "info" | "error";
  title: string;
  message: string;
}

interface BookingContextType {
  reschedules: Record<string, RescheduleReport>;
  bookings: Record<string, BookingEntry>;
  bookingHistory: BookingEntry[];
  favorites: string[];
  toasts: Toast[];
  dbSynced: boolean;

  reportReschedule: (roomId: string, type: ReportType, note: string, extra?: { newDay?: string; newTime?: string }) => void;
  cancelReschedule: (roomId: string) => void;
  bookRoom: (roomId: string, startTime: string, endTime: string, purpose: string, groupSize: number) => Promise<boolean>;
  cancelBooking: (roomId: string) => Promise<void>;
  rescheduleBooking: (roomId: string, newStart: string, newEnd: string) => boolean;

  toggleFavorite: (roomId: string) => void;
  isFavorite: (roomId: string) => boolean;

  isRescheduled: (roomId: string) => boolean;
  isBooked: (roomId: string) => boolean;
  getBooking: (roomId: string) => BookingEntry | undefined;
  getReschedule: (roomId: string) => RescheduleReport | undefined;
  getMyBookings: () => BookingEntry[];
  getMyReports: () => RescheduleReport[];

  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function saveLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// Konversi data Cosmos ke BookingEntry internal
interface CosmosBooking {
  id: string;
  roomId: string;
  userId?: string;
  userClass?: string;
  bookingDate?: string;
  day?: string;
  sessionStart?: string;
  sessionEnd?: string;
  purpose?: string;
  status?: string;
  createdAt?: string;
  // Bisa punya nama user dari client
  bookedBy?: string;
  bookedById?: string;
  startTime?: string;
  endTime?: string;
  groupSize?: number;
}

function cosmosToEntry(b: CosmosBooking): BookingEntry {
  return {
    id: b.id,
    roomId: b.roomId,
    bookedBy: b.bookedBy ?? b.userId ?? "—",
    bookedById: b.bookedById ?? b.userId ?? "",
    bookedAt: b.createdAt ? new Date(b.createdAt) : new Date(),
    startTime: b.startTime ?? b.sessionStart ?? "",
    endTime: b.endTime ?? b.sessionEnd ?? "",
    purpose: b.purpose ?? "",
    groupSize: b.groupSize ?? 0,
    status: (b.status as BookingEntry["status"]) ?? "active",
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [reschedules, setReschedules] = useState<Record<string, RescheduleReport>>({});
  const [bookings,    setBookings]    = useState<Record<string, BookingEntry>>({});
  const [bookingHistory, setBookingHistory] = useState<BookingEntry[]>(() =>
    loadLS<BookingEntry[]>("booking_history", []).map(b => ({ ...b, bookedAt: new Date(b.bookedAt) }))
  );
  const [favorites, setFavorites] = useState<string[]>(() => loadLS<string[]>("room_favorites", []));
  const [toasts,    setToasts]    = useState<Toast[]>([]);
  const [dbSynced,  setDbSynced]  = useState(false);
  const hasFetchedRef = useRef(false);

  // ── Persist ke localStorage ──────────────────────────────────────────────
  useEffect(() => { saveLS("room_favorites",  favorites);      }, [favorites]);
  useEffect(() => { saveLS("booking_history", bookingHistory); }, [bookingHistory]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = uid();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Fetch bookings dari Cosmos ────────────────────────────────────────────
  const refreshBookings = useCallback(async () => {
    try {
      const res  = await fetch("/api/bookings");
      const data = await res.json();

      if (Array.isArray(data)) {
        const entries = data.map(cosmosToEntry);

        // Bangun map roomId → BookingEntry (hanya status active)
        const activeMap: Record<string, BookingEntry> = {};
        for (const e of entries) {
          if (e.status === "active") activeMap[e.roomId] = e;
        }

        setBookings(activeMap);
        setBookingHistory(entries.slice(0, 50));
        setDbSynced(true);
      }
    } catch {
      // Cosmos offline — pakai localStorage
      setDbSynced(false);
    }
  }, []);

  // Load bookings saat mount (satu kali)
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    refreshBookings();
  }, [refreshBookings]);

  // ── Reschedule Report ─────────────────────────────────────────────────────
  const reportReschedule = useCallback((
    roomId: string, type: ReportType, note: string,
    extra?: { newDay?: string; newTime?: string }
  ) => {
    const user = getUserInfo();
    if (!user) return;
    setReschedules(prev => ({
      ...prev,
      [roomId]: { roomId, type, reportedBy: user.name, reportedById: user.id, reportedAt: new Date(), note, ...extra },
    }));
    setBookings(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    addToast({ type: "warning", title: "Laporan Terkirim", message: `Laporan untuk ${roomId} berhasil dikirim.` });
  }, [addToast]);

  const cancelReschedule = useCallback((roomId: string) => {
    setReschedules(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    setBookings(prev => { const n = { ...prev }; delete n[roomId]; return n; });
    addToast({ type: "info", title: "Laporan Dibatalkan", message: `Laporan untuk ${roomId} telah dihapus.` });
  }, [addToast]);

  // ── Booking ───────────────────────────────────────────────────────────────
  const bookRoom = useCallback(async (
    roomId: string, startTime: string, endTime: string, purpose: string, groupSize: number
  ): Promise<boolean> => {
    const user = getUserInfo();
    if (!user || bookings[roomId]) return false;

    const now = new Date();

    // Optimistic update lokal
    const localEntry: BookingEntry = {
      id: `booking-${Date.now()}`,
      roomId,
      bookedBy: user.name,
      bookedById: user.id,
      bookedAt: now,
      startTime, endTime, purpose, groupSize,
      status: "active",
    };

    setBookings(prev => ({ ...prev, [roomId]: localEntry }));
    setBookingHistory(prev => [localEntry, ...prev].slice(0, 50));

    // Sinkronisasi ke Cosmos di background
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          userId: user.id,
          bookedBy: user.name,
          bookedById: user.id,
          userClass: "",
          bookingDate: now.toISOString().slice(0, 10),
          day: now.toLocaleDateString("en-US", { weekday: "long" }),
          sessionStart: startTime,
          sessionEnd: endTime,
          startTime,
          endTime,
          purpose,
          groupSize,
          status: "active",
          createdAt: now.toISOString(),
        }),
      });

      if (res.ok) {
        const saved: CosmosBooking = await res.json();
        // Update id dengan yang dari Cosmos
        const cosmosEntry = cosmosToEntry({ ...saved, bookedBy: user.name, bookedById: user.id });
        setBookings(prev => ({ ...prev, [roomId]: cosmosEntry }));
        setBookingHistory(prev => [
          cosmosEntry,
          ...prev.filter(b => b.id !== localEntry.id),
        ].slice(0, 50));
      }
    } catch {
      // Cosmos offline — entry lokal tetap dipakai
    }

    addToast({ type: "success", title: "Booking Berhasil!", message: `${roomId} · ${startTime}–${endTime}` });
    return true;
  }, [bookings, addToast]);

  const cancelBooking = useCallback(async (roomId: string) => {
    const entry = bookings[roomId];
    if (!entry) return;

    // Optimistic update
    setBookingHistory(prev => prev.map(b => b.id === entry.id ? { ...b, status: "cancelled" } : b));
    setBookings(prev => { const n = { ...prev }; delete n[roomId]; return n; });

    // Sinkronisasi ke Cosmos
    try {
      await fetch(`/api/bookings/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
    } catch {
      // Cosmos offline — perubahan lokal tetap
    }

    addToast({ type: "info", title: "Booking Dibatalkan", message: `Booking ${roomId} telah dibatalkan.` });
  }, [bookings, addToast]);

  const rescheduleBooking = useCallback((roomId: string, newStart: string, newEnd: string): boolean => {
    const entry = bookings[roomId];
    const user  = getUserInfo();
    if (!entry || entry.bookedById !== user?.id) return false;
    const updated = { ...entry, startTime: newStart, endTime: newEnd };
    setBookings(prev => ({ ...prev, [roomId]: updated }));
    setBookingHistory(prev => prev.map(b => b.id === entry.id ? updated : b));
    addToast({ type: "success", title: "Jadwal Diubah", message: `${roomId} · ${newStart}–${newEnd}` });
    return true;
  }, [bookings, addToast]);

  // ── Favorites ─────────────────────────────────────────────────────────────
  const toggleFavorite = useCallback((roomId: string) => {
    setFavorites(prev => {
      const next = prev.includes(roomId) ? prev.filter(r => r !== roomId) : [...prev, roomId];
      addToast({
        type: "info",
        title: prev.includes(roomId) ? "Dihapus dari Favorit" : "Ditambah ke Favorit",
        message: roomId,
      });
      return next;
    });
  }, [addToast]);

  const isFavorite = useCallback((roomId: string) => favorites.includes(roomId), [favorites]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const isRescheduled = useCallback((id: string) => !!reschedules[id], [reschedules]);
  const isBooked      = useCallback((id: string) => !!bookings[id],    [bookings]);
  const getBooking    = useCallback((id: string) => bookings[id],      [bookings]);
  const getReschedule = useCallback((id: string) => reschedules[id],   [reschedules]);

  const getMyBookings = useCallback(() => {
    const user = getUserInfo();
    return user ? Object.values(bookings).filter(b => b.bookedById === user.id) : [];
  }, [bookings]);

  const getMyReports = useCallback(() => {
    const user = getUserInfo();
    return user ? Object.values(reschedules).filter(r => r.reportedById === user.id) : [];
  }, [reschedules]);

  return (
    <BookingContext.Provider value={{
      reschedules, bookings, bookingHistory, favorites, toasts, dbSynced,
      reportReschedule, cancelReschedule, bookRoom, cancelBooking, rescheduleBooking,
      toggleFavorite, isFavorite,
      isRescheduled, isBooked, getBooking, getReschedule, getMyBookings, getMyReports,
      addToast, removeToast, refreshBookings,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking harus digunakan di dalam BookingProvider");
  return ctx;
}
