-- Test User Role Setup
-- This script helps verify that the user_roles table exists and has the correct data

-- STEP 1: Check if user_roles table exists
SELECT 
  'Table Check' as info,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) as table_exists;

-- STEP 2: Show user_roles table structure
SELECT 
  'Table Structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- STEP 3: Count total user_roles records
SELECT 
  'Record Count' as info,
  COUNT(*) as total_user_roles
FROM user_roles;

-- STEP 4: Show all user_roles records
SELECT 
  'All User Roles' as info,
  user_id,
  role,
  created_at
FROM user_roles
ORDER BY created_at DESC;

-- STEP 5: Check if there are any auth users without roles
SELECT 
  'Auth Users Without Roles' as info,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
WHERE au.id NOT IN (
  SELECT ur.user_id 
  FROM user_roles ur
);

-- STEP 6: Show auth users with their roles
SELECT 
  'Auth Users with Roles' as info,
  au.id,
  au.email,
  ur.role,
  au.created_at
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
ORDER BY au.created_at DESC; 