import { NextRequest, NextResponse } from "next/server";
import { listAccounts, createAccount } from "@/lib/store";

export async function GET() {
  const accounts = await listAccounts();
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const account = await createAccount({
    name: body.name,
    industry: body.industry,
    notes: body.notes,
  });
  return NextResponse.json(account, { status: 201 });
}
