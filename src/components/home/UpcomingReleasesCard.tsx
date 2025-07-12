import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatTargetDate, getDaysUntil } from '@/lib/utils';

export default function UpcomingReleasesCard({ releases }: { releases: any[] }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl">Upcoming Releases</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 sm:pb-4">
        <div className="space-y-3 sm:space-y-4">
          {releases.length > 0 ? (
            releases.map((release) => {
              const daysRemaining = release.target_date ? getDaysUntil(release.target_date) : 0;
              return (
                <div key={release.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">
                      <Link href={`/releases/${encodeURIComponent(release.name)}`} className="hover:underline text-primary truncate block">
                        {release.projects?.name ? `${release.projects.name}: ` : ''}{release.name}
                      </Link>
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Target: {release.target_date ? formatTargetDate(release.target_date) : 'No target date'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {daysRemaining > 0 && (
                      <div className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{daysRemaining} days</span>
                      </div>
                    )}
                    {/* State badge removed since state is now dynamically computed */}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm sm:text-base">No upcoming releases</p>
            </div>
          )}
          <Button variant="outline" className="w-full text-xs sm:text-sm" asChild>
            <Link href="/releases">
              View All Releases
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 