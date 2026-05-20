-- ============================================================
-- BANYAN CIRCLE — FIX: guest_checkins missing form_data column
-- Run in Supabase SQL Editor
-- ============================================================

-- Add form_data column (stores the full registration form as JSON,
-- including base64-encoded ID proof images)
ALTER TABLE guest_checkins ADD COLUMN IF NOT EXISTS form_data jsonb;

-- Also add mobile to guest_profiles if not already there
-- (referenced in project schema but missing from new-tables.sql)
ALTER TABLE guest_profiles ADD COLUMN IF NOT EXISTS mobile text;

-- Add extra columns to housekeeping_tasks used by the guest requests tab
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS requested_by text;
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS notes text;

-- Ensure RLS open policies on both tables (re-run safe)
DROP POLICY IF EXISTS "open" ON guest_checkins;
DROP POLICY IF EXISTS "open" ON guest_profiles;

CREATE POLICY "open" ON guest_checkins FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON guest_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
