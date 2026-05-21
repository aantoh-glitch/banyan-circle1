-- Banyan Circle — Earnings Log Table
-- Run this once in Supabase SQL Editor

create table if not exists earnings_log (
  id           uuid default gen_random_uuid() primary key,
  type         text not null check (type in ('positive', 'negative')),
  head         text not null,
  amount       numeric(14,2),
  percentage   numeric(7,4),
  notes        text,
  entity_type  text check (entity_type in ('property', 'staff', 'general')),
  entity_name  text,
  recorded_by  text,
  entry_date   date not null default current_date,
  created_at   timestamptz default now()
);

-- Open RLS (same pattern as rest of app)
alter table earnings_log enable row level security;

drop policy if exists "earnings_log_open" on earnings_log;
create policy "earnings_log_open"
  on earnings_log for all
  to anon, authenticated
  using (true)
  with check (true);

-- Useful indexes
create index if not exists earnings_log_date_idx on earnings_log (entry_date desc);
create index if not exists earnings_log_entity_idx on earnings_log (entity_name);
create index if not exists earnings_log_type_idx on earnings_log (type);
