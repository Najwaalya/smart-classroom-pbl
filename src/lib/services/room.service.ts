import { roomContainer } from "@/lib/cosmos";

export async function getRoomById(id: string) {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }],
    };
    const { resources } = await roomContainer.items.query(querySpec).fetchAll();
    if (!resources || resources.length === 0) return null;
    const resource = resources[0];
    return {
      id: resource.id,
      name: resource.roomName || resource.name || resource.id,
      wing: resource.wing ?? null,
      floor: resource.floor ?? null,
    };
  } catch (error) {
    console.error(`getRoomById error for ${id}:`, error);
    return null;
  }
}

export function deriveRoomStatus(
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