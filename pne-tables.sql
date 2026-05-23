-- ============================================================
-- PNE Tables — Property Rules, Notes & Emergency Contacts
-- Run in Supabase SQL Editor before using the updated pne.html
-- ============================================================

-- 1. PROPERTY RULES
CREATE TABLE IF NOT EXISTS property_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  rule_text     text NOT NULL,
  sort_order    int  DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE property_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on property_rules" ON property_rules
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rules_prop ON property_rules(property_name);


-- 2. PROPERTY NOTES  (one row per property, upserted on save)
CREATE TABLE IF NOT EXISTS property_notes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL UNIQUE,
  notes         text DEFAULT '',
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE property_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on property_notes" ON property_notes
  FOR ALL USING (true) WITH CHECK (true);


-- 3. EMERGENCY CONTACTS
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  name          text NOT NULL,
  role          text DEFAULT '',
  phone         text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on emergency_contacts" ON emergency_contacts
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_emg_prop ON emergency_contacts(property_name);
