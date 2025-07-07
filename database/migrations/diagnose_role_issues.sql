-- Diagnostic Script for Role Retrieval Issues
-- Run this in Supabase SQL Editor to identify the current state

-- STEP 1: Check if user_roles table exists and its structure
SELECT 
  'Table Check' as check_type,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) as table_exists;

-- STEP 2: Show table structure if it exists
SELECT 
  'Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- STEP 3: Check RLS status and policies
SELECT 
  'RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_roles';

SELECT 
  'RLS Policies' as check_type,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles';

-- STEP 4: Check permissions
SELECT 
  'Permissions' as check_type,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'user_roles';

-- STEP 5: Check data count and content
SELECT 
  'Data Count' as check_type,
  COUNT(*) as total_records
FROM user_roles;

-- STEP 6: Show all user roles
SELECT 
  'All User Roles' as check_type,
  ur.user_id,
  ur.role,
  ur.created_at,
  ur.updated_at,
  au.email
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
ORDER BY ur.created_at DESC;

-- STEP 7: Check for ehedman@acm.org specifically
SELECT 
  'ehedman@acm.org Check' as check_type,
  au.id as user_id,
  au.email,
  ur.role,
  ur.created_at,
  ur.updated_at,
  CASE 
    WHEN ur.user_id IS NOT NULL THEN 'Has role'
    ELSE 'No role assigned'
  END as status
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
WHERE au.email = 'ehedman@acm.org';

-- STEP 8: Check for any auth users without roles
SELECT 
  'Auth Users Without Roles' as check_type,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
WHERE au.id NOT IN (
  SELECT ur.user_id 
  FROM user_roles ur
);

-- STEP 9: Test auth context
SELECT 
  'Auth Context Test' as check_type,
  auth.uid() as current_user_id,
  auth.role() as current_auth_role;

-- STEP 10: Test the exact query that the app uses (if you're logged in as ehedman@acm.org)
-- This will only work if you're authenticated as the target user
SELECT 
  'App Query Test' as check_type,
  ur.role,
  ur.user_id
FROM user_roles ur
WHERE ur.user_id = auth.uid();

-- STEP 11: Test with a specific user ID (replace with actual user ID)
-- Uncomment and modify the following if you know the user ID:
/*
SELECT 
  'Specific User Test' as check_type,
  ur.role,
  ur.user_id
FROM user_roles ur
WHERE ur.user_id = 'your-user-id-here';
*/

-- STEP 12: Check for any duplicate user roles
SELECT 
  'Duplicate Check' as check_type,
  user_id,
  COUNT(*) as role_count
FROM user_roles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- STEP 13: Check for any invalid roles
SELECT 
  'Invalid Roles Check' as check_type,
  user_id,
  role,
  created_at
FROM user_roles
WHERE role NOT IN ('admin', 'user');

-- STEP 14: Summary
SELECT 
  'Summary' as check_type,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM user_roles) as total_user_roles,
  (SELECT COUNT(CASE WHEN role = 'admin' THEN 1 END) FROM user_roles) as admin_users,
  (SELECT COUNT(CASE WHEN role = 'user' THEN 1 END) FROM user_roles) as regular_users,
  (SELECT COUNT(*) FROM auth.users WHERE email = 'ehedman@acm.org') as ehedman_exists,
  (SELECT COUNT(*) FROM user_roles ur JOIN auth.users au ON ur.user_id = au.id WHERE au.email = 'ehedman@acm.org') as ehedman_has_role; 