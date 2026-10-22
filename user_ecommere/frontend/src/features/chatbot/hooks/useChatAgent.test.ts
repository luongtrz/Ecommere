import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useChatAgent } from './useChatAgent';
import { useChatStore } from '../store/chatStore';
import { useCartStore, type CartItem } from '@/features/cart/store/cartStore';
import { streamTurn, resumeTurn, type AgentDecision } from '../api/agent.api';
import { ApiStreamError } from '../api/sse';
import type { ChatConfirmCall, ChatSource } from '../types';

let currentRouterLocation = { pathname: '/' };

function LocationTracker() {
  const location = useLocation();
  currentRouterLocation = location;
  return null;
}

vi.mock('axios');

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    decode: vi.fn(),
  },
  refreshAccessToken: vi.fn(),
  getCookie: vi.fn(),
  API_BASE_URL: 'http://localhost:3000',
}));

vi.mock('../api/agent.api', () => ({
  streamTurn: vi.fn(),
  resumeTurn: vi.fn(),
  agentApi: {},
}));

vi.mock('../api/sse', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/sse')>();
  return {
    ...actual,
    streamAgentRequest: vi.fn(),
  };
});

function createWrapper(
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
) {
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          React.createElement(LocationTracker),
          children,
        ),
      ),
  };
}

