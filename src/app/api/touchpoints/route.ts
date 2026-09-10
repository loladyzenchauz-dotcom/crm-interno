import { NextRequest, NextResponse } from "next/server";
import { createTouchpoint } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.contactId || !body.accountId || !body.channel || !body.date) {
    return NextResponse.json(
      { error: "contactId, accountId, channel and date are required" },
      { status: 400 }
    );
  }
  const touchpoint = await createTouchpoint({
    contactId: body.contactId,
    accountId: body.accountId,
    channel: body.channel,
    date: body.date,
    notes: body.notes,
    outcome: body.outcome,
  });
  return NextResponse.json(touchpoint, { status: 201 });
}
