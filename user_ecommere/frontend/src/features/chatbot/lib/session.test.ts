import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('session lib (getChatSessionId, formatChatOwnerKey)', () => {
  const CHAT_SESSION_KEY = 'thai-spray-chat-session';
  let localStore: Record<string, string> = {};

  const getItemMock = vi.fn(
    (key: string): string | null => localStore[key] ?? null,
  );
  const setItemMock = vi.fn((key: string, value: string) => {
    localStore[key] = String(value);
  });
  const removeItemMock = vi.fn((key: string) => {
    delete localStore[key];
  });
  const clearMock = vi.fn(() => {
    localStore = {};
  });
  const keyMock = vi.fn(
    (index: number) => Object.keys(localStore)[index] ?? null,
  );

  const localStorageMock: Storage = {
    getItem: getItemMock,
    setItem: setItemMock,
    removeItem: removeItemMock,
    clear: clearMock,
    key: keyMock,
    get length() {
      return Object.keys(localStore).length;
    },
  };

  const originalLocalStorage = globalThis.localStorage;
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    vi.clearAllMocks();
    localStore = {};
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    if (originalCrypto) {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    }
  });

  describe('getChatSessionId', () => {
    it('returns trimmed existing session ID from localStorage when available', async () => {
      vi.resetModules();
      localStore[CHAT_SESSION_KEY] = '  existing-session-uuid  ';
      const { getChatSessionId } = await import('./session');

      const sessionId = getChatSessionId();

      expect(sessionId).toBe('existing-session-uuid');
      expect(getItemMock).toHaveBeenCalledWith(CHAT_SESSION_KEY);
      expect(setItemMock).not.toHaveBeenCalled();
    });

    it('generates a new session ID and saves to localStorage when key does not exist', async () => {
      vi.resetModules();
      const { getChatSessionId } = await import('./session');

      const sessionId = getChatSessionId();

      expect(sessionId).toBeTruthy();
      expect(getItemMock).toHaveBeenCalledWith(CHAT_SESSION_KEY);
      expect(setItemMock).toHaveBeenCalledWith(CHAT_SESSION_KEY, sessionId);
      expect(localStore[CHAT_SESSION_KEY]).toBe(sessionId);
    });

    it('generates a new session ID when stored value is empty string or only whitespace', async () => {
      vi.resetModules();
      localStore[CHAT_SESSION_KEY] = '    ';
      const { getChatSessionId } = await import('./session');

      const sessionId = getChatSessionId();

      expect(sessionId).toBeTruthy();
      expect(sessionId).not.toBe('');
      expect(sessionId).not.toBe('    ');
      expect(setItemMock).toHaveBeenCalledWith(CHAT_SESSION_KEY, sessionId);
    });

    it('recovers when storage.getItem throws an exception', async () => {
      vi.resetModules();
      getItemMock.mockImplementationOnce(() => {
        throw new Error('Storage read denied');
      });
      const { getChatSessionId } = await import('./session');

      const sessionId = getChatSessionId();

      expect(sessionId).toBeTruthy();
      expect(setItemMock).toHaveBeenCalledWith(CHAT_SESSION_KEY, sessionId);
    });

    it('recovers and returns in-memory ID when storage.setItem throws (e.g. quota exceeded)', async () => {
      vi.resetModules();
      setItemMock.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });
      const { getChatSessionId } = await import('./session');

      const sessionId = getChatSessionId();

      expect(sessionId).toBeTruthy();
    });

    it('falls back to in-memory session ID when localStorage is null', async () => {
      vi.resetModules();
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { getChatSessionId } = await import('./session');

      const id1 = getChatSessionId();
      expect(id1).toBeTruthy();

      // Subsequent call reuses the cached inMemorySessionId
      const id2 = getChatSessionId();
      expect(id2).toBe(id1);
    });

    it('uses global localStorage when window.localStorage is falsy', async () => {
      vi.resetModules();
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, 'localStorage', {
        value: localStorageMock,
        writable: true,
        configurable: true,
      });
      localStore[CHAT_SESSION_KEY] = 'global-storage-session';

      const { getChatSessionId } = await import('./session');

      const sessionId = getChatSessionId();
      expect(sessionId).toBe('global-storage-session');
    });

    it('handles getSafeLocalStorage exception gracefully', async () => {
      vi.resetModules();
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('SecurityError: Access denied');
        },
        configurable: true,
      });

      const { getChatSessionId } = await import('./session');

      const sessionId = getChatSessionId();
      expect(sessionId).toBeTruthy();
    });

    it('falls back to regex-based UUID generator when crypto.randomUUID throws', async () => {
      vi.resetModules();
      const cryptoMock = {
        randomUUID: vi.fn(() => {
          throw new Error('randomUUID unsupported');
        }),
      };
      Object.defineProperty(globalThis, 'crypto', {
        value: cryptoMock,
        writable: true,
        configurable: true,
      });

      const { getChatSessionId } = await import('./session');

      const sessionId = getChatSessionId();
      expect(sessionId).toBeTruthy();
      // Verifies fallback UUID v4 pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('falls back to regex-based UUID generator when crypto is undefined or randomUUID is missing', async () => {
      vi.resetModules();
      Object.defineProperty(globalThis, 'crypto', {
        value: {},
        writable: true,
        configurable: true,
      });

      const { getChatSessionId } = await import('./session');

      const sessionId = getChatSessionId();
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('formatChatOwnerKey', () => {
    it('returns trimmed key directly if it already starts with "user:"', async () => {
      const { formatChatOwnerKey } = await import('./session');

      expect(formatChatOwnerKey('user:12345')).toBe('user:12345');
      expect(formatChatOwnerKey('  user:customer-abc  ')).toBe(
        'user:customer-abc',
      );
    });

    it('returns trimmed key directly if it already starts with "guest:"', async () => {
      const { formatChatOwnerKey } = await import('./session');

      expect(formatChatOwnerKey('guest:session-999')).toBe('guest:session-999');
      expect(formatChatOwnerKey('  guest:temp-session  ')).toBe(
        'guest:temp-session',
      );
    });

    it('prepends "user:" when userId is provided without user: or guest: prefix', async () => {
      const { formatChatOwnerKey } = await import('./session');

      expect(formatChatOwnerKey('user-id-5678')).toBe('user:user-id-5678');
      expect(formatChatOwnerKey('  customer-99  ')).toBe('user:customer-99');
    });

    it('returns "guest:<sessionId>" when userId is undefined', async () => {
      vi.resetModules();
      localStore[CHAT_SESSION_KEY] = 'guest-session-uuid';
      const { formatChatOwnerKey } = await import('./session');

      const ownerKey = formatChatOwnerKey(undefined);
      expect(ownerKey).toBe('guest:guest-session-uuid');
    });

    it('returns "guest:<sessionId>" when userId is null', async () => {
      vi.resetModules();
      localStore[CHAT_SESSION_KEY] = 'guest-session-uuid-2';
      const { formatChatOwnerKey } = await import('./session');

      const ownerKey = formatChatOwnerKey(null);
      expect(ownerKey).toBe('guest:guest-session-uuid-2');
    });

    it('returns "guest:<sessionId>" when userId is empty string or only whitespace', async () => {
      vi.resetModules();
      localStore[CHAT_SESSION_KEY] = 'guest-session-uuid-3';
      const { formatChatOwnerKey } = await import('./session');

      expect(formatChatOwnerKey('')).toBe('guest:guest-session-uuid-3');
      expect(formatChatOwnerKey('   ')).toBe('guest:guest-session-uuid-3');
    });

    it('returns "guest:<sessionId>" when userId is not a string', async () => {
      vi.resetModules();
      localStore[CHAT_SESSION_KEY] = 'guest-session-uuid-4';
      const { formatChatOwnerKey } = await import('./session');

      expect(formatChatOwnerKey(12345 as unknown as string)).toBe(
        'guest:guest-session-uuid-4',
      );
    });
  });
});
