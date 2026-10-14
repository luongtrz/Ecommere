import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 sm:p-12 md:p-16 text-center backdrop-blur-sm', className)}>
      <div className="mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-white/5 bg-muted/30 text-muted-foreground shadow-inner">
        {icon || <PackageOpen className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/70" strokeWidth={1.5} />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-5 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="flex items-center justify-center">{action}</div>
      )}
    </div>
  );
}
