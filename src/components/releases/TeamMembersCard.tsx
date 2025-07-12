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
  const hasReportedInitialState = useRef<boolean>(false);

  // Notify parent when internal is_ready state changes (including initial state)
  useEffect(() => {
    // Report initial state immediately upon mounting
    if (!hasReportedInitialState.current) {
      onTeamsReadyStateChange?.(isReady);
      hasReportedInitialState.current = true;
      prevIsReadyRef.current = isReady;
      return;
    }

    // Only call callback if the state actually changed (not on initial load)
    if (prevIsReadyRef.current !== null && prevIsReadyRef.current !== isReady) {
      onTeamsReadyStateChange?.(isReady);
    }
    // Update the previous state reference
    prevIsReadyRef.current = isReady;
  }, [isReady, onTeamsReadyStateChange]);

  return (
    <Card className={`w-full lg:w-1/2 border-1 shadow-none ${isReady ? 'bg-green-50 border-green-200' : ''}`}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-4 sm:px-6">
        <CardTitle className="text-sm sm:text-base flex items-center">
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />Team Member Readiness
        </CardTitle>
        <AddTeamDialog
          releaseId={release.id}
          releaseName={release.name}
          onTeamsUpdated={onTeamsUpdated}
          currentTeams={release.teams || []}
          onTeamsChanged={onTeamsChanged}
        />
      </CardHeader>
      <CardContent className="pb-4 px-4 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          {uniqueMembers.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">No members assigned to this release.</p>
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