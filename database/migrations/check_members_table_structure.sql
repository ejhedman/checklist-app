-- Diagnostic: Check current members table structure
-- This will help identify if the role column rename migration has been run

-- STEP 1: Check current table structure
SELECT 
  'Current members table columns' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'members'
ORDER BY ordinal_position;

-- STEP 2: Check if role or member_role column exists
SELECT 
  'Column existence check' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'members' 
        AND column_name = 'role'
    ) THEN 'role column EXISTS (needs migration)'
    ELSE 'role column does NOT exist'
  END as role_column_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'members' 
        AND column_name = 'member_role'
    ) THEN 'member_role column EXISTS (migration completed)'
    ELSE 'member_role column does NOT exist'
  END as member_role_column_status;

-- STEP 3: Check current data (if role column exists)
SELECT 
  'Current member roles (if role column exists)' as info,
  role,
  COUNT(*) as count
FROM members
GROUP BY role
ORDER BY role;

-- STEP 4: Check current data (if member_role column exists)
SELECT 
  'Current member roles (if member_role column exists)' as info,
  member_role,
  COUNT(*) as count
FROM members
GROUP BY member_role
ORDER BY member_role;

-- STEP 5: Check RLS policies
SELECT 
  'Current RLS policies' as info,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'members';

-- STEP 6: Summary and recommendations
SELECT 
  'Diagnostic Summary' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'members' 
        AND column_name = 'role'
    ) THEN 'RUN MIGRATION: database/rename_members_role_complete.sql'
    ELSE 'Column already renamed, check RLS policies'
  END as recommendation; 