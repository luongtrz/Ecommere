const CHAT_SESSION_KEY = 'thai-spray-chat-session';

let inMemorySessionId: string | null = null;

function generateSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Dự phòng khi crypto.randomUUID không khả dụng
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSafeLocalStorage(): Storage | null {
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
 * Lấy hoặc khởi tạo session ID cho khách ẩn danh (guest).
 * Lưu duy nhất một lần trong localStorage dưới key thai-spray-chat-session.
 * Mọi thao tác truy cập localStorage đều được bọc trong try/catch và dự phòng qua in-memory ID.
 * Không ghi raw session ID ra bất kỳ bộ nhớ hay nhật ký nào khác.
 */
export function getChatSessionId(): string {
  try {
    const storage = getSafeLocalStorage();
    if (storage) {
      try {
        const stored = storage.getItem(CHAT_SESSION_KEY);
        if (stored && typeof stored === 'string' && stored.trim().length > 0) {
          return stored.trim();
        }
      } catch {
        // Lỗi đọc localStorage, tiếp tục tạo mới hoặc dùng bộ nhớ tạm
      }

      const newId = generateSessionId();
      try {
        storage.setItem(CHAT_SESSION_KEY, newId);
      } catch {
        // Lỗi ghi localStorage, dự phòng bằng bộ nhớ tạm
      }
      inMemorySessionId = newId;
      return newId;
    }
  } catch {
    // Truy cập localStorage thất bại
  }

  if (!inMemorySessionId) {
    inMemorySessionId = generateSessionId();
  }
  return inMemorySessionId;
}

/**
 * Chuẩn hóa khóa định danh sở hữu phiên chat (owner key):
 * - Khách ẩn danh (guest): `guest:<sessionId>`
 * - Người dùng đăng nhập (user): `user:<id>`
 */
export function formatChatOwnerKey(userId?: string | null): string {
  if (userId && typeof userId === 'string' && userId.trim().length > 0) {
    const trimmed = userId.trim();
    if (trimmed.startsWith('user:') || trimmed.startsWith('guest:')) {
      return trimmed;
    }
    return `user:${trimmed}`;
  }
  return `guest:${getChatSessionId()}`;
}
