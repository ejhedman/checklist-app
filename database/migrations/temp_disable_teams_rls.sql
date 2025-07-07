-- Temporarily disable RLS on teams table for testing
-- WARNING: This is for testing only and should be reverted after fixing the issue

-- Disable RLS on teams table
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  'Teams RLS status after disable' as info,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'teams';

-- Test query to see if teams are accessible
SELECT 
  'Teams accessible after RLS disable' as info,
  COUNT(*) as total_teams
FROM teams;

-- Show sample teams
SELECT 
  'Sample teams after RLS disable' as info,
  id,
  name,
  description
FROM teams
ORDER BY name
LIMIT 5; 