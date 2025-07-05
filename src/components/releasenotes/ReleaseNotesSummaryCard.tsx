import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";

interface ReleaseNotesSummaryCardProps {
  release: {
    id: string;
    name: string;
    target_date?: string;
    release_summary?: string;
    state?: string;
  };
}

function getStateIcon(state?: string) {
  switch (state) {
    case "past_due":
      return <AlertTriangle className="h-4 w-4" />;
    case "ready":
      return <CheckCircle className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "complete":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
}

export function ReleaseNotesSummaryCard({ release }: ReleaseNotesSummaryCardProps) {
  // Helper to determine if date is in the past
  const getDateLabel = (dateStr?: string) => {
    if (!dateStr) return "Date";
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (date < now) return "Release Date";
    return "Target Date";
  };

  const getDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  };

  // Color conventions based on state
  const getHeaderBg = (state?: string) => {
    switch (state) {
      case "ready":
        return "bg-green-50";
      case "pending":
        return "bg-amber-50";
      case "past_due":
        return "bg-red-50";
      case "complete":
        return "bg-blue-50";
      case "cancelled":
        return "bg-gray-100";
      default:
        return "bg-muted";
    }
  };

  return (
    <Card className="overflow-hidden rounded-lg">
      <CardHeader className={`border-b border-border rounded-none px-4 py-3 ${getHeaderBg(release.state)}`}>
        <div className="flex items-center justify-between w-full">
          {/* Release Name (left) */}
          <div className="flex-1 min-w-0 flex items-center">
            {getStateIcon(release.state)}
            <CardTitle className="truncate ml-2">{release.name}</CardTitle>
          </div>
          {/* Date (center) */}
          <div className="flex-1 flex justify-center">
            <CardDescription>
              <span className="font-medium mr-1">{getDateLabel(release.target_date)}:</span>
              {getDateDisplay(release.target_date)}
            </CardDescription>
          </div>
          {/* View Full Release Notes Button (right) */}
          <div className="flex-1 flex justify-end">
            <Link href={`/releasenotes/${encodeURIComponent(release.name)}`}>
              <Button size="sm" variant="outline">View Full Release Notes</Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2">
        <div className="prose prose-sm max-w-none mb-4">
          {release.release_summary ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.release_summary}</ReactMarkdown>
          ) : (
            <span className="text-muted-foreground">No summary provided.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 