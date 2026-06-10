import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Bot, Loader2, SendHorizonal, Sparkles, Trash2, X, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { chatbotApi, type ChatbotRole, type ChatbotSource } from '../api/chatbot.api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn, getImageUrl } from '@/lib/utils';
import { useProductDetail } from '@/features/catalog/hooks/useProductDetail';
import { formatCurrency } from '@/lib/formatters';

interface ChatMessage {
  id: string;
  role: ChatbotRole;
  content: string;
  createdAt: string;
  sources?: ChatbotSource[];
}

const STORAGE_KEY = 'thai-spray-chatbot-messages';
const SESSION_STORAGE_KEY = 'thai-spray-chatbot-session-id';
const SUGGESTIONS = [
  'Tư vấn mùi xịt phòng cho phòng khách',
  'Nên chọn dung tích nào cho gia đình?',
  'Hướng dẫn sử dụng để mùi bền hơn',
];
const WELCOME_MESSAGE =
  'Xin chào! Tôi là chuyên gia tư vấn mùi hương của Thai Spray. Tôi có thể gợi ý mùi hương cho phòng khách, phòng ngủ, xe hơi hoặc quà tặng phù hợp nhất cho bạn.';
const LEGACY_MESSAGE_REWRITES: Record<string, string> = {
  'Xin chao, toi la tro ly Thai Spray. Ban co the hoi ve san pham, mui huong, cach dung hoac don hang.':
    WELCOME_MESSAGE,
  'Xin chào, tôi là trợ lý Thai Spray. Bạn có thể hỏi về sản phẩm, mùi hương, cách dùng hoặc đơn hàng.':
    WELCOME_MESSAGE,
};

function createChatMessage(role: ChatbotRole, content: string, sources?: ChatbotSource[]): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    sources,
  };
}

