import React from "react";
import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  ReleaseState, 
  getStateIconColor, 
  getStateBadgeConfig, 
  getStateDisplayText,
  getStatePaleBackgroundColor 
} from "@/lib/state-colors";

interface ReleaseStateIconProps {
  state: ReleaseState;
  className?: string;
  size?: number;
}

export function ReleaseStateIcon({ state, className, size = 16 }: ReleaseStateIconProps) {
  const iconConfig = {
    past_due: { icon: AlertTriangle },
    next: { icon: CheckCircle },
    pending: { icon: Clock }
  };

  const config = iconConfig[state] || iconConfig.pending;
  const IconComponent = config.icon;
  const iconColor = getStateIconColor(state);

  return (
    <IconComponent 
      className={cn(iconColor, className)} 
      size={size}
    />
  );
}

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

interface StateIndicatorProps {
  state: ReleaseState;
  showIcon?: boolean;
  showBadge?: boolean;
  iconSize?: number;
  className?: string;
}

export function StateIndicator({ 
  state, 
  showIcon = true, 
  showBadge = true, 
  iconSize = 16,
  className 
}: StateIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && <ReleaseStateIcon state={state} size={iconSize} />}
      {showBadge && <StateBadge state={state} />}
    </div>
  );
}

// Re-export the shared function for backward compatibility
export { getStatePaleBackgroundColor as getStateBackgroundColor }; 