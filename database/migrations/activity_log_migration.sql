-- Activity Log Migration
-- Run this in your Supabase SQL editor to add activity logging

-- Create the activity_log table
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  release_id uuid references releases(id) on delete cascade,
  feature_id uuid references features(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  activity_type text not null, -- e.g. 'member_ready', 'feature_ready', 'release_created', etc.
  activity_details jsonb, -- for extra info (optional)
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table activity_log enable row level security;

-- Allow authenticated users to insert activity log entries
create policy "Users can insert activity log" on activity_log
for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to view activity log
create policy "Users can view activity log" on activity_log
for select using (auth.role() = 'authenticated');

-- Add updated_at trigger for consistency (optional)
create trigger set_activity_log_updated_at before update on activity_log
for each row execute procedure set_updated_at(); 