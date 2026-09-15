-- Migración 002: link de Sales Navigator + brief para el AE + tasks sin contacto/canal.
-- Correr cada statement por separado en el editor "Query" de Neon (no acepta multi-statement).

alter table accounts add column if not exists sales_navigator_url text;

alter table accounts add column if not exists ae_brief text;

alter table tasks add column if not exists type text not null default 'outreach';

alter table tasks alter column contact_id drop not null;

alter table tasks alter column channel drop not null;
