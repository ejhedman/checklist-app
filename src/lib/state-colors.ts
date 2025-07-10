export type ReleaseState = "past_due" | "next" | "pending" | "deployed" | "cancelled";

// Color configurations for different use cases
const stateColorConfig = {
  past_due: {
    background: "bg-red-500",
    backgroundPale: "bg-red-50",
    text: "text-white",
    icon: "text-red-500",
    badge: "bg-red-500 text-white",
    badgeVariant: "destructive" as const
  },
  next: {
    background: "bg-green-500",
    backgroundPale: "bg-green-50",
    text: "text-white",
    icon: "text-green-500",
    badge: "bg-green-600 text-white",
    badgeVariant: "default" as const
  },
  pending: {
    background: "bg-yellow-300",
    backgroundPale: "bg-amber-50",
    text: "text-black",
    icon: "text-amber-500",
    badge: "bg-amber-400 text-black",
    badgeVariant: "default" as const
  },
  deployed: {
    background: "bg-blue-500",
    backgroundPale: "bg-blue-50",
    text: "text-white",
    icon: "text-blue-500",
    badge: "bg-blue-500 text-white",
    badgeVariant: "default" as const
  },
  cancelled: {
    background: "bg-gray-500",
    backgroundPale: "bg-gray-50",
    text: "text-white",
    icon: "text-gray-500",
    badge: "bg-gray-500 text-white",
    badgeVariant: "secondary" as const
  }
};

/**
 * Get the full color class for a state (background + text)
 * Used for calendar items and other full-color elements
 */
export function getStateColor(state: ReleaseState): string {
  const config = stateColorConfig[state] || stateColorConfig.pending;
  return `${config.background} ${config.text}`;
}

/**
 * Get just the background color for a state
 * Used for badges and other background-only elements
 */
export function getStateBackgroundColor(state: ReleaseState): string {
  const config = stateColorConfig[state] || stateColorConfig.pending;
  return config.background;
}

/**
 * Get the pale background color for a state
 * Used for card headers and subtle background indicators
 */
export function getStatePaleBackgroundColor(state: ReleaseState, isArchived?: boolean): string {
  if (isArchived) return "bg-gray-200";
  
  const config = stateColorConfig[state] || stateColorConfig.pending;
  return config.backgroundPale;
}

/**
 * Get the icon color for a state
 * Used for state icons
 */
export function getStateIconColor(state: ReleaseState): string {
  const config = stateColorConfig[state] || stateColorConfig.pending;
  return config.icon;
}

/**
 * Get the badge configuration for a state
 * Returns both className and variant for badge components
 */
export function getStateBadgeConfig(state: ReleaseState): {
  className: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const config = stateColorConfig[state] || stateColorConfig.pending;
  return {
    className: config.badge,
    variant: config.badgeVariant
  };
}

/**
 * Get the display text for a state
 * Converts snake_case to Title Case
 */
export function getStateDisplayText(state: ReleaseState): string {
  return state.replace("_", " ");
}

import React from "react";
import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";

/**
 * Get the React icon component for a state
 * Returns the appropriate Lucide icon component
 */
export function getStateIcon(state: ReleaseState): React.ReactNode {
  const iconConfig = {
    past_due: AlertTriangle,
    next: CheckCircle,
    pending: Clock,
    deployed: CheckCircle,
    cancelled: Calendar
  };
  
  const IconComponent = iconConfig[state] || iconConfig.pending;
  return React.createElement(IconComponent, { className: "h-4 w-4" });
} 