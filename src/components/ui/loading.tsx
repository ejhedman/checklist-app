import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-center space-x-2">
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn("bg-muted animate-pulse rounded-lg", className)}
        />
      ))}
    </>
  );
}

interface PageLoadingStateProps {
  title?: string;
  showSkeleton?: boolean;
  skeletonConfig?: {
    cards?: number;
    rows?: number;
  };
}

export function PageLoadingState({ 
  title = "Loading...", 
  showSkeleton = false,
  skeletonConfig = { cards: 4, rows: 2 }
}: PageLoadingStateProps) {
  return (
    <div className="space-y-8">
      {/* Loading indicator */}
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner text={title} />
      </div>
      
      {showSkeleton && (
        <>
          {/* Top row skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LoadingSkeleton className="h-32" count={skeletonConfig.cards} />
          </div>
          {/* Bottom row skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadingSkeleton className="h-64" count={skeletonConfig.rows} />
          </div>
        </>
      )}
    </div>
  );
}

interface CardLoadingSkeletonProps {
  className?: string;
  showHeader?: boolean;
  showContent?: boolean;
}

export function CardLoadingSkeleton({ 
  className, 
  showHeader = true, 
  showContent = true 
}: CardLoadingSkeletonProps) {
  return (
    <div className={cn("bg-card border rounded-lg p-6", className)}>
      {showHeader && (
        <div className="space-y-3 mb-4">
          <LoadingSkeleton className="h-6 w-1/3" />
          <LoadingSkeleton className="h-4 w-2/3" />
        </div>
      )}
      {showContent && (
        <div className="space-y-2">
          <LoadingSkeleton className="h-4 w-full" count={3} />
        </div>
      )}
    </div>
  );
} 