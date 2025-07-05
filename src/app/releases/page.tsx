// eslint-disable-next-line @typescript-eslint/no-explicit-any
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronUp, Users, ExternalLink } from "lucide-react";
import { CreateReleaseDialog } from "@/components/releases/CreateReleaseDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { ReleaseSummaryCard } from "@/components/releases/ReleaseSummaryCard";

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
      is_config: boolean;
      is_ready: boolean;
      comments?: string;
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
    total_members: number;
    ready_members: number;
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
          is_config,
          is_ready,
          comments,
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
      const transformedData = data?.map((release) => {
        // Aggregate all members from all teams
        const allMembers: any[] = [];
        if (release.release_teams) {
          release.release_teams.forEach((rt) => {
            if (rt.team && (rt.team as any).team_users) {
              const members = Array.isArray((rt.team as any).team_users)
                ? (rt.team as any).team_users
                : [(rt.team as any).team_users];
              members.forEach((tu: any) => {
                allMembers.push(tu.user ? tu.user : tu);
              });
            }
          });
        }
        const total_members = allMembers.length;
        const ready_members = allMembers.filter((member) => {
          const userId = member.id;
          const userReadyState = release.user_release_state?.find((urs) => urs.user_id === userId);
          return userReadyState?.is_ready;
        }).length;
        return {
          id: release.id,
          name: release.name,
          target_date: release.target_date,
          state: release.state,
          platform_update: release.platform_update,
          config_update: release.config_update,
          created_at: release.created_at,
          team_count: release.release_teams?.length || 0,
          feature_count: release.features?.length || 0,
          ready_features: release.features?.filter((f) => f.is_ready)?.length || 0,
          features: release.features?.map((feature) => ({
            id: feature.id,
            name: feature.name,
            description: feature.description,
            jira_ticket: feature.jira_ticket,
            is_platform: feature.is_platform,
            is_config: feature.is_config,
            is_ready: feature.is_ready,
            comments: feature.comments,
            dri_user: Array.isArray(feature.dri_user)
              ? (feature.dri_user[0] as { id: string; full_name: string; email: string })
              : feature.dri_user
                ? {
                    id: (feature.dri_user as any).id,
                    full_name: (feature.dri_user as any).full_name,
                    email: (feature.dri_user as any).email,
                  }
                : null,
          })) || [],
          teams: release.release_teams?.map((rt) => ({
            id: (rt.team as any).id,
            name: (rt.team as any).name,
            description: (rt.team as any).description,
            members: (Array.isArray((rt.team as any).team_users)
              ? (rt.team as any).team_users
              : ((rt.team as any).team_users ? [(rt.team as any).team_users] : [])
            )?.map((tu: any) => {
              const userReadyState = release.user_release_state?.find((urs) => urs.user_id === (tu.user as any).id);
              return {
                id: (tu.user as any).id,
                full_name: (tu.user as any).full_name,
                email: (tu.user as any).email,
                is_ready: userReadyState?.is_ready || false,
              };
            }) || [],
          })) || [],
          total_members,
          ready_members,
        };
      });
      
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
            <ReleaseSummaryCard
              key={release.id}
              release={release}
              getStateColor={getStateColor}
              getStateIcon={getStateIcon}
            />
          ))}
        </div>
      )}
    </div>
  );
} 