import { Bot, RotateCcw, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToolCallCard } from './ToolCallCard';
import { ConfirmActionCard } from './ConfirmActionCard';
import { ChatMarkdown } from './ChatMarkdown';
import { ChatSourceCard } from './ChatSourceCard';
import type { ChatMessage } from '../types';

export interface ChatMessageItemProps {
  message: ChatMessage;
  onDecide: (
    messageId: string,
    decisions: Array<{ callId: string; approve: boolean }>
  ) => void | Promise<void>;
  onRetry?: () => void;
  variant?: 'widget' | 'page';
}

export function ChatMessageItem({
  message,
  onDecide,
  onRetry,
  variant = 'widget',
}: ChatMessageItemProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex w-full justify-end">
        <div
          className={cn(
            'rounded-lg rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground whitespace-pre-wrap break-words',
            variant === 'page' ? 'max-w-[75%]' : 'max-w-[85%]'
          )}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message: returns null if it has no content, tools, confirm, sources and error
  const hasContent = Boolean(message.content && message.content.trim().length > 0);
  const hasTools = Boolean(message.tools && message.tools.length > 0);
  const hasConfirm = Boolean(
    message.confirm &&
    message.confirm.calls &&
    message.confirm.calls.length > 0
  );
  const hasSources = Boolean(message.sources && message.sources.length > 0);
  const hasError = Boolean(message.error && message.error.trim().length > 0);

  if (!hasContent && !hasTools && !hasConfirm && !hasSources && !hasError) {
    return null;
  }

  return (
    <div className="flex w-full items-start gap-2.5 sm:gap-3 justify-start">
      {/* Left avatar */}
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary border border-border mt-0.5"
        aria-hidden="true"
      >
        <Bot className="h-4 w-4" />
      </div>

      {/* Message column */}
      <div
        className={cn(
          'flex-1 min-w-0',
          variant === 'page' ? 'max-w-[85%] space-y-3' : 'max-w-[92%] space-y-2.5'
        )}
      >
        {/* 1. Tool call cards */}
        {hasTools && (
          <div className="w-full space-y-1.5">
            {message.tools.map((step) => (
              <ToolCallCard key={step.id} step={step} />
            ))}
          </div>
        )}

        {/* 2. Markdown answer */}
        {hasContent && (
          variant === 'widget' ? (
            <div className="w-full rounded-lg rounded-tl-sm border border-border bg-card px-4 py-3 text-sm text-card-foreground">
              <ChatMarkdown content={message.content} size="sm" />
            </div>
          ) : (
            <div className="w-full text-foreground leading-relaxed">
              <ChatMarkdown content={message.content} size="base" />
            </div>
          )
        )}

        {/* 3. Confirm action card */}
        {hasConfirm && message.confirm && (
          <div className="w-full">
            <ConfirmActionCard
              calls={message.confirm.calls}
              decided={message.confirm.decided}
              onSubmit={(decisions) => onDecide(message.id, decisions)}
            />
          </div>
        )}

        {/* 4. Recommended products */}
        {hasSources && message.sources && (
          <div className="w-full space-y-2 pt-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span>Sản phẩm gợi ý</span>
            </p>
            <div
              className={
                variant === 'page'
                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 w-full'
                  : 'flex flex-col gap-2 w-full'
              }
            >
              {message.sources.map((source) => (
                <ChatSourceCard key={source.id} source={source} variant={variant} />
              ))}
            </div>
          </div>
        )}

        {/* 5. Error box */}
        {hasError && message.error && (
          <div
            role="alert"
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <span className="flex-1 break-words">{message.error}</span>
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="shrink-0 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs rounded-md min-h-11 sm:min-h-9 px-3"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Thử lại</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessageItem;
