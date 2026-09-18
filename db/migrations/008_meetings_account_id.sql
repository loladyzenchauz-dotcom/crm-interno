-- Vincula meetings a accounts por id, para poder calcular con confianza
-- "cuántas reuniones tiene esta cuenta" (necesario para el multithreading
-- del Panel principal) en vez de matchear por texto libre de "company".

alter table meetings add column if not exists account_id text references accounts(id);

create index if not exists idx_meetings_account on meetings(account_id);

-- Backfill: matchear por nombre normalizado (sin acentos/símbolos, case-insensitive).
update meetings m
set account_id = a.id
from accounts a
where m.account_id is null
  and lower(regexp_replace(a.name, '[^a-zA-Z0-9]', '', 'g'))
    = lower(regexp_replace(m.company, '[^a-zA-Z0-9]', '', 'g'));
