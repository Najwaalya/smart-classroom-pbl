import { NextResponse } from "next/server";
import { sessionContainer } from "@/lib/cosmos";

export async function GET() {

  try {

    const querySpec = {
      query: "SELECT * FROM c ORDER BY c.sessionNumber ASC",
    };

    const { resources } = await sessionContainer.items
      .query(querySpec)
      .fetchAll();

    return NextResponse.json(resources);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}