export type ReleaseState = "past_due" | "next" | "pending";

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
    background: "bg-blue-600",
    backgroundPale: "bg-blue-50",
    text: "text-white",
    icon: "text-blue-600",
    badge: "bg-blue-600 text-white",
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
  cancelled: {
    background: "bg-red-600",
    backgroundPale: "bg-red-50",
    text: "text-white",
    icon: "text-red-600",
    badge: "bg-red-600 text-white",
    badgeVariant: "default" as const
  },
  deployed: {
    background: "bg-green-600",
    backgroundPale: "bg-green-50",
    text: "text-white",
    icon: "text-green-600",
    badge: "bg-green-600 text-white",
    badgeVariant: "default" as const
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

// import React from "react";
// import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
