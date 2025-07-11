import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { AddFeatureDialog } from "./AddFeatureDialog";
import FeatureCard from "./FeatureCard";
import { useMemo, useEffect, useRef } from "react";

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
  onFeaturesReadyStateChange?: (isReady: boolean) => void;
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
  onFeatureEdited,
  onFeaturesReadyStateChange
}: FeaturesCardProps) {
  // Calculate internal is_ready state - all features must be ready (AND operation)
  const isReady = useMemo(() => {
    return features.length > 0 && features.every(feature => feature.is_ready);
  }, [features]);

  // Track previous state to only notify on actual changes
  const prevIsReadyRef = useRef<boolean | null>(null);

  // Notify parent when internal is_ready state changes (but not on initial load)
  useEffect(() => {
    // Only call callback if we have a previous state (not initial load) and the state actually changed
    if (prevIsReadyRef.current !== null && prevIsReadyRef.current !== isReady) {
      onFeaturesReadyStateChange?.(isReady);
    }
    // Update the previous state reference
    prevIsReadyRef.current = isReady;
  }, [isReady, onFeaturesReadyStateChange]);

  return (
    <Card className={`w-full md:w-1/2 border-1 shadow-none ${isReady ? 'bg-green-50 border-green-200' : ''}`}>
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