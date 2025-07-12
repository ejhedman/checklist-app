import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import { getStatePaleBackgroundColor, ReleaseState } from "@/lib/state-colors";

interface ReleaseNotesSummaryCardProps {
  release: {
    id: string;
    name: string;
    target_date?: string;
    release_summary?: string;
  };
}

export function ReleaseNotesSummaryCard({ release }: ReleaseNotesSummaryCardProps) {
  // Helper to determine if date is in the past
  const getDateLabel = (dateStr?: string) => {
    if (!dateStr) return "Date";
    const [year, month, day] = dateStr.split('-');
    const today = new Date();
    const target = new Date(Number(year), Number(month) - 1, Number(day));
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    if (target < today) return "Release Date";
    return "Target Date";
  };

  const getDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const [year, month, day] = dateStr.split('-');
    return `${Number(month)}/${Number(day)}/${year}`;
  };

  return (
    <Card className="overflow-hidden rounded-lg">
      <CardHeader className="border-b border-border rounded-none px-3 sm:px-4 py-3 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3 sm:gap-4">
          {/* Release Name */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl truncate">{release.name}</CardTitle>
          </div>
          
          {/* Date */}
          <div className="flex justify-center sm:flex-1">
            <CardDescription className="text-xs sm:text-sm text-center">
              <span className="font-medium mr-1">{getDateLabel(release.target_date)}:</span>
              {getDateDisplay(release.target_date)}
            </CardDescription>
          </div>
          
          {/* View Full Release Notes Button */}
          <div className="flex justify-center sm:flex-1 sm:justify-end">
            <Link href={`/releasenotes/${encodeURIComponent(release.name)}`}>
              <Button size="sm" variant="outline" className="text-xs sm:text-sm w-full sm:w-auto">
                View Full Release Notes
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 py-3 sm:py-4">
        <div className="prose prose-sm sm:prose-base max-w-none mb-3 sm:mb-4">
          {release.release_summary ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.release_summary}</ReactMarkdown>
          ) : (
            <span className="text-muted-foreground text-sm sm:text-base">No summary provided.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 