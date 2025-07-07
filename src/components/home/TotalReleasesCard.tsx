import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function TotalReleasesCard({ count }: { count: number }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <div className="text-3xl font-bold mb-1">{count}</div>
        <p className="text-xs text-muted-foreground">Active releases</p>
      </CardContent>
    </Card>
  );
} 