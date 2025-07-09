"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { ReleaseNotesDisplay } from "@/components/releasenotes/ReleaseNotesDisplay";
import { useAuth } from "@/contexts/AuthContext";

export default function DisplayReleaseNotesPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { selectedProject, user } = useAuth();
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
      
      // Check if user is authenticated and project is selected
      if (!user) {
        setError("No authenticated user found");
        setLoading(false);
        return;
      }

      if (!selectedProject) {
        setError("No project selected");
        setLoading(false);
        return;
      }
      
      // Find release by name (slug) and project
      const { data, error } = await supabase
        .from("releases")
        .select("id, name, release_notes, release_summary, project_id")
        .eq("name", decodeURIComponent(slug as string))
        .eq("project_id", selectedProject.id)
        .single();
        
      if (error) {
        // Release not found or doesn't belong to selected project - redirect to home
        console.log('Release not found or project mismatch, redirecting to home');
        router.push('/');
        return;
      }

      // Additional validation: check if the release's project matches the selected project
      if (data.project_id !== selectedProject.id) {
        console.log('Release project does not match selected project, redirecting to home');
        router.push('/');
        return;
      }
      
      setReleaseName(data.name);
      setReleaseNotes(data.release_notes || "");
      setReleaseSummary(data.release_summary || "");
      setLoading(false);
    };
    
    if (selectedProject) {
      fetchReleaseNotes();
    }
  }, [slug, selectedProject]);

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