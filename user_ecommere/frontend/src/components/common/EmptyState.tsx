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
    <div className={cn('flex flex-col items-center justify-center py-14 md:py-20 text-center px-4 max-w-md mx-auto', className)}>
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-accent-foreground border border-accent/25 shadow-sm transition-transform duration-300 hover:scale-105">
        {icon ? (
          <div className="flex items-center justify-center [&>svg]:h-9 [&>svg]:w-9">{icon}</div>
        ) : (
          <PackageOpen className="h-9 w-9 stroke-[1.5]" />
        )}
      </div>
      <h3 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-2.5 tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-1 flex items-center justify-center">{action}</div>}
    </div>
  );
}
