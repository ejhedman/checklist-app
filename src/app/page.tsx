export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle, Clock, AlertTriangle, Plus, ArrowRight, Target } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { ActivityIcon } from "@/components/ui/activity-icon";
import { cookies } from "next/headers";
import UpcomingReleasesCard from '@/components/home/UpcomingReleasesCard';
import MyUpcomingMilestonesCard from '@/components/home/MyUpcomingMilestonesCard';
import RecentActivityCard from '@/components/home/RecentActivityCard';
import TotalReleasesCard from '@/components/home/TotalReleasesCard';
import ActiveTeamsCard from '@/components/home/ActiveTeamsCard';
import ReadyReleasesCard from '@/components/home/ReadyReleasesCard';
import PastDueCard from '@/components/home/PastDueCard';

async function getDashboardData() {
  const supabase = createClient();
  
  try {
    // Get current user's member info for tenant filtering
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Server: No authenticated user found");
      return {
        totalReleases: 0,
        activeTeams: 0,
        readyReleases: 0,
        pastDueReleases: 0,
        upcomingReleases: [],
        recentActivity: []
      };
    }

    // Get the member record for this user
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, tenant_id')
      .eq('email', user.email)
      .single();

    if (memberError || !member) {
      console.error("Server: No member record found for user");
      return {
        totalReleases: 0,
        activeTeams: 0,
        readyReleases: 0,
        pastDueReleases: 0,
        upcomingReleases: [],
        recentActivity: []
      };
    }

    // console.log("Server:projects Starting dashboard data fetch...");
    
    // Get releases statistics (filtered by tenant)
    // console.log("Server:projects Fetching releases...");
    const { data: releases, error: releasesError } = await supabase
      .from('releases')
      .select('*')
      .eq('is_archived', false)
      .eq('tenant_id', member.tenant_id);
    
    if (releasesError) {
      console.error("Server: Releases fetch error:", releasesError);
    } else {
      // console.log("Server:projects Releases fetched successfully");
    }

    // Get teams count (filtered by tenant)
    // console.log("Server:projects Fetching teams...");
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('tenant_id', member.tenant_id);
    
    if (teamsError) {
      console.error("Server: Teams fetch error:", teamsError);
    } else {
      // console.log("Server:projects Teams fetched successfully");
    }

    // Get upcoming releases (not archived, not complete, not cancelled, filtered by tenant)
    // console.log("Server:projects Fetching upcoming releases...");
    const { data: upcomingReleases, error: upcomingError } = await supabase
      .from('releases')
      .select(`
        *,
        tenants(name),
        release_teams(
          team_id
        )
      `)
      .eq('is_archived', false)
      .eq('tenant_id', member.tenant_id)
      .not('state', 'in', '(complete,cancelled)')
      .order('target_date', { ascending: true })
      .limit(3);
    
    if (upcomingError) {
      console.error("Server: Upcoming releases fetch error:", upcomingError);
    } else {
      // console.log("Server:projects Upcoming releases fetched successfully");
    }

    // Get recent activity log (filtered by tenant)
    // console.log("Server:projects Fetching recent activity...");
    const { data: recentActivity, error: activityError } = await supabase
      .from('activity_log')
      .select(`*, members(full_name, email, nickname), features(name), teams(name), releases(name)`)
      .eq('tenant_id', member.tenant_id)
      .order('created_at', { ascending: false })
      .limit(7);

    if (activityError) {
      console.error("Server: Failed to fetch recent activity:", activityError);
    } else {
      // console.log("Server:projects Recent activity data:", recentActivity);
    }

    // Calculate statistics
    const totalReleases = releases?.length || 0;
    const activeTeams = teams?.length || 0;
    const readyReleases = releases?.filter(r => r.state === 'ready').length || 0;
    const pastDueReleases = releases?.filter(r => r.state === 'past_due').length || 0;

    // console.log("Server:projects Dashboard data fetch completed successfully");
    
    return {
      totalReleases,
      activeTeams,
      readyReleases,
      pastDueReleases,
      upcomingReleases: upcomingReleases || [],
      recentActivity: recentActivity || []
    };
  } catch (error) {
    console.error("Server: Error in getDashboardData:", error);
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
}

async function getUserMilestones() {
  const supabase = createClient();
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      // console.log("Server:projects No authenticated user found");
      return [];
    }

    // Get the member record for this user
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, full_name, email, tenant_id')
      .eq('email', user.email)
      .single();

    if (memberError || !member) {
      // console.log("Server:projects No member record found for user");
      return [];
    }

    // Get releases where user is a team member (needs to signal ready)
    const { data: teamMemberReleases, error: teamError } = await supabase
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
      .eq('tenant_id', member.tenant_id)
      .not('state', 'in', '(complete,cancelled)')
      .eq('release_teams.team.team_members.member_id', member.id)
      .order('target_date', { ascending: true })
      .limit(10);

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
    const { data: driFeatures, error: driError } = await supabase
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
    .eq('tenant_id', member.tenant_id)
    .eq('releases.is_archived', false)
    .not('releases.state', 'in', '(complete,cancelled)')
    .limit(10);


      // console.log("Server:projects DRI features fetched successfully");
      // console.log(member.id);
      // console.log(driFeatures);
      // console.log(driError);

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

    // console.log("Server:projects User milestones fetched successfully");
    return sortedMilestones;
    
  } catch (error) {
    console.error("Server: Error in getUserMilestones:", error);
    return [];
  }
}

export default async function HomePage() {
  const data = await getDashboardData();
  const userMilestones = await getUserMilestones();

  return (
    <div className="space-y-8">
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