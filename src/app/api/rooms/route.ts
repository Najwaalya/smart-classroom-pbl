import { NextResponse } from "next/server";
import { roomContainer } from "@/lib/cosmos";

interface CosmosRoom {
  id: string;

  roomName?: string;
  name?: string;
  wing?: string | null;
  floor?: string | number;
}

export async function GET(request: Request) {
  try {
    // Query semua rooms dari kontainer 'rooms' di Cosmos DB tanpa filter nama atau status
    const { resources: cosmosRooms } = await roomContainer.items
      .query<CosmosRoom>("SELECT * FROM c ORDER BY c.id ASC")
      .fetchAll();

    if (!cosmosRooms || cosmosRooms.length === 0) {
      return NextResponse.json(
        { success: true, rooms: [] },
        { status: 200 }
      );
    }

    const rooms = cosmosRooms.map((room) => ({
      id: room.id,
      name: room.roomName || room.name || room.id,
      wing: room.wing ?? null,
      floor: room.floor ?? null,
    }));

    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch rooms",
      },
      { status: 500 }
    );
  }
}
