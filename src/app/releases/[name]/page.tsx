"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import ReleaseDetailCard from "@/components/releases/ReleaseDetailCard";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";


export default function ReleaseDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const [release, setRelease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { selectedProject, user } = useAuth();

  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  
  // Decode the URL parameter
  const decodedName = decodeURIComponent(resolvedParams.name);

  const fetchRelease = async () => {
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
    
    const { data, error: supabaseError } = await supabase
      .from("releases")
      .select(`
        id,
        name,
        target_date,
        state,
        platform_update,
        config_update,
        is_archived,
        is_deployed,
        is_cancelled,
        targets,
        created_at,
        project_id,
        projects (
          id,
          name
        ),
        release_teams (
          team:teams (
            id,
            name,
            description,
            team_members (
              member:members (
                id,
                full_name,
                email,
                nickname,
                project_id
              )
            )
          )
        ),
        member_release_state (
          member_id,
          is_ready
        ),
        features (
          id,
          name,
          description,
          jira_ticket,
          is_platform,
          is_config,
          is_ready,
          comments,
          dri_member_id,
          dri_member:members!dri_member_id (
            id,
            full_name,
            email,
            nickname
          )
        )
      `)
      .eq("name", decodedName)
      .eq("project_id", selectedProject.id)
      .order("created_at", { foreignTable: "features", ascending: true })
      .single();

    if (supabaseError || !data) {
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
  };

  const handleMemberReadyChange = async (releaseId: string, memberId: string, isReady: boolean) => {
    const supabase = createClient();
    
    // Find the member to get their project_id
    let memberProjectId = null;
    if (release && release.teams) {
      for (const team of release.teams) {
        const member = team.members?.find((m: any) => m.id === memberId);
        if (member) {
          memberProjectId = member.project_id;
          break;
        }
      }
    }
    
    // If we can't find the member's project_id, use the release's project_id as fallback
    if (!memberProjectId && release?.project?.id) {
      memberProjectId = release.project.id;
    }
    
    const { error: updateError } = await supabase
      .from("member_release_state")
      .upsert({
        release_id: releaseId,
        member_id: memberId,
        project_id: memberProjectId,
        is_ready: isReady,
      });

    if (updateError) {
      console.error("Error updating member ready state:", updateError);
    } else {
      // Refresh the release data
      fetchRelease();
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchRelease();
    }
  }, [decodedName, selectedProject]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading release...</div>
        </div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-4">Release Not Found</h1>
        <p className="text-muted-foreground">No release found with the name &quot;{decodedName}&quot;.</p>
        {error && <p className="text-muted-foreground">Error: {error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReleaseDetailCard 
        release={release} 
        onMemberReadyChange={handleMemberReadyChange}
        onReleaseUpdated={fetchRelease}
      />
    </div>
  );
} 