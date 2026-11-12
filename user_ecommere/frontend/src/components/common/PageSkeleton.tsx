import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface PageSkeletonProps {
  className?: string;
}

export function PageSkeleton({ className }: PageSkeletonProps) {
  return (
    <div
      className={cn('container mx-auto px-4 py-8 space-y-8', className)}
      role="status"
      aria-busy="true"
      aria-label="Đang tải trang"
    >
      <span className="sr-only">Đang tải trang</span>

      {/* Header bar line */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-36 max-w-[50%]" />
      </div>

      {/* Title line */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 max-w-[80%]" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* 4-card grid of blocks */}
      <div
        data-testid="page-skeleton-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            data-testid="page-skeleton-card"
            className="space-y-3 rounded-xl border border-border/50 p-4 bg-card/40"
          >
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
