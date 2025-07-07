-- More permissive fix for user_roles table
-- This version allows authenticated users to read all roles for debugging

-- Step 1: Drop existing table and policies if they exist
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_roles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_roles;

-- Drop the table if it exists
DROP TABLE IF EXISTS user_roles;

-- Step 2: Create the user_roles table
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Step 3: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create more permissive RLS policies for debugging
-- Allow all authenticated users to read all roles (for debugging)
CREATE POLICY "Enable read access for all authenticated users" ON user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own role
CREATE POLICY "Users can update their own role" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow authenticated users to insert new roles
CREATE POLICY "Enable insert for authenticated users" ON user_roles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Step 5: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON user_roles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Insert default roles for existing users
INSERT INTO user_roles (user_id, role)
SELECT 
  id as user_id,
  'user' as role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 8: Verify the setup
SELECT 'user_roles table created successfully' as status;
SELECT COUNT(*) as total_user_roles FROM user_roles;
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- Step 9: Show all user roles for debugging
SELECT 'All user roles:' as debug_info;
SELECT user_id, role, created_at FROM user_roles ORDER BY created_at; 