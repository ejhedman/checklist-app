-- Bootstrap User Roles Table
-- This script creates user_roles records for all existing Supabase auth users
-- Sets the default role to 'user' for all existing users

-- STEP 1: Create user_roles records for all existing auth users
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

-- STEP 2: Verify the bootstrap was successful
SELECT 
  'Bootstrap Complete' as status,
  COUNT(*) as total_user_roles,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
FROM user_roles;

-- STEP 3: Show a sample of the created records (safe version)
SELECT 
  ur.user_id,
  ur.role,
  ur.created_at,
  au.email
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
ORDER BY ur.created_at DESC
LIMIT 10;

-- STEP 4: Check for any auth users without roles (should be 0 after bootstrap)
SELECT 
  'Users without roles' as check_type,
  COUNT(*) as count
FROM auth.users au
WHERE au.id NOT IN (
  SELECT ur.user_id 
  FROM user_roles ur
); 