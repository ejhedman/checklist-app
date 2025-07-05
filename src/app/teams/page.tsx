"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { AddTeamDialog } from "@/components/teams/AddTeamDialog";
import { EditTeamDialog } from "@/components/teams/EditTeamDialog";
import { createClient } from "@/lib/supabase";

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
    
    const { data, error } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        description,
        created_at,
        team_users (
          user_id,
          users (
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
      .order("name");

    if (error) {
      console.error("Error fetching teams:", error);
    } else {
      // Transform the data to count members and active releases
      const transformedData = data?.map((team: any) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        member_count: team.team_users?.length || 0,
        active_releases: team.release_teams?.length || 0,
        created_at: team.created_at,
        members: team.team_users?.map((tu: any) => tu.users).filter(Boolean) || [],
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
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    {team.name}
                  </CardTitle>
                  <div className="flex items-center space-x-1">
                    <EditTeamDialog team={team} onTeamUpdated={fetchTeams} />
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{team.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Members</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{team.member_count}</p>
                        {team.member_count > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTeamExpansion(team.id)}
                            className="h-6 w-6 p-0"
                          >
                            {expandedTeams.has(team.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-sm text-muted-foreground">Active Releases</p>
                      <Badge variant="secondary">{team.active_releases}</Badge>
                    </div>
                  </div>

                  {/* Expanded Members List */}
                  {expandedTeams.has(team.id) && team.members && team.members.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3">Team Members</h4>
                      <div className="space-y-2">
                        {team.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <div>
                              <p className="text-sm font-medium">{member.full_name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            {member.nickname && (
                              <Badge variant="outline" className="text-xs">
                                {member.nickname}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 