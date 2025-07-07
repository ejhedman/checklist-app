-- Migration: Relax not-null constraint on user_id column in members table
-- This allows member records to exist without a corresponding auth user

-- STEP 1: Check current constraint status
SELECT 
  'Current user_id column constraints' as info,
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'members' 
  AND column_name = 'user_id';

-- STEP 2: Check for any existing not-null constraints
SELECT 
  'Existing constraints on user_id' as info,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'members'::regclass 
  AND contype = 'n'
  AND pg_get_constraintdef(oid) LIKE '%user_id%';

-- STEP 3: Drop any existing not-null constraints on user_id
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find and drop not-null constraints on user_id
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'members'::regclass 
          AND contype = 'n'
          AND pg_get_constraintdef(oid) LIKE '%user_id%'
    LOOP
        EXECUTE 'ALTER TABLE members DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- STEP 4: Alter the column to allow null values
ALTER TABLE members ALTER COLUMN user_id DROP NOT NULL;

-- STEP 5: Verify the constraint has been relaxed
SELECT 
  'Updated user_id column constraints' as info,
  column_name,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'members' 
  AND column_name = 'user_id';

-- STEP 6: Test that null values can now be inserted
-- (This is a safe test that won't actually insert data)
SELECT 
  'Constraint relaxation test' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'members' 
        AND column_name = 'user_id'
        AND is_nullable = 'YES'
    ) THEN 'SUCCESS: user_id column now allows NULL values'
    ELSE 'FAILED: user_id column still has NOT NULL constraint'
  END as test_result;

-- STEP 7: Show current data distribution
SELECT 
  'Current data distribution' as info,
  CASE 
    WHEN user_id IS NULL THEN 'NULL user_id'
    ELSE 'Valid user_id'
  END as user_id_status,
  COUNT(*) as record_count
FROM members
GROUP BY CASE 
  WHEN user_id IS NULL THEN 'NULL user_id'
  ELSE 'Valid user_id'
END
ORDER BY user_id_status;

-- STEP 8: Summary
SELECT 
  'Migration Summary' as info,
  'user_id column constraint relaxed successfully' as status,
  'Members can now exist without auth user references' as note,
  (SELECT COUNT(*) FROM members WHERE user_id IS NULL) as current_null_count; 