import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ActivityIcon } from '@/components/ui/activity-icon';

export default function RecentActivityCard({ activity }: { activity: any[] }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle>Recent Activity</CardTitle>
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
  );
} 