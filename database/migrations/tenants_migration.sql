-- Targets Migration
-- Add targets table to the database

-- 1. TENANTS TABLE
create table if not exists targets (
  id uuid primary key default gen_random_uuid(),
  short_name text not null unique,
  name text not null,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TRIGGER: updated_at auto-update
create trigger set_targets_updated_at before update on targets
for each row execute procedure set_updated_at();

-- 3. RLS POLICIES
-- Enable RLS
alter table targets enable row level security;

-- TENANTS TABLE POLICIES
-- Allow authenticated users to view all targets
create policy "Users can view all targets" on targets
for select using (auth.role() = 'authenticated');

-- Allow authenticated users to insert targets
create policy "Users can insert targets" on targets
for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to update targets
create policy "Users can update targets" on targets
for update using (auth.role() = 'authenticated');

-- Allow authenticated users to delete targets
create policy "Users can delete targets" on targets
for delete using (auth.role() = 'authenticated'); 