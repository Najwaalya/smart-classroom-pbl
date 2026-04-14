export function getStatus(count) {
  if (count <= 3) return "Kosong";
  if (count <= 12) return "Tidak Pasti";
  return "Aktif";
}

export function getStatusColor(status) {
  switch (status) {
    case "Aktif":
      return "status-green";
    case "Tidak Pasti":
      return "status-yellow";
    default:
      return "status-red";
  }
}