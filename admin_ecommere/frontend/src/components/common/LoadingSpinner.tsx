import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
  className,
  size = 'md',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center" role="status" aria-label="Đang tải">
      <Loader2 className={cn('animate-spin text-teal-600 transition-colors', sizeClasses[size], className)} />
      <span className="sr-only">Đang tải...</span>
    </div>
  );
}
