import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Bot, Loader2, SendHorizonal, Sparkles, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { chatbotApi, type ChatbotRole } from '../api/chatbot.api';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: ChatbotRole;
  content: string;
  createdAt: string;
}

const STORAGE_KEY = 'thai-spray-chatbot-messages';
const SESSION_STORAGE_KEY = 'thai-spray-chatbot-session-id';
const SUGGESTIONS = [
  'Tư vấn mùi xịt phòng cho phòng khách',
  'Nên chọn dung tích nào cho gia đình?',
  'Hướng dẫn sử dụng để mùi bền hơn',
];
const WELCOME_MESSAGE =
  'Xin chào, tôi là trợ lý Thai Spray. Bạn có thể hỏi về sản phẩm, mùi hương, cách dùng hoặc đơn hàng.';
const LEGACY_MESSAGE_REWRITES: Record<string, string> = {
  'Xin chao, toi la tro ly Thai Spray. Ban co the hoi ve san pham, mui huong, cach dung hoac don hang.':
    WELCOME_MESSAGE,
};

function createChatMessage(role: ChatbotRole, content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
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
      setMessages((current) => [...current, createChatMessage('assistant', data.message)]);
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
        // The new session id is already active on the client, so failing to delete
        // the old Redis history only affects TTL cleanup on the server.
      });
    }
  };

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-20 right-3 z-50 flex h-[min(70vh,580px)] w-[calc(100vw-1.5rem)] max-w-[380px] flex-col overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl md:bottom-6 md:right-6">
          <div className="flex items-start justify-between gap-3 border-b bg-foreground px-4 py-4 text-white">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Tư vấn cùng Thai Spray</p>
                <p className="mt-1 text-xs text-white/70">Chatbot sẽ gọi qua backend, lấy dữ liệu sản phẩm từ DB và giữ API key ở server.</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
                onClick={handleReset}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm',
                    message.role === 'user'
                      ? 'rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {messages.length <= 1 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Gợi ý nhanh</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setDraft(suggestion)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 transition hover:border-primary hover:text-primary"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {mutation.isPending ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-3xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang phản hồi...
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

          <div className="border-t bg-background p-4">
            <div className="rounded-3xl border border-border bg-white p-2 shadow-sm">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                className="min-h-[96px] resize-none border-0 px-2 py-2 shadow-none focus-visible:ring-0"
                maxLength={4000}
              />
              <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
                <p className="text-xs text-muted-foreground">Enter để gửi, Shift+Enter để xuống dòng</p>
                <Button
                  onClick={handleSubmit}
                  disabled={!draft.trim() || mutation.isPending || !sessionId}
                  className="rounded-full px-4"
                >
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizonal className="mr-2 h-4 w-4" />
                  )}
                  Gửi
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!isOpen ? (
        <Button
          type="button"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-3 z-50 h-14 w-14 rounded-full shadow-xl md:bottom-6 md:right-6"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="h-6 w-6" />
            <span className="absolute -right-7 -top-6 hidden rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold text-white sm:block">
              Chat
            </span>
          </div>
        </Button>
      ) : null}
    </>
  );
}