describe('useChatAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    currentRouterLocation = { pathname: '/' };

    if (typeof window !== 'undefined' && window.localStorage) {
      vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});
      vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {});
    }

    useChatStore.setState({
      ownerId: 'guest:test-session',
      threadId: null,
      messages: [],
      open: false,
    });

    useCartStore.setState({
      items: [],
      isOpen: false,
    });

    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/');
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial hook state', () => {
    it('returns default initial values and exposed functions', () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      expect(result.current.isStreaming).toBe(false);
      expect(typeof result.current.send).toBe('function');
      expect(typeof result.current.decide).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.newThread).toBe('function');
    });
  });

  describe('send validation and guards', () => {
    it('does not send if prompt is empty or contains only whitespace', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('');
      });
      expect(streamTurn).not.toHaveBeenCalled();
      expect(useChatStore.getState().messages).toHaveLength(0);

      await act(async () => {
        await result.current.send('    \n\t   ');
      });
      expect(streamTurn).not.toHaveBeenCalled();
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('does not send if prompt exceeds 4000 characters', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });
      const oversizedPrompt = 'a'.repeat(4001);

      await act(async () => {
        await result.current.send(oversizedPrompt);
      });

      expect(streamTurn).not.toHaveBeenCalled();
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('does not start a second send while already streaming', async () => {
      let resolveStream!: () => void;
      vi.mocked(streamTurn).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveStream = resolve;
          }),
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      let sendPromise1: Promise<void>;
      act(() => {
        sendPromise1 = result.current.send('First prompt');
      });

      expect(result.current.isStreaming).toBe(true);
      expect(streamTurn).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.send('Second prompt should be ignored');
      });
      expect(streamTurn).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveStream();
        await sendPromise1;
      });
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('send payload preparation and serialization', () => {
    it('serializes cart items with clamped quantities, rounded prices, and slices to 100 items', async () => {
      const testItems: CartItem[] = [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          name: 'Lavender Spray',
          image: '/lavender.png',
          price: 55000.4,
          quantity: 2.8,
          scent: 'Lavender',
          volumeMl: 50,
        },
        {
          productId: 'prod-2',
          variantId: 'var-2',
          name: undefined as any,
          image: '/citrus.png',
          price: undefined as any,
          quantity: 0,
          scent: 'Citrus',
          volumeMl: 100,
        },
        {
          productId: 'prod-3',
          variantId: 'var-3',
          name: 'Rose Blossom',
          image: '/rose.png',
          price: 99000,
          quantity: 250,
          scent: 'Rose',
          volumeMl: 50,
        },
        {
          productId: 'prod-4',
          variantId: 'var-4',
          name: 'Woody Spray',
          image: '/woody.png',
          price: 80000,
          quantity: -10,
          scent: 'Woody',
          volumeMl: 30,
        },
        {
          productId: 'prod-5',
          variantId: 'var-5',
          name: 'Ocean Mist',
          image: '/ocean.png',
          price: 70000,
          quantity: 'invalid-qty' as any,
          scent: 'Ocean',
          volumeMl: 50,
        },
      ];

      for (let i = 6; i <= 105; i++) {
        testItems.push({
          productId: `prod-${i}`,
          variantId: `var-${i}`,
          name: `Item ${i}`,
          image: `/img-${i}.png`,
          price: 10000 * i,
          quantity: 1,
          scent: 'Scent',
          volumeMl: 50,
        });
      }

      useCartStore.setState({ items: testItems });
      useChatStore.setState({ threadId: 'thread-existing-42' });

      window.history.pushState({}, '', '/catalog/aromatherapy');

      vi.mocked(streamTurn).mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('  Tìm sản phẩm giúp ngủ ngon  ');
      });

      expect(streamTurn).toHaveBeenCalledTimes(1);
      const [body, , options] = vi.mocked(streamTurn).mock.calls[0];

      expect(body.prompt).toBe('Tìm sản phẩm giúp ngủ ngon');
      expect(body.threadId).toBe('thread-existing-42');
      expect(body.clientContext?.currentPath).toBe('/catalog/aromatherapy');

      const serializedCart = body.clientContext?.cart;
      expect(serializedCart).toBeDefined();
      expect(serializedCart).toHaveLength(100);

      expect(serializedCart![0]).toEqual({
        variantId: 'var-1',
        quantity: 2,
        price: 55000,
        name: 'Lavender Spray',
      });
      expect(serializedCart![1]).toEqual({
        variantId: 'var-2',
        quantity: 1,
      });
      expect(serializedCart![2]).toEqual({
        variantId: 'var-3',
        quantity: 99,
        price: 99000,
        name: 'Rose Blossom',
      });
      expect(serializedCart![3]).toEqual({
        variantId: 'var-4',
        quantity: 1,
        price: 80000,
        name: 'Woody Spray',
      });
      expect(serializedCart![4]).toEqual({
        variantId: 'var-5',
        quantity: 1,
        price: 70000,
        name: 'Ocean Mist',
      });

      expect(options?.signal).toBeInstanceOf(AbortSignal);

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Tìm sản phẩm giúp ngủ ngon');
      expect(messages[1].role).toBe('assistant');
      expect(messages[1].content).toBe('');
    });

    it('slices currentPath if pathname is longer than 200 characters and omits threadId when null', async () => {
      const longSubpath = 'a'.repeat(250);
      window.history.pushState({}, '', `/${longSubpath}`);

      useChatStore.setState({ threadId: null });
      vi.mocked(streamTurn).mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Xin chào');
      });

      const [body] = vi.mocked(streamTurn).mock.calls[0];
      expect(body.threadId).toBeUndefined();
      expect(body.clientContext?.currentPath?.length).toBe(200);
      expect(body.clientContext?.currentPath).toBe(
        `/${longSubpath}`.slice(0, 200),
      );
    });

    it('handles non-string window.location.pathname safely', async () => {
      const origLocation = window.location;
      try {
        delete (window as any).location;
        (window as any).location = { pathname: 12345 };

        vi.mocked(streamTurn).mockResolvedValueOnce(undefined);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useChatAgent(), { wrapper });

        await act(async () => {
          await result.current.send('Xin chào');
        });

        const [body] = vi.mocked(streamTurn).mock.calls[0];
        expect(body.clientContext?.currentPath).toBeUndefined();
      } finally {
        (window as any).location = origLocation;
      }
    });

    it('falls back to regex uuid generator when crypto.randomUUID is not available', async () => {
      const origRandomUUID = crypto.randomUUID;
      try {
        (crypto as unknown as { randomUUID?: unknown }).randomUUID = undefined;

        vi.mocked(streamTurn).mockResolvedValueOnce(undefined);

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useChatAgent(), { wrapper });

        await act(async () => {
          await result.current.send('Test fallback UUID');
        });

        const msgs = useChatStore.getState().messages;
        expect(msgs).toHaveLength(2);
        const uuidV4Regex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(msgs[0].id).toMatch(uuidV4Regex);
        expect(msgs[1].id).toMatch(uuidV4Regex);
      } finally {
        (crypto as unknown as { randomUUID?: unknown }).randomUUID =
          origRandomUUID;
      }
    });
  });

  describe('handleSseMessage event handlers during streamTurn', () => {
    it('handles thread event with valid and invalid data', async () => {
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({ event: 'thread', data: { threadId: 'thread-sse-999' } });
        onMessage({ event: 'thread', data: { threadId: 12345 } });
        onMessage({ event: 'thread', data: null });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Tin nhắn mới');
      });

      expect(useChatStore.getState().threadId).toBe('thread-sse-999');
    });

    it('handles token events incrementally and ignores non-string tokens', async () => {
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({ event: 'token', data: { text: 'Chào ' } });
        onMessage({ event: 'token', data: { text: 'bạn, ' } });
        onMessage({ event: 'token', data: { text: 'tôi có thể giúp gì?' } });
        onMessage({ event: 'token', data: { text: 123 as any } });
        onMessage({ event: 'token', data: null });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Chào trợ lý');
      });

      const msgs = useChatStore.getState().messages;
      expect(msgs[1].content).toBe('Chào bạn, tôi có thể giúp gì?');
    });

    it('handles token when target message is not in store without throwing', async () => {
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        useChatStore.setState({ messages: [] });
        onMessage({
          event: 'token',
          data: { text: 'Token for missing message' },
        });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Xin chào');
      });

      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('handles tool_start events and ignores invalid tool data', async () => {
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({
          event: 'tool_start',
          data: {
            id: 'call-1',
            name: 'search_products',
            summary: 'Tìm kiếm sản phẩm hoa hồng',
          },
        });
        onMessage({ event: 'tool_start', data: null });
        onMessage({ event: 'tool_start', data: { id: 12345 } });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Tìm xịt phòng hoa hồng');
      });

      const tools = useChatStore.getState().messages[1].tools;
      expect(tools).toHaveLength(1);
      expect(tools[0]).toEqual({
        id: 'call-1',
        name: 'search_products',
        summary: 'Tìm kiếm sản phẩm hoa hồng',
        status: 'running',
      });
    });

    it('handles tool_start when target message is missing without error', async () => {
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        useChatStore.setState({ messages: [] });
        onMessage({
          event: 'tool_start',
          data: { id: 'call-x', name: 'calc', summary: 'Đang tính toán' },
        });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Tính giá');
      });

      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it('handles tool_result for existing and non-existing steps, ok and error status', async () => {
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({
          event: 'tool_start',
          data: { id: 'step-1', name: 'search_products', summary: 'Đang tìm' },
        });
        onMessage({
          event: 'tool_start',
          data: {
            id: 'step-2',
            name: 'calc_discount',
            summary: 'Đang tính giảm giá',
          },
        });

        // Update step-1 with ok: true (also exercises `: step` branch for step-2)
        onMessage({
          event: 'tool_result',
          data: {
            id: 'step-1',
            name: 'search_products',
            ok: true,
            summary: 'Đã tìm thấy 3 sản phẩm',
          },
        });

        // Update step-2 with ok: false
        onMessage({
          event: 'tool_result',
          data: {
            id: 'step-2',
            name: 'calc_discount',
            ok: false,
            summary: 'Mã giảm giá không hợp lệ',
          },
        });

        // Tool result for a step that was not started (stepExists === false, ok: true)
        onMessage({
          event: 'tool_result',
          data: {
            id: 'step-3',
            name: 'check_stock',
            ok: true,
            summary: 'Còn hàng',
          },
        });

        // Tool result for non-started step with ok: false
        onMessage({
          event: 'tool_result',
          data: {
            id: 'step-4',
            name: 'verify_coupon',
            ok: false,
            summary: 'Hết hạn',
          },
        });

        // Invalid tool_result data
        onMessage({ event: 'tool_result', data: null });
        onMessage({ event: 'tool_result', data: { id: 123 } });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Thực hiện chuỗi tác vụ');
      });

      const tools = useChatStore.getState().messages[1].tools;
      expect(tools).toHaveLength(4);

      expect(tools[0]).toEqual({
        id: 'step-1',
        name: 'search_products',
        summary: 'Đang tìm',
        status: 'ok',
        resultSummary: 'Đã tìm thấy 3 sản phẩm',
      });

      expect(tools[1]).toEqual({
        id: 'step-2',
        name: 'calc_discount',
        summary: 'Đang tính giảm giá',
        status: 'error',
        resultSummary: 'Mã giảm giá không hợp lệ',
      });

      expect(tools[2]).toEqual({
        id: 'step-3',
        name: 'check_stock',
        summary: 'Còn hàng',
        status: 'ok',
        resultSummary: 'Còn hàng',
      });

      expect(tools[3]).toEqual({
        id: 'step-4',
        name: 'verify_coupon',
        summary: 'Hết hạn',
        status: 'error',
        resultSummary: 'Hết hạn',
      });
    });

    it('checkout tool clears cart and invalidates checkout query keys', async () => {
      useCartStore.setState({
        items: [
          {
            productId: 'p-1',
            variantId: 'v-1',
            name: 'Spray',
            image: '/spray.png',
            price: 50000,
            quantity: 1,
            scent: 'Citrus',
            volumeMl: 50,
          },
        ],
      });

      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({
          event: 'tool_result',
          data: {
            id: 'checkout-step',
            name: 'checkout',
            ok: true,
            summary: 'Đặt hàng thành công',
          },
        });
      });

      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Thanh toán đơn hàng');
      });

      expect(useCartStore.getState().items).toHaveLength(0);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders'] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['order-detail'],
      });
    });

    it('does not invalidate query keys for local cart tools (isCartTool)', async () => {
      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({
          event: 'tool_result',
          data: {
            id: 'cart-tool-step',
            name: 'cart_add_item',
            ok: true,
            summary: 'Đã thêm vào giỏ hàng',
          },
        });
      });

      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Thêm vào giỏ');
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('invalidates mapped keys for non-cart tools on ok: true', async () => {
      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({
          event: 'tool_result',
          data: {
            id: 'order-cancel-step',
            name: 'cancel_my_order',
            ok: true,
            summary: 'Đã hủy đơn hàng',
          },
        });
      });

      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Hủy đơn hàng của tôi');
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders'] });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['order-detail'],
      });
    });

    it('does not trigger checkout actions or query invalidations if tool_result ok is false', async () => {
      useCartStore.setState({
        items: [
          {
            productId: 'p-1',
            variantId: 'v-1',
            name: 'Spray',
            image: '/spray.png',
            price: 50000,
            quantity: 1,
            scent: 'Citrus',
            volumeMl: 50,
          },
        ],
      });

      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({
          event: 'tool_result',
          data: {
            id: 'checkout-fail',
            name: 'checkout',
            ok: false,
            summary: 'Thanh toán thất bại',
          },
        });
      });

      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Thanh toán đơn hàng');
      });

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('handles confirm_required event with valid calls and ignores invalid data', async () => {
      const mockCalls: ChatConfirmCall[] = [
        {
          id: 'call-checkout',
          name: 'checkout',
          summary: 'Xác nhận tạo đơn hàng và thanh toán',
          risk: 'WRITE',
        },
      ];

      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({ event: 'confirm_required', data: { calls: mockCalls } });
        onMessage({ event: 'confirm_required', data: null });
        onMessage({
          event: 'confirm_required',
          data: { calls: 'not-an-array' },
        });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Tạo đơn hàng giúp tôi');
      });

      const confirm = useChatStore.getState().messages[1].confirm;
      expect(confirm).toEqual({
        calls: mockCalls,
        decided: false,
      });
    });

    it('handles sources event with valid array and ignores non-array data', async () => {
      const mockSources: ChatSource[] = [
        {
          id: 'prod-src-1',
          name: 'Xịt thơm phòng sả chanh',
          slug: 'xit-thom-phong-sa-chanh',
          score: 0.95,
        },
      ];

      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({ event: 'sources', data: mockSources });
        onMessage({ event: 'sources', data: { notAnArray: true } });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Gợi ý xịt phòng sả chanh');
      });

      const sources = useChatStore.getState().messages[1].sources;
      expect(sources).toEqual(mockSources);
    });

    describe('ui_action event and UiActionDeps methods', () => {
      it('executes cart.add with all fields present', async () => {
        vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
          onMessage({
            event: 'ui_action',
            data: {
              type: 'cart.add',
              payload: {
                productId: 'prod-complete',
                variantId: 'var-complete',
                name: 'Xịt Thơm Cao Cấp',
                image: '/image.png',
                price: 120000,
                quantity: 2,
                scent: 'Quế Gừng',
                volumeMl: 100,
              },
            },
          });
        });

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useChatAgent(), { wrapper });

        await act(async () => {
          await result.current.send('Thêm sản phẩm quế gừng vào giỏ');
        });

        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(1);
        expect(cartItems[0]).toEqual({
          productId: 'prod-complete',
          variantId: 'var-complete',
          name: 'Xịt Thơm Cao Cấp',
          image: '/image.png',
          price: 120000,
          quantity: 2,
          scent: 'Quế Gừng',
          volumeMl: 100,
        });
      });

      it('executes cart.add when optional name, image, and price are omitted in item', async () => {
        vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
          onMessage({
            event: 'ui_action',
            data: {
              type: 'cart.add',
              payload: {
                productId: 'prod-minimal',
                variantId: 'var-minimal',
                quantity: 1,
                scent: 'Bạc Hà',
                volumeMl: 50,
              },
            },
          });
        });

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useChatAgent(), { wrapper });

        await act(async () => {
          await result.current.send('Thêm sản phẩm');
        });

        const cartItems = useCartStore.getState().items;
        expect(cartItems).toHaveLength(1);
        expect(cartItems[0].name).toBe('');
        expect(cartItems[0].image).toBe('');
        expect(cartItems[0].price).toBe(0);
        expect(cartItems[0].quantity).toBe(1);
        expect(cartItems[0].scent).toBe('Bạc Hà');
        expect(cartItems[0].volumeMl).toBe(50);
      });

      it('does not add to cart when required fields (productId, scent, volumeMl) fail guard in deps.addToCart', async () => {
        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useChatAgent(), { wrapper });

        // Missing/whitespace productId
        vi.mocked(streamTurn).mockImplementationOnce(
          async (_body, onMessage) => {
            onMessage({
              event: 'ui_action',
              data: {
                type: 'cart.add',
                payload: {
                  productId: '   ',
                  variantId: 'var-invalid',
                  quantity: 1,
                  scent: 'Scent',
                  volumeMl: 50,
                },
              },
            });
          },
        );
        await act(async () => {
          await result.current.send('Thêm với id rỗng');
        });
        expect(useCartStore.getState().items).toHaveLength(0);

        // Missing scent
        vi.mocked(streamTurn).mockImplementationOnce(
          async (_body, onMessage) => {
            onMessage({
              event: 'ui_action',
              data: {
                type: 'cart.add',
                payload: {
                  productId: 'prod-x',
                  variantId: 'var-x',
                  quantity: 1,
                  volumeMl: 50,
                },
              },
            });
          },
        );
        await act(async () => {
          await result.current.send('Thêm không có mùi');
        });
        expect(useCartStore.getState().items).toHaveLength(0);

        // Missing volumeMl
        vi.mocked(streamTurn).mockImplementationOnce(
          async (_body, onMessage) => {
            onMessage({
              event: 'ui_action',
              data: {
                type: 'cart.add',
                payload: {
                  productId: 'prod-y',
                  variantId: 'var-y',
                  quantity: 1,
                  scent: 'Floral',
                },
              },
            });
          },
        );
        await act(async () => {
          await result.current.send('Thêm không có dung tích');
        });
        expect(useCartStore.getState().items).toHaveLength(0);
      });

      it('executes cart.update, cart.remove, cart.clear, navigate, and invalidate actions', async () => {
        useCartStore.setState({
          items: [
            {
              productId: 'p-1',
              variantId: 'var-target',
              name: 'Spray 1',
              image: '/img1.png',
              price: 40000,
              quantity: 1,
              scent: 'Herbal',
              volumeMl: 50,
            },
            {
              productId: 'p-2',
              variantId: 'var-other',
              name: 'Spray 2',
              image: '/img2.png',
              price: 60000,
              quantity: 1,
              scent: 'Woody',
              volumeMl: 100,
            },
          ],
        });

        const { queryClient, wrapper } = createWrapper();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
          // cart.update
          onMessage({
            event: 'ui_action',
            data: {
              type: 'cart.update',
              payload: { variantId: 'var-target', quantity: 3 },
            },
          });

          // cart.remove
          onMessage({
            event: 'ui_action',
            data: {
              type: 'cart.remove',
              payload: { variantId: 'var-other' },
            },
          });

          // navigate
          onMessage({
            event: 'ui_action',
            data: {
              type: 'navigate',
              payload: { to: '/cart' },
            },
          });

          // invalidate
          onMessage({
            event: 'ui_action',
            data: {
              type: 'invalidate',
              payload: { keys: [['products'], ['user']] },
            },
          });
        });

        const { result } = renderHook(() => useChatAgent(), { wrapper });

        await act(async () => {
          await result.current.send('Cập nhật giỏ hàng và điều hướng');
        });

        const items = useCartStore.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0].variantId).toBe('var-target');
        expect(items[0].quantity).toBe(3);

        expect(currentRouterLocation.pathname).toBe('/cart');
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user'] });
      });

      it('executes cart.clear action and ignores invalid ui_action data', async () => {
        useCartStore.setState({
          items: [
            {
              productId: 'p-1',
              variantId: 'var-target',
              name: 'Spray 1',
              image: '/img1.png',
              price: 40000,
              quantity: 1,
              scent: 'Herbal',
              volumeMl: 50,
            },
          ],
        });

        vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
          onMessage({
            event: 'ui_action',
            data: { type: 'cart.clear', payload: {} },
          });
          onMessage({ event: 'ui_action', data: null });
          onMessage({ event: 'ui_action', data: 'not-an-object' });
        });

        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useChatAgent(), { wrapper });

        await act(async () => {
          await result.current.send('Xóa sạch giỏ hàng');
        });

        expect(useCartStore.getState().items).toHaveLength(0);
      });
    });

    it('handles done event by resetting isStreaming', async () => {
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({ event: 'done', data: {} });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Hoàn tất');
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('handles error event with custom server message and fallback message', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      // Custom message
      vi.mocked(streamTurn).mockImplementationOnce(async (_body, onMessage) => {
        onMessage({
          event: 'error',
          data: { message: 'Dịch vụ AI tạm thời quá tải' },
        });
      });

      await act(async () => {
        await result.current.send('Thử lỗi server');
      });

      expect(useChatStore.getState().messages[1].error).toBe(
        'Dịch vụ AI tạm thời quá tải',
      );
      expect(result.current.isStreaming).toBe(false);

      // Empty string / whitespace message -> fallback
      vi.mocked(streamTurn).mockImplementationOnce(async (_body, onMessage) => {
        onMessage({ event: 'error', data: { message: '    ' } });
      });

      await act(async () => {
        await result.current.send('Thử lỗi rỗng');
      });

      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].error).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );

      // Null data message -> fallback
      vi.mocked(streamTurn).mockImplementationOnce(async (_body, onMessage) => {
        onMessage({ event: 'error', data: null });
      });

      await act(async () => {
        await result.current.send('Thử lỗi null');
      });

      const latestMsgs = useChatStore.getState().messages;
      expect(latestMsgs[latestMsgs.length - 1].error).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );
    });

    it('ignores unknown event type in default switch case', async () => {
      vi.mocked(streamTurn).mockImplementation(async (_body, onMessage) => {
        onMessage({ event: 'unknown_keepalive_event', data: {} });
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Xin chào');
      });

      const msgs = useChatStore.getState().messages;
      expect(msgs).toHaveLength(2);
      expect(msgs[1].content).toBe('');
      expect(msgs[1].error).toBeUndefined();
    });
  });

  describe('send error handling and status mapping', () => {
    it('silently swallows abort errors without setting an error message', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      // Error with name === 'AbortError'
      vi.mocked(streamTurn).mockRejectedValueOnce({ name: 'AbortError' });
      await act(async () => {
        await result.current.send('Hủy 1');
      });
      expect(useChatStore.getState().messages[1].error).toBeUndefined();
      expect(result.current.isStreaming).toBe(false);

      // Error with message 'The user aborted a request.'
      vi.mocked(streamTurn).mockRejectedValueOnce({
        message: 'The user aborted a request.',
      });
      await act(async () => {
        await result.current.send('Hủy 2');
      });
      const msgs = useChatStore.getState().messages;
      expect(msgs[msgs.length - 1].error).toBeUndefined();

      // Error with message 'BodyStreamBuffer was aborted'
      vi.mocked(streamTurn).mockRejectedValueOnce({
        message: 'BodyStreamBuffer was aborted',
      });
      await act(async () => {
        await result.current.send('Hủy 3');
      });
      const msgs3 = useChatStore.getState().messages;
      expect(msgs3[msgs3.length - 1].error).toBeUndefined();
    });

    it('resets threadId to null and sets exact Vietnamese error for 404 ApiStreamError', async () => {
      useChatStore.setState({ threadId: 'thread-to-clear' });
      vi.mocked(streamTurn).mockRejectedValueOnce(
        new ApiStreamError(404, 'Cuộc trò chuyện không còn khả dụng.'),
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.send('Kiểm tra lỗi 404');
      });

      expect(useChatStore.getState().threadId).toBeNull();
      expect(useChatStore.getState().messages[1].error).toBe(
        'Cuộc trò chuyện không còn khả dụng. Hãy bắt đầu cuộc trò chuyện mới.',
      );
      expect(result.current.isStreaming).toBe(false);
    });

    it('maps error status codes to their exact Vietnamese messages without clearing threadId', async () => {
      const errorCases = [
        {
          error: { status: 401 },
          expected: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        },
        {
          error: { response: { status: 403 } },
          expected: 'Bạn không có quyền thực hiện thao tác này.',
        },
        {
          error: { status: 409 },
          expected: 'Trợ lý đang xử lý yêu cầu trước. Vui lòng đợi giây lát.',
        },
        {
          error: { status: 429 },
          expected: 'Bạn gửi quá nhanh. Vui lòng thử lại sau ít phút.',
        },
        {
          error: { status: 503 },
          expected: 'Trợ lý chưa được cấu hình.',
        },
        {
          error: { status: 500 },
          expected: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        },
        {
          error: new Error('Network failure without status'),
          expected: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        },
        {
          error: 'plain string error',
          expected: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        },
        {
          error: null,
          expected: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        },
      ];

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      for (let i = 0; i < errorCases.length; i++) {
        const { error, expected } = errorCases[i];
        useChatStore.setState({ threadId: 'persistent-thread' });

        vi.mocked(streamTurn).mockRejectedValueOnce(error);

        await act(async () => {
          await result.current.send(`Thử lỗi ${i}`);
        });

        const msgs = useChatStore.getState().messages;
        const lastAssistantMsg = msgs[msgs.length - 1];
        expect(lastAssistantMsg.error).toBe(expected);
        expect(useChatStore.getState().threadId).toBe('persistent-thread');
        expect(result.current.isStreaming).toBe(false);
      }
    });
  });

  describe('cancel and newThread', () => {
    it('cancels active streaming turn via abort controller', async () => {
      let capturedSignal!: AbortSignal;
      vi.mocked(streamTurn).mockImplementation(
        (_body, _onMessage, options) =>
          new Promise<void>((_resolve, reject) => {
            capturedSignal = options?.signal as AbortSignal;
            capturedSignal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      act(() => {
        void result.current.send('Đang xử lý');
      });

      expect(result.current.isStreaming).toBe(true);
      expect(capturedSignal.aborted).toBe(false);

      act(() => {
        result.current.cancel();
      });

      expect(capturedSignal.aborted).toBe(true);
      expect(result.current.isStreaming).toBe(false);
    });

    it('calling cancel when not streaming is a safe no-op', () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isStreaming).toBe(false);
    });

    it('newThread cancels active stream and resets chat store', async () => {
      useChatStore.setState({
        threadId: 'thread-to-reset',
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            tools: [],
            createdAt: '',
          },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      act(() => {
        result.current.newThread();
      });

      expect(useChatStore.getState().threadId).toBeNull();
      expect(useChatStore.getState().messages).toHaveLength(0);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('decide validation and guards', () => {
    it('ignores decide call if already streaming', async () => {
      let resolveStream!: () => void;
      vi.mocked(streamTurn).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveStream = resolve;
          }),
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      let sendPromise!: Promise<void>;
      act(() => {
        sendPromise = result.current.send('Bắt đầu stream');
      });

      expect(result.current.isStreaming).toBe(true);

      await act(async () => {
        await result.current.decide('any-id', [
          { callId: 'c1', approve: true },
        ]);
      });
      expect(resumeTurn).not.toHaveBeenCalled();

      await act(async () => {
        resolveStream();
        await sendPromise;
      });
    });

    it('returns early if target message is not found or has no confirm calls', async () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.decide('non-existent-msg', [
          { callId: 'c1', approve: true },
        ]);
      });
      expect(resumeTurn).not.toHaveBeenCalled();

      useChatStore.setState({
        threadId: 'th-1',
        messages: [
          {
            id: 'msg-without-confirm',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
          },
        ],
      });

      await act(async () => {
        await result.current.decide('msg-without-confirm', [
          { callId: 'c1', approve: true },
        ]);
      });
      expect(resumeTurn).not.toHaveBeenCalled();

      useChatStore.setState({
        messages: [
          {
            id: 'msg-empty-calls',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: { calls: [] },
          },
        ],
      });

      await act(async () => {
        await result.current.decide('msg-empty-calls', []);
      });
      expect(resumeTurn).not.toHaveBeenCalled();
    });

    it('returns early if confirm is already decided', async () => {
      useChatStore.setState({
        threadId: 'th-1',
        messages: [
          {
            id: 'msg-decided',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: {
              calls: [
                {
                  id: 'call-1',
                  name: 'checkout',
                  summary: 'Thanh toán',
                  risk: 'WRITE',
                },
              ],
              decided: true,
            },
          },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.decide('msg-decided', [
          { callId: 'call-1', approve: true },
        ]);
      });

      expect(resumeTurn).not.toHaveBeenCalled();
    });

    it('returns early if decisions is not an array or length mismatches calls length', async () => {
      useChatStore.setState({
        threadId: 'th-1',
        messages: [
          {
            id: 'msg-two-calls',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: {
              calls: [
                { id: 'c1', name: 'tool1', summary: 'sum1', risk: 'WRITE' },
                { id: 'c2', name: 'tool2', summary: 'sum2', risk: 'WRITE' },
              ],
              decided: false,
            },
          },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.decide(
          'msg-two-calls',
          null as unknown as AgentDecision[],
        );
      });
      expect(resumeTurn).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.decide('msg-two-calls', [
          { callId: 'c1', approve: true },
        ]);
      });
      expect(resumeTurn).not.toHaveBeenCalled();
    });

    it('validates each decision object and returns early on invalid or duplicate callIds', async () => {
      useChatStore.setState({
        threadId: 'th-1',
        messages: [
          {
            id: 'msg-calls',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: {
              calls: [
                { id: 'c1', name: 'tool1', summary: 'sum1', risk: 'WRITE' },
                { id: 'c2', name: 'tool2', summary: 'sum2', risk: 'WRITE' },
              ],
              decided: false,
            },
          },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      // Decision is null / invalid
      await act(async () => {
        await result.current.decide('msg-calls', [
          null as unknown as AgentDecision,
          { callId: 'c2', approve: true },
        ]);
      });
      expect(resumeTurn).not.toHaveBeenCalled();

      // Non-string callId
      await act(async () => {
        await result.current.decide('msg-calls', [
          { callId: 123 as unknown as string, approve: true },
          { callId: 'c2', approve: true },
        ]);
      });
      expect(resumeTurn).not.toHaveBeenCalled();

      // Unknown callId
      await act(async () => {
        await result.current.decide('msg-calls', [
          { callId: 'unknown-id', approve: true },
          { callId: 'c2', approve: true },
        ]);
      });
      expect(resumeTurn).not.toHaveBeenCalled();

      // Duplicate decision for same callId
      await act(async () => {
        await result.current.decide('msg-calls', [
          { callId: 'c1', approve: true },
          { callId: 'c1', approve: false },
        ]);
      });
      expect(resumeTurn).not.toHaveBeenCalled();
    });

    it('returns early without marking decided if threadId is missing in store', async () => {
      useChatStore.setState({
        threadId: null,
        messages: [
          {
            id: 'msg-valid',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: {
              calls: [
                { id: 'c1', name: 'checkout', summary: 'sum', risk: 'WRITE' },
              ],
              decided: false,
            },
          },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.decide('msg-valid', [
          { callId: 'c1', approve: true },
        ]);
      });

      expect(resumeTurn).not.toHaveBeenCalled();
      expect(useChatStore.getState().messages[0].confirm?.decided).toBe(false);
    });
  });

  describe('decide execution and error handling', () => {
    it('marks confirm as decided, streams via resumeTurn, and handles SSE events', async () => {
      useChatStore.setState({
        threadId: 'th-resume-1',
        messages: [
          {
            id: 'msg-decide-ok',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: {
              calls: [
                { id: 'c1', name: 'checkout', summary: 'sum', risk: 'WRITE' },
              ],
              decided: false,
            },
          },
        ],
      });

      vi.mocked(resumeTurn).mockImplementation(
        async (_threadId, _decisions, onMessage) => {
          onMessage({
            event: 'token',
            data: { text: 'Đã xác nhận thanh toán đơn hàng thành công.' },
          });
          onMessage({ event: 'done', data: {} });
        },
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.decide('msg-decide-ok', [
          { callId: 'c1', approve: true },
        ]);
      });

      expect(resumeTurn).toHaveBeenCalledTimes(1);
      const [threadId, decisions, , options] =
        vi.mocked(resumeTurn).mock.calls[0];
      expect(threadId).toBe('th-resume-1');
      expect(decisions).toEqual([{ callId: 'c1', approve: true }]);
      expect(options?.signal).toBeInstanceOf(AbortSignal);

      const msg = useChatStore.getState().messages[0];
      expect(msg.confirm?.decided).toBe(true);
      expect(msg.content).toBe('Đã xác nhận thanh toán đơn hàng thành công.');
      expect(result.current.isStreaming).toBe(false);
    });

    it('silently swallows abort errors during decide', async () => {
      useChatStore.setState({
        threadId: 'th-resume-abort',
        messages: [
          {
            id: 'msg-abort',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: {
              calls: [
                { id: 'c1', name: 'checkout', summary: 'sum', risk: 'WRITE' },
              ],
              decided: false,
            },
          },
        ],
      });

      vi.mocked(resumeTurn).mockRejectedValueOnce({ name: 'AbortError' });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.decide('msg-abort', [
          { callId: 'c1', approve: true },
        ]);
      });

      const msg = useChatStore.getState().messages[0];
      expect(msg.confirm?.decided).toBe(true);
      expect(msg.error).toBeUndefined();
      expect(result.current.isStreaming).toBe(false);
    });

    it('on 404 error in decide: clears threadId and does not revert decided flag', async () => {
      useChatStore.setState({
        threadId: 'th-to-clear-on-decide',
        messages: [
          {
            id: 'msg-404',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: {
              calls: [
                { id: 'c1', name: 'checkout', summary: 'sum', risk: 'WRITE' },
              ],
              decided: false,
            },
          },
        ],
      });

      vi.mocked(resumeTurn).mockRejectedValueOnce(
        new ApiStreamError(404, 'Cuộc trò chuyện không còn khả dụng.'),
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.decide('msg-404', [
          { callId: 'c1', approve: true },
        ]);
      });

      expect(useChatStore.getState().threadId).toBeNull();
      const msg = useChatStore.getState().messages[0];
      expect(msg.confirm?.decided).toBe(true);
      expect(msg.error).toBe(
        'Cuộc trò chuyện không còn khả dụng. Hãy bắt đầu cuộc trò chuyện mới.',
      );
      expect(result.current.isStreaming).toBe(false);
    });

    it('on non-404 error in decide: keeps threadId and reverts decided back to false', async () => {
      useChatStore.setState({
        threadId: 'th-keep-on-500',
        messages: [
          {
            id: 'msg-500',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: {
              calls: [
                { id: 'c1', name: 'checkout', summary: 'sum', risk: 'WRITE' },
              ],
              decided: false,
            },
          },
        ],
      });

      vi.mocked(resumeTurn).mockRejectedValueOnce({ status: 500 });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      await act(async () => {
        await result.current.decide('msg-500', [
          { callId: 'c1', approve: true },
        ]);
      });

      expect(useChatStore.getState().threadId).toBe('th-keep-on-500');
      const msg = useChatStore.getState().messages[0];
      expect(msg.confirm?.decided).toBe(false);
      expect(msg.error).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      expect(result.current.isStreaming).toBe(false);
    });

    it('cleans up abort controller when cancelled during decide', async () => {
      useChatStore.setState({
        threadId: 'th-decide-cancel',
        messages: [
          {
            id: 'msg-decide-cancel',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '',
            confirm: {
              calls: [
                { id: 'c1', name: 'checkout', summary: 'sum', risk: 'WRITE' },
              ],
              decided: false,
            },
          },
        ],
      });

      let capturedSignal!: AbortSignal;
      vi.mocked(resumeTurn).mockImplementation(
        (_threadId, _decisions, _onMessage, options) =>
          new Promise<void>((_resolve, reject) => {
            capturedSignal = options?.signal as AbortSignal;
            capturedSignal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useChatAgent(), { wrapper });

      act(() => {
        void result.current.decide('msg-decide-cancel', [
          { callId: 'c1', approve: true },
        ]);
      });

      expect(result.current.isStreaming).toBe(true);
      expect(capturedSignal.aborted).toBe(false);

      act(() => {
        result.current.cancel();
      });

      expect(capturedSignal.aborted).toBe(true);
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('unmount cleanup', () => {
    it('aborts active streaming request on component unmount', async () => {
      let capturedSignal!: AbortSignal;
      vi.mocked(streamTurn).mockImplementation(
        (_body, _onMessage, options) =>
          new Promise<void>((_resolve, reject) => {
            capturedSignal = options?.signal as AbortSignal;
            capturedSignal.addEventListener('abort', () => {
              reject(new DOMException('Aborted on unmount', 'AbortError'));
            });
          }),
      );

      const { wrapper } = createWrapper();
      const { result, unmount } = renderHook(() => useChatAgent(), { wrapper });

      act(() => {
        void result.current.send('Kiểm tra unmount');
      });

      expect(result.current.isStreaming).toBe(true);
      expect(capturedSignal.aborted).toBe(false);

      unmount();

      expect(capturedSignal.aborted).toBe(true);
    });

    it('unmounting while not streaming is safe', () => {
      const { wrapper } = createWrapper();
      const { unmount } = renderHook(() => useChatAgent(), { wrapper });

      expect(() => unmount()).not.toThrow();
    });
  });
});
