-- Add role information to users table
-- Run this in your Supabase SQL editor

-- Create user_roles enum type
CREATE TYPE user_roles AS ENUM ('user', 'release_manager', 'admin');

-- Add role column to users table
ALTER TABLE users ADD COLUMN role user_roles NOT NULL DEFAULT 'user';

-- Update the updated_at trigger to include the new column
-- (The existing trigger should already handle this automatically)

-- Update RLS policies to consider roles
-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow release managers to view all users but only edit their own profile
CREATE POLICY "Release managers can view all users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('admin', 'release_manager')
  )
);

-- Regular users can only view all users and edit their own profile
-- (existing policies should handle this)

-- Add comment to document the role system
COMMENT ON COLUMN users.role IS 'User role: user (basic access), release_manager (can manage releases), admin (full access)'; 