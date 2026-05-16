-- ============================================================
--  BANYAN CIRCLE — SUPABASE DATABASE SCHEMA
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROPERTIES
create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz default now()
);

insert into properties (name, address) values
  ('Villa 21', 'Villa 21, Banyan Circle'),
  ('19A Link Heritage', '19A Link Heritage, Banyan Circle');

-- 2. STAFF
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  designation text not null, -- 'Homekeeper' | 'Relationship Manager' | 'Guest Experience Coordinator'
  property_id uuid references properties(id),
  phone text,
  created_at timestamptz default now()
);

-- 3. ATTENDANCE
create table attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) not null,
  property_id uuid references properties(id),
  date date not null default current_date,
  status text not null, -- 'Present' | 'Half day' | 'Leave' | 'Sick leave' | 'Off'
  duty_start time,
  duty_end time,
  remarks text,
  created_at timestamptz default now()
);

-- 4. BOOKINGS
create table bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) not null,
  guest_name text not null,
  guest_phone text,
  guest_email text,
  check_in date not null,
  check_out date not null,
  num_guests int default 1,
  source text not null, -- 'airbnb' | 'booking_com' | 'manual'
  source_booking_id text, -- external ID from Airbnb/BDC
  nightly_rate numeric(10,2),
  total_amount numeric(10,2),
  status text default 'confirmed', -- 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  notes text,
  created_at timestamptz default now()
);

-- 5. HOUSEKEEPING TASKS
create table housekeeping_tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) not null,
  booking_id uuid references bookings(id),
  task_type text not null, -- 'post_checkout' | 'regular' | 'pre_checkin'
  task_name text not null,
  is_completed boolean default false,
  completed_by uuid references staff(id),
  completed_at timestamptz,
  photo_url text, -- Supabase Storage URL
  notes text,
  date date default current_date,
  created_at timestamptz default now()
);

-- 6. LAUNDRY MOVEMENT (sent out)
create table laundry_movement (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) not null,
  staff_id uuid references staff(id),
  vendor_name text not null,
  sent_date date not null default current_date,
  bedsheets int default 0,
  pillow_covers int default 0,
  bath_towels int default 0,
  hand_towels int default 0,
  toilet_floor_towels int default 0,
  duvet_covers int default 0,
  blankets int default 0,
  kitchen_linen int default 0,
  total_items int generated always as (
    bedsheets + pillow_covers + bath_towels + hand_towels +
    toilet_floor_towels + duvet_covers + blankets + kitchen_linen
  ) stored,
  status text default 'sent', -- 'sent' | 'returned'
  created_at timestamptz default now()
);

-- 7. LAUNDRY RETURN
create table laundry_return (
  id uuid primary key default gen_random_uuid(),
  movement_id uuid references laundry_movement(id),
  property_id uuid references properties(id) not null,
  staff_id uuid references staff(id),
  vendor_name text not null,
  return_date date not null default current_date,
  bedsheets int default 0,
  pillow_covers int default 0,
  bath_towels int default 0,
  hand_towels int default 0,
  toilet_floor_towels int default 0,
  duvet_covers int default 0,
  blankets int default 0,
  kitchen_linen int default 0,
  damaged int default 0,
  missing int default 0,
  invoice_amount numeric(10,2),
  payment_status text default 'unpaid', -- 'paid' | 'unpaid'
  created_at timestamptz default now()
);

-- 8. GUEST FEEDBACK (Moments & Memories)
create table guest_feedback (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  property_id uuid references properties(id),
  guest_name text,
  guest_phone text,
  overall_experience text, -- 'Exceptional' | 'Memorable' | 'Comfortable' | 'Could have been better'
  enjoyed_most text,
  arrival_rating int check (arrival_rating between 1 and 5),
  cleanliness_rating int check (cleanliness_rating between 1 and 5),
  hospitality_rating int check (hospitality_rating between 1 and 5),
  food_rating int check (food_rating between 1 and 5),
  design_rating int check (design_rating between 1 and 5),
  location_rating int check (location_rating between 1 and 5),
  homekeeper_rating int check (homekeeper_rating between 1 and 5),
  companion_rating int check (companion_rating between 1 and 5),
  missing_or_feedback text,
  slow_down_response text,
  would_return text, -- 'Without a doubt' | 'Possibly' | 'Unlikely'
  note text,
  created_at timestamptz default now()
);

-- 9. GUEST COMPLAINTS
create table guest_complaints (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  property_id uuid references properties(id) not null,
  guest_name text,
  complaint text not null,
  status text default 'open', -- 'open' | 'in_progress' | 'resolved'
  assigned_to uuid references staff(id),
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- 10. ASSETS
create table assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text, -- 'Furniture' | 'Electronics' | 'Kitchen' | 'Linen' | 'Other'
  current_property_id uuid references properties(id),
  photo_url text,
  added_date date default current_date,
  created_at timestamptz default now()
);

-- 11. ASSET MOVEMENTS (when moved between properties)
create table asset_movements (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) not null,
  from_property_id uuid references properties(id),
  to_property_id uuid references properties(id) not null,
  moved_by uuid references staff(id),
  moved_date date default current_date,
  photo_url text,
  notes text,
  created_at timestamptz default now()
);

-- 12. LOST & FOUND
create table lost_and_found (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) not null,
  found_by uuid references staff(id),
  guest_name text,
  booking_id uuid references bookings(id),
  item_description text not null,
  location_found text,
  found_date date not null default current_date,
  found_time time,
  photo_url text,
  status text default 'pending', -- 'guest_contacted' | 'pending_collection' | 'returned' | 'disposed' | 'unclaimed'
  remarks text,
  created_at timestamptz default now()
);

-- 13. BANYAN CIRCLE COMMUNITY (talent roster)
create table community_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int,
  email text,
  phone text,
  location text,
  talent_description text,
  talent_name text,
  talent_tagline text,
  category text, -- 'Art' | 'Music' | 'Dance' | 'Food' | 'Pottery' | 'Healing' | 'Yoga' etc.
  category_other text,
  instagram text,
  photo_url text,
  performance_photo_url text,
  performance_video_url text,
  portfolio_url text,
  available_properties text[], -- array of property names
  rating numeric(2,1),
  status text default 'active', -- 'active' | 'inactive' | 'pending'
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Enable after setting up auth
-- ============================================================

alter table properties enable row level security;
alter table staff enable row level security;
alter table attendance enable row level security;
alter table bookings enable row level security;
alter table housekeeping_tasks enable row level security;
alter table laundry_movement enable row level security;
alter table laundry_return enable row level security;
alter table guest_feedback enable row level security;
alter table guest_complaints enable row level security;
alter table assets enable row level security;
alter table asset_movements enable row level security;
alter table lost_and_found enable row level security;
alter table community_members enable row level security;

-- Allow all authenticated users to read/write (tighten per role later)
create policy "Authenticated users full access" on properties for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on staff for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on attendance for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on bookings for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on housekeeping_tasks for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on laundry_movement for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on laundry_return for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on guest_feedback for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on guest_complaints for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on assets for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on asset_movements for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on lost_and_found for all using (auth.role() = 'authenticated');
create policy "Authenticated users full access" on community_members for all using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKETS
-- Run in: Supabase Dashboard → Storage → New Bucket
-- ============================================================
-- Create these 4 buckets (all private, auth required):
--   housekeeping-photos
--   asset-photos
--   lost-and-found-photos
--   community-media
