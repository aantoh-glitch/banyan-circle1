-- ============================================================
-- BANYAN CIRCLE — SEED DATA
-- Run this entire block in Supabase SQL Editor
-- ============================================================

-- Step 1: Add missing columns to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pin text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS email text;

-- Step 2: Add status column to housekeeping_tasks
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started';

-- Step 3: Add push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  role text not null default 'staff',
  endpoint text not null unique,
  p256dh text,
  auth text,
  updated_at timestamptz default now()
);

-- Step 4: Insert the 4 default users
INSERT INTO staff (name, designation, pin) VALUES
  ('Aby',     'Owner',                        '1111'),
  ('Sherry',  'Homekeeper',                   '2222'),
  ('Ajith',   'Relationship Manager',         '2222'),
  ('Vineeth', 'Guest Experience Coordinator', '2222')
ON CONFLICT DO NOTHING;
