import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface TransformedMember {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  member_role: 'member' | 'release_manager' | 'admin';
  created_at: string;
  teams: string[];
  active_releases: number;
}

export class MembersRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Get all members for a project
  async getMembers(projectId: string) {
    const { data, error } = await this.supabase
      .from("members")
      .select(`
        id,
        full_name,
        email,
        nickname,
        member_role,
        created_at,
        team_members (
          teams (
            name
          )
        )
      `)
      .eq('project_id', projectId)
      .order("full_name");

    if (error) {
      console.error("Error fetching members:", error);
      throw error;
    }

    return this.transformMemberData(data || []);
  }

  // Get members by project with basic info
  async getMembersByProject(projectId: string) {
    const { data, error } = await this.supabase
      .from("members")
      .select(`
        id,
        full_name,
        email,
        nickname,
        member_role,
        created_at
      `)
      .eq('project_id', projectId)
      .order("full_name");

    if (error) {
      console.error("Error fetching members by project:", error);
      throw error;
    }

    return data || [];
  }

  // Get members for team assignment
  async getMembersForTeamAssignment(projectId: string) {
    const { data, error } = await this.supabase
      .from("members")
      .select("id, full_name, email, nickname, project_id")
      .eq("project_id", projectId)
      .order("full_name");

    if (error) {
      console.error("Error fetching members for team assignment:", error);
      throw error;
    }

    return data || [];
  }

  // Get members for feature DRI assignment
  async getMembersForFeatureDRI(projectId: string) {
    const { data, error } = await this.supabase
      .from("members")
      .select("id, full_name, email, nickname")
      .eq("project_id", projectId)
      .order("full_name");

    if (error) {
      console.error("Error fetching members for feature DRI:", error);
      throw error;
    }

    return data || [];
  }

  // Get members for release team assignment
  async getMembersForReleaseTeam(projectId: string) {
    const { data, error } = await this.supabase
      .from("members")
      .select("id, full_name, email, nickname")
      .eq("project_id", projectId)
      .order("full_name");

    if (error) {
      console.error("Error fetching members for release team:", error);
      throw error;
    }

    return data || [];
  }

  // Create member
  async createMember(memberData: {
    id: string;
    user_id: string;
    email: string;
    full_name: string;
    nickname?: string | null;
    role?: string;
    project_id: string;
  }) {
    const { error } = await this.supabase
      .from("members")
      .insert({
        id: memberData.id,
        user_id: memberData.user_id,
        email: memberData.email,
        full_name: memberData.full_name,
        nickname: memberData.nickname || null,
        member_role: memberData.role || 'member',
        project_id: memberData.project_id,
      });

    if (error) {
      console.error("Error creating member:", error);
      throw error;
    }
  }

  // Update member
  async updateMember(memberId: string, updateData: {
    full_name?: string;
    email?: string;
    nickname?: string | null;
    member_role?: string;
  }) {
    const { error } = await this.supabase
      .from("members")
      .update(updateData)
      .eq("id", memberId);

    if (error) {
      console.error("Error updating member:", error);
      throw error;
    }
  }

  // Delete member
  async deleteMember(memberId: string) {
    const { error } = await this.supabase
      .from("members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("Error deleting member:", error);
      throw error;
    }
  }

  // Get existing members for project
  async getExistingMembers(projectId: string) {
    const { data, error } = await this.supabase
      .from('members')
      .select('user_id')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching existing members:', error);
      throw error;
    }

    return data || [];
  }

  // Transform member data
  private transformMemberData(data: any[]): TransformedMember[] {
    return data.map((member) => ({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      nickname: member.nickname,
      member_role: member.member_role,
      created_at: member.created_at,
      teams: member.team_members?.map((tm: any) => tm.teams?.name).filter(Boolean) || [],
      active_releases: 0, // TODO: Calculate this from member_release_state
    }));
  }
} 