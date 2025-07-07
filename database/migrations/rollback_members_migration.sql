-- Rollback Script: Revert members migration back to users table
-- ONLY RUN THIS IF YOU NEED TO ROLLBACK THE MIGRATION
-- This will restore the original users table structure

-- STEP 1: Drop new tables and columns
DROP TABLE IF EXISTS member_release_state CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- STEP 2: Remove new columns from existing tables
ALTER TABLE features DROP COLUMN IF EXISTS dri_member_id;
ALTER TABLE activity_log DROP COLUMN IF EXISTS member_id;

-- STEP 3: Restore original RLS policies (if they were dropped)
-- Note: You may need to recreate these based on your original schema

-- STEP 4: Verify rollback
SELECT 
  'Rollback Summary' as status,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM team_users) as total_team_userships,
  (SELECT COUNT(*) FROM user_release_state) as total_user_release_states;

-- STEP 5: Show that original tables are restored
SELECT 
  'Original Users Table' as table_name,
  id,
  email,
  full_name,
  role
FROM users
LIMIT 5; 