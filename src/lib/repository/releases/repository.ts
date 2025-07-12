import { createClient } from '@/lib/supabase';
// import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface Release {
  id: string;
  name: string;
  target_date: string;
  platform_update: boolean;
  config_update: boolean;
  is_archived: boolean;
  is_ready: boolean;
  is_deployed: boolean;
  is_cancelled: boolean;
  targets: string[];
  created_at: string;
  project_id: string;
  projects?: {
    id: string;
    name: string;
  };
  release_teams?: any[];
  member_release_state?: any[];
  features?: any[];
}

export class ReleasesRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Get releases with optional details
  async getReleases(projectId: string, options: {
    includeDetails?: boolean;
    showArchived?: boolean;
  } = {}) {
    const { includeDetails = false, showArchived = false } = options;

    let baseQuery = `
      id,
      name,
      target_date,
      platform_update,
      config_update,
      is_archived,
      is_ready,
      is_deployed,
      is_cancelled,
      targets,
      created_at,
      project_id,
      projects (
        id,
        name
      )
    `;

    if (includeDetails) {
      baseQuery += `,
      release_teams (
        team:teams (
          id,
          name,
          description,
          team_members (
            member:members (
              id,
              full_name,
              email
            )
          )
        )
      ),
      member_release_state (
        member_id,
        is_ready
      ),
      features (
        id,
        name,
        description,
        jira_ticket,
        is_platform,
        is_config,
        is_ready,
        comments,
        dri_member_id,
        dri_member:members!dri_member_id (
          id,
          full_name,
          email
        )
      )`;
    }

    let query = this.supabase
      .from("releases")
      .select(baseQuery)
      .eq('project_id', projectId)
      .order("target_date", { ascending: true });

    if (!showArchived) {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching releases:", error);
      throw error;
    }

    return this.transformReleaseData(data || []);
  }

  // Get release by name and project
  async getReleaseByName(name: string, projectId: string) {
    const { data, error } = await this.supabase
      .from("releases")
      .select(`
        id,
        name,
        target_date,
        platform_update,
        config_update,
        is_archived,
        targets,
        created_at,
        project_id,
        projects (
          id,
          name
        ),
        release_teams (
          team:teams (
            id,
            name,
            description,
            team_members (
              member:members (
                id,
                full_name,
                email,
                nickname,
                project_id
              )
            )
          )
        ),
        member_release_state (
          member_id,
          is_ready
        ),
        features (
          id,
          name,
          description,
          jira_ticket,
          is_platform,
          is_config,
          is_ready,
          comments,
          dri_member_id,
          dri_member:members!dri_member_id (
            id,
            full_name,
            email,
            nickname
          )
        )
      `)
      .eq("name", name)
      .eq("project_id", projectId)
      .order("created_at", { foreignTable: "features", ascending: true })
      .single();

    if (error) {
      console.error("Error fetching release by name:", error);
      throw error;
    }

    return data;
  }

  // Get release by ID
  async getReleaseById(releaseId: string) {
    const { data, error } = await this.supabase
      .from("releases")
      .select(`
        id,
        name,
        target_date,
        platform_update,
        config_update,
        is_archived,
        is_ready,
        is_deployed,
        is_cancelled,
        targets,
        created_at,
        project_id,
        projects (
          id,
          name
        ),
        release_teams (
          team:teams (
            id,
            name,
            description,
            team_members (
              member:members (
                id,
                full_name,
                email,
                nickname,
                project_id
              )
            )
          )
        ),
        member_release_state (
          member_id,
          is_ready
        ),
        features (
          id,
          name,
          description,
          jira_ticket,
          is_platform,
          is_config,
          is_ready,
          comments,
          dri_member_id,
          dri_member:members!dri_member_id (
            id,
            full_name,
            email,
            nickname
          )
        )
      `)
      .eq("id", releaseId)
      .single();

    if (error) {
      console.error("Error fetching release by ID:", error);
      throw error;
    }

    return data;
  }

  // Create release
  async createRelease(releaseData: {
    name: string;
    target_date: string;
    platform_update?: boolean;
    config_update?: boolean;
    targets: string[];
    project_id: string;
  }) {
    const { data, error } = await this.supabase
      .from("releases")
      .insert({
        name: releaseData.name,
        target_date: releaseData.target_date,
        platform_update: releaseData.platform_update || false,
        config_update: releaseData.config_update || false,
        targets: releaseData.targets,
        project_id: releaseData.project_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating release:", error);
      throw error;
    }

    return data;
  }

  // Update release
  async updateRelease(releaseId: string, updateData: {
    name?: string;
    target_date?: string;
    platform_update?: boolean;
    config_update?: boolean;
    is_archived?: boolean;
    is_ready?: boolean;
    is_deployed?: boolean;
    is_cancelled?: boolean;
    targets?: string[];
  }) {
    const { error } = await this.supabase
      .from("releases")
      .update(updateData)
      .eq("id", releaseId);

    if (error) {
      console.error("Error updating release:", error);
      throw error;
    }
  }

  // Delete release
  async deleteRelease(releaseId: string) {
    const { error } = await this.supabase
      .from("releases")
      .delete()
      .eq("id", releaseId);

    if (error) {
      console.error("Error deleting release:", error);
      throw error;
    }
  }

  // Get release teams
  async getReleaseTeams(releaseId: string) {
    const { data, error } = await this.supabase
      .from("release_teams")
      .select("teams(name)")
      .eq("release_id", releaseId);

    if (error) {
      console.error("Error fetching release teams:", error);
      throw error;
    }

    return data?.map((row: any) => row.teams?.name).filter(Boolean) || [];
  }

  // Add teams to release
  async addTeamsToRelease(releaseId: string, teamIds: string[]) {
    const teamAssignments = teamIds.map((teamId) => ({
      release_id: releaseId,
      team_id: teamId,
    }));

    const { error } = await this.supabase
      .from("release_teams")
      .insert(teamAssignments);

    if (error) {
      console.error("Error adding teams to release:", error);
      throw error;
    }
  }

  // Remove teams from release
  async removeTeamsFromRelease(releaseId: string, teamIds: string[]) {
    const { error } = await this.supabase
      .from("release_teams")
      .delete()
      .eq("release_id", releaseId)
      .in("team_id", teamIds);

    if (error) {
      console.error("Error removing teams from release:", error);
      throw error;
    }
  }

  // Update member release state
  async updateMemberReleaseState(memberId: string, releaseId: string, isReady: boolean) {
    const { error } = await this.supabase
      .from("member_release_state")
      .upsert({
        member_id: memberId,
        release_id: releaseId,
        is_ready: isReady,
      });

    if (error) {
      console.error("Error updating member release state:", error);
      throw error;
    }
  }

  // Get member release states
  async getMemberReleaseStates(memberId: string, releaseIds: string[]) {
    const { data, error } = await this.supabase
      .from("member_release_state")
      .select("release_id, is_ready")
      .eq("member_id", memberId)
      .in("release_id", releaseIds);

    if (error) {
      console.error("Error fetching member release states:", error);
      throw error;
    }

    return data || [];
  }

  // Log activity
  async logActivity(activityData: {
    action: string;
    table_name: string;
    record_id: string;
    project_id: string;
    member_id?: string;
    details?: any;
  }) {
    const { error } = await this.supabase
      .from("activity_log")
      .insert({
        action: activityData.action,
        table_name: activityData.table_name,
        record_id: activityData.record_id,
        project_id: activityData.project_id,
        member_id: activityData.member_id,
        details: activityData.details,
      });

    if (error) {
      console.error("Error logging activity:", error);
      // Don't throw error for activity logging failures
    }
  }

  // Transform release data
  private transformReleaseData(data: any[]): Release[] {
    return data.map((release) => {
      // Convert string values to boolean for platform_update and config_update
      const platformUpdate = typeof release.platform_update === 'string' 
        ? release.platform_update === 'true' 
        : Boolean(release.platform_update);
      
      const configUpdate = typeof release.config_update === 'string' 
        ? release.config_update === 'true' 
        : Boolean(release.config_update);

      // Transform member_release_state to a more usable format
      const memberStates = release.member_release_state || [];
      const memberMap = new Map();
      
      memberStates.forEach((state: any) => {
        memberMap.set(state.member_id, state.is_ready);
      });

      // Get unique members from release teams
      const uniqueMembersMap = new Map();
      release.release_teams?.forEach((rt: any) => {
        rt.team?.team_members?.forEach((tm: any) => {
          const member = tm.member;
          if (member && !uniqueMembersMap.has(member.id)) {
            uniqueMembersMap.set(member.id, {
              ...member,
              is_ready: memberMap.get(member.id) || false,
            });
          }
        });
      });

      const uniqueMembers = Array.from(uniqueMembersMap.values()).map(member => ({
        ...member,
        is_ready: memberMap.get(member.id) || false,
      }));

      return {
        ...release,
        platform_update: platformUpdate,
        config_update: configUpdate,
        allMembers: uniqueMembers,
        readyMembers: uniqueMembers.filter((m: any) => m.is_ready).length,
        totalMembers: uniqueMembers.length,
        readyFeatures: release.features?.filter((f: any) => f.is_ready).length || 0,
        featureCount: release.features?.length || 0,
      };
    });
  }
} 