-- Schema Creation Script
-- This script creates all tables and functions in the correct order
--

-- Functions
--
\i functions/create_member_from_auth_user_uuid__text__text.sql

-- Tables
--
\i tables/activity_log.sql
\i tables/member_release_state.sql
\i tables/release_teams.sql
\i tables/sys_roles.sql
\i tables/targets.sql
\i tables/team_members.sql
\i tables/06_project_user_map.sql
\i tables/features.sql
\i tables/teams.sql
\i tables/members.sql
\i tables/releases.sql
\i tables/11_projects.sql

