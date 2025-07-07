-- Debug and fix user_roles table access
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Current state check' as step;
SELECT COUNT(*) as user_roles_count FROM user_roles;
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- Step 2: Temporarily disable RLS to test if query works
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Step 3: Test the exact query the app uses (replace with your user ID)
-- SELECT role FROM user_roles WHERE user_id = 'your-user-id-here';

-- Step 4: Re-enable RLS with a very permissive policy for debugging
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_roles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_roles;

-- Create a very permissive policy for testing
CREATE POLICY "Allow all authenticated users to read roles" ON user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Step 5: Test with auth context
SELECT 'Testing with permissive policy' as step;
SELECT auth.uid() as current_user_id;
SELECT auth.role() as current_auth_role;

-- Test the query that should work now
SELECT 'Role query test' as test_name,
       ur.role,
       ur.user_id
FROM user_roles ur
WHERE ur.user_id = auth.uid();

-- Step 6: If that works, create the proper restrictive policy
-- (We'll do this after confirming the query works) 