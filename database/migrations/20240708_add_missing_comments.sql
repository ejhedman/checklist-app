-- Migration: Add missing comments to tables and columns
-- Edit the TODOs to provide meaningful descriptions before applying!

-- Table: activity_log
COMMENT ON TABLE public.activity_log IS 'TODO: Add description.';
COMMENT ON COLUMN public.activity_log.id IS 'TODO: Add description.';
COMMENT ON COLUMN public.activity_log.release_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.activity_log.feature_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.activity_log.team_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.activity_log.activity_type IS 'TODO: Add description.';
COMMENT ON COLUMN public.activity_log.activity_details IS 'TODO: Add description.';
COMMENT ON COLUMN public.activity_log.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.activity_log.member_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.activity_log.tenant_id IS 'TODO: Add description.';

-- Table: features
COMMENT ON TABLE public.features IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.id IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.release_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.name IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.jira_ticket IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.description IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.is_platform IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.is_ready IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.updated_at IS 'TODO: Add description.';
-- is_config and comments already have comments
COMMENT ON COLUMN public.features.dri_member_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.features.tenant_id IS 'TODO: Add description.';

-- Table: member_release_state
COMMENT ON TABLE public.member_release_state IS 'TODO: Add description.';
COMMENT ON COLUMN public.member_release_state.release_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.member_release_state.member_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.member_release_state.is_ready IS 'TODO: Add description.';
COMMENT ON COLUMN public.member_release_state.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.member_release_state.updated_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.member_release_state.tenant_id IS 'TODO: Add description.';

-- Table: members
COMMENT ON TABLE public.members IS 'TODO: Add description.';
COMMENT ON COLUMN public.members.id IS 'TODO: Add description.';
COMMENT ON COLUMN public.members.user_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.members.email IS 'TODO: Add description.';
COMMENT ON COLUMN public.members.full_name IS 'TODO: Add description.';
COMMENT ON COLUMN public.members.nickname IS 'TODO: Add description.';
COMMENT ON COLUMN public.members.member_role IS 'TODO: Add description.';
COMMENT ON COLUMN public.members.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.members.updated_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.members.tenant_id IS 'TODO: Add description.';

-- Table: release_teams
COMMENT ON TABLE public.release_teams IS 'TODO: Add description.';
COMMENT ON COLUMN public.release_teams.release_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.release_teams.team_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.release_teams.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.release_teams.updated_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.release_teams.tenant_id IS 'TODO: Add description.';

-- Table: releases
COMMENT ON TABLE public.releases IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.id IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.name IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.target_date IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.platform_update IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.config_update IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.state IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.updated_at IS 'TODO: Add description.';
-- release_notes and targets already have comments
COMMENT ON COLUMN public.releases.release_summary IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.is_archived IS 'TODO: Add description.';
COMMENT ON COLUMN public.releases.tenant_id IS 'TODO: Add description.';

-- Table: sys_roles
COMMENT ON TABLE public.sys_roles IS 'TODO: Add description.';
COMMENT ON COLUMN public.sys_roles.id IS 'TODO: Add description.';
COMMENT ON COLUMN public.sys_roles.user_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.sys_roles.sys_role IS 'TODO: Add description.';
COMMENT ON COLUMN public.sys_roles.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.sys_roles.updated_at IS 'TODO: Add description.';

-- Table: targets
COMMENT ON TABLE public.targets IS 'TODO: Add description.';
COMMENT ON COLUMN public.targets.id IS 'TODO: Add description.';
COMMENT ON COLUMN public.targets.short_name IS 'TODO: Add description.';
COMMENT ON COLUMN public.targets.name IS 'TODO: Add description.';
COMMENT ON COLUMN public.targets.is_live IS 'TODO: Add description.';
COMMENT ON COLUMN public.targets.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.targets.updated_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.targets.tenant_id IS 'TODO: Add description.';

-- Table: team_members
COMMENT ON TABLE public.team_members IS 'TODO: Add description.';
COMMENT ON COLUMN public.team_members.team_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.team_members.member_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.team_members.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.team_members.updated_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.team_members.tenant_id IS 'TODO: Add description.';

-- Table: teams
COMMENT ON TABLE public.teams IS 'TODO: Add description.';
COMMENT ON COLUMN public.teams.id IS 'TODO: Add description.';
COMMENT ON COLUMN public.teams.name IS 'TODO: Add description.';
COMMENT ON COLUMN public.teams.description IS 'TODO: Add description.';
COMMENT ON COLUMN public.teams.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.teams.updated_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.teams.tenant_id IS 'TODO: Add description.';

-- Table: tenant_user_map
COMMENT ON TABLE public.tenant_user_map IS 'TODO: Add description.';
COMMENT ON COLUMN public.tenant_user_map.id IS 'TODO: Add description.';
COMMENT ON COLUMN public.tenant_user_map.tenant_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.tenant_user_map.user_id IS 'TODO: Add description.';
COMMENT ON COLUMN public.tenant_user_map.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.tenant_user_map.updated_at IS 'TODO: Add description.';

-- Table: tenants
COMMENT ON TABLE public.tenants IS 'TODO: Add description.';
COMMENT ON COLUMN public.tenants.id IS 'TODO: Add description.';
COMMENT ON COLUMN public.tenants.name IS 'TODO: Add description.';
COMMENT ON COLUMN public.tenants.created_at IS 'TODO: Add description.';
COMMENT ON COLUMN public.tenants.updated_at IS 'TODO: Add description.'; 