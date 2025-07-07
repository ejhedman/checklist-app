-- Migration: Fix RLS policies for member_release_state
-- Removes all existing policies and implements recommended policies for secure member self-management

-- Remove all existing policies
DROP POLICY IF EXISTS "Members can manage release state" ON member_release_state;
DROP POLICY IF EXISTS "Members can update their own release state" ON member_release_state;
DROP POLICY IF EXISTS "Members can insert their own release state" ON member_release_state;
DROP POLICY IF EXISTS "Members can view their release state" ON member_release_state;

-- Allow members to view their own release state
CREATE POLICY "Members can view their release state"
ON member_release_state
FOR SELECT
USING (
  member_id = (SELECT member_id FROM members WHERE id = auth.uid())
);

-- Allow members to insert their own release state
CREATE POLICY "Members can insert their own release state"
ON member_release_state
FOR INSERT
WITH CHECK (
  member_id = (SELECT member_id FROM members WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM release_teams rt
    JOIN team_members tm ON tm.team_id = rt.team_id
    WHERE rt.release_id = member_release_state.release_id
      AND tm.member_id = member_release_state.member_id
  )
);

-- Allow members to update their own release state
CREATE POLICY "Members can update their own release state"
ON member_release_state
FOR UPDATE
USING (
  member_id = (SELECT member_id FROM members WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM release_teams rt
    JOIN team_members tm ON tm.team_id = rt.team_id
    WHERE rt.release_id = member_release_state.release_id
      AND tm.member_id = member_release_state.member_id
  )
); 