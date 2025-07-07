-- Migration: Rename 'role' column to 'sys_role' in sys_roles table
-- Run this in your Supabase SQL editor

-- STEP 1: Check current state of sys_roles table
SELECT 
  'Current sys_roles table structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'sys_roles'
ORDER BY ordinal_position;

-- STEP 2: Check current data in sys_roles table
SELECT 
  'Current sys_roles data' as info,
  COUNT(*) as total_records
FROM sys_roles;

-- STEP 3: Show sample data before migration
SELECT 
  'Sample data before migration' as info,
  id,
  role,
  created_at,
  updated_at
FROM sys_roles
LIMIT 5;

-- STEP 4: Drop any foreign key constraints that reference the role column
-- (Add specific constraints here if they exist)
-- ALTER TABLE some_table DROP CONSTRAINT IF EXISTS constraint_name;

-- STEP 5: Drop any indexes on the role column
DROP INDEX IF EXISTS idx_sys_roles_role;

-- STEP 6: Rename the column from 'role' to 'sys_role'
ALTER TABLE sys_roles RENAME COLUMN role TO sys_role;

-- STEP 7: Recreate any indexes on the new column name
CREATE INDEX IF NOT EXISTS idx_sys_roles_sys_role ON sys_roles(sys_role);

-- STEP 8: Update any RLS policies that reference the old column name
-- (This will depend on your specific policies)

-- STEP 9: Verify the migration
SELECT 
  'Migration verification' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'sys_roles'
  AND column_name = 'sys_role';

-- STEP 10: Show sample data after migration
SELECT 
  'Sample data after migration' as info,
  id,
  sys_role,
  created_at,
  updated_at
FROM sys_roles
LIMIT 5;

-- STEP 11: Check for any remaining references to the old column name
SELECT 
  'Check for remaining references' as info,
  'Run this query to find any remaining references to the old column name' as note;

-- STEP 12: Summary
SELECT 
  'Migration Summary' as status,
  (SELECT COUNT(*) FROM sys_roles) as total_records,
  'Column renamed from role to sys_role' as change_made; 