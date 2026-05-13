import { NextResponse } from "next/server";
import { scheduleContainer } from "@/lib/cosmos";

export async function GET() {
  try {
    console.log("[TEST] Testing direct Cosmos DB query...");
    
    const { resources } = await scheduleContainer.items
      .query("SELECT * FROM c")
      .fetchAll();
    
    console.log(`[TEST] Found ${resources.length} schedules`);
    
    return NextResponse.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error: any) {
    console.error("[TEST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
