import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useChatAgent } from './useChatAgent';
import { useChatStore } from '../store/chatStore';
import type { SseMessage } from '../api/sse';
import { streamTurn, resumeTurn } from '../api/agent.api';
import type { AgentDecision } from '../api/agent.api';
import type { ChatMessage, ChatConfirmCall } from '../types';

const { mockNavigate, ApiStreamError } = vi.hoisted(() => {
  class ApiStreamError extends Error {
    status: number;
    code?: string;

    constructor(
      statusOrMessage: number | string,
      messageOrStatus?: string | number,
      code?: string,
    ) {
      let status: number;
      let message: string;

      if (typeof statusOrMessage === 'number') {
        status = statusOrMessage;
        message =
          typeof messageOrStatus === 'string' &&
          messageOrStatus.trim().length > 0
            ? messageOrStatus
            : 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      } else {
        message = statusOrMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
        status = typeof messageOrStatus === 'number' ? messageOrStatus : 500;
      }

      super(message);
      this.name = 'ApiStreamError';
      this.status = status;
      this.code = code;
      Object.setPrototypeOf(this, ApiStreamError.prototype);
    }
  }

  return {
    mockNavigate: vi.fn(),
    ApiStreamError,
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../api/agent.api', () => ({
  streamTurn: vi.fn(),
  resumeTurn: vi.fn(),
  agentApi: {
    listThreads: vi.fn(),
    getThread: vi.fn(),
    getTranscript: vi.fn(),
    deleteThread: vi.fn(),
  },
}));

