-- Complete User Management Setup with Role-Based Access Control
-- Run this in your Supabase SQL editor

-- Step 1: Ensure the role column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_roles') THEN
        CREATE TYPE user_roles AS ENUM ('user', 'release_manager', 'admin');
    END IF;
END $$;

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role user_roles NOT NULL DEFAULT 'user';
    END IF;
END $$;

-- Step 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert new users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can delete own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Release managers can view all users" ON users;

-- Step 3: Create new policies without infinite recursion

-- Allow all authenticated users to view all users (for user management page)
CREATE POLICY "Users can view all users" ON users
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow authenticated users to insert new users (for registration)
CREATE POLICY "Users can insert new users" ON users
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON users
FOR DELETE USING (auth.uid()::text = id::text);

-- Step 4: Create a function to check if user is admin (for future use)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create a function to get user role (for future use)
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS user_roles AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Update existing users to have a role (if any exist)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Step 7: Make the first user an admin (optional - uncomment and modify if needed)
-- UPDATE users SET role = 'admin' WHERE id = 'your-user-id-here' LIMIT 1;

-- Step 8: Add comments for documentation
COMMENT ON TABLE users IS 'User management: Basic operations allowed for authenticated users. Admin operations handled via API routes with service role.';
COMMENT ON COLUMN users.role IS 'User role: user (basic access), release_manager (can manage releases), admin (full access)';
COMMENT ON FUNCTION is_admin(uuid) IS 'Check if a user has admin role';
COMMENT ON FUNCTION get_user_role(uuid) IS 'Get the role of a specific user';

-- Step 9: Verify the setup
SELECT 
    'User Management Setup Complete' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN role = 'release_manager' THEN 1 END) as release_manager_users,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
FROM users; 