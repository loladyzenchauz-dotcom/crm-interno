-- Migración 003: tabla de reuniones (tracker de "Reuniones Agendadas").
-- Correr cada statement por separado en el editor "Query" de Neon (no acepta multi-statement).

create table if not exists meetings (
  id text primary key,
  for_month text,
  meeting_date date,
  company text not null,
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

create index if not exists idx_meetings_date on meetings(meeting_date);
