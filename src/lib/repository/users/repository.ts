import { createClient } from '@/lib/supabase';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface User {
  id: string;
  email: string;
  full_name?: string;
  nickname?: string;
  role?: string;
  project_count?: number;
}

export class UsersRepository {
  private supabase: SupabaseClient;
  private adminSupabase: ReturnType<typeof createSupabaseClient<Database>>;

  constructor() {
    this.supabase = createClient();
    // Create admin client with service role key for admin operations
    this.adminSupabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Get all users with roles and project counts
  async getUsers() {
    // Fetch all users from Supabase auth using admin client
    const { data: authUsers, error: authError } = await this.adminSupabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    // Fetch user roles from sys_roles table
    const { data: userRoles, error: rolesError } = await this.supabase
      .from('sys_roles')
      .select('user_id, sys_role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw rolesError;
    }

    // Fetch project counts for each user
    const { data: projectCounts, error: projectError } = await this.supabase
      .from('members')
      .select('user_id')
      .not('user_id', 'is', null);

    if (projectError) {
      console.error('Error fetching project counts:', projectError);
      throw projectError;
    }

    // Create a map of user_id to role for quick lookup
    const roleMap = new Map();
    userRoles?.forEach(userRole => {
      roleMap.set(userRole.user_id, userRole.sys_role);
    });

    // Create a map of user_id to project count for quick lookup
    const projectCountMap = new Map();
    projectCounts?.forEach(project => {
      const currentCount = projectCountMap.get(project.user_id) || 0;
      projectCountMap.set(project.user_id, currentCount + 1);
    });

    // Combine auth users with roles and project counts
    const users = authUsers.users.map(user => ({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || '',
      nickname: user.user_metadata?.nickname || '',
      role: roleMap.get(user.id) || 'user',
      project_count: projectCountMap.get(user.id) || 0,
    }));

    return users;
  }

  // Get user by ID
  async getUserById(userId: string) {
    // Get auth user using admin client
    const { data: authUser, error: authError } = await this.adminSupabase.auth.admin.getUserById(userId);

    if (authError) {
      console.error('Error fetching auth user:', authError);
      throw authError;
    }

    if (!authUser.user) {
      throw new Error('User not found');
    }

    // Get user role
    const { data: userRole, error: roleError } = await this.supabase
      .from('sys_roles')
      .select('sys_role')
      .eq('user_id', userId)
      .single();

    if (roleError && roleError.code !== 'PGRST116') {
      console.error('Error fetching user role:', roleError);
      throw roleError;
    }

    return {
      id: authUser.user.id,
      email: authUser.user.email || '',
      full_name: authUser.user.user_metadata?.full_name || '',
      nickname: authUser.user.user_metadata?.nickname || '',
      role: userRole?.sys_role || 'user',
    };
  }

  // Create user
  async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    nickname?: string;
    role?: string;
  }) {
    // Create user in Supabase Auth using admin client
    const { data: authData, error: authError } = await this.adminSupabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: userData.full_name,
        nickname: userData.nickname || null,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Add user role
    const { error: roleError } = await this.supabase
      .from('sys_roles')
      .insert({
        user_id: authData.user.id,
        sys_role: userData.role || 'user',
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      throw roleError;
    }

    return authData.user;
  }

  // Update user
  async updateUser(userId: string, updateData: {
    email?: string;
    full_name?: string;
    nickname?: string;
    role?: string;
  }) {
    // Update auth user using admin client
    const { error: authError } = await this.adminSupabase.auth.admin.updateUserById(userId, {
      email: updateData.email,
      user_metadata: {
        full_name: updateData.full_name,
        nickname: updateData.nickname,
      },
    });

    if (authError) {
      console.error('Error updating auth user:', authError);
      throw authError;
    }

    // Update user role if provided
    if (updateData.role) {
      const { error: roleError } = await this.supabase
        .from('sys_roles')
        .upsert({
          user_id: userId,
          sys_role: updateData.role,
        });

      if (roleError) {
        console.error('Error updating user role:', roleError);
        throw roleError;
      }
    }
  }

  // Delete user
  async deleteUser(userId: string) {
    // Delete user from auth using admin client
    const { error: authError } = await this.adminSupabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      throw authError;
    }

    // Delete user role
    const { error: roleError } = await this.supabase
      .from('sys_roles')
      .delete()
      .eq('user_id', userId);

    if (roleError) {
      console.error('Error deleting user role:', roleError);
      // Don't throw error for role deletion failure
    }
  }

  // Search auth users
  async searchAuthUsers(email?: string, projectId?: string) {
    // Search for auth users by email using admin client
    const { data: authUsers, error: authError } = await this.adminSupabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw authError;
    }

    // Get existing members for this project to exclude them
    const { data: existingMembers, error: membersError } = await this.supabase
      .from('members')
      .select('user_id')
      .eq('project_id', projectId);

    if (membersError) {
      console.error('Error fetching existing members:', membersError);
      throw membersError;
    }

    // Create a set of existing member user IDs for quick lookup
    const existingMemberIds = new Set(existingMembers?.map(m => m.user_id) || []);

    // Filter and transform users
    let filteredUsers = authUsers.users.filter(user => !existingMemberIds.has(user.id));

    if (email) {
      filteredUsers = filteredUsers.filter(user => 
        user.email?.toLowerCase().includes(email.toLowerCase())
      );
    }

    return filteredUsers.map(user => ({
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || '',
      nickname: user.user_metadata?.nickname || '',
    }));
  }

  // Bootstrap user roles for users that don't have them
  async bootstrapUserRoles(authUsers: any[]) {
    // Fetch existing user roles to avoid duplicates
    const { data: existingRoles, error: rolesError } = await this.supabase
      .from('sys_roles')
      .select('user_id');

    if (rolesError) {
      console.error('Error fetching existing roles:', rolesError);
      throw rolesError;
    }

    // Create a set of user IDs that already have roles
    const existingUserIds = new Set(existingRoles?.map(role => role.user_id) || []);

    // Filter out users that already have roles
    const usersNeedingRoles = authUsers.filter(user => !existingUserIds.has(user.id));

    if (usersNeedingRoles.length === 0) {
      return {
        usersProcessed: 0,
        usersWithRoles: existingUserIds.size
      };
    }

    // Prepare role records for users that don't have them
    const roleRecords = usersNeedingRoles.map(user => ({
      user_id: user.id,
      sys_role: 'user' // Default role
    }));

    // Insert the role records
    const { error: insertError } = await this.supabase
      .from('sys_roles')
      .insert(roleRecords);

    if (insertError) {
      console.error('Error inserting user roles:', insertError);
      throw insertError;
    }

    return {
      usersProcessed: usersNeedingRoles.length,
      usersWithRoles: existingUserIds.size + usersNeedingRoles.length
    };
  }

  // Get user roles status
  async getUserRolesStatus() {
    // Fetch existing user roles
    const { data: existingRoles, error: rolesError } = await this.supabase
      .from('sys_roles')
      .select('user_id, sys_role');

    if (rolesError) {
      console.error('Error fetching existing roles:', rolesError);
      throw rolesError;
    }

    // Count users with and without roles
    const usersWithRoles = existingRoles?.length || 0;
    const usersWithoutRoles = 0; // This would need to be calculated with total auth users

    return {
      usersWithRoles,
      usersWithoutRoles
    };
  }
} 