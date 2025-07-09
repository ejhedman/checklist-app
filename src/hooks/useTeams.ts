import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  team_members?: Array<{
    member_id: string;
    members: Array<{
      id: string;
      full_name: string;
      email: string;
      nickname?: string;
    }>;
  }>;
  release_teams?: Array<{
    release_id: string;
  }>;
}

interface TransformedTeam {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  active_releases: number;
  created_at: string;
  members: Array<{
    id: string;
    full_name: string;
    email: string;
    nickname?: string;
    member_id: string;
  }>;
}

export function useTeams() {
  const [teams, setTeams] = useState<TransformedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProject } = useAuth();

  const transformTeamData = (data: Team[]): TransformedTeam[] => {
    return data?.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      member_count: team.team_members?.length || 0,
      active_releases: team.release_teams?.length || 0,
      created_at: team.created_at,
      members: (
        team.team_members?.flatMap((tm) =>
          (Array.isArray(tm.members) ? tm.members : tm.members ? [tm.members] : []).map((member) => ({
            id: member.id,
            member_id: tm.member_id,
            full_name: member.full_name,
            email: member.email,
            nickname: member.nickname,
          }))
        ) || []
      ),
    })) || [];
  };

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    
    if (!selectedProject) {
      console.error("No project selected");
      setTeams([]);
      setLoading(false);
      return;
    }
    
    try {
      const { data, error: supabaseError } = await supabase
        .from("teams")
        .select(`
          id,
          name,
          description,
          created_at,
          team_members (
            member_id,
            members (
              id,
              full_name,
              email,
              nickname
            )
          ),
          release_teams (
            release_id
          )
        `)
        .eq('project_id', selectedProject.id)
        .order("name");

      // Debug log: raw data from Supabase
      console.log('Raw teams data from Supabase:', data);
      if (data) {
        data.forEach(team => {
          if (team.team_members) {
            console.log(`Team '${team.name}' team_members:`, team.team_members.map(tm => ({
              member_id: tm.member_id,
              member: tm.members?.[0] || null
            })));
          }
        });
      }

      if (supabaseError) {
        console.error("Error fetching teams:", supabaseError);
        setError(supabaseError.message);
        return;
      }

      const transformedData = transformTeamData(data || []);
      // Debug log: transformed members for each team
      transformedData.forEach(team => {
        console.log(`Transformed members for team '${team.name}':`, team.members);
      });
      setTeams(transformedData);
    } catch (err) {
      console.error("Error in fetchTeams:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchTeams();
    } else {
      setTeams([]);
      setLoading(false);
    }
  }, [selectedProject]);

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
  };
} 