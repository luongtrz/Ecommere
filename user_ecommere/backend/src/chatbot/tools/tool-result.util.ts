import { HttpException } from '@nestjs/common';

export function toToolResult(value: unknown, maxChars = 6000): string {
  try {
    const raw = JSON.stringify({ ok: true, data: value });
    const limit = Math.max(0, maxChars);
    if (raw.length <= limit) {
      return raw;
    }
    return raw.slice(0, limit) + '... [output truncated]';
  } catch {
    try {
      const fallback = JSON.stringify({ ok: true, data: String(value) });
      const limit = Math.max(0, maxChars);
      if (fallback.length <= limit) {
        return fallback;
      }
      return fallback.slice(0, limit) + '... [output truncated]';
    } catch {
      return '{"ok":true,"data":"[unserializable value]"}';
    }
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();

    if (typeof response === 'string' && response.trim().length > 0) {
      return response;
    }

    if (response && typeof response === 'object') {
      const message = (response as Record<string, unknown>).message;
      if (Array.isArray(message)) {
        const joined = message.map((m) => String(m)).join('; ');
        if (joined.trim().length > 0) {
          return joined;
        }
      } else if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message;
    }
  }

  return 'Thao tác không thành công.';
}
