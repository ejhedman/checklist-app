-- Drop Old Users Tables Script
-- This script will drop the old users, team_users, and user_release_state tables
-- ONLY RUN THIS AFTER YOU HAVE VERIFIED THE MIGRATION WAS SUCCESSFUL
-- AND CONFIRMED THAT ALL DATA HAS BEEN PROPERLY MIGRATED TO THE NEW TABLES

-- STEP 1: Verify that new tables exist and have data
SELECT 
  'Verification Before Dropping' as status,
  (SELECT COUNT(*) FROM members) as members_count,
  (SELECT COUNT(*) FROM team_members) as team_members_count,
  (SELECT COUNT(*) FROM member_release_state) as member_release_state_count;

-- STEP 2: Show data comparison (optional - to verify migration was complete)
SELECT 
  'Data Comparison' as comparison_type,
  (SELECT COUNT(*) FROM users) as old_users_count,
  (SELECT COUNT(*) FROM members) as new_members_count,
  (SELECT COUNT(*) FROM team_users) as old_team_users_count,
  (SELECT COUNT(*) FROM team_members) as new_team_members_count,
  (SELECT COUNT(*) FROM user_release_state) as old_user_release_state_count,
  (SELECT COUNT(*) FROM member_release_state) as new_member_release_state_count;

-- STEP 3: Drop the old tables
-- Note: CASCADE will also drop any dependent objects (triggers, policies, etc.)

-- Drop user_release_state table first (it references users)
DROP TABLE IF EXISTS user_release_state CASCADE;

-- Drop team_users table (it references users)
DROP TABLE IF EXISTS team_users CASCADE;

-- Drop users table last
DROP TABLE IF EXISTS users CASCADE;

-- STEP 4: Verify tables have been dropped
SELECT 
  'Verification After Dropping' as status,
  (SELECT COUNT(*) FROM members) as members_count,
  (SELECT COUNT(*) FROM team_members) as team_members_count,
  (SELECT COUNT(*) FROM member_release_state) as member_release_state_count;

-- STEP 5: Show that old tables no longer exist
SELECT 
  'Old Tables Status' as status,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') 
    THEN 'users table still exists' 
    ELSE 'users table dropped successfully' 
  END as users_status,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'team_users') 
    THEN 'team_users table still exists' 
    ELSE 'team_users table dropped successfully' 
  END as team_users_status,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_release_state') 
    THEN 'user_release_state table still exists' 
    ELSE 'user_release_state table dropped successfully' 
  END as user_release_state_status;

-- STEP 6: Show remaining tables in the schema
SELECT 
  'Remaining Tables' as status,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('members', 'teams', 'releases', 'features', 'team_members', 'member_release_state', 'release_teams', 'activity_log', 'targets')
ORDER BY table_name; 