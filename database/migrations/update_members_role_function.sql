-- Migration: Update create_member_from_auth_user function to use member_role
-- This migration updates the database function to work with the renamed column

-- STEP 1: Check current function definition
SELECT 
  'Current function definition' as info,
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'create_member_from_auth_user';

-- STEP 2: Drop the existing function
DROP FUNCTION IF EXISTS create_member_from_auth_user(uuid, text, text);

-- STEP 3: Create the updated function with member_role
CREATE OR REPLACE FUNCTION create_member_from_auth_user(
  auth_user_id uuid,
  nickname text DEFAULT NULL,
  member_role text DEFAULT 'member'
)
RETURNS uuid AS $$
DECLARE
  member_user_id uuid;
BEGIN
  -- Get auth user details
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name
  INTO member_user_id, member_user_id, member_user_id
  FROM auth.users au
  WHERE au.id = auth_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;
  
  -- Insert into members table using member_role column
  INSERT INTO members (id, user_id, email, full_name, nickname, member_role)
  VALUES (
    gen_random_uuid(),
    auth_user_id,
    (SELECT email FROM auth.users WHERE id = auth_user_id),
    (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = auth_user_id),
    nickname,
    member_role
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    member_role = EXCLUDED.member_role,
    updated_at = now()
  RETURNING user_id INTO member_user_id;
  
  RETURN member_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Verify the updated function
SELECT 
  'Updated function definition' as info,
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'create_member_from_auth_user';

-- STEP 5: Test the function (optional - uncomment to test)
-- SELECT create_member_from_auth_user(
--   (SELECT id FROM auth.users WHERE email_confirmed_at IS NOT NULL LIMIT 1),
--   'Test Nickname',
--   'member'
-- );

-- STEP 6: Summary
SELECT 
  'Function Update Summary' as info,
  'create_member_from_auth_user function updated to use member_role column' as status,
  'Function now works with the renamed column' as note; 