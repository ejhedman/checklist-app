-- Rename Targets to Targets Migration
-- Rename the targets table and update all references

-- 1. Rename the table
alter table targets rename to targets;

-- 2. Rename the trigger
drop trigger if exists set_targets_updated_at on targets;
create trigger set_targets_updated_at before update on targets
for each row execute procedure set_updated_at();

-- 3. Drop old RLS policies
drop policy if exists "Users can view all targets" on targets;
drop policy if exists "Users can insert targets" on targets;
drop policy if exists "Users can update targets" on targets;
drop policy if exists "Users can delete targets" on targets;

-- 4. Create new RLS policies with updated names
create policy "Users can view all targets" on targets
for select using (auth.role() = 'authenticated');

create policy "Users can insert targets" on targets
for insert with check (auth.role() = 'authenticated');

create policy "Users can update targets" on targets
for update using (auth.role() = 'authenticated');

create policy "Users can delete targets" on targets
for delete using (auth.role() = 'authenticated');

-- 5. Update the releases table targets column to targets
alter table releases rename column targets to targets;

-- 6. Update the comment
comment on column releases.targets is 'Array of target short names associated with this release'; 