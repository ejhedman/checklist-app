import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ActivityIcon } from '@/components/ui/activity-icon';

export default function RecentActivityCard({ activity }: { activity: any[] }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle>Recent Release Activity</CardTitle>
        <CardDescription>
          Latest project events
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="space-y-3">
          {activity.length > 0 ? (
            activity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 text-sm">
                <ActivityIcon activityType={activity.activity_type} className="flex-shrink-0" />
                <div className="flex-1">
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
                          return `${memberName} changed release state to "${activity.activity_details?.newState || ''}"`;
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
  );
} 