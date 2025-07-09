import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardData {
  totalReleases: number;
  activeTeams: number;
  readyReleases: number;
  pastDueReleases: number;
  upcomingReleases: any[];
  recentActivity: any[];
}

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

  const getDashboardData = async (projectIds: string[]): Promise<DashboardData> => {
    const supabase = createClient();
    
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

      // Get releases statistics (filtered by project)
      let releasesQuery = supabase
        .from('releases')
        .select('*')
        .eq('is_archived', false);
      
      if (projectIds.length > 0) {
        releasesQuery = releasesQuery.in('project_id', projectIds);
      } else {
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
      
      const { data: releases, error: releasesError } = await releasesQuery;
      
      if (releasesError) {
        console.error("Releases fetch error:", releasesError);
      }

      // Get teams count (filtered by project)
      let teamsQuery = supabase
        .from('teams')
        .select('*');
      
      if (projectIds.length > 0) {
        teamsQuery = teamsQuery.in('project_id', projectIds);
      }
      
      const { data: teams, error: teamsError } = await teamsQuery;
      
      if (teamsError) {
        console.error("Teams fetch error:", teamsError);
      }

      // Get upcoming releases (not archived, not complete, not cancelled, filtered by project)
      let upcomingQuery = supabase
        .from('releases')
        .select(`
          *,
          projects(name),
          release_teams(
            team_id
          )
        `)
        .eq('is_archived', false)
        .not('state', 'in', '(complete,cancelled)')
        .order('target_date', { ascending: true })
        .limit(3);
      
      if (projectIds.length > 0) {
        upcomingQuery = upcomingQuery.in('project_id', projectIds);
      }
      
      const { data: upcomingReleases, error: upcomingError } = await upcomingQuery;
      
      if (upcomingError) {
        console.error("Upcoming releases fetch error:", upcomingError);
      }

      // Get recent activity log (filtered by project)
      let activityQuery = supabase
        .from('activity_log')
        .select(`*, members(full_name, email, nickname), features(name), teams(name), releases(name)`)
        .order('created_at', { ascending: false })
        .limit(7);
      
      if (projectIds.length > 0) {
        activityQuery = activityQuery.in('project_id', projectIds);
      }
      
      const { data: recentActivity, error: activityError } = await activityQuery;

      if (activityError) {
        console.error("Failed to fetch recent activity:", activityError);
      }

      // Calculate statistics
      const totalReleases = releases?.length || 0;
      const activeTeams = teams?.length || 0;
      const readyReleases = releases?.filter((r: any) => r.is_ready === true).length || 0;
      const pastDueReleases = releases?.filter((r: any) => r.state === 'past_due').length || 0;

      return {
        totalReleases,
        activeTeams,
        readyReleases,
        pastDueReleases,
        upcomingReleases: upcomingReleases || [],
        recentActivity: recentActivity || []
      };
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
  };

  const fetchDashboardData = async () => {
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
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedProject, user]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  };
} 