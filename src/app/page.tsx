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

async function getDashboardData() {
  const supabase = createClient();
  
  try {
    console.log("Server: Starting dashboard data fetch...");
    
    // Get releases statistics
    console.log("Server: Fetching releases...");
    const { data: releases, error: releasesError } = await supabase
      .from('releases')
      .select('*')
      .eq('is_archived', false);
    
    if (releasesError) {
      console.error("Server: Releases fetch error:", releasesError);
    } else {
      console.log("Server: Releases fetched successfully");
    }

    // Get teams count
    console.log("Server: Fetching teams...");
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*');
    
    if (teamsError) {
      console.error("Server: Teams fetch error:", teamsError);
    } else {
      console.log("Server: Teams fetched successfully");
    }

    // Get upcoming releases (not archived, not complete, not cancelled)
    console.log("Server: Fetching upcoming releases...");
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
      .not('state', 'in', '(complete,cancelled)')
      .order('target_date', { ascending: true })
      .limit(3);
    
    if (upcomingError) {
      console.error("Server: Upcoming releases fetch error:", upcomingError);
    } else {
      console.log("Server: Upcoming releases fetched successfully");
    }

    // Get recent activity log
    console.log("Server: Fetching recent activity...");
    const { data: recentActivity, error: activityError } = await supabase
      .from('activity_log')
      .select(`*, members(full_name, email), features(name), teams(name), releases(name)`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (activityError) {
      console.error("Server: Failed to fetch recent activity:", activityError);
    } else {
      console.log("Server: Recent activity data:", recentActivity);
    }

    // Calculate statistics
    const totalReleases = releases?.length || 0;
    const activeTeams = teams?.length || 0;
    const readyReleases = releases?.filter(r => r.state === 'ready').length || 0;
    const pastDueReleases = releases?.filter(r => r.state === 'past_due').length || 0;

    console.log("Server: Dashboard data fetch completed successfully");
    
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
      console.log("Server: No authenticated user found");
      return [];
    }

    // Get the member record for this user
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, full_name, email')
      .eq('email', user.email)
      .single();

    if (memberError || !member) {
      console.log("Server: No member record found for user");
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
      .not('state', 'in', '(complete,cancelled)')
      .eq('release_teams.team.team_members.member_id', member.id)
      .order('target_date', { ascending: true })
      .limit(20);

    // Get features where user is DRI
    const { data: driFeatures, error: driError } = await supabase
      .from('features')
      .select(`
        id,
        name,
        is_ready,
        release_id,
        releases (
          id,
          name,
          target_date,
          state,
          tenant_id,
          tenants(name)
        )
      `)
      .eq('dri_member_id', member.id)
      .eq('releases.is_archived', false)
      .not('releases.state', 'in', '(complete,cancelled)')
      .order('releases.target_date', { ascending: true })
      .limit(20);

    // Combine and sort by target date
    const milestones: any[] = [];
    
    // Add team member milestones
    if (teamMemberReleases) {
      teamMemberReleases.forEach((release: any) => {
        milestones.push({
          id: `release-${release.id}`,
          type: 'team_member',
          title: release.name,
          target_date: release.target_date,
          state: release.state,
          tenant_name: release.tenants?.name,
          is_ready: false, // Will be checked separately
          release_id: release.id
        });
      });
    }

    // Add DRI milestones
    if (driFeatures) {
      driFeatures.forEach((feature: any) => {
        if (feature.releases) {
          milestones.push({
            id: `feature-${feature.id}`,
            type: 'dri',
            title: feature.name,
            target_date: feature.releases.target_date,
            state: feature.releases.state,
            tenant_name: feature.releases.tenants?.name,
            is_ready: feature.is_ready,
            release_id: feature.releases.id,
            feature_id: feature.id
          });
        }
      });
    }

    // Sort by target date and take top 10
    const sortedMilestones = milestones
      .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
      .slice(0, 10);

    console.log("Server: User milestones fetched successfully");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your release management activities
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="text-3xl font-bold mb-1">{data.totalReleases}</div>
            <p className="text-xs text-muted-foreground">
              Active releases
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="text-3xl font-bold mb-1">{data.activeTeams}</div>
            <p className="text-xs text-muted-foreground">
              Participating teams
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Ready Releases</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="text-3xl font-bold mb-1">{data.readyReleases}</div>
            <p className="text-xs text-muted-foreground">
              Ready for deployment
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium">Past Due</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="text-3xl font-bold mb-1">{data.pastDueReleases}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingReleasesCard releases={data.upcomingReleases} />
        <MyUpcomingMilestonesCard milestones={userMilestones} />
        <RecentActivityCard activity={data.recentActivity} />
      </div>
    </div>
  );
} 