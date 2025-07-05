import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, CheckCircle, Clock, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

async function getDashboardData() {
  const supabase = createClient();
  
  // Get releases statistics
  const { data: releases } = await supabase
    .from('releases')
    .select('*')
    .eq('is_archived', false);

  // Get teams count
  const { data: teams } = await supabase
    .from('teams')
    .select('*');

  // Get upcoming releases (not archived, not complete, not cancelled)
  const { data: upcomingReleases } = await supabase
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

  // Get recent features activity
  const { data: recentFeatures } = await supabase
    .from('features')
    .select(`
      *,
      releases(name)
    `)
    .order('updated_at', { ascending: false })
    .limit(5);

  // Calculate statistics
  const totalReleases = releases?.length || 0;
  const activeTeams = teams?.length || 0;
  const readyReleases = releases?.filter(r => r.state === 'ready').length || 0;
  const pastDueReleases = releases?.filter(r => r.state === 'past_due').length || 0;

  return {
    totalReleases,
    activeTeams,
    readyReleases,
    pastDueReleases,
    upcomingReleases: upcomingReleases || [],
    recentFeatures: recentFeatures || []
  };
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
                        <Badge 
                          variant={
                            release.state === 'ready' ? 'default' :
                            release.state === 'past_due' ? 'destructive' : 'secondary'
                          }
                        >
                          {release.state.replace('_', ' ')}
                        </Badge>
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
              Latest feature updates
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {data.recentFeatures.length > 0 ? (
                data.recentFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${
                      feature.is_ready ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm">
                      {feature.name} {feature.is_ready ? 'marked ready' : 'updated'}
                      {feature.releases && (
                        <span className="text-muted-foreground"> in {feature.releases.name}</span>
                      )}
                    </span>
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