import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MembersRepository, TransformedMember } from "@/lib/repository";

export function useMembers() {
  const [members, setMembers] = useState<TransformedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedProject } = useAuth();
  const membersRepository = new MembersRepository();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!selectedProject) {
        console.error("No project selected");
        setMembers([]);
        setLoading(false);
        return;
      }
      
      const members = await membersRepository.getMembers(selectedProject.id);
      setMembers(members);
    } catch (err) {
      console.error("Error in fetchMembers:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      fetchMembers();
    } else {
      setMembers([]);
      setLoading(false);
    }
  }, [selectedProject, fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
} 