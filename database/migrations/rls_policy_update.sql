-- Update RLS policy for user_release_state table
-- Run this in your Supabase SQL editor

-- Drop the existing policies
drop policy if exists "Users can manage own release state" on user_release_state;
drop policy if exists "Users can manage release state" on user_release_state;

-- Create the new policy that allows users to manage release state for releases they have access to
create policy "Users can manage release state" on user_release_state
for all using (
  exists (
    select 1 from release_teams rt
    join team_users tu on tu.team_id = rt.team_id
    where rt.release_id = user_release_state.release_id and tu.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from release_teams rt
    join team_users tu on tu.team_id = rt.team_id
    where rt.release_id = user_release_state.release_id and tu.user_id = auth.uid()
  )
); 