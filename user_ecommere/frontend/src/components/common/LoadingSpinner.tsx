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
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[2.5px]',
    lg: 'h-12 w-12 border-[3px]',
  };

  return (
    <div className="flex items-center justify-center p-2" role="status" aria-label="Loading">
      <div
        className={cn(
          'rounded-full border-teal-100 border-t-teal-600 animate-spin',
          sizeClasses[size],
          className,
        )}
      />
      <span className="sr-only">Đang tải...</span>
    </div>
  );
}
