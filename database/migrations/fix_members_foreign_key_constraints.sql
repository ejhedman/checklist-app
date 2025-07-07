-- Migration: Fix foreign key constraints to allow user_id to be set to null
-- This handles the foreign key constraint violations when cleaning up orphaned user_ids

-- STEP 1: Check current foreign key constraints that reference members.user_id
SELECT 
  'Foreign key constraints referencing members.user_id' as info,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'members'
  AND ccu.column_name = 'user_id';

-- STEP 2: Check for orphaned references in member_release_state
SELECT 
  'Orphaned references in member_release_state' as info,
  COUNT(*) as orphaned_count
FROM member_release_state mrs
WHERE mrs.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = mrs.member_id
  );

-- STEP 3: Show details of orphaned references
SELECT 
  'Orphaned member_release_state records' as info,
  mrs.release_id,
  mrs.member_id,
  mrs.is_ready,
  mrs.created_at
FROM member_release_state mrs
WHERE mrs.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = mrs.member_id
  );

-- STEP 4: Check for orphaned references in features table
SELECT 
  'Orphaned references in features' as info,
  COUNT(*) as orphaned_count
FROM features f
WHERE f.dri_member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = f.dri_member_id
  );

-- STEP 5: Check for orphaned references in team_members table
SELECT 
  'Orphaned references in team_members' as info,
  COUNT(*) as orphaned_count
FROM team_members tm
WHERE tm.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = tm.member_id
  );

-- STEP 6: Check for orphaned references in activity_log table
SELECT 
  'Orphaned references in activity_log' as info,
  COUNT(*) as orphaned_count
FROM activity_log al
WHERE al.member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = al.member_id
  );

-- STEP 7: Create backup of affected records
CREATE TABLE IF NOT EXISTS orphaned_references_backup AS
SELECT 
  'member_release_state' as table_name,
  release_id,
  member_id,
  is_ready,
  created_at,
  'orphaned_member_reference' as cleanup_reason
FROM member_release_state
WHERE member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = member_release_state.member_id
  )
UNION ALL
SELECT 
  'features' as table_name,
  id as release_id,
  dri_member_id as member_id,
  NULL as is_ready,
  created_at,
  'orphaned_member_reference' as cleanup_reason
FROM features
WHERE dri_member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = features.dri_member_id
  )
UNION ALL
SELECT 
  'team_members' as table_name,
  team_id as release_id,
  member_id,
  NULL as is_ready,
  created_at,
  'orphaned_member_reference' as cleanup_reason
FROM team_members
WHERE member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = team_members.member_id
  )
UNION ALL
SELECT 
  'activity_log' as table_name,
  id as release_id,
  member_id,
  NULL as is_ready,
  created_at,
  'orphaned_member_reference' as cleanup_reason
FROM activity_log
WHERE member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = activity_log.member_id
  );

-- STEP 8: Clean up orphaned references by setting them to NULL
-- member_release_state
UPDATE member_release_state 
SET member_id = NULL
WHERE member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = member_release_state.member_id
  );

-- features
UPDATE features 
SET dri_member_id = NULL
WHERE dri_member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = features.dri_member_id
  );

-- team_members
UPDATE team_members 
SET member_id = NULL
WHERE member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = team_members.member_id
  );

-- activity_log
UPDATE activity_log 
SET member_id = NULL
WHERE member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = activity_log.member_id
  );

-- STEP 9: Update foreign key constraints to allow NULL values
-- Drop existing constraints
ALTER TABLE member_release_state DROP CONSTRAINT IF EXISTS member_release_state_user_id_fkey;
ALTER TABLE features DROP CONSTRAINT IF EXISTS features_dri_user_id_fkey;
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;

-- Recreate constraints with ON DELETE SET NULL
ALTER TABLE member_release_state 
  ADD CONSTRAINT member_release_state_user_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(user_id) ON DELETE SET NULL;

ALTER TABLE features 
  ADD CONSTRAINT features_dri_user_id_fkey 
  FOREIGN KEY (dri_member_id) REFERENCES members(user_id) ON DELETE SET NULL;

ALTER TABLE team_members 
  ADD CONSTRAINT team_members_user_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(user_id) ON DELETE SET NULL;

ALTER TABLE activity_log 
  ADD CONSTRAINT activity_log_user_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(user_id) ON DELETE SET NULL;

-- STEP 10: Verify the cleanup
SELECT 
  'Cleanup verification' as info,
  'member_release_state orphaned count' as table_name,
  COUNT(*) as remaining_orphaned
FROM member_release_state
WHERE member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = member_release_state.member_id
  )
UNION ALL
SELECT 
  'Cleanup verification' as info,
  'features orphaned count' as table_name,
  COUNT(*) as remaining_orphaned
FROM features
WHERE dri_member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = features.dri_member_id
  )
UNION ALL
SELECT 
  'Cleanup verification' as info,
  'team_members orphaned count' as table_name,
  COUNT(*) as remaining_orphaned
FROM team_members
WHERE member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = team_members.member_id
  )
UNION ALL
SELECT 
  'Cleanup verification' as info,
  'activity_log orphaned count' as table_name,
  COUNT(*) as remaining_orphaned
FROM activity_log
WHERE member_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m 
    WHERE m.user_id = activity_log.member_id
  );

-- STEP 11: Summary
SELECT 
  'Migration Summary' as info,
  'Foreign key constraints updated to allow NULL values' as status,
  'Orphaned references cleaned up' as note,
  (SELECT COUNT(*) FROM orphaned_references_backup) as records_cleaned,
  'Backup created as orphaned_references_backup' as backup_info; 