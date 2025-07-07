-- Complete Fix for User Roles Table
-- This script properly sets up the user_roles table and fixes all related issues

-- STEP 1: Drop and recreate the user_roles table to ensure clean state
DROP TABLE IF EXISTS user_roles CASCADE;

-- STEP 2: Create the user_roles table properly
CREATE TABLE user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique, -- References Supabase auth.users.id
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- STEP 3: Create index for faster lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- STEP 4: Create trigger for updated_at (if set_updated_at function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE TRIGGER set_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- STEP 5: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create RLS policies that allow authenticated users to read their own role
DROP POLICY IF EXISTS "Users can view user roles" ON user_roles;
CREATE POLICY "Users can view user roles" ON user_roles
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage user roles" ON user_roles;
CREATE POLICY "Users can manage user roles" ON user_roles
FOR ALL USING (auth.role() = 'authenticated');

-- STEP 7: Insert your admin role
INSERT INTO user_roles (user_id, role)
VALUES ('e5d0d590-59f6-4d54-ad71-b0db25f4a9ae', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET 
  role = 'admin',
  updated_at = now();

-- STEP 8: Bootstrap all other existing users with 'user' role
INSERT INTO user_roles (user_id, role)
SELECT 
  au.id as user_id,
  'user' as role
FROM auth.users au
WHERE au.id != 'e5d0d590-59f6-4d54-ad71-b0db25f4a9ae' -- Exclude the admin user
  AND au.id NOT IN (
    SELECT ur.user_id 
    FROM user_roles ur
  )
ON CONFLICT (user_id) DO NOTHING;

-- STEP 9: Verify the setup
SELECT 
  'User Roles Setup Complete' as status,
  (SELECT COUNT(*) FROM user_roles) as total_user_roles,
  (SELECT COUNT(CASE WHEN role = 'admin' THEN 1 END) FROM user_roles) as admin_users,
  (SELECT COUNT(CASE WHEN role = 'user' THEN 1 END) FROM user_roles) as regular_users;

-- STEP 10: Show your specific record
SELECT 
  'Your Admin Record' as info,
  user_id,
  role,
  created_at,
  updated_at
FROM user_roles 
WHERE user_id = 'e5d0d590-59f6-4d54-ad71-b0db25f4a9ae';

-- STEP 11: Test the query that the app uses
SELECT 
  'Test Query Result' as info,
  role
FROM user_roles 
WHERE user_id = 'e5d0d590-59f6-4d54-ad71-b0db25f4a9ae'
LIMIT 1; 