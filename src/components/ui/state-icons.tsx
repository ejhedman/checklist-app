import React from "react";
// import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  ReleaseState, 
  getStateBadgeConfig, 
  getStateDisplayText,
  getStatePaleBackgroundColor 
} from "@/lib/state-colors";

interface StateBadgeProps {
  state: ReleaseState;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function StateBadge({ state, className, variant }: StateBadgeProps) {
  const config = getStateBadgeConfig(state);
  const displayText = getStateDisplayText(state);

  return (
    <Badge 
      variant={variant || config.variant}
      className={cn(config.className, className)}
    >
      {displayText}
    </Badge>
  );
}

// Re-export the shared function for backward compatibility
export { getStatePaleBackgroundColor as getStateBackgroundColor }; 