import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-label="Đang tải"
    >
      <Loader2
        aria-hidden="true"
        className={cn('animate-spin text-primary', sizeClasses[size], className)}
      />
      <span className="sr-only">Đang tải</span>
    </div>
  );
}
