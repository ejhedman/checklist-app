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
    <div className="max-w-4xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">{releaseName}</h1>
      </div>

      {/* Release Summary Section */}
      {releaseSummary && (
        <div className="border border-border bg-background rounded-lg overflow-hidden">
          <div className="bg-muted px-6 py-4 border-b border-border">
            <h2 className="text-2xl font-semibold">Release Summary</h2>
          </div>
          <div className="p-6">
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{releaseSummary}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Release Notes Section */}
      <div className="border border-border bg-background rounded-lg overflow-hidden">
        <div className="bg-muted px-6 py-4 border-b border-border">
          <h2 className="text-2xl font-semibold">Release Notes</h2>
        </div>
        <div className="p-6">
          <div className="prose prose-lg max-w-none">
            {releaseNotes ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{releaseNotes}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground">No release notes available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 