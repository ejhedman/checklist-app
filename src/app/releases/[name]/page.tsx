"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import ReleaseDetailCard from "@/components/releases/ReleaseDetailCard";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AddFeatureDialog } from "@/components/releases/AddFeatureDialog";

export default function ReleaseDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const [release, setRelease] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  
  // Decode the URL parameter
  const decodedName = decodeURIComponent(resolvedParams.name);

  const fetchRelease = async () => {
    setLoading(true);
    setError(null);
    
    const supabase = createClient();
    
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
        created_at,
        release_teams (
          team:teams (
            id,
            name,
            description,
            team_users (
              user:users (
                id,
                full_name,
                email
              )
            )
          )
        ),
        user_release_state (
          user_id,
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
          dri_user_id,
          dri_user:users!dri_user_id (
            id,
            full_name,
            email
          )
        )
      `)
      .eq("name", decodedName)
      .single();

    if (supabaseError || !data) {
      setError(supabaseError?.message || "Release not found");
      setLoading(false);
      return;
    }

    // Transform the data to match the card props
    const transformedRelease = {
      ...data,
      team_count: data.release_teams?.length || 0,
      feature_count: data.features?.length || 0,
      ready_features: data.features?.filter((f: any) => f.is_ready)?.length || 0,
      features: data.features?.map((feature: any) => ({
        ...feature,
        dri_user: Array.isArray(feature.dri_user)
          ? feature.dri_user[0]
          : feature.dri_user,
      })) || [],
      teams: data.release_teams?.map((rt: any) => ({
        id: rt.team.id,
        name: rt.team.name,
        description: rt.team.description,
        members: (Array.isArray(rt.team.team_users)
          ? rt.team.team_users
          : (rt.team.team_users ? [rt.team.team_users] : [])
        ).map((tu: any) => {
          const userReadyState = data.user_release_state?.find((urs: any) => urs.user_id === tu.user.id);
          return {
            id: tu.user.id,
            full_name: tu.user.full_name,
            email: tu.user.email,
            is_ready: userReadyState?.is_ready || false,
          };
        }) || [],
      })) || [],
    };

    setRelease(transformedRelease);
    setLoading(false);
  };

  const handleMemberReadyChange = async (releaseId: string, userId: string, isReady: boolean) => {
    const supabase = createClient();
    
    const { error: updateError } = await supabase
      .from("user_release_state")
      .upsert({
        release_id: releaseId,
        user_id: userId,
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
    fetchRelease();
  }, [decodedName]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading release...</div>
        </div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <Link href="/releases">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Releases
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-4">Release Not Found</h1>
        <p className="text-muted-foreground">No release found with the name &quot;{decodedName}&quot;.</p>
        {error && <p className="text-muted-foreground">Error: {error}</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4">
        <Link href="/releases">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Releases
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Release: {release.name}</h1>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Features</h4>
          <AddFeatureDialog 
            releaseId={release.id} 
            releaseName={release.name} 
            onFeatureAdded={fetchRelease} 
          />
        </div>
        <ReleaseDetailCard 
          release={release} 
          onMemberReadyChange={handleMemberReadyChange}
        />
      </div>
    </div>
  );
} 