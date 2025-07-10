import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { EditTeamDialog } from "./EditTeamDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export interface Team {
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
    member_id: string;
  }>;
}

interface TeamCardProps {
  team: Team;
  expanded: boolean;
  onToggleExpand: (teamId: string) => void;
  onTeamUpdated: () => void;
}

export function TeamCard({ team, expanded, onToggleExpand, onTeamUpdated }: TeamCardProps) {
  const { user } = useAuth();
  
  // Check if the logged-in user belongs to this team
  const isUserInTeam = user?.email && team.members.some(member => member.email === user.email);
  
  console.log("team.members for team", team.name, team.members);
  
  // TODO: Add delete dialog logic if needed
  return (
    <Card className={isUserInTeam ? "bg-blue-50 border-blue-200" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            {team.name}
          </CardTitle>
          <div className="flex items-center space-x-1">
            <EditTeamDialog team={team} onTeamUpdated={onTeamUpdated} />
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>{team.description || "No description"}</CardDescription>
      </CardHeader>
      <CardContent className="pb-1">
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
                    onClick={() => onToggleExpand(team.id)}
                    className="h-6 w-6 p-0"
                  >
                    {expanded ? (
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
              <p className="text-lg font-semibold">{team.active_releases}</p>
            </div>
          </div>

          {/* Expanded Members List */}
          {expanded && team.members && team.members.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Team Members</h4>
              <div className="space-y-2">
                {team.members.map((member) => (
                  <div key={member.member_id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
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
  );
} 