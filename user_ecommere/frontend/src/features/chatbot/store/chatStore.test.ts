import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useChatStore,
  chatStore,
  flushChatPersist,
  getChatSessionId,
  formatChatOwnerKey,
  type ChatState,
  type ChatPersistedState,
} from './chatStore';
import type { ChatMessage } from '../types';

let mockStore: Record<string, string> = {};

const mockLocalStorage = {
  getItem: vi.fn((key: string): string | null => mockStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStore[key] = String(value);
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStore[key];
  }),
  clear: vi.fn(() => {
    mockStore = {};
  }),
  key: vi.fn(
    (index: number): string | null => Object.keys(mockStore)[index] ?? null,
  ),
  get length() {
    return Object.keys(mockStore).length;
  },
};

const setupLocalStorageMock = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
  vi.stubGlobal('localStorage', mockLocalStorage);
};

setupLocalStorageMock();

const createChatMessage = (overrides?: Partial<ChatMessage>): ChatMessage => ({
  id: 'msg-1',
  role: 'user',
  content: 'Xin chào, tôi cần tư vấn nước hoa Charme Iris 50ml',
  tools: [],
  createdAt: '2026-10-21T10:00:00.000Z',
  ...overrides,
});

const CHAT_SESSION_KEY = 'thai-spray-chat-session';
const TEST_GUEST_SESSION_ID = 'test-guest-session-1234';

