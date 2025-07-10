import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface Project {
  id: string;
  name: string;
  created_at: string;
  is_manage_members: boolean;
  is_manage_features: boolean;
  users: {
    id: string;
    email: string;
    full_name: string;
  }[];
}

export class ProjectsRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Get all projects
  async getProjects() {
    const { data, error } = await this.supabase
      .from("projects")
      .select(`
        id,
        name,
        created_at,
        is_manage_members,
        is_manage_features,
        members(
          user_id,
          email,
          full_name
        )
      `)
      .order("name");

    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }

    // Transform the data to flatten the user structure
    const transformedData = data?.map(project => ({
      id: project.id,
      name: project.name,
      created_at: project.created_at,
      is_manage_members: project.is_manage_members,
      is_manage_features: project.is_manage_features,
      users: project.members?.map((member: any) => ({
        id: member.user_id,
        email: member.email,
        full_name: member.full_name
      })) || []
    })) || [];
    
    return transformedData;
  }

  // Create project
  async createProject(projectData: {
    name: string;
    is_manage_members: boolean;
    is_manage_features: boolean;
  }) {
    const { error } = await this.supabase
      .from("projects")
      .insert({
        name: projectData.name,
        is_manage_members: projectData.is_manage_members,
        is_manage_features: projectData.is_manage_features,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }

  // Update project
  async updateProject(projectId: string, updateData: {
    name?: string;
    is_manage_members?: boolean;
    is_manage_features?: boolean;
  }) {
    const { error } = await this.supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  // Delete project
  async deleteProject(projectId: string) {
    const { error } = await this.supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }

  // Check project name uniqueness
  async checkProjectNameUniqueness(name: string, excludeId?: string) {
    let query = this.supabase
      .from("projects")
      .select("id, name")
      .eq("name", name);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking project name uniqueness:", error);
      throw error;
    }

    return data && data.length > 0;
  }

  // Get project by ID
  async getProjectById(projectId: string) {
    const { data, error } = await this.supabase
      .from("projects")
      .select(`
        id,
        name,
        created_at,
        is_manage_members,
        is_manage_features
      `)
      .eq("id", projectId)
      .single();

    if (error) {
      console.error("Error fetching project by ID:", error);
      throw error;
    }

    return data;
  }
} 