import { getPool } from "./db";
import {
  Account,
  Contact,
  Touchpoint,
  Task,
  Stage,
  Channel,
  AccountWithRelations,
  ACTIVE_PROSPECTING_STAGES,
  MeetingScheduledThisWeek,
  Summary,
  Meeting,
  MeetingType,
  MeetingStatus,
} from "./types";

function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d);
}

function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    name: row.name as string,
    industry: (row.industry as string) ?? undefined,
    stage: row.stage as Stage,
    notes: (row.notes as string) ?? undefined,
    salesNavigatorUrl: (row.sales_navigator_url as string) ?? undefined,
    aeBrief: (row.ae_brief as string) ?? undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    name: row.name as string,
    role: (row.role as string) ?? undefined,
    linkedin: (row.linkedin as string) ?? undefined,
    email: (row.email as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    isPrimary: Boolean(row.is_primary),
  };
}

function mapTouchpoint(row: Record<string, unknown>): Touchpoint {
  return {
    id: row.id as string,
    contactId: row.contact_id as string,
    accountId: row.account_id as string,
    channel: row.channel as Channel,
    date: toDateStr(row.date),
    notes: (row.notes as string) ?? undefined,
    outcome: (row.outcome as Touchpoint["outcome"]) ?? undefined,
  };
}

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    type: (row.type as Task["type"]) ?? "outreach",
    contactId: (row.contact_id as string) ?? undefined,
    channel: (row.channel as Channel) ?? undefined,
    scheduledDate: toDateStr(row.scheduled_date),
    done: Boolean(row.done),
    notes: (row.notes as string) ?? undefined,
  };
}

