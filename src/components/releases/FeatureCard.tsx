import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface FeatureCardProps {
  feature: any;
  user: any;
  memberId: string | null;
  updatingFeature: boolean;
  handleFeatureReadyChange: (feature: any, isReady: boolean) => void;
}

export default function FeatureCard({ feature, user, memberId, updatingFeature, handleFeatureReadyChange }: FeatureCardProps) {
  const isDri = memberId && feature.dri_member && memberId === feature.dri_member.id;
  // Only the logged-in user who is the DRI can check the box (by memberId)
  const canMarkReady = memberId && feature.dri_member && memberId === feature.dri_member.id;
  return (
    <div className={`p-3 border rounded-lg ${isDri ? 'bg-blue-50 border-blue-200' : ''}`}>
      {/* Top row: Feature name: description (left), Platform/Specs badges (right) */}
      <div className="flex flex-row items-center justify-between w-full gap-2">
        <p className="text-sm text-muted-foreground flex-1 min-w-0 truncate">
          {feature.name}{feature.description ? `: ${feature.description}` : ''}
        </p>
        <div className="flex flex-row items-center space-x-2 min-w-[80px] justify-end">
          {feature.is_platform && (
            <Badge variant="outline" className="text-xs">Platform</Badge>
          )}
          {feature.is_config && (
            <Badge variant="outline" className="text-xs">Specs</Badge>
          )}
        </div>
      </div>
      {/* Bottom row: DRI info (left), JIRA and comments (center), Ready checkbox/state (right) */}
      <div className="mt-2 flex flex-row items-center w-full gap-2">
        {/* DRI info (left) */}
        <div className="min-w-[120px] md:w-1/4 flex flex-col items-start">
          {feature.dri_member ? (
            <span className="text-sm font-medium truncate flex items-center gap-1">
              <span className="text-xs font-semibold text-muted-foreground">DRI:</span>
              {feature.dri_member.nickname || feature.dri_member.full_name}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No DRI assigned</span>
          )}
        </div>
        {/* JIRA and comments (center) */}
        <div className="flex-1 min-w-0 flex flex-col items-center">
          {feature.jira_ticket && (
            <p className="text-xs text-muted-foreground truncate">JIRA: {feature.jira_ticket}</p>
          )}
          {feature.comments && (
            <p className="text-xs text-muted-foreground italic truncate">Comments: {feature.comments}</p>
          )}
        </div>
        {/* Ready checkbox/state (right) */}
        <div className="flex items-center min-w-[110px] md:w-1/4 justify-end">
          {canMarkReady ? (
            <>
              <label htmlFor={`feature-ready-${feature.id}`} className="text-xs text-muted-foreground cursor-pointer select-none mr-2">Ready</label>
              <Checkbox
                checked={feature.is_ready}
                onCheckedChange={(checked) => {
                  handleFeatureReadyChange(feature, checked === true);
                }}
                disabled={updatingFeature}
                id={`feature-ready-${feature.id}`}
              />
            </>
          ) : (
            <span className={feature.is_ready ? "text-xs mb-1 px-2 py-1 rounded bg-green-600 text-white" : "text-xs mb-1 px-2 py-1 rounded bg-amber-400 text-black"}>
              {feature.is_ready ? "Ready" : "Not Ready"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 