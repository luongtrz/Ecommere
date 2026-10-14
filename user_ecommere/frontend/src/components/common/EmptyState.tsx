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
    <div className={cn('flex flex-col items-center justify-center py-12 md:py-16 text-center px-4 max-w-md mx-auto font-sans', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600 border border-teal-100 shadow-sm transition-transform duration-200 hover:scale-105">
        {icon ? (
          <div className="flex items-center justify-center [&>svg]:h-8 [&>svg]:w-8">{icon}</div>
        ) : (
          <PackageOpen className="h-8 w-8 stroke-[1.75]" />
        )}
      </div>
      <h3 className="font-sans text-xl md:text-2xl font-bold text-slate-900 mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-slate-600 mb-6 max-w-sm leading-relaxed font-sans">{description}</p>
      )}
      {action && <div className="mt-1 flex items-center justify-center">{action}</div>}
    </div>
  );
}
