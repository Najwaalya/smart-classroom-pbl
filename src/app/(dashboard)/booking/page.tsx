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
    return Array.isArray(bookingsData.bookings) ? bookingsData.bookings : [];
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

  const schedules = useMemo(() => {
    if (!schedulesData || !schedulesData.success) return [];
    return Array.isArray(schedulesData.schedules) ? schedulesData.schedules : [];
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

  const roomsOnFloor = useMemo(() => {
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

    const suffixes = FLOOR_SUFFIX[selectedFloor] || [];
    if (rooms && rooms.length > 0 && suffixes.length > 0) {
      return rooms
        .map((r) => ({ id: r.id, label: r.id }))
        .filter((room) => suffixes.some((sfx) => room.id.includes(sfx)))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    const roomsFromSchedules = getRoomsForFloor(selectedFloor, schedules);
    return roomsFromSchedules.map((id) => ({ id, label: id }));
  }, [selectedFloor, rooms, schedules, roomOptions]);

  // =========================================
  // FIND BOOKING SLOT
  // =========================================

  function getBookingForSlot(
    roomId: string,
    day: string,
    slot: typeof TIME_SLOTS[number]
  ): BookingRecord | null {

    return (
      bookings.find(
        (b) =>
          b.roomId ===
            roomId &&
          b.day === day &&
          toMin(
            b.startTime
          ) <
            toMin(
              slot.end
            ) &&
          toMin(
            b.endTime
          ) >
            toMin(
              slot.start
            )
      ) ?? null
    );
  }

  // =========================================
  // CHECK SLOT BLOCKED
  // =========================================

  function checkSlotBlocked(
    roomId: string,
    day: string,
    slot: typeof TIME_SLOTS[number]
  ): boolean {

    // Jadwal kelas

    if (
      getScheduleForSlot(
        roomId,
        day,
        slot,
        schedules
      )
    ) {
      return true;
    }

    // Booking existing

    const existingBooking =
      getBookingForSlot(
        roomId,
        day,
        slot
      );

    if (
      existingBooking
    ) {
      return true;
    }

    return false;
  }

  // =========================================
  // CREATE BOOKING
  // =========================================

  async function addBooking(
    record: BookingRecord
  ) {

    try {

      const response =
        await fetch(
          "/api/bookings",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  ...record,

                  userId:
                    myId,

                  userClass:
                    userInfo?.class ??
                    "-",
                }
              ),
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          "Failed create booking"
        );
      }

      mutate();

    } catch (error) {

      console.error(
        error
      );
    }
  }

  // =========================================
  // DELETE BOOKING
  // =========================================

  async function cancelBooking(
    id: string
  ) {

    try {

      const response =
        await fetch(
          `/api/bookings/${id}`,
          {
            method:
              "DELETE",
          }
        );

      if (
        !response.ok
      ) {
        throw new Error(
          "Failed delete booking"
        );
      }

      mutate();

    } catch (error) {

      console.error(
        error
      );
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

  if (isLoading || schedulesLoading) {

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

        {/* BOOKING FORM */}

        <BookingForm
          selectedFloor={
            selectedFloor
          }
          selectedDay={
            selectedDay
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