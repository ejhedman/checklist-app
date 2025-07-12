"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ReleaseNotesSummaryCard } from "@/components/releasenotes/ReleaseNotesSummaryCard";
import { useAuth } from "@/contexts/AuthContext";
import { ReleaseNotesRepository } from "@/lib/repository";

export default function ReleaseNotesListPage() {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedProject } = useAuth();
  // Memoize the repository
  const releaseNotesRepository = useMemo(() => new ReleaseNotesRepository(), []);

  // Memoize the fetch function
  const fetchReleases = useCallback(async () => {
    setLoading(true);
    if (!selectedProject) {
      console.error("No project selected");
      setReleases([]);
      setLoading(false);
      return;
    }
    try {
      const releases = await releaseNotesRepository.getReleasesForNotes();
      setReleases(releases);
    } catch (error) {
      console.error("Error fetching releases:", error);
      setReleases([]);
    }
    setLoading(false);
  }, [selectedProject, releaseNotesRepository]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 text-center text-muted-foreground">
        Loading release notes...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Release Notes</h1>
      {releases.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">No releases found.</div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {releases.map((release) => (
            <ReleaseNotesSummaryCard key={release.id} release={release} />
          ))}
        </div>
      )}
    </div>
  );
} 