-- Simple test to check user_roles table
-- Run this in Supabase SQL Editor

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
) as table_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_roles';

-- Check if table has any data
SELECT COUNT(*) as total_records FROM user_roles;

-- Test the actual query that the app uses (replace with your user ID)
-- SELECT * FROM user_roles WHERE user_id = 'your-user-id-here';

-- Test with auth context (this should work after running the fix)
SELECT 'Auth context test' as test_name, 
       auth.uid() as current_user_id,
       (SELECT role FROM user_roles WHERE user_id = auth.uid()) as user_role;

-- Test a simple query
SELECT 'user_roles table test' as test_name, COUNT(*) as record_count FROM user_roles; 