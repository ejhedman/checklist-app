import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { ActivityIcon } from '@/components/ui/activity-icon';

export default function RecentActivityCard({ activity }: { activity: any[] }) {
  const formatActivityDate = (dateString: string) => {
    const activityDate = new Date(dateString);
    return `on ${activityDate.getMonth() + 1}/${activityDate.getDate()}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl">Recent Release Activity</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Latest project events
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-3 sm:pb-4">
        <div className="space-y-2 sm:space-y-3">
          {activity.length > 0 ? (
            activity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-2 sm:space-x-3 text-xs sm:text-sm">
                <ActivityIcon activityType={activity.activity_type} className="flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-[10px] sm:text-xs flex-shrink-0">
                  {formatActivityDate(activity.created_at)}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">
                    {(() => {
                      const memberName = activity.members?.nickname || activity.members?.full_name || 'A user';
                      switch (activity.activity_type) {
                        case 'member_ready':
                          return `${memberName} marked ready`;
                        case 'feature_ready':
                          return `${memberName} marked feature "${activity.features?.name || ''}" ready`;
                        case 'release_created':
                          return `${memberName} created release "${activity.releases?.name || ''}"`;
                        case 'feature_added':
                          return `${memberName} added feature "${activity.features?.name || ''}"`;
                        case 'team_added':
                          return `${memberName} added team "${activity.teams?.name || ''}" to release: ${activity.releases?.name || ''}`;
                        case 'release_state_change':
                          return `${memberName} changed release: "${activity.activity_details?.releaseName || ''}" state to "${activity.activity_details?.newState || ''}"`;
                        case 'release_ready_change':
                          const oldStatus = activity.activity_details?.oldIsReady ? 'ready' : 'not ready';
                          const newStatus = activity.activity_details?.newIsReady ? 'ready' : 'not ready';
                          return `${memberName} changed release "${activity.activity_details?.releaseName || ''}" from ${oldStatus} to ${newStatus}`;
                        case 'release_updated':
                          const releaseChanges = activity.activity_details?.changes || [];
                          if (releaseChanges.length > 0) {
                            return `${memberName} updated release "${activity.releases?.name || ''}" (${releaseChanges.join(', ')})`;
                          }
                          return `${memberName} updated release "${activity.releases?.name || ''}"`;
                        case 'release_date_changed':
                          const oldDate = new Date(activity.activity_details?.oldDate).toLocaleDateString();
                          const newDate = new Date(activity.activity_details?.newDate).toLocaleDateString();
                          return `${memberName} moved release "${activity.activity_details?.releaseName || ''}" from ${oldDate} to ${newDate}`;
                        case 'release_notes_updated':
                          return `${memberName} updated release notes for "${activity.releases?.name || ''}"`;
                        case 'release_summary_updated':
                          return `${memberName} updated release summary for "${activity.releases?.name || ''}"`;
                        case 'feature_updated':
                          const featureChanges = activity.activity_details?.changes || [];
                          if (featureChanges.length > 0) {
                            return `${memberName} updated feature "${activity.features?.name || ''}" (${featureChanges.join(', ')})`;
                          }
                          return `${memberName} updated feature "${activity.features?.name || ''}"`;
                        default:
                          return activity.activity_type;
                      }
                    })()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 