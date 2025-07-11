import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HomeRepository, DashboardData } from "@/lib/repository";

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    totalReleases: 0,
    activeTeams: 0,
    readyReleases: 0,
    pastDueReleases: 0,
    upcomingReleases: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProject, user } = useAuth();
  
  // Memoize the repository to prevent recreation on every render
  const homeRepository = useMemo(() => new HomeRepository(), []);

  // Memoize the getDashboardData function
  const getDashboardData = useCallback(async (projectIds: string[]): Promise<DashboardData> => {
    try {
      if (!user) {
        console.error("No authenticated user found");
        return {
          totalReleases: 0,
          activeTeams: 0,
          readyReleases: 0,
          pastDueReleases: 0,
          upcomingReleases: [],
          recentActivity: []
        };
      }

      if (projectIds.length === 0) {
        // If no project IDs, return empty result
        return {
          totalReleases: 0,
          activeTeams: 0,
          readyReleases: 0,
          pastDueReleases: 0,
          upcomingReleases: [],
          recentActivity: []
        };
      }

      return await homeRepository.getDashboardData(projectIds);
    } catch (error) {
      console.error("Error in getDashboardData:", error);
      // Return default data on error
      return {
        totalReleases: 0,
        activeTeams: 0,
        readyReleases: 0,
        pastDueReleases: 0,
        upcomingReleases: [],
        recentActivity: []
      };
    }
  }, [homeRepository, user]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!selectedProject) {
        setData({
          totalReleases: 0,
          activeTeams: 0,
          readyReleases: 0,
          pastDueReleases: 0,
          upcomingReleases: [],
          recentActivity: []
        });
        setLoading(false);
        return;
      }

      const projectIds = [selectedProject.id];
      const dashboardData = await getDashboardData(projectIds);
      setData(dashboardData);
    } catch (err) {
      console.error("Error in fetchDashboardData:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedProject, getDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  };
} 