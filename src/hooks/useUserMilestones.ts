import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HomeRepository } from "@/lib/repository";

interface Milestone {
  id: string;
  type: 'team_member' | 'dri';
  title: string;
  target_date: string;
  state: string;
  project_name?: string;
  is_ready: boolean;
  release_id: string;
  release_name?: string;
  feature_id?: string;
}

export function useUserMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProject, availableProjects, user } = useAuth();
  const homeRepository = new HomeRepository();

  const getUserMilestones = async (projectIds: string[]): Promise<Milestone[]> => {
    try {
      if (!user) {
        return [];
      }

      if (!user.email) {
        return [];
      }
      
      const repositoryMilestones = await homeRepository.getUserMilestones(projectIds, user.email);

      // Transform repository milestones to the expected format
      const milestones: Milestone[] = [];
      
      // Add team member milestones
      repositoryMilestones.forEach((milestone: any) => {
        if (milestone.release_id) {
          milestones.push({
            id: `release-${milestone.id}`,
            type: 'team_member',
            title: milestone.name,
            target_date: milestone.target_date,
            state: milestone.state,
            project_name: milestone.projects?.name,
            is_ready: milestone.is_ready || false,
            release_id: milestone.id
          });
        } else {
          // DRI feature milestone
          // Handle the case where releases might be an array or single object
          const release = Array.isArray(milestone.releases) ? milestone.releases[0] : milestone.releases;
          if (release) {
            milestones.push({
              id: `feature-${milestone.id}`,
              type: 'dri',
              title: milestone.name,
              target_date: release.target_date,
              state: release.state,
              project_name: release.projects?.name,
              is_ready: milestone.is_ready,
              release_id: release.id,
              release_name: release.name,
              feature_id: milestone.id
            });
          }
        }
      });

      // Sort by target date and take top 10
      const sortedMilestones = milestones
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .slice(0, 10);

      return sortedMilestones;
      
    } catch (error) {
      console.error("Error in getUserMilestones:", error);
      return [];
    }
  };

  const fetchMilestones = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!selectedProject) {
        setMilestones([]);
        setLoading(false);
        return;
      }

      // For now, use only the selected project
      const projectIds = [selectedProject.id];
      const milestoneData = await getUserMilestones(projectIds);
      setMilestones(milestoneData);
    } catch (err) {
      console.error("Error in fetchMilestones:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [selectedProject, user]);

  return {
    milestones,
    loading,
    error,
    refetch: fetchMilestones,
  };
} 