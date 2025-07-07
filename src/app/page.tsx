export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle, Clock, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { ActivityIcon } from "@/components/ui/activity-icon";

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

export default async function HomePage() {
  const data = await getDashboardData();

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
          <CardContent className="pt-0">
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
          <CardContent className="pt-0">
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
          <CardContent className="pt-0">
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
          <CardContent className="pt-0">
            <div className="text-3xl font-bold mb-1">{data.pastDueReleases}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle>Upcoming Releases</CardTitle>
            <CardDescription>
              Next releases that need attention
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {data.upcomingReleases.length > 0 ? (
                data.upcomingReleases.map((release) => {
                  const daysRemaining = Math.ceil(
                    (new Date(release.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div key={release.id} className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{release.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Target: {new Date(release.target_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {release.state === "ready" ? (
                          <Badge className="bg-green-600 text-white" variant="default">
                            {release.state.replace("_", " ")}
                          </Badge>
                        ) : release.state === "pending" ? (
                          <Badge className="bg-amber-400 text-black" variant="default">
                            {release.state.replace("_", " ")}
                          </Badge>
                        ) : release.state === "past_due" ? (
                          <Badge className="bg-red-500 text-white" variant="default">
                            {release.state.replace("_", " ")}
                          </Badge>
                        ) : release.state === "complete" ? (
                          <Badge className="bg-blue-500 text-white" variant="default">
                            {release.state.replace("_", " ")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {release.state.replace("_", " ")}
                          </Badge>
                        )}
                        {daysRemaining > 0 && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{daysRemaining} days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming releases</p>
                </div>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/releases">
                  View All Releases
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest project events
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 text-sm">
                    <ActivityIcon activityType={activity.activity_type} className="flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">
                        {(() => {
                          switch (activity.activity_type) {
                            case 'member_ready':
                              return `${activity.members?.full_name || 'A member'} marked ready`;
                            case 'feature_ready':
                              return `${activity.members?.full_name || 'A DRI'} marked feature "${activity.features?.name || ''}" ready`;
                            case 'release_created':
                              return `${activity.members?.full_name || 'A user'} created release "${activity.releases?.name || ''}"`;
                            case 'feature_added':
                              return `${activity.members?.full_name || 'A user'} added feature "${activity.features?.name || ''}"`;
                            case 'team_added':
                              return `${activity.members?.full_name || 'A user'} added team "${activity.teams?.name || ''}" to release`;
                            case 'release_state_change':
                              return `${activity.members?.full_name || 'A user'} changed release state to "${activity.activity_details?.newState || ''}"`;
                            default:
                              return activity.activity_type;
                          }
                        })()}
                      </span>
                      <span className="text-muted-foreground ml-2">{new Date(activity.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 