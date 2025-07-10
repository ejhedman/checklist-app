import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ReleasesRepository, Release } from "@/lib/repository";

interface TransformedRelease extends Release {
  team_count: number;
  feature_count: number;
  ready_features: number;
  total_members: number;
  ready_members: number;
  project?: {
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
  const { selectedProject } = useAuth();
  const { showArchived = false, includeDetails = true } = options;
  const releasesRepository = new ReleasesRepository();

  const transformReleaseData = (data: Release[]): TransformedRelease[] => {
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
        project: release.projects,
      };
    });
  };

  const fetchReleases = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    if (!selectedProject) {
      console.error("No project selected");
      setReleases([]);
      setLoading(false);
      return;
    }

    try {
      const releases = await releasesRepository.getReleases(selectedProject.id, {
        includeDetails,
        showArchived
      });
      const transformedData = transformReleaseData(releases);
      setReleases(transformedData);
    } catch (err) {
      console.error("Error in fetchReleases:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchReleases();
    } else {
      setReleases([]);
      setLoading(false);
    }
  }, [selectedProject, showArchived, includeDetails]);

  return {
    releases,
    loading,
    error,
    refetch: fetchReleases,
  };
} 