-- Check Auth Users Table Structure
-- This script helps diagnose the structure of the auth.users table

-- Check if we can access auth.users
SELECT 
  'Auth Users Access' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users LIMIT 1) 
    THEN 'PASS: Can access auth.users'
    ELSE 'FAIL: Cannot access auth.users'
  END as result;

-- Show the structure of auth.users table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Show a sample of auth users (first 5)
SELECT 
  'Sample Auth Users' as info,
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- Check if user_metadata column exists
SELECT 
  'User Metadata Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'auth' 
        AND table_name = 'users' 
        AND column_name = 'user_metadata'
    )
    THEN 'PASS: user_metadata column exists'
    ELSE 'FAIL: user_metadata column does not exist'
  END as result;

-- If user_metadata exists, show its structure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
      AND table_name = 'users' 
      AND column_name = 'user_metadata'
  ) THEN
    RAISE NOTICE 'user_metadata column exists - you can use it in your queries';
  ELSE
    RAISE NOTICE 'user_metadata column does not exist - use email and other basic columns instead';
  END IF;
END $$; 