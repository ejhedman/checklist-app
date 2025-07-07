"use client";

import { useState, useEffect } from "react";
import { CreateReleaseDialog } from "@/components/releases/CreateReleaseDialog";
import { ReleaseSummaryCard } from "@/components/releases/ReleaseSummaryCard";
import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const fetchReleases = async (): Promise<void> => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("releases")
      .select(`
        id,
        name,
        target_date,
        state,
        platform_update,
        config_update,
        is_archived,
        created_at,
        release_teams (
          team:teams (
            id,
            name,
            description,
            team_members (
              member:members (
                id,
                full_name,
                email
              )
            )
          )
        ),
        member_release_state (
          member_id,
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
          dri_member_id,
          dri_member:members!dri_member_id (
            id,
            full_name,
            email
          )
        )
      `)
      .order("target_date", { ascending: true });
    if (!showArchived) {
      query = query.eq("is_archived", false);
    }
    const { data } = await query;
    // Transform the data to count teams and features
    const transformedData = (data || []).map((release: any) => {
      // Aggregate all members from all teams
      const allMembers: any[] = [];
      if (release.release_teams) {
        release.release_teams.forEach((rt: any) => {
          if (rt.team && rt.team.team_members) {
            const members = Array.isArray(rt.team.team_members)
              ? rt.team.team_members
              : [rt.team.team_members];
            members.forEach((tm: any) => {
              allMembers.push(tm.member ? tm.member : tm);
            });
          }
        });
      }
      const total_members = allMembers.length;
      const ready_members = allMembers.filter((member) => {
        const memberId = member.id;
        const memberReadyState = release.member_release_state?.find((mrs: any) => mrs.member_id === memberId);
        return memberReadyState?.is_ready;
      }).length;
      return {
        ...release,
        team_count: release.release_teams?.length || 0,
        feature_count: release.features?.length || 0,
        ready_features: release.features?.filter((f: any) => f.is_ready)?.length || 0,
        total_members,
        ready_members,
        features: release.features || [],
      };
    });
    setReleases(transformedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchReleases();
  }, [showArchived]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Scheduled Releases</h1>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="accent-primary"
            />
            Show archived
          </label>
        </div>
        <CreateReleaseDialog onReleaseSaved={fetchReleases} />
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
              getStateIcon={getStateIcon}
              onReleaseUpdated={fetchReleases}
            />
          ))}
        </div>
      )}
    </div>
  );
} 