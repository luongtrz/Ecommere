import { useRef, useEffect, type KeyboardEvent } from 'react';
import { SendHorizonal, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CHAT_MAX_MESSAGE_LENGTH } from '../lib/chatContent';

export interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  maxLength?: number;
  variant?: 'widget' | 'page';
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Controlled chat composer with auto-growing textarea, IME composition guard,
 * Enter-to-send support, character counter, and dynamic Send/Stop button.
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  maxLength = CHAT_MAX_MESSAGE_LENGTH,
  variant = 'widget',
  placeholder = 'Nhập câu hỏi của bạn...',
  autoFocus = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isPage = variant === 'page';
  const maxHeight = isPage ? 160 : 120;

  // Auto-grow height based on scrollHeight, capped at maxHeight
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, maxHeight]);

  // Handle autoFocus if requested
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter that confirms an IME composition (Vietnamese input methods: Telex, VNI, etc.) must NOT send.
    if (event.nativeEvent.isComposing || event.keyCode === 229) {
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !isStreaming) {
        onSubmit();
      }
    }
  };

  const handleActionClick = () => {
    if (isStreaming) {
      onStop();
    } else if (value.trim()) {
      onSubmit();
    }
  };

  const limit = maxLength > 0 ? maxLength : CHAT_MAX_MESSAGE_LENGTH;
  const counterThreshold = Math.floor(limit * 0.8);
  const showCounter = limit > 0 && value.length >= counterThreshold;

  return (
    <div className="w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="rounded-3xl border border-border bg-card p-1.5 shadow-sm transition-all duration-200 motion-reduce:transition-none focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/30 flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={limit}
          aria-label={placeholder}
          rows={1}
          className={cn(
            'min-h-[40px] resize-none border-0 bg-transparent px-3 py-2 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0 focus:outline-none w-full leading-relaxed',
            isPage ? 'max-h-[160px]' : 'max-h-[120px]'
          )}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleActionClick}
          disabled={!isStreaming && !value.trim()}
          aria-label={isStreaming ? 'Dừng' : 'Gửi tin nhắn'}
          title={isStreaming ? 'Dừng' : 'Gửi tin nhắn'}
          className={cn(
            'rounded-full shrink-0 shadow-sm transition-all duration-200 motion-reduce:transition-none bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center disabled:opacity-50 active:scale-95 motion-reduce:active:scale-100',
            isPage ? 'h-10 w-10' : 'h-9 w-9'
          )}
        >
          {isStreaming ? (
            <Square className="h-4 w-4 fill-current" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
          <span className="sr-only">{isStreaming ? 'Dừng' : 'Gửi tin nhắn'}</span>
        </Button>
      </div>

      {/* Footer hint & character counter */}
      <div
        className={cn(
          'items-center justify-between gap-2 px-2 text-xs text-muted-foreground mt-1.5',
          showCounter ? 'flex' : 'hidden sm:flex'
        )}
      >
        <span className="hidden sm:inline">
          Enter để gửi · Shift+Enter để xuống dòng
        </span>
        {showCounter ? (
          <span
            className={cn(
              'text-xs tabular-nums ml-auto',
              value.length >= limit ? 'text-destructive font-semibold' : 'text-muted-foreground'
            )}
            aria-live="polite"
          >
            {value.length}/{limit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default ChatComposer;
