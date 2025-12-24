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
      stars.push(<Star key={i} className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')} />);
    } else if (value >= i - 0.5) {
      stars.push(<StarHalf key={i} className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')} />);
    } else {
      stars.push(<Star key={i} className={cn(sizeClasses[size], 'text-gray-300')} />);
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {stars}
      {showValue && <span className="ml-1 text-sm font-medium">{value.toFixed(1)}</span>}
    </div>
  );
}
