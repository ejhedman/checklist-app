import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface TeamMemberCardProps {
  member: any;
  user: any;
  release: any;
  daysUntilRelease: number;
  updateMemberReady: (releaseId: string, memberId: string, isReady: boolean) => void;
}

export function TeamMemberCard({ member, user, release, daysUntilRelease, updateMemberReady }: TeamMemberCardProps) {
  // Find all teams this member belongs to
  const memberTeams = Array.isArray(release.teams)
    ? release.teams.filter((team: any) =>
        team.members.some((m: any) => m.id === member.id)
      )
    : [];
  // Determine badge color for not ready
  const notReadyClass = daysUntilRelease < 3
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-amber-100 text-amber-800 border-amber-200';
  return (
    <div
      key={member.id}
      className={`grid grid-cols-3 items-center p-2 rounded border ${user && member.email === user.email ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
    >
      {/* Nickname/Name (left) */}
      <div className="text-sm font-medium text-left truncate">
        {member.nickname || member.full_name}
      </div>
      {/* Team badges (left-aligned in column) */}
      <div className="flex flex-row flex-wrap gap-1 justify-start items-center">
        {memberTeams.map((team: any) => (
          <Badge key={team.id} variant="secondary" className="text-xs">
            {team.name}
          </Badge>
        ))}
      </div>
      {/* Ready state/checkbox (right, right-aligned) */}
      <div className="flex items-center space-x-2 justify-end">
        {/* Only show the Ready label and checkbox for the logged-in user */}
        {user && member.email === user.email && (
          <>
            <label htmlFor={`member-ready-${member.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">Ready</label>
            <Checkbox
              checked={member.is_ready}
              onCheckedChange={(checked) =>
                updateMemberReady(release.id, member.id, checked as boolean)
              }
              id={`member-ready-${member.id}`}
            />
          </>
        )}
        {/* Always show the Ready/Not Ready badge */}
        <Badge
          variant={member.is_ready ? "default" : "secondary"}
          className={`text-xs ${member.is_ready ? 'bg-green-100 text-green-800 border-green-200' : notReadyClass}`}
        >
          {member.is_ready ? "Ready" : "Not Ready"}
        </Badge>
      </div>
    </div>
  );
} 