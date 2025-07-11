import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface DashboardData {
  totalReleases: number;
  activeTeams: number;
  readyReleases: number;
  pastDueReleases: number;
  upcomingReleases: any[];
  recentActivity: any[];
}

export interface Milestone {
  id: string;
  name: string;
  target_date: string;
  project_id: string;
  projects: {
    name: string;
  };
  is_ready?: boolean;
}

export class HomeRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Get dashboard data
  async getDashboardData(projectIds: string[]): Promise<DashboardData> {
    try {
      // Get releases statistics (filtered by project)
      let releasesQuery = this.supabase
        .from('releases')
        .select('*')
        .eq('is_archived', false);
      
      if (projectIds.length > 0) {
        releasesQuery = releasesQuery.in('project_id', projectIds);
      } else {
        // If no project IDs, return empty result
        return {
          totalReleases: 0,
          activeTeams: 0,
          readyReleases: 0,
          pastDueReleases: 0,
          upcomingReleases: [],
          recentActivity: []
        };
      }
      
      const { data: releases, error: releasesError } = await releasesQuery;
      
      if (releasesError) {
        console.error("Releases fetch error:", releasesError);
      }

      // Get teams count (filtered by project)
      let teamsQuery = this.supabase
        .from('teams')
        .select('*');
      
      if (projectIds.length > 0) {
        teamsQuery = teamsQuery.in('project_id', projectIds);
      }
      
      const { data: teams, error: teamsError } = await teamsQuery;
      
      if (teamsError) {
        console.error("Teams fetch error:", teamsError);
      }

      // Get upcoming releases (not archived, not deployed, not cancelled, filtered by project)
      let upcomingQuery = this.supabase
        .from('releases')
        .select(`
          *,
          projects(name),
          release_teams(
            team_id
          )
        `)
        .eq('is_archived', false)
        .eq('is_deployed', false)
        .eq('is_cancelled', false)
        .order('target_date', { ascending: true })
        .limit(3);
      
      if (projectIds.length > 0) {
        upcomingQuery = upcomingQuery.in('project_id', projectIds);
      }
      
      const { data: upcomingReleases, error: upcomingError } = await upcomingQuery;
      
      if (upcomingError) {
        console.error("Upcoming releases fetch error:", upcomingError);
      }

      // Get recent activity log (filtered by project)
      let activityQuery = this.supabase
        .from('activity_log')
        .select(`*, members(full_name, email, nickname), features(name), teams(name), releases(name)`)
        .order('created_at', { ascending: false })
        .limit(12);
      
      if (projectIds.length > 0) {
        activityQuery = activityQuery.in('project_id', projectIds);
      }
      
      const { data: recentActivity, error: activityError } = await activityQuery;

      if (activityError) {
        console.error("Failed to fetch recent activity:", activityError);
      }

      // Calculate statistics
      const totalReleases = releases?.length || 0;
      const activeTeams = teams?.length || 0;
      const readyReleases = releases?.filter((r: any) => r.is_ready === true).length || 0;
      // Note: pastDueReleases calculation removed since state is now dynamically computed
      const pastDueReleases = 0;

      return {
        totalReleases,
        activeTeams,
        readyReleases,
        pastDueReleases,
        upcomingReleases: upcomingReleases || [],
        recentActivity: recentActivity || []
      };
    } catch (error) {
      console.error("Error getting dashboard data:", error);
      throw error;
    }
  }

  // Get user milestones
  async getUserMilestones(projectIds: string[], userEmail: string): Promise<Milestone[]> {
    try {
      // Get the member record for this user
      const { data: member, error: memberError } = await this.supabase
        .from('members')
        .select('id, full_name, email, project_id')
        .eq('email', userEmail)
        .single();

      if (memberError || !member) {
        return [];
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Get upcoming releases where user is a team member and hasn't marked ready
      let teamMemberQuery = this.supabase
        .from('releases')
        .select(`
          id,
          name,
          target_date,
          project_id,
          projects(name),
          release_teams!inner(
            team:teams!inner(
              team_members!inner(
                member_id
              )
            )
          )
        `)
        .eq('is_archived', false)
        .eq('is_deployed', false)
        .eq('is_cancelled', false)
        .gte('target_date', today) // Only future releases
        .eq('release_teams.team.team_members.member_id', member.id)
        .order('target_date', { ascending: true });
      
      if (projectIds.length > 0) {
        teamMemberQuery = teamMemberQuery.in('project_id', projectIds);
      }
      
      const { data: teamMemberReleases, error: teamError } = await teamMemberQuery;

      if (teamError) {
        console.error("Team member releases fetch error:", teamError);
      }

      console.log("Team member releases:", teamMemberReleases);

      // Get member's ready states for these releases
      const releaseIds = teamMemberReleases?.map((r: any) => r.id) || [];
      let memberReadyStates: any[] = [];
      if (releaseIds.length > 0) {
        const { data: readyStates, error: readyError } = await this.supabase
          .from('member_release_state')
          .select('release_id, is_ready')
          .eq('member_id', member.id)
          .in('release_id', releaseIds);
        
        if (!readyError && readyStates) {
          memberReadyStates = readyStates;
        }
      }

      // Get features where user is DRI and feature is not ready
      let driQuery = this.supabase
        .from('features')
        .select(`
          id,
          name,
          is_ready,
          release_id,
          releases (
            id,
            name,
            target_date,
            project_id,
            is_archived,
            is_deployed,
            is_cancelled,
            projects(name)
          )
        `)
        .eq('dri_member_id', member.id)
        .eq('is_ready', false); // Only features that are NOT ready
      
      const { data: driFeatures, error: driError } = await driQuery;

      if (driError) {
        console.error("DRI features fetch error:", driError);
      }

      console.log("Raw DRI features:", driFeatures);

      // Filter DRI features in JavaScript to only include future, non-archived, non-deployed, non-cancelled releases
      const filteredDriFeatures = driFeatures?.filter((feature: any) => {
        if (!feature.releases) return false;
        
        const release = feature.releases;
        const isFuture = new Date(release.target_date) >= new Date(today);
        const isNotArchived = !release.is_archived;
        const isNotDeployed = !release.is_deployed;
        const isNotCancelled = !release.is_cancelled;
        const isInSelectedProject = projectIds.length === 0 || projectIds.includes(release.project_id);
        
        return isFuture && isNotArchived && isNotDeployed && isNotCancelled && isInSelectedProject;
      }) || [];

      console.log("Filtered DRI features:", filteredDriFeatures);

      // Combine and sort by target date
      const milestones: Milestone[] = [];
      
      // Build a set of release IDs for which the user is DRI (to deduplicate)
      const driReleaseIds = new Set(filteredDriFeatures.map((feature: any) => feature.release_id));

      // Add team member releases where user hasn't marked ready, but skip if user is DRI for any feature in that release
      teamMemberReleases?.forEach((release: any) => {
        const readyState = memberReadyStates.find((rs: any) => rs.release_id === release.id);
        // Only include if user hasn't marked ready (is_ready is false or null) and not DRI for any feature in this release
        if ((!readyState || !readyState.is_ready) && !driReleaseIds.has(release.id)) {
          milestones.push({
            ...release,
            is_ready: false,
          });
        }
      });

      // Add DRI features that are not ready
      filteredDriFeatures?.forEach((feature: any) => {
        // Check if feature.releases exists and has the required properties
        if (feature.releases && feature.releases.target_date && feature.releases.project_id) {
          milestones.push({
            id: feature.id,
            name: feature.name,
            target_date: feature.releases.target_date,
            project_id: feature.releases.project_id,
            projects: feature.releases.projects,
            is_ready: feature.is_ready,
          });
        }
      });
      
      // Sort by target date and limit to 10
      return milestones
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .slice(0, 10);
    } catch (error) {
      console.error("Error getting user milestones:", error);
      throw error;
    }
  }

  // Get nag milestones for the next release (all users except the current user)
  async getNagMilestones(projectIds: string[], currentUserEmail: string): Promise<any[]> {
    try {
      if (!projectIds || projectIds.length === 0) return [];
      const projectId = projectIds[0];
      const today = new Date().toISOString().split('T')[0];
      // 1. Get all members for the project (except current user)
      const { data: members, error: membersError } = await this.supabase
        .from('members')
        .select('id, full_name, email, nickname, project_id')
        .eq('project_id', projectId)
        .neq('email', currentUserEmail);
      if (membersError || !members) return [];

      // 2. Get the next release for the project
      const { data: releases, error: releasesError } = await this.supabase
        .from('releases')
        .select('id, name, target_date, project_id, is_archived, is_deployed, is_cancelled, projects(name)')
        .eq('project_id', projectId)
        .eq('is_archived', false)
        .eq('is_deployed', false)
        .eq('is_cancelled', false)
        .gte('target_date', today)
        .order('target_date', { ascending: true })
        .limit(1);
      if (releasesError || !releases || releases.length === 0) return [];
      const nextRelease = releases[0];
      const releaseId = nextRelease.id;

      // 3. Get all team members for this release
      const { data: teamMembers, error: teamMembersError } = await this.supabase
        .from('release_teams')
        .select('team_id, team:teams(id, name, team_members(member_id))')
        .eq('release_id', releaseId);
      if (teamMembersError || !teamMembers) return [];
      // Flatten all member_ids for this release
      const memberIds = teamMembers.flatMap(rt => {
        let teamObj: any = undefined;
        if (Array.isArray(rt.team)) {
          teamObj = rt.team[0];
        } else {
          teamObj = rt.team;
        }
        if (!teamObj || !Array.isArray(teamObj.team_members)) return [];
        return teamObj.team_members.map((tm: any) => tm.member_id);
      });
      // 4. Get member_release_state for this release
      const { data: memberStates, error: memberStatesError } = await this.supabase
        .from('member_release_state')
        .select('member_id, is_ready')
        .eq('release_id', releaseId);
      if (memberStatesError || !memberStates) return [];
      // 5. Get features for this release (with DRI info)
      const { data: features, error: featuresError } = await this.supabase
        .from('features')
        .select('id, name, is_ready, dri_member_id')
        .eq('release_id', releaseId)
        .eq('is_ready', false);
      if (featuresError || !features) return [];

      // 6. Build nag milestones for each member (except current user)
      const milestones: any[] = [];
      for (const member of members) {
        // (a) Team member: not marked ready
        if (memberIds.includes(member.id)) {
          const readyState = memberStates.find(ms => ms.member_id === member.id);
          if (!readyState || !readyState.is_ready) {
            milestones.push({
              id: `release-${releaseId}-member-${member.id}`,
              type: 'team_member',
              title: nextRelease.name,
              target_date: nextRelease.target_date,
              project_name: (nextRelease.projects && typeof nextRelease.projects === 'object' && 'name' in nextRelease.projects)
                ? (nextRelease.projects as { name: string }).name
                : undefined,
              is_ready: false,
              release_id: releaseId,
              member_id: member.id,
              member_name: member.full_name,
              member_email: member.email,
              member_nickname: member.nickname,
            });
          }
        }
        // (b) DRI: feature not ready
        for (const feature of features) {
          if (feature.dri_member_id === member.id) {
            milestones.push({
              id: `feature-${feature.id}-member-${member.id}`,
              type: 'dri',
              title: nextRelease.name,
              dri_feature_name: feature.name,
              target_date: nextRelease.target_date,
              project_name: (nextRelease.projects && typeof nextRelease.projects === 'object' && 'name' in nextRelease.projects)
                ? (nextRelease.projects as { name: string }).name
                : undefined,
              is_ready: false,
              release_id: releaseId,
              release_name: nextRelease.name,
              feature_id: feature.id,
              member_id: member.id,
              member_name: member.full_name,
              member_email: member.email,
              member_nickname: member.nickname,
            });
          }
        }
      }
      // Sort by target date (should all be the same, but for consistency)
      return milestones.sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());
    } catch (error) {
      console.error('Error getting nag milestones:', error);
      return [];
    }
  }
} 