-- Fix Tenants RLS Policies
-- Update the tenants table policies to allow any authenticated user

-- Drop existing restrictive policies
drop policy if exists "Admin users can insert tenants" on tenants;
drop policy if exists "Admin users can update tenants" on tenants;
drop policy if exists "Admin users can delete tenants" on tenants;

-- Create new permissive policies
create policy "Users can insert tenants" on tenants
for insert with check (auth.role() = 'authenticated');

create policy "Users can update tenants" on tenants
for update using (auth.role() = 'authenticated');

create policy "Users can delete tenants" on tenants
for delete using (auth.role() = 'authenticated');

-- Verify the policies
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where tablename = 'tenants'
order by policyname; 