-- ============================================================
-- Banyan Circle — Billing Table
-- Run once in Supabase SQL editor
-- ============================================================

CREATE TABLE IF NOT EXISTS bills (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_profile_id  UUID        REFERENCES guest_profiles(id) ON DELETE SET NULL,
  guest_name        TEXT        NOT NULL,
  property_name     TEXT,
  guest_address     TEXT,
  guest_mobile      TEXT,
  guest_email       TEXT,
  items             JSONB       DEFAULT '[]'::jsonb,
  -- Each item: {"name":"...","qty":1,"rate":0,"total":0}
  subtotal          NUMERIC(10,2) DEFAULT 0,
  payment_status    TEXT        DEFAULT 'pending',  -- 'paid' | 'pending'
  payment_method    TEXT,                           -- 'cash' | 'card' | 'upi'
  remarks           TEXT,
  created_by        TEXT        DEFAULT 'OFFICE',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: open to anon + authenticated (same as all other BC tables)
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bills' AND policyname = 'bills_anon_all'
  ) THEN
    CREATE POLICY "bills_anon_all" ON bills
      FOR ALL TO anon, authenticated
      USING (true) WITH CHECK (true);
  END IF;
END$$;