function ChatbotSourceItem({ source }: { source: ChatbotSource }) {
  const { data: product, isLoading } = useProductDetail(source.slug);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-2xl border border-slate-100 bg-white/60 animate-pulse w-full">
        <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="h-3 bg-slate-200 rounded w-5/6" />
          <div className="h-2.5 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  const price = product?.variants?.[0]?.salePrice || product?.variants?.[0]?.price || product?.basePrice || 0;
  const image = product?.images?.[0] || '';

  return (
    <a
      href={`/p/${source.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 p-2 rounded-2xl border border-slate-100 bg-white hover:bg-secondary/40 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group w-full shadow-sm active:scale-[0.99]"
    >
      <div className="h-10 w-10 rounded-xl overflow-hidden bg-secondary/30 border border-slate-100 shrink-0">
        {image ? (
          <img
            src={getImageUrl(image, { width: 100 })}
            alt={source.name}
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center font-bold text-[10px] text-muted-foreground">TS</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors">
          {source.name}
        </p>
        <p className="text-[10px] font-bold text-primary mt-0.5">
          {price > 0 ? formatCurrency(price) : 'Xem chi tiết'}
        </p>
      </div>
      <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all shrink-0 mr-0.5" />
    </a>
  );
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `chat_${crypto.randomUUID()}`;
  }

  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getInitialMessages(): ChatMessage[] {
  return [createChatMessage('assistant', WELCOME_MESSAGE)];
}

function normalizeMessage(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    return (
      normalizeMessage(error.response?.data?.message) ||
      normalizeMessage(error.response?.data?.error) ||
      error.message ||
      'Không thể kết nối chatbot lúc này.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể kết nối chatbot lúc này.';
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(STORAGE_KEY, getInitialMessages());
  const [sessionId, setSessionId] = useLocalStorage<string>(SESSION_STORAGE_KEY, createSessionId());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((current) => {
      let hasChanges = false;

      const nextMessages = current.map((message) => {
        const nextContent = LEGACY_MESSAGE_REWRITES[message.content];

        if (!nextContent) {
          return message;
        }

        hasChanges = true;
        return {
          ...message,
          content: nextContent,
        };
      });

      return hasChanges ? nextMessages : current;
    });
  }, [setMessages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages(getInitialMessages());
    }
  }, [messages.length, setMessages]);

  useEffect(() => {
    if (!sessionId) {
      setSessionId(createSessionId());
    }
  }, [sessionId, setSessionId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, messages]);

  const mutation = useMutation({
    mutationFn: chatbotApi.sendMessage,
    onSuccess: (data) => {
      setLastError(null);
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }
      setMessages((current) => [...current, createChatMessage('assistant', data.message, data.sources)]);
    },
    onError: (error) => {
      const message = getErrorMessage(error);
      setLastError(message);
      toast.error(message);
    },
  });

  const handleSubmit = () => {
    const prompt = draft.trim();

    if (!prompt || mutation.isPending || !sessionId) {
      return;
    }

    setLastError(null);
    setDraft('');
    setMessages((current) => [...current, createChatMessage('user', prompt)]);
    mutation.mutate({ prompt, sessionId });
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    const previousSessionId = sessionId;
    const nextSessionId = createSessionId();

    setLastError(null);
    setDraft('');
    setMessages(getInitialMessages());
    setSessionId(nextSessionId);

    if (previousSessionId) {
      void chatbotApi.clearHistory(previousSessionId).catch(() => {
        // TTL cleanup fallback
      });
    }
  };

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-20 right-3 z-50 flex h-[min(80vh,700px)] w-[calc(100vw-2rem)] max-w-[460px] flex-col overflow-hidden rounded-[28px] border border-white/60 bg-white/90 backdrop-blur-2xl shadow-[0_24px_80px_rgba(24,46,37,0.25)] animate-in slide-in-from-bottom-4 duration-300 md:bottom-6 md:right-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-950 via-primary to-emerald-900 px-5 py-4 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/10 shadow-inner">
                <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-wide">Chuyên gia Mùi hương</p>
                <p className="text-[11px] text-white/80 mt-0.5 font-medium">Tư vấn mùi thơm cho nhà ở & xe hơi</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 rounded-xl"
                onClick={handleReset}
                title="Làm mới hội thoại"
                type="button"
              >
                <Trash2 className="h-4 w-4 opacity-80 hover:opacity-100" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 rounded-xl"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white/70 px-4 py-4 scrollbar-hide">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={cn('flex items-start gap-2.5 w-full', isUser ? 'justify-end' : 'justify-start')}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary border border-primary/10 shadow-sm mt-0.5">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-[1.5rem] px-4 py-3 text-sm leading-relaxed shadow-sm transition-all duration-300',
                      isUser
                        ? 'rounded-tr-[0.25rem] bg-gradient-to-tr from-primary to-emerald-950 text-white font-medium'
                        : 'rounded-tl-[0.25rem] border border-slate-100/90 bg-white text-slate-800'
                    )}
                  >
                    <div className="whitespace-pre-line text-sm">{message.content}</div>

                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                      <div className="mt-3 border-t border-dashed border-slate-150 pt-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-primary fill-primary/10" /> Sản phẩm được đề xuất:
                        </p>
                        <div className="flex flex-col gap-2">
                          {message.sources.map((source) => (
                            <ChatbotSourceItem key={source.id} source={source} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {messages.length <= 1 ? (
              <div className="space-y-2.5 px-1 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Gợi ý nhanh</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setDraft(suggestion)}
                      className="rounded-full border border-slate-200 bg-white/80 hover:bg-primary hover:text-white hover:border-primary px-4 py-2 text-left text-xs font-semibold text-slate-700 transition duration-300 shadow-sm active:scale-95"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {mutation.isPending ? (
              <div className="flex justify-start items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-primary border border-primary/10 shadow-sm mt-0.5">
                  <Bot className="h-4 w-4 animate-bounce" />
                </div>
                <div className="flex items-center gap-2 rounded-[1.5rem] rounded-tl-[0.25rem] border border-slate-100 bg-white px-4 py-3 text-xs font-medium text-slate-500 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Đang pha chế mùi hương...
                </div>
              </div>
            ) : null}

            {lastError ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                {lastError}
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
                className="min-h-[40px] max-h-[120px] resize-none border-0 px-3 py-2 shadow-none focus-visible:ring-0 focus:outline-none w-full text-sm placeholder:text-slate-400"
                maxLength={4000}
              />
              <Button
                onClick={handleSubmit}
                disabled={!draft.trim() || mutation.isPending || !sessionId}
                size="icon"
                className="h-9 w-9 rounded-full shrink-0 shadow-md transition-all duration-300 hover:scale-105 active:scale-95 bg-primary hover:bg-emerald-950 text-white p-0 flex items-center justify-center"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Nhấn Enter để gửi · Shift+Enter để xuống dòng
            </p>
          </div>
        </div>
      ) : null}

      {!isOpen ? (
        <Button
          type="button"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full bg-gradient-to-tr from-primary to-emerald-950 text-white shadow-[0_8px_30px_rgba(24,46,37,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border border-white/20 md:bottom-6 md:right-6 animate-bounce"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="h-6 w-6" />
            <span className="absolute -right-7 -top-6 hidden rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold text-white sm:block">
              Tư vấn
            </span>
          </div>
        </Button>
      ) : null}
    </>
  );
}
