"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ReleaseNotesDisplay } from "@/components/releasenotes/ReleaseNotesDisplay";

export default function DisplayReleaseNotesPage() {
  const { slug } = useParams();
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  const [releaseSummary, setReleaseSummary] = useState<string>("");
  const [releaseName, setReleaseName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleaseNotes = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      
      // Get current user's member info for tenant filtering
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("No authenticated user found");
        setLoading(false);
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('tenant_id')
        .eq('email', user.email)
        .single();

      if (memberError || !member) {
        setError("No member record found for user");
        setLoading(false);
        return;
      }
      
      // Find release by name (slug) and tenant
      const { data, error } = await supabase
        .from("releases")
        .select("id, name, release_notes, release_summary")
        .eq("name", decodeURIComponent(slug as string))
        .eq("tenant_id", member.tenant_id)
        .single();
        
      if (error) {
        setError("Release not found");
        setLoading(false);
        return;
      }
      
      setReleaseName(data.name);
      setReleaseNotes(data.release_notes || "");
      setReleaseSummary(data.release_summary || "");
      setLoading(false);
    };
    
    fetchReleaseNotes();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="p-8 text-center text-muted-foreground">Loading release notes...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="p-8 text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <ReleaseNotesDisplay
      releaseName={releaseName}
      releaseNotes={releaseNotes}
      releaseSummary={releaseSummary}
    />
  );
} 