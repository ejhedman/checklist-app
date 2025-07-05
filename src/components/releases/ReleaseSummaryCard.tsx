import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import React from "react";
import { createClient } from "@/lib/supabase";

export interface ReleaseSummaryCardProps {
  release: {
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
    total_members: number;
    ready_members: number;
    is_archived?: boolean;
  };
  getStateIcon: (state: string) => React.ReactNode;
  onReleaseUpdated?: () => void;
}

// Helper to calculate days until target date
function getDaysUntil(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Map release state to a pale background color for the header
function getPaleBgForState(state: string, is_archived?: boolean) {
  if (is_archived) return "bg-gray-200";
  switch (state) {
    case "ready":
      return "bg-green-50";
    case "pending":
      return "bg-amber-50";
    case "past_due":
      return "bg-red-50";
    case "complete":
      return "bg-blue-50";
    default:
      return "bg-gray-50";
  }
}

export const ReleaseSummaryCard: React.FC<ReleaseSummaryCardProps> = ({
  release,
  getStateIcon,
  onReleaseUpdated,
}) => {
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [isArchived, setIsArchived] = useState(release.is_archived);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    setIsArchived(release.is_archived);
  }, [release.is_archived]);

  useEffect(() => {
    const fetchTeams = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("release_teams")
        .select("teams(name)")
        .eq("release_id", release.id);
      if (!error && data) {
        setTeamNames(data.map((row: any) => row.teams?.name).filter(Boolean));
      }
    };
    fetchTeams();
  }, [release.id]);

  const handleArchiveChange = async (checked: boolean) => {
    setArchiving(true);
    setIsArchived(checked);
    const supabase = createClient();
    const { error } = await supabase
      .from("releases")
      .update({ is_archived: checked })
      .eq("id", release.id);
    if (error) {
      console.error('Failed to update is_archived:', error);
      // Revert the state if update failed
      setIsArchived(!checked);
    } else {
      // Call the callback to refresh the parent component
      onReleaseUpdated?.();
    }
    setArchiving(false);
  };

  // Helper to calculate days until target date
  const days = getDaysUntil(release.target_date);
  const isPast = days < 0;

  return (
    <Card className="hover:shadow-md transition-shadow rounded-lg">
      <CardHeader className={`border-b border-border flex flex-row items-center justify-between px-4 py-3 rounded-t-lg ${getPaleBgForState(release.state, release.is_archived)}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <CardTitle className="flex items-center m-0">
              {getStateIcon(release.state)}
              <Link
                href={`/releases/${encodeURIComponent(release.name)}`}
                className="ml-2 flex items-center hover:underline cursor-pointer group"
              >
                <span>{release.name}</span>
                <ExternalLink className="h-4 w-4 ml-1 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
              <Link
                href={`/releases/${encodeURIComponent(release.name)}/releasenotes`}
                className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                title="View Release Notes"
              >
                <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
            </CardTitle>
          </div>
          <div className="flex-1 flex justify-center">
            <CardDescription className="m-0">
              {(() => {
                const label = isPast ? "Release Date" : "Target Date";
                const [year, month, day] = release.target_date.split('-');
                const dateStr = `${Number(month)}/${Number(day)}/${year}`;
                return isPast
                  ? `${label}: ${dateStr}`
                  : `${label}: ${dateStr} (${days} days)`;
              })()}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2 justify-end">
            {isPast && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={!!isArchived}
                  onCheckedChange={checked => handleArchiveChange(!!checked)}
                  disabled={archiving}
                  id={`archive-${release.id}`}
                />
                <label htmlFor={`archive-${release.id}`} className="text-sm select-none cursor-pointer">
                  Archive
                </label>
              </div>
            )}
            {release.state === "ready" ? (
              <Badge className="bg-green-600 text-white" variant="default">
                {release.state.replace("_", " ")}
              </Badge>
            ) : release.state === "pending" ? (
              <Badge className="bg-amber-400 text-black" variant="default">
                {release.state.replace("_", " ")}
              </Badge>
            ) : (
              <Badge variant="secondary">
                {release.state.replace("_", " ")}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Teams</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {teamNames.length > 0 ? (
                teamNames.map((team) => (
                  <Badge key={team} variant="secondary" className="text-xs">
                    {team}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No teams</span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Members</p>
            <p className="text-lg font-semibold">{release.ready_members}/{release.total_members}</p>
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
            <p className="text-sm text-muted-foreground">Specs Update</p>
            <Badge variant={release.config_update ? "default" : "secondary"}>
              {release.config_update ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 