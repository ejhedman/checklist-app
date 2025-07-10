import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TeamsRepository, TransformedTeam } from "@/lib/repository";

export function useTeams() {
  const [teams, setTeams] = useState<TransformedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProject } = useAuth();
  const teamsRepository = new TeamsRepository();

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    
    if (!selectedProject) {
      console.error("No project selected");
      setTeams([]);
      setLoading(false);
      return;
    }
    
    try {
      const teams = await teamsRepository.getTeams(selectedProject.id);
      setTeams(teams);
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