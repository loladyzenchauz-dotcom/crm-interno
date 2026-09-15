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
    contactId: row.contact_id as string,
    channel: row.channel as Channel,
    scheduledDate: toDateStr(row.scheduled_date),
    done: Boolean(row.done),
    notes: (row.notes as string) ?? undefined,
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
  const res = await pool.query(
    "update accounts set stage = $1 where id = $2 returning *",
    [stage, accountId]
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
}): Promise<Account> {
  const pool = getPool();
  const id = newId("acc");
  const res = await pool.query(
    `insert into accounts (id, name, industry, stage, notes)
     values ($1, $2, $3, 'to_contact', $4) returning *`,
    [id, input.name, input.industry || null, input.notes || null]
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

export async function createTask(input: {
  accountId: string;
  contactId: string;
  channel: Channel;
  scheduledDate: string;
  notes?: string;
}): Promise<Task> {
  const pool = getPool();
  const id = newId("t");
  const res = await pool.query(
    `insert into tasks (id, account_id, contact_id, channel, scheduled_date, notes)
     values ($1, $2, $3, $4, $5, $6) returning *`,
    [
      id,
      input.accountId,
      input.contactId,
      input.channel,
      input.scheduledDate,
      input.notes || null,
    ]
  );
  return mapTask(res.rows[0]);
}
