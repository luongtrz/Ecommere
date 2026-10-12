import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useChatStore } from '../store/chatStore';
import { useCartStore } from '@/features/cart/store/cartStore';
import { applyUiAction, type UiActionDeps } from '../lib/uiActions';
import { keysForTool, isCartTool } from '../lib/invalidationMap';
import { ApiStreamError, type SseMessage } from '../api/sse';
import {
  streamTurn,
  resumeTurn,
  type AgentDecision,
  type AgentTurnBody,
  type AgentClientContext,
} from '../api/agent.api';
import type { ChatMessage, ChatToolStep, ChatConfirmCall, ChatSource } from '../types';

const FALLBACK_ERROR_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

function mapStreamError(err: unknown): string {
  const status =
    err instanceof ApiStreamError
      ? err.status
      : typeof (err as any)?.status === 'number'
      ? (err as any).status
      : typeof (err as any)?.response?.status === 'number'
      ? (err as any).response.status
      : undefined;

  switch (status) {
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này.';
    case 404:
      return 'Cuộc trò chuyện không còn khả dụng. Hãy bắt đầu cuộc trò chuyện mới.';
    case 409:
      return 'Trợ lý đang xử lý yêu cầu trước. Vui lòng đợi giây lát.';
    case 429:
      return 'Bạn gửi quá nhanh. Vui lòng thử lại sau ít phút.';
    case 503:
      return 'Trợ lý chưa được cấu hình.';
    default:
      return FALLBACK_ERROR_MESSAGE;
  }
}

