import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface CalendarRelease {
  id: string;
  name: string;
  target_date: string;
  state: 'pending' | 'next' | 'past_due' | 'cancelled' | 'deployed';
}

export interface UserInvolvement {
  teamReleaseIds: string[];
  driReleaseIds: string[];
  notReadyReleaseIds: string[];
  involvedReleaseIds: Set<string>;
}

export class CalendarRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Get user involvement in releases
  async getUserInvolvement(userId: string, projectId: string): Promise<UserInvolvement> {
    // 1. Get all team IDs for the user (filtered by project)
    const { data: teamMemberRows, error: teamMemberError } = await this.supabase
      .from("team_members")
      .select("team_id")
      .eq("member_id", userId)
      .eq("project_id", projectId);

    if (teamMemberError) {
      console.error("Error fetching user teams:", teamMemberError);
      throw teamMemberError;
    }

    const userTeamIds = (teamMemberRows ?? []).map(row => row.team_id);

    // 2. Get all release IDs for those teams (filtered by project)
    let teamReleaseIds: string[] = [];
    if (userTeamIds.length > 0) {
      const { data: releaseTeamsRows, error: releaseTeamsError } = await this.supabase
        .from("release_teams")
        .select("release_id")
        .eq("project_id", projectId)
        .in("team_id", userTeamIds);

      if (releaseTeamsError) {
        console.error("Error fetching release teams:", releaseTeamsError);
        throw releaseTeamsError;
      }
      teamReleaseIds = (releaseTeamsRows ?? []).map(row => row.release_id);
    }

    // 3. Get all release IDs where user is DRI for a feature (filtered by project)
    const { data: driFeaturesRows, error: driFeaturesError } = await this.supabase
      .from("features")
      .select("release_id")
      .eq("dri_member_id", userId)
      .eq("project_id", projectId);

    if (driFeaturesError) {
      console.error("Error fetching DRI features:", driFeaturesError);
      throw driFeaturesError;
    }
    const driReleaseIds = (driFeaturesRows ?? []).map(row => row.release_id);

    // 4. Get all release IDs where user is a team member AND is not ready (member_release_state.is_ready = false, filtered by project)
    let notReadyReleaseIds: string[] = [];
    if (teamReleaseIds.length > 0) {
      const { data: notReadyRows, error: notReadyError } = await this.supabase
        .from("member_release_state")
        .select("release_id")
        .eq("member_id", userId)
        .eq("project_id", projectId)
        .eq("is_ready", false)
        .in("release_id", teamReleaseIds);
      if (notReadyError) {
        console.error("Error fetching not ready releases:", notReadyError);
        throw notReadyError;
      }
      notReadyReleaseIds = (notReadyRows ?? []).map(row => row.release_id);
    }

    // 5. Combine all involved release IDs
    const involvedIds = new Set<string>([...driReleaseIds, ...notReadyReleaseIds]);

    return {
      teamReleaseIds,
      driReleaseIds,
      notReadyReleaseIds,
      involvedReleaseIds: involvedIds
    };
  }

  // Get releases for calendar
  async getReleases(projectId: string): Promise<CalendarRelease[]> {
    const { data, error } = await this.supabase
      .from("releases")
      .select("id, name, target_date, state, is_archived, is_cancelled, is_deployed")
      .eq("project_id", projectId)
      .eq("is_archived", false)
      .order("target_date");

    if (error) {
      console.error("Error fetching releases:", error);
      throw error;
    }

    return data || [];
  }

  // Update release target date
  async updateReleaseDate(releaseId: string, newDate: string): Promise<void> {
    const { error } = await this.supabase
      .from("releases")
      .update({ target_date: newDate })
      .eq("id", releaseId);

    if (error) {
      console.error("Database error:", error);
      throw error;
    }
  }

  // Get release by ID
  async getReleaseById(releaseId: string): Promise<CalendarRelease> {
    const { data, error } = await this.supabase
      .from("releases")
      .select("id, name, target_date, state")
      .eq("id", releaseId)
      .single();

    if (error) {
      console.error("Error fetching release:", error);
      throw error;
    }

    return data;
  }

  // Log activity
  async logActivity(activityData: {
    release_id: string;
    member_id: string;
    project_id: string;
    activity_type: string;
    activity_details: any;
  }): Promise<void> {
    const { error } = await this.supabase
      .from("activity_log")
      .insert(activityData);

    if (error) {
      console.error("Failed to log activity:", error);
      throw error;
    }
  }

  // Get member by email and project
  async getMemberByEmail(email: string, projectId: string) {
    const { data, error } = await this.supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .eq('project_id', projectId)
      .single();

    if (error) {
      console.error("Error fetching member:", error);
      throw error;
    }

    return data;
  }
} 