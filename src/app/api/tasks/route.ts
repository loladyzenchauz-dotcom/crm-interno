import { NextRequest, NextResponse } from "next/server";
import { createTask } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.accountId || !body.contactId || !body.channel || !body.scheduledDate) {
    return NextResponse.json(
      {
        error:
          "accountId, contactId, channel and scheduledDate are required",
      },
      { status: 400 }
    );
  }
  const task = await createTask({
    accountId: body.accountId,
    contactId: body.contactId,
    channel: body.channel,
    scheduledDate: body.scheduledDate,
    notes: body.notes,
  });
  return NextResponse.json(task, { status: 201 });
}
