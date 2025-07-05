import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function getStateColor(state: string) {
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
}

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

export default function ReleaseDetailCard({ release, onMemberReadyChange } : {
  release: any,
  onMemberReadyChange?: (releaseId: string, userId: string, isReady: boolean) => void
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
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
          </div>
          <div className="space-y-2">
            {release.features.length === 0 ? (
              <p className="text-sm text-muted-foreground">No features added yet.</p>
            ) : (
              release.features.map((feature: any) => (
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
              release.teams.map((team: any) => (
                <div key={team.id} className="border rounded-lg p-4">
                  <h5 className="font-medium text-sm mb-2">{team.name}</h5>
                  {team.description && (
                    <p className="text-xs text-muted-foreground mb-3">{team.description}</p>
                  )}
                  <div className="space-y-2">
                    {team.members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No members in this team.</p>
                    ) : (
                      team.members.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            {onMemberReadyChange && (
                              <Checkbox
                                checked={member.is_ready}
                                onCheckedChange={(checked) => 
                                  onMemberReadyChange(release.id, member.id, checked as boolean)
                                }
                              />
                            )}
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
  );
} 