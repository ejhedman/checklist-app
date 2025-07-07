-- Fix All Foreign Key Relationships
-- This script updates all tables to use the correct foreign key relationships after the users->members migration

-- STEP 1: Check current foreign key constraints
SELECT 
  'Current Foreign Keys' as info,
  kcu.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND (ccu.table_name = 'users' OR kcu.column_name LIKE '%user_id%');

-- STEP 2: Fix activity_log table
-- Add member_id column if it doesn't exist
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS member_id uuid references members(member_id) on delete set null;

-- Update existing activity_log records to use member_id
UPDATE activity_log
SET member_id = m.member_id
FROM members m
WHERE activity_log.user_id = m.id
  AND activity_log.member_id IS NULL;

-- STEP 3: Fix features table (dri_user_id -> dri_member_id)
-- Add dri_member_id column if it doesn't exist
ALTER TABLE features ADD COLUMN IF NOT EXISTS dri_member_id uuid references members(member_id) on delete set null;

-- Update existing features records to use dri_member_id
UPDATE features
SET dri_member_id = m.member_id
FROM members m
WHERE features.dri_user_id = m.id
  AND features.dri_member_id IS NULL;

-- STEP 4: Update RLS policies for activity_log
DROP POLICY IF EXISTS "Users can insert activity log" ON activity_log;
CREATE POLICY "Members can insert activity log" ON activity_log
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view activity log" ON activity_log;
CREATE POLICY "Members can view activity log" ON activity_log
FOR SELECT USING (auth.role() = 'authenticated');

-- STEP 5: Verify the fixes
SELECT 
  'Activity Log Fix Status' as check_type,
  (SELECT COUNT(*) FROM activity_log) as total_activity_logs,
  (SELECT COUNT(*) FROM activity_log WHERE member_id IS NOT NULL) as activity_logs_with_member,
  (SELECT COUNT(*) FROM activity_log WHERE user_id IS NOT NULL) as activity_logs_with_user;

SELECT 
  'Features Fix Status' as check_type,
  (SELECT COUNT(*) FROM features) as total_features,
  (SELECT COUNT(*) FROM features WHERE dri_member_id IS NOT NULL) as features_with_dri_member,
  (SELECT COUNT(*) FROM features WHERE dri_user_id IS NOT NULL) as features_with_dri_user;

-- STEP 6: Show sample of updated records
SELECT 
  'Sample Activity Log Records' as info,
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
LIMIT 3;

SELECT 
  'Sample Features Records' as info,
  id,
  name,
  dri_member_id,
  dri_user_id,
  is_ready
FROM features 
ORDER BY created_at DESC 
LIMIT 3;

-- STEP 7: Optional - Remove old columns (uncomment if you want to clean up)
-- ALTER TABLE activity_log DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE features DROP COLUMN IF EXISTS dri_user_id; 