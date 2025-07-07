-- Migration: Rename 'role' column to 'member_role' in members table
-- This migration safely renames the role column in the members table

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

-- STEP 10: Verify the change
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

-- STEP 11: Verify data integrity
SELECT 
  'Verification - members data after rename' as info,
  COUNT(*) as total_members,
  member_role,
  COUNT(*) as count
FROM members
GROUP BY member_role
ORDER BY member_role;

-- STEP 12: Summary
SELECT 
  'Migration Summary' as info,
  (SELECT COUNT(*) FROM members) as total_records,
  'Backup created as members_backup' as backup_info,
  'Column role renamed to member_role successfully' as migration_status; 