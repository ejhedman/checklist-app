-- Cleanup: Set member user_id to null if the user doesn't exist in auth.users table
-- This script identifies and fixes orphaned user_id references in the members table

-- STEP 1: Check current state - count orphaned user_ids
SELECT 
  'Current orphaned user_id count' as info,
  COUNT(*) as orphaned_count
FROM members m
WHERE m.user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = m.user_id
  );

-- STEP 2: Show details of orphaned records before cleanup
SELECT 
  'Orphaned member records (before cleanup)' as info,
  m.id,
  m.user_id,
  m.email,
  m.full_name,
  m.member_role,
  m.created_at
FROM members m
WHERE m.user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = m.user_id
  )
ORDER BY m.created_at DESC;

-- STEP 3: Create backup of affected records
CREATE TABLE IF NOT EXISTS members_orphaned_backup AS
SELECT 
  m.*,
  'orphaned_user_id' as cleanup_reason
FROM members m
WHERE m.user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = m.user_id
  );

-- STEP 4: Update orphaned records - set user_id to null
UPDATE members 
SET 
  user_id = NULL,
  updated_at = now()
WHERE user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = members.user_id
  );

-- STEP 5: Verify the cleanup - count remaining orphaned user_ids
SELECT 
  'Remaining orphaned user_id count (after cleanup)' as info,
  COUNT(*) as remaining_orphaned_count
FROM members m
WHERE m.user_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = m.user_id
  );

-- STEP 6: Show summary of cleanup results
SELECT 
  'Cleanup Summary' as info,
  (SELECT COUNT(*) FROM members_orphaned_backup) as records_cleaned,
  (SELECT COUNT(*) FROM members WHERE user_id IS NULL) as members_with_null_user_id,
  (SELECT COUNT(*) FROM members WHERE user_id IS NOT NULL) as members_with_valid_user_id,
  'Backup created as members_orphaned_backup' as backup_info;

-- STEP 7: Show sample of cleaned records
SELECT 
  'Sample of cleaned records' as info,
  m.id,
  m.user_id,
  m.email,
  m.full_name,
  m.member_role,
  m.created_at,
  m.updated_at
FROM members m
WHERE m.user_id IS NULL
ORDER BY m.updated_at DESC
LIMIT 5;

-- STEP 8: Show backup table contents
SELECT 
  'Backup table contents' as info,
  COUNT(*) as backup_record_count
FROM members_orphaned_backup;

-- STEP 9: Optional - Show orphaned records that were cleaned up
SELECT 
  'Cleaned up orphaned records' as info,
  id,
  user_id as original_user_id,
  email,
  full_name,
  member_role,
  created_at,
  cleanup_reason
FROM members_orphaned_backup
ORDER BY created_at DESC; 