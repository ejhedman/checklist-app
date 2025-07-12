import { createClient } from '@/lib/supabase';
// import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export class AuthRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Get user projects
  async getUserProjects(userId: string) {
    const { data, error } = await this.supabase
      .from('members')
      .select(`
        project_id,
        projects (
          id,
          name,
          is_manage_members,
          is_manage_features
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user projects:', error);
      return [];
    }

    return data?.map((item: any) => ({
      id: item.projects.id,
      name: item.projects.name,
      is_manage_members: item.projects.is_manage_members,
      is_manage_features: item.projects.is_manage_features
    })) || [];
  }

  // Get user role
  async getUserRole(userId: string) {
    const { data, error } = await this.supabase
      .from('sys_roles')
      .select('sys_role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data?.sys_role || null;
  }

  // Get current member info
  async getCurrentMemberInfo() {
    try {
      // Get the current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError || !user) {
        return null;
      }

      // Get the member record for this user
      const { data: member, error: memberError } = await this.supabase
        .from('members')
        .select('id, member_id, project_id, full_name, email')
        .eq('email', user.email)
        .single();

      if (memberError || !member) {
        return null;
      }

      return member;
    } catch (error) {
      console.error("Error getting current member info:", error);
      return null;
    }
  }

  // Get member by email
  async getMemberByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('members')
      .select('id, member_id, project_id, full_name, email')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching member by email:', error);
      return null;
    }

    return data;
  }
} 