"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ReleaseNotesSummaryCard } from "@/components/releasenotes/ReleaseNotesSummaryCard";

export default function ReleaseNotesListPage() {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReleases = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("releases")
        .select("id, name, target_date, release_summary, state")
        .order("target_date", { ascending: false });
      setReleases(data || []);
      setLoading(false);
    };
    fetchReleases();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading release notes...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Release Notes</h1>
      {releases.length === 0 ? (
        <div className="text-muted-foreground">No releases found.</div>
      ) : (
        <div className="space-y-4">
          {releases.map((release) => (
            <ReleaseNotesSummaryCard key={release.id} release={release} />
          ))}
        </div>
      )}
    </div>
  );
} 