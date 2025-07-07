-- Test Activity Log Data
-- Run this in your Supabase SQL editor to populate the activity_log table with test data

-- First, let's get some existing data to reference
-- (This assumes you have some releases, users, teams, and features already)

-- Insert test activity log entries
INSERT INTO activity_log (release_id, feature_id, team_id, user_id, activity_type, activity_details, created_at) 
SELECT 
  r.id as release_id,
  NULL as feature_id,
  NULL as team_id,
  u.id as user_id,
  'release_created' as activity_type,
  jsonb_build_object('name', r.name) as activity_details,
  NOW() - INTERVAL '1 hour' as created_at
FROM releases r, users u 
WHERE u.email = 'test@example.com' OR u.email LIKE '%@%'
LIMIT 1;

-- Add a feature added activity
INSERT INTO activity_log (release_id, feature_id, team_id, user_id, activity_type, activity_details, created_at)
SELECT 
  r.id as release_id,
  f.id as feature_id,
  NULL as team_id,
  u.id as user_id,
  'feature_added' as activity_type,
  jsonb_build_object('name', f.name) as activity_details,
  NOW() - INTERVAL '45 minutes' as created_at
FROM releases r, features f, users u
WHERE f.release_id = r.id 
  AND (u.email = 'test@example.com' OR u.email LIKE '%@%')
LIMIT 1;

-- Add a team added activity
INSERT INTO activity_log (release_id, feature_id, team_id, user_id, activity_type, activity_details, created_at)
SELECT 
  r.id as release_id,
  NULL as feature_id,
  t.id as team_id,
  u.id as user_id,
  'team_added' as activity_type,
  '{}'::jsonb as activity_details,
  NOW() - INTERVAL '30 minutes' as created_at
FROM releases r, teams t, users u
WHERE (u.email = 'test@example.com' OR u.email LIKE '%@%')
LIMIT 1;

-- Add a member ready activity
INSERT INTO activity_log (release_id, feature_id, team_id, user_id, activity_type, activity_details, created_at)
SELECT 
  r.id as release_id,
  NULL as feature_id,
  NULL as team_id,
  u.id as user_id,
  'member_ready' as activity_type,
  jsonb_build_object('isReady', true) as activity_details,
  NOW() - INTERVAL '15 minutes' as created_at
FROM releases r, users u
WHERE (u.email = 'test@example.com' OR u.email LIKE '%@%')
LIMIT 1;

-- Add a feature ready activity
INSERT INTO activity_log (release_id, feature_id, team_id, user_id, activity_type, activity_details, created_at)
SELECT 
  r.id as release_id,
  f.id as feature_id,
  NULL as team_id,
  u.id as user_id,
  'feature_ready' as activity_type,
  jsonb_build_object('comments', 'All tests passing, ready for deployment') as activity_details,
  NOW() - INTERVAL '5 minutes' as created_at
FROM releases r, features f, users u
WHERE f.release_id = r.id 
  AND (u.email = 'test@example.com' OR u.email LIKE '%@%')
LIMIT 1;

-- Add a release state change activity
INSERT INTO activity_log (release_id, feature_id, team_id, user_id, activity_type, activity_details, created_at)
SELECT 
  r.id as release_id,
  NULL as feature_id,
  NULL as team_id,
  u.id as user_id,
  'release_state_change' as activity_type,
  jsonb_build_object('oldState', 'pending', 'newState', 'ready') as activity_details,
  NOW() - INTERVAL '2 minutes' as created_at
FROM releases r, users u
WHERE (u.email = 'test@example.com' OR u.email LIKE '%@%')
LIMIT 1; 