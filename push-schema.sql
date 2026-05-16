-- Run this in Supabase SQL Editor (one-time addition)

-- Push notification subscriptions table
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'staff', -- 'staff' | 'owner' | 'guest'
  endpoint text not null unique,
  p256dh text,
  auth text,
  updated_at timestamptz default now()
);

alter table push_subscriptions enable row level security;
create policy "Users manage own subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id);

-- Add status column to housekeeping_tasks if not exists
alter table housekeeping_tasks
  add column if not exists status text default 'not_started';
-- Values: 'not_started' | 'in_progress' | 'done'
