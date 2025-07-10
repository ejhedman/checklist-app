import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface Feature {
  id: string;
  name: string;
  description: string | null;
  jira_ticket: string | null;
  is_platform: boolean;
  is_config: boolean;
  is_ready: boolean;
  comments: string | null;
  dri_member_id: string | null;
  release_id: string;
  dri_member?: {
    id: string;
    full_name: string;
    email: string;
    nickname: string | null;
  };
}

export class FeaturesRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Create feature
  async createFeature(featureData: {
    name: string;
    description?: string | null;
    jira_ticket?: string | null;
    is_platform: boolean;
    is_config: boolean;
    dri_member_id?: string | null;
    release_id: string;
  }) {
    const { data, error } = await this.supabase
      .from("features")
      .insert({
        name: featureData.name,
        description: featureData.description || null,
        jira_ticket: featureData.jira_ticket || null,
        is_platform: featureData.is_platform,
        is_config: featureData.is_config,
        dri_member_id: featureData.dri_member_id || null,
        release_id: featureData.release_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating feature:", error);
      throw error;
    }

    return data;
  }

  // Update feature
  async updateFeature(featureId: string, updateData: {
    name?: string;
    description?: string | null;
    jira_ticket?: string | null;
    is_platform?: boolean;
    is_config?: boolean;
    is_ready?: boolean;
    comments?: string | null;
    dri_member_id?: string | null;
  }) {
    const { error } = await this.supabase
      .from("features")
      .update(updateData)
      .eq("id", featureId);

    if (error) {
      console.error("Error updating feature:", error);
      throw error;
    }
  }

  // Delete feature
  async deleteFeature(featureId: string) {
    const { error } = await this.supabase
      .from("features")
      .delete()
      .eq("id", featureId);

    if (error) {
      console.error("Error deleting feature:", error);
      throw error;
    }
  }

  // Get features for release
  async getFeaturesForRelease(releaseId: string) {
    const { data, error } = await this.supabase
      .from("features")
      .select(`
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
      `)
      .eq("release_id", releaseId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching features for release:", error);
      throw error;
    }

    return data || [];
  }

  // Get features where user is DRI
  async getFeaturesByDRI(memberId: string, projectIds: string[]) {
    let query = this.supabase
      .from('features')
      .select(`
        id,
        name,
        is_ready,
        release_id,
        releases!inner (
          id,
          name,
          target_date,
          state,
          project_id,
          projects(name)
        ).order('target_date', { ascending: true })
      `)
      .eq('dri_member_id', memberId)
      .eq('releases.is_archived', false)
      .not('releases.state', 'in', '(deployed,cancelled)')
      .limit(10);
    
    if (projectIds.length > 0) {
      query = query.in('project_id', projectIds);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching features by DRI:", error);
      throw error;
    }

    return data || [];
  }

  // Log feature activity
  async logFeatureActivity(activityData: {
    action: string;
    record_id: string;
    project_id: string;
    member_id?: string;
    details?: any;
  }) {
    const { error } = await this.supabase
      .from("activity_log")
      .insert({
        action: activityData.action,
        table_name: 'features',
        record_id: activityData.record_id,
        project_id: activityData.project_id,
        member_id: activityData.member_id,
        details: activityData.details,
      });

    if (error) {
      console.error("Error logging feature activity:", error);
      // Don't throw error for activity logging failures
    }
  }
} 