import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReleaseNotesDisplayProps {
  releaseName: string;
  releaseNotes: string;
  releaseSummary: string;
}

export function ReleaseNotesDisplay({ 
  releaseName, 
  releaseNotes, 
  releaseSummary 
}: ReleaseNotesDisplayProps) {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{releaseName}</h1>
      </div>

      {/* Release Summary Section */}
      {releaseSummary && (
        <div className="border border-border bg-background rounded-lg overflow-hidden">
          <div className="bg-muted px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Release Summary</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{releaseSummary}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Release Notes Section */}
      <div className="border border-border bg-background rounded-lg overflow-hidden">
        <div className="bg-muted px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Release Notes</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
            {releaseNotes ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{releaseNotes}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground text-sm sm:text-base">No release notes available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 