import { NextRequest, NextResponse } from "next/server";
import { listMeetings, createMeeting } from "@/lib/store";

export async function GET() {
  const meetings = await listMeetings();
  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.company) {
    return NextResponse.json({ error: "company is required" }, { status: 400 });
  }
  const meeting = await createMeeting(body);
  return NextResponse.json(meeting, { status: 201 });
}
