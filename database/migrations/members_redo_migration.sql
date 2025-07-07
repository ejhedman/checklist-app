-- Members Table Redo Migration
-- This script redoes the members table to match the new requirements
-- Run this in your Supabase SQL editor

-- STEP 1: Backup current data (optional - for safety)
CREATE TABLE IF NOT EXISTS members_backup AS SELECT * FROM members;

-- STEP 1.5: Check current roles in the members table
SELECT 
  'Current roles in members table' as info,
  role,
  COUNT(*) as count
FROM members 
GROUP BY role 
ORDER BY role;

-- STEP 2: Drop existing foreign key constraints that reference members.member_id
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_member_id_fkey;
ALTER TABLE member_release_state DROP CONSTRAINT IF EXISTS member_release_state_member_id_fkey;
ALTER TABLE features DROP CONSTRAINT IF EXISTS features_dri_member_id_fkey;
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_member_id_fkey;

-- STEP 3: Rename member_id column to user_id
ALTER TABLE members RENAME COLUMN member_id TO user_id;

-- STEP 4: Update existing roles from 'user' to 'member' BEFORE adding the new constraint
UPDATE members SET role = 'member' WHERE role = 'user';

-- STEP 5: Update the role constraint to use the new member roles
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_role_check;
ALTER TABLE members ADD CONSTRAINT members_role_check 
  CHECK (role IN ('member', 'release_manager', 'admin'));

-- STEP 5.5: Verify roles were updated correctly
SELECT 
  'Roles after update' as info,
  role,
  COUNT(*) as count
FROM members 
GROUP BY role 
ORDER BY role;

-- STEP 6: Recreate foreign key constraints with the new user_id column
ALTER TABLE team_members 
  ADD CONSTRAINT team_members_user_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(user_id) ON DELETE CASCADE;

ALTER TABLE member_release_state 
  ADD CONSTRAINT member_release_state_user_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(user_id) ON DELETE CASCADE;

ALTER TABLE features 
  ADD CONSTRAINT features_dri_user_id_fkey 
  FOREIGN KEY (dri_member_id) REFERENCES members(user_id) ON DELETE SET NULL;

ALTER TABLE activity_log 
  ADD CONSTRAINT activity_log_user_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(user_id) ON DELETE SET NULL;

-- STEP 7: Update RLS policies to use the new column name
DROP POLICY IF EXISTS "Members can view all members" ON members;
CREATE POLICY "Members can view all members" ON members
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Members can insert new members" ON members;
CREATE POLICY "Members can insert new members" ON members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Members can update own profile" ON members;
CREATE POLICY "Members can update own profile" ON members
FOR UPDATE USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Members can delete own profile" ON members;
CREATE POLICY "Members can delete own profile" ON members
FOR DELETE USING (auth.uid()::text = id::text);

-- STEP 8: Create a function to get auth user by email for the autocomplete
CREATE OR REPLACE FUNCTION get_auth_users_by_email(email_substring text)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name
  FROM auth.users au
  WHERE au.email ILIKE '%' || email_substring || '%'
    AND au.email_confirmed_at IS NOT NULL
  ORDER BY au.email
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Create a function to create a member from an auth user
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
  
  -- Insert into members table
  INSERT INTO members (id, user_id, email, full_name, nickname, role)
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
    role = EXCLUDED.member_role,
    updated_at = now()
  RETURNING user_id INTO member_user_id;
  
  RETURN member_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: Verify the migration
SELECT 
  'Migration Summary' as status,
  (SELECT COUNT(*) FROM members) as total_members,
  (SELECT COUNT(*) FROM team_members) as total_team_memberships,
  (SELECT COUNT(*) FROM member_release_state) as total_member_release_states,
  (SELECT COUNT(*) FROM features WHERE dri_member_id IS NOT NULL) as features_with_dri,
  (SELECT COUNT(*) FROM activity_log WHERE member_id IS NOT NULL) as activity_logs_with_member;

-- STEP 11: Show sample data to verify migration
SELECT 
  'Sample Members' as table_name,
  id,
  user_id,
  email,
  full_name,
  role
FROM members
LIMIT 5;

-- STEP 12: Test the auth user lookup function
SELECT 
  'Auth Users Available' as info,
  COUNT(*) as total_auth_users
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL;

-- STEP 13: Show available auth users for member creation
SELECT 
  'Available Auth Users for Member Creation' as info,
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  created_at
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
  AND id NOT IN (SELECT user_id FROM members)
ORDER BY email
LIMIT 10; 