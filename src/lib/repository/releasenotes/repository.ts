import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type SupabaseClient = ReturnType<typeof createClient>;

export interface ReleaseNote {
  id: string;
  name: string;
  target_date: string;
  state: string;
  platform_update: string | null;
  config_update: string | null;
  projects: {
    name: string;
  };
}

export class ReleaseNotesRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // Get all releases for release notes
  async getReleasesForNotes() {
    const { data, error } = await this.supabase
      .from("releases")
      .select(`
        id,
        name,
        target_date,
        state,
        platform_update,
        config_update,
        projects(name)
      `)
      .eq('is_archived', false)
      .order("target_date", { ascending: false });

    if (error) {
      console.error("Error fetching releases for notes:", error);
      throw error;
    }

    return data || [];
  }

  // Get release by slug for release notes
  async getReleaseBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from("releases")
      .select(`
        id,
        name,
        target_date,
        state,
        platform_update,
        config_update,
        project_id,
        release_notes,
        release_summary,
        projects(name)
      `)
      .eq('name', slug)
      .eq('is_archived', false)
      .single();

    if (error) {
      console.error("Error fetching release by slug:", error);
      throw error;
    }

    return data;
  }
} 