import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { AddFeatureDialog } from "./AddFeatureDialog";
import FeatureCard from "./FeatureCard";
import { useMemo, useEffect, useRef, useState } from "react";

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
  const [localFeatures, setLocalFeatures] = useState(features);

  useEffect(() => {
    setLocalFeatures(features);
  }, [features]);

  const handleFeatureEdited = (updatedFeature: any) => {
    setLocalFeatures((prev) =>
      prev.map((f) => (f.id === updatedFeature.id ? updatedFeature : f))
    );
    if (onFeatureEdited) onFeatureEdited(updatedFeature);
  };

  // Calculate internal is_ready state - all features must be ready (AND operation)
  const isReady = useMemo(() => {
    return localFeatures.length > 0 && localFeatures.every(feature => feature.is_ready);
  }, [localFeatures]);

  // Track previous state to only notify on actual changes
  const prevIsReadyRef = useRef<boolean | null>(null);
  const hasReportedInitialState = useRef<boolean>(false);

  // Notify parent when internal is_ready state changes (including initial state)
  useEffect(() => {
    // Report initial state immediately upon mounting
    if (!hasReportedInitialState.current) {
      onFeaturesReadyStateChange?.(isReady);
      hasReportedInitialState.current = true;
      prevIsReadyRef.current = isReady;
      return;
    }

    // Only call callback if the state actually changed (not on initial load)
    if (prevIsReadyRef.current !== null && prevIsReadyRef.current !== isReady) {
      onFeaturesReadyStateChange?.(isReady);
    }
    // Update the previous state reference
    prevIsReadyRef.current = isReady;
  }, [isReady, onFeaturesReadyStateChange]);

  return (
    <Card className={`w-full lg:w-1/2 border-1 shadow-none ${isReady ? 'bg-green-50 border-green-200' : ''}`}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-4 sm:px-6">
        <CardTitle className="text-sm sm:text-base flex items-center">
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />Key Feature Readiness
        </CardTitle>
        <AddFeatureDialog
          releaseId={releaseId}
          releaseName={releaseName}
          onFeatureAdded={onFeatureUpdated}
          onFeatureChanged={onFeatureChanged}
        />
      </CardHeader>
      <CardContent className="pb-4 px-4 sm:px-6">
        <div className="space-y-2 sm:space-y-3">
          {localFeatures.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">No features added yet.</p>
          ) : (
            [...localFeatures]
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
                  onFeatureEdited={handleFeatureEdited}
                />
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 