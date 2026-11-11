import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatStreamingIndicatorProps {
  variant?: 'widget' | 'page';
  className?: string;
}

/**
 * Compact typing indicator displayed while waiting for the assistant's initial response stream.
 * Displays a bot avatar with 3 staggered bouncing dots and screen-reader status text.
 */
export function ChatStreamingIndicator({
  variant = 'widget',
  className,
}: ChatStreamingIndicatorProps) {
  const isPage = variant === 'page';

  return (
    <div
      role="status"
      className={cn('flex items-start gap-2.5 w-full justify-start', className)}
    >
      {/* Bot Avatar */}
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-secondary text-primary border border-border mt-0.5',
          isPage ? 'h-8 w-8' : 'h-7 w-7'
        )}
        aria-hidden="true"
      >
        <Bot className={isPage ? 'h-5 w-5' : 'h-4 w-4'} />
      </div>

      {/* Typing Bubble with staggered bouncing dots */}
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-lg rounded-tl-sm border border-border bg-card',
          isPage ? 'px-4 py-3' : 'px-3.5 py-2.5'
        )}
      >
        <span className="sr-only">Đang trả lời…</span>
        <span
          className={cn(
            'rounded-full bg-primary/70 animate-bounce motion-reduce:animate-none',
            isPage ? 'h-2 w-2' : 'h-1.5 w-1.5'
          )}
          style={{ animationDelay: '0ms' }}
          aria-hidden="true"
        />
        <span
          className={cn(
            'rounded-full bg-primary/70 animate-bounce motion-reduce:animate-none',
            isPage ? 'h-2 w-2' : 'h-1.5 w-1.5'
          )}
          style={{ animationDelay: '150ms' }}
          aria-hidden="true"
        />
        <span
          className={cn(
            'rounded-full bg-primary/70 animate-bounce motion-reduce:animate-none',
            isPage ? 'h-2 w-2' : 'h-1.5 w-1.5'
          )}
          style={{ animationDelay: '300ms' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default ChatStreamingIndicator;
