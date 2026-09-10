-- CRM Interno — esquema de base de datos

create table if not exists accounts (
  id text primary key,
  name text not null,
  industry text,
  stage text not null default 'to_contact',
  notes text,
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
  contact_id text not null references contacts(id) on delete cascade,
  channel text not null,
  scheduled_date date not null,
  done boolean not null default false,
  notes text
);

create index if not exists idx_contacts_account on contacts(account_id);
create index if not exists idx_touchpoints_account on touchpoints(account_id);
create index if not exists idx_touchpoints_contact on touchpoints(contact_id);
create index if not exists idx_tasks_account on tasks(account_id);
