import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatTargetDate, getDaysUntil } from '@/lib/utils';

function getNextReleaseId(allReleases: any[]): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = allReleases
    .filter(r => {
      if (!r.target_date) return false;
      const [year, month, day] = r.target_date.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setHours(0, 0, 0, 0);
      return d >= today && !r.is_cancelled && !r.is_deployed;
    })
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime());
  return future.length > 0 ? future[0].id : null;
}

export default function MyUpcomingMilestonesCard({ milestones, allReleases = [] }: { milestones: any[], allReleases?: any[] }) {
  const nextReleaseId = getNextReleaseId(allReleases);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl">My Upcoming Milestones</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Releases and features that need your attention
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-3 sm:pb-4">
        <div className="space-y-3 sm:space-y-4">
          {milestones.length > 0 ? (
            milestones.map((milestone) => {
              const daysRemaining = milestone.target_date ? getDaysUntil(milestone.target_date) : 0;
              const isNext = milestone.release_id === nextReleaseId;
              return (
                <div key={milestone.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">
                      {milestone.type === 'team_member' ? (
                        <Link href={`/releases/${encodeURIComponent(milestone.title)}`} className="hover:underline text-primary truncate block">
                          {milestone.project_name ? `${milestone.project_name}: ` : ''}{milestone.title}
                        </Link>
                      ) : (
                        <>
                          <Link href={`/releases/${encodeURIComponent(milestone.release_name)}`} className="hover:underline text-primary truncate block">
                            {milestone.project_name ? `${milestone.project_name}: ` : ''}{milestone.release_name}
                          </Link>
                          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            DRI: {milestone.dri_feature_name}
                          </div>
                        </>
                      )}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Target: {milestone.target_date ? formatTargetDate(milestone.target_date) : 'No target date'}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                      {milestone.type === 'team_member' ? (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          Team Member: Mark ready
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          DRI: Mark feature ready
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isNext && (
                      <Badge variant="destructive" className="text-[10px] sm:text-xs">
                        Action Required
                      </Badge>
                    )}
                    {daysRemaining > 0 && (
                      <div className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{daysRemaining} days</span>
                      </div>
                    )}
                    {daysRemaining <= 0 && (
                      <div className="flex items-center space-x-1 text-xs sm:text-sm text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>Past due</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No pending milestones</p>
              <p className="text-[10px] sm:text-xs">You&apos;re all caught up!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 