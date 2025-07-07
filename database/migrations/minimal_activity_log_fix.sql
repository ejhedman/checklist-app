-- Minimal Fix for Activity Log Foreign Key Issue
-- This script only fixes the essential data structure without touching policies

-- STEP 1: Add member_id column if it doesn't exist
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS member_id uuid references members(member_id) on delete set null;

-- STEP 2: Update existing activity_log records to use member_id
UPDATE activity_log
SET member_id = m.member_id
FROM members m
WHERE activity_log.user_id = m.id
  AND activity_log.member_id IS NULL;

-- STEP 3: Verify the fix
SELECT 
  'Activity Log Fix Complete' as status,
  (SELECT COUNT(*) FROM activity_log) as total_activity_logs,
  (SELECT COUNT(*) FROM activity_log WHERE member_id IS NOT NULL) as activity_logs_with_member;

-- STEP 4: Show sample of updated records
SELECT 
  'Sample Records' as info,
  id,
  release_id,
  feature_id,
  team_id,
  member_id,
  activity_type,
  created_at
FROM activity_log 
ORDER BY created_at DESC 
LIMIT 5; 