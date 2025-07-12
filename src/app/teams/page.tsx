"use client";

import { useState } from "react";
import { AddTeamDialog } from "@/components/teams/AddTeamDialog";
import { TeamCard } from "@/components/teams/TeamCard";
// import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "@/hooks/useTeams";
import { LoadingSpinner } from "@/components/ui/loading";

export default function TeamsPage() {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const { teams, loading, refetch } = useTeams();

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
    <div className="space-y-6 px-2 sm:px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight truncate">Teams</h1>
          <p className="text-muted-foreground truncate">
            Manage teams and their members
          </p>
        </div>
        <div className="w-full md:w-auto flex-shrink-0">
          <AddTeamDialog onTeamAdded={refetch} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Loading teams..." />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
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