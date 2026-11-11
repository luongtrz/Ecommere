import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useChatStore } from '../store/chatStore';
import { formatChatOwnerKey } from '../lib/session';
import type { ChatMessage } from '../types';

/**
 * Synchronizes conversation ownership with the signed-in user or guest session.
 * Resets the thread and claims ownership when owner key changes.
 *
 * Returns:
 * - isOwnerMatch: true if current session owner matches the stored owner
 * - messages: the list of messages if owner matches, or empty array if not
 */
export function useChatOwnerSync(newThread: () => void): {
  isOwnerMatch: boolean;
  messages: ChatMessage[];
} {
  const { user } = useAuth();
  const { messages, ownerId, claimOwner } = useChatStore();

  const ownerKey = formatChatOwnerKey(user ? user.id : null);

  // Sync conversation ownership with signed-in user or guest session
  useEffect(() => {
    if (user === undefined) return;
    if (useChatStore.getState().ownerId !== ownerKey) {
      newThread();
      claimOwner(ownerKey);
    }
  }, [user, ownerKey, newThread, claimOwner]);

  const isOwnerMatch = user !== undefined && ownerId === ownerKey;
  const visibleMessages = isOwnerMatch ? messages : [];

  return {
    isOwnerMatch,
    messages: visibleMessages,
  };
}

export default useChatOwnerSync;
