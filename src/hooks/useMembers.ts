import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface MemberWithTeams {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  member_role: 'member' | 'release_manager' | 'admin';
  created_at: string;
  team_members?: Array<{
    teams: {
      name: string;
    };
  }>;
}

interface TransformedMember {
  id: string;
  full_name: string;
  email: string;
  nickname: string | null;
  member_role: 'member' | 'release_manager' | 'admin';
  created_at: string;
  teams: string[];
  active_releases: number;
}

export function useMembers() {
  const [members, setMembers] = useState<TransformedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedTenant } = useAuth();

  const transformMemberData = (data: any[]): TransformedMember[] => {
    return data.map((member) => ({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      nickname: member.nickname,
      member_role: member.member_role,
      created_at: member.created_at,
      teams: member.team_members?.map((tm: any) => tm.teams?.name).filter(Boolean) || [],
      active_releases: 0, // TODO: Calculate this from member_release_state
    }));
  };

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      if (!selectedTenant) {
        console.error("No tenant selected");
        setMembers([]);
        setLoading(false);
        return;
      }
      
      // Fetch members with their team memberships (filtered by tenant)
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select(`
          id,
          full_name,
          email,
          nickname,
          member_role,
          created_at,
          team_members (
            teams (
              name
            )
          )
        `)
        .eq('tenant_id', selectedTenant.id)
        .order("full_name");

      if (membersError) {
        console.error("Error fetching members:", membersError);
        setError(membersError.message);
        return;
      }

      const transformedMembers = transformMemberData(members || []);
      setMembers(transformedMembers);
    } catch (err) {
      console.error("Error in fetchMembers:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchMembers();
    } else {
      setMembers([]);
      setLoading(false);
    }
  }, [selectedTenant]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
} 