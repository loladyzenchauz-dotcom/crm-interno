-- Migración 005: tabla de Tracker Outreach (evolución semanal por canal, igual al Excel).
-- Correr cada statement por separado en el editor "Query" de Neon (no acepta multi-statement).

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

create index if not exists idx_outreach_weeks_start on outreach_weeks(week_start);
