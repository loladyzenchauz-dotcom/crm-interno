import { NextRequest, NextResponse } from "next/server";
import { listOutreachWeeks, createOutreachWeek } from "@/lib/store";

export async function GET() {
  const weeks = await listOutreachWeeks();
  return NextResponse.json(weeks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.weekStart) {
    return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
  }
  const week = await createOutreachWeek(body);
  return NextResponse.json(week, { status: 201 });
}
