import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface FeatureCardProps {
  feature: any;
  user: any;
  updatingFeature: boolean;
  handleFeatureReadyChange: (feature: any, isReady: boolean) => void;
}

export default function FeatureCard({ feature, user, updatingFeature, handleFeatureReadyChange }: FeatureCardProps) {
  return (
    <div className="p-3 border rounded-lg">
      {/* Top row: Feature name, DRI info, Ready badge/checkbox */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
        {/* Left: Feature name and badges */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <h5 className="font-medium truncate">{feature.name}</h5>
          {feature.is_platform && (
            <Badge variant="outline" className="text-xs">Platform</Badge>
          )}
          {feature.is_config && (
            <Badge variant="outline" className="text-xs">Config</Badge>
          )}
        </div>
        {/* Center: DRI info */}
        <div className="flex flex-col items-center min-w-[120px] md:w-1/4">
          {feature.dri_user ? (
            <>
              <span className="text-xs font-semibold text-muted-foreground mb-0.5">DRI:</span>
              <span className="text-sm font-medium truncate">{feature.dri_user.full_name}</span>
              <span className="text-xs text-muted-foreground truncate">{feature.dri_user.email}</span>
              {user && user.id === feature.dri_user.id && (
                <span className="text-xs text-blue-600 font-medium">(You are the DRI)</span>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No DRI assigned</span>
          )}
        </div>
        {/* Right: Ready badge and DRI checkbox */}
        <div className="flex flex-col items-end justify-center min-w-[110px] md:w-1/4">
          <span className={feature.is_ready ? "text-xs mb-1 px-2 py-1 rounded bg-green-600 text-white" : "text-xs mb-1 px-2 py-1 rounded bg-amber-400 text-black"}>
            {feature.is_ready ? "Ready" : "Not Ready"}
          </span>
          {/* Show checkbox only if not ready and user is DRI */}
          {!feature.is_ready && user && feature.dri_user && user.id === feature.dri_user.id && (
            <div className="flex flex-col items-center">
              <Checkbox
                checked={false}
                onCheckedChange={() => handleFeatureReadyChange(feature, true)}
                disabled={updatingFeature}
                id={`feature-ready-${feature.id}`}
              />
              <label htmlFor={`feature-ready-${feature.id}`} className="text-xs text-muted-foreground mt-1 cursor-pointer select-none">
                Ready
              </label>
            </div>
          )}
        </div>
      </div>
      {/* Second row: Description, JIRA, Comments */}
      <div className="mt-2 space-y-1">
        {feature.description && (
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        )}
        {feature.jira_ticket && (
          <p className="text-xs text-muted-foreground">JIRA: {feature.jira_ticket}</p>
        )}
        {feature.comments && (
          <p className="text-xs text-muted-foreground italic">Comments: {feature.comments}</p>
        )}
      </div>
    </div>
  );
} 