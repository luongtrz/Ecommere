import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useChatStore,
  chatStore,
  type ChatState,
  type ChatPersistedState,
} from './chatStore';
import type { ChatMessage } from '../types';

const createChatMessage = (overrides?: Partial<ChatMessage>): ChatMessage => ({
  id: 'msg-1',
  role: 'user',
  content: 'Xin chào, tôi cần hỗ trợ quản lý kho hàng',
  tools: [],
  createdAt: '2026-10-22T08:00:00.000Z',
  ...overrides,
});

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      ownerId: null,
      threadId: null,
      messages: [],
      open: false,
    });
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state and export aliases', () => {
    it('initializes with default state values', () => {
      const state = useChatStore.getState();
      expect(state.ownerId).toBeNull();
      expect(state.threadId).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.open).toBe(false);
    });

    it('exports chatStore as an alias to useChatStore', () => {
      expect(chatStore).toBe(useChatStore);
    });
  });

  describe('claimOwner', () => {
    it('sets ownerId and resets threadId and messages when ownerId changes', () => {
      useChatStore.setState({
        ownerId: null,
        threadId: 'th-old',
        messages: [createChatMessage()],
      });

      useChatStore.getState().claimOwner('admin-user-1');

      const state = useChatStore.getState();
      expect(state.ownerId).toBe('admin-user-1');
      expect(state.threadId).toBeNull();
      expect(state.messages).toEqual([]);
    });

    it('does nothing when ownerId matches current ownerId (early return)', () => {
      useChatStore.setState({
        ownerId: 'admin-user-1',
        threadId: 'th-keep',
        messages: [createChatMessage({ id: 'msg-keep' })],
      });

      useChatStore.getState().claimOwner('admin-user-1');

      const state = useChatStore.getState();
      expect(state.ownerId).toBe('admin-user-1');
      expect(state.threadId).toBe('th-keep');
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].id).toBe('msg-keep');
    });

    it('does nothing when ownerId is already null and claimed with null', () => {
      useChatStore.setState({
        ownerId: null,
        threadId: 'th-keep-null',
        messages: [createChatMessage({ id: 'msg-null' })],
      });

      useChatStore.getState().claimOwner(null);

      const state = useChatStore.getState();
      expect(state.ownerId).toBeNull();
      expect(state.threadId).toBe('th-keep-null');
      expect(state.messages).toHaveLength(1);
    });

    it('switches between different owner IDs and resets threadId and messages each time', () => {
      useChatStore.getState().claimOwner('admin-1');
      useChatStore.getState().setThreadId('th-1');
      useChatStore.getState().appendMessage(createChatMessage({ id: 'msg-1' }));

      useChatStore.getState().claimOwner('admin-2');
      let state = useChatStore.getState();
      expect(state.ownerId).toBe('admin-2');
      expect(state.threadId).toBeNull();
      expect(state.messages).toEqual([]);

      useChatStore.getState().claimOwner(null);
      state = useChatStore.getState();
      expect(state.ownerId).toBeNull();
      expect(state.threadId).toBeNull();
      expect(state.messages).toEqual([]);
    });
  });

  describe('setThreadId', () => {
    it('updates threadId to a string identifier', () => {
      useChatStore.getState().setThreadId('thread-abc-123');
      expect(useChatStore.getState().threadId).toBe('thread-abc-123');
    });

    it('clears threadId when set to null', () => {
      useChatStore.getState().setThreadId('thread-abc-123');
      useChatStore.getState().setThreadId(null);
      expect(useChatStore.getState().threadId).toBeNull();
    });
  });

  describe('setOpen', () => {
    it('toggles open state to true and false', () => {
      useChatStore.getState().setOpen(true);
      expect(useChatStore.getState().open).toBe(true);

      useChatStore.getState().setOpen(false);
      expect(useChatStore.getState().open).toBe(false);
    });
  });

  describe('appendMessage', () => {
    it('appends messages sequentially and preserves all fields', () => {
      const msg1 = createChatMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Kiểm tra tồn kho sản phẩm A',
      });
      const msg2: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Sản phẩm A còn 50 đơn vị trong kho.',
        tools: [
          {
            id: 'tool-1',
            name: 'checkStock',
            summary: 'Tra cứu tồn kho',
            status: 'ok',
            resultSummary: 'Còn 50 đơn vị',
          },
        ],
        confirm: {
          calls: [
            {
              id: 'call-1',
              name: 'adjustStock',
              summary: 'Điều chỉnh số lượng',
              risk: 'WRITE',
            },
          ],
          decided: false,
        },
        sources: [
          {
            id: 'src-1',
            name: 'Kho Hà Nội',
            slug: 'kho-ha-noi',
            score: 0.99,
          },
        ],
        createdAt: '2026-10-22T08:05:00.000Z',
      };

      useChatStore.getState().appendMessage(msg1);
      useChatStore.getState().appendMessage(msg2);

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(msg1);
      expect(messages[1]).toEqual(msg2);
    });
  });

  describe('patchMessage', () => {
    it('patches target message by id and leaves other messages unchanged', () => {
      const msg1 = createChatMessage({ id: 'msg-1', content: 'Tin nhắn 1' });
      const msg2 = createChatMessage({ id: 'msg-2', content: 'Tin nhắn 2' });
      useChatStore.setState({ messages: [msg1, msg2] });

      useChatStore.getState().patchMessage('msg-2', {
        content: 'Tin nhắn 2 đã được cập nhật',
        error: 'Có lỗi kết nối',
      });

      const messages = useChatStore.getState().messages;
      expect(messages[0]).toEqual(msg1);
      expect(messages[1]).toEqual({
        ...msg2,
        content: 'Tin nhắn 2 đã được cập nhật',
        error: 'Có lỗi kết nối',
      });
    });

    it('does not alter any messages when target id is not found', () => {
      const msg1 = createChatMessage({ id: 'msg-1', content: 'Tin nhắn gốc' });
      useChatStore.setState({ messages: [msg1] });

      useChatStore.getState().patchMessage('msg-not-found', {
        content: 'Không tìm thấy ID',
      });

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(msg1);
    });
  });

  describe('reset', () => {
    it('resets threadId to null and clears messages while retaining ownerId and open state', () => {
      useChatStore.setState({
        ownerId: 'admin-persisted',
        threadId: 'thread-active',
        messages: [createChatMessage()],
        open: true,
      });

      useChatStore.getState().reset();

      const state = useChatStore.getState();
      expect(state.threadId).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.ownerId).toBe('admin-persisted');
      expect(state.open).toBe(true);
    });
  });

  describe('React hook usage (renderHook)', () => {
    it('reacts to state changes and dispatches actions correctly via act', () => {
      const { result } = renderHook(() => useChatStore());

      expect(result.current.open).toBe(false);
      expect(result.current.messages).toEqual([]);

      act(() => {
        result.current.setOpen(true);
      });
      expect(result.current.open).toBe(true);

      const msg = createChatMessage({
        id: 'msg-hook',
        content: 'Tin nhắn hook kiểm thử',
      });
      act(() => {
        result.current.appendMessage(msg);
      });
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Tin nhắn hook kiểm thử');

      act(() => {
        result.current.patchMessage('msg-hook', {
          content: 'Tin nhắn hook cập nhật',
        });
      });
      expect(result.current.messages[0].content).toBe('Tin nhắn hook cập nhật');

      act(() => {
        result.current.reset();
      });
      expect(result.current.messages).toEqual([]);
      expect(result.current.open).toBe(true);
    });
  });

  describe('persist configuration', () => {
    it('uses correct storage name "thai-spray-admin-chat"', () => {
      const name = useChatStore.persist.getOptions().name;
      expect(name).toBe('thai-spray-admin-chat');
    });

    describe('partialize', () => {
      it('persists ownerId, threadId, and last 30 messages while omitting open state', () => {
        const partialize = useChatStore.persist.getOptions().partialize;
        expect(partialize).toBeDefined();

        const messages = Array.from({ length: 35 }, (_, index) =>
          createChatMessage({
            id: `msg-${index}`,
            content: `Tin nhắn số ${index}`,
          }),
        );

        const fullState: ChatState = {
          ...useChatStore.getState(),
          ownerId: 'admin-manager',
          threadId: 'thread-partialize',
          open: true,
          messages,
        };

        const persisted = partialize!(fullState) as ChatPersistedState;
        expect(persisted).toEqual({
          ownerId: 'admin-manager',
          threadId: 'thread-partialize',
          messages: messages.slice(-30),
        });
        expect(persisted.messages).toHaveLength(30);
        expect(persisted.messages[0].id).toBe('msg-5');
        expect(persisted.messages[29].id).toBe('msg-34');
        expect((persisted as Partial<ChatState>).open).toBeUndefined();
      });

      it('preserves all messages when there are 30 or fewer messages', () => {
        const partialize = useChatStore.persist.getOptions().partialize;
        const messages = Array.from({ length: 15 }, (_, index) =>
          createChatMessage({
            id: `msg-${index}`,
            content: `Tin nhắn ngắn ${index}`,
          }),
        );

        const fullState: ChatState = {
          ...useChatStore.getState(),
          ownerId: 'admin-manager',
          threadId: 'thread-short',
          open: false,
          messages,
        };

        const persisted = partialize!(fullState) as ChatPersistedState;
        expect(persisted.messages).toHaveLength(15);
      });
    });
  });

  describe('safeLocalStorage adapter and getLocalStorage branches', () => {
    it('reads, writes, and removes items normally through persist storage', async () => {
      const storage = useChatStore.persist.getOptions().storage!;

      const mockData = {
        state: {
          ownerId: 'admin-storage-test',
          threadId: 'thread-storage-test',
          messages: [],
        },
        version: 0,
      };

      await storage.setItem('thai-spray-admin-chat', mockData);
      const retrieved = (await storage.getItem('thai-spray-admin-chat')) as
        typeof mockData | null;
      expect(retrieved?.state.ownerId).toBe('admin-storage-test');
      expect(retrieved?.state.threadId).toBe('thread-storage-test');

      await storage.removeItem('thai-spray-admin-chat');
      const afterRemoval = await storage.getItem('thai-spray-admin-chat');
      expect(afterRemoval).toBeNull();
    });

    it('returns null when storage item does not exist', async () => {
      const storage = useChatStore.persist.getOptions().storage!;
      const result = await storage.getItem('non-existent-key');
      expect(result).toBeNull();
    });

    it('handles exceptions in getItem and safely returns null', async () => {
      const storage = useChatStore.persist.getOptions().storage!;
      vi.spyOn(window.localStorage, 'getItem').mockImplementationOnce(() => {
        throw new Error('getItem read failed');
      });

      const result = await storage.getItem('any-key');
      expect(result).toBeNull();
    });

    it('handles exceptions in setItem and catches them silently', async () => {
      const storage = useChatStore.persist.getOptions().storage!;
      vi.spyOn(window.localStorage, 'setItem').mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        storage.setItem('any-key', {
          state: { ownerId: 'u', threadId: null, messages: [] },
          version: 0,
        });
      }).not.toThrow();
    });

    it('handles exceptions in removeItem and catches them silently', async () => {
      const storage = useChatStore.persist.getOptions().storage!;
      vi.spyOn(window.localStorage, 'removeItem').mockImplementationOnce(() => {
        throw new Error('removeItem failed');
      });

      expect(() => {
        storage.removeItem('any-key');
      }).not.toThrow();
    });

    it('catches exceptions when accessing window.localStorage (e.g. security error) and falls back to null', async () => {
      const storage = useChatStore.persist.getOptions().storage!;

      const originalDesc = Object.getOwnPropertyDescriptor(
        window,
        'localStorage',
      );

      try {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new Error('SecurityError: Access denied');
          },
          configurable: true,
        });

        const item = await storage.getItem('test-security');
        expect(item).toBeNull();

        expect(() => {
          storage.setItem('test-security', {
            state: { ownerId: null, threadId: null, messages: [] },
            version: 0,
          });
        }).not.toThrow();

        expect(() => {
          storage.removeItem('test-security');
        }).not.toThrow();
      } finally {
        if (originalDesc) {
          Object.defineProperty(window, 'localStorage', originalDesc);
        }
      }
    });

    it('handles null storage when window.localStorage is undefined', async () => {
      const storage = useChatStore.persist.getOptions().storage!;

      const originalDesc = Object.getOwnPropertyDescriptor(
        window,
        'localStorage',
      );

      try {
        Object.defineProperty(window, 'localStorage', {
          value: undefined,
          configurable: true,
          writable: true,
        });

        const item = await storage.getItem('test-undefined');
        expect(item).toBeNull();

        expect(() => {
          storage.setItem('test-undefined', {
            state: { ownerId: null, threadId: null, messages: [] },
            version: 0,
          });
        }).not.toThrow();

        expect(() => {
          storage.removeItem('test-undefined');
        }).not.toThrow();
      } finally {
        if (originalDesc) {
          Object.defineProperty(window, 'localStorage', originalDesc);
        }
      }
    });

    it('falls back to global localStorage when window is undefined', async () => {
      const storage = useChatStore.persist.getOptions().storage!;

      const originalWindow = (globalThis as Record<string, unknown>).window;
      try {
        (globalThis as Record<string, unknown>).window = undefined;

        // In this environment, typeof window === 'undefined'
        // getLocalStorage falls back to global localStorage
        const item = await storage.getItem('test-no-window');
        expect(item).toBeNull();
      } finally {
        (globalThis as Record<string, unknown>).window = originalWindow;
      }
    });
  });
});
