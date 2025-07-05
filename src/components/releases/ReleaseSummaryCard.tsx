import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import React from "react";

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
  };
  getStateColor: (state: string) => string;
  getStateIcon: (state: string) => React.ReactNode;
}

// Map release state to a pale background color
function getPaleBgForState(state: string) {
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

// Helper to calculate days until target date
function getDaysUntil(dateString: string) {
  const today = new Date();
  const target = new Date(dateString);
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export const ReleaseSummaryCard: React.FC<ReleaseSummaryCardProps> = ({
  release,
  getStateColor,
  getStateIcon,
}) => {
  return (
    <Card className={`hover:shadow-md transition-shadow ${getPaleBgForState(release.state)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${getStateColor(release.state)}`} />
            <CardTitle className="flex items-center">
              {getStateIcon(release.state)}
              <Link
                href={`/releases/${encodeURIComponent(release.name)}`}
                className="ml-2 flex items-center hover:underline cursor-pointer group"
              >
                <span>{release.name}</span>
                <ExternalLink className="h-4 w-4 ml-1 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            </CardTitle>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <CardDescription>
              Target Date: {new Date(release.target_date).toLocaleDateString()} ({getDaysUntil(release.target_date)} days)
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
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
            <p className="text-lg font-semibold">{release.team_count}</p>
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
            <p className="text-sm text-muted-foreground">Config Update</p>
            <Badge variant={release.config_update ? "default" : "secondary"}>
              {release.config_update ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 