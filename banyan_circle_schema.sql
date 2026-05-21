-- ============================================================
-- Banyan Circle — SQL Schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================


-- ─────────────────────────────────────────────
-- 1. TALENT BOOKING REQUESTS
--    Written by: talent (self-request), guest, admin/office
--    Read by:    talent, admin
-- ─────────────────────────────────────────────
create table if not exists talent_booking_requests (
  id               uuid primary key default gen_random_uuid(),
  talent_id        uuid references talents(id) on delete cascade,
  talent_name      text,
  property_name    text,
  requested_date   date not null,
  requested_time   time,
  message          text,
  requested_by     text,              -- guest name or 'OFFICE'
  status           text default 'pending'
                   check (status in ('pending','confirmed','declined')),
  admin_note       text,              -- office can add a note when confirming/declining
  created_at       timestamptz default now()
);

-- Index for fast lookups per talent
create index if not exists idx_tbr_talent_id on talent_booking_requests(talent_id);
create index if not exists idx_tbr_date      on talent_booking_requests(requested_date);

-- Enable Row Level Security (optional — anon key is used, so open for now)
alter table talent_booking_requests enable row level security;
create policy "Allow all on talent_booking_requests" on talent_booking_requests
  for all using (true) with check (true);


-- ─────────────────────────────────────────────
-- 2. TALENT RATINGS
--    Written by: guest (via rating.html)
--    Read by:    talent (read-only view), admin
-- ─────────────────────────────────────────────
create table if not exists talent_ratings (
  id            uuid primary key default gen_random_uuid(),
  talent_id     uuid references talents(id) on delete cascade,
  talent_name   text,
  guest_name    text not null,
  guest_id      uuid,                 -- nullable — references guest_profiles if available
  property_name text,
  rating        smallint not null check (rating between 1 and 5),
  review        text,
  created_at    timestamptz default now()
);

-- Index for fast lookups per talent
create index if not exists idx_tr_talent_id on talent_ratings(talent_id);

alter table talent_ratings enable row level security;
create policy "Allow all on talent_ratings" on talent_ratings
  for all using (true) with check (true);


-- ─────────────────────────────────────────────
-- 3. MIGRATE internal_messages
--    Add talent_id + talent_name columns so talent threads
--    are stored in the same table, just filtered differently.
--    Property threads: talent_id IS NULL, filter by property_name
--    Talent threads:   talent_id IS NOT NULL, filter by talent_id
-- ─────────────────────────────────────────────

-- Safe — only adds if columns don't already exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name='internal_messages' and column_name='talent_id'
  ) then
    alter table internal_messages add column talent_id uuid references talents(id) on delete set null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name='internal_messages' and column_name='talent_name'
  ) then
    alter table internal_messages add column talent_name text;
  end if;
end $$;

-- Index for talent thread lookups
create index if not exists idx_im_talent_id on internal_messages(talent_id);


-- ─────────────────────────────────────────────
-- 4. TALENT SCHEDULE (existing table — shown here for reference)
--    If you haven't created it yet, run this:
-- ─────────────────────────────────────────────
create table if not exists talent_schedule (
  id          uuid primary key default gen_random_uuid(),
  talent_id   uuid references talents(id) on delete cascade,
  date        date not null,
  status      text not null check (status in ('available','busy')),
  time_start  time,
  time_end    time,
  created_at  timestamptz default now(),
  unique (talent_id, date)             -- one entry per talent per day
);

create index if not exists idx_ts_talent_date on talent_schedule(talent_id, date);

alter table talent_schedule enable row level security;
create policy "Allow all on talent_schedule" on talent_schedule
  for all using (true) with check (true);


-- ─────────────────────────────────────────────
-- 5. TALENT PROFILES (existing table — for reference)
-- ─────────────────────────────────────────────
create table if not exists talent_profiles (
  id               uuid primary key default gen_random_uuid(),
  talent_id        uuid references talents(id) on delete cascade unique,
  name             text,
  age              int,
  phone            text,
  email            text,
  location         text,
  category         text,
  category_other   text,
  talent_name      text,
  tagline          text,
  description      text,
  instagram        text,
  performance_link text,
  photo_url        text,
  photo_name       text,
  bio_url          text,
  bio_name         text,
  venues           text[],            -- array of property names
  updated_at       timestamptz default now()
);

alter table talent_profiles enable row level security;
create policy "Allow all on talent_profiles" on talent_profiles
  for all using (true) with check (true);


-- ─────────────────────────────────────────────
-- 6. TALENTS (existing — shown for completeness)
-- ─────────────────────────────────────────────
create table if not exists talents (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  pin          text,                  -- 4-digit PIN (stored as text)
  short_desc   text,
  category     text,
  created_at   timestamptz default now()
);

alter table talents enable row level security;
create policy "Allow all on talents" on talents
  for all using (true) with check (true);


-- ─────────────────────────────────────────────
-- SUMMARY OF TABLES TOUCHED
-- ─────────────────────────────────────────────
-- NEW:    talent_booking_requests
-- NEW:    talent_ratings
-- ALTER:  internal_messages  (+talent_id, +talent_name)
-- NEW*:   talent_schedule    (if not exists)
-- NEW*:   talent_profiles    (if not exists)
-- NEW*:   talents            (if not exists)
-- * These may already exist — CREATE TABLE IF NOT EXISTS is safe to re-run
