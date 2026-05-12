import { NextResponse } from "next/server";
import { sensorContainer } from "@/lib/cosmos";

export async function GET() {

  try {

    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.timestamp DESC",
    };

    const { resources } = await sensorContainer.items
      .query(querySpec)
      .fetchAll();

    return NextResponse.json(resources);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch sensor data" },
      { status: 500 }
    );
  }
}