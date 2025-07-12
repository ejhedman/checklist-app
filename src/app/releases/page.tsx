"use client";

import { useState } from "react";
import { CreateReleaseDialog } from "@/components/releases/CreateReleaseDialog";
import { ReleaseSummaryCard } from "@/components/releases/ReleaseSummaryCard";
import { useReleases } from "@/hooks/useReleases";
import { LoadingSpinner } from "@/components/ui/loading";
import { SquarePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ReleasesPage() {
  const [showArchived, setShowArchived] = useState(false);
  const { releases, loading, refetch } = useReleases({ showArchived });
  const { is_release_manager } = useAuth();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        {/* Mobile: title left, plus icon right, checkbox below; Desktop: all in one row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          {/* Top row: title and plus icon */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">Scheduled Releases</h1>
              {/* Desktop: Show archived checkbox next to title */}
              <label className="hidden sm:flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={e => setShowArchived(e.target.checked)}
                  className="accent-primary"
                />
                Show archived
              </label>
            </div>
            {/* Plus icon: always top right */}
            {is_release_manager && (
              <CreateReleaseDialog onReleaseSaved={refetch} />
            )}
          </div>
          {/* Mobile: Show archived checkbox below title */}
          <label className="flex sm:hidden items-center gap-2 text-sm mt-1">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => setShowArchived(e.target.checked)}
              className="accent-primary"
            />
            Show archived
          </label>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Loading releases..." />
        </div>
      ) : (
        <>
          {releases.map((release) => (
            <div className="space-y-3 sm:space-y-4" key={release.id}>
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