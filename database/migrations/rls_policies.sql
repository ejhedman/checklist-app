-- Release Management Checklist App – RLS Policy Updates
-- Run this in your Supabase SQL editor to add Row Level Security policies

-- USERS TABLE POLICIES
-- Allow authenticated users to insert new users (for registration)
create policy "Users can insert new users" on users
for insert with check (auth.role() = 'authenticated');

-- Allow users to view all users (for member listing)
create policy "Users can view all users" on users
for select using (auth.role() = 'authenticated');

-- Allow users to update their own profile
create policy "Users can update own profile" on users
for update using (auth.uid()::text = id::text);

-- Allow users to delete their own profile
create policy "Users can delete own profile" on users
for delete using (auth.uid()::text = id::text);

-- TEAMS TABLE POLICIES
-- Allow authenticated users to view all teams
create policy "Users can view all teams" on teams
for select using (auth.role() = 'authenticated');

-- Allow authenticated users to insert teams
create policy "Users can insert teams" on teams
for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to update teams
create policy "Users can update teams" on teams
for update using (auth.role() = 'authenticated');

-- Allow authenticated users to delete teams
create policy "Users can delete teams" on teams
for delete using (auth.role() = 'authenticated');

-- TEAM_USERS TABLE POLICIES
-- Allow authenticated users to view team memberships
create policy "Users can view team memberships" on team_users
for select using (auth.role() = 'authenticated');

-- Allow authenticated users to manage team memberships
create policy "Users can manage team memberships" on team_users
for all using (auth.role() = 'authenticated');

-- RELEASES TABLE POLICIES
-- Allow users to see releases if they belong to any assigned team
create policy "Users can view releases for their teams" on releases
for select using (
  exists (
    select 1 from release_teams rt
    join team_users tu on tu.team_id = rt.team_id
    where rt.release_id = id and tu.user_id = auth.uid()
  )
);

-- Allow authenticated users to manage releases
create policy "Users can manage releases" on releases
for all using (auth.role() = 'authenticated');

-- RELEASE_TEAMS TABLE POLICIES
-- Allow authenticated users to manage release team assignments
create policy "Users can manage release teams" on release_teams
for all using (auth.role() = 'authenticated');

-- FEATURES TABLE POLICIES
-- Allow authenticated users to manage features
create policy "Users can manage features" on features
for all using (auth.role() = 'authenticated');

-- USER_RELEASE_STATE TABLE POLICIES
-- Allow users to manage their own release state
create policy "Users can manage own release state" on user_release_state
for all using (auth.uid()::text = user_id::text); 