describe('useChatStore', () => {
  beforeEach(() => {
    flushChatPersist();
    mockStore = {
      [CHAT_SESSION_KEY]: TEST_GUEST_SESSION_ID,
    };
    vi.clearAllMocks();
    useChatStore.setState({
      ownerId: `guest:${TEST_GUEST_SESSION_ID}`,
      threadId: null,
      messages: [],
      open: false,
    });
    flushChatPersist();
    delete mockStore['thai-spray-chat'];
    vi.clearAllMocks();
  });

  afterEach(() => {
    setupLocalStorageMock();
  });

  describe('initial state and export aliases', () => {
    it('initializes with default state values', () => {
      const state = useChatStore.getState();
      expect(state.ownerId).toBe(`guest:${TEST_GUEST_SESSION_ID}`);
      expect(state.threadId).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.open).toBe(false);
    });

    it('exports chatStore as an alias for useChatStore', () => {
      expect(chatStore).toBe(useChatStore);
    });

    it('re-exports getChatSessionId and formatChatOwnerKey from session lib', () => {
      expect(typeof getChatSessionId).toBe('function');
      expect(typeof formatChatOwnerKey).toBe('function');
      expect(getChatSessionId()).toBe(TEST_GUEST_SESSION_ID);
      expect(formatChatOwnerKey('user-test')).toBe('user:user-test');
    });
  });

  describe('claimOwner', () => {
    it('does nothing when nextOwnerKey matches current ownerId (no-op early return)', () => {
      const currentGuestOwner = useChatStore.getState().ownerId;
      expect(currentGuestOwner).toBe(`guest:${TEST_GUEST_SESSION_ID}`);

      useChatStore.getState().setThreadId('thread-guest');
      useChatStore
        .getState()
        .appendMessage(createChatMessage({ id: 'msg-g1' }));

      useChatStore.getState().claimOwner(null);

      const stateAfterGuestNoop = useChatStore.getState();
      expect(stateAfterGuestNoop.ownerId).toBe(currentGuestOwner);
      expect(stateAfterGuestNoop.threadId).toBe('thread-guest');
      expect(stateAfterGuestNoop.messages).toHaveLength(1);
      expect(stateAfterGuestNoop.messages[0].id).toBe('msg-g1');

      useChatStore.getState().claimOwner('cust-100');
      useChatStore.getState().setThreadId('thread-user');
      useChatStore
        .getState()
        .appendMessage(createChatMessage({ id: 'msg-u1' }));

      useChatStore.getState().claimOwner('cust-100');

      const stateAfterUserNoop = useChatStore.getState();
      expect(stateAfterUserNoop.ownerId).toBe('user:cust-100');
      expect(stateAfterUserNoop.threadId).toBe('thread-user');
      expect(stateAfterUserNoop.messages).toHaveLength(1);
      expect(stateAfterUserNoop.messages[0].id).toBe('msg-u1');

      useChatStore.getState().claimOwner('user:cust-100');
      expect(useChatStore.getState().threadId).toBe('thread-user');
      expect(useChatStore.getState().messages).toHaveLength(1);
    });

    it('updates ownerId to user key, resets threadId to null, and empties messages when claiming new user', () => {
      useChatStore.getState().setThreadId('th-old');
      useChatStore
        .getState()
        .appendMessage(createChatMessage({ id: 'msg-old' }));

      useChatStore.getState().claimOwner('usr-555');

      const state = useChatStore.getState();
      expect(state.ownerId).toBe('user:usr-555');
      expect(state.threadId).toBeNull();
      expect(state.messages).toEqual([]);
    });

    it('handles prefixed user key without adding duplicate user: prefix', () => {
      useChatStore.getState().claimOwner('user:admin-999');

      const state = useChatStore.getState();
      expect(state.ownerId).toBe('user:admin-999');
    });

    it('handles prefixed guest key without adding user: prefix', () => {
      useChatStore.getState().claimOwner('guest:session-custom');

      const state = useChatStore.getState();
      expect(state.ownerId).toBe('guest:session-custom');
    });

    it('switches back to current guest key when passed null or whitespace', () => {
      useChatStore.getState().claimOwner('usr-888');
      expect(useChatStore.getState().ownerId).toBe('user:usr-888');

      useChatStore.getState().claimOwner(null);
      expect(useChatStore.getState().ownerId).toMatch(/^guest:/);
      expect(useChatStore.getState().threadId).toBeNull();
      expect(useChatStore.getState().messages).toEqual([]);

      useChatStore.getState().claimOwner('usr-999');
      useChatStore.getState().claimOwner('   ');
      expect(useChatStore.getState().ownerId).toMatch(/^guest:/);
    });

    it('trims leading and trailing whitespace from user id', () => {
      useChatStore.getState().claimOwner('  cust-trimmed  ');

      expect(useChatStore.getState().ownerId).toBe('user:cust-trimmed');
    });
  });

  describe('setThreadId', () => {
    it('sets threadId to a string identifier', () => {
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
    it('appends messages sequentially and preserves all message fields', () => {
      const userMessage = createChatMessage({
        id: 'msg-u',
        role: 'user',
        content: 'Tôi muốn tìm nước hoa hương gỗ ấm',
      });
      const assistantMessage: ChatMessage = {
        id: 'msg-a',
        role: 'assistant',
        content:
          'Charme Iris và Charme Guility là hai lựa chọn hương gỗ ấm rất được ưa chuộng.',
        tools: [
          {
            id: 'tool-1',
            name: 'search_perfume',
            summary: 'Tìm nước hoa hương gỗ',
            status: 'ok',
            resultSummary: 'Đã tìm thấy 2 sản phẩm',
          },
        ],
        confirm: {
          calls: [
            {
              id: 'confirm-1',
              name: 'add_to_cart',
              summary: 'Thêm Charme Iris vào giỏ hàng',
              risk: 'WRITE',
            },
          ],
          decided: false,
        },
        sources: [
          {
            id: 'src-1',
            name: 'Charme Iris 50ml',
            slug: 'charme-iris-50ml',
            score: 0.98,
          },
        ],
        createdAt: '2026-10-21T10:01:00.000Z',
      };

      useChatStore.getState().appendMessage(userMessage);
      useChatStore.getState().appendMessage(assistantMessage);

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(userMessage);
      expect(messages[1]).toEqual(assistantMessage);
    });
  });

  describe('patchMessage', () => {
    it('patches target message when id matches and leaves other messages unchanged', () => {
      const msg1 = createChatMessage({ id: 'msg-1', content: 'Tin nhắn 1' });
      const msg2 = createChatMessage({ id: 'msg-2', content: 'Tin nhắn 2' });
      useChatStore.getState().appendMessage(msg1);
      useChatStore.getState().appendMessage(msg2);

      useChatStore.getState().patchMessage('msg-2', {
        content: 'Tin nhắn 2 đã cập nhật',
        error: 'Có lỗi xảy ra khi gọi API',
      });

      const messages = useChatStore.getState().messages;
      expect(messages[0]).toEqual(msg1);
      expect(messages[1]).toEqual({
        ...msg2,
        content: 'Tin nhắn 2 đã cập nhật',
        error: 'Có lỗi xảy ra khi gọi API',
      });
    });

    it('does not alter any messages when target id is not found', () => {
      const msg1 = createChatMessage({ id: 'msg-1', content: 'Tin nhắn gốc' });
      useChatStore.getState().appendMessage(msg1);

      useChatStore.getState().patchMessage('msg-non-existent', {
        content: 'Không tồn tại',
      });

      const messages = useChatStore.getState().messages;
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(msg1);
    });
  });

  describe('reset', () => {
    it('resets threadId to null and empties messages without resetting ownerId or open state', () => {
      useChatStore.getState().claimOwner('usr-keep');
      useChatStore.getState().setOpen(true);
      useChatStore.getState().setThreadId('thread-keep');
      useChatStore.getState().appendMessage(createChatMessage());

      useChatStore.getState().reset();

      const state = useChatStore.getState();
      expect(state.threadId).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.ownerId).toBe('user:usr-keep');
      expect(state.open).toBe(true);
    });
  });

  describe('React hook usage (renderHook)', () => {
    it('subscribes components to chat store updates and dispatches actions', () => {
      const { result } = renderHook(() => useChatStore());

      expect(result.current.open).toBe(false);
      expect(result.current.messages).toEqual([]);

      act(() => {
        result.current.setOpen(true);
      });
      expect(result.current.open).toBe(true);

      const msg = createChatMessage({
        id: 'msg-hook',
        content: 'Tin nhắn hook',
      });
      act(() => {
        result.current.appendMessage(msg);
      });
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Tin nhắn hook');

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
    describe('partialize', () => {
      it('persists ownerId, threadId, and slices only the last 30 messages (omitting open state)', () => {
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
          ownerId: 'user:member-10',
          threadId: 'th-persist',
          open: true,
          messages,
        };

        const persisted = partialize!(fullState) as ChatPersistedState;
        expect(persisted).toEqual({
          ownerId: 'user:member-10',
          threadId: 'th-persist',
          messages: messages.slice(-30),
        });
        expect(persisted.messages).toHaveLength(30);
        expect(persisted.messages[0].id).toBe('msg-5');
        expect(persisted.messages[29].id).toBe('msg-34');
        expect((persisted as Partial<ChatState>).open).toBeUndefined();
      });

      it('preserves all messages when there are 30 or fewer messages', () => {
        const partialize = useChatStore.persist.getOptions().partialize;
        const messages = Array.from({ length: 10 }, (_, index) =>
          createChatMessage({
            id: `msg-${index}`,
            content: `Tin nhắn ngắn ${index}`,
          }),
        );

        const fullState: ChatState = {
          ...useChatStore.getState(),
          ownerId: 'user:member-10',
          threadId: 'th-short',
          open: false,
          messages,
        };

        const persisted = partialize!(fullState) as ChatPersistedState;
        expect(persisted.messages).toHaveLength(10);
      });
    });

    describe('onRehydrateStorage', () => {
      const getPostRehydrate = () => {
        const onRehydrate =
          useChatStore.persist.getOptions().onRehydrateStorage;
        expect(onRehydrate).toBeDefined();
        return onRehydrate!(useChatStore.getState());
      };

      it('returns early without error when rehydrated state is null or undefined', () => {
        const postRehydrate = getPostRehydrate();
        expect(() => postRehydrate?.(undefined)).not.toThrow();
      });

      it('resets ownerId, threadId, and messages when rehydrated state has no ownerId', () => {
        const postRehydrate = getPostRehydrate();
        const stateToRehydrate: ChatState = {
          ...useChatStore.getState(),
          ownerId: null,
          threadId: 'stale-thread',
          messages: [createChatMessage()],
          open: false,
        };

        postRehydrate?.(stateToRehydrate);

        const currentGuestKey = `guest:${getChatSessionId()}`;
        expect(stateToRehydrate.ownerId).toBe(currentGuestKey);
        expect(stateToRehydrate.threadId).toBeNull();
        expect(stateToRehydrate.messages).toEqual([]);
      });

      it('resets state when ownerId is a guest key from a different guest session', () => {
        const postRehydrate = getPostRehydrate();
        const stateToRehydrate: ChatState = {
          ...useChatStore.getState(),
          ownerId: 'guest:foreign-session-uuid-1234',
          threadId: 'foreign-thread',
          messages: [createChatMessage()],
          open: false,
        };

        postRehydrate?.(stateToRehydrate);

        const currentGuestKey = `guest:${getChatSessionId()}`;
        expect(stateToRehydrate.ownerId).toBe(currentGuestKey);
        expect(stateToRehydrate.threadId).toBeNull();
        expect(stateToRehydrate.messages).toEqual([]);
      });

      it('preserves state when ownerId matches current guest session', () => {
        const postRehydrate = getPostRehydrate();
        const currentGuestKey = `guest:${getChatSessionId()}`;
        const existingMessage = createChatMessage({ id: 'msg-current-guest' });
        const stateToRehydrate: ChatState = {
          ...useChatStore.getState(),
          ownerId: currentGuestKey,
          threadId: 'active-thread',
          messages: [existingMessage],
          open: true,
        };

        postRehydrate?.(stateToRehydrate);

        expect(stateToRehydrate.ownerId).toBe(currentGuestKey);
        expect(stateToRehydrate.threadId).toBe('active-thread');
        expect(stateToRehydrate.messages).toEqual([existingMessage]);
      });

      it('preserves state when ownerId belongs to an authenticated user (user:*)', () => {
        const postRehydrate = getPostRehydrate();
        const existingMessage = createChatMessage({ id: 'msg-user' });
        const stateToRehydrate: ChatState = {
          ...useChatStore.getState(),
          ownerId: 'user:authenticated-user-77',
          threadId: 'active-user-thread',
          messages: [existingMessage],
          open: false,
        };

        postRehydrate?.(stateToRehydrate);

        expect(stateToRehydrate.ownerId).toBe('user:authenticated-user-77');
        expect(stateToRehydrate.threadId).toBe('active-user-thread');
        expect(stateToRehydrate.messages).toEqual([existingMessage]);
      });
    });
  });

  describe('throttledLocalStorage and flushChatPersist', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('writes immediately when elapsed time is >= PERSIST_THROTTLE_MS (500ms)', () => {
      vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
      const storage = useChatStore.persist.getOptions().storage!;

      storage.setItem('thai-spray-chat', {
        state: { ownerId: 'user:1', threadId: 'th-1', messages: [] },
        version: 0,
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'thai-spray-chat',
        expect.any(String),
      );
    });

    it('throttles subsequent writes within 500ms and flushes when the timer completes', () => {
      vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
      const storage = useChatStore.persist.getOptions().storage!;

      storage.setItem('thai-spray-chat', {
        state: { ownerId: 'user:1', threadId: 'th-1', messages: [] },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      vi.advanceTimersByTime(100);

      storage.setItem('thai-spray-chat', {
        state: { ownerId: 'user:2', threadId: 'th-2', messages: [] },
        version: 0,
      });
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      vi.advanceTimersByTime(399);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'thai-spray-chat',
        expect.stringContaining('"ownerId":"user:2"'),
      );
    });

    it('coalesces multiple writes within the throttle window without registering duplicate timers', () => {
      vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
      const storage = useChatStore.persist.getOptions().storage!;

      storage.setItem('thai-spray-chat', {
        state: { ownerId: 'user:first', threadId: 'th-first', messages: [] },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      vi.advanceTimersByTime(50);
      storage.setItem('thai-spray-chat', {
        state: { ownerId: 'user:second', threadId: 'th-second', messages: [] },
        version: 0,
      });

      vi.advanceTimersByTime(50);
      storage.setItem('thai-spray-chat', {
        state: { ownerId: 'user:third', threadId: 'th-third', messages: [] },
        version: 0,
      });
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      vi.advanceTimersByTime(400);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'thai-spray-chat',
        expect.stringContaining('"ownerId":"user:third"'),
      );
    });

    it('flushes immediately when elapsed time is negative due to system clock shift backwards', () => {
      vi.setSystemTime(new Date('2026-10-21T12:00:10.000Z'));
      const storage = useChatStore.persist.getOptions().storage!;

      storage.setItem('thai-spray-chat', {
        state: { ownerId: 'user:first', threadId: 'th-1', messages: [] },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));

      storage.setItem('thai-spray-chat', {
        state: {
          ownerId: 'user:clock-backward',
          threadId: 'th-2',
          messages: [],
        },
        version: 0,
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'thai-spray-chat',
        expect.stringContaining('"ownerId":"user:clock-backward"'),
      );
    });

    it('getItem flushes pending writes before reading data when the key has a pending write', async () => {
      vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
      const storage = useChatStore.persist.getOptions().storage!;

      storage.setItem('key-first', {
        state: { ownerId: 'user:1', threadId: 'th-1', messages: [] },
        version: 0,
      });
      vi.advanceTimersByTime(100);

      storage.setItem('pending-chat-key', {
        state: {
          ownerId: 'user:pending',
          threadId: 'th-pending',
          messages: [],
        },
        version: 0,
      });
      expect(mockStore['pending-chat-key']).toBeUndefined();

      const item = (await storage.getItem('pending-chat-key')) as {
        state: { ownerId: string; threadId: string };
      } | null;

      expect(mockStore['pending-chat-key']).toBeDefined();
      expect(item?.state.ownerId).toBe('user:pending');
    });

    it('getItem directly returns data from safeLocalStorage when key is not in pending writes', async () => {
      mockStore['saved-key'] = JSON.stringify({
        state: { ownerId: 'user:saved', threadId: 'th-saved', messages: [] },
        version: 0,
      });
      const storage = useChatStore.persist.getOptions().storage!;

      const item = (await storage.getItem('saved-key')) as {
        state: { ownerId: string; threadId: string };
      } | null;

      expect(item?.state.ownerId).toBe('user:saved');
    });

    it('removeItem cancels throttleTimer when pendingWrites becomes empty', () => {
      vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
      const storage = useChatStore.persist.getOptions().storage!;

      storage.setItem('key-base', {
        state: { ownerId: 'user:1', threadId: 'th-1', messages: [] },
        version: 0,
      });
      vi.advanceTimersByTime(100);

      storage.setItem('only-pending-key', {
        state: { ownerId: 'user:only', threadId: 'th-only', messages: [] },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      storage.removeItem('only-pending-key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'only-pending-key',
      );

      vi.advanceTimersByTime(1000);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('removeItem does not cancel throttleTimer when other keys remain in pendingWrites', () => {
      vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
      const storage = useChatStore.persist.getOptions().storage!;

      storage.setItem('key-base', {
        state: { ownerId: 'user:1', threadId: 'th-1', messages: [] },
        version: 0,
      });
      vi.advanceTimersByTime(100);

      storage.setItem('key-A', {
        state: { ownerId: 'user:A', threadId: 'th-A', messages: [] },
        version: 0,
      });
      storage.setItem('key-B', {
        state: { ownerId: 'user:B', threadId: 'th-B', messages: [] },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      storage.removeItem('key-A');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('key-A');

      vi.advanceTimersByTime(500);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'key-B',
        expect.stringContaining('"ownerId":"user:B"'),
      );
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        'key-A',
        expect.anything(),
      );
    });

    it('removeItem safely operates when throttleTimer is null', () => {
      flushChatPersist();
      const storage = useChatStore.persist.getOptions().storage!;

      storage.removeItem('idle-key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('idle-key');
    });

    it('flushChatPersist returns early when pendingWrites is empty', () => {
      flushChatPersist();
      mockLocalStorage.setItem.mockClear();

      flushChatPersist();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('flushChatPersist clears active throttleTimer and persists all queued writes', () => {
      vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
      const storage = useChatStore.persist.getOptions().storage!;

      storage.setItem('key-base', {
        state: { ownerId: 'user:1', threadId: 'th-1', messages: [] },
        version: 0,
      });
      vi.advanceTimersByTime(100);

      storage.setItem('key-manual-flush', {
        state: { ownerId: 'user:manual', threadId: 'th-manual', messages: [] },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      flushChatPersist();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'key-manual-flush',
        expect.stringContaining('"ownerId":"user:manual"'),
      );

      vi.advanceTimersByTime(1000);
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('global event listeners', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-21T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.clearAllTimers();
      vi.useRealTimers();
    });

    it('flushes pending writes when window pagehide event fires', () => {
      const storage = useChatStore.persist.getOptions().storage!;
      storage.setItem('key-base', {
        state: { ownerId: 'u', threadId: null, messages: [] },
        version: 0,
      });
      vi.advanceTimersByTime(100);

      storage.setItem('key-pagehide', {
        state: {
          ownerId: 'user:pagehide',
          threadId: 'th-pagehide',
          messages: [],
        },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      window.dispatchEvent(new Event('pagehide'));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'key-pagehide',
        expect.stringContaining('"ownerId":"user:pagehide"'),
      );
    });

    it('flushes pending writes when window beforeunload event fires', () => {
      const storage = useChatStore.persist.getOptions().storage!;
      storage.setItem('key-base', {
        state: { ownerId: 'u', threadId: null, messages: [] },
        version: 0,
      });
      vi.advanceTimersByTime(100);

      storage.setItem('key-unload', {
        state: { ownerId: 'user:unload', threadId: 'th-unload', messages: [] },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      window.dispatchEvent(new Event('beforeunload'));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'key-unload',
        expect.stringContaining('"ownerId":"user:unload"'),
      );
    });

    it('flushes pending writes on visibilitychange event when document.visibilityState is hidden', () => {
      const storage = useChatStore.persist.getOptions().storage!;
      storage.setItem('key-base', {
        state: { ownerId: 'u', threadId: null, messages: [] },
        version: 0,
      });
      vi.advanceTimersByTime(100);

      storage.setItem('key-hidden-state', {
        state: {
          ownerId: 'user:hidden-state',
          threadId: 'th-hidden',
          messages: [],
        },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      Object.defineProperty(document, 'hidden', {
        value: false,
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'key-hidden-state',
        expect.stringContaining('"ownerId":"user:hidden-state"'),
      );

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
    });

    it('flushes pending writes on visibilitychange event when document.hidden is true', () => {
      const storage = useChatStore.persist.getOptions().storage!;
      storage.setItem('key-base', {
        state: { ownerId: 'u', threadId: null, messages: [] },
        version: 0,
      });
      vi.advanceTimersByTime(100);

      storage.setItem('key-hidden-prop', {
        state: {
          ownerId: 'user:hidden-prop',
          threadId: 'th-hidden-prop',
          messages: [],
        },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      Object.defineProperty(document, 'hidden', {
        value: true,
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'key-hidden-prop',
        expect.stringContaining('"ownerId":"user:hidden-prop"'),
      );

      Object.defineProperty(document, 'hidden', {
        value: false,
        configurable: true,
      });
    });

    it('does not flush pending writes on visibilitychange event when document is visible and not hidden', () => {
      const storage = useChatStore.persist.getOptions().storage!;
      storage.setItem('key-base', {
        state: { ownerId: 'u', threadId: null, messages: [] },
        version: 0,
      });
      vi.advanceTimersByTime(100);

      storage.setItem('key-visible', {
        state: {
          ownerId: 'user:visible',
          threadId: 'th-visible',
          messages: [],
        },
        version: 0,
      });
      mockLocalStorage.setItem.mockClear();

      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      Object.defineProperty(document, 'hidden', {
        value: false,
        configurable: true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('safeLocalStorage and getLocalStorage error resilience', () => {
    it('catches and handles exceptions gracefully when storage.getItem throws', async () => {
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('getItem SecurityError: storage disabled');
      });
      const storage = useChatStore.persist.getOptions().storage!;

      const result = await storage.getItem('blocked-key');
      expect(result).toBeNull();
    });

    it('catches and handles exceptions gracefully when storage.setItem throws', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('setItem QuotaExceededError: storage full');
      });
      flushChatPersist();
      const storage = useChatStore.persist.getOptions().storage!;

      expect(() =>
        storage.setItem('fail-set', {
          state: { ownerId: 'user:fail', threadId: null, messages: [] },
          version: 0,
        }),
      ).not.toThrow();
    });

    it('catches and handles exceptions gracefully when storage.removeItem throws', () => {
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('removeItem SecurityError');
      });
      flushChatPersist();
      const storage = useChatStore.persist.getOptions().storage!;

      expect(() => storage.removeItem('fail-remove')).not.toThrow();
    });

    it('catches exception and returns null when accessing window.localStorage throws', async () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Window storage access denied');
        },
        configurable: true,
      });
      flushChatPersist();
      const storage = useChatStore.persist.getOptions().storage!;

      expect(await storage.getItem('denied-key')).toBeNull();
      expect(() =>
        storage.setItem('denied-key', {
          state: { ownerId: 'user:denied', threadId: null, messages: [] },
          version: 0,
        }),
      ).not.toThrow();
      expect(() => storage.removeItem('denied-key')).not.toThrow();
    });

    it('falls back to global localStorage when window.localStorage is undefined', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        value: mockLocalStorage,
        configurable: true,
      });
      mockStore['fallback-item'] = JSON.stringify({
        state: {
          ownerId: 'user:fallback',
          threadId: 'th-fallback',
          messages: [],
        },
        version: 0,
      });
      flushChatPersist();
      const storage = useChatStore.persist.getOptions().storage!;

      const item = (await storage.getItem('fallback-item')) as {
        state: { ownerId: string };
      } | null;
      expect(item?.state.ownerId).toBe('user:fallback');
    });

    it('returns null and does not throw when both window.localStorage and global localStorage are undefined', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        configurable: true,
      });
      flushChatPersist();
      const storage = useChatStore.persist.getOptions().storage!;

      expect(await storage.getItem('no-storage')).toBeNull();
      expect(() =>
        storage.setItem('no-storage', {
          state: { ownerId: 'user:none', threadId: null, messages: [] },
          version: 0,
        }),
      ).not.toThrow();
      expect(() => storage.removeItem('no-storage')).not.toThrow();
    });
  });

  describe('session utilities (getChatSessionId and formatChatOwnerKey)', () => {
    it('generates, persists, and returns consistent session id across repeated calls', () => {
      delete mockStore[CHAT_SESSION_KEY];
      const id1 = getChatSessionId();
      expect(typeof id1).toBe('string');
      expect(id1.trim().length).toBeGreaterThan(0);
      expect(mockStore[CHAT_SESSION_KEY]).toBe(id1);

      const id2 = getChatSessionId();
      expect(id2).toBe(id1);
    });

    it('formats chat owner keys across all supported input formats and falsy values', () => {
      const sessionId = getChatSessionId();
      const expectedGuestKey = `guest:${sessionId}`;

      expect(formatChatOwnerKey(null)).toBe(expectedGuestKey);
      expect(formatChatOwnerKey(undefined)).toBe(expectedGuestKey);
      expect(formatChatOwnerKey('')).toBe(expectedGuestKey);
      expect(formatChatOwnerKey('   ')).toBe(expectedGuestKey);

      expect(formatChatOwnerKey('user-456')).toBe('user:user-456');
      expect(formatChatOwnerKey('user:user-456')).toBe('user:user-456');
      expect(formatChatOwnerKey('guest:guest-999')).toBe('guest:guest-999');
      expect(formatChatOwnerKey('  spaced-customer  ')).toBe(
        'user:spaced-customer',
      );
    });
  });
});
