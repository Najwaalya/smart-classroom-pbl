import { Status } from "@/types/class";

export function getStatus(people: number): Status {
  if (people >= 13) return 'Aktif';
  if (people >= 4) return 'Tidak Pasti';
  return 'Kosong';
}

export function getStatusColor(status: Status): string {
  const colorMap = {
    'Aktif': 'px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700',
    'Tidak Pasti': 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700',
    'Kosong': 'px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700',
  };
  return colorMap[status];
}
