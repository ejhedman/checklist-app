"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import ReleaseDetailCard from "@/components/releases/ReleaseDetailCard";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ReleasesRepository } from "@/lib/repository";


export default function ReleaseDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const [release, setRelease] = useState<any>(null);
  const [allReleases, setAllReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { selectedProject, user } = useAuth();
  const hasFetched = useRef(false);
  
  // Memoize the repository instance to prevent recreation on every render
  const releasesRepository = useMemo(() => new ReleasesRepository(), []);

  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  
  // Decode the URL parameter
  const decodedName = decodeURIComponent(resolvedParams.name);

  const fetchAllReleases = useCallback(async () => {
    if (!selectedProject) return;
    
    try {
      // Use the repository method instead of direct query to avoid 400 errors
      const releases = await releasesRepository.getReleases(selectedProject.id, {
        includeDetails: false,
        showArchived: false
      });
      
      // Transform to the format we need for allReleases
      const simplifiedReleases = releases.map(release => ({
        id: release.id,
        name: release.name,
        target_date: release.target_date,
        is_cancelled: release.is_cancelled,
        is_deployed: release.is_deployed
      }));
      
      setAllReleases(simplifiedReleases);
    } catch (error) {
      console.error("Error fetching all releases:", error);
      setAllReleases([]);
    }
  }, [selectedProject, releasesRepository]);

  const fetchRelease = useCallback(async () => {
    if (hasFetched.current) return; // Prevent multiple fetches
    hasFetched.current = true;
    
    setLoading(true);
    setError(null);
    
    // Check if user is authenticated and project is selected
    if (!user) {
      console.log('❌ No authenticated user found');
      setError("No authenticated user found");
      setLoading(false);
      return;
    }

    if (!selectedProject) {
      console.log('❌ No project selected');
      setError("No project selected");
      setLoading(false);
      return;
    }
    
    console.log('🔍 Fetching release:', { name: decodedName, projectId: selectedProject.id });
    
    try {
      // Use the ReleasesRepository method instead of direct query
      const data = await releasesRepository.getReleaseByName(decodedName, selectedProject.id);
      
      if (!data) {
        console.log('❌ No data returned from repository');
        console.log('Release not found or project mismatch, redirecting to home');
        router.push('/');
        return;
      }

      console.log('✅ Release found:', { id: data.id, name: data.name, projectId: data.project_id, selectedProjectId: selectedProject.id });

      // Additional validation: check if the release's project matches the selected project
      if (data.project_id !== selectedProject.id) {
        console.log('❌ Project mismatch:', { releaseProjectId: data.project_id, selectedProjectId: selectedProject.id });
        console.log('Release project does not match selected project, redirecting to home');
        router.push('/');
        return;
      }

      // Calculate total_members and ready_members
      const allMembers: any[] = [];
      if (data.release_teams) {
        data.release_teams.forEach((rt: any) => {
          if (rt.team && rt.team.team_members) {
            const members = Array.isArray(rt.team.team_members)
              ? rt.team.team_members
              : [rt.team.team_members];
            members.forEach((tm: any) => {
              allMembers.push(tm.member ? tm.member : tm);
            });
          }
        });
      }
      const total_members = allMembers.length;
      const ready_members = allMembers.filter((member) => {
        const memberId = member.id;
        const memberReadyState = data.member_release_state?.find((mrs: any) => mrs.member_id === memberId);
        return memberReadyState?.is_ready;
      }).length;

      // Transform the data to match the card props
      const transformedRelease = {
        ...data,
        team_count: data.release_teams?.length || 0,
        feature_count: data.features?.length || 0,
        ready_features: data.features?.filter((f: any) => f.is_ready)?.length || 0,
        features: data.features?.map((feature: any) => ({
          ...feature,
          dri_member: Array.isArray(feature.dri_member)
            ? feature.dri_member[0]
            : feature.dri_member,
        })) || [],
        teams: data.release_teams?.map((rt: any) => ({
          id: rt.team.id,
          name: rt.team.name,
          description: rt.team.description,
          members: (Array.isArray(rt.team.team_members)
            ? rt.team.team_members
            : (rt.team.team_members ? [rt.team.team_members] : [])
          ).map((tm: any) => {
            const memberReadyState = data.member_release_state?.find((mrs: any) => mrs.member_id === tm.member.id);
            return {
              id: tm.member.id,
              full_name: tm.member.full_name,
              email: tm.member.email,
              nickname: tm.member.nickname,
              project_id: tm.member.project_id,
              is_ready: memberReadyState?.is_ready || false,
            };
          }) || [],
        })) || [],
        total_members,
        ready_members,
        project: data.projects,
      };

      setRelease(transformedRelease);
      setLoading(false);
    } catch (error) {
      console.log('❌ Error fetching release:', error);
      console.log('Release not found or project mismatch, redirecting to home');
      router.push('/');
      return;
    }
  }, [selectedProject, user, decodedName, router]); // Removed releasesRepository from dependencies

  useEffect(() => {
    if (selectedProject && user) {
      fetchAllReleases();
      fetchRelease();
    }
  }, [fetchAllReleases, fetchRelease, selectedProject, user]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading release...</div>
        </div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Release Not Found</h1>
        <p className="text-sm sm:text-base text-muted-foreground">No release found with the name &quot;{decodedName}&quot;.</p>
        {error && <p className="text-sm sm:text-base text-muted-foreground">Error: {error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ReleaseDetailCard 
        release={release} 
        onReleaseUpdated={fetchRelease}
        allReleases={allReleases} // Pass allReleases to the card
      />
    </div>
  );
} 