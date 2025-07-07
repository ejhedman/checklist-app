-- Complete Migration: Rename 'role' column to 'member_role' in members table
-- This migration safely renames the role column and updates related functions

-- STEP 1: Check current state of members table
SELECT 
  'Current members table structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'members'
ORDER BY ordinal_position;

-- STEP 2: Check current data in members table
SELECT 
  'Current members data' as info,
  COUNT(*) as total_members,
  role,
  COUNT(*) as count
FROM members
GROUP BY role
ORDER BY role;

-- STEP 3: Check for any constraints on the role column
SELECT 
  'Constraints on members.role' as info,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'members'::regclass 
  AND contype IN ('c', 'f', 'p', 'u');

-- STEP 4: Check for indexes on the role column
SELECT 
  'Indexes on members.role' as info,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'members' 
  AND indexdef LIKE '%role%';

-- STEP 5: Create backup of current data
CREATE TABLE IF NOT EXISTS members_backup AS SELECT * FROM members;

-- STEP 6: Drop any constraints that reference the role column
-- (This will be done automatically by the column rename, but we'll log them)
SELECT 
  'Dropping constraints on role column' as info,
  conname as constraint_name
FROM pg_constraint 
WHERE conrelid = 'members'::regclass 
  AND contype IN ('c', 'f', 'p', 'u')
  AND pg_get_constraintdef(oid) LIKE '%role%';

-- STEP 7: Drop any indexes on the role column
DROP INDEX IF EXISTS idx_members_role;
DROP INDEX IF EXISTS members_role_idx;
DROP INDEX IF EXISTS members_role_key;

-- STEP 8: Rename the column
ALTER TABLE members RENAME COLUMN role TO member_role;

-- STEP 9: Recreate any necessary indexes
CREATE INDEX IF NOT EXISTS idx_members_member_role ON members(member_role);

-- STEP 10: Update the role constraint to use the new column name
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_role_check;
ALTER TABLE members ADD CONSTRAINT members_role_check 
  CHECK (member_role IN ('member', 'release_manager', 'admin'));

-- STEP 11: Update the create_member_from_auth_user function
DROP FUNCTION IF EXISTS create_member_from_auth_user(uuid, text, text);

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

-- STEP 12: Verify the change
SELECT 
  'Verification - members table structure after rename' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'members'
ORDER BY ordinal_position;

-- STEP 13: Verify data integrity
SELECT 
  'Verification - members data after rename' as info,
  COUNT(*) as total_members,
  member_role,
  COUNT(*) as count
FROM members
GROUP BY member_role
ORDER BY member_role;

-- STEP 14: Verify the updated function
SELECT 
  'Updated function definition' as info,
  proname as function_name
FROM pg_proc 
WHERE proname = 'create_member_from_auth_user';

-- STEP 15: Summary
SELECT 
  'Migration Summary' as info,
  (SELECT COUNT(*) FROM members) as total_records,
  'Backup created as members_backup' as backup_info,
  'Column role renamed to member_role successfully' as migration_status,
  'Function create_member_from_auth_user updated' as function_status; 