function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const error = err as { name?: string; message?: string };
  return (
    error.name === 'AbortError' ||
    error.message === 'The user aborted a request.' ||
    error.message === 'BodyStreamBuffer was aborted'
  );
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useChatAgent(): {
  isStreaming: boolean;
  send: (prompt: string) => Promise<void>;
  decide: (messageId: string, decisions: AgentDecision[]) => Promise<void>;
  cancel: () => void;
  newThread: () => void;
} {
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deps: UiActionDeps = useMemo(
    () => ({
      addToCart: (item) => {
        if (
          typeof item.productId === 'string' &&
          item.productId.trim().length > 0 &&
          typeof item.scent === 'string' &&
          typeof item.volumeMl === 'number'
        ) {
          useCartStore.getState().addItem({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name ?? '',
            image: item.image ?? '',
            price: item.price ?? 0,
            quantity: item.quantity,
            scent: item.scent,
            volumeMl: item.volumeMl,
          });
        }
      },
      updateCartItem: (variantId: string, quantity: number) => {
        useCartStore.getState().updateQuantity(variantId, quantity);
      },
      removeFromCart: (variantId: string) => {
        useCartStore.getState().removeItem(variantId);
      },
      clearCart: () => {
        useCartStore.getState().clearCart();
      },
      navigate: (to: string) => {
        navigate(to);
      },
      invalidate: (keys: QueryKey[]) => {
        for (const queryKey of keys) {
          queryClient.invalidateQueries({ queryKey });
        }
      },
    }),
    [navigate, queryClient]
  );

  const handleSseMessage = useCallback(
    (message: SseMessage, targetAssistantMessageId: string) => {
      const { event, data } = message;

      switch (event) {
        case 'thread': {
          const threadData = data as { threadId?: string } | null;
          if (threadData?.threadId && typeof threadData.threadId === 'string') {
            useChatStore.getState().setThreadId(threadData.threadId);
          }
          break;
        }

        case 'token': {
          const tokenData = data as { text?: string } | null;
          if (typeof tokenData?.text === 'string') {
            const currentMsg = useChatStore
              .getState()
              .messages.find((m) => m.id === targetAssistantMessageId);
            const currentContent = currentMsg?.content ?? '';
            useChatStore.getState().patchMessage(targetAssistantMessageId, {
              content: currentContent + tokenData.text,
            });
          }
          break;
        }

        case 'tool_start': {
          const stepData = data as {
            id: string;
            name: string;
            summary: string;
          } | null;
          if (stepData && typeof stepData.id === 'string') {
            const currentMsg = useChatStore
              .getState()
              .messages.find((m) => m.id === targetAssistantMessageId);
            const currentTools = currentMsg?.tools ?? [];
            const newStep: ChatToolStep = {
              id: stepData.id,
              name: stepData.name,
              summary: stepData.summary,
              status: 'running',
            };
            useChatStore.getState().patchMessage(targetAssistantMessageId, {
              tools: [...currentTools, newStep],
            });
          }
          break;
        }

        case 'tool_result': {
          const resData = data as {
            id: string;
            name: string;
            ok: boolean;
            summary: string;
          } | null;
          if (resData && typeof resData.id === 'string') {
            const currentMsg = useChatStore
              .getState()
              .messages.find((m) => m.id === targetAssistantMessageId);
            const currentTools = currentMsg?.tools ?? [];
            const stepExists = currentTools.some((s) => s.id === resData.id);
            const updatedTools = stepExists
              ? currentTools.map((step) =>
                  step.id === resData.id
                    ? {
                        ...step,
                        status: (resData.ok ? 'ok' : 'error') as 'ok' | 'error',
                        resultSummary: resData.summary,
                      }
                    : step
                )
              : [
                  ...currentTools,
                  {
                    id: resData.id,
                    name: resData.name,
                    summary: resData.summary,
                    status: (resData.ok ? 'ok' : 'error') as 'ok' | 'error',
                    resultSummary: resData.summary,
                  },
                ];

            useChatStore.getState().patchMessage(targetAssistantMessageId, {
              tools: updatedTools,
            });

            if (resData.ok === true) {
              if (resData.name === 'checkout') {
                useCartStore.getState().clearCart();
                queryClient.invalidateQueries({ queryKey: ['cart'] });
              }

              if (!isCartTool(resData.name)) {
                const keys = keysForTool(resData.name);
                for (const queryKey of keys) {
                  queryClient.invalidateQueries({ queryKey });
                }
              }
            }
          }
          break;
        }

        case 'confirm_required': {
          const confirmData = data as {
            calls: ChatConfirmCall[];
          } | null;
          if (confirmData?.calls && Array.isArray(confirmData.calls)) {
            useChatStore.getState().patchMessage(targetAssistantMessageId, {
              confirm: {
                calls: confirmData.calls,
                decided: false,
              },
            });
          }
          break;
        }

        case 'sources': {
          if (Array.isArray(data)) {
            useChatStore.getState().patchMessage(targetAssistantMessageId, {
              sources: data as ChatSource[],
            });
          }
          break;
        }

        case 'ui_action': {
          if (data && typeof data === 'object') {
            applyUiAction(
              data as { type: string; payload: Record<string, unknown> },
              deps
            );
          }
          break;
        }

        case 'done': {
          isStreamingRef.current = false;
          setIsStreaming(false);
          break;
        }

        case 'error': {
          const errData = data as { message?: string } | null;
          const serverMsg =
            typeof errData?.message === 'string' &&
            errData.message.trim().length > 0
              ? errData.message
              : FALLBACK_ERROR_MESSAGE;
          useChatStore.getState().patchMessage(targetAssistantMessageId, {
            error: serverMsg,
          });
          isStreamingRef.current = false;
          setIsStreaming(false);
          break;
        }

        default:
          break;
      }
    },
    [deps, queryClient]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isStreamingRef.current = false;
    setIsStreaming(false);
  }, []);

  const newThread = useCallback(() => {
    cancel();
    useChatStore.getState().reset();
  }, [cancel]);

  const send = useCallback(
    async (prompt: string): Promise<void> => {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt || trimmedPrompt.length > 4000) {
        return;
      }

      if (isStreamingRef.current) {
        return;
      }

      const userMessageId = generateUuid();
      const assistantMessageId = generateUuid();

      const now = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: trimmedPrompt,
        tools: [],
        createdAt: now,
      };

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        tools: [],
        createdAt: now,
      };

      useChatStore.getState().appendMessage(userMessage);
      useChatStore.getState().appendMessage(assistantMessage);

      const rawCartItems = useCartStore.getState().items;
      const cart = rawCartItems.slice(0, 100).map((item) => {
        const rawQty =
          typeof item.quantity === 'number' ? Math.floor(item.quantity) : 1;
        const clampedQty = Math.max(1, Math.min(99, rawQty || 1));
        const cartItem: {
          variantId: string;
          quantity: number;
          price?: number;
          name?: string;
        } = {
          variantId: item.variantId,
          quantity: clampedQty,
        };
        if (typeof item.price === 'number') {
          cartItem.price = Math.round(item.price);
        }
        if (typeof item.name === 'string') {
          cartItem.name = item.name;
        }
        return cartItem;
      });

      const currentPath =
        typeof window !== 'undefined' && typeof window.location?.pathname === 'string'
          ? window.location.pathname.slice(0, 200)
          : undefined;

      const currentThreadId = useChatStore.getState().threadId;

      const clientContext: AgentClientContext = {
        cart,
        ...(currentPath ? { currentPath } : {}),
      };

      const body: AgentTurnBody = {
        prompt: trimmedPrompt,
        ...(currentThreadId ? { threadId: currentThreadId } : {}),
        clientContext,
      };

      const controller = new AbortController();
      abortControllerRef.current = controller;
      isStreamingRef.current = true;
      setIsStreaming(true);

      try {
        await streamTurn(
          body,
          (msg) => handleSseMessage(msg, assistantMessageId),
          { signal: controller.signal }
        );
      } catch (err: unknown) {
        if (controller.signal.aborted || isAbortError(err)) {
          return;
        }

        const status =
          err instanceof ApiStreamError
            ? err.status
            : typeof (err as any)?.status === 'number'
            ? (err as any).status
            : typeof (err as any)?.response?.status === 'number'
            ? (err as any).response.status
            : undefined;

        if (status === 404) {
          useChatStore.getState().setThreadId(null);
        }

        const errorMsg = mapStreamError(err);
        useChatStore.getState().patchMessage(assistantMessageId, {
          error: errorMsg,
        });
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        isStreamingRef.current = false;
        setIsStreaming(false);
      }
    },
    [handleSseMessage]
  );

  const decide = useCallback(
    async (messageId: string, decisions: AgentDecision[]): Promise<void> => {
      if (isStreamingRef.current) {
        return;
      }

      const message = useChatStore
        .getState()
        .messages.find((m) => m.id === messageId);
      const calls = message?.confirm?.calls;
      if (!calls || calls.length === 0 || message?.confirm?.decided) {
        return;
      }

      if (!Array.isArray(decisions) || decisions.length !== calls.length) {
        return;
      }

      const callIdSet = new Set(calls.map((c) => c.id));
      const seenDecisionCallIds = new Set<string>();

      for (const d of decisions) {
        if (
          !d ||
          typeof d.callId !== 'string' ||
          !callIdSet.has(d.callId) ||
          seenDecisionCallIds.has(d.callId)
        ) {
          return;
        }
        seenDecisionCallIds.add(d.callId);
      }

      if (seenDecisionCallIds.size !== callIdSet.size) {
        return;
      }

      const threadId = useChatStore.getState().threadId;
      if (!threadId) {
        return;
      }

      useChatStore.getState().patchMessage(messageId, {
        confirm: {
          calls,
          decided: true,
        },
      });

      const controller = new AbortController();
      abortControllerRef.current = controller;
      isStreamingRef.current = true;
      setIsStreaming(true);

      try {
        await resumeTurn(
          threadId,
          decisions,
          (msg) => handleSseMessage(msg, messageId),
          { signal: controller.signal }
        );
      } catch (err: unknown) {
        if (controller.signal.aborted || isAbortError(err)) {
          return;
        }

        const status =
          err instanceof ApiStreamError
            ? err.status
            : typeof (err as any)?.status === 'number'
            ? (err as any).status
            : typeof (err as any)?.response?.status === 'number'
            ? (err as any).response.status
            : undefined;

        if (status === 404) {
          useChatStore.getState().setThreadId(null);
        }

        const errorMsg = mapStreamError(err);
        useChatStore.getState().patchMessage(messageId, {
          error: errorMsg,
        });
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        isStreamingRef.current = false;
        setIsStreaming(false);
      }
    },
    [handleSseMessage]
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return { isStreaming, send, decide, cancel, newThread };
}
