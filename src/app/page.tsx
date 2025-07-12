"use client";

// import { useState } from "react";
import UpcomingReleasesCard from '@/components/home/UpcomingReleasesCard';
import MyUpcomingMilestonesCard from '@/components/home/MyUpcomingMilestonesCard';
import RecentActivityCard from '@/components/home/RecentActivityCard';
import TotalReleasesCard from '@/components/home/TotalReleasesCard';
import ActiveTeamsCard from '@/components/home/ActiveTeamsCard';
import ReadyReleasesCard from '@/components/home/ReadyReleasesCard';
import PastDueCard from '@/components/home/PastDueCard';
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUserMilestones, useNagMilestones } from "@/hooks/useUserMilestones";
import { PageLoadingState } from "@/components/ui/loading";
import NagListCard from '@/components/home/NagListCard';

export default function HomePage() {
  // const [showAllProjects, setShowAllProjects] = useState(false);
  const { selectedProject } = useAuth();
  const { data, loading: dashboardLoading } = useDashboardData();
  const { milestones: userMilestones, loading: milestonesLoading } = useUserMilestones();
  const { nagMilestones } = useNagMilestones();

  const loading = dashboardLoading || milestonesLoading;

  if (loading) {
    return (
      <PageLoadingState 
        title={`Loading data for ${selectedProject?.name || 'selected project'}...`}
        showSkeleton={true}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Project title and checkbox */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {selectedProject ? `Project: ${selectedProject.name}` : 'No Project Selected'}
        </h1>
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
        <div className="h-full flex flex-col gap-6">
          <MyUpcomingMilestonesCard milestones={userMilestones} allReleases={data.upcomingReleases} />
          <NagListCard nagMilestones={nagMilestones} allReleases={data.upcomingReleases} />
        </div>
      </div>
    </div>
  );
} 