function mapMeeting(row: Record<string, unknown>): Meeting {
  return {
    id: row.id as string,
    forMonth: (row.for_month as string) ?? undefined,
    meetingDate: row.meeting_date ? toDateStr(row.meeting_date) : undefined,
    company: row.company as string,
    contactName: (row.contact_name as string) ?? undefined,
    contactRole: (row.contact_role as string) ?? undefined,
    linkedinUrl: (row.linkedin_url as string) ?? undefined,
    type: (row.type as MeetingType) ?? undefined,
    channel: (row.channel as string) ?? undefined,
    status: (row.status as MeetingStatus) ?? undefined,
    ae: (row.ae as string) ?? undefined,
    sqcValue:
      row.sqc_value === null || row.sqc_value === undefined
        ? undefined
        : Number(row.sqc_value),
    note: (row.note as string) ?? undefined,
    qualified: (row.qualified as string) ?? undefined,
    qualifiedByNacho: (row.qualified_by_nacho as string) ?? undefined,
    createdAt: new Date(row.created_at as string).toISOString(),
  };
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export async function listAccounts(): Promise<Account[]> {
  const pool = getPool();
  const res = await pool.query(
    "select * from accounts order by created_at desc"
  );
  return res.rows.map(mapAccount);
}

export async function updateAccountStage(
  accountId: string,
  stage: Stage
): Promise<Account | null> {
  const pool = getPool();

  const prevRes = await pool.query(
    "select stage from accounts where id = $1",
    [accountId]
  );
  const previousStage = prevRes.rows[0]?.stage as Stage | undefined;

  const res = await pool.query(
    "update accounts set stage = $1 where id = $2 returning *",
    [stage, accountId]
  );
  if (!res.rows[0]) return null;

  // Al entrar a "Reunión agendada" (desde cualquier otra etapa), crear
  // automáticamente el pendiente de preparar el brief para el AE, si todavía
  // no existe uno sin completar para esta cuenta.
  if (stage === "meeting_scheduled" && previousStage !== "meeting_scheduled") {
    const existing = await pool.query(
      `select id from tasks where account_id = $1 and type = 'ae_brief' and done = false limit 1`,
      [accountId]
    );
    if (existing.rows.length === 0) {
      await createTask({
        accountId,
        type: "ae_brief",
        scheduledDate: new Date().toISOString().slice(0, 10),
        notes: "Preparar y enviar el brief al AE con contexto previo a la reunión",
      });
    }
  }

  return mapAccount(res.rows[0]);
}

export async function updateAccountFields(
  accountId: string,
  fields: { salesNavigatorUrl?: string; aeBrief?: string }
): Promise<Account | null> {
  const pool = getPool();
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (fields.salesNavigatorUrl !== undefined) {
    sets.push(`sales_navigator_url = $${i++}`);
    values.push(fields.salesNavigatorUrl || null);
  }
  if (fields.aeBrief !== undefined) {
    sets.push(`ae_brief = $${i++}`);
    values.push(fields.aeBrief || null);
  }
  if (sets.length === 0) {
    const res = await pool.query("select * from accounts where id = $1", [
      accountId,
    ]);
    return res.rows[0] ? mapAccount(res.rows[0]) : null;
  }

  values.push(accountId);
  const res = await pool.query(
    `update accounts set ${sets.join(", ")} where id = $${i} returning *`,
    values
  );
  return res.rows[0] ? mapAccount(res.rows[0]) : null;
}

export async function getAccountWithRelations(
  accountId: string
): Promise<AccountWithRelations | null> {
  const pool = getPool();
  const accountRes = await pool.query("select * from accounts where id = $1", [
    accountId,
  ]);
  if (!accountRes.rows[0]) return null;

  const [contactsRes, touchpointsRes, tasksRes] = await Promise.all([
    pool.query(
      "select * from contacts where account_id = $1 order by is_primary desc, name asc",
      [accountId]
    ),
    pool.query(
      "select * from touchpoints where account_id = $1 order by date desc",
      [accountId]
    ),
    pool.query(
      "select * from tasks where account_id = $1 and done = false order by scheduled_date asc",
      [accountId]
    ),
  ]);

  return {
    ...mapAccount(accountRes.rows[0]),
    contacts: contactsRes.rows.map(mapContact),
    touchpoints: touchpointsRes.rows.map(mapTouchpoint),
    tasks: tasksRes.rows.map(mapTask),
  };
}

export async function createAccount(input: {
  name: string;
  industry?: string;
  notes?: string;
  salesNavigatorUrl?: string;
}): Promise<Account> {
  const pool = getPool();
  const id = newId("acc");
  const res = await pool.query(
    `insert into accounts (id, name, industry, stage, notes, sales_navigator_url)
     values ($1, $2, $3, 'to_contact', $4, $5) returning *`,
    [
      id,
      input.name,
      input.industry || null,
      input.notes || null,
      input.salesNavigatorUrl || null,
    ]
  );
  return mapAccount(res.rows[0]);
}

export async function createContact(input: {
  accountId: string;
  name: string;
  role?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}): Promise<Contact> {
  const pool = getPool();
  const id = newId("c");
  const res = await pool.query(
    `insert into contacts (id, account_id, name, role, linkedin, email, phone, is_primary)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning *`,
    [
      id,
      input.accountId,
      input.name,
      input.role || null,
      input.linkedin || null,
      input.email || null,
      input.phone || null,
      Boolean(input.isPrimary),
    ]
  );
  return mapContact(res.rows[0]);
}

export async function createTouchpoint(input: {
  contactId: string;
  accountId: string;
  channel: Channel;
  date: string;
  notes?: string;
  outcome?: Touchpoint["outcome"];
}): Promise<Touchpoint> {
  const pool = getPool();
  const id = newId("tp");
  const res = await pool.query(
    `insert into touchpoints (id, contact_id, account_id, channel, date, notes, outcome)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [
      id,
      input.contactId,
      input.accountId,
      input.channel,
      input.date,
      input.notes || null,
      input.outcome || null,
    ]
  );
  return mapTouchpoint(res.rows[0]);
}

export async function getSummary(): Promise<Summary> {
  const pool = getPool();

  const [accountsRes, meetingsRes] = await Promise.all([
    pool.query(
      "select count(*)::int as count from accounts where stage = any($1::text[])",
      [ACTIVE_PROSPECTING_STAGES]
    ),
    pool.query(
      `select t.id as touchpoint_id, t.date, t.channel,
              a.id as account_id, a.name as account_name,
              c.id as contact_id, c.name as contact_name
       from touchpoints t
       join accounts a on a.id = t.account_id
       join contacts c on c.id = t.contact_id
       where t.outcome = 'reunion_agendada'
         and t.date >= date_trunc('week', current_date)::date
         and t.date < (date_trunc('week', current_date) + interval '7 days')::date
       order by t.date desc`
    ),
  ]);

  return {
    accountsProspecting: accountsRes.rows[0]?.count ?? 0,
    meetingsThisWeek: meetingsRes.rows.map((row) => ({
      touchpointId: row.touchpoint_id as string,
      date: toDateStr(row.date),
      channel: row.channel as Channel,
      accountId: row.account_id as string,
      accountName: row.account_name as string,
      contactId: row.contact_id as string,
      contactName: row.contact_name as string,
    })),
  };
}

export async function listMeetings(): Promise<Meeting[]> {
  const pool = getPool();
  const res = await pool.query(
    `select * from meetings
     order by meeting_date desc nulls last, created_at desc`
  );
  return res.rows.map(mapMeeting);
}

export async function createMeeting(input: {
  forMonth?: string;
  meetingDate?: string;
  company: string;
  contactName?: string;
  contactRole?: string;
  linkedinUrl?: string;
  type?: MeetingType;
  channel?: string;
  status?: MeetingStatus;
  ae?: string;
  sqcValue?: number;
  note?: string;
  qualified?: string;
  qualifiedByNacho?: string;
}): Promise<Meeting> {
  const pool = getPool();
  const id = newId("mtg");
  const res = await pool.query(
    `insert into meetings
       (id, for_month, meeting_date, company, contact_name, contact_role,
        linkedin_url, type, channel, status, ae, sqc_value, note,
        qualified, qualified_by_nacho)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     returning *`,
    [
      id,
      input.forMonth || null,
      input.meetingDate || null,
      input.company,
      input.contactName || null,
      input.contactRole || null,
      input.linkedinUrl || null,
      input.type || null,
      input.channel || null,
      input.status || "Reunión Agendada",
      input.ae || null,
      input.sqcValue ?? null,
      input.note || null,
      input.qualified || null,
      input.qualifiedByNacho || null,
    ]
  );
  return mapMeeting(res.rows[0]);
}

export async function updateMeeting(
  id: string,
  fields: Partial<{
    forMonth: string;
    meetingDate: string;
    company: string;
    contactName: string;
    contactRole: string;
    linkedinUrl: string;
    type: MeetingType;
    channel: string;
    status: MeetingStatus;
    ae: string;
    sqcValue: number;
    note: string;
    qualified: string;
    qualifiedByNacho: string;
  }>
): Promise<Meeting | null> {
  const pool = getPool();
  const columnByField: Record<string, string> = {
    forMonth: "for_month",
    meetingDate: "meeting_date",
    company: "company",
    contactName: "contact_name",
    contactRole: "contact_role",
    linkedinUrl: "linkedin_url",
    type: "type",
    channel: "channel",
    status: "status",
    ae: "ae",
    sqcValue: "sqc_value",
    note: "note",
    qualified: "qualified",
    qualifiedByNacho: "qualified_by_nacho",
  };

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, column] of Object.entries(columnByField)) {
    if (key in fields) {
      sets.push(`${column} = $${i++}`);
      const value = (fields as Record<string, unknown>)[key];
      values.push(value === "" ? null : value ?? null);
    }
  }
  if (sets.length === 0) {
    const res = await pool.query("select * from meetings where id = $1", [id]);
    return res.rows[0] ? mapMeeting(res.rows[0]) : null;
  }

  values.push(id);
  const res = await pool.query(
    `update meetings set ${sets.join(", ")} where id = $${i} returning *`,
    values
  );
  return res.rows[0] ? mapMeeting(res.rows[0]) : null;
}

export async function createTask(input: {
  accountId: string;
  type?: Task["type"];
  contactId?: string;
  channel?: Channel;
  scheduledDate: string;
  notes?: string;
}): Promise<Task> {
  const pool = getPool();
  const id = newId("t");
  const res = await pool.query(
    `insert into tasks (id, account_id, type, contact_id, channel, scheduled_date, notes)
     values ($1, $2, $3, $4, $5, $6, $7) returning *`,
    [
      id,
      input.accountId,
      input.type || "outreach",
      input.contactId || null,
      input.channel || null,
      input.scheduledDate,
      input.notes || null,
    ]
  );
  return mapTask(res.rows[0]);
}
