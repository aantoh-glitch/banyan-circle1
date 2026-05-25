-- Banyan Circle — Earnings Log Table
-- Run this once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS earnings_log (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type         text NOT NULL CHECK (type IN ('positive', 'negative')),
  head         text NOT NULL,
  amount       numeric(14,2),
  percentage   numeric(7,4),
  notes        text,
  entity_type  text CHECK (entity_type IN ('landlord', 'staff', 'talent', 'general')),
  entity_name  text,
  recorded_by  text,
  entry_date   date NOT NULL DEFAULT current_date,
  created_at   timestamptz DEFAULT now()
);

-- Open RLS (same pattern as rest of app)
ALTER TABLE earnings_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "earnings_log_open" ON earnings_log;
CREATE POLICY "earnings_log_open"
  ON earnings_log FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ── If the table already exists, run these to fix the constraint ──────────
-- (old constraint used 'property' instead of 'landlord')
ALTER TABLE earnings_log DROP CONSTRAINT IF EXISTS earnings_log_entity_type_check;
ALTER TABLE earnings_log ADD CONSTRAINT earnings_log_entity_type_check
  CHECK (entity_type IN ('landlord', 'staff', 'talent', 'general'));

-- ── Useful indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS earnings_log_date_idx   ON earnings_log (entry_date DESC);
CREATE INDEX IF NOT EXISTS earnings_log_entity_idx ON earnings_log (entity_name);
CREATE INDEX IF NOT EXISTS earnings_log_type_idx   ON earnings_log (type);
CREATE INDEX IF NOT EXISTS earnings_log_etype_idx  ON earnings_log (entity_type);
