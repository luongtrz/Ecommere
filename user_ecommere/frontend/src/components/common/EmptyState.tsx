import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  titleLevel?: 'h2' | 'h3';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  titleLevel = 'h3',
}: EmptyStateProps) {
  const HeadingTag = titleLevel;
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-foreground/80 [&>svg]:h-8 [&>svg]:w-8">
        {icon || <PackageOpen className="h-8 w-8" />}
      </div>
      <HeadingTag className="text-lg font-semibold text-foreground mb-2">
        {title}
      </HeadingTag>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2 flex w-full justify-center [&>a]:w-full [&>a]:sm:w-auto [&>a]:sm:min-w-[12rem] [&>button]:w-full [&>button]:sm:w-auto [&>button]:sm:min-w-[12rem]">
          {action}
        </div>
      )}
    </div>
  );
}
