-- Fix RLS policies for teams table to work with members-based system
-- This script updates the teams table RLS policies to work with the new members table

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

-- Verify the policies were created
SELECT 
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