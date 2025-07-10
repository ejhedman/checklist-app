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
  state: string;
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
        .not('state', 'in', '(deployed,cancelled)')
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
        .limit(7);
      
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
      const pastDueReleases = releases?.filter((r: any) => r.state === 'past_due').length || 0;

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

      // Get releases where user is a team member (needs to signal ready)
      let teamMemberQuery = this.supabase
        .from('releases')
        .select(`
          id,
          name,
          target_date,
          state,
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
        .not('state', 'in', '(deployed,cancelled)')
        .eq('release_teams.team.team_members.member_id', member.id)
        .order('target_date', { ascending: true })
        .limit(10);
      
      if (projectIds.length > 0) {
        teamMemberQuery = teamMemberQuery.in('project_id', projectIds);
      }
      
      const { data: teamMemberReleases, error: teamError } = await teamMemberQuery;

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

      // Get features where user is DRI
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
            state,
            project_id,
            projects(name)
          )
        `)
        .eq('dri_member_id', member.id)
        .eq('releases.is_archived', false)
        .not('releases.state', 'in', '(deployed,cancelled)')
        .limit(10);
      
      if (projectIds.length > 0) {
        driQuery = driQuery.in('project_id', projectIds);
      }
      
      const { data: driFeatures, error: driError } = await driQuery;

      // Combine and sort by target date
      const milestones: Milestone[] = [];
      
      // Add team member releases
      teamMemberReleases?.forEach((release: any) => {
        const readyState = memberReadyStates.find((rs: any) => rs.release_id === release.id);
        milestones.push({
          ...release,
          is_ready: readyState?.is_ready || false,
        });
      });

      // Add DRI features
      driFeatures?.forEach((feature: any) => {
        milestones.push({
          id: feature.id,
          name: feature.name,
          target_date: feature.releases.target_date,
          state: feature.releases.state,
          project_id: feature.releases.project_id,
          projects: feature.releases.projects,
          is_ready: feature.is_ready,
        });
      });

      // Sort by target date
      return milestones.sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());
    } catch (error) {
      console.error("Error getting user milestones:", error);
      throw error;
    }
  }
} 