-- Fix User RLS Policies - Remove Infinite Recursion
-- Run this in your Supabase SQL editor

-- First, drop all existing policies on the users table
DROP POLICY IF EXISTS "Users can insert new users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Release managers can view all users" ON users;

-- Create new policies that don't cause infinite recursion

-- 1. Allow all authenticated users to view all users (for user management)
CREATE POLICY "Users can view all users" ON users
FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid()::text = id::text);

-- 3. Allow users to insert new users (for registration/signup)
CREATE POLICY "Users can insert new users" ON users
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON users
FOR DELETE USING (auth.uid()::text = id::text);

-- 5. For admin operations, we'll handle this in the API routes with service role
-- The client-side policies above are sufficient for basic operations
-- Admin operations (create/delete users) will be handled server-side via API routes

-- Add a comment to document the policy approach
COMMENT ON TABLE users IS 'User management: Basic operations allowed for authenticated users. Admin operations handled via API routes with service role.'; 