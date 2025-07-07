-- Add Tenant User Map Table
-- Create a mapping table to associate users with tenants

-- 1. TENANT_USER_MAP TABLE
create table if not exists tenant_user_map (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references members(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, user_id)
);

-- 2. TRIGGER: updated_at auto-update
create trigger set_tenant_user_map_updated_at before update on tenant_user_map
for each row execute procedure set_updated_at();

-- 3. RLS POLICIES
-- Enable RLS
alter table tenant_user_map enable row level security;

-- Allow authenticated users to view tenant user mappings
create policy "Users can view tenant user mappings" on tenant_user_map
for select using (auth.role() = 'authenticated');

-- Allow authenticated users to insert tenant user mappings
create policy "Users can insert tenant user mappings" on tenant_user_map
for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to update tenant user mappings
create policy "Users can update tenant user mappings" on tenant_user_map
for update using (auth.role() = 'authenticated');

-- Allow authenticated users to delete tenant user mappings
create policy "Users can delete tenant user mappings" on tenant_user_map
for delete using (auth.role() = 'authenticated');

-- 4. CREATE INDEXES FOR BETTER PERFORMANCE
create index if not exists idx_tenant_user_map_tenant_id on tenant_user_map(tenant_id);
create index if not exists idx_tenant_user_map_user_id on tenant_user_map(user_id);
create index if not exists idx_tenant_user_map_created_at on tenant_user_map(created_at);

-- 5. POPULATE WITH DEFAULT TENANT USERS
-- Associate all existing users with the default DWH tenant
insert into tenant_user_map (tenant_id, user_id)
select 
  t.id as tenant_id,
  m.user_id
from tenants t
cross join members m
where t.name = 'DWH'
  and m.user_id is not null
  and not exists (
    select 1 from tenant_user_map tum 
    where tum.tenant_id = t.id and tum.user_id = m.user_id
  );

-- 6. VERIFY MIGRATION
select 
  'Migration Summary' as status,
  (select count(*) from tenant_user_map) as total_mappings,
  (select count(distinct tenant_id) from tenant_user_map) as tenants_with_users,
  (select count(distinct user_id) from tenant_user_map) as users_mapped; 