-- Test the exact query that the app uses
-- Run this in Supabase SQL Editor

-- Test with your specific user ID
SELECT role 
FROM user_roles 
WHERE user_id = 'e5d0d590-59f6-4d54-ad71-b0db25f4a9ae';

-- Test with auth context
SELECT auth.uid() as current_user_id;

-- Test the full query with auth context
SELECT ur.role, ur.user_id
FROM user_roles ur
WHERE ur.user_id = auth.uid();

-- Check if there are any RLS issues
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_roles'; 