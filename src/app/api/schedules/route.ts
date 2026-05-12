import { NextResponse } from "next/server";
import { scheduleContainer } from "@/lib/cosmos";

export async function GET() {

  try {

    const querySpec = {
      query: "SELECT * FROM c",
    };

    const { resources } = await scheduleContainer.items
      .query(querySpec)
      .fetchAll();

    return NextResponse.json(resources);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const schedule = {
      id: `schedule-${Date.now()}`,
      roomId: body.roomId,
      classCode: body.classCode,
      courseName: body.courseName,
      day: body.day,
      sessionStart: body.sessionStart,
      sessionEnd: body.sessionEnd,
      scheduleStatus: "scheduled",
      isRescheduled: false,
    };

    const { resource } =
      await scheduleContainer.items.create(schedule);

    return NextResponse.json(resource);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}