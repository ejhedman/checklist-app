"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronUp, Users } from "lucide-react";
import { CreateReleaseDialog } from "@/components/releases/CreateReleaseDialog";
import { AddFeatureDialog } from "@/components/releases/AddFeatureDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase";

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Array<{
    id: string;
    name: string;
    target_date: string;
    state: string;
    platform_update: boolean;
    config_update: boolean;
    team_count: number;
    feature_count: number;
    ready_features: number;
    created_at: string;
    features: Array<{
      id: string;
      name: string;
      description?: string;
      jira_ticket?: string;
      is_platform: boolean;
      is_ready: boolean;
      dri_user: {
        id: string;
        full_name: string;
        email: string;
      } | null;
    }>;
    teams: Array<{
      id: string;
      name: string;
      description?: string;
      members: Array<{
        id: string;
        full_name: string;
        email: string;
        is_ready: boolean;
      }>;
    }>;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReleases, setExpandedReleases] = useState<Set<string>>(new Set());

  const fetchReleases = async () => {
    setLoading(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("releases")
      .select(`
        id,
        name,
        target_date,
        state,
        platform_update,
        config_update,
        created_at,
        release_teams (
          team:teams (
            id,
            name,
            description,
            team_users (
              user:users (
                id,
                full_name,
                email
              )
            )
          )
        ),
        user_release_state (
          user_id,
          is_ready
        ),
        features (
          id,
          name,
          description,
          jira_ticket,
          is_platform,
          is_ready,
          dri_user_id,
          dri_user:users!dri_user_id (
            id,
            full_name,
            email
          )
        )
      `)
      .order("target_date", { ascending: false });

    if (error) {
      console.error("Error fetching releases:", error);
    } else {
      // Transform the data to count teams and features
      const transformedData = data?.map((release: any) => ({
        id: release.id,
        name: release.name,
        target_date: release.target_date,
        state: release.state,
        platform_update: release.platform_update,
        config_update: release.config_update,
        created_at: release.created_at,
        team_count: release.release_teams?.length || 0,
        feature_count: release.features?.length || 0,
        ready_features: release.features?.filter((f: any) => f.is_ready)?.length || 0,
        features: release.features?.map((feature: any) => ({
          id: feature.id,
          name: feature.name,
          description: feature.description,
          jira_ticket: feature.jira_ticket,
          is_platform: feature.is_platform,
          is_ready: feature.is_ready,
          dri_user: feature.dri_user ? {
            id: feature.dri_user.id,
            full_name: feature.dri_user.full_name,
            email: feature.dri_user.email,
          } : null,
        })) || [],
        teams: release.release_teams?.map((rt: any) => ({
          id: rt.team.id,
          name: rt.team.name,
          description: rt.team.description,
          members: rt.team.team_users?.map((tu: any) => {
            const userReadyState = release.user_release_state?.find((urs: any) => urs.user_id === tu.user.id);
            return {
              id: tu.user.id,
              full_name: tu.user.full_name,
              email: tu.user.email,
              is_ready: userReadyState?.is_ready || false,
            };
          }) || [],
        })) || [],
      })) || [];
      
      setReleases(transformedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const getStateColor = (state: string) => {
    switch (state) {
      case "past_due":
        return "bg-red-500";
      case "ready":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-300";
      case "complete":
        return "bg-blue-500";
      default:
        return "bg-gray-200";
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case "past_due":
        return <AlertTriangle className="h-4 w-4" />;
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "complete":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const handleMemberReadyChange = async (releaseId: string, userId: string, isReady: boolean) => {
    const supabase = createClient();
    
    console.log("Updating ready state:", { releaseId, userId, isReady });
    
    const { data, error } = await supabase
      .from("user_release_state")
      .upsert({
        release_id: releaseId,
        user_id: userId,
        is_ready: isReady,
      })
      .select();

    if (error) {
      console.error("Error updating member ready state:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log("Successfully updated ready state:", data);
      // Refresh the releases data
      fetchReleases();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Releases</h1>
          <p className="text-muted-foreground">
            Track and manage software releases
          </p>
        </div>
        <CreateReleaseDialog onReleaseCreated={fetchReleases} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading releases...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {releases.map((release) => (
          <Card key={release.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-3 w-3 rounded-full ${getStateColor(release.state)}`} />
                  <CardTitle className="flex items-center">
                    {getStateIcon(release.state)}
                    <span className="ml-2">{release.name}</span>
                  </CardTitle>
                </div>
                <Badge variant="outline">{release.state.replace('_', ' ')}</Badge>
              </div>
              <CardDescription>
                Target Date: {new Date(release.target_date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Teams</p>
                  <p className="text-lg font-semibold">{release.team_count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Features</p>
                  <p className="text-lg font-semibold">
                    {release.ready_features}/{release.feature_count}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Platform Update</p>
                  <Badge variant={release.platform_update ? "default" : "secondary"}>
                    {release.platform_update ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Config Update</p>
                  <Badge variant={release.config_update ? "default" : "secondary"}>
                    {release.config_update ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>

              {/* Features Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Features</h4>
                  <div className="flex items-center space-x-2">
                    <AddFeatureDialog 
                      releaseId={release.id} 
                      releaseName={release.name} 
                      onFeatureAdded={fetchReleases} 
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newExpanded = new Set(expandedReleases);
                        if (newExpanded.has(release.id)) {
                          newExpanded.delete(release.id);
                        } else {
                          newExpanded.add(release.id);
                        }
                        setExpandedReleases(newExpanded);
                      }}
                    >
                      {expandedReleases.has(release.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {expandedReleases.has(release.id) && (
                  <div className="space-y-2">
                    {release.features.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No features added yet.</p>
                    ) : (
                      release.features.map((feature) => (
                        <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium">{feature.name}</h5>
                              {feature.is_platform && (
                                <Badge variant="outline" className="text-xs">Platform</Badge>
                              )}
                              {feature.is_ready && (
                                <Badge variant="default" className="text-xs">Ready</Badge>
                              )}
                            </div>
                            {feature.description && (
                              <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                            )}
                            {feature.jira_ticket && (
                              <p className="text-xs text-muted-foreground">JIRA: {feature.jira_ticket}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {feature.dri_user ? (
                              <div>
                                <p className="text-sm font-medium">{feature.dri_user.full_name}</p>
                                <p className="text-xs text-muted-foreground">{feature.dri_user.email}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No DRI assigned</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Team Members Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Team Members
                  </h4>
                </div>

                <div className="space-y-4">
                  {release.teams.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No teams assigned to this release.</p>
                  ) : (
                    release.teams.map((team) => (
                      <div key={team.id} className="border rounded-lg p-4">
                        <h5 className="font-medium text-sm mb-2">{team.name}</h5>
                        {team.description && (
                          <p className="text-xs text-muted-foreground mb-3">{team.description}</p>
                        )}
                        <div className="space-y-2">
                          {team.members.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No members in this team.</p>
                          ) : (
                            team.members.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    checked={member.is_ready}
                                    onCheckedChange={(checked) => 
                                      handleMemberReadyChange(release.id, member.id, checked as boolean)
                                    }
                                  />
                                  <div>
                                    <p className="text-sm font-medium">{member.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                  </div>
                                </div>
                                <Badge variant={member.is_ready ? "default" : "secondary"} className="text-xs">
                                  {member.is_ready ? "Ready" : "Not Ready"}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
    </div>
  );
} 