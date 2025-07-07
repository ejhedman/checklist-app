import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import React from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { StateBadge, getStateBackgroundColor } from "@/components/ui/state-icons";
import { useRouter } from "next/navigation";

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
    targets?: string[];
    tenant?: {
      id: string;
      name: string;
    };
    release_teams?: Array<{
      team: {
        id: string;
        name: string;
        description: string;
        team_members: Array<{
          member: {
            id: string;
            full_name: string;
            email: string;
          };
        }>;
      };
    }>;
    features?: Array<{
      id: string;
      name: string;
      description: string;
      jira_ticket: string;
      is_platform: boolean;
      is_config: boolean;
      is_ready: boolean;
      comments: string;
      dri_member_id: string;
      dri_member: {
        id: string;
        full_name: string;
        email: string;
      };
    }>;
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

export const ReleaseSummaryCard: React.FC<ReleaseSummaryCardProps> = ({
  release,
  getStateIcon,
  onReleaseUpdated,
}) => {
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [isArchived, setIsArchived] = useState(release.is_archived);
  const [archiving, setArchiving] = useState(false);
  const { user, memberId } = useAuth();
  const router = useRouter();

  // Debug: Log features and user
  // console.log('ReleaseSummaryCard:', {
  //   releaseName: release.name,
  //   features: release.features,
  //   userId: user?.id,
  //   memberId,
  //   driIds: release.features?.map(f => f.dri_member_id)
  // });

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

  // Check if the current user is a DRI on any features
  const isUserDRI = () => {
    if (!memberId || !release.features) return false;
    return release.features.some(feature => 
      feature.dri_member_id === memberId
    );
  };

  // Check if the current user is a member of any teams in this release
  const isUserMember = () => {
    if (!memberId || !release.release_teams) return false;
    return release.release_teams.some(rt => 
      rt.team?.team_members?.some(tm => 
        tm.member?.id === memberId
      )
    );
  };

  // Helper to calculate days until target date
  const days = getDaysUntil(release.target_date);
  const isPast = days < 0;

  return (
    <Card className="hover:shadow-md transition-shadow rounded-lg">
      <CardHeader className={`border-b border-border flex flex-row items-center justify-between px-4 py-3 rounded-t-lg ${getStateBackgroundColor(release.state as any, release.is_archived)}`}>
        <div className="flex items-center justify-between w-full">
          <div
            className="flex items-center flex-1 min-w-0 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
            onClick={() => router.push(`/releases/${encodeURIComponent(release.name)}`)}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${release.name}`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              {getStateIcon(release.state)}
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-semibold truncate">
                  {release.tenant?.name ? `${release.tenant.name}: ` : ''}{release.name}
                </span>
                <StateBadge state={release.state as any} />
                <button
                  type="button"
                  aria-label="View Release Notes"
                  className="bg-white p-2 rounded hover:bg-gray-100 transition-colors shadow-sm ml-1"
                  onClick={e => {
                    e.stopPropagation();
                    router.push(`/releases/${encodeURIComponent(release.name)}/releasenotes`);
                  }}
                >
                  <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </div>
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
          </div>
          <div className="flex items-center space-x-2 justify-end ml-2">
            {isPast && (
              <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pb-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Targets</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {release.targets && release.targets.length > 0 ? (
                release.targets.map((target: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {target}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No targets</span>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className={`text-sm ${isUserMember() ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}>Members</p>
            <p className={`text-lg font-semibold ${isUserMember() ? 'text-blue-600' : ''}`}>{release.ready_members}/{release.total_members}</p>
          </div>
          <div className="space-y-1">
            <p className={`text-sm ${isUserDRI() ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}>
              Features
            </p>
            <p className={`text-lg font-semibold ${isUserDRI() ? 'text-blue-600' : ''}`}>
              {release.ready_features}/{release.feature_count}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Platform</p>
            <Badge variant={release.platform_update ? "default" : "secondary"}>
              {release.platform_update ? "Yes" : "No"}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Specs</p>
            <Badge variant={release.config_update ? "default" : "secondary"}>
              {release.config_update ? "Yes" : "No"}
            </Badge>
          </div>
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
        </div>
      </CardContent>
    </Card>
  );
}; 