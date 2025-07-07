-- Complete Migration: Rename 'role' column to 'sys_role' in sys_roles table
-- Run this in your Supabase SQL editor

-- STEP 1: Backup current data
CREATE TABLE IF NOT EXISTS sys_roles_backup AS SELECT * FROM sys_roles;

-- STEP 2: Check current state
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

-- STEP 3: Show current data
SELECT 
  'Current sys_roles data' as info,
  COUNT(*) as total_records
FROM sys_roles;

-- STEP 4: Find and drop foreign key constraints that reference sys_roles.role
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT 
            tc.constraint_name,
            kcu.table_name,
            kcu.column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND ccu.table_name = 'sys_roles'
          AND ccu.column_name = 'role'
    LOOP
        EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped foreign key constraint: % on table %', constraint_record.constraint_name, constraint_record.table_name;
    END LOOP;
END $$;

-- STEP 5: Drop any indexes on the role column
DROP INDEX IF EXISTS idx_sys_roles_role;
DROP INDEX IF EXISTS sys_roles_role_idx;
DROP INDEX IF EXISTS sys_roles_role_key;

-- STEP 6: Rename the column from 'role' to 'sys_role'
ALTER TABLE sys_roles RENAME COLUMN role TO sys_role;

-- STEP 7: Recreate indexes on the new column name
CREATE INDEX IF NOT EXISTS idx_sys_roles_sys_role ON sys_roles(sys_role);

-- STEP 8: Update any RLS policies that reference the old column name
-- (This will depend on your specific policies - you may need to manually update these)

-- STEP 9: Recreate foreign key constraints with the new column name
-- (You'll need to add specific constraints here based on your schema)

-- STEP 10: Update any functions that reference sys_roles.role
-- Example: If you have a function that references sys_roles.role, update it here
-- CREATE OR REPLACE FUNCTION your_function_name() AS $$
-- BEGIN
--   -- Update references from sys_roles.role to sys_roles.sys_role
-- END;
-- $$ LANGUAGE plpgsql;

-- STEP 11: Verify the migration
SELECT 
  'Migration verification' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'sys_roles'
  AND column_name = 'sys_role';

-- STEP 12: Show sample data after migration
SELECT 
  'Sample data after migration' as info,
  id,
  sys_role,
  created_at,
  updated_at
FROM sys_roles
LIMIT 5;

-- STEP 13: Check for any remaining references to the old column name
SELECT 
  'Remaining references check' as info,
  'Run database/check_sys_roles_references.sql to find any remaining references' as note;

-- STEP 14: Summary
SELECT 
  'Migration Summary' as status,
  (SELECT COUNT(*) FROM sys_roles) as total_records,
  'Column renamed from role to sys_role' as change_made,
  'Backup created as sys_roles_backup' as backup_info; 