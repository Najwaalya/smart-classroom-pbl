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

    return NextResponse.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    console.error("[GET /api/sessions] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}