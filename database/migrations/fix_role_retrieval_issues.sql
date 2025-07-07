-- Comprehensive Fix for Role Retrieval Issues
-- This script addresses the multiple role fetching and wrong role assignment problems

-- STEP 1: Drop and recreate the user_roles table to ensure clean state
DROP TABLE IF EXISTS user_roles CASCADE;

-- STEP 2: Create the user_roles table with proper structure
CREATE TABLE user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique, -- References Supabase auth.users.id
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- STEP 3: Create index for faster lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- STEP 4: Create trigger for updated_at
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

-- STEP 5: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create proper RLS policies
-- Allow authenticated users to read their own role
CREATE POLICY "Users can read their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to update their own role (if needed)
CREATE POLICY "Users can update their own role" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow authenticated users to insert new roles
CREATE POLICY "Users can insert roles" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STEP 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- STEP 8: Find the user ID for ehedman@acm.org
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID for ehedman@acm.org
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'ehedman@acm.org';
    
    IF target_user_id IS NOT NULL THEN
        -- Insert admin role for ehedman@acm.org
        INSERT INTO user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id)
        DO UPDATE SET 
          role = 'admin',
          updated_at = now();
        
        RAISE NOTICE 'Set admin role for user % (ehedman@acm.org)', target_user_id;
    ELSE
        RAISE NOTICE 'User ehedman@acm.org not found in auth.users';
    END IF;
END $$;

-- STEP 9: Bootstrap all other existing users with 'user' role
INSERT INTO user_roles (user_id, role)
SELECT 
  au.id as user_id,
  'user' as role
FROM auth.users au
WHERE au.email != 'ehedman@acm.org' -- Exclude the admin user
  AND au.id NOT IN (
    SELECT ur.user_id 
    FROM user_roles ur
  )
ON CONFLICT (user_id) DO NOTHING;

-- STEP 10: Create helper functions
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM user_roles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_user_role(user_uuid uuid, new_role text)
RETURNS void AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (user_uuid, new_role)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 11: Verify the setup
SELECT 
  'User Roles Setup Complete' as status,
  (SELECT COUNT(*) FROM user_roles) as total_user_roles,
  (SELECT COUNT(CASE WHEN role = 'admin' THEN 1 END) FROM user_roles) as admin_users,
  (SELECT COUNT(CASE WHEN role = 'user' THEN 1 END) FROM user_roles) as regular_users;

-- STEP 12: Show the specific record for ehedman@acm.org
SELECT 
  'ehedman@acm.org role' as info,
  ur.user_id,
  ur.role,
  ur.created_at,
  ur.updated_at,
  au.email
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'ehedman@acm.org';

-- STEP 13: Test the exact query that the app uses
SELECT 
  'Test Query for ehedman@acm.org' as info,
  ur.role,
  ur.user_id
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'ehedman@acm.org'
LIMIT 1;

-- STEP 14: Show all user roles for verification
SELECT 
  'All User Roles' as info,
  ur.user_id,
  ur.role,
  ur.created_at,
  au.email
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
ORDER BY ur.created_at DESC;

-- STEP 15: Check for any auth users without roles
SELECT 
  'Auth Users Without Roles' as info,
  COUNT(*) as count
FROM auth.users au
WHERE au.id NOT IN (
  SELECT ur.user_id 
  FROM user_roles ur
); 