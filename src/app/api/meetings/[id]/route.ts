import { NextRequest, NextResponse } from "next/server";
import { updateMeeting } from "@/lib/store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const meeting = await updateMeeting(id, body);
  if (!meeting) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(meeting);
}
