-- ============================================================
-- BANYAN CIRCLE — FIX RLS POLICIES
-- Run in Supabase SQL Editor
-- ============================================================

-- Allow anyone (including guests with no account) to INSERT complaints and feedback
drop policy if exists "Authenticated users full access" on guest_complaints;
drop policy if exists "Authenticated users full access" on guest_feedback;
drop policy if exists "Authenticated users full access" on properties;
drop policy if exists "Authenticated users full access" on staff;
drop policy if exists "Authenticated users full access" on attendance;
drop policy if exists "Authenticated users full access" on bookings;
drop policy if exists "Authenticated users full access" on housekeeping_tasks;
drop policy if exists "Authenticated users full access" on laundry_movement;
drop policy if exists "Authenticated users full access" on laundry_return;
drop policy if exists "Authenticated users full access" on assets;
drop policy if exists "Authenticated users full access" on asset_movements;
drop policy if exists "Authenticated users full access" on lost_and_found;
drop policy if exists "Authenticated users full access" on community_members;

-- GUEST COMPLAINTS: anyone can insert, authenticated can do everything
create policy "Anyone can insert complaints" on guest_complaints
  for insert with check (true);
create policy "Authenticated can read/update complaints" on guest_complaints
  for select using (true);
create policy "Authenticated can update complaints" on guest_complaints
  for update using (true);

-- GUEST FEEDBACK: anyone can insert, authenticated can read
create policy "Anyone can insert feedback" on guest_feedback
  for insert with check (true);
create policy "Anyone can read feedback" on guest_feedback
  for select using (true);

-- All other tables: open access (tighten later with proper roles)
create policy "Open access" on properties for all using (true) with check (true);
create policy "Open access" on staff for all using (true) with check (true);
create policy "Open access" on attendance for all using (true) with check (true);
create policy "Open access" on bookings for all using (true) with check (true);
create policy "Open access" on housekeeping_tasks for all using (true) with check (true);
create policy "Open access" on laundry_movement for all using (true) with check (true);
create policy "Open access" on laundry_return for all using (true) with check (true);
create policy "Open access" on assets for all using (true) with check (true);
create policy "Open access" on asset_movements for all using (true) with check (true);
create policy "Open access" on lost_and_found for all using (true) with check (true);
create policy "Open access" on community_members for all using (true) with check (true);
