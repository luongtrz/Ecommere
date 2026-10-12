import { apiClient, authToken, getCookie, API_BASE_URL } from '@/lib/api';

export interface SseMessage {
  event: string;
  data: unknown;
}

export function createSseParser(onMessage: (m: SseMessage) => void): {
  push(chunk: string): void;
  end(): void;
} {
  let buffer = '';
  let currentEvent = 'message';
  let dataLines: string[] = [];

  function flush(): void {
    if (dataLines.length > 0) {
      const rawData = dataLines.join('\n');
      let parsedData: unknown = rawData;
      try {
        parsedData = JSON.parse(rawData);
      } catch {
        parsedData = rawData;
      }
      const message: SseMessage = {
        event: currentEvent || 'message',
        data: parsedData,
      };
      currentEvent = 'message';
      dataLines = [];
      onMessage(message);
    } else {
      currentEvent = 'message';
    }
  }

  function processLine(line: string): void {
    if (line.startsWith(':')) {
      return;
    }
    if (line === '') {
      flush();
      return;
    }
    if (line.startsWith('event:')) {
      let value = line.slice(6);
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }
      currentEvent = value;
    } else if (line.startsWith('data:')) {
      let value = line.slice(5);
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }
      dataLines.push(value);
    } else if (line === 'event') {
      currentEvent = '';
    } else if (line === 'data') {
      dataLines.push('');
    }
  }

  function push(chunk: string): void {
    buffer += chunk;
    let start = 0;
    let i = 0;
    while (i < buffer.length) {
      const ch = buffer[i];
      if (ch === '\r') {
        if (i + 1 < buffer.length) {
          if (buffer[i + 1] === '\n') {
            processLine(buffer.slice(start, i));
            start = i + 2;
            i = start;
          } else {
            processLine(buffer.slice(start, i));
            start = i + 1;
            i = start;
          }
        } else {
          break;
        }
      } else if (ch === '\n') {
        processLine(buffer.slice(start, i));
        start = i + 1;
        i = start;
      } else {
        i++;
      }
    }
    buffer = buffer.slice(start);
  }

  function end(): void {
    if (buffer.length > 0) {
      push('\n');
    }
    flush();
  }

  return { push, end };
}

export class ApiStreamError extends Error {
  status: number;
  code?: string;

  constructor(
    statusOrMessage: number | string,
    messageOrStatus?: string | number,
    code?: string
  ) {
    let status: number;
    let message: string;

    if (typeof statusOrMessage === 'number') {
      status = statusOrMessage;
      message =
        typeof messageOrStatus === 'string' && messageOrStatus.trim().length > 0
          ? messageOrStatus
          : 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    } else {
      message = statusOrMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      status = typeof messageOrStatus === 'number' ? messageOrStatus : 500;
    }

    super(message);
    this.name = 'ApiStreamError';
    this.status = status;
    this.code = code;
    Object.setPrototypeOf(this, ApiStreamError.prototype);
  }
}

const DEFAULT_ERROR_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';

async function parseErrorResponse(
  response: Response
): Promise<{ message: string; code?: string }> {
  try {
    const errorBody = await response.json();
    if (errorBody && typeof errorBody === 'object') {
      const code =
        typeof errorBody.code === 'string'
          ? errorBody.code
          : typeof errorBody.data?.code === 'string'
          ? errorBody.data.code
          : undefined;

      const rawMsg = errorBody.message ?? errorBody.data?.message;
      if (Array.isArray(rawMsg) && rawMsg.length > 0) {
        const joined = rawMsg.filter(Boolean).join('; ');
        if (joined) {
          return { message: joined, code };
        }
      } else if (typeof rawMsg === 'string' && rawMsg.trim().length > 0) {
        return { message: rawMsg.trim(), code };
      } else if (typeof errorBody.error === 'string' && errorBody.error.trim().length > 0) {
        return { message: errorBody.error.trim(), code };
      }
      return { message: DEFAULT_ERROR_MESSAGE, code };
    }
  } catch {
    // Non-JSON response body
  }
  return { message: DEFAULT_ERROR_MESSAGE };
}

export async function streamAgentRequest(
  path: string,
  body: unknown,
  onMessage: (m: SseMessage) => void,
  options: { signal?: AbortSignal } = {}
): Promise<void> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}/api${normalizedPath}`;

  const sendRequest = (): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    const token = authToken.get();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const csrfToken = getCookie('csrf_token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    });
  };

  const refreshAuthToken = async (): Promise<void> => {
    try {
      const { data } = await apiClient.post('/auth/refresh');
      const actualData = data.data || data;
      const newAccessToken = actualData?.accessToken;
      if (!newAccessToken || typeof newAccessToken !== 'string') {
        throw new Error('Refresh response missing access token');
      }
      authToken.set(newAccessToken);
    } catch (refreshErr: any) {
      authToken.remove();
      let message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      const serverMsg = refreshErr?.response?.data?.message;
      if (Array.isArray(serverMsg) && serverMsg.length > 0) {
        message = serverMsg.join('; ');
      } else if (typeof serverMsg === 'string' && serverMsg.trim().length > 0) {
        message = serverMsg.trim();
      }
      throw new ApiStreamError(401, message);
    }
  };

  let response = await sendRequest();

  if (response.status === 401) {
    await refreshAuthToken();
    response = await sendRequest();
  }

  if (!response.ok) {
    const { message, code } = await parseErrorResponse(response);
    throw new ApiStreamError(response.status, message, code);
  }

  if (!response.body) {
    throw new ApiStreamError(response.status, 'Không thể đọc luồng dữ liệu từ máy chủ.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  const parser = createSseParser(onMessage);

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        parser.push(chunk);
      }
    }
  }

  const finalChunk = decoder.decode();
  if (finalChunk) {
    parser.push(finalChunk);
  }
  parser.end();
}
