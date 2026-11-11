import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Plus,
  X,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChatAgent } from '../hooks/useChatAgent';
import { useChatStore } from '../store/chatStore';
import { useChatOwnerSync } from '../hooks/useChatOwnerSync';
import { useStickToBottom } from '../hooks/useStickToBottom';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatComposer } from './ChatComposer';
import { ChatStreamingIndicator } from './ChatStreamingIndicator';
import {
  CHAT_MAX_MESSAGE_LENGTH,
  CHAT_SUGGESTIONS,
  CHAT_WELCOME_MESSAGE,
  shouldShowTypingIndicator,
} from '../lib/chatContent';
import type { ChatMessage } from '../types';

const WELCOME_CHAT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: CHAT_WELCOME_MESSAGE,
  tools: [],
  createdAt: '',
};

export function ChatbotWidget() {
  const { open, setOpen } = useChatStore();
  const { isStreaming, send, decide, cancel, newThread, retry } = useChatAgent();
  const { messages } = useChatOwnerSync(newThread);
  const toast = useToast();
  const navigate = useNavigate();

  const [draft, setDraft] = useState('');
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const prevStreamingRef = useRef(isStreaming);

  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(open);

  const { scrollRef, isAtBottom, scrollToBottom } = useStickToBottom<HTMLDivElement>([
    messages,
    isStreaming,
  ]);

  const showTyping = shouldShowTypingIndicator(messages, isStreaming);

  // Screen reader polite announcements for streaming state
  useEffect(() => {
    if (!prevStreamingRef.current && isStreaming) {
      setSrAnnouncement('Trợ lý đang phản hồi…');
    } else if (prevStreamingRef.current && !isStreaming) {
      setSrAnnouncement('Trợ lý đã trả lời xong');
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Lock body scroll on mobile (below md / 768px) while chat panel is open
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const isMobileQuery = window.matchMedia('(max-width: 767.98px)');

    const updateScrollLock = () => {
      if (isMobileQuery.matches) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = originalOverflow;
      }
    };

    updateScrollLock();

    if (typeof isMobileQuery.addEventListener === 'function') {
      isMobileQuery.addEventListener('change', updateScrollLock);
    } else {
      isMobileQuery.addListener(updateScrollLock);
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      if (typeof isMobileQuery.removeEventListener === 'function') {
        isMobileQuery.removeEventListener('change', updateScrollLock);
      } else {
        isMobileQuery.removeListener(updateScrollLock);
      }
    };
  }, [open]);

  // Escape key closes the panel
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  // Return focus to toggle button when panel closes
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      toggleButtonRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  const handleSubmit = useCallback(() => {
    const prompt = draft.trim();
    if (!prompt || isStreaming) {
      return;
    }
    if (prompt.length > CHAT_MAX_MESSAGE_LENGTH) {
      toast.error(`Tin nhắn không được vượt quá ${CHAT_MAX_MESSAGE_LENGTH} ký tự.`);
      return;
    }
    setDraft('');
    void send(prompt);
  }, [draft, isStreaming, send, toast]);

  const handleExpand = useCallback(() => {
    if (isStreaming) return;
    setOpen(false);
    navigate('/chat');
  }, [isStreaming, setOpen, navigate]);

  return (
    <>
      {/* Screen-reader announcement region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {srAnnouncement}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-label="Trò chuyện với chuyên gia mùi hương"
          className={cn(
            'fixed inset-0 z-[60] flex flex-col h-[100dvh] pt-[env(safe-area-inset-top,0px)] md:pt-0 bg-card overflow-hidden',
            'md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:h-[min(680px,calc(100dvh-3rem))] md:rounded-3xl md:border md:border-border md:shadow-2xl',
            'animate-in fade-in-0 zoom-in-95 duration-200 motion-reduce:animate-none'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-primary px-4 py-3 sm:px-5 sm:py-3.5 text-primary-foreground shadow-sm shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10"
                aria-hidden="true"
              >
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight truncate">
                  Chuyên gia Mùi hương
                </p>
                <p className="text-xs text-primary-foreground/80 mt-0.5 truncate">
                  Tư vấn mùi thơm cho nhà ở & xe hơi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground rounded-lg hidden md:inline-flex disabled:opacity-50"
                disabled={isStreaming}
                onClick={handleExpand}
                title={isStreaming ? 'Không thể mở rộng khi đang trả lời' : 'Mở rộng'}
                aria-label="Mở rộng"
              >
                <Maximize2 className="h-4 w-4" />
                <span className="sr-only">Mở rộng</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground rounded-lg"
                onClick={() => newThread()}
                title="Cuộc trò chuyện mới"
                aria-label="Cuộc trò chuyện mới"
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Cuộc trò chuyện mới</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground rounded-lg"
                onClick={() => setOpen(false)}
                title="Đóng"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Đóng</span>
              </Button>
            </div>
          </div>

          {/* Chat scrollable log region + scroll-to-bottom pill */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div
              ref={scrollRef}
              role="log"
              aria-label="Lịch sử trò chuyện"
              className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4"
            >
              {/* Welcome message */}
              <ChatMessageItem
                message={WELCOME_CHAT_MESSAGE}
                variant="widget"
                onDecide={decide}
              />

              {/* Thread messages */}
              {messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                return (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    variant="widget"
                    onDecide={decide}
                    onRetry={isLast && message.error ? () => void retry() : undefined}
                  />
                );
              })}

              {/* Quick suggestion chips (only while there are no messages) */}
              {messages.length === 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Gợi ý nhanh
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CHAT_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={isStreaming}
                        onClick={() => {
                          if (!isStreaming) {
                            void send(suggestion);
                          }
                        }}
                        className="min-h-[36px] rounded-full border border-border bg-card px-4 py-1.5 text-left text-sm font-medium text-foreground transition-colors duration-200 motion-reduce:transition-none hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95 motion-reduce:active:scale-100 disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {showTyping && <ChatStreamingIndicator variant="widget" />}
            </div>

            {/* Floating scroll-to-bottom pill */}
            {!isAtBottom && (
              <button
                type="button"
                onClick={() => scrollToBottom('smooth')}
                aria-label="Cuộn xuống"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex min-h-[36px] items-center gap-1.5 rounded-full border border-border bg-card/95 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur transition-all duration-200 motion-reduce:transition-none hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 motion-reduce:active:scale-100"
              >
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Cuộn xuống</span>
              </button>
            )}
          </div>

          {/* Composer Input Area */}
          <div className="border-t border-border bg-card px-4 pt-3">
            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSubmit={handleSubmit}
              onStop={cancel}
              isStreaming={isStreaming}
              maxLength={CHAT_MAX_MESSAGE_LENGTH}
              variant="widget"
            />
          </div>
        </div>
      ) : null}

      {!open ? (
        <Button
          ref={toggleButtonRef}
          type="button"
          aria-label="Mở khung trò chuyện"
          onClick={() => setOpen(true)}
          className={cn(
            'fixed bottom-24 right-4 z-[60] md:bottom-6 md:right-6',
            'h-14 w-14 md:w-auto md:px-5 rounded-full',
            'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl',
            'transition-all duration-200 motion-reduce:transition-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'flex items-center justify-center gap-2.5 active:scale-95 motion-reduce:active:scale-100'
          )}
        >
          <Bot className="h-6 w-6 shrink-0" />
          <span className="hidden md:inline text-sm font-semibold">Tư vấn</span>
          <span className="sr-only md:hidden">Mở khung trò chuyện</span>
        </Button>
      ) : null}
    </>
  );
}

export default ChatbotWidget;
