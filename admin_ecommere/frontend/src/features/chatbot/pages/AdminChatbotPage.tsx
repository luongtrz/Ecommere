import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Bot,
  Send,
  Loader2,
  Trash2,
  Plus,
  History,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Square,
} from 'lucide-react';

import { useChatAgent } from '../hooks/useChatAgent';
import { useChatStore } from '../store/chatStore';
import { agentApi, type AgentThreadSummary } from '../api/agent.api';
import { ToolCallCard } from '../components/ToolCallCard';
import { ConfirmActionCard } from '../components/ConfirmActionCard';
import { ChatMarkdown } from '../components/ChatMarkdown';
import type { ChatMessage } from '../types';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { SEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Doanh thu tháng này',
  'Đơn hàng đang chờ thanh toán',
  'Sản phẩm tồn kho thấp',
  'Mã giảm giá đang hoạt động',
];

const MAX_MESSAGE_LENGTH = 4000;
const DEFAULT_THREAD_LIMIT = 20;
const THREAD_LIMIT_STEP = 20;
const MAX_THREAD_LIMIT = 50;

function formatVietnameseDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return formatDateTime(d);
  } catch {
    return dateStr;
  }
}

interface ThreadListContentProps {
  threads: AgentThreadSummary[];
  currentThreadId: string | null;
  onSelectThread: (id: string) => void;
  onNewThread: () => void;
  onDeleteClick: (thread: AgentThreadSummary) => void;
  isLoading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

function ThreadListContent({
  threads,
  currentThreadId,
  onSelectThread,
  onNewThread,
  onDeleteClick,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: ThreadListContentProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0 bg-white">
      <div className="p-3 border-b border-slate-200 shrink-0 bg-slate-50/50">
        <Button
          variant="default"
          className="w-full justify-center gap-2 rounded-lg text-xs font-semibold h-9 shadow-sm bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors"
          onClick={onNewThread}
        >
          <Plus className="h-4 w-4" />
          <span>Cuộc trò chuyện mới</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
            <span className="text-xs text-slate-500">Đang tải danh sách…</span>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-3">
            <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          <>
            {threads.map((thread) => {
              const isSelected = thread.id === currentThreadId;
              const title = thread.title || 'Cuộc trò chuyện chưa đặt tên';
              const dateText = formatVietnameseDate(thread.updatedAt);

              return (
                <div
                  key={thread.id}
                  className="group flex items-center justify-between gap-1 rounded-lg"
                >
                  <button
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => onSelectThread(thread.id)}
                    className={cn(
                      'flex-1 min-w-0 rounded-lg px-3 py-2 text-xs text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                      isSelected
                        ? 'bg-teal-50 text-teal-700 font-semibold border-l-2 border-l-teal-600 border-t border-r border-b border-teal-200/60 shadow-sm'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
                    )}
                  >
                    <p className="truncate font-medium leading-snug">{title}</p>
                    {dateText && (
                      <p
                        className={cn(
                          'mt-1 text-[11px] truncate tabular-nums',
                          isSelected ? 'text-teal-600 font-normal' : 'text-slate-400'
                        )}
                      >
                        {dateText}
                      </p>
                    )}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-teal-500"
                    onClick={() => onDeleteClick(thread)}
                    aria-label="Xóa cuộc trò chuyện"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}

            {hasMore && (
              <div className="pt-2 pb-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2 rounded-lg text-xs font-medium h-9 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
                  <span>Tải thêm</span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AdminChatbotPage() {
  const [input, setInput] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<AgentThreadSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [threadLimit, setThreadLimit] = useState(DEFAULT_THREAD_LIMIT);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const transcriptRequestIdRef = useRef(0);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { isStreaming, send, decide, cancel, newThread } = useChatAgent();
  const threadId = useChatStore((s) => s.threadId);
  const messages = useChatStore((s) => s.messages);
  const ownerId = useChatStore((s) => s.ownerId);
  const claimOwner = useChatStore((s) => s.claimOwner);
  const reset = useChatStore((s) => s.reset);
  const setThreadId = useChatStore((s) => s.setThreadId);
  const appendMessage = useChatStore((s) => s.appendMessage);

  const { user } = useAuth();

  useEffect(() => {
    if (user === undefined) return;
    const id = user ? user.id : null;
    if (useChatStore.getState().ownerId !== id) {
      newThread();
      claimOwner(id);
    }
  }, [user, newThread, claimOwner]);

  const currentAdminId = user ? user.id : null;
  const isOwnerMatch = user !== undefined && ownerId === currentAdminId;
  const visibleMessages = isOwnerMatch ? messages : [];

  const {
    data: threads = [],
    isLoading: isThreadsLoading,
    isFetching: isThreadsFetching,
  } = useQuery({
    queryKey: ['admin', 'chatbot', 'threads', threadLimit],
    queryFn: () => agentApi.listThreads(threadLimit),
    placeholderData: keepPreviousData,
  });

  const hasMoreThreads = threads.length >= threadLimit && threadLimit < MAX_THREAD_LIMIT;
  const handleLoadMoreThreads = () => {
    setThreadLimit((limit) => Math.min(limit + THREAD_LIMIT_STEP, MAX_THREAD_LIMIT));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, isStreaming]);

  const startNewConversation = () => {
    transcriptRequestIdRef.current += 1;
    setIsLoadingTranscript(false);
    setThreadError(null);
    newThread();
  };

  const handleSelectThread = async (id: string) => {
    if (isStreaming) {
      cancel();
    }
    const requestId = ++transcriptRequestIdRef.current;
    reset();
    setThreadId(id);
    setIsLoadingTranscript(true);
    setThreadError(null);
    try {
      const transcript = await agentApi.getTranscript(id);
      if (requestId !== transcriptRequestIdRef.current) {
        return;
      }
      const now = new Date().toISOString();
      for (const msg of transcript) {
        const hasToolCalls =
          Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0;

        let confirm: ChatMessage['confirm'] | undefined = undefined;

        if (msg.role === 'assistant' && msg.pending === true && hasToolCalls) {
          confirm = {
            calls: msg.tool_calls!.map((c) => ({
              id: c.id ?? '',
              name: c.name,
              summary: c.summary ?? c.name,
              risk: c.risk ?? 'DESTRUCTIVE',
            })),
            decided: false,
          };
        }

        const hasContent = Boolean(msg.content && msg.content.trim().length > 0);

        // An assistant message with no text and no card must not show as an empty chat bubble.
        if (msg.role === 'assistant' && !hasContent && !confirm) {
          continue;
        }

        appendMessage({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          tools: [],
          confirm,
          createdAt: now,
        });
      }
    } catch (err: unknown) {
      if (requestId !== transcriptRequestIdRef.current) {
        return;
      }
      const status =
        (err as { response?: { status?: number }; status?: number })?.response?.status ??
        (err as { status?: number })?.status;

      if (status === 404) {
        toast.error('Cuộc trò chuyện không còn khả dụng.');
        setThreadError('Cuộc trò chuyện không còn khả dụng.');
        startNewConversation();
      } else {
        toast.error('Không thể tải cuộc trò chuyện.');
      }
    } finally {
      if (requestId === transcriptRequestIdRef.current) {
        setIsLoadingTranscript(false);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!threadToDelete) return;
    setIsDeleting(true);
    try {
      await agentApi.deleteThread(threadToDelete.id);
      if (threadToDelete.id === threadId) {
        startNewConversation();
      }
      await queryClient.invalidateQueries({ queryKey: ['admin', 'chatbot', 'threads'] });
      toast.success('Đã xóa cuộc trò chuyện thành công');
    } catch {
      toast.error('Xóa cuộc trò chuyện thất bại. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
      setThreadToDelete(null);
    }
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự.`);
      return;
    }
    setInput('');
    setThreadError(null);
    try {
      await send(trimmed);
    } finally {
      queryClient.invalidateQueries({ queryKey: ['admin', 'chatbot', 'threads'] });
    }
  };

  return (
    <>
      <SEO title="Trợ lý quản trị - Thai Spray Admin" />

      <div className="flex h-[calc(100vh-7.5rem)] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3.5 shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100 shadow-sm shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">Trợ lý quản trị</h1>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Điều hành cửa hàng bằng hội thoại. Mọi thao tác thay đổi dữ liệu đều cần xác nhận.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-1.5 h-8 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-500">
                  <History className="h-3.5 w-3.5" />
                  <span>Lịch sử</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col h-full bg-white border-r border-slate-200 text-slate-900">
                <SheetHeader className="p-4 border-b border-slate-200 text-left bg-slate-50">
                  <SheetTitle className="text-base font-semibold text-slate-900 tracking-tight">Lịch sử trò chuyện</SheetTitle>
                </SheetHeader>
                <div className="flex-1 min-h-0 flex flex-col">
                  <ThreadListContent
                    threads={threads}
                    currentThreadId={threadId}
                    onSelectThread={(id) => {
                      handleSelectThread(id);
                      setIsSheetOpen(false);
                    }}
                    onNewThread={() => {
                      startNewConversation();
                      setIsSheetOpen(false);
                    }}
                    onDeleteClick={(thread) => {
                      setThreadToDelete(thread);
                    }}
                    isLoading={isThreadsLoading}
                    hasMore={hasMoreThreads}
                    onLoadMore={handleLoadMoreThreads}
                    isLoadingMore={isThreadsFetching}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left column: Desktop thread list */}
          <aside className="hidden md:flex w-72 lg:w-80 flex-col border-r border-slate-200 bg-slate-50/50 shrink-0 min-h-0">
            <ThreadListContent
              threads={threads}
              currentThreadId={threadId}
              onSelectThread={handleSelectThread}
              onNewThread={startNewConversation}
              onDeleteClick={(thread) => setThreadToDelete(thread)}
              isLoading={isThreadsLoading}
              hasMore={hasMoreThreads}
              onLoadMore={handleLoadMoreThreads}
              isLoadingMore={isThreadsFetching}
            />
          </aside>

          {/* Right column: Conversation */}
          <section className="flex flex-1 flex-col min-w-0 min-h-0 bg-slate-50/30">
            {isLoadingTranscript ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-600 shadow-sm">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <p className="text-xs font-medium text-slate-500">Đang tải cuộc trò chuyện…</p>
              </div>
            ) : visibleMessages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 mb-3.5 shadow-sm">
                  <Bot className="h-7 w-7" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-1 tracking-tight">
                  Xin chào! Tôi có thể giúp gì cho bạn?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm">
                  Chọn một trong các gợi ý bên dưới hoặc nhập yêu cầu quản trị cửa hàng của bạn.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                  {SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="group justify-start text-left h-auto py-2.5 px-3.5 text-xs rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-500/50 text-slate-700 hover:text-teal-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-teal-500"
                      disabled={isStreaming}
                      onClick={() => handleSend(suggestion)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-teal-600 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="truncate">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message list */
              <div
                role="log"
                aria-live="polite"
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-hide"
              >
                {threadError && (
                  <Alert variant="destructive" role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{threadError}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-rose-700 hover:bg-rose-100 rounded-md"
                        onClick={() => setThreadError(null)}
                      >
                        Đóng
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {visibleMessages.map((message) => {
                  if (message.role === 'user') {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-teal-600 px-4 py-2.5 text-white text-sm font-medium shadow-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      </div>
                    );
                  }

                  const hasTools = Boolean(message.tools && message.tools.length > 0);
                  const hasContent = Boolean(
                    message.content && message.content.trim().length > 0
                  );
                  const hasConfirm = Boolean(
                    message.confirm?.calls && message.confirm.calls.length > 0
                  );
                  const hasError = Boolean(message.error);

                  if (!hasTools && !hasContent && !hasConfirm && !hasError) {
                    return null;
                  }

                  return (
                    <div key={message.id} className="flex items-start gap-2.5 justify-start">
                      <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-600 shadow-sm mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex-1 max-w-[95%] sm:max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 text-slate-900 shadow-sm space-y-3">
                        {/* Tools rows above its text */}
                        {hasTools && (
                          <div className="space-y-1.5">
                            {message.tools.map((step) => (
                              <ToolCallCard key={step.id} step={step} />
                            ))}
                          </div>
                        )}

                        {/* Text with ChatMarkdown */}
                        {hasContent ? (
                          <ChatMarkdown content={message.content} />
                        ) : null}

                        {/* Confirm block */}
                        {hasConfirm && (
                          <div className={hasContent ? 'mt-2' : undefined}>
                            <ConfirmActionCard
                              calls={message.confirm!.calls}
                              decided={message.confirm!.decided}
                              onSubmit={(decisions) => decide(message.id, decisions)}
                            />
                          </div>
                        )}

                        {/* Error in a visible alert with role="alert" */}
                        {hasError && (
                          <Alert variant="destructive" role="alert" className="mt-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{message.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Streaming indicator */}
                {isOwnerMatch && isStreaming && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-600 w-fit shadow-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                      <span className="font-medium text-slate-800">Trợ lý đang phản hồi…</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-teal-500"
                      onClick={cancel}
                    >
                      <Square className="h-3 w-3 mr-1 fill-current" />
                      Dừng
                    </Button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input area */}
            <div className="border-t border-slate-200 p-3 sm:p-4 bg-white shrink-0">
              <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Ignore Enter during IME composition (Vietnamese input methods use Enter to confirm composed text)
                    if (e.nativeEvent.isComposing) {
                      return;
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isStreaming && input.trim()) {
                        handleSend(input);
                      }
                    }
                  }}
                  placeholder="Nhập yêu cầu cho trợ lý… (Shift + Enter để xuống dòng)"
                  aria-label="Nhập yêu cầu"
                  className="min-h-[52px] max-h-32 resize-none rounded-xl bg-slate-50 border border-slate-200 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-transparent text-sm text-slate-900 p-3 pr-12 placeholder:text-slate-400"
                  disabled={isStreaming}
                  rows={1}
                />
                <Button
                  type="button"
                  size="icon"
                  disabled={isStreaming || !input.trim()}
                  onClick={() => handleSend(input)}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-lg shrink-0 shadow-sm bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500"
                  aria-label="Gửi yêu cầu"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!threadToDelete} onOpenChange={(open) => !open && setThreadToDelete(null)}>
        <DialogContent className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">Xóa cuộc trò chuyện</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500">
              Xóa cuộc trò chuyện này? Lịch sử sẽ không còn xem lại được.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setThreadToDelete(null)}
              disabled={isDeleting}
              className="rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa…
                </>
              ) : (
                'Xóa'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AdminChatbotPage;
