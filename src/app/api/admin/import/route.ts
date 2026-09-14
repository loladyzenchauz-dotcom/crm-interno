import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface SeedContact {
  name: string;
  role?: string | null;
  linkedin?: string | null;
  email?: string | null;
  phone?: string | null;
  li_sent: number;
  emails_sent: number;
  calls: number;
  whatsapp: number;
  estado_nota?: string | null;
  nota?: string | null;
}

interface SeedAccount {
  name: string;
  industry?: string | null;
  stage: string;
  notes?: string | null;
  contacts: SeedContact[];
}

// One-time import endpoint: POST the seed data (array of accounts) as the
// request body directly. Nothing is bundled in the repo — this only inserts
// what it's given, and is safe to call more than once (idempotent ids).
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const expected = process.env.IMPORT_SECRET;
  if (!expected || searchParams.get("secret") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const accounts = (await req.json()) as SeedAccount[];
  if (!Array.isArray(accounts)) {
    return NextResponse.json(
      { error: "body must be an array of accounts" },
      { status: 400 }
    );
  }

  const pool = getPool();
  const today = new Date().toISOString().slice(0, 10);

  let accountsCreated = 0;
  let contactsCreated = 0;
  let touchpointsCreated = 0;

  for (const acc of accounts) {
    const accountId = `acc-${slugify(acc.name)}`;
    await pool.query(
      `insert into accounts (id, name, industry, stage, notes)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do nothing`,
      [accountId, acc.name, acc.industry || null, acc.stage, acc.notes || null]
    );
    accountsCreated++;

    for (const [i, contact] of acc.contacts.entries()) {
      const contactId = `${accountId}-c${i}`;
      const notesParts = [contact.nota, contact.estado_nota].filter(Boolean);
      await pool.query(
        `insert into contacts (id, account_id, name, role, linkedin, email, phone, is_primary)
         values ($1, $2, $3, $4, $5, $6, $7, false)
         on conflict (id) do nothing`,
        [
          contactId,
          accountId,
          contact.name,
          [contact.role, notesParts.join(" / ")].filter(Boolean).join(" — ") || null,
          contact.linkedin || null,
          contact.email || null,
          contact.phone || null,
        ]
      );
      contactsCreated++;

      const channelCounts: [string, number][] = [
        ["linkedin", contact.li_sent],
        ["email", contact.emails_sent],
        ["call", contact.calls],
        ["whatsapp", contact.whatsapp],
      ];
      for (const [channel, count] of channelCounts) {
        for (let n = 0; n < count; n++) {
          const tpId = `${contactId}-tp-${channel}-${n}`;
          await pool.query(
            `insert into touchpoints (id, contact_id, account_id, channel, date, notes)
             values ($1, $2, $3, $4, $5, $6)
             on conflict (id) do nothing`,
            [
              tpId,
              contactId,
              accountId,
              channel,
              today,
              "Migrado desde Excel (fecha exacta no disponible)",
            ]
          );
          touchpointsCreated++;
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    accountsProcessed: accountsCreated,
    contactsProcessed: contactsCreated,
    touchpointsProcessed: touchpointsCreated,
  });
}
