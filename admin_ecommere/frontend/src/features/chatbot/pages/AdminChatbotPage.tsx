import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
}

function ThreadListContent({
  threads,
  currentThreadId,
  onSelectThread,
  onNewThread,
  onDeleteClick,
  isLoading,
}: ThreadListContentProps) {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="p-3 border-b border-border/40 shrink-0">
        <Button
          variant="outline"
          className="w-full justify-center gap-2 rounded-xl text-xs font-semibold h-9 shadow-sm"
          onClick={onNewThread}
        >
          <Plus className="h-4 w-4 text-primary" />
          <span>Cuộc trò chuyện mới</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Đang tải danh sách…</span>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          threads.map((thread) => {
            const isSelected = thread.id === currentThreadId;
            const title = thread.title || 'Cuộc trò chuyện chưa đặt tên';
            const dateText = formatVietnameseDate(thread.updatedAt);

            return (
              <div
                key={thread.id}
                className="group flex items-center justify-between gap-1 rounded-xl"
              >
                <button
                  type="button"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelectThread(thread.id)}
                  className={cn(
                    'flex-1 min-w-0 rounded-xl px-3 py-2.5 text-xs text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm'
                      : 'hover:bg-muted/60 text-foreground/80 hover:text-foreground border border-transparent'
                  )}
                >
                  <p className="truncate font-medium leading-snug">{title}</p>
                  {dateText && (
                    <p
                      className={cn(
                        'mt-1 text-[11px] truncate',
                        isSelected ? 'text-primary/70' : 'text-muted-foreground'
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
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  onClick={() => onDeleteClick(thread)}
                  aria-label="Xóa cuộc trò chuyện"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })
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
  } = useQuery({
    queryKey: ['admin', 'chatbot', 'threads'],
    queryFn: () => agentApi.listThreads(),
  });

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

      <div className="admin-surface flex h-[calc(100vh-7.5rem)] min-h-[500px] flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border/60 px-5 py-3 shrink-0 bg-white/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary shrink-0" />
              <h1 className="text-lg font-bold text-foreground truncate">Trợ lý quản trị</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              Điều hành cửa hàng bằng hội thoại. Mọi thao tác thay đổi dữ liệu đều cần xác nhận.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-1.5 h-8 text-xs">
                  <History className="h-3.5 w-3.5" />
                  <span>Lịch sử</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs p-0 flex flex-col h-full">
                <SheetHeader className="p-4 border-b border-border/60 text-left">
                  <SheetTitle className="text-base font-semibold">Lịch sử trò chuyện</SheetTitle>
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
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left column: Desktop thread list */}
          <aside className="hidden md:flex w-72 lg:w-80 flex-col border-r border-border/60 bg-muted/20 shrink-0 min-h-0">
            <ThreadListContent
              threads={threads}
              currentThreadId={threadId}
              onSelectThread={handleSelectThread}
              onNewThread={startNewConversation}
              onDeleteClick={(thread) => setThreadToDelete(thread)}
              isLoading={isThreadsLoading}
            />
          </aside>

          {/* Right column: Conversation */}
          <section className="flex flex-1 flex-col min-w-0 min-h-0 bg-background/50">
            {isLoadingTranscript ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Đang tải cuộc trò chuyện…</p>
              </div>
            ) : visibleMessages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-sm">
                  <Bot className="h-6 w-6" />
                </div>
                <h2 className="text-base font-semibold text-foreground mb-1">
                  Xin chào! Tôi có thể giúp gì cho bạn?
                </h2>
                <p className="text-xs text-muted-foreground mb-6">
                  Chọn một trong các gợi ý bên dưới hoặc nhập yêu cầu quản trị cửa hàng của bạn.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                  {SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-2.5 px-3 text-xs rounded-xl border-border/70 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors"
                      disabled={isStreaming}
                      onClick={() => handleSend(suggestion)}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-primary shrink-0" />
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
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
              >
                {threadError && (
                  <Alert variant="destructive" role="alert" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{threadError}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
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
                        <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground text-sm shadow-sm whitespace-pre-wrap break-words">
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
                    <div key={message.id} className="flex justify-start">
                      <div className="max-w-[95%] sm:max-w-[85%] rounded-2xl border border-border/60 bg-card p-4 text-card-foreground shadow-sm space-y-3">
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
                          <Alert variant="destructive" role="alert" className="mt-2">
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
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground w-fit">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Trợ lý đang phản hồi…</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
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
            <div className="border-t border-border/60 p-3 sm:p-4 bg-card/60 shrink-0">
              <div className="relative flex items-end gap-2">
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
                  className="min-h-[52px] max-h-32 resize-none rounded-xl bg-background border-border/80 focus-visible:ring-primary text-sm p-3 pr-12 shadow-sm"
                  disabled={isStreaming}
                  rows={1}
                />
                <Button
                  type="button"
                  size="icon"
                  disabled={isStreaming || !input.trim()}
                  onClick={() => handleSend(input)}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-lg shrink-0 shadow-sm"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa cuộc trò chuyện</DialogTitle>
            <DialogDescription>
              Xóa cuộc trò chuyện này? Lịch sử sẽ không còn xem lại được.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setThreadToDelete(null)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
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
