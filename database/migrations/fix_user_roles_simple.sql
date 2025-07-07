-- Simple fix for user_roles table - allow users to read their own role
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_roles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_roles;

-- Step 2: Create simple, permissive policies
-- Allow authenticated users to read their own role
CREATE POLICY "Users can read their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to update their own role
CREATE POLICY "Users can update their own role" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow authenticated users to insert new roles
CREATE POLICY "Users can insert roles" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 3: Ensure table exists with correct structure
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Step 4: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Insert default roles for existing users if they don't exist
INSERT INTO user_roles (user_id, role)
SELECT 
  id as user_id,
  'user' as role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 7: Test the setup
SELECT 'user_roles table fixed' as status;
SELECT COUNT(*) as total_user_roles FROM user_roles;
SELECT COUNT(*) as total_auth_users FROM auth.users; 