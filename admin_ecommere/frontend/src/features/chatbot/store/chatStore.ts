import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { ChatMessage } from '../types';

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

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      threadId: null,
      messages: [],
      open: false,

      claimOwner: (ownerId: string | null) => {
        if (get().ownerId === ownerId) {
          return;
        }
        set({ ownerId, threadId: null, messages: [] });
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
      name: 'thai-spray-admin-chat',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state): ChatPersistedState => ({
        ownerId: state.ownerId,
        threadId: state.threadId,
        messages: state.messages.slice(-30),
      }),
    },
  ),
);

export const chatStore = useChatStore;
