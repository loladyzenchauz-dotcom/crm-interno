import { NextRequest, NextResponse } from "next/server";
import { createTask } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = body.type || "outreach";
  if (!body.accountId || !body.scheduledDate) {
    return NextResponse.json(
      { error: "accountId and scheduledDate are required" },
      { status: 400 }
    );
  }
  if (type === "outreach" && (!body.contactId || !body.channel)) {
    return NextResponse.json(
      { error: "contactId and channel are required for outreach tasks" },
      { status: 400 }
    );
  }
  const task = await createTask({
    accountId: body.accountId,
    type,
    contactId: body.contactId,
    channel: body.channel,
    scheduledDate: body.scheduledDate,
    notes: body.notes,
  });
  return NextResponse.json(task, { status: 201 });
}
