import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface SeedMeeting {
  forMonth?: string | null;
  meetingDate?: string | null; // ISO date
  company: string;
  contactName?: string | null;
  contactRole?: string | null;
  linkedinUrl?: string | null;
  type?: string | null;
  channel?: string | null;
  status?: string | null;
  ae?: string | null;
  sqcValue?: number | null;
  note?: string | null;
  qualified?: string | null;
  qualifiedByNacho?: string | null;
}

// One-time import endpoint para el tracker "Reuniones Agendadas" del Excel.
// POST el body con el array de reuniones. Idempotente (ids deterministas).
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const expected = process.env.IMPORT_SECRET;
  if (!expected || searchParams.get("secret") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const meetings = (await req.json()) as SeedMeeting[];
  if (!Array.isArray(meetings)) {
    return NextResponse.json(
      { error: "body must be an array of meetings" },
      { status: 400 }
    );
  }

  const pool = getPool();
  let processed = 0;

  for (const [i, m] of meetings.entries()) {
    const id = `mtg-seed-${slugify(m.company)}-${m.meetingDate || "s"}-${i}`;
    await pool.query(
      `insert into meetings
         (id, for_month, meeting_date, company, contact_name, contact_role,
          linkedin_url, type, channel, status, ae, sqc_value, note,
          qualified, qualified_by_nacho)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       on conflict (id) do nothing`,
      [
        id,
        m.forMonth || null,
        m.meetingDate || null,
        m.company,
        m.contactName || null,
        m.contactRole || null,
        m.linkedinUrl || null,
        m.type || null,
        m.channel || null,
        m.status || null,
        m.ae || null,
        m.sqcValue ?? null,
        m.note || null,
        m.qualified || null,
        m.qualifiedByNacho || null,
      ]
    );
    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
