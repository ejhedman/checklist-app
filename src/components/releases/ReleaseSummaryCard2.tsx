"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Pencil, AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function getStateIcon(state: string) {
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
}

// Helper to calculate days until target date
function getDaysUntil(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const today = new Date();
  const target = new Date(year, month - 1, day);
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

export interface ReleaseSummaryCard2Props {
  release: {
    id: string;
    name: string;
    target_date: string;
    state: string;
    platform_update: boolean;
    config_update: boolean;
    is_archived?: boolean;
    targets?: string[];
    tenant?: {
      id: string;
      name: string;
    };
    teams?: Array<{
      id: string;
      name: string;
      members: Array<{
        id: string;
        full_name: string;
        email: string;
        nickname: string;
        tenant_id: string;
        is_ready: boolean;
      }>;
    }>;
    total_members: number;
    ready_members: number;
    feature_count: number;
    ready_features: number;
  };
  onEditClick?: () => void;
}

export function ReleaseSummaryCard2({ release, onEditClick }: ReleaseSummaryCard2Props) {
  const { user, memberId } = useAuth();
  const router = useRouter();

  // Check if the current user is a DRI on any features
  const isUserDRI = () => {
    // This would need to be passed in or calculated based on features data
    return false;
  };

  // Check if the current user is a member of any teams in this release
  const isUserMember = () => {
    if (!memberId || !release.teams) return false;
    return release.teams.some((team: any) =>
      team.members?.some((member: any) => member.id === memberId)
    );
  };

  return (
    <Card className="w-full rounded-lg">
      <CardHeader className={`relative flex flex-row items-center justify-between border-b ${getPaleBgForState(release.state, release.is_archived)}`}>
        <div className="relative w-full flex items-center" style={{ minHeight: '48px' }}>
          <div className="flex items-center gap-3">
            {getStateIcon(release.state)}
            <CardTitle className="truncate text-lg">
              <div className="flex items-center gap-3">
                <span>{release.tenant?.name ? `${release.tenant.name}: ` : ''}{release.name}</span>
                {release.state === "ready" ? (
                  <Badge className="bg-green-600 text-white" variant="default">
                    {release.state.replace("_", " ")}
                  </Badge>
                ) : release.state === "pending" ? (
                  <Badge className="bg-amber-400 text-black" variant="default">
                    {release.state.replace("_", " ")}
                  </Badge>
                ) : release.state === "past_due" ? (
                  <Badge className="bg-red-500 text-white" variant="default">
                    {release.state.replace("_", " ")}
                  </Badge>
                ) : release.state === "complete" ? (
                  <Badge className="bg-blue-500 text-white" variant="default">
                    {release.state.replace("_", " ")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {release.state.replace("_", " ")}
                  </Badge>
                )}
                <button
                  type="button"
                  aria-label="View Release Notes"
                  className="bg-white p-2 rounded hover:bg-gray-100 transition-colors shadow-sm ml-1"
                  onClick={() => router.push(`/releases/${encodeURIComponent(release.name)}/releasenotes`)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </div>
            </CardTitle>
          </div>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {(() => {
              const days = getDaysUntil(release.target_date);
              const [year, month, day] = release.target_date.split('-');
              const dateStr = `${Number(month)}/${Number(day)}/${year}`;
              return `Target Date: ${dateStr} (${days} days)`;
            })()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded bg-white hover:bg-gray-100 transition-colors text-gray-900 shadow-sm"
            onClick={onEditClick}
            aria-label="Edit Release"
            type="button"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
            <p className={`text-sm ${isUserDRI() ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}>Features</p>
            <p className={`text-lg font-semibold ${isUserDRI() ? 'text-blue-600' : ''}`}>{release.ready_features}/{release.feature_count}</p>
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
              {release.teams && release.teams.length > 0 ? (
                release.teams.map((team: any) => (
                  <Badge key={team.id} variant="secondary" className="text-xs">
                    {team.name}
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
} 