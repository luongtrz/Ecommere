import { HttpException } from '@nestjs/common';

export class ToolError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ToolError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function buildTruncatedResult(dataStr: string, limit: number): string {
  if (limit < 38) {
    return JSON.stringify({ ok: true, truncated: true });
  }

  let low = 0;
  let high = Math.min(dataStr.length, limit);
  let best = JSON.stringify({ ok: true, truncated: true, data: '' });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    let slice = dataStr.slice(0, mid);
    if (/[\uD800-\uDBFF]$/.test(slice)) {
      slice = slice.slice(0, -1);
    }
    const candidate = JSON.stringify({
      ok: true,
      truncated: true,
      data: slice,
    });
    if (candidate.length <= limit) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

export function toToolResult(value: unknown, maxChars = 6000): string {
  try {
    const raw = JSON.stringify({ ok: true, data: value });
    const limit = Math.max(0, maxChars);
    if (raw.length <= limit) {
      return raw;
    }
    const dataStr =
      typeof value === 'string' ? value : (JSON.stringify(value) ?? '');
    return buildTruncatedResult(dataStr, limit);
  } catch {
    try {
      const fallback = JSON.stringify({ ok: true, data: String(value) });
      const limit = Math.max(0, maxChars);
      if (fallback.length <= limit) {
        return fallback;
      }
      return buildTruncatedResult(String(value), limit);
    } catch {
      const msg = '[unserializable value]';
      const fallback = JSON.stringify({ ok: true, data: msg });
      const limit = Math.max(0, maxChars);
      if (fallback.length <= limit) {
        return fallback;
      }
      return buildTruncatedResult(msg, limit);
    }
  }
}

export function toErrorMessage(error: unknown): string {
  if (
    error instanceof ToolError ||
    (error instanceof Error && error.name === 'ToolError')
  ) {
    return error.message;
  }

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
