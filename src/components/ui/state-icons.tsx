import React from "react";
import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ReleaseState = "past_due" | "ready" | "pending" | "complete" | "cancelled";

interface ReleaseStateIconProps {
  state: ReleaseState;
  className?: string;
  size?: number;
}

export function ReleaseStateIcon({ state, className, size = 16 }: ReleaseStateIconProps) {
  const iconConfig = {
    past_due: { icon: AlertTriangle, className: "text-red-500" },
    ready: { icon: CheckCircle, className: "text-green-500" },
    pending: { icon: Clock, className: "text-amber-500" },
    complete: { icon: CheckCircle, className: "text-blue-500" },
    cancelled: { icon: Calendar, className: "text-gray-500" }
  };

  const config = iconConfig[state] || iconConfig.pending;
  const IconComponent = config.icon;

  return (
    <IconComponent 
      className={cn(config.className, className)} 
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
  const badgeConfig = {
    past_due: { 
      className: "bg-red-500 text-white", 
      variant: "destructive" as const 
    },
    ready: { 
      className: "bg-green-600 text-white", 
      variant: "default" as const 
    },
    pending: { 
      className: "bg-amber-400 text-black", 
      variant: "default" as const 
    },
    complete: { 
      className: "bg-blue-500 text-white", 
      variant: "default" as const 
    },
    cancelled: { 
      className: "bg-gray-500 text-white", 
      variant: "secondary" as const 
    }
  };

  const config = badgeConfig[state] || badgeConfig.pending;
  const displayText = state.replace("_", " ");

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

// Helper function to get background color for state
export function getStateBackgroundColor(state: ReleaseState, isArchived?: boolean): string {
  if (isArchived) return "bg-gray-200";
  
  const colorMap = {
    ready: "bg-green-50",
    pending: "bg-amber-50", 
    past_due: "bg-red-50",
    complete: "bg-blue-50",
    cancelled: "bg-gray-50"
  };
  
  return colorMap[state] || "bg-gray-50";
} 