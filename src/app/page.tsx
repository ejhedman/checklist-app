"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import UpcomingReleasesCard from '@/components/home/UpcomingReleasesCard';
import MyUpcomingMilestonesCard from '@/components/home/MyUpcomingMilestonesCard';
import RecentActivityCard from '@/components/home/RecentActivityCard';
import TotalReleasesCard from '@/components/home/TotalReleasesCard';
import ActiveTeamsCard from '@/components/home/ActiveTeamsCard';
import ReadyReleasesCard from '@/components/home/ReadyReleasesCard';
import PastDueCard from '@/components/home/PastDueCard';
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUserMilestones } from "@/hooks/useUserMilestones";
import { PageLoadingState } from "@/components/ui/loading";

export default function HomePage() {
  const [showAllTenants, setShowAllTenants] = useState(false);
  const { selectedTenant } = useAuth();
  const { data, loading: dashboardLoading, error: dashboardError } = useDashboardData();
  const { milestones: userMilestones, loading: milestonesLoading, error: milestonesError } = useUserMilestones();

  const loading = dashboardLoading || milestonesLoading;

  if (loading) {
    return (
      <PageLoadingState 
        title={`Loading data for ${selectedTenant?.name || 'selected project'}...`}
        showSkeleton={true}
      />
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