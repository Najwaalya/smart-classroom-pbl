interface Schedule {
  room: string;
  className: string;
  day: string;
  start: string;
  end: string;
}


interface HourlyData {
  time: string;
  occupancy: number;
  temp: number;
  timestamp?: string;
}

interface RoomStatusResult {
  status: "Empty" | "Scheduled" | "Active" | "Anomaly";
  label: string;
}

export function getRoomStatus(
  schedule: Schedule | null | undefined,
  latestData: HourlyData | undefined
): RoomStatusResult {
  if (!schedule) return { status: "Empty", label: "Tidak ada jadwal" };

  const now = new Date();

  const today = now.toLocaleDateString("en-US", { weekday: "long" });

  if (today !== schedule.day) {
    return { status: "Empty", label: "Di luar jadwal" };
  }

  const currentTime = now.toTimeString().slice(0, 5);

  const isScheduled =
    currentTime >= schedule.start && currentTime <= schedule.end;

  if (!isScheduled) {
    return { status: "Empty", label: "Tidak ada kelas" };
  }

  if (!latestData) {
    return { status: "Scheduled", label: "Menunggu aktivitas" };
  }

  const lastTime = new Date(latestData.timestamp || new Date());
  const diffMinutes =
    (now.getTime() - lastTime.getTime()) / 60000;

  if (latestData.occupancy > 0) {
    return { status: "Active", label: "Kelas sedang berlangsung" };
  }

  if (diffMinutes > 60) {
    return { status: "Anomaly", label: "Tidak ada aktivitas > 1 jam" };
  }

  return { status: "Scheduled", label: "Terjadwal, belum aktif" };
}