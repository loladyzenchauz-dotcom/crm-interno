-- CRM Interno — esquema de base de datos

create table if not exists accounts (
  id text primary key,
  name text not null,
  industry text,
  stage text not null default 'to_contact',
  notes text,
  sales_navigator_url text,
  ae_brief text,
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id text primary key,
  account_id text not null references accounts(id) on delete cascade,
  name text not null,
  role text,
  linkedin text,
  email text,
  phone text,
  is_primary boolean not null default false
);

create table if not exists touchpoints (
  id text primary key,
  contact_id text not null references contacts(id) on delete cascade,
  account_id text not null references accounts(id) on delete cascade,
  channel text not null,
  date date not null,
  notes text,
  outcome text
);

create table if not exists tasks (
  id text primary key,
  account_id text not null references accounts(id) on delete cascade,
  -- 'outreach' = contactar a alguien; 'ae_brief' = preparar/enviar el brief al AE.
  type text not null default 'outreach',
  -- contact_id y channel son nulos en tasks de tipo 'ae_brief'.
  contact_id text references contacts(id) on delete cascade,
  channel text,
  scheduled_date date not null,
  done boolean not null default false,
  notes text
);

create table if not exists meetings (
  id text primary key,
  for_month text,
  meeting_date date,
  company text not null,
  -- Link a accounts.id (autocompletado por nombre al crear la reunión).
  -- Puede quedar null si "company" no matchea ninguna cuenta del CRM.
  account_id text references accounts(id),
  contact_name text,
  contact_role text,
  linkedin_url text,
  type text,
  channel text,
  status text,
  ae text,
  sqc_value numeric,
  note text,
  qualified text,
  qualified_by_nacho text,
  created_at timestamptz not null default now()
);

create table if not exists outreach_weeks (
  id text primary key,
  week_start date not null unique,
  email_enviados numeric,
  email_open_rate numeric,
  email_replies numeric,
  email_reuniones numeric,
  linkedin_enviados numeric,
  linkedin_replies numeric,
  linkedin_reuniones numeric,
  whatsapp_enviados numeric,
  whatsapp_replies numeric,
  whatsapp_reuniones numeric,
  llamadas_enviados numeric,
  llamadas_replies numeric,
  llamadas_reuniones numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_contacts_account on contacts(account_id);
create index if not exists idx_touchpoints_account on touchpoints(account_id);
create index if not exists idx_touchpoints_contact on touchpoints(contact_id);
create index if not exists idx_tasks_account on tasks(account_id);
create index if not exists idx_meetings_date on meetings(meeting_date);
create index if not exists idx_outreach_weeks_start on outreach_weeks(week_start);
