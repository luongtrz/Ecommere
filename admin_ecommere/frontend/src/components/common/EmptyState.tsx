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
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 sm:p-12 md:p-16 text-center shadow-sm',
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-600 shadow-sm">
        {icon || (
          <PackageOpen
            className="h-8 w-8 sm:h-10 sm:w-10 text-teal-600"
            strokeWidth={1.5}
          />
        )}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="flex items-center justify-center">{action}</div>
      )}
    </div>
  );
}
