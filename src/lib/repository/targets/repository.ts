import { createClient } from '@/lib/supabase';
// import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface Target {
  id: string;
  short_name: string;
  name: string;
  is_live: boolean;
  created_at: string;
}

export class TargetsRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Get all targets for a project
  async getTargets(projectId: string) {
    const { data, error } = await this.supabase
      .from("targets")
      .select(`
        id,
        short_name,
        name,
        is_live,
        created_at
      `)
      .eq('project_id', projectId)
      .order("name");

    if (error) {
      console.error("Error fetching targets:", error);
      throw error;
    }

    return data || [];
  }

  // Create target
  async createTarget(targetData: {
    short_name: string;
    name: string;
    is_live: boolean;
    project_id: string;
  }) {
    const { data, error } = await this.supabase
      .from("targets")
      .insert({
        short_name: targetData.short_name,
        name: targetData.name,
        is_live: targetData.is_live,
        project_id: targetData.project_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating target:", error);
      throw error;
    }

    return data;
  }

  // Update target
  async updateTarget(targetId: string, updateData: {
    short_name?: string;
    name?: string;
    is_live?: boolean;
  }) {
    const { error } = await this.supabase
      .from("targets")
      .update(updateData)
      .eq("id", targetId);

    if (error) {
      console.error("Error updating target:", error);
      throw error;
    }
  }

  // Delete target
  async deleteTarget(targetId: string) {
    const { error } = await this.supabase
      .from("targets")
      .delete()
      .eq("id", targetId);

    if (error) {
      console.error("Error deleting target:", error);
      throw error;
    }
  }

  // Check target name uniqueness
  async checkTargetNameUniqueness(name: string, projectId: string, excludeId?: string) {
    let query = this.supabase
      .from("targets")
      .select("id, name")
      .eq("name", name)
      .eq("project_id", projectId);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking target name uniqueness:", error);
      throw error;
    }

    return data && data.length > 0;
  }

  // Check target short name uniqueness
  async checkTargetShortNameUniqueness(shortName: string, projectId: string, excludeId?: string) {
    let query = this.supabase
      .from("targets")
      .select("id, short_name")
      .eq("short_name", shortName)
      .eq("project_id", projectId);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking target short name uniqueness:", error);
      throw error;
    }

    return data && data.length > 0;
  }
} 