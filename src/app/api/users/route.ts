import { NextResponse } from "next/server";
import { userContainer } from "@/lib/cosmos";

export async function GET() {

  try {

    const querySpec = {
      query: "SELECT * FROM c",
    };

    const { resources } = await userContainer.items
      .query(querySpec)
      .fetchAll();

    return NextResponse.json(resources);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}