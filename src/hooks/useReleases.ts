import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Release {
  id: string;
  name: string;
  target_date: string;
  state: string;
  platform_update: boolean;
  config_update: boolean;
  is_archived: boolean;
  targets?: string[];
  created_at: string;
  tenant_id: string;
  tenants?: {
    id: string;
    name: string;
  };
  release_teams?: Array<{
    team: {
      id: string;
      name: string;
      description: string;
      team_members: Array<{
        member: {
          id: string;
          full_name: string;
          email: string;
        };
      }>;
    };
  }>;
  member_release_state?: Array<{
    member_id: string;
    is_ready: boolean;
  }>;
  features?: Array<{
    id: string;
    name: string;
    description: string;
    jira_ticket: string;
    is_platform: boolean;
    is_config: boolean;
    is_ready: boolean;
    comments: string;
    dri_member_id: string;
    dri_member: {
      id: string;
      full_name: string;
      email: string;
    };
  }>;
}

interface TransformedRelease extends Release {
  team_count: number;
  feature_count: number;
  ready_features: number;
  total_members: number;
  ready_members: number;
  tenant?: {
    id: string;
    name: string;
  };
}

interface UseReleasesOptions {
  showArchived?: boolean;
  includeDetails?: boolean;
}

export function useReleases(options: UseReleasesOptions = {}) {
  const [releases, setReleases] = useState<TransformedRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedTenant } = useAuth();
  const { showArchived = false, includeDetails = true } = options;

  const transformReleaseData = (data: any[]): TransformedRelease[] => {
    return data.map((release) => {
      // Aggregate all members from all teams
      const allMembers: any[] = [];
      if (release.release_teams) {
        release.release_teams.forEach((rt: any) => {
          if (rt.team && rt.team.team_members) {
            const members = Array.isArray(rt.team.team_members)
              ? rt.team.team_members
              : [rt.team.team_members];
            members.forEach((tm: any) => {
              allMembers.push(tm.member ? tm.member : tm);
            });
          }
        });
      }
      
      const total_members = allMembers.length;
      const ready_members = allMembers.filter((member: any) => {
        const memberId = member.id;
        const memberReadyState = release.member_release_state?.find((mrs: any) => mrs.member_id === memberId);
        return memberReadyState?.is_ready;
      }).length;

      return {
        ...release,
        team_count: release.release_teams?.length || 0,
        feature_count: release.features?.length || 0,
        ready_features: release.features?.filter((f: any) => f.is_ready)?.length || 0,
        total_members,
        ready_members,
        features: release.features || [],
        tenant: release.tenants,
      };
    });
  };

  const fetchReleases = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    
    if (!selectedTenant) {
      console.error("No tenant selected");
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      let baseQuery = `
        id,
        name,
        target_date,
        state,
        platform_update,
        config_update,
        is_archived,
        targets,
        created_at,
        tenant_id,
        tenants (
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

      let query = supabase
        .from("releases")
        .select(baseQuery)
        .eq('tenant_id', selectedTenant.id)
        .order("target_date", { ascending: true });

      if (!showArchived) {
        query = query.eq("is_archived", false);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        console.error("Error fetching releases:", supabaseError);
        setError(supabaseError.message);
        return;
      }

      const transformedData = transformReleaseData(data || []);
      setReleases(transformedData);
    } catch (err) {
      console.error("Error in fetchReleases:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchReleases();
    } else {
      setReleases([]);
      setLoading(false);
    }
  }, [selectedTenant, showArchived, includeDetails]);

  return {
    releases,
    loading,
    error,
    refetch: fetchReleases,
  };
} 