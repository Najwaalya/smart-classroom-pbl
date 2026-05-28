function deriveRoomStatus(
  motionDuration: number,
  peopleCount: number
): "active" | "uncertain" | "empty" {

  // jika masih ada orang
  if (peopleCount > 0) {
    return "active";
  }

  // ada gerakan baru-baru ini
  if (motionDuration < 60000) {
    return "active";
  }

  // tidak ada gerakan beberapa saat
  if (motionDuration < 300000) {
    return "uncertain";
  }

  // benar-benar kosong
  return "empty";
}