import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { AddTeamDialog } from "./AddTeamDialog";
import { TeamMemberCard } from "./TeamMemberCard";

interface TeamMembersCardProps {
  uniqueMembers: any[];
  user: any;
  release: any;
  daysUntilRelease: number;
  updateMemberReady: (releaseId: string, memberId: string, isReady: boolean) => void;
  onTeamsUpdated: () => void;
  onTeamsChanged?: (addedTeams: string[], removedTeams: string[]) => void;
}

export function TeamMembersCard({
  uniqueMembers,
  user,
  release,
  daysUntilRelease,
  updateMemberReady,
  onTeamsUpdated,
  onTeamsChanged
}: TeamMembersCardProps) {
  return (
    <Card className="w-full md:w-1/2 border-1 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center">
          <Users className="h-4 w-4 mr-2" />Team Member Readiness
        </CardTitle>
        <AddTeamDialog
          releaseId={release.id}
          releaseName={release.name}
          onTeamsUpdated={onTeamsUpdated}
          currentTeams={release.teams || []}
          onTeamsChanged={onTeamsChanged}
        />
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {uniqueMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members assigned to this release.</p>
          ) : (
            uniqueMembers.map((member: any) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                user={user}
                release={release}
                daysUntilRelease={daysUntilRelease}
                updateMemberReady={updateMemberReady}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 