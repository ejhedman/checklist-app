-- Fix Activity Log Foreign Key Relationships
-- This script updates the activity_log table to use the correct foreign key relationships

-- STEP 1: Check current activity_log table structure
SELECT 
  'Current Activity Log Structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'activity_log' 
ORDER BY ordinal_position;

-- STEP 2: Add member_id column if it doesn't exist
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS member_id uuid references members(member_id) on delete set null;

-- STEP 3: Update existing activity_log records to use member_id
UPDATE activity_log
SET member_id = m.member_id
FROM members m
WHERE activity_log.user_id = m.id
  AND activity_log.member_id IS NULL;

-- STEP 4: Update RLS policies for activity_log
DROP POLICY IF EXISTS "Users can insert activity log" ON activity_log;
CREATE POLICY "Members can insert activity log" ON activity_log
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view activity log" ON activity_log;
CREATE POLICY "Members can view activity log" ON activity_log
FOR SELECT USING (auth.role() = 'authenticated');

-- STEP 5: Remove the old user_id column (optional - uncomment if you want to remove it)
-- ALTER TABLE activity_log DROP COLUMN IF EXISTS user_id;

-- STEP 6: Verify the fix
SELECT 
  'Activity Log Fix Complete' as status,
  (SELECT COUNT(*) FROM activity_log) as total_activity_logs,
  (SELECT COUNT(*) FROM activity_log WHERE member_id IS NOT NULL) as activity_logs_with_member,
  (SELECT COUNT(*) FROM activity_log WHERE user_id IS NOT NULL) as activity_logs_with_user;

-- STEP 7: Show sample of updated records
SELECT 
  'Sample Updated Records' as info,
  id,
  release_id,
  feature_id,
  team_id,
  member_id,
  user_id,
  activity_type,
  created_at
FROM activity_log 
ORDER BY created_at DESC 
LIMIT 5; 