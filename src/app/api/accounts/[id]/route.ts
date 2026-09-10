import { NextRequest, NextResponse } from "next/server";
import { getAccountWithRelations, updateAccountStage } from "@/lib/store";
import { Stage } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const account = await getAccountWithRelations(id);
  if (!account) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(account);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const stage = body.stage as Stage;
  const account = await updateAccountStage(id, stage);
  if (!account) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(account);
}
