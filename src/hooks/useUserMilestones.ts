import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Milestone {
  id: string;
  type: 'team_member' | 'dri';
  title: string;
  target_date: string;
  state: string;
  tenant_name?: string;
  is_ready: boolean;
  release_id: string;
  release_name?: string;
  feature_id?: string;
}

export function useUserMilestones() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedTenant, availableTenants, user } = useAuth();

  const getUserMilestones = async (tenantIds: string[]): Promise<Milestone[]> => {
    const supabase = createClient();
    
    try {
      if (!user) {
        return [];
      }

      // Get the member record for this user
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, full_name, email, tenant_id')
        .eq('email', user.email)
        .single();

      if (memberError || !member) {
        return [];
      }

      // Get releases where user is a team member (needs to signal ready)
      let teamMemberQuery = supabase
        .from('releases')
        .select(`
          id,
          name,
          target_date,
          state,
          tenant_id,
          tenants(name),
          release_teams!inner(
            team:teams!inner(
              team_members!inner(
                member_id
              )
            )
          )
        `)
        .eq('is_archived', false)
        .not('state', 'in', '(complete,cancelled)')
        .eq('release_teams.team.team_members.member_id', member.id)
        .order('target_date', { ascending: true })
        .limit(10);
      
      if (tenantIds.length > 0) {
        teamMemberQuery = teamMemberQuery.in('tenant_id', tenantIds);
      }
      
      const { data: teamMemberReleases, error: teamError } = await teamMemberQuery;

      // Get member's ready states for these releases
      const releaseIds = teamMemberReleases?.map((r: any) => r.id) || [];
      let memberReadyStates: any[] = [];
      if (releaseIds.length > 0) {
        const { data: readyStates, error: readyError } = await supabase
          .from('member_release_state')
          .select('release_id, is_ready')
          .eq('member_id', member.id)
          .in('release_id', releaseIds);
        
        if (!readyError && readyStates) {
          memberReadyStates = readyStates;
        }
      }

      // Get features where user is DRI
      let driQuery = supabase
        .from('features')
        .select(`
          id,
          name,
          is_ready,
          release_id,
          releases!inner (
            id,
            name,
            target_date,
            state,
            tenant_id,
            tenants(name)
          ).order('target_date', { ascending: true })
        `)
        .eq('dri_member_id', member.id)
        .eq('releases.is_archived', false)
        .not('releases.state', 'in', '(complete,cancelled)')
        .limit(10);
      
      if (tenantIds.length > 0) {
        driQuery = driQuery.in('tenant_id', tenantIds);
      }
      
      const { data: driFeatures, error: driError } = await driQuery;

      // Combine and sort by target date
      const milestones: Milestone[] = [];
      
      // Add team member milestones
      if (teamMemberReleases) {
        teamMemberReleases.forEach((release: any) => {
          // Find member's ready state for this release
          const memberReadyState = memberReadyStates.find((mrs: any) => mrs.release_id === release.id);
          
          // Only show as milestone if member is not ready (no ready state or is_ready = false)
          if (!memberReadyState || memberReadyState.is_ready === false) {
            milestones.push({
              id: `release-${release.id}`,
              type: 'team_member',
              title: release.name,
              target_date: release.target_date,
              state: release.state,
              tenant_name: release.tenants?.name,
              is_ready: memberReadyState?.is_ready || false,
              release_id: release.id
            });
          }
        });
      }

      // Add DRI milestones
      if (driFeatures) {
        driFeatures.forEach((feature: any) => {
          if (feature.releases && feature.is_ready === false) {
            milestones.push({
              id: `feature-${feature.id}`,
              type: 'dri',
              title: feature.name,
              target_date: feature.releases.target_date,
              state: feature.releases.state,
              tenant_name: feature.releases.tenants?.name,
              is_ready: feature.is_ready,
              release_id: feature.releases.id,
              release_name: feature.releases.name,
              feature_id: feature.id
            });
          }
        });
      }

      // Sort by target date and take top 10
      const sortedMilestones = milestones
        .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        .slice(0, 10);

      return sortedMilestones;
      
    } catch (error) {
      console.error("Error in getUserMilestones:", error);
      return [];
    }
  };

  const fetchMilestones = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!selectedTenant) {
        setMilestones([]);
        setLoading(false);
        return;
      }

      // For now, use only the selected tenant
      const tenantIds = [selectedTenant.id];
      const milestoneData = await getUserMilestones(tenantIds);
      setMilestones(milestoneData);
    } catch (err) {
      console.error("Error in fetchMilestones:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [selectedTenant, user]);

  return {
    milestones,
    loading,
    error,
    refetch: fetchMilestones,
  };
} 