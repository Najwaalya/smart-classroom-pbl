"use client";

import {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";

import useSWR from "swr";

import { useRoomData } from "@/contexts/RoomDataContext";

import {
  getRole,
  getUserInfo,
} from "@/lib/auth";

import {
  AlertTriangle,
  CalendarCheck,
  X,
  Info,
} from "lucide-react";

import {
  DAYS,
  FLOORS,
  TIME_SLOTS,
  toMin,
  FLOOR_SUFFIX,
  getRoomsForFloor,
  getScheduleForSlot,
  getCurrentDay,
  sessionToTime,
  normalizeDayKey,
} from "@/lib/schedule-utils";

import {
  BookingForm,
  BookingRecord,
} from "@/components/booking/BookingForm";

import {
  BookingCard,
} from "@/components/booking/BookingCard";

const fetcher = async (
  url: string
) => {

  const res =
    await fetch(url);

  if (!res.ok) {
    throw new Error(
      "Failed fetch"
    );
  }

  return res.json();
};

interface UserInfo {
  id: string;
  name: string;
  role: string;
  class?: string;
}

interface RoomData {
  id: string;
  students: number;
  status:
    | "active"
    | "empty"
    | "uncertain";
}

interface RoomOption {
  id: string;
  name: string;
  wing?: string | null;
  floor?: string | number | null;
}

export default function BookingPage() {

  // =========================================
  // USER
  // =========================================

  const [role, setRole] =
    useState<string | null>(
      null
    );

  const [userInfo, setUserInfo] =
    useState<UserInfo | null>(
      null
    );

  const [myId, setMyId] =
    useState<string | null>(
      null
    );

  // =========================================
  // ROOM CONTEXT
  // =========================================

  const {
    rooms,
  } = useRoomData() as {
    rooms: RoomData[];
  };

  const [roomOptions, setRoomOptions] =
    useState<RoomOption[]>([]);
  const [roomsFetchLoading, setRoomsFetchLoading] =
    useState<boolean>(true);

  useEffect(() => {
    const loadRooms = async () => {
      setRoomsFetchLoading(true);
      try {
        const response = await fetch("/api/rooms", {
          cache: "no-store",
        });
        const json = await response.json();

        if (
          response.ok &&
          json?.success === true &&
          Array.isArray(json.rooms)
        ) {
          setRoomOptions(json.rooms);
        } else {
          setRoomOptions([]);
        }
      } catch (_error) {
        setRoomOptions([]);
      } finally {
        setRoomsFetchLoading(false);
      }
    };

    loadRooms();
  }, []);

  // =========================================
  // FILTER
  // =========================================

  const [selectedFloor, setSelectedFloor] =
    useState<string>("5");

  const [selectedDay, setSelectedDay] =
    useState<string>(
      getCurrentDay()
    );

  // =========================================
  // UI STATE
  // =========================================

  const [
    autoCancelMsg,
    setAutoCancelMsg,
  ] = useState<
    string | null
  >(null);

  const [
    bookingError,
    setBookingError,
  ] = useState<string | null>(null);

  const [
    bookingSuccess,
    setBookingSuccess,
  ] = useState<string | null>(null);

  // =========================================
  // FETCH BOOKINGS
  // =========================================

  const {
    data: bookingsData,
    mutate,
    isLoading,
  } = useSWR<{ success: boolean; bookings: BookingRecord[] }>(
    "/api/bookings",
    fetcher,
    {
      refreshInterval: 5000,
    }
  );

  const bookings = useMemo(() => {
    if (!bookingsData || !bookingsData.success) return [];
    const rawBookings = Array.isArray(bookingsData.bookings) ? bookingsData.bookings : [];
    return rawBookings.map((b: any) => ({
      ...b,
      startTime: String(b.startTime ?? b.sessionStart ?? ""),
      endTime: String(b.endTime ?? b.sessionEnd ?? ""),
      sessionStart: b.sessionStart,
      sessionEnd: b.sessionEnd,
    })) as BookingRecord[];
  }, [bookingsData]);

  // =========================================
  // FETCH SCHEDULES
  // =========================================

  const {
    data: schedulesData,
    isLoading: schedulesLoading,
  } = useSWR<{ success: boolean; schedules: any[] }>(
    "/api/schedules",
    fetcher,
    {
      refreshInterval: 30000,
    }
  );

  // Konversi data CosmosDB: sessionStart/sessionEnd bisa berupa nomor sesi.
  // PENTING: normalisasi field 'day' dan pastikan endTime dihitung dari sessionEnd yang benar.
  const schedules = useMemo(() => {
    if (!schedulesData || !schedulesData.success) return [];
    const raw = Array.isArray(schedulesData.schedules) ? schedulesData.schedules : [];
    return raw.map((c: any) => {
      const startNum = Number(c.sessionStart);
      const endNum   = Number(c.sessionEnd);

      // sessionStart → waktu mulai sesi
      const convertedStart = (!isNaN(startNum) && startNum > 0)
        ? sessionToTime(startNum)
        : null;

      // sessionEnd → waktu selesai sesi (jika number); jika string waktu pakai langsung
      const convertedEnd = (!isNaN(endNum) && endNum > 0)
        ? sessionToTime(endNum)
        : null;

      return {
        ...c,
        // Normalisasi day: "Senin" → "Monday", "Sel" → "Tuesday", dll.
        day:    normalizeDayKey(String(c.day ?? "")),
        roomId: c.roomId ?? c.room ?? "",
        room:   c.roomId ?? c.room ?? "",
        start:     convertedStart?.startTime ?? String(c.startTime ?? c.start ?? ""),
        end:       convertedEnd?.endTime     ?? String(c.sessionEnd ?? c.endTime ?? c.end ?? ""),
        startTime: convertedStart?.startTime ?? String(c.startTime ?? c.start ?? ""),
        endTime:   convertedEnd?.endTime     ?? String(c.sessionEnd ?? c.endTime ?? c.end ?? ""),
        // Pertahankan nilai asli untuk pengecekan nomor sesi
        sessionStart: c.sessionStart,
        sessionEnd:   c.sessionEnd,
      };
    });
  }, [schedulesData]);

  // =========================================
  // INIT CLIENT DATA
  // =========================================

  useEffect(() => {

    const roleData =
      getRole();

    const userData =
      getUserInfo();

    const userId =
      localStorage.getItem(
        "userId"
      );

    setRole(roleData);

    setUserInfo(userData);

    setMyId(userId);

  }, []);

  // =========================================
  // ROOMS BY FLOOR
  // =========================================

  // Helper: normalisasi nama ruangan untuk fuzzy matching
  // Menghapus separator agar "RT5-5T" == "RT55T" == "rt5_5t"
  function normalizeRoomId(id: string): string {
    return id.toLowerCase().replace(/[-_\s]/g, "");
  }

  const roomsOnFloor = useMemo(() => {
    // ── Prioritas 1: Ambil ruangan dari data jadwal (roomId pasti konsisten) ──
    if (schedules.length > 0) {
      const fromSchedules = getRoomsForFloor(selectedFloor, schedules);
      if (fromSchedules.length > 0) {
        // Enrichment: cari label cantik dari roomOptions jika ada
        return fromSchedules.map(id => {
          const match = roomOptions.find(
            r => normalizeRoomId(r.id) === normalizeRoomId(id) ||
                 normalizeRoomId(r.name ?? "") === normalizeRoomId(id)
          );
          return { id, label: match?.name ?? id };
        });
      }
    }

    // ── Prioritas 2: Dari /api/rooms filtered by floor ──
    if (roomOptions.length > 0) {
      const sameFloorRooms = roomOptions
        .filter((room) => String(room.floor) === selectedFloor)
        .sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
      if (sameFloorRooms.length > 0) {
        return sameFloorRooms.map((room) => ({
          id: room.id,
          label: room.name ?? room.id,
        }));
      }
    }

    // ── Prioritas 3: Dari RoomDataContext ──
    const suffixes = FLOOR_SUFFIX[selectedFloor] || [];
    if (rooms && rooms.length > 0 && suffixes.length > 0) {
      return rooms
        .map((r) => ({ id: r.id, label: r.id }))
        .filter((room) => suffixes.some((sfx) => room.id.includes(sfx)))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    return [];
  }, [selectedFloor, rooms, schedules, roomOptions]);

  // =========================================
  // FIND BOOKING SLOT
  // =========================================

  function getBookingForSlot(
    roomId: string,
    day: string,
    slot: typeof TIME_SLOTS[number]
  ): BookingRecord | null {
    const normalizedDay = normalizeDayKey(day);
    return bookings.find(b => {
      if (normalizeRoomId(b.roomId) !== normalizeRoomId(roomId)) return false;
      if (normalizeDayKey(b.day) !== normalizedDay) return false;

      const startRaw = String(b.startTime ?? (b as any).sessionStart ?? "");
      const endRaw = String(b.endTime ?? (b as any).sessionEnd ?? "");

      // Jika kosong, skip
      if (!startRaw || !endRaw) return false;

      // Cek apakah berupa nomor sesi
      const startNum = Number(startRaw);
      const endNum = Number(endRaw);
      if (!isNaN(startNum) && startNum > 0 && !startRaw.includes(":")) {
        return slot.slot >= startNum && slot.slot <= endNum;
      }

      // Fallback: format waktu HH:MM
      if (!startRaw.includes(":") || !endRaw.includes(":")) return false;
      return toMin(startRaw) < toMin(slot.end) &&
             toMin(endRaw) > toMin(slot.start);
    }) ?? null;
  }

  // =========================================
  // CHECK SLOT BLOCKED
  // =========================================

  function checkSlotBlocked(
    roomId: string,
    day: string,
    slot: typeof TIME_SLOTS[number]
  ): boolean {
    console.log("[checkSlotBlocked] bookings:", bookings.map(b => ({
      roomId: b.roomId, day: b.day, start: b.startTime, end: b.endTime
    })));
    console.log("[checkSlotBlocked] checking:", { roomId, day, slot });

    const normalizedDay = normalizeDayKey(day);
    const normRoom = normalizeRoomId(roomId);

    // ── Lapisan 1: Session number match (paling andal untuk CosmosDB) ──
    // Cocokkan hari + slot number, dengan fuzzy room matching
    const blockedBySession = schedules.some(s => {
      const sRoom = s.roomId || s.room || "";
      const sDay  = normalizeDayKey(s.day || "");

      // Fuzzy room match: "RT5-5T" vs "room-001" → normalisasi dulu
      const roomMatch =
        sRoom === roomId ||
        normalizeRoomId(sRoom) === normRoom;

      if (!roomMatch || sDay !== normalizedDay) return false;

      const sStart = Number(s.sessionStart);
      if (isNaN(sStart) || sStart <= 0) return false;

      const sEndNum = Number(s.sessionEnd);
      if (!isNaN(sEndNum) && sEndNum > 0) {
        // sessionEnd juga nomor: range check
        return slot.slot >= sStart && slot.slot <= sEndNum;
      }
      // sessionEnd adalah string waktu: cek hanya sessionStart
      return slot.slot === sStart;
    });
    if (blockedBySession) return true;

    // ── Lapisan 2: Time-range check ──
    if (getScheduleForSlot(roomId, normalizedDay, slot, schedules)) return true;

    // ── Lapisan 3: Booking existing ──
    if (getBookingForSlot(roomId, normalizedDay, slot)) return true;

    return false;
  }

  // =========================================
  // CREATE BOOKING
  // =========================================

  async function addBooking(
    record: BookingRecord
  ) {
    setBookingError(null);
    setBookingSuccess(null);

    try {
      // Hitung tanggal dari hari yang dipilih (hari ini atau mendatang)
      const today = new Date();
      const dayIndexMap: Record<string, number> = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
        Thursday: 4, Friday: 5, Saturday: 6,
      };
      const targetDayIndex = dayIndexMap[record.day] ?? today.getDay();
      const currentDayIndex = today.getDay();
      const diff = (targetDayIndex - currentDayIndex + 7) % 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      const dateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

      const payload = {
        roomId: record.roomId,
        day: record.day,
        date: dateStr,
        startTime: record.startTime,
        endTime: record.endTime,
        purpose: record.purpose,
        bookedBy: record.bookedBy,
        bookedById: record.bookedById ?? myId,
        userId: myId,
        userClass: userInfo?.class ?? "-",
      };

      console.log("[addBooking] Sending payload:", payload);

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      console.log("[addBooking] API response:", json);

      if (!response.ok || !json.success) {
        const msg = json?.message ?? "Gagal membuat booking. Silakan coba lagi.";
        setBookingError(msg);
        setTimeout(() => setBookingError(null), 6000);
        return;
      }

      setBookingSuccess(`Booking berhasil! Ruangan ${record.roomId} telah dipesan.`);
      setTimeout(() => setBookingSuccess(null), 5000);
      await mutate(undefined, { revalidate: true });

    } catch (error) {
      console.error("[addBooking] Network error:", error);
      setBookingError("Koneksi gagal. Pastikan server berjalan dan coba lagi.");
      setTimeout(() => setBookingError(null), 6000);
    }
  }

  // =========================================
  // DELETE BOOKING
  // =========================================

  async function cancelBooking(
    id: string
  ) {
    try {
      // DELETE menggunakan query param ?id= sesuai route handler
      const response = await fetch(`/api/bookings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed delete booking");
      }

      mutate();
    } catch (error) {
      console.error("[cancelBooking] Error:", error);
    }
  }

  // =========================================
  // AUTO CANCEL
  // =========================================

  const autoCancel =
    useCallback(
      async () => {

        const now =
          new Date();

        const today =
          now.toLocaleDateString(
            "en-US",
            {
              weekday:
                "long",
            }
          );

        const nowMin =
          now.getHours() *
            60 +
          now.getMinutes();

        const cancelled:
          string[] =
          [];

        for (const b of bookings) {

          if (
            b.day !==
            today
          ) {
            continue;
          }

          // Skip jika startTime bukan format HH:MM
          if (!b.startTime || !b.startTime.includes(":")) continue;
          if (!b.endTime || !b.endTime.includes(":")) continue;

          const bookingStartMin =
            toMin(
              b.startTime
            );

          const bookingEndMin =
            toMin(
              b.endTime
            );

          // Belum mulai

          if (
            nowMin <
            bookingStartMin
          ) {
            continue;
          }

          // Sudah selesai

          if (
            nowMin >=
            bookingEndMin
          ) {
            continue;
          }

          // Check room

          const room =
            rooms.find(
              (r) =>
                r.id ===
                b.roomId
            );

          if (
            room &&
            room.students >
              0 &&
            room.status ===
              "active"
          ) {

            if (
              b.bookedById ===
              myId
            ) {

              cancelled.push(
                `${b.roomId} (${b.startTime}–${b.endTime})`
              );
            }

            await fetch(
              `/api/bookings/${b.id}`,
              {
                method:
                  "DELETE",
              }
            );
          }
        }

        if (
          cancelled.length >
          0
        ) {

          setAutoCancelMsg(
            `Booking dibatalkan otomatis karena ruangan sudah terisi: ${cancelled.join(", ")}`
          );

          setTimeout(
            () => {

              setAutoCancelMsg(
                null
              );

            },
            8000
          );

          mutate();
        }
      },
      [
        bookings,
        rooms,
        myId,
        mutate,
      ]
    );

  // =========================================
  // AUTO CANCEL INTERVAL
  // =========================================

  useEffect(() => {

    if (
      bookings.length ===
      0
    ) {
      return;
    }

    autoCancel();

    const interval =
      setInterval(
        autoCancel,
        30000
      );

    return () =>
      clearInterval(
        interval
      );

  }, [
    autoCancel,
    bookings.length,
  ]);

  // =========================================
  // MY BOOKINGS
  // =========================================

  const myBookingsToday =
    useMemo(
      () =>
        bookings.filter(
          (b) =>
            b.bookedById ===
              myId &&
            b.day ===
              selectedDay
        ),
      [
        bookings,
        myId,
        selectedDay,
      ]
    );

  // =========================================
  // DAY LABEL
  // =========================================

  const dayLabel =
    DAYS.find(
      (d) =>
        d.key ===
        selectedDay
    )?.label ??
    selectedDay;

  // =========================================
  // ACCESS DENIED
  // =========================================

  if (
    role &&
    role !==
      "student"
  ) {

    return (
      <div className="page-wrapper anim-fade-up">

        <div className="flex flex-col gap-6 pb-12">

          <div
            className="
              flex items-center gap-3
              p-6
              bg-amber-50
              rounded-2xl
              border border-amber-200
            "
          >

            <AlertTriangle
              size={20}
              className="text-amber-600"
            />

            <div>

              <p
                className="
                  font-black
                  text-amber-900
                "
              >
                Akses Terbatas
              </p>

              <p
                className="
                  text-sm
                  text-amber-700
                  mt-1
                "
              >
                Halaman booking
                hanya dapat
                diakses oleh
                mahasiswa.
              </p>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // =========================================
  // LOADING
  // =========================================

  if (isLoading || schedulesLoading || bookingsData === undefined) {

    return (
      <div className="page-wrapper">

        <div className="py-10 text-sm text-slate-500">
          Loading data...
        </div>

      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div className="page-wrapper anim-fade-up">

      <div className="flex flex-col gap-6 pb-12">

        {/* HEADER */}

        <div>

          <h1
            className="
              text-3xl
              font-black
              text-slate-800
              tracking-tight
            "
          >
            Booking Ruangan
          </h1>

          <p
            className="
              text-sm
              text-slate-500
              mt-1
            "
          >
            Booking ruangan
            kosong untuk
            kegiatan mahasiswa.
          </p>

        </div>

        {/* AUTO CANCEL */}

        {autoCancelMsg && (

          <div
            className="
              flex items-start gap-3
              p-4
              bg-red-50
              rounded-2xl
              border border-red-200
            "
          >

            <AlertTriangle
              size={16}
              className="
                text-red-500
                shrink-0
                mt-0.5
              "
            />

            <div className="flex-1">

              <p
                className="
                  text-sm
                  font-black
                  text-red-800
                "
              >
                Booking
                Dibatalkan
              </p>

              <p
                className="
                  text-xs
                  text-red-600
                  mt-0.5
                "
              >
                {autoCancelMsg}
              </p>

            </div>

            <button
              onClick={() =>
                setAutoCancelMsg(
                  null
                )
              }
            >

              <X size={14} />

            </button>

          </div>
        )}

        {/* BOOKING ERROR */}

        {bookingError && (
          <div
            className="
              flex items-start gap-3
              p-4
              bg-red-50
              rounded-2xl
              border border-red-200
            "
          >
            <AlertTriangle
              size={16}
              className="text-red-500 shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-black text-red-800">Booking Gagal</p>
              <p className="text-xs text-red-600 mt-0.5">{bookingError}</p>
            </div>
            <button onClick={() => setBookingError(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* BOOKING SUCCESS */}

        {bookingSuccess && (
          <div
            className="
              flex items-start gap-3
              p-4
              bg-emerald-50
              rounded-2xl
              border border-emerald-200
            "
          >
            <Info
              size={16}
              className="text-emerald-500 shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-800">Booking Berhasil! 🎉</p>
              <p className="text-xs text-emerald-600 mt-0.5">{bookingSuccess}</p>
            </div>
            <button onClick={() => setBookingSuccess(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* BOOKING FORM */}

        <BookingForm
          key={bookings.length}
          selectedFloor={
            selectedFloor
          }
          selectedDay={
            selectedDay
          }
          onDayChange={
            setSelectedDay
          }
          roomsForFloor={
            roomsOnFloor
          }
          onBooked={
            addBooking
          }
          checkSlotBlocked={
            checkSlotBlocked
          }
        />

        {/* MY BOOKINGS */}

        {myBookingsToday.length >
          0 && (

          <div className="flex flex-col gap-3">

            <h2
              className="
                text-sm
                font-black
                text-slate-800
                flex items-center gap-2
              "
            >

              <CalendarCheck
                size={15}
                className="
                  text-[var(--color-primary)]
                "
              />

              Booking Saya —
              {dayLabel}

            </h2>

            <div className="flex flex-col gap-2">

              {myBookingsToday.map(
                (b) => (

                  <BookingCard
                    key={b.id}
                    booking={b}
                    isOwner={true}
                    onCancel={
                      cancelBooking
                    }
                  />
                )
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}