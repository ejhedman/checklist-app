import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function MyUpcomingMilestonesCard({ milestones }: { milestones: any[] }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle>My Upcoming Milestones</CardTitle>
        <CardDescription>
          Your next 10 upcoming items as team member or DRI
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="space-y-4">
          {milestones.length > 0 ? (
            milestones.map((milestone) => {
              const daysRemaining = Math.ceil(
                (new Date(milestone.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={milestone.id} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {milestone.type === 'team_member' ? (
                        <Link href={`/releases/${encodeURIComponent(milestone.title)}`} className="hover:underline text-primary">
                          {milestone.tenant_name ? `${milestone.tenant_name}: ` : ''}{milestone.title}
                        </Link>
                      ) : (
                        <Link href={`/releases/${encodeURIComponent(milestone.release_name)}`} className="hover:underline text-primary">
                          {milestone.tenant_name ? `${milestone.tenant_name}: ` : ''}{milestone.release_name}
                        </Link>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Target: {new Date(milestone.target_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {milestone.type === 'team_member'
                        ? 'Team Member Readiness'
                        : `DRI: ${milestone.title}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysRemaining > 0 && (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{daysRemaining} days</span>
                      </div>
                    )}
                    {milestone.type === 'dri' && (
                      <Badge variant={milestone.is_ready ? "default" : "secondary"} className="text-xs">
                        {milestone.is_ready ? "Ready" : "Not Ready"}
                      </Badge>
                    )}
                    {milestone.state === "ready" ? (
                      <Badge className="bg-green-600 text-white" variant="default">
                        {milestone.state.replace("_", " ")}
                      </Badge>
                    ) : milestone.state === "pending" ? (
                      <Badge className="bg-amber-400 text-black" variant="default">
                        {milestone.state.replace("_", " ")}
                      </Badge>
                    ) : milestone.state === "past_due" ? (
                      <Badge className="bg-red-500 text-white" variant="default">
                        {milestone.state.replace("_", " ")}
                      </Badge>
                    ) : milestone.state === "complete" ? (
                      <Badge className="bg-blue-500 text-white" variant="default">
                        {milestone.state.replace("_", " ")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {milestone.state.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No upcoming milestones</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 