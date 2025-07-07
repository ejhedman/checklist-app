-- Migration: Remove all RLS policies and allow open access for authenticated users

-- List of tables to update (add/remove as needed)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'members',
    'team_members',
    'member_release_state',
    'releases',
    'release_teams',
    'features',
    'activity_log',
    'teams'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Members can manage release state" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can update their own release state" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can insert their own release state" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can view their release state" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can view all members" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can insert new members" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can update own profile" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can delete own profile" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can manage team memberships" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can view team memberships" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can view releases for their teams" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can insert activity log" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Members can view activity log" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage features" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage releases" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage release state" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage own release state" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can view all users" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert new users" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update own profile" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete own profile" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can view all teams" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert teams" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update teams" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete teams" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can view team memberships" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage team memberships" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can view releases for their teams" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage releases" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage release teams" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage features" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage release state" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage own release state" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert activity log" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can view activity log" ON %I', tbl);
  END LOOP;
END $$;

-- Add permissive policies for all tables
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'members',
    'team_members',
    'member_release_state',
    'releases',
    'release_teams',
    'features',
    'activity_log',
    'teams'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "Allow all authenticated users full access" ON %I FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'')', tbl);
  END LOOP;
END $$; 