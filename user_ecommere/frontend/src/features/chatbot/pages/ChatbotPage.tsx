import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Bot, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEO } from '@/lib/seo';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { useChatAgent } from '../hooks/useChatAgent';
import { useChatOwnerSync } from '../hooks/useChatOwnerSync';
import { useStickToBottom } from '../hooks/useStickToBottom';
import { useChatStore } from '../store/chatStore';
import { ChatMessageItem } from '../components/ChatMessageItem';
import { ChatComposer } from '../components/ChatComposer';
import { ChatStreamingIndicator } from '../components/ChatStreamingIndicator';
import {
  CHAT_WELCOME_MESSAGE,
  CHAT_SUGGESTIONS,
  CHAT_MAX_MESSAGE_LENGTH,
  shouldShowTypingIndicator,
} from '../lib/chatContent';

export function ChatbotPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [draft, setDraft] = useState('');
  const [liveStatus, setLiveStatus] = useState('');

  const { isStreaming, send, decide, cancel, newThread, retry } = useChatAgent();
  const { messages } = useChatOwnerSync(newThread);
  const { scrollRef, isAtBottom, scrollToBottom } = useStickToBottom([messages, isStreaming]);

  const prevStreamingRef = useRef(isStreaming);

  // Screen reader polite announcements on stream start / end
  useEffect(() => {
    if (!prevStreamingRef.current && isStreaming) {
      setLiveStatus('Trợ lý đang trả lời…');
    } else if (prevStreamingRef.current && !isStreaming) {
      setLiveStatus('Trợ lý đã hoàn tất câu trả lời.');
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const handleMinimize = () => {
    useChatStore.getState().setOpen(true);
    if (
      typeof window !== 'undefined' &&
      typeof window.history?.state?.idx === 'number' &&
      window.history.state.idx > 0
    ) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleSubmit = () => {
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
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
      <SEO title="Chuyên gia Mùi hương" />

      {/* 1. Top bar (~56px, border-b, solid background, safe-area top padding) */}
      <header className="shrink-0 border-b border-border bg-background z-10 pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4 max-w-5xl mx-auto w-full">
          {/* Left: Quay lại */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMinimize}
            aria-label="Quay lại"
            className="min-h-11 min-w-11 h-11 w-11 sm:w-auto px-0 sm:px-3 text-sm font-medium gap-1.5 text-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-colors duration-200 motion-reduce:transition-none"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Quay lại</span>
          </Button>

          {/* Center: Title block */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0"
              aria-hidden="true"
            >
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0 text-left">
              <h1 className="text-sm font-semibold font-sans leading-tight text-foreground truncate">
                Chuyên gia Mùi hương
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block truncate">
                Tư vấn mùi thơm cho nhà ở &amp; xe hơi
              </p>
            </div>
          </div>

          {/* Right: Cuộc trò chuyện mới */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={newThread}
            aria-label="Cuộc trò chuyện mới"
            className="min-h-11 min-w-11 h-11 w-11 sm:w-auto px-0 sm:px-3 text-sm font-medium gap-1.5 text-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-colors duration-200 motion-reduce:transition-none"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Cuộc trò chuyện mới</span>
          </Button>
        </div>
      </header>

      {/* 2. Scroll area */}
      <div
        ref={scrollRef}
        role="log"
        aria-label="Lịch sử cuộc trò chuyện"
        className="flex-1 overflow-y-auto overscroll-contain flex flex-col"
      >
        {/* Screen-reader live region */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveStatus}
        </div>

        <div className={cn("mx-auto w-full max-w-3xl px-4 py-6 space-y-6", messages.length === 0 && "flex-1 min-h-full flex flex-col justify-center")}>
          {/* 3. Empty state */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-6 text-center animate-fade-in motion-reduce:animate-none">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-primary border border-border"
                aria-hidden="true"
              >
                <Bot className="h-8 w-8" />
              </div>
              <div className="space-y-2 max-w-lg">
                <h2 className="text-xl sm:text-2xl font-semibold leading-snug text-foreground">
                  Tôi có thể giúp gì cho bạn?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {CHAT_WELCOME_MESSAGE}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 w-full pt-2">
                {CHAT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={isStreaming}
                    onClick={() => void send(suggestion)}
                    className="rounded-lg border border-border bg-card p-4 text-sm text-card-foreground text-left leading-snug transition-colors duration-200 motion-reduce:transition-none hover:border-foreground/30 hover:bg-secondary/40 active:scale-[0.98] motion-reduce:active:scale-100 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11"
                  >
                    <span className="font-medium text-foreground">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 4. Conversation */
            <>
              {messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                const hasError = Boolean(message.error && message.error.trim().length > 0);
                const onRetry = isLast && hasError ? () => void retry() : undefined;

                return (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    onDecide={decide}
                    onRetry={onRetry}
                    variant="page"
                  />
                );
              })}

              {shouldShowTypingIndicator(messages, isStreaming) && (
                <ChatStreamingIndicator variant="page" />
              )}
            </>
          )}
        </div>
      </div>

      {/* 5. Composer dock at the bottom */}
      <div className="relative shrink-0 border-t border-border bg-background z-10">
        {/* Floating "Cuộn xuống" pill */}
        {!isAtBottom && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-fade-in motion-reduce:animate-none">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => scrollToBottom('smooth')}
              className="rounded-full shadow-md border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary flex items-center gap-1.5 transition-colors duration-200 motion-reduce:transition-none active:scale-95 min-h-11 sm:min-h-[36px]"
              aria-label="Cuộn xuống tin nhắn mới nhất"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              <span>Cuộn xuống</span>
            </Button>
          </div>
        )}

        <div className="mx-auto w-full max-w-3xl px-4 pt-3">
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={handleSubmit}
            onStop={cancel}
            isStreaming={isStreaming}
            variant="page"
          />
          <p className="text-xs text-muted-foreground text-center pb-2 select-none leading-normal">
            Trợ lý AI có thể nhầm lẫn. Vui lòng kiểm tra thông tin sản phẩm trước khi đặt hàng.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;
