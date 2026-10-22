import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { ChatMessage } from '../types';
import { getChatSessionId, formatChatOwnerKey } from '../lib/session';

export interface ChatState {
  ownerId: string | null;
  threadId: string | null;
  messages: ChatMessage[];
  open: boolean;
  claimOwner: (ownerId: string | null) => void;
  setThreadId: (id: string | null) => void;
  setOpen: (open: boolean) => void;
  appendMessage: (m: ChatMessage) => void;
  patchMessage: (id: string, patch: Partial<ChatMessage>) => void;
  reset: () => void;
}

export type ChatPersistedState = Pick<
  ChatState,
  'ownerId' | 'threadId' | 'messages'
>;

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Storage adapter that safely catches exceptions (e.g. in private browsing or
 * when cookies/storage access is blocked) and falls back to no persistence.
 */
const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const storage = getLocalStorage();
      return storage ? storage.getItem(name) : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(name, value);
      }
    } catch {
      // Fall back to no persistence
    }
  },
  removeItem: (name: string): void => {
    try {
      const storage = getLocalStorage();
      if (storage) {
        storage.removeItem(name);
      }
    } catch {
      // Fall back to no persistence
    }
  },
};

const PERSIST_THROTTLE_MS = 500;
const pendingWrites = new Map<string, string>();
let throttleTimer: ReturnType<typeof setTimeout> | null = null;
let lastWriteTime = -Infinity;

export function flushChatPersist(): void {
  if (throttleTimer !== null) {
    clearTimeout(throttleTimer);
    throttleTimer = null;
  }
  if (pendingWrites.size === 0) {
    return;
  }
  const entries = Array.from(pendingWrites.entries());
  pendingWrites.clear();
  for (const [key, value] of entries) {
    safeLocalStorage.setItem(key, value);
  }
  lastWriteTime = Date.now();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    flushChatPersist();
  });
  window.addEventListener('beforeunload', () => {
    flushChatPersist();
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' || document.hidden) {
      flushChatPersist();
    }
  });
}

const throttledLocalStorage: StateStorage = {
  getItem: (name: string): string | null | Promise<string | null> => {
    if (pendingWrites.has(name)) {
      flushChatPersist();
    }
    return safeLocalStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    pendingWrites.set(name, value);

    const now = Date.now();
    const elapsed = now - lastWriteTime;

    if (elapsed >= PERSIST_THROTTLE_MS || elapsed < 0) {
      flushChatPersist();
    } else if (throttleTimer === null) {
      const remaining = PERSIST_THROTTLE_MS - elapsed;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        flushChatPersist();
      }, remaining);
    }
  },
  removeItem: (name: string): void => {
    pendingWrites.delete(name);
    if (pendingWrites.size === 0 && throttleTimer !== null) {
      clearTimeout(throttleTimer);
      throttleTimer = null;
    }
    safeLocalStorage.removeItem(name);
  },
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ownerId: formatChatOwnerKey(null),
      threadId: null,
      messages: [],
      open: false,

      claimOwner: (ownerId: string | null) => {
        const nextOwnerKey = formatChatOwnerKey(ownerId);
        if (get().ownerId === nextOwnerKey) {
          return;
        }
        set({ ownerId: nextOwnerKey, threadId: null, messages: [] });
      },

      setThreadId: (id: string | null) => {
        set({ threadId: id });
      },

      setOpen: (open: boolean) => {
        set({ open });
      },

      appendMessage: (m: ChatMessage) => {
        set((state) => ({ messages: [...state.messages, m] }));
      },

      patchMessage: (id: string, patch: Partial<ChatMessage>) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, ...patch } : m,
          ),
        }));
      },

      reset: () => {
        set({ threadId: null, messages: [] });
      },
    }),
    {
      name: 'thai-spray-chat',
      storage: createJSONStorage(() => throttledLocalStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const currentGuestKey = `guest:${getChatSessionId()}`;
        if (
          !state.ownerId ||
          (state.ownerId.startsWith('guest:') &&
            state.ownerId !== currentGuestKey)
        ) {
          state.ownerId = currentGuestKey;
          state.threadId = null;
          state.messages = [];
        }
      },
      partialize: (state): ChatPersistedState => ({
        ownerId: state.ownerId,
        threadId: state.threadId,
        messages: state.messages.slice(-30),
      }),
    },
  ),
);

export const chatStore = useChatStore;
export { getChatSessionId, formatChatOwnerKey } from '../lib/session';
