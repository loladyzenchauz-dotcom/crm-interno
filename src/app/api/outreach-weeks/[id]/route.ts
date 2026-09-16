import { NextRequest, NextResponse } from "next/server";
import { updateOutreachWeek } from "@/lib/store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const week = await updateOutreachWeek(id, body);
  if (!week) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(week);
}
