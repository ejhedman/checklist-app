"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReleaseNotesDisplay } from "@/components/releasenotes/ReleaseNotesDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { ReleaseNotesRepository } from "@/lib/repository";

export default function DisplayReleaseNotesPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { selectedProject, user } = useAuth();
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  const [releaseSummary, setReleaseSummary] = useState<string>("");
  const [releaseName, setReleaseName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const releaseNotesRepository = useMemo(() => new ReleaseNotesRepository(), []);

  useEffect(() => {
    const fetchReleaseNotes = async () => {
      setLoading(true);
      setError(null);
      
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
      
      try {
        // Find release by name (slug) and project
        const release = await releaseNotesRepository.getReleaseBySlug(decodeURIComponent(slug as string));
        
        // Additional validation: check if the release's project matches the selected project
        if (release.project_id !== selectedProject.id) {
          console.log('Release project does not match selected project, redirecting to home');
          router.push('/');
          return;
        }
        
        setReleaseName(release.name);
        setReleaseNotes(release.release_notes || "");
        setReleaseSummary(release.release_summary || "");
      } catch (error) {// eslint-disable-line @typescript-eslint/no-unused-vars
        // Release not found or doesn't belong to selected project - redirect to home
        console.log('Release not found or project mismatch, redirecting to home');
        router.push('/');
        return;
      }
      
      setLoading(false);
    };
    
    if (selectedProject) {
      fetchReleaseNotes();
    }
  }, [slug, releaseNotesRepository, router, user, selectedProject]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
        <div className="p-4 sm:p-8 text-center text-muted-foreground">Loading release notes...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
        <div className="p-4 sm:p-8 text-center text-red-500">{error}</div>
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