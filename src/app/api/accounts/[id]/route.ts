import { NextRequest, NextResponse } from "next/server";
import {
  getAccountWithRelations,
  updateAccountStage,
  updateAccountFields,
} from "@/lib/store";
import { getPool } from "@/lib/db";
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

  let account = null;
  if (body.stage !== undefined) {
    account = await updateAccountStage(id, body.stage as Stage);
  }
  if (body.salesNavigatorUrl !== undefined || body.aeBrief !== undefined) {
    account = await updateAccountFields(id, {
      salesNavigatorUrl: body.salesNavigatorUrl,
      aeBrief: body.aeBrief,
    });
  }

  if (!account) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(account);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pool = getPool();
  await pool.query("delete from accounts where id = $1", [id]);
  return NextResponse.json({ ok: true });
}
