-- Re-enable RLS on teams table with correct policies
-- This should be run after fixing the RLS policies

-- First, apply the correct RLS policies
-- Drop old user-based policies
DROP POLICY IF EXISTS "Users can view all teams" ON teams;
DROP POLICY IF EXISTS "Users can insert teams" ON teams;
DROP POLICY IF EXISTS "Users can update teams" ON teams;
DROP POLICY IF EXISTS "Users can delete teams" ON teams;

-- Create new member-based policies
-- Allow authenticated users to view all teams
CREATE POLICY "Members can view all teams" ON teams
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert teams
CREATE POLICY "Members can insert teams" ON teams
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update teams
CREATE POLICY "Members can update teams" ON teams
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete teams
CREATE POLICY "Members can delete teams" ON teams
FOR DELETE USING (auth.role() = 'authenticated');

-- Now re-enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled and policies are in place
SELECT 
  'Teams RLS status after re-enable' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'teams';

-- Show the policies
SELECT 
  'Teams RLS policies after re-enable' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'teams'
ORDER BY policyname; 