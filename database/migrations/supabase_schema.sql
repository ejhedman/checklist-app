-- Release Management Checklist App – Supabase Schema
-- Run this in your Supabase SQL editor

-- 1. USERS
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TEAMS
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. TEAM_USERS (many-to-many)
create table if not exists team_users (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- 4. RELEASES
create table if not exists releases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_date date not null,
  platform_update boolean not null default false,
  config_update boolean not null default false,
  state text not null check (state in ('pending','ready','past_due','complete','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. RELEASE_TEAMS (many-to-many)
create table if not exists release_teams (
  release_id uuid not null references releases(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (release_id, team_id)
);

-- 6. FEATURES
create table if not exists features (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references releases(id) on delete cascade,
  name text not null,
  jira_ticket text,
  description text,
  dri_user_id uuid references users(id) on delete set null,
  is_platform boolean not null default false,
  is_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. USER_RELEASE_STATE
create table if not exists user_release_state (
  release_id uuid not null references releases(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  is_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (release_id, user_id)
);

-- 8. TRIGGERS: updated_at auto-update
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_users_updated_at before update on users
for each row execute procedure set_updated_at();
create trigger set_teams_updated_at before update on teams
for each row execute procedure set_updated_at();
create trigger set_team_users_updated_at before update on team_users
for each row execute procedure set_updated_at();
create trigger set_releases_updated_at before update on releases
for each row execute procedure set_updated_at();
create trigger set_release_teams_updated_at before update on release_teams
for each row execute procedure set_updated_at();
create trigger set_features_updated_at before update on features
for each row execute procedure set_updated_at();
create trigger set_user_release_state_updated_at before update on user_release_state
for each row execute procedure set_updated_at();

-- 9. RLS POLICIES
-- Enable RLS
alter table users enable row level security;
alter table teams enable row level security;
alter table team_users enable row level security;
alter table releases enable row level security;
alter table release_teams enable row level security;
alter table features enable row level security;
alter table user_release_state enable row level security;

-- USERS TABLE POLICIES
-- Allow authenticated users to insert new users (for registration)
create policy "Users can insert new users" on users
for insert with check (auth.role() = 'authenticated');

-- Allow users to view all users (for member listing)
create policy "Users can view all users" on users
for select using (auth.role() = 'authenticated');

-- Allow users to update their own profile
create policy "Users can update own profile" on users
for update using (auth.uid()::text = id::text);

-- Allow users to delete their own profile
create policy "Users can delete own profile" on users
for delete using (auth.uid()::text = id::text);

-- TEAMS TABLE POLICIES
-- Allow authenticated users to view all teams
create policy "Users can view all teams" on teams
for select using (auth.role() = 'authenticated');

-- Allow authenticated users to insert teams
create policy "Users can insert teams" on teams
for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to update teams
create policy "Users can update teams" on teams
for update using (auth.role() = 'authenticated');

-- Allow authenticated users to delete teams
create policy "Users can delete teams" on teams
for delete using (auth.role() = 'authenticated');

-- TEAM_USERS TABLE POLICIES
-- Allow authenticated users to view team memberships
create policy "Users can view team memberships" on team_users
for select using (auth.role() = 'authenticated');

-- Allow authenticated users to manage team memberships
create policy "Users can manage team memberships" on team_users
for all using (auth.role() = 'authenticated');

-- RELEASES TABLE POLICIES
-- Allow users to see releases if they belong to any assigned team
create policy "Users can view releases for their teams" on releases
for select using (
  exists (
    select 1 from release_teams rt
    join team_users tu on tu.team_id = rt.team_id
    where rt.release_id = id and tu.user_id = auth.uid()
  )
);

-- Allow authenticated users to manage releases
create policy "Users can manage releases" on releases
for all using (auth.role() = 'authenticated');

-- RELEASE_TEAMS TABLE POLICIES
-- Allow authenticated users to manage release team assignments
create policy "Users can manage release teams" on release_teams
for all using (auth.role() = 'authenticated');

-- FEATURES TABLE POLICIES
-- Allow authenticated users to manage features
create policy "Users can manage features" on features
for all using (auth.role() = 'authenticated');

-- USER_RELEASE_STATE TABLE POLICIES
-- Allow users to manage release state for releases they have access to
create policy "Users can manage release state" on user_release_state
for all using (
  exists (
    select 1 from release_teams rt
    join team_users tu on tu.team_id = rt.team_id
    where rt.release_id = user_release_state.release_id and tu.user_id = auth.uid()
  )
);

-- 10. ACTIVITY LOG
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  release_id uuid references releases(id) on delete cascade,
  feature_id uuid references features(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  activity_type text not null, -- e.g. 'member_ready', 'feature_ready', 'release_created', etc.
  activity_details jsonb, -- for extra info (optional)
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table activity_log enable row level security;

-- Allow authenticated users to insert activity log entries
create policy "Users can insert activity log" on activity_log
for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to view activity log
create policy "Users can view activity log" on activity_log
for select using (auth.role() = 'authenticated');

-- End of schema 