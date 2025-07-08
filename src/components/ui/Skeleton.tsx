import React from "react";

export function Skeleton({ height = 120 }: { height?: number }) {
  return (
    <div
      className="w-full bg-muted animate-pulse rounded-b-lg"
      style={{ height }}
    />
  );
} 