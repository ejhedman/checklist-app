"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle, Clock, AlertTriangle, Plus, ArrowRight, Target } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { ActivityIcon } from "@/components/ui/activity-icon";
import UpcomingReleasesCard from '@/components/home/UpcomingReleasesCard';
import MyUpcomingMilestonesCard from '@/components/home/MyUpcomingMilestonesCard';
import RecentActivityCard from '@/components/home/RecentActivityCard';
import TotalReleasesCard from '@/components/home/TotalReleasesCard';
import ActiveTeamsCard from '@/components/home/ActiveTeamsCard';
import ReadyReleasesCard from '@/components/home/ReadyReleasesCard';
import PastDueCard from '@/components/home/PastDueCard';
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DashboardData {
  totalReleases: number;
  activeTeams: number;
  readyReleases: number;
  pastDueReleases: number;
  upcomingReleases: any[];
  recentActivity: any[];
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData>({
    totalReleases: 0,
    activeTeams: 0,
    readyReleases: 0,
    pastDueReleases: 0,
    upcomingReleases: [],
    recentActivity: []
  });
  const [userMilestones, setUserMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllTenants, setShowAllTenants] = useState(false);
  const { selectedTenant, availableTenants, user } = useAuth();

  const getDashboardData = async (tenantIds: string[]) => {
    const supabase = createClient();
    
    try {
      if (!user) {
        console.error("No authenticated user found");
        return {
          totalReleases: 0,
          activeTeams: 0,
          readyReleases: 0,
          pastDueReleases: 0,
          upcomingReleases: [],
          recentActivity: []
        };
      }

      // console.log("Starting dashboard data fetch...");
      
      // Get releases statistics (filtered by tenant)
      let releasesQuery = supabase
        .from('releases')
        .select('*')
        .eq('is_archived', false);
      
      if (tenantIds.length > 0) {
        releasesQuery = releasesQuery.in('tenant_id', tenantIds);
      } else {
        // If no tenant IDs, return empty result
        return {
          totalReleases: 0,
          activeTeams: 0,
          readyReleases: 0,
          pastDueReleases: 0,
          upcomingReleases: [],
          recentActivity: []
        };
      }
      
      const { data: releases, error: releasesError } = await releasesQuery;
      
      if (releasesError) {
        console.error("Releases fetch error:", releasesError);
      }

      // Get teams count (filtered by tenant)
      let teamsQuery = supabase
        .from('teams')
        .select('*');
      
      if (tenantIds.length > 0) {
        teamsQuery = teamsQuery.in('tenant_id', tenantIds);
      }
      
      const { data: teams, error: teamsError } = await teamsQuery;
      
      if (teamsError) {
        console.error("Teams fetch error:", teamsError);
      }

      // Get upcoming releases (not archived, not complete, not cancelled, filtered by tenant)
      let upcomingQuery = supabase
        .from('releases')
        .select(`
          *,
          tenants(name),
          release_teams(
            team_id
          )
        `)
        .eq('is_archived', false)
        .not('state', 'in', '(complete,cancelled)')
        .order('target_date', { ascending: true })
        .limit(3);
      
      if (tenantIds.length > 0) {
        upcomingQuery = upcomingQuery.in('tenant_id', tenantIds);
      }
      
      const { data: upcomingReleases, error: upcomingError } = await upcomingQuery;
      
      if (upcomingError) {
        console.error("Upcoming releases fetch error:", upcomingError);
      }

      // Get recent activity log (filtered by tenant)
      let activityQuery = supabase
        .from('activity_log')
        .select(`*, members(full_name, email, nickname), features(name), teams(name), releases(name)`)
        .order('created_at', { ascending: false })
        .limit(7);
      
      if (tenantIds.length > 0) {
        activityQuery = activityQuery.in('tenant_id', tenantIds);
      }
      
      const { data: recentActivity, error: activityError } = await activityQuery;

      if (activityError) {
        console.error("Failed to fetch recent activity:", activityError);
      }

      // Calculate statistics
      const totalReleases = releases?.length || 0;
      const activeTeams = teams?.length || 0;
      const readyReleases = releases?.filter(r => r.state === 'ready').length || 0;
      const pastDueReleases = releases?.filter(r => r.state === 'past_due').length || 0;

      // console.log("Dashboard data fetch completed successfully");
      
      return {
        totalReleases,
        activeTeams,
        readyReleases,
        pastDueReleases,
        upcomingReleases: upcomingReleases || [],
        recentActivity: recentActivity || []
      };
    } catch (error) {
      console.error("Error in getDashboardData:", error);
      // Return default data on error
      return {
        totalReleases: 0,
        activeTeams: 0,
        readyReleases: 0,
        pastDueReleases: 0,
        upcomingReleases: [],
        recentActivity: []
      };
    }
  };

  const getUserMilestones = async (tenantIds: string[]) => {
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
      const milestones: any[] = [];
      
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

  useEffect(() => {
    const fetchData = async () => {
      console.log('HomePage: useEffect triggered - selectedTenant changed to:', selectedTenant?.name);
      
      if (!selectedTenant) {
        console.log('HomePage: No tenant selected, clearing data');
        setData({
          totalReleases: 0,
          activeTeams: 0,
          readyReleases: 0,
          pastDueReleases: 0,
          upcomingReleases: [],
          recentActivity: []
        });
        setUserMilestones([]);
        setLoading(false);
        return;
      }

      console.log('HomePage: Loading data for tenant:', selectedTenant.name);
      setLoading(true);
      
      // Determine which tenant IDs to use
      let tenantIds: string[] = [];
      if (showAllTenants) {
        // Use all available tenant IDs
        tenantIds = availableTenants.map(t => t.id);
      } else {
        // Use only the selected tenant
        tenantIds = [selectedTenant.id];
      }

      console.log('HomePage: using tenantIds:', tenantIds);

      const [dashboardData, milestones] = await Promise.all([
        getDashboardData(tenantIds),
        getUserMilestones(tenantIds)
      ]);

      console.log('HomePage: dashboardData results:', {
        totalReleases: dashboardData.totalReleases,
        activeTeams: dashboardData.activeTeams,
        readyReleases: dashboardData.readyReleases,
        pastDueReleases: dashboardData.pastDueReleases,
        upcomingReleasesCount: dashboardData.upcomingReleases.length,
        recentActivityCount: dashboardData.recentActivity.length
      });

      setData(dashboardData);
      setUserMilestones(milestones);
      setLoading(false);
      console.log('HomePage: Data loading complete for tenant:', selectedTenant.name);
    };

    fetchData();
  }, [selectedTenant, showAllTenants, availableTenants, user]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading indicator */}
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">
              Loading data for {selectedTenant?.name || 'selected project'}...
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tenant title and checkbox */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {selectedTenant ? `Project: ${selectedTenant.name}` : 'No Project Selected'}
        </h1>
        {/* <div className="flex items-center space-x-2">
          <Checkbox
            id="showAllTenants"
            checked={showAllTenants}
            onCheckedChange={(checked) => setShowAllTenants(checked as boolean)}
            disabled={!selectedTenant || availableTenants.length <= 1}
          />
          <Label htmlFor="showAllTenants" className="text-sm">
            Show all of my Projects
          </Label>
        </div> */}
      </div>

      {/* Top row: Four stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TotalReleasesCard count={data.totalReleases} />
        <ReadyReleasesCard count={data.readyReleases} />
        <PastDueCard count={data.pastDueReleases} />
        <ActiveTeamsCard count={data.activeTeams} />
      </div>

      {/* Two-column section below */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left column: Upcoming Releases (top), Recent Activity (bottom) */}
        <div className="flex flex-col gap-6 h-full">
          <UpcomingReleasesCard releases={data.upcomingReleases} />
          <RecentActivityCard activity={data.recentActivity} />
        </div>
        {/* Right column: My Upcoming Milestones (spans full height) */}
        <div className="h-full flex flex-col">
          <MyUpcomingMilestonesCard milestones={userMilestones} />
        </div>
      </div>
    </div>
  );
} 