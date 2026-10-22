import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
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
      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50 hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all duration-200 group w-full active:scale-[0.99] font-sans"
    >
      <div className="h-10 w-10 rounded-lg overflow-hidden bg-teal-50 border border-teal-100 shrink-0 flex items-center justify-center font-bold text-xs text-teal-700 font-sans">
        TS
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-900 leading-snug truncate group-hover:text-teal-600 transition-colors">
          {source.name}
        </p>
        <p className="text-[10px] font-semibold text-teal-600 mt-0.5 uppercase tracking-wider">
          Xem chi tiết
        </p>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0 mr-0.5" />
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
  const visibleMessages = useMemo(
    () => (isOwnerMatch ? messages : []),
    [isOwnerMatch, messages],
  );

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
        <div className="fixed inset-x-0 bottom-0 z-[60] flex h-[85vh] max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl rounded-b-none border-t border-slate-200 bg-white shadow-xl animate-in slide-in-from-bottom-4 duration-200 md:inset-auto md:bottom-6 md:right-6 md:h-[min(80vh,700px)] md:w-[440px] md:max-w-[460px] md:rounded-2xl md:border md:border-slate-200 font-sans">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-teal-600 px-5 py-4 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700/60 border border-teal-500/40">
                <Sparkles className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h2 className="font-sans text-sm md:text-base font-semibold tracking-tight text-white">Chuyên gia Mùi hương</h2>
                <p className="text-[11px] text-teal-100 mt-0.5 font-normal">Tư vấn mùi thơm cho nhà ở & xe hơi</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-teal-700 rounded-lg transition-colors"
                onClick={() => newThread()}
                title="Cuộc trò chuyện mới"
                aria-label="Cuộc trò chuyện mới"
                type="button"
              >
                <Plus className="h-4 w-4 opacity-90 hover:opacity-100" />
                <span className="sr-only">Cuộc trò chuyện mới</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-teal-700 rounded-lg transition-colors"
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
            className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4 scrollbar-hide"
          >
            {/* Greeting */}
            <div className="flex items-start gap-2.5 w-full justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 border border-teal-200 shadow-sm mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-sm">
                <div className="whitespace-pre-line text-sm text-slate-700 leading-relaxed">{WELCOME_MESSAGE}</div>
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
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 border border-teal-200 shadow-sm mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-200 ${
                      isUser
                        ? 'rounded-tr-sm bg-teal-600 text-white font-medium whitespace-pre-wrap break-words'
                        : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800'
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
                          <div className="border-t border-slate-200 pt-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Sản phẩm được đề xuất:
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
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600 leading-relaxed"
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gợi ý nhanh</p>
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
                      className="rounded-lg border border-slate-200 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 px-3.5 py-1.5 text-left text-xs font-medium text-slate-700 transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 border border-teal-200 shadow-sm mt-0.5">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-500 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                  Đang trả lời...
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer Input Area */}
          <div className="border-t border-slate-200 bg-white p-3.5 pb-6 md:p-4 md:pb-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100 transition-all flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                aria-label="Nhập câu hỏi"
                className="min-h-[40px] max-h-[120px] resize-none border-0 px-3 py-2 shadow-none focus-visible:ring-0 focus:outline-none w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent"
              />
              <Button
                onClick={handleSubmit}
                disabled={!draft.trim() || isStreaming}
                aria-label="Gửi tin nhắn"
                title="Gửi tin nhắn"
                size="icon"
                type="button"
                className="h-9 w-9 rounded-lg shrink-0 shadow-sm transition-all duration-200 bg-teal-600 hover:bg-teal-700 text-white p-0 flex items-center justify-center disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
                <span className="sr-only">Gửi tin nhắn</span>
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-normal">
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
          className="fixed bottom-24 right-4 z-[60] h-14 w-14 rounded-full bg-teal-600 text-white shadow-lg hover:shadow-xl hover:bg-teal-700 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center border border-teal-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 md:bottom-6 md:right-6"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="h-6 w-6" />
            <span className="absolute -right-7 -top-6 hidden rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm sm:block">
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
