-- Test the exact query that's hanging in the app
-- Run this in Supabase SQL Editor

-- Test 1: Direct query with your user ID
SELECT role 
FROM user_roles 
WHERE user_id = 'e5d0d590-59f6-4d54-ad71-b0db25f4a9ae';

-- Test 2: Check if the table has data
SELECT COUNT(*) as total_records FROM user_roles;

-- Test 3: Check your specific record
SELECT * FROM user_roles WHERE user_id = 'e5d0d590-59f6-4d54-ad71-b0db25f4a9ae';

-- Test 4: Check RLS policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_roles'; 