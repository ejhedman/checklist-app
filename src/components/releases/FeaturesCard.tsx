import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { AddFeatureDialog } from "./AddFeatureDialog";
import FeatureCard from "./FeatureCard";

interface FeaturesCardProps {
  features: any[];
  user: any;
  memberId: string;
  updatingFeature: boolean;
  handleFeatureReadyChange: (feature: any, isReady: boolean) => void;
  onFeatureUpdated: () => void;
  releaseName: string;
  daysUntilRelease: number;
  releaseId: string;
  onFeatureChanged?: (newFeature: any) => void;
  onFeatureEdited?: (updatedFeature: any) => void;
}

export function FeaturesCard({
  features,
  user,
  memberId,
  updatingFeature,
  handleFeatureReadyChange,
  onFeatureUpdated,
  releaseName,
  daysUntilRelease,
  releaseId,
  onFeatureChanged,
  onFeatureEdited
}: FeaturesCardProps) {
  return (
    <Card className="w-full md:w-1/2 border-1 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center">
          <FileText className="h-4 w-4 mr-2" />Key Feature Readiness
        </CardTitle>
        <AddFeatureDialog
          releaseId={releaseId}
          releaseName={releaseName}
          onFeatureAdded={onFeatureUpdated}
          onFeatureChanged={onFeatureChanged}
        />
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {features.length === 0 ? (
            <p className="text-sm text-muted-foreground">No features added yet.</p>
          ) : (
            [...features]
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
              .map((feature: any) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  user={user}
                  memberId={memberId}
                  updatingFeature={updatingFeature}
                  handleFeatureReadyChange={handleFeatureReadyChange}
                  onFeatureUpdated={onFeatureUpdated}
                  releaseName={releaseName}
                  daysUntilRelease={daysUntilRelease}
                  onFeatureEdited={onFeatureEdited}
                />
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 