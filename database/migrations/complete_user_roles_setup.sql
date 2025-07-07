-- Complete User Roles Setup and Bootstrap
-- This script creates the user_roles table and bootstraps it with all existing users

-- STEP 1: Create the user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique, -- References Supabase auth.users.id
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- STEP 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- STEP 3: Create trigger for updated_at (if set_updated_at function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    -- Drop trigger if it exists to avoid conflicts
    DROP TRIGGER IF EXISTS set_user_roles_updated_at ON user_roles;
    -- Create the trigger
    CREATE TRIGGER set_user_roles_updated_at BEFORE UPDATE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- STEP 4: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS policies
DROP POLICY IF EXISTS "Users can view user roles" ON user_roles;
CREATE POLICY "Users can view user roles" ON user_roles
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage user roles" ON user_roles;
CREATE POLICY "Users can manage user roles" ON user_roles
FOR ALL USING (auth.role() = 'authenticated');

-- STEP 6: Bootstrap user_roles with existing auth users
INSERT INTO user_roles (user_id, role)
SELECT 
  au.id as user_id,
  'user' as role
FROM auth.users au
WHERE au.id NOT IN (
  -- Exclude users that already have a role assigned
  SELECT ur.user_id 
  FROM user_roles ur
)
ON CONFLICT (user_id) DO NOTHING;

-- STEP 7: Create helper functions
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
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

-- STEP 8: Verification and Summary
SELECT 
  'Setup Complete' as status,
  (SELECT COUNT(*) FROM user_roles) as total_user_roles,
  (SELECT COUNT(CASE WHEN role = 'admin' THEN 1 END) FROM user_roles) as admin_users,
  (SELECT COUNT(CASE WHEN role = 'user' THEN 1 END) FROM user_roles) as regular_users,
  (SELECT COUNT(*) FROM auth.users) as total_auth_users;

-- STEP 9: Show sample of created records (safe version)
SELECT 
  'Sample Records' as info,
  ur.user_id,
  ur.role,
  ur.created_at,
  au.email
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
ORDER BY ur.created_at DESC
LIMIT 5;

-- STEP 10: Verify all users have roles
SELECT 
  'Verification' as check_type,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM user_roles) 
    THEN 'PASS: All users have roles'
    ELSE 'FAIL: Some users missing roles'
  END as result; 