import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function Rating({ value, max = 5, size = 'sm', showValue = false, className }: RatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const stars = [];
  for (let i = 1; i <= max; i++) {
    if (value >= i) {
      stars.push(<Star key={i} className={cn(sizeClasses[size], 'fill-accent text-accent')} aria-hidden="true" />);
    } else if (value >= i - 0.5) {
      stars.push(<StarHalf key={i} className={cn(sizeClasses[size], 'fill-accent text-accent')} aria-hidden="true" />);
    } else {
      stars.push(<Star key={i} className={cn(sizeClasses[size], 'text-muted-foreground/30')} aria-hidden="true" />);
    }
  }

  return (
    <div className={cn('inline-flex items-center gap-1', className)} aria-label={`Đánh giá ${value} trên ${max} sao`}>
      <div className="flex items-center gap-0.5">
        {stars}
      </div>
      {showValue && <span className="ml-1 text-xs text-muted-foreground tabular font-medium">{value.toFixed(1)}</span>}
    </div>
  );
}
