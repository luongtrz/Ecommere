import { useState, useEffect } from 'react';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { getImageUrl, cn } from '@/lib/utils';
import type { ChatSource } from '../types';

export interface ChatSourceCardProps {
  source: ChatSource;
  variant?: 'widget' | 'page';
}

export function ChatSourceCard({
  source,
  variant = 'widget',
}: ChatSourceCardProps) {
  const item = source as ChatSource & {
    imageUrl?: string | null;
    minPrice?: number | null;
  };

  const [imageError, setImageError] = useState(false);
  const rawImageUrl = item.imageUrl?.trim();

  useEffect(() => {
    setImageError(false);
  }, [rawImageUrl]);

  const showThumbnail = Boolean(rawImageUrl) && !imageError;
  const hasPrice =
    typeof item.minPrice === 'number' &&
    Number.isFinite(item.minPrice) &&
    item.minPrice > 0;

  return (
    <a
      href={`/p/${source.slug}`}
      className={cn(
        'group flex items-center rounded-lg border border-border bg-card text-card-foreground transition-colors duration-200 motion-reduce:transition-none',
        'hover:border-foreground/30 hover:bg-secondary/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'w-full min-h-[44px]',
        variant === 'page' ? 'gap-3.5 p-3 sm:p-4' : 'gap-2.5 p-2.5',
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-md border border-border bg-secondary flex items-center justify-center',
          variant === 'page' ? 'h-20 w-20' : 'h-14 w-14',
        )}
      >
        {showThumbnail ? (
          <img
            src={getImageUrl(rawImageUrl)}
            alt={source.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-opacity duration-200 motion-reduce:transition-none group-hover:opacity-95"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground"
            aria-hidden="true"
          >
            <ShoppingBag
              className={variant === 'page' ? 'h-8 w-8' : 'h-6 w-6'}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors duration-200 motion-reduce:transition-none">
          {source.name}
        </p>
        {hasPrice && (
          <p className="text-sm font-semibold text-foreground tabular">
            Từ {formatCurrency(item.minPrice as number)}
          </p>
        )}
        <div className="flex items-center gap-0.5 text-xs font-medium text-primary group-hover:underline underline-offset-2">
          <span>Xem chi tiết</span>
          <ArrowUpRight
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </div>
      </div>
    </a>
  );
}

export default ChatSourceCard;
