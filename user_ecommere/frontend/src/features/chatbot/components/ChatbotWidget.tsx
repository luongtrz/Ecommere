import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  Bot,
  Loader2,
  SendHorizonal,
  Sparkles,
  Plus,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatAgent } from '../hooks/useChatAgent';
import { useChatStore } from '../store/chatStore';
import { formatChatOwnerKey } from '../lib/session';
import { ToolCallCard } from './ToolCallCard';
import { ConfirmActionCard } from './ConfirmActionCard';
import { ChatMarkdown } from './ChatMarkdown';
import type { ChatSource } from '../types';

const MAX_MESSAGE_LENGTH = 4000;

const SUGGESTIONS = [
  'Tư vấn mùi xịt phòng cho phòng khách',
  'Nên chọn dung tích nào cho gia đình?',
  'Hướng dẫn sử dụng để mùi bền hơn',
];

const WELCOME_MESSAGE =
  'Xin chào! Tôi là chuyên gia tư vấn mùi hương của Thai Spray. Tôi có thể gợi ý mùi hương cho phòng khách, phòng ngủ, xe hơi hoặc quà tặng phù hợp nhất cho bạn.';

function ChatbotSourceItem({ source }: { source: ChatSource }) {
  return (
    <a
      href={`/p/${source.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 p-2 rounded-2xl border border-slate-100 bg-white hover:bg-secondary/40 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group w-full shadow-sm active:scale-[0.99]"
    >
      <div className="h-10 w-10 rounded-xl overflow-hidden bg-secondary/30 border border-slate-100 shrink-0 flex items-center justify-center font-bold text-[10px] text-muted-foreground">
        TS
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors">
          {source.name}
        </p>
        <p className="text-[10px] font-bold text-primary mt-0.5">
          Xem chi tiết
        </p>
      </div>
      <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all shrink-0 mr-0.5" />
    </a>
  );
}

export function ChatbotWidget() {
  const { open, setOpen, messages, ownerId, claimOwner } = useChatStore();
  const { isStreaming, send, decide, newThread } = useChatAgent();
  const { user } = useAuth();
  const toast = useToast();

  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(open);

  const ownerKey = formatChatOwnerKey(user ? user.id : null);

  // Sync conversation ownership with signed-in user or guest session
  useEffect(() => {
    if (user === undefined) return;
    if (useChatStore.getState().ownerId !== ownerKey) {
      newThread();
      claimOwner(ownerKey);
    }
  }, [user, ownerKey, newThread, claimOwner]);

  const isOwnerMatch = user !== undefined && ownerId === ownerKey;
  const visibleMessages = isOwnerMatch ? messages : [];

  // Escape closes the panel
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
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

  // Scroll to bottom when messages update or streaming starts
  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [open, visibleMessages, isStreaming]);

  const handleSubmit = () => {
    const prompt = draft.trim();
    if (!prompt || isStreaming) {
      return;
    }
    if (prompt.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự.`);
      return;
    }
    setDraft('');
    void send(prompt);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter that confirms an IME composition (Vietnamese input methods) must not send.
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-28 right-3 z-[60] flex h-[min(80vh,700px)] w-[calc(100vw-2rem)] max-w-[460px] flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white/90 backdrop-blur-2xl shadow-[0_24px_80px_rgba(24,46,37,0.25)] animate-in slide-in-from-bottom-4 duration-300 md:bottom-6 md:right-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950 via-primary to-emerald-900 px-5 py-4 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/10 shadow-inner">
                <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide">
                  Chuyên gia Mùi hương
                </p>
                <p className="text-[11px] text-white/80 mt-0.5 font-medium">
                  Tư vấn mùi thơm cho nhà ở & xe hơi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 rounded-xl"
                onClick={() => newThread()}
                title="Cuộc trò chuyện mới"
                aria-label="Cuộc trò chuyện mới"
                type="button"
              >
                <Plus className="h-4 w-4 opacity-80 hover:opacity-100" />
                <span className="sr-only">Cuộc trò chuyện mới</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 rounded-xl"
                onClick={() => setOpen(false)}
                title="Đóng"
                aria-label="Đóng cửa sổ trò chuyện"
                type="button"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Đóng</span>
              </Button>
            </div>
          </div>

          {/* Chat area */}
          <div
            role="log"
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white/70 px-4 py-4 scrollbar-hide"
          >
            {/* Greeting */}
            <div className="flex items-start gap-2.5 w-full justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary border border-primary/10 shadow-sm mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[80%] rounded-[1.5rem] rounded-tl-[0.25rem] border border-slate-100/90 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm">
                <div className="whitespace-pre-line text-sm">
                  {WELCOME_MESSAGE}
                </div>
              </div>
            </div>

            {/* Message list */}
            {visibleMessages.map((message) => {
              const isUser = message.role === 'user';
              if (!isUser) {
                const hasAssistantContent =
                  Boolean(message.content) ||
                  (message.tools && message.tools.length > 0) ||
                  Boolean(message.confirm) ||
                  (message.sources && message.sources.length > 0) ||
                  Boolean(message.error);
                if (!hasAssistantContent) {
                  return null;
                }
              }

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2.5 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary border border-primary/10 shadow-sm mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-[1.5rem] px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-300 ${
                      isUser
                        ? 'rounded-tr-[0.25rem] bg-gradient-to-tr from-primary to-emerald-950 text-white font-medium whitespace-pre-wrap break-words'
                        : 'rounded-tl-[0.25rem] border border-slate-100/90 bg-white text-slate-800'
                    }`}
                  >
                    {isUser ? (
                      <div>{message.content}</div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Tools rendered as ToolCallCard rows above text */}
                        {message.tools && message.tools.length > 0 && (
                          <div className="space-y-1.5">
                            {message.tools.map((step) => (
                              <ToolCallCard key={step.id} step={step} />
                            ))}
                          </div>
                        )}

                        {/* Text rendered with ChatMarkdown */}
                        {message.content ? (
                          <ChatMarkdown content={message.content} />
                        ) : null}

                        {/* Confirm block */}
                        {message.confirm && (
                          <ConfirmActionCard
                            calls={message.confirm.calls}
                            decided={message.confirm.decided}
                            onSubmit={(decisions) =>
                              decide(message.id, decisions)
                            }
                          />
                        )}

                        {/* Sources as product cards */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="border-t border-dashed border-slate-150 pt-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/10" />{' '}
                              Sản phẩm được đề xuất:
                            </p>
                            <div className="flex flex-col gap-2">
                              {message.sources.map((source) => (
                                <ChatbotSourceItem
                                  key={source.id}
                                  source={source}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Error in visible alert with role="alert" */}
                        {message.error && (
                          <div
                            role="alert"
                            className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive"
                          >
                            {message.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick suggestions when no conversation yet */}
            {visibleMessages.length === 0 ? (
              <div className="space-y-2.5 px-1 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Gợi ý nhanh
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={isStreaming}
                      onClick={() => {
                        if (!isStreaming) {
                          void send(suggestion);
                        }
                      }}
                      className="rounded-full border border-slate-200 bg-white/80 hover:bg-primary hover:text-white hover:border-primary px-4 py-2 text-left text-xs font-semibold text-slate-700 transition duration-300 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Streaming indicator */}
            {isOwnerMatch && isStreaming ? (
              <div className="flex justify-start items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary border border-primary/10 shadow-sm mt-0.5">
                  <Bot className="h-4 w-4 animate-bounce" />
                </div>
                <div className="flex items-center gap-2 rounded-[1.5rem] rounded-tl-[0.25rem] border border-slate-100 bg-white px-4 py-3 text-xs font-medium text-slate-500 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Đang trả lời...
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer Input Area */}
          <div className="border-t bg-white/80 backdrop-blur p-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/5 transition-all flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                aria-label="Nhập câu hỏi"
                className="min-h-[40px] max-h-[120px] resize-none border-0 px-3 py-2 shadow-none focus-visible:ring-0 focus:outline-none w-full text-sm placeholder:text-slate-400"
              />
              <Button
                onClick={handleSubmit}
                disabled={!draft.trim() || isStreaming}
                aria-label="Gửi tin nhắn"
                title="Gửi tin nhắn"
                size="icon"
                className="h-9 w-9 rounded-full shrink-0 shadow-md transition-all duration-300 hover:scale-105 active:scale-95 bg-primary hover:bg-emerald-950 text-white p-0 flex items-center justify-center disabled:opacity-50"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
                <span className="sr-only">Gửi tin nhắn</span>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Nhấn Enter để gửi · Shift+Enter để xuống dòng
            </p>
          </div>
        </div>
      ) : null}

      {!open ? (
        <Button
          ref={toggleButtonRef}
          type="button"
          size="icon"
          aria-label="Mở khung trò chuyện"
          onClick={() => setOpen(true)}
          className="fixed bottom-28 right-4 z-[60] h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-emerald-950 text-white shadow-[0_8px_30px_rgba(24,46,37,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border border-white/20 md:bottom-6 md:right-6 animate-bounce"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="h-6 w-6" />
            <span className="absolute -right-7 -top-6 hidden rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold text-white sm:block">
              Tư vấn
            </span>
          </div>
          <span className="sr-only">Mở khung trò chuyện</span>
        </Button>
      ) : null}
    </>
  );
}

export default ChatbotWidget;
