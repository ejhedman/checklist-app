import React from "react";

export function ReleaseDetailBottomCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border bg-white rounded-lg shadow-sm">
      <div className="p-4">{children}</div>
    </div>
  );
} 