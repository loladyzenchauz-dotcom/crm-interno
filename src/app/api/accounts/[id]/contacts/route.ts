import { NextRequest, NextResponse } from "next/server";
import { createContact } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const contact = await createContact({
    accountId: id,
    name: body.name,
    role: body.role,
    linkedin: body.linkedin,
    email: body.email,
    phone: body.phone,
    isPrimary: body.isPrimary,
  });
  return NextResponse.json(contact, { status: 201 });
}
