-- Banyan Circle — Messaging Tables
-- Run this once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_name     text NOT NULL,
  sender_role     text NOT NULL,        -- 'admin' | 'talent' | 'landlord' | 'guest'
  recipient_name  text NOT NULL,
  recipient_role  text NOT NULL,
  topic           text NOT NULL,
  body            text NOT NULL,
  booking_datetime text,                -- only used when topic = 'Booking Request'
  thread_id       uuid,                 -- set to root message id; null on root itself
  parent_id       uuid REFERENCES messages(id),
  read_by_recipient boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Open RLS (matches existing pattern in this project)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access on messages"
  ON messages FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "auth full access on messages"
  ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
