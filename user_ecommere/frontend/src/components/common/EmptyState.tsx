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
    <div className={cn('flex flex-col items-center justify-center py-10 px-4 text-center', className)}>
      <div className="mb-3 flex items-center justify-center text-muted-foreground/60">
        {icon || <PackageOpen className="h-10 w-10" strokeWidth={1.5} />}
      </div>
      <h3 className="font-sans text-base font-semibold text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-1 flex justify-center">{action}</div>}
    </div>
  );
}