vi.mock('../api/sse', () => ({
  ApiStreamError,
  createSseParser: vi.fn(),
  streamAgentRequest: vi.fn(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    );
  };
}

describe('useChatAgent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useChatStore.setState({
      ownerId: null,
      threadId: null,
      messages: [],
      open: false,
    });
  });

  describe('initialization and control methods', () => {
    it('returns default initial values and methods', () => {
      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isStreaming).toBe(false);
      expect(typeof result.current.send).toBe('function');
      expect(typeof result.current.decide).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.newThread).toBe('function');
    });

    it('cancel resets streaming when called while idle without errors', () => {
      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('cancel aborts active stream and updates isStreaming state', async () => {
      let abortedSignal: AbortSignal | undefined;
      vi.mocked(streamTurn).mockImplementation(
        (_body, _onMessage, options) =>
          new Promise<void>((_resolve, reject) => {
            abortedSignal = options?.signal;
            options?.signal?.addEventListener('abort', () => {
              const err = new Error('The user aborted a request.');
              err.name = 'AbortError';
              reject(err);
            });
          }),
      );

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      let sendPromise: Promise<void>;
      act(() => {
        sendPromise = result.current.send('Xin chào');
      });

      expect(result.current.isStreaming).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isStreaming).toBe(false);
      expect(abortedSignal?.aborted).toBe(true);

      await act(async () => {
        await sendPromise;
      });
    });

    it('newThread cancels active stream and resets chatStore state', async () => {
      useChatStore.setState({
        threadId: 'thread-999',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Cũ',
            tools: [],
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.newThread();
      });

      expect(useChatStore.getState().threadId).toBeNull();
      expect(useChatStore.getState().messages).toEqual([]);
      expect(result.current.isStreaming).toBe(false);
    });

    it('unmounting aborts an in-flight stream via effect cleanup', () => {
      let activeSignal: AbortSignal | undefined;
      vi.mocked(streamTurn).mockImplementation((_body, _onMessage, options) => {
        activeSignal = options?.signal;
        return new Promise<void>(() => {});
      });

      const { result, unmount } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        void result.current.send('Kiểm tra unmount');
      });

      expect(activeSignal?.aborted).toBe(false);

      unmount();

      expect(activeSignal?.aborted).toBe(true);
    });

    it('unmounting while idle executes cleanup without error', () => {
      const { unmount } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('send - validation and payload construction', () => {
    it('ignores empty prompts without sending or appending messages', async () => {
      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('');
      });

      expect(streamTurn).not.toHaveBeenCalled();
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('ignores prompts containing only whitespace', async () => {
      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('    \n\t  ');
      });

      expect(streamTurn).not.toHaveBeenCalled();
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('ignores prompts exceeding 4000 characters', async () => {
      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      const longPrompt = 'a'.repeat(4001);
      await act(async () => {
        await result.current.send(longPrompt);
      });

      expect(streamTurn).not.toHaveBeenCalled();
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('ignores new send calls when already streaming', async () => {
      let resolveStream!: () => void;
      vi.mocked(streamTurn).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveStream = resolve;
          }),
      );

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      let firstSendPromise: Promise<void>;
      act(() => {
        firstSendPromise = result.current.send('Yêu cầu đầu tiên');
      });

      expect(result.current.isStreaming).toBe(true);
      expect(useChatStore.getState().messages).toHaveLength(2);

      await act(async () => {
        await result.current.send('Yêu cầu thứ hai bị bỏ qua');
      });

      expect(streamTurn).toHaveBeenCalledTimes(1);
      expect(useChatStore.getState().messages).toHaveLength(2);

      act(() => {
        resolveStream();
      });

      await act(async () => {
        await firstSendPromise;
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('trims prompt and attaches threadId and currentPath to body', async () => {
      useChatStore.setState({ threadId: 'thread-existing-123' });
      window.history.pushState({}, '', '/admin/orders');

      vi.mocked(streamTurn).mockResolvedValueOnce();

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('   Kiểm tra đơn hàng   ');
      });

      expect(streamTurn).toHaveBeenCalledWith(
        {
          prompt: 'Kiểm tra đơn hàng',
          threadId: 'thread-existing-123',
          clientContext: {
            currentPath: '/admin/orders',
          },
        },
        expect.any(Function),
        { signal: expect.any(AbortSignal) },
      );

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Kiểm tra đơn hàng');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('');
    });

    it('truncates currentPath to 200 characters if longer than 200', async () => {
      const longPath = '/' + 'p'.repeat(250);
      window.history.pushState({}, '', longPath);

      vi.mocked(streamTurn).mockResolvedValueOnce();

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Thử nghiệm đường dẫn dài');
      });

      expect(streamTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          clientContext: {
            currentPath: longPath.slice(0, 200),
          },
        }),
        expect.any(Function),
        expect.any(Object),
      );
    });

    it('omits threadId from request body when store threadId is null', async () => {
      useChatStore.setState({ threadId: null });
      vi.mocked(streamTurn).mockResolvedValueOnce();

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Tạo phiên mới');
      });

      expect(streamTurn).toHaveBeenCalledWith(
        {
          prompt: 'Tạo phiên mới',
          clientContext: expect.any(Object),
        },
        expect.any(Function),
        expect.any(Object),
      );
    });

    it('falls back to regex uuid generation when crypto.randomUUID is unavailable', async () => {
      const originalRandomUUID = crypto.randomUUID;
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        crypto,
        'randomUUID',
      );

      try {
        Object.defineProperty(crypto, 'randomUUID', {
          value: undefined,
          configurable: true,
          writable: true,
        });

        vi.mocked(streamTurn).mockResolvedValueOnce();

        const { result } = renderHook(() => useChatAgent(), {
          wrapper: createWrapper(queryClient),
        });

        await act(async () => {
          await result.current.send('Kiểm tra regex uuid fallback');
        });

        const messages = useChatStore.getState().messages;
        expect(messages).toHaveLength(2);
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(messages[0].id).toMatch(uuidRegex);
        expect(messages[1].id).toMatch(uuidRegex);
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(crypto, 'randomUUID', originalDescriptor);
        } else {
          (crypto as any).randomUUID = originalRandomUUID;
        }
      }
    });
  });

  describe('handleSseMessage during stream', () => {
    it('handles thread event with valid string threadId', async () => {
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({ event: 'thread', data: { threadId: 'thread-new-888' } });
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Khởi tạo cuộc trò chuyện');
      });

      expect(useChatStore.getState().threadId).toBe('thread-new-888');
    });

    it('ignores thread event when threadId is missing or not a string', async () => {
      useChatStore.setState({ threadId: 'initial-thread' });

      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({ event: 'thread', data: null });
        onMessage({ event: 'thread', data: {} });
        onMessage({ event: 'thread', data: { threadId: 12345 } });
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Thử thread rác');
      });

      expect(useChatStore.getState().threadId).toBe('initial-thread');
    });

    it('handles token events by appending text to target message and handles missing message fallback', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        capturedOnMessage = onMessage;
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Xin chào trợ lý');
      });

      act(() => {
        capturedOnMessage({ event: 'token', data: { text: 'Chào ' } });
        capturedOnMessage({ event: 'token', data: { text: 'bạn!' } });
        capturedOnMessage({ event: 'token', data: null });
        capturedOnMessage({ event: 'token', data: { text: 123 } });
      });

      expect(useChatStore.getState().messages[1].content).toBe('Chào bạn!');

      // Exercise fallback branch when message is not found in store
      useChatStore.setState({ messages: [] });
      act(() => {
        capturedOnMessage({
          event: 'token',
          data: { text: 'Nội dung mồ côi' },
        });
      });
      expect(useChatStore.getState().messages).toEqual([]);
    });

    it('handles tool_start events with existing tools, empty tools, and missing message fallback', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        capturedOnMessage = onMessage;
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Bắt đầu gọi công cụ');
      });

      act(() => {
        capturedOnMessage({
          event: 'tool_start',
          data: {
            id: 'step-1',
            name: 'list_orders',
            summary: 'Đang tải danh sách đơn',
          },
        });
        capturedOnMessage({
          event: 'tool_start',
          data: {
            id: 'step-2',
            name: 'get_order',
            summary: 'Đang tải chi tiết đơn',
          },
        });
        capturedOnMessage({ event: 'tool_start', data: null });
        capturedOnMessage({ event: 'tool_start', data: { id: 123 } });
      });

      const tools = useChatStore.getState().messages[1].tools;
      expect(tools).toHaveLength(2);
      expect(tools[0]).toEqual({
        id: 'step-1',
        name: 'list_orders',
        summary: 'Đang tải danh sách đơn',
        status: 'running',
      });
      expect(tools[1]).toEqual({
        id: 'step-2',
        name: 'get_order',
        summary: 'Đang tải chi tiết đơn',
        status: 'running',
      });

      // Exercise fallback branch when message is not found in store
      useChatStore.setState({ messages: [] });
      act(() => {
        capturedOnMessage({
          event: 'tool_start',
          data: { id: 'step-3', name: 'dummy', summary: 'test' },
        });
      });
      expect(useChatStore.getState().messages).toEqual([]);
    });

    it('handles tool_result when step already exists (testing ok, error, and unchanged sibling step)', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        capturedOnMessage = onMessage;
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Cập nhật trạng thái đơn');
      });

      act(() => {
        capturedOnMessage({
          event: 'tool_start',
          data: {
            id: 'step-1',
            name: 'update_order_status',
            summary: 'Đang cập nhật',
          },
        });
        capturedOnMessage({
          event: 'tool_start',
          data: {
            id: 'step-2',
            name: 'get_dashboard_stats',
            summary: 'Đang lấy thống kê',
          },
        });
      });

      act(() => {
        capturedOnMessage({
          event: 'tool_result',
          data: {
            id: 'step-1',
            name: 'update_order_status',
            ok: true,
            summary: 'Đã chuyển trạng thái thành công',
          },
        });
      });

      const tools = useChatStore.getState().messages[1].tools;
      expect(tools[0]).toEqual({
        id: 'step-1',
        name: 'update_order_status',
        summary: 'Đang cập nhật',
        status: 'ok',
        resultSummary: 'Đã chuyển trạng thái thành công',
      });
      // Sibling step-2 remains unchanged
      expect(tools[1].status).toBe('running');

      // update_order_status invalidates ['admin', 'orders'] and ['admin', 'dashboard-stats']
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'orders'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'dashboard-stats'],
      });

      // Now test step-2 failing with ok: false (which does not trigger invalidation)
      invalidateQueriesSpy.mockClear();
      act(() => {
        capturedOnMessage({
          event: 'tool_result',
          data: {
            id: 'step-2',
            name: 'get_dashboard_stats',
            ok: false,
            summary: 'Không thể kết nối máy chủ',
          },
        });
      });

      const updatedTools = useChatStore.getState().messages[1].tools;
      expect(updatedTools[1].status).toBe('error');
      expect(updatedTools[1].resultSummary).toBe('Không thể kết nối máy chủ');
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });

    it('handles tool_result when step does not exist (appends new step) and invalidates matching keys', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        capturedOnMessage = onMessage;
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Thực thi công cụ trực tiếp');
      });

      // Append new step with ok: true
      act(() => {
        capturedOnMessage({
          event: 'tool_result',
          data: {
            id: 'step-new-1',
            name: 'create_product',
            ok: true,
            summary: 'Sản phẩm đã tạo thành công',
          },
        });
      });

      let tools = useChatStore.getState().messages[1].tools;
      expect(tools).toHaveLength(1);
      expect(tools[0]).toEqual({
        id: 'step-new-1',
        name: 'create_product',
        summary: 'Sản phẩm đã tạo thành công',
        status: 'ok',
        resultSummary: 'Sản phẩm đã tạo thành công',
      });

      // create_product invalidates product keys
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['products'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['admin-products'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['product-detail'],
      });

      // Append new step with ok: false
      invalidateQueriesSpy.mockClear();
      act(() => {
        capturedOnMessage({
          event: 'tool_result',
          data: {
            id: 'step-new-2',
            name: 'delete_product',
            ok: false,
            summary: 'Không có quyền xóa',
          },
        });
      });

      tools = useChatStore.getState().messages[1].tools;
      expect(tools).toHaveLength(2);
      expect(tools[1].status).toBe('error');
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();

      // Tool with empty query keys (e.g. list_orders)
      act(() => {
        capturedOnMessage({
          event: 'tool_result',
          data: {
            id: 'step-new-3',
            name: 'list_orders',
            ok: true,
            summary: 'Đã lấy danh sách đơn',
          },
        });
      });
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();

      // Tool result with invalid data
      act(() => {
        capturedOnMessage({ event: 'tool_result', data: null });
        capturedOnMessage({ event: 'tool_result', data: { id: 123 } });
      });

      // Exercise fallback branch when message is not found in store
      useChatStore.setState({ messages: [] });
      act(() => {
        capturedOnMessage({
          event: 'tool_result',
          data: {
            id: 'step-orphan',
            name: 'list_orders',
            ok: true,
            summary: 'test',
          },
        });
      });
      expect(useChatStore.getState().messages).toEqual([]);
    });

    it('handles confirm_required event with valid calls and ignores invalid payloads', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        capturedOnMessage = onMessage;
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Xác nhận thao tác nguy hiểm');
      });

      const calls: ChatConfirmCall[] = [
        {
          id: 'call-1',
          name: 'delete_product',
          summary: 'Xóa sản phẩm #42',
          risk: 'DESTRUCTIVE',
        },
      ];

      act(() => {
        capturedOnMessage({ event: 'confirm_required', data: { calls } });
        capturedOnMessage({ event: 'confirm_required', data: null });
        capturedOnMessage({
          event: 'confirm_required',
          data: { calls: 'not-an-array' },
        });
      });

      expect(useChatStore.getState().messages[1].confirm).toEqual({
        calls,
        decided: false,
      });
    });

    it('handles sources event with valid array and ignores invalid data', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        capturedOnMessage = onMessage;
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Hỏi về tài liệu');
      });

      const sources = [
        {
          id: 's1',
          name: 'Chính sách trả hàng',
          slug: 'return-policy',
          score: 0.95,
        },
      ];

      act(() => {
        capturedOnMessage({ event: 'sources', data: sources });
        capturedOnMessage({ event: 'sources', data: null });
        capturedOnMessage({ event: 'sources', data: { notAnArray: true } });
      });

      expect(useChatStore.getState().messages[1].sources).toEqual(sources);
    });

    it('handles ui_action event exercising all deps branches (cart, navigate, invalidate)', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        capturedOnMessage = onMessage;
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Thực hiện hành động UI');
      });

      act(() => {
        // Exercise cart action no-ops in admin app
        capturedOnMessage({
          event: 'ui_action',
          data: {
            type: 'cart.add',
            payload: {
              variantId: 'v1',
              quantity: 2,
              name: 'Sản phẩm 1',
              price: 100,
            },
          },
        });
        capturedOnMessage({
          event: 'ui_action',
          data: {
            type: 'cart.update',
            payload: { variantId: 'v1', quantity: 3 },
          },
        });
        capturedOnMessage({
          event: 'ui_action',
          data: {
            type: 'cart.remove',
            payload: { variantId: 'v1' },
          },
        });
        capturedOnMessage({
          event: 'ui_action',
          data: {
            type: 'cart.clear',
            payload: {},
          },
        });

        // Exercise navigate action
        capturedOnMessage({
          event: 'ui_action',
          data: {
            type: 'navigate',
            payload: { to: '/admin/products' },
          },
        });

        // Exercise invalidate action
        capturedOnMessage({
          event: 'ui_action',
          data: {
            type: 'invalidate',
            payload: {
              keys: [['custom-key-1'], ['custom-key-2']],
            },
          },
        });

        // Non-object data ignored
        capturedOnMessage({ event: 'ui_action', data: null });
        capturedOnMessage({ event: 'ui_action', data: 'string-action' });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['custom-key-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['custom-key-2'],
      });
    });

    it('handles done event by setting isStreaming to false', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            capturedOnMessage = (msg: SseMessage) => {
              if (msg.event === 'done') {
                resolve();
              }
            };
          }),
      );

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      let sendPromise: Promise<void>;
      act(() => {
        sendPromise = result.current.send('Chờ hoàn tất');
      });

      expect(result.current.isStreaming).toBe(true);

      act(() => {
        capturedOnMessage({ event: 'done', data: null });
      });

      await act(async () => {
        await sendPromise;
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('handles error event with custom server message and fallback when message is blank', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        capturedOnMessage = onMessage;
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Kiểm tra lỗi server');
      });

      act(() => {
        capturedOnMessage({
          event: 'error',
          data: { message: 'Mô hình quá tải' },
        });
      });

      expect(useChatStore.getState().messages[1].error).toBe('Mô hình quá tải');
      expect(result.current.isStreaming).toBe(false);

      // Test blank/whitespace error message triggers FALLBACK_ERROR_MESSAGE
      act(() => {
        capturedOnMessage({
          event: 'error',
          data: { message: '   ' },
        });
      });
      expect(useChatStore.getState().messages[1].error).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );

      act(() => {
        capturedOnMessage({
          event: 'error',
          data: null,
        });
      });
      expect(useChatStore.getState().messages[1].error).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );
    });

    it('ignores unknown sse events via default case', async () => {
      let capturedOnMessage!: (msg: SseMessage) => void;
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        capturedOnMessage = onMessage;
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Kiểm tra event lạ');
      });

      act(() => {
        capturedOnMessage({ event: 'ping', data: { ts: 123456 } });
      });

      expect(useChatStore.getState().messages[1].error).toBeUndefined();
    });
  });

  describe('send - error handling and status mapping', () => {
    it('silently ignores abort errors (name: AbortError)', async () => {
      const abortError = new Error('Request was aborted');
      abortError.name = 'AbortError';
      vi.mocked(streamTurn).mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Hủy ngang');
      });

      const assistantMsg = useChatStore.getState().messages[1];
      expect(assistantMsg.error).toBeUndefined();
      expect(result.current.isStreaming).toBe(false);
    });

    it('silently ignores abort errors by specific error messages', async () => {
      vi.mocked(streamTurn).mockRejectedValueOnce(
        new Error('The user aborted a request.'),
      );

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Hủy request 1');
      });

      expect(useChatStore.getState().messages[1].error).toBeUndefined();

      vi.mocked(streamTurn).mockRejectedValueOnce(
        new Error('BodyStreamBuffer was aborted'),
      );
      await act(async () => {
        await result.current.send('Hủy request 2');
      });
      expect(useChatStore.getState().messages[3].error).toBeUndefined();
    });

    it('maps 401 status to Vietnamese message', async () => {
      vi.mocked(streamTurn).mockRejectedValueOnce(new ApiStreamError(401));

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Hết phiên');
      });

      expect(useChatStore.getState().messages[1].error).toBe(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      );
    });

    it('maps 403 status from plain status property to Vietnamese message', async () => {
      vi.mocked(streamTurn).mockRejectedValueOnce({ status: 403 });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Cấm quyền');
      });

      expect(useChatStore.getState().messages[1].error).toBe(
        'Bạn không có quyền thực hiện thao tác này.',
      );
    });

    it('maps 404 status from axios-like response, resets threadId in store and sets error', async () => {
      useChatStore.setState({ threadId: 'active-thread' });
      vi.mocked(streamTurn).mockRejectedValueOnce({
        response: { status: 404 },
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Không tìm thấy cuộc trò chuyện');
      });

      expect(useChatStore.getState().threadId).toBeNull();
      expect(useChatStore.getState().messages[1].error).toBe(
        'Cuộc trò chuyện không còn khả dụng. Hãy bắt đầu cuộc trò chuyện mới.',
      );
    });

    it('maps 409 status to Vietnamese message', async () => {
      vi.mocked(streamTurn).mockRejectedValueOnce(new ApiStreamError(409));

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Đang bận');
      });

      expect(useChatStore.getState().messages[1].error).toBe(
        'Trợ lý đang xử lý yêu cầu trước. Vui lòng đợi giây lát.',
      );
    });

    it('maps 429 status to Vietnamese message', async () => {
      vi.mocked(streamTurn).mockRejectedValueOnce({ status: 429 });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Quá nhanh');
      });

      expect(useChatStore.getState().messages[1].error).toBe(
        'Bạn gửi quá nhanh. Vui lòng thử lại sau ít phút.',
      );
    });

    it('maps 503 status to Vietnamese message', async () => {
      vi.mocked(streamTurn).mockRejectedValueOnce(new ApiStreamError(503));

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Chưa cấu hình');
      });

      expect(useChatStore.getState().messages[1].error).toBe(
        'Trợ lý chưa được cấu hình.',
      );
    });

    it('maps 500 status and generic errors to default Vietnamese message', async () => {
      vi.mocked(streamTurn).mockRejectedValueOnce(new ApiStreamError(500));

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.send('Lỗi chung 500');
      });

      expect(useChatStore.getState().messages[1].error).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );

      vi.mocked(streamTurn).mockRejectedValueOnce(
        new Error('Lỗi mạng không xác định'),
      );
      await act(async () => {
        await result.current.send('Lỗi mạng');
      });
      expect(useChatStore.getState().messages[3].error).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );

      // Test non-object and null errors
      vi.mocked(streamTurn).mockRejectedValueOnce('string exception');
      await act(async () => {
        await result.current.send('Lỗi string');
      });
      expect(useChatStore.getState().messages[5].error).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );

      vi.mocked(streamTurn).mockRejectedValueOnce(null);
      await act(async () => {
        await result.current.send('Lỗi null');
      });
      expect(useChatStore.getState().messages[7].error).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );
    });
  });

  describe('decide - validations and early returns', () => {
    const validCalls: ChatConfirmCall[] = [
      {
        id: 'call-1',
        name: 'delete_product',
        summary: 'Xóa sp 1',
        risk: 'DESTRUCTIVE',
      },
      {
        id: 'call-2',
        name: 'delete_variant',
        summary: 'Xóa biến thể',
        risk: 'DESTRUCTIVE',
      },
    ];

    it('ignores decide when already streaming', async () => {
      let resolveStream!: () => void;
      vi.mocked(streamTurn).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveStream = resolve;
          }),
      );

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        void result.current.send('Bắt đầu');
      });

      expect(result.current.isStreaming).toBe(true);

      await act(async () => {
        await result.current.decide('msg-1', [
          { callId: 'call-1', approve: true },
        ]);
      });

      expect(resumeTurn).not.toHaveBeenCalled();

      act(() => {
        resolveStream();
      });
    });

    it('ignores decide when message is not found in chatStore', async () => {
      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.decide('non-existent-msg', [
          { callId: 'call-1', approve: true },
        ]);
      });

      expect(resumeTurn).not.toHaveBeenCalled();
    });

    it('ignores decide when message has no confirm calls or empty calls array', async () => {
      const msgWithoutConfirm: ChatMessage = {
        id: 'msg-no-confirm',
        role: 'assistant',
        content: '',
        tools: [],
        createdAt: new Date().toISOString(),
      };
      const msgWithEmptyCalls: ChatMessage = {
        id: 'msg-empty-calls',
        role: 'assistant',
        content: '',
        tools: [],
        confirm: { calls: [], decided: false },
        createdAt: new Date().toISOString(),
      };

      useChatStore.setState({
        messages: [msgWithoutConfirm, msgWithEmptyCalls],
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.decide('msg-no-confirm', [
          { callId: 'call-1', approve: true },
        ]);
        await result.current.decide('msg-empty-calls', []);
      });

      expect(resumeTurn).not.toHaveBeenCalled();
    });

    it('ignores decide when message confirm is already decided', async () => {
      const alreadyDecidedMsg: ChatMessage = {
        id: 'msg-decided',
        role: 'assistant',
        content: '',
        tools: [],
        confirm: { calls: validCalls, decided: true },
        createdAt: new Date().toISOString(),
      };

      useChatStore.setState({ messages: [alreadyDecidedMsg] });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.decide('msg-decided', [
          { callId: 'call-1', approve: true },
          { callId: 'call-2', approve: false },
        ]);
      });

      expect(resumeTurn).not.toHaveBeenCalled();
    });

    it('ignores decide when decisions argument is not an array or has mismatched length', async () => {
      const pendingMsg: ChatMessage = {
        id: 'msg-pending',
        role: 'assistant',
        content: '',
        tools: [],
        confirm: { calls: validCalls, decided: false },
        createdAt: new Date().toISOString(),
      };

      useChatStore.setState({ messages: [pendingMsg] });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        // Not an array
        await result.current.decide('msg-pending', null as any);
        await result.current.decide('msg-pending', 'not-array' as any);
        // Length mismatch
        await result.current.decide('msg-pending', [
          { callId: 'call-1', approve: true },
        ]);
        await result.current.decide('msg-pending', [
          { callId: 'call-1', approve: true },
          { callId: 'call-2', approve: false },
          { callId: 'call-3', approve: true },
        ]);
      });

      expect(resumeTurn).not.toHaveBeenCalled();
    });

    it('ignores decide when decisions contain invalid items, non-string callId, or unknown callId', async () => {
      const pendingMsg: ChatMessage = {
        id: 'msg-pending',
        role: 'assistant',
        content: '',
        tools: [],
        confirm: { calls: validCalls, decided: false },
        createdAt: new Date().toISOString(),
      };

      useChatStore.setState({ messages: [pendingMsg] });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        // Null item
        await result.current.decide('msg-pending', [
          null as any,
          { callId: 'call-2', approve: true },
        ]);
        // Non-string callId
        await result.current.decide('msg-pending', [
          { callId: 123 as any, approve: true },
          { callId: 'call-2', approve: true },
        ]);
        // Unknown callId
        await result.current.decide('msg-pending', [
          { callId: 'wrong-call-id', approve: true },
          { callId: 'call-2', approve: true },
        ]);
        // Duplicate callId in decisions
        await result.current.decide('msg-pending', [
          { callId: 'call-1', approve: true },
          { callId: 'call-1', approve: false },
        ]);
      });

      expect(resumeTurn).not.toHaveBeenCalled();
    });

    it('ignores decide when threadId is missing in store', async () => {
      const pendingMsg: ChatMessage = {
        id: 'msg-pending',
        role: 'assistant',
        content: '',
        tools: [],
        confirm: { calls: validCalls, decided: false },
        createdAt: new Date().toISOString(),
      };

      useChatStore.setState({ threadId: null, messages: [pendingMsg] });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.decide('msg-pending', [
          { callId: 'call-1', approve: true },
          { callId: 'call-2', approve: false },
        ]);
      });

      expect(resumeTurn).not.toHaveBeenCalled();
    });
  });

  describe('decide - execution and error handling', () => {
    const validCalls: ChatConfirmCall[] = [
      {
        id: 'c1',
        name: 'delete_product',
        summary: 'Xóa sp',
        risk: 'DESTRUCTIVE',
      },
      {
        id: 'c2',
        name: 'delete_category',
        summary: 'Xóa dm',
        risk: 'DESTRUCTIVE',
      },
    ];
    const decisions: AgentDecision[] = [
      { callId: 'c1', approve: true },
      { callId: 'c2', approve: false },
    ];

    it('successfully sends decisions, marks decided: true, and handles SSE messages', async () => {
      useChatStore.setState({
        threadId: 'thread-decide-1',
        messages: [
          {
            id: 'msg-confirm',
            role: 'assistant',
            content: '',
            tools: [],
            confirm: { calls: validCalls, decided: false },
            createdAt: new Date().toISOString(),
          },
        ],
      });

      vi.mocked(resumeTurn).mockImplementation(
        async (_threadId, _decisions, onMessage) => {
          onMessage({
            event: 'token',
            data: { text: 'Đã hoàn tất thao tác quyết định' },
          });
          onMessage({ event: 'done', data: null });
        },
      );

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.decide('msg-confirm', decisions);
      });

      expect(resumeTurn).toHaveBeenCalledWith(
        'thread-decide-1',
        decisions,
        expect.any(Function),
        { signal: expect.any(AbortSignal) },
      );

      const msg = useChatStore.getState().messages[0];
      expect(msg.confirm?.decided).toBe(true);
      expect(msg.content).toBe('Đã hoàn tất thao tác quyết định');
      expect(result.current.isStreaming).toBe(false);
    });

    it('silently ignores abort errors in decide without setting message error', async () => {
      useChatStore.setState({
        threadId: 'thread-decide-abort',
        messages: [
          {
            id: 'msg-confirm-abort',
            role: 'assistant',
            content: '',
            tools: [],
            confirm: { calls: validCalls, decided: false },
            createdAt: new Date().toISOString(),
          },
        ],
      });

      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';
      vi.mocked(resumeTurn).mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.decide('msg-confirm-abort', decisions);
      });

      const msg = useChatStore.getState().messages[0];
      expect(msg.error).toBeUndefined();
      expect(result.current.isStreaming).toBe(false);
    });

    it('handles 404 in decide by resetting threadId and setting 404 error without restoring decided: false', async () => {
      useChatStore.setState({
        threadId: 'thread-decide-404',
        messages: [
          {
            id: 'msg-404',
            role: 'assistant',
            content: '',
            tools: [],
            confirm: { calls: validCalls, decided: false },
            createdAt: new Date().toISOString(),
          },
        ],
      });

      vi.mocked(resumeTurn).mockRejectedValueOnce(new ApiStreamError(404));

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.decide('msg-404', decisions);
      });

      expect(useChatStore.getState().threadId).toBeNull();
      const msg = useChatStore.getState().messages[0];
      expect(msg.error).toBe(
        'Cuộc trò chuyện không còn khả dụng. Hãy bắt đầu cuộc trò chuyện mới.',
      );
      // Because status is 404, decided is kept true (thread is gone, cannot retry)
      expect(msg.confirm?.decided).toBe(true);
      expect(result.current.isStreaming).toBe(false);
    });

    it('handles non-404 error in decide by reverting decided: false to allow user retry and setting error', async () => {
      useChatStore.setState({
        threadId: 'thread-decide-500',
        messages: [
          {
            id: 'msg-500',
            role: 'assistant',
            content: '',
            tools: [],
            confirm: { calls: validCalls, decided: false },
            createdAt: new Date().toISOString(),
          },
        ],
      });

      vi.mocked(resumeTurn).mockRejectedValueOnce(new ApiStreamError(500));

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.decide('msg-500', decisions);
      });

      expect(useChatStore.getState().threadId).toBe('thread-decide-500');
      const msg = useChatStore.getState().messages[0];
      expect(msg.error).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      expect(msg.confirm).toEqual({
        calls: validCalls,
        decided: false,
      });
      expect(result.current.isStreaming).toBe(false);
    });

    it('handles 403 response error in decide by reverting decided: false and mapping forbidden message', async () => {
      useChatStore.setState({
        threadId: 'thread-decide-403',
        messages: [
          {
            id: 'msg-403',
            role: 'assistant',
            content: '',
            tools: [],
            confirm: { calls: validCalls, decided: false },
            createdAt: new Date().toISOString(),
          },
        ],
      });

      vi.mocked(resumeTurn).mockRejectedValueOnce({
        response: { status: 403 },
      });

      const { result } = renderHook(() => useChatAgent(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.decide('msg-403', decisions);
      });

      const msg = useChatStore.getState().messages[0];
      expect(msg.error).toBe('Bạn không có quyền thực hiện thao tác này.');
      expect(msg.confirm?.decided).toBe(false);
    });
  });
});
