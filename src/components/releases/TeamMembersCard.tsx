import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { AddTeamDialog } from "./AddTeamDialog";
import { TeamMemberCard } from "./TeamMemberCard";
import { useMemo, useEffect, useRef } from "react";

interface TeamMembersCardProps {
  uniqueMembers: any[];
  user: any;
  release: any;
  daysUntilRelease: number;
  updateMemberReady: (releaseId: string, memberId: string, isReady: boolean) => void;
  onTeamsUpdated: () => void;
  onTeamsChanged?: (addedTeams: string[], removedTeams: string[]) => void;
  onTeamsReadyStateChange?: (isReady: boolean) => void;
}

export function TeamMembersCard({
  uniqueMembers,
  user,
  release,
  daysUntilRelease,
  updateMemberReady,
  onTeamsUpdated,
  onTeamsChanged,
  onTeamsReadyStateChange
}: TeamMembersCardProps) {
  // Calculate internal is_ready state - all team members must be ready (AND operation)
  const isReady = useMemo(() => {
    return uniqueMembers.length > 0 && uniqueMembers.every(member => member.is_ready);
  }, [uniqueMembers]);

  // Track previous state to only notify on actual changes
  const prevIsReadyRef = useRef<boolean | null>(null);

  // Notify parent when internal is_ready state changes (but not on initial load)
  useEffect(() => {
    // Only call callback if we have a previous state (not initial load) and the state actually changed
    if (prevIsReadyRef.current !== null && prevIsReadyRef.current !== isReady) {
      onTeamsReadyStateChange?.(isReady);
    }
    // Update the previous state reference
    prevIsReadyRef.current = isReady;
  }, [isReady, onTeamsReadyStateChange]);

  return (
    <Card className={`w-full md:w-1/2 border-1 shadow-none ${isReady ? 'bg-green-50 border-green-200' : ''}`}>
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