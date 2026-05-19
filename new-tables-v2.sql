-- ============================================================
-- BANYAN CIRCLE v2 — ROLE RESTRUCTURE + PROPERTY MANAGEMENT
-- Adds: OFFICE backend, Landlord role, per-property docs/utilities/
-- maintenance/comms/tips, and Section C for Heritance check-ins.
--
-- Run AFTER new-tables.sql in Supabase SQL Editor.
-- Storage buckets to create manually in Supabase → Storage:
--   property-docs   (private)
--   utility-proofs  (private)
-- ============================================================

-- ── 1. Landlords ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS landlords (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  pin           text NOT NULL,
  property_name text NOT NULL,
  email         text,
  mobile        text,
  notes         text,
  created_at    timestamptz DEFAULT now()
);

-- ── 2. Property descriptions (add columns to existing table) ─
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address text;

-- Ensure the two known properties exist (idempotent)
INSERT INTO properties (name)
SELECT 'Villa 21' WHERE NOT EXISTS (SELECT 1 FROM properties WHERE name='Villa 21');
INSERT INTO properties (name)
SELECT '19A Link Heritage' WHERE NOT EXISTS (SELECT 1 FROM properties WHERE name='19A Link Heritage');

UPDATE properties SET description = COALESCE(description,
  'Villa 21 is a boutique 3-bedroom heritage retreat with a private garden, rooftop terrace and pool. Roughly 10 minutes from Vembanad Lake.')
WHERE name='Villa 21';

UPDATE properties SET description = COALESCE(description,
  '19A Link Heritage is a colonial-era 2-bedroom home restored with modern comforts, in a quiet residential lane near the cultural quarter.')
WHERE name='19A Link Heritage';

-- ── 3. Property documents ───────────────────────────────────
CREATE TABLE IF NOT EXISTS property_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  title         text NOT NULL,
  file_url      text NOT NULL,
  doc_type      text,          -- lease, license, certificate, insurance, other
  uploaded_by   text,
  uploaded_at   timestamptz DEFAULT now()
);

-- ── 4. Utility payments log ─────────────────────────────────
CREATE TABLE IF NOT EXISTS utility_payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  month         text NOT NULL,     -- YYYY-MM
  utility_type  text NOT NULL,     -- electricity, water, gas, internet, cable, other
  amount        numeric DEFAULT 0,
  status        text DEFAULT 'pending',  -- pending, paid
  paid_on       date,
  proof_url     text,
  notes         text,
  logged_by     text,
  created_at    timestamptz DEFAULT now()
);

-- ── 5. Maintenance log ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  issue         text NOT NULL,
  status        text DEFAULT 'open',   -- open, in_progress, resolved
  priority      text DEFAULT 'normal', -- low, normal, high
  raised_by     text,
  raised_role   text,                  -- landlord, manager, office, staff
  resolved_at   timestamptz,
  notes         text,
  created_at    timestamptz DEFAULT now()
);

-- ── 6. Internal communication (manager ↔ landlord per property) ─
CREATE TABLE IF NOT EXISTS internal_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  from_role     text NOT NULL,   -- landlord, manager, office
  from_name     text,
  message       text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- ── 7. Local tips (per property) ────────────────────────────
CREATE TABLE IF NOT EXISTS local_tips (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name text NOT NULL,
  category      text,            -- Food, Cafe, Nature, Culture, Shopping
  name          text NOT NULL,
  description   text,
  tags          text[],
  sort_order    int DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- Seed default tips for both properties (only if empty)
INSERT INTO local_tips (property_name, category, name, description, tags)
SELECT * FROM (VALUES
  ('Villa 21','Food','Cardamom Restaurant','Authentic Kerala cuisine with a rooftop view. Try the Malabar fish curry and appam.',ARRAY['Kerala cuisine','Rooftop']),
  ('Villa 21','Food','The Spice Garden','Homestyle meals on banana leaves. Open for lunch only — worth the wait.',ARRAY['Banana leaf','Lunch']),
  ('Villa 21','Cafe','Chai & Chill','Cosy cafe in a heritage building. Best filter coffee in town with fresh daily bakes.',ARRAY['Filter coffee','Cosy']),
  ('Villa 21','Nature','Vembanad Lake Sunset','15 mins away. Rent a kettuvallam for an hour at golden hour — absolutely stunning.',ARRAY['Sunset','Houseboat']),
  ('Villa 21','Culture','Krishnapuram Palace','18th century palace with murals and a beautiful garden. Allow 1.5 hours.',ARRAY['History','Architecture']),
  ('Villa 21','Shopping','Kottayam Spice Market','Fresh cardamom, pepper and cinnamon straight from traders.',ARRAY['Spices','Souvenirs']),
  ('19A Link Heritage','Food','Cardamom Restaurant','Authentic Kerala cuisine with a rooftop view.',ARRAY['Kerala cuisine','Rooftop']),
  ('19A Link Heritage','Cafe','Monsoon Brew','Artisanal coffee with garden seating and excellent single-origin pour-overs.',ARRAY['Pour-over','Garden']),
  ('19A Link Heritage','Nature','Kumarakom Bird Sanctuary','Over 100 bird species. Best at dawn. Binoculars available at our front desk.',ARRAY['Birds','Dawn']),
  ('19A Link Heritage','Culture','Kalarippayattu Show','Watch Kerala''s ancient martial art performed live every evening at 6PM.',ARRAY['Martial arts','Evening']),
  ('19A Link Heritage','Shopping','Handloom House','Kerala handwoven fabrics and kasavu sarees. Wonderful gifts to take home.',ARRAY['Handcraft','Sarees'])
) AS v
WHERE NOT EXISTS (SELECT 1 FROM local_tips LIMIT 1);

-- ── 8. Section C (Heritance use only — manager-only data) ───
CREATE TABLE IF NOT EXISTS guest_section_c (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_checkin_id uuid REFERENCES guest_checkins(id) ON DELETE CASCADE,
  num_guests       int,
  num_kids         int,
  num_rooms        int,
  plan             text,        -- CP / EP / MAP / AP
  extra_beds       int,
  booking_from     text,        -- Airbnb / Booking.com / Direct / Agent
  booking_mode     text,        -- Online / Phone / Walk-in
  payment_status   text,        -- paid / pending / partial
  billing_amount   numeric,
  gst_amount       numeric,
  notes            text,
  updated_by       text,
  updated_at       timestamptz DEFAULT now()
);

-- ── 9. RLS open policies on all new tables ──────────────────
ALTER TABLE landlords          ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_tips         ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_section_c    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open" ON landlords;
DROP POLICY IF EXISTS "open" ON property_documents;
DROP POLICY IF EXISTS "open" ON utility_payments;
DROP POLICY IF EXISTS "open" ON maintenance_log;
DROP POLICY IF EXISTS "open" ON internal_messages;
DROP POLICY IF EXISTS "open" ON local_tips;
DROP POLICY IF EXISTS "open" ON guest_section_c;

CREATE POLICY "open" ON landlords          FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON property_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON utility_payments   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON maintenance_log    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON internal_messages  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON local_tips         FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open" ON guest_section_c    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
