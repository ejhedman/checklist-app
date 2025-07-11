import { useState, useEffect } from "react";
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
      
      console.log("Repository milestones:", repositoryMilestones);

      // Transform repository milestones to the expected format
      const milestones: Milestone[] = [];
      
      // Process repository milestones
      repositoryMilestones.forEach((milestone: any) => {
        console.log('Raw milestone:', milestone);
        // Team member milestone
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
          // DRI feature milestone
          const release = Array.isArray(milestone.releases) ? milestone.releases[0] : milestone.releases;
          if (release) {
            milestones.push({
              id: `feature-${milestone.id}`,
              type: 'dri',
              title: release.name, // Release name for context
              dri_feature_name: milestone.name, // Feature name
              target_date: release.target_date, // Use release date
              project_name: release.projects?.name,
              is_ready: false,
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
  const homeRepository = new HomeRepository();

  const getNagMilestones = async (projectIds: string[]): Promise<NagMilestone[]> => {
    try {
      if (!user || !user.email) return [];
      const repositoryMilestones = await homeRepository.getNagMilestones(projectIds, user.email);
      // Transform repository milestones to the expected format
      const milestones: NagMilestone[] = [];
      repositoryMilestones.forEach((milestone: any) => {
        if (milestone.type === 'team_member') {
          milestones.push({
            ...milestone,
          });
        } else if (milestone.type === 'dri') {
          milestones.push({
            ...milestone,
          });
        }
      });
      // Sort by target date and take top 20 (Nag list could be longer)
      return milestones
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .slice(0, 20);
    } catch (error) {
      console.error('Error in getNagMilestones:', error);
      return [];
    }
  };

  const fetchNagMilestones = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!selectedProject) {
        setNagMilestones([]);
        setLoading(false);
        return;
      }
      const projectIds = [selectedProject.id];
      const milestoneData = await getNagMilestones(projectIds);
      setNagMilestones(milestoneData);
    } catch (err) {
      console.error('Error in fetchNagMilestones:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNagMilestones();
  }, [selectedProject, user]);

  return {
    nagMilestones,
    loading,
    error,
    refetch: fetchNagMilestones,
  };
} 