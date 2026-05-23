-- ============================================================
-- Banyan Circle — new-tables-2.sql
-- Run once in Supabase SQL Editor
-- Creates: local_tips, talents, property_rules,
--          property_notes, emergency_contacts
-- ============================================================

-- ── LOCAL TIPS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS local_tips (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name text,
  name          text        NOT NULL,
  category      text,
  description   text,
  tags          text[],
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE local_tips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON local_tips;
CREATE POLICY "anon_all" ON local_tips
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── TALENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS talents (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL,
  category   text,
  short_desc text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE talents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON talents;
CREATE POLICY "anon_all" ON talents
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── PROPERTY RULES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS property_rules (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name text,
  rule_text     text        NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE property_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON property_rules;
CREATE POLICY "anon_all" ON property_rules
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── PROPERTY NOTES ───────────────────────────────────────────
-- property_name must be UNIQUE for the upsert (merge-duplicates) to work
CREATE TABLE IF NOT EXISTS property_notes (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name text        UNIQUE NOT NULL,
  notes         text,
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE property_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON property_notes;
CREATE POLICY "anon_all" ON property_notes
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- ── EMERGENCY CONTACTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name text,
  name          text        NOT NULL,
  role          text,
  phone         text        NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all" ON emergency_contacts;
CREATE POLICY "anon_all" ON emergency_contacts
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
