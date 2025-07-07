-- Fix Tenants Migration
-- Handle existing tenants table and add missing tenant_id fields

-- 1. TENANTS TABLE (only create if it doesn't exist)
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TRIGGER: updated_at auto-update (only create if it doesn't exist)
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_tenants_updated_at') then
    create trigger set_tenants_updated_at before update on tenants
    for each row execute procedure set_updated_at();
  end if;
end $$;

-- 3. RLS POLICIES (drop and recreate to ensure they're correct)
-- Enable RLS
alter table tenants enable row level security;

-- Drop existing policies
drop policy if exists "Users can view all tenants" on tenants;
drop policy if exists "Admin users can insert tenants" on tenants;
drop policy if exists "Admin users to update tenants" on tenants;
drop policy if exists "Admin users can delete tenants" on tenants;
drop policy if exists "Users can insert tenants" on tenants;
drop policy if exists "Users can update tenants" on tenants;
drop policy if exists "Users can delete tenants" on tenants;

-- Create new permissive policies
create policy "Users can view all tenants" on tenants
for select using (auth.role() = 'authenticated');

create policy "Users can insert tenants" on tenants
for insert with check (auth.role() = 'authenticated');

create policy "Users can update tenants" on tenants
for update using (auth.role() = 'authenticated');

create policy "Users can delete tenants" on tenants
for delete using (auth.role() = 'authenticated');

-- 4. INSERT DEFAULT TENANT (only if it doesn't exist)
insert into tenants (name) values ('DWH') on conflict (name) do nothing;

-- 5. GET THE DEFAULT TENANT ID
do $$
declare
  default_tenant_id uuid;
begin
  select id into default_tenant_id from tenants where name = 'DWH' limit 1;
  
  -- 6. ADD tenant_id COLUMN TO ALL RELEVANT TABLES (only if they don't exist)
  -- activity_log table
  if not exists (select 1 from information_schema.columns where table_name = 'activity_log' and column_name = 'tenant_id') then
    alter table activity_log add column tenant_id uuid references tenants(id) on delete cascade;
  end if;
  
  -- features table
  if not exists (select 1 from information_schema.columns where table_name = 'features' and column_name = 'tenant_id') then
    alter table features add column tenant_id uuid references tenants(id) on delete cascade;
  end if;
  
  -- member_release_state table
  if not exists (select 1 from information_schema.columns where table_name = 'member_release_state' and column_name = 'tenant_id') then
    alter table member_release_state add column tenant_id uuid references tenants(id) on delete cascade;
  end if;
  
  -- members table
  if not exists (select 1 from information_schema.columns where table_name = 'members' and column_name = 'tenant_id') then
    alter table members add column tenant_id uuid references tenants(id) on delete cascade;
  end if;
  
  -- release_teams table
  if not exists (select 1 from information_schema.columns where table_name = 'release_teams' and column_name = 'tenant_id') then
    alter table release_teams add column tenant_id uuid references tenants(id) on delete cascade;
  end if;
  
  -- releases table
  if not exists (select 1 from information_schema.columns where table_name = 'releases' and column_name = 'tenant_id') then
    alter table releases add column tenant_id uuid references tenants(id) on delete cascade;
  end if;
  
  -- targets table
  if not exists (select 1 from information_schema.columns where table_name = 'targets' and column_name = 'tenant_id') then
    alter table targets add column tenant_id uuid references tenants(id) on delete cascade;
  end if;
  
  -- teams table
  if not exists (select 1 from information_schema.columns where table_name = 'teams' and column_name = 'tenant_id') then
    alter table teams add column tenant_id uuid references tenants(id) on delete cascade;
  end if;
  
  -- team_members table
  if not exists (select 1 from information_schema.columns where table_name = 'team_members' and column_name = 'tenant_id') then
    alter table team_members add column tenant_id uuid references tenants(id) on delete cascade;
  end if;
  
  -- 7. POPULATE tenant_id WITH DEFAULT TENANT ID (only if tenant_id is null)
  if default_tenant_id is not null then
    update activity_log set tenant_id = default_tenant_id where tenant_id is null;
    update features set tenant_id = default_tenant_id where tenant_id is null;
    update member_release_state set tenant_id = default_tenant_id where tenant_id is null;
    update members set tenant_id = default_tenant_id where tenant_id is null;
    update release_teams set tenant_id = default_tenant_id where tenant_id is null;
    update releases set tenant_id = default_tenant_id where tenant_id is null;
    update targets set tenant_id = default_tenant_id where tenant_id is null;
    update teams set tenant_id = default_tenant_id where tenant_id is null;
    update team_members set tenant_id = default_tenant_id where tenant_id is null;
  end if;
  
  -- 8. MAKE tenant_id NOT NULL AFTER POPULATING (only if not already not null)
  if exists (select 1 from information_schema.columns where table_name = 'activity_log' and column_name = 'tenant_id' and is_nullable = 'YES') then
    alter table activity_log alter column tenant_id set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'features' and column_name = 'tenant_id' and is_nullable = 'YES') then
    alter table features alter column tenant_id set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'member_release_state' and column_name = 'tenant_id' and is_nullable = 'YES') then
    alter table member_release_state alter column tenant_id set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'members' and column_name = 'tenant_id' and is_nullable = 'YES') then
    alter table members alter column tenant_id set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'release_teams' and column_name = 'tenant_id' and is_nullable = 'YES') then
    alter table release_teams alter column tenant_id set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'releases' and column_name = 'tenant_id' and is_nullable = 'YES') then
    alter table releases alter column tenant_id set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'targets' and column_name = 'tenant_id' and is_nullable = 'YES') then
    alter table targets alter column tenant_id set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'teams' and column_name = 'tenant_id' and is_nullable = 'YES') then
    alter table teams alter column tenant_id set not null;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'team_members' and column_name = 'tenant_id' and is_nullable = 'YES') then
    alter table team_members alter column tenant_id set not null;
  end if;
  
end $$;

-- 9. CREATE INDEXES FOR BETTER PERFORMANCE (only if they don't exist)
create index if not exists idx_activity_log_tenant_id on activity_log(tenant_id);
create index if not exists idx_features_tenant_id on features(tenant_id);
create index if not exists idx_member_release_state_tenant_id on member_release_state(tenant_id);
create index if not exists idx_members_tenant_id on members(tenant_id);
create index if not exists idx_release_teams_tenant_id on release_teams(tenant_id);
create index if not exists idx_releases_tenant_id on releases(tenant_id);
create index if not exists idx_targets_tenant_id on targets(tenant_id);
create index if not exists idx_teams_tenant_id on teams(tenant_id);
create index if not exists idx_team_members_tenant_id on team_members(tenant_id);

-- 10. VERIFY MIGRATION
select 
  'Migration Summary' as status,
  (select count(*) from tenants) as total_tenants,
  (select count(*) from activity_log where tenant_id is not null) as activity_log_with_tenant,
  (select count(*) from features where tenant_id is not null) as features_with_tenant,
  (select count(*) from member_release_state where tenant_id is not null) as member_release_state_with_tenant,
  (select count(*) from members where tenant_id is not null) as members_with_tenant,
  (select count(*) from release_teams where tenant_id is not null) as release_teams_with_tenant,
  (select count(*) from releases where tenant_id is not null) as releases_with_tenant,
  (select count(*) from targets where tenant_id is not null) as targets_with_tenant,
  (select count(*) from teams where tenant_id is not null) as teams_with_tenant,
  (select count(*) from team_members where tenant_id is not null) as team_members_with_tenant; 