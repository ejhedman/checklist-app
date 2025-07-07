"use client";

import { useState } from "react";
import { AddTeamDialog } from "@/components/teams/AddTeamDialog";
import { TeamCard, Team } from "@/components/teams/TeamCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "@/hooks/useTeams";
import { LoadingSpinner } from "@/components/ui/loading";

export default function TeamsPage() {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const { selectedTenant } = useAuth();
  const { teams, loading, error, refetch } = useTeams();

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
        <AddTeamDialog onTeamAdded={refetch} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Loading teams..." />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              expanded={expandedTeams.has(team.id)}
              onToggleExpand={toggleTeamExpansion}
              onTeamUpdated={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
} 