"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { AddTeamDialog } from "@/components/teams/AddTeamDialog";
import { EditTeamDialog } from "@/components/teams/EditTeamDialog";
import { createClient } from "@/lib/supabase";
import { TeamCard, Team } from "@/components/teams/TeamCard";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Array<{
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
    }>;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const fetchTeams = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Get current user's member info for tenant filtering
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("No authenticated user found");
      setTeams([]);
      setLoading(false);
      return;
    }

    // Get the member record for this user
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, tenant_id')
      .eq('email', user.email)
      .single();

    if (memberError || !member) {
      console.error("No member record found for user");
      setTeams([]);
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
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
      .eq('tenant_id', member.tenant_id)
      .order("name");

    if (error) {
      console.error("Error fetching teams:", error);
    } else {
      // Transform the data to count members and active releases
      const transformedData = data?.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        member_count: team.team_members?.length || 0,
        active_releases: team.release_teams?.length || 0,
        created_at: team.created_at,
        members: (team.team_members?.map((tm) => ({
          id: tm.members[0]?.id,
          full_name: tm.members[0]?.full_name,
          email: tm.members[0]?.email,
          nickname: tm.members[0]?.nickname
        })).filter(Boolean) || []),
      })) || [];
      
      setTeams(transformedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams and their members
          </p>
        </div>
        <AddTeamDialog onTeamAdded={fetchTeams} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading teams...</div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              expanded={expandedTeams.has(team.id)}
              onToggleExpand={toggleTeamExpansion}
              onTeamUpdated={fetchTeams}
            />
          ))}
        </div>
      )}
    </div>
  );
} 