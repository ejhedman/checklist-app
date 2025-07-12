import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function ActiveTeamsCard({ count }: { count: number }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-4">
        <CardTitle className="text-xs sm:text-sm font-medium">Active Teams</CardTitle>
        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0 pb-2 sm:pb-4">
        <div className="text-2xl sm:text-3xl font-bold mb-1">{count}</div>
        <p className="text-[10px] sm:text-xs text-muted-foreground">Participating teams</p>
      </CardContent>
    </Card>
  );
} 