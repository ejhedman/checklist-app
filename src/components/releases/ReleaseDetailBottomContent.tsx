import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Users } from "lucide-react";
import FeatureCard from "./FeatureCard";
import { AddFeatureDialog } from "./AddFeatureDialog";
import { AddTeamDialog } from "./AddTeamDialog";
import React from "react";
import { TeamMemberCard } from "./TeamMemberCard";
import { FeaturesCard } from "./FeaturesCard";
import { TeamMembersCard } from "./TeamMembersCard";

// Helper to calculate days until release date
function getDaysUntilRelease(targetDate: string) {
  const today = new Date();
  const releaseDate = new Date(targetDate);
  // Zero out time for accurate day diff
  today.setHours(0,0,0,0);
  releaseDate.setHours(0,0,0,0);
  return Math.ceil((releaseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function ReleaseDetailBottomContent({
  release,
  user,
  memberId,
  features,
  uniqueMembers,
  updatingFeature,
  handleFeatureReadyChange,
  updateMemberReady,
  onFeatureUpdated,
  onTeamsChanged,
  onFeatureChanged,
  onFeatureEdited
}: {
  release: any,
  user: any,
  memberId: string,
  features: any[],
  uniqueMembers: any[],
  updatingFeature: boolean,
  handleFeatureReadyChange: (feature: any, isReady: boolean) => void,
  updateMemberReady: (releaseId: string, memberId: string, isReady: boolean) => void,
  onFeatureUpdated: () => void,
  onTeamsChanged?: (addedTeams: string[], removedTeams: string[]) => void,
  onFeatureChanged?: (newFeature: any) => void,
  onFeatureEdited?: (updatedFeature: any) => void
}) {
  const daysUntilRelease = getDaysUntilRelease(release.target_date);

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full pb-4">
      {/* Features Card */}
      <FeaturesCard
        features={features}
        user={user}
        memberId={memberId}
        updatingFeature={updatingFeature}
        handleFeatureReadyChange={handleFeatureReadyChange}
        onFeatureUpdated={onFeatureUpdated}
        releaseName={release.name}
        daysUntilRelease={daysUntilRelease}
        releaseId={release.id}
        onFeatureChanged={onFeatureChanged}
        onFeatureEdited={onFeatureEdited}
      />
      {/* Teams Card */}
      <TeamMembersCard
        uniqueMembers={uniqueMembers}
        user={user}
        release={release}
        daysUntilRelease={daysUntilRelease}
        updateMemberReady={updateMemberReady}
        onTeamsUpdated={onFeatureUpdated}
        onTeamsChanged={onTeamsChanged}
      />
    </div>
  );
} 