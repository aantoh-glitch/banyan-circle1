-- ============================================================
-- BANYAN CIRCLE — SEED DATA
-- Run in Supabase SQL Editor AFTER schema.sql
-- This seeds the 4 default users
-- ============================================================

-- Clear existing staff (run only once on fresh setup)
-- delete from staff;

-- Insert Aby (owner) and staff
INSERT INTO staff (name, designation, pin) VALUES
  ('Aby',     'Owner',                        '1111'),
  ('Sherry',  'Homekeeper',                   '2222'),
  ('Ajith',   'Relationship Manager',         '2222'),
  ('Vineeth', 'Guest Experience Coordinator', '2222')
ON CONFLICT DO NOTHING;

-- Add status column to housekeeping_tasks if not exists
ALTER TABLE housekeeping_tasks
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started';

-- Add pin column to staff if not exists
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pin text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email text;
