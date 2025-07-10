import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface TransformedTeam {
  id: string;
  name: string;
  description: string | undefined;
  created_at: string;
  member_count: number;
  active_releases: number;
  members: {
    id: string;
    full_name: string;
    email: string;
    nickname: string | undefined;
    member_id: string;
  }[];
}

export class TeamsRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Get all teams for a project
  async getTeams(projectId: string) {
    const { data, error } = await this.supabase
      .from("teams")
      .select(`
        id,
        name,
        description,
        created_at,
        team_members (
          member_id,
          members (
            id,
            full_name,
            email,
            nickname
          )
        ),
        release_teams (
          release_id
        )
      `)
      .eq('project_id', projectId)
      .order("name");

    if (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }

    return this.transformTeamData(data || []);
  }

  // Create team
  async createTeam(teamData: {
    name: string;
    description?: string | null;
    project_id: string;
  }) {
    const { error } = await this.supabase
      .from("teams")
      .insert({
        name: teamData.name,
        description: teamData.description || null,
        project_id: teamData.project_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating team:", error);
      throw error;
    }
  }

  // Update team
  async updateTeam(teamId: string, updateData: {
    name?: string;
    description?: string | null;
  }) {
    const { error } = await this.supabase
      .from("teams")
      .update(updateData)
      .eq("id", teamId);

    if (error) {
      console.error("Error updating team:", error);
      throw error;
    }
  }

  // Delete team
  async deleteTeam(teamId: string) {
    const { error } = await this.supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      console.error("Error deleting team:", error);
      throw error;
    }
  }

  // Get team members
  async getTeamMembers(teamId: string) {
    const { data, error } = await this.supabase
      .from("team_members")
      .select(`
        member_id,
        members (
          id,
          full_name,
          email,
          nickname,
          project_id
        )
      `)
      .eq("team_id", teamId);

    if (error) {
      console.error("Error fetching team members:", error);
      throw error;
    }

    // Transform team members data
    const currentMembers = (data?.map((member) => member.members) || []).flat();
    return currentMembers;
  }

  // Add members to team
  async addMembersToTeam(teamId: string, memberIds: string[], projectId: string) {
    const memberAssignments = memberIds.map((memberId) => ({
      team_id: teamId,
      member_id: memberId,
      project_id: projectId,
    }));
    
    const { error } = await this.supabase
      .from("team_members")
      .insert(memberAssignments);

    if (error) {
      console.error("Error adding members to team:", error);
      throw error;
    }
  }

  // Remove members from team
  async removeMembersFromTeam(teamId: string, memberIds: string[]) {
    const { error } = await this.supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .in("member_id", memberIds);

    if (error) {
      console.error("Error removing members from team:", error);
      throw error;
    }
  }

  // Check team name uniqueness
  async checkTeamNameUniqueness(name: string, projectId: string, excludeId?: string) {
    let query = this.supabase
      .from("teams")
      .select("id, name")
      .eq("name", name)
      .eq("project_id", projectId);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking team name uniqueness:", error);
      throw error;
    }

    return data && data.length > 0;
  }

  // Get teams for release assignment
  async getTeamsForReleaseAssignment(projectId: string) {
    const { data, error } = await this.supabase
      .from("teams")
      .select("id, name, description")
      .eq("project_id", projectId)
      .order("name");

    if (error) {
      console.error("Error fetching teams for release assignment:", error);
      throw error;
    }

    return data || [];
  }

  // Transform team data
  private transformTeamData(data: any[]): TransformedTeam[] {
    return data.map((team) => {
      const members = team.team_members?.map((tm: any) => ({
        ...tm.members,
        nickname: tm.members.nickname || undefined,
        member_id: tm.member_id
      })).filter(Boolean) || [];
      
      return {
        id: team.id,
        name: team.name,
        description: team.description || undefined,
        created_at: team.created_at,
        member_count: members.length,
        active_releases: team.release_teams?.length || 0,
        members: members,
      };
    });
  }
} 