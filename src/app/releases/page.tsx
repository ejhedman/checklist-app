"use client";

import { useState } from "react";
import { CreateReleaseDialog } from "@/components/releases/CreateReleaseDialog";
import { ReleaseSummaryCard } from "@/components/releases/ReleaseSummaryCard";
import { useReleases } from "@/hooks/useReleases";
import { LoadingSpinner } from "@/components/ui/loading";

export default function ReleasesPage() {
  const [showArchived, setShowArchived] = useState(false);
  // const { selectedProject } = useAuth();
  const { releases, loading, error, refetch } = useReleases({ showArchived });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Scheduled Releases</h1>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="accent-primary"
            />
            Show archived
          </label>
        </div>
        <CreateReleaseDialog onReleaseSaved={refetch} />
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Loading releases..." />
        </div>
      ) : (
        <>
          {releases.map((release) => (
            <div className="space-y-4" key={release.id}>
              <ReleaseSummaryCard
                key={release.id}
                release={release}
                onReleaseUpdated={refetch}
                collapsible={true}
                initialExpanded={false}
                allReleases={releases}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
} 