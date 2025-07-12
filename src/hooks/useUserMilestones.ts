import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HomeRepository } from "@/lib/repository";

interface Milestone {
  id: string;
  type: 'team_member' | 'dri';
  title: string;
  target_date: string;
  project_name?: string;
  is_ready: boolean;
  release_id: string;
  release_name?: string;
  feature_id?: string;
  dri_feature_name?: string; // Added for DRI milestones
}

export function useUserMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProject, user } = useAuth();
  
  // Memoize the repository to prevent recreation on every render
  const homeRepository = useMemo(() => new HomeRepository(), []);

  // Memoize the fetchMilestones function
  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!selectedProject || !user || !user.email) {
        setMilestones([]);
        setLoading(false);
        return;
      }
      const projectIds = [selectedProject.id];
      const repositoryMilestones = await homeRepository.getUserMilestones(projectIds, user.email);
      console.log("Repository milestones:", repositoryMilestones);
      const milestones: Milestone[] = [];
      repositoryMilestones.forEach((milestone: any) => {
        console.log('Raw milestone:', milestone);
        if (milestone.name && milestone.target_date && !milestone.releases) {
          milestones.push({
            id: `release-${milestone.id}`,
            type: 'team_member',
            title: milestone.name,
            target_date: milestone.target_date,
            project_name: milestone.projects?.name,
            is_ready: false,
            release_id: milestone.id
          });
        } else if (milestone.releases) {
          const release = Array.isArray(milestone.releases) ? milestone.releases[0] : milestone.releases;
          if (release) {
            milestones.push({
              id: `feature-${milestone.id}`,
              type: 'dri',
              title: release.name,
              dri_feature_name: milestone.name,
              target_date: release.target_date,
              project_name: release.projects?.name,
              is_ready: false,
              release_id: release.id,
              release_name: release.name,
              feature_id: milestone.id
            });
          }
        }
      });
      const sortedMilestones = milestones
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .slice(0, 10);
      setMilestones(sortedMilestones);
    } catch (err) {
      console.error("Error in fetchMilestones:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedProject, user, homeRepository]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  return {
    milestones,
    loading,
    error,
    refetch: fetchMilestones,
  };
} 

// Nag Milestone type is the same as Milestone, but includes member_name and member_email
interface NagMilestone extends Milestone {
  member_id: string;
  member_name: string;
  member_email: string;
  member_nickname?: string | null;
}

export function useNagMilestones() {
  const [nagMilestones, setNagMilestones] = useState<NagMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProject, user } = useAuth();
  
  // Memoize the repository to prevent recreation on every render
  const homeRepository = useMemo(() => new HomeRepository(), []);

  // Memoize the fetchNagMilestones function
  const fetchNagMilestones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!selectedProject || !user || !user.email) {
        setNagMilestones([]);
        setLoading(false);
        return;
      }
      const projectIds = [selectedProject.id];
      const repositoryMilestones = await homeRepository.getNagMilestones(projectIds, user.email);
      const milestones: NagMilestone[] = [];
      repositoryMilestones.forEach((milestone: any) => {
        if (milestone.type === 'team_member') {
          milestones.push({ ...milestone });
        } else if (milestone.type === 'dri') {
          milestones.push({ ...milestone });
        }
      });
      const sortedMilestones = milestones
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .slice(0, 20);
      setNagMilestones(sortedMilestones);
    } catch (err) {
      console.error('Error in fetchNagMilestones:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedProject, user, homeRepository]);

  useEffect(() => {
    fetchNagMilestones();
  }, [fetchNagMilestones]);

  return {
    nagMilestones,
    loading,
    error,
    refetch: fetchNagMilestones,
  };
} 