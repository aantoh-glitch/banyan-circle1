-- ============================================================
-- BANYAN CIRCLE — NEW TABLES FOR GUEST PROFILES + CHECK-IN
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Guest profiles (created by staff/owner in ops)
CREATE TABLE IF NOT EXISTS guest_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pin text NOT NULL,
  property_name text,
  check_in date NOT NULL,
  check_out date NOT NULL,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- 2. Guest check-in submissions
CREATE TABLE IF NOT EXISTS guest_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_profile_id uuid REFERENCES guest_profiles(id),
  guest_name text,
  property_name text,
  travelled_from text,
  travelling_to text,
  num_guests int DEFAULT 1,
  id_proof_urls text[],
  checked_in_at timestamptz DEFAULT now()
);

-- 3. Storage bucket for guest IDs (run in Supabase Dashboard → Storage)
-- Create bucket: guest-ids (private)

-- Open RLS for all tables
ALTER TABLE guest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open" ON guest_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON guest_checkins FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Add pin + email columns to staff if not already there
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pin text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started';
