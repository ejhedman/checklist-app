-- Migration: Rename users table to members and add member_id field
-- This script will rename the users table to members and update all references
-- Run this in your Supabase SQL editor

-- STEP 1: Create the new members table with member_id field
CREATE TABLE IF NOT EXISTS members (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  nickname text,
  role text not null default 'user' check (role in ('user','release_manager','admin','superuser')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- STEP 2: Copy data from users table to members table
INSERT INTO members (id, member_id, email, full_name, nickname, role, created_at, updated_at)
SELECT 
  id,
  gen_random_uuid() as member_id,
  email,
  full_name,
  nickname,
  role,
  created_at,
  updated_at
FROM users;

-- STEP 3: Create new foreign key tables with member_id references

-- Create new team_members table (replacing team_users)
CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid not null references teams(id) on delete cascade,
  member_id uuid not null references members(member_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, member_id)
);

-- Copy data from team_users to team_members
INSERT INTO team_members (team_id, member_id, created_at, updated_at)
SELECT 
  tu.team_id,
  m.member_id,
  tu.created_at,
  tu.updated_at
FROM team_users tu
JOIN members m ON tu.user_id = m.id;

-- Create new member_release_state table (replacing user_release_state)
CREATE TABLE IF NOT EXISTS member_release_state (
  release_id uuid not null references releases(id) on delete cascade,
  member_id uuid not null references members(member_id) on delete cascade,
  is_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (release_id, member_id)
);

-- Copy data from user_release_state to member_release_state
INSERT INTO member_release_state (release_id, member_id, is_ready, created_at, updated_at)
SELECT 
  urs.release_id,
  m.member_id,
  urs.is_ready,
  urs.created_at,
  urs.updated_at
FROM user_release_state urs
JOIN members m ON urs.user_id = m.id;

-- STEP 4: Update features table to use member_id
-- First, add the new column
ALTER TABLE features ADD COLUMN dri_member_id uuid references members(member_id) on delete set null;

-- Update the new column with data
UPDATE features 
SET dri_member_id = m.member_id
FROM members m 
WHERE features.dri_user_id = m.id;

-- STEP 5: Update activity_log table to use member_id
-- First, add the new column
ALTER TABLE activity_log ADD COLUMN member_id uuid references members(member_id) on delete set null;

-- Update the new column with data
UPDATE activity_log 
SET member_id = m.member_id
FROM members m 
WHERE activity_log.user_id = m.id;

-- STEP 6: Create triggers for the new tables
CREATE TRIGGER set_members_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_team_members_updated_at BEFORE UPDATE ON team_members
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_member_release_state_updated_at BEFORE UPDATE ON member_release_state
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- STEP 7: Enable RLS on new tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_release_state ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS policies for members table
-- Allow authenticated users to insert new members (for registration)
CREATE POLICY "Members can insert new members" ON members
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow members to view all members (for member listing)
CREATE POLICY "Members can view all members" ON members
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow members to update their own profile
CREATE POLICY "Members can update own profile" ON members
FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow members to delete their own profile
CREATE POLICY "Members can delete own profile" ON members
FOR DELETE USING (auth.uid()::text = id::text);

-- STEP 9: Create RLS policies for team_members table
-- Allow authenticated users to view team memberships
CREATE POLICY "Members can view team memberships" ON team_members
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage team memberships
CREATE POLICY "Members can manage team memberships" ON team_members
FOR ALL USING (auth.role() = 'authenticated');

-- STEP 10: Create RLS policies for member_release_state table
-- Allow members to manage release state for releases they have access to
CREATE POLICY "Members can manage release state" ON member_release_state
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM release_teams rt
    JOIN team_members tm ON tm.team_id = rt.team_id
    WHERE rt.release_id = member_release_state.release_id AND tm.member_id = (
      SELECT member_id FROM members WHERE id = auth.uid()
    )
  )
);

-- STEP 11: Update releases RLS policy to use member_id
DROP POLICY IF EXISTS "Users can view releases for their teams" ON releases;
CREATE POLICY "Members can view releases for their teams" ON releases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM release_teams rt
    JOIN team_members tm ON tm.team_id = rt.team_id
    WHERE rt.release_id = id AND tm.member_id = (
      SELECT member_id FROM members WHERE id = auth.uid()
    )
  )
);

-- STEP 12: Update activity_log RLS policy
DROP POLICY IF EXISTS "Users can insert activity log" ON activity_log;
CREATE POLICY "Members can insert activity log" ON activity_log
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view activity log" ON activity_log;
CREATE POLICY "Members can view activity log" ON activity_log
FOR SELECT USING (auth.role() = 'authenticated');

-- STEP 13: Drop old tables and columns (after verifying data migration)
-- Drop old foreign key columns
ALTER TABLE features DROP COLUMN IF EXISTS dri_user_id;
ALTER TABLE activity_log DROP COLUMN IF EXISTS user_id;

-- Drop old tables
DROP TABLE IF EXISTS user_release_state CASCADE;
DROP TABLE IF EXISTS team_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- STEP 14: Rename new tables to final names (optional - if you want to keep the old names)
-- ALTER TABLE team_members RENAME TO team_users;
-- ALTER TABLE member_release_state RENAME TO user_release_state;

-- STEP 15: Verify the migration
SELECT 
  'Migration Summary' as status,
  (SELECT COUNT(*) FROM members) as total_members,
  (SELECT COUNT(*) FROM team_members) as total_team_memberships,
  (SELECT COUNT(*) FROM member_release_state) as total_member_release_states,
  (SELECT COUNT(*) FROM features WHERE dri_member_id IS NOT NULL) as features_with_dri,
  (SELECT COUNT(*) FROM activity_log WHERE member_id IS NOT NULL) as activity_logs_with_member;

-- STEP 16: Show sample data to verify migration
SELECT 
  'Sample Members' as table_name,
  id,
  member_id,
  email,
  full_name,
  role
FROM members
LIMIT 5;

SELECT 
  'Sample Team Memberships' as table_name,
  tm.team_id,
  tm.member_id,
  t.name as team_name,
  m.full_name as member_name
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
JOIN members m ON tm.member_id = m.member_id
LIMIT 5; 