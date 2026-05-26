-- ============================================================
-- BANYAN CIRCLE — Property Logins Table
-- Replaces the 'landlords' table for login purposes.
-- Login is keyed to property_name + PIN.
-- landlord_name is optional/namesake only.
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS property_logins (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name  text NOT NULL,
  pin            text NOT NULL,
  landlord_name  text,            -- namesake only, not used for login
  email          text,
  mobile         text,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

-- Seed with your current properties
INSERT INTO property_logins (property_name, pin, landlord_name)
VALUES
  ('Villa 21',         '3333', 'Aby'),
  ('19A Link Heritage','3333', 'Aby')
ON CONFLICT DO NOTHING;

-- ── RLS: open to anon + authenticated ───────────────────────
ALTER TABLE property_logins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open" ON property_logins;
CREATE POLICY "open" ON property_logins
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
