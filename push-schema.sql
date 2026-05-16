-- Run in Supabase SQL Editor

-- Push subscriptions
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'staff',
  endpoint text not null unique,
  p256dh text,
  auth text,
  updated_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "Users manage own subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id);

-- Add status + PIN columns to staff table
alter table staff add column if not exists status text default 'not_started';
alter table staff add column if not exists pin text;
alter table staff add column if not exists email text;
alter table staff add column if not exists supabase_user_id uuid;

-- Add status to housekeeping_tasks
alter table housekeeping_tasks
  add column if not exists status text default 'not_started';

-- Update designation options to include Owner
-- designation: 'Owner' | 'Homekeeper' | 'Relationship Manager' | 'Guest Experience Coordinator'
