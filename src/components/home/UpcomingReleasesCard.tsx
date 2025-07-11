import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function UpcomingReleasesCard({ releases }: { releases: any[] }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle>Upcoming Releases</CardTitle>
        <CardDescription>
          Next releases that need attention
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="space-y-4">
          {releases.length > 0 ? (
            releases.map((release) => {
              const daysRemaining = Math.ceil(
                (new Date(release.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={release.id} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      <Link href={`/releases/${encodeURIComponent(release.name)}`} className="hover:underline text-primary">
                        {release.projects?.name ? `${release.projects.name}: ` : ''}{release.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Target: {new Date(release.target_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysRemaining > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
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
  );
} 