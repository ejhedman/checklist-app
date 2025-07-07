-- Check teams data and RLS policies
-- This script helps diagnose issues with teams table access

-- Check if teams table exists and has data
SELECT 
  'Teams table info' as info,
  COUNT(*) as total_teams
FROM teams;

-- Show sample teams data
SELECT 
  'Sample teams' as info,
  id,
  name,
  description,
  created_at
FROM teams
ORDER BY name
LIMIT 5;

-- Check RLS policies on teams table
SELECT 
  'Teams RLS policies' as info,
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

-- Check if RLS is enabled on teams table
SELECT 
  'Teams RLS status' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'teams';

-- Check current user and role
SELECT 
  'Current auth info' as info,
  current_user,
  session_user,
  auth.role() as auth_role,
  auth.uid() as auth_uid; 