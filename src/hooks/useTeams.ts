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
    member_id: string;
    full_name: string;
    email: string;
    nickname?: string;
  }>;
}

export function useTeams() {
  const [teams, setTeams] = useState<TransformedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedTenant } = useAuth();

  const transformTeamData = (data: Team[]): TransformedTeam[] => {
    return data?.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      member_count: team.team_members?.length || 0,
      active_releases: team.release_teams?.length || 0,
      created_at: team.created_at,
      members: (team.team_members?.map((tm) => ({
        id: tm.members[0]?.id,
        member_id: tm.members[0]?.id,
        full_name: tm.members[0]?.full_name,
        email: tm.members[0]?.email,
        nickname: tm.members[0]?.nickname
      })).filter(Boolean) || []),
    })) || [];
  };

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    
    if (!selectedTenant) {
      console.error("No tenant selected");
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
            members!inner (
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
        .eq('tenant_id', selectedTenant.id)
        .order("name");

      if (supabaseError) {
        console.error("Error fetching teams:", supabaseError);
        setError(supabaseError.message);
        return;
      }

      const transformedData = transformTeamData(data || []);
      setTeams(transformedData);
    } catch (err) {
      console.error("Error in fetchTeams:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchTeams();
    } else {
      setTeams([]);
      setLoading(false);
    }
  }, [selectedTenant]);

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
  };
} 