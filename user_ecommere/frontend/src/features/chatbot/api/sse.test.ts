import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createSseParser,
  ApiStreamError,
  streamAgentRequest,
  getChatSessionId,
  type SseMessage,
} from './sse';
import {
  refreshAccessToken,
  authToken,
  getCookie,
  API_BASE_URL,
} from '@/lib/api';

vi.mock('axios');

vi.mock('@/lib/api', () => ({
  refreshAccessToken: vi.fn(),
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
  getCookie: vi.fn(),
  API_BASE_URL: 'https://api.example.com',
}));

vi.mock('../lib/session', () => ({
  getChatSessionId: vi.fn(() => 'mock-session-id-123'),
}));

interface MockStreamOptions {
  throwAtReadIndex?: number;
  readError?: Error;
  cancelError?: Error;
  releaseLockError?: Error;
  emitEmptyOrUndefinedChunkAt?: number;
  emptyChunkType?: 'empty-uint8' | 'undefined';
}

function createMockStream(
  chunks: (string | Uint8Array)[],
  options: MockStreamOptions = {},
) {
  const encoder = new TextEncoder();
  const byteChunks: (Uint8Array | undefined)[] = chunks.map((chunk) => {
    if (typeof chunk === 'string') {
      return encoder.encode(chunk);
    }
    return chunk;
  });

  if (options.emitEmptyOrUndefinedChunkAt !== undefined) {
    const val =
      options.emptyChunkType === 'undefined' ? undefined : new Uint8Array(0);
    byteChunks.splice(options.emitEmptyOrUndefinedChunkAt, 0, val);
  }

  let index = 0;
  const cancelMock = vi.fn().mockImplementation(async () => {
    if (options.cancelError) {
      throw options.cancelError;
    }
  });

  const releaseLockMock = vi.fn().mockImplementation(() => {
    if (options.releaseLockError) {
      throw options.releaseLockError;
    }
  });

  const reader = {
    read: vi.fn(async () => {
      if (
        options.throwAtReadIndex !== undefined &&
        index === options.throwAtReadIndex
      ) {
        throw options.readError || new Error('Stream read error');
      }
      if (index >= byteChunks.length) {
        return { done: true, value: undefined };
      }
      const val = byteChunks[index++];
      return { done: false, value: val };
    }),
    cancel: cancelMock,
    releaseLock: releaseLockMock,
  };

  const body = {
    getReader: vi.fn(() => reader),
  };

  return { body, reader, cancelMock, releaseLockMock };
}

interface MockResponseOptions {
  status?: number;
  ok?: boolean;
  body?: any;
  json?: () => Promise<any>;
}

function createMockResponse({
  status = 200,
  ok = true,
  body = null,
  json = async () => ({}),
}: MockResponseOptions = {}): Response {
  return {
    status,
    ok,
    body,
    json,
  } as unknown as Response;
}

describe('sse.ts', () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    globalThis.fetch = mockFetch;
    vi.mocked(authToken.get).mockReturnValue('default-token');
    vi.mocked(getCookie).mockReturnValue('default-csrf');
    vi.mocked(refreshAccessToken).mockResolvedValue('new-access-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.fetch = originalFetch;
  });

  describe('createSseParser', () => {
    it('parses single-line and JSON data with default message event', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: {"greeting":"hello"}\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: { greeting: 'hello' },
        },
      ]);
    });

    it('parses custom event names with leading space', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event: agent_status\ndata: {"status":"thinking"}\n\n');

      expect(messages).toEqual([
        {
          event: 'agent_status',
          data: { status: 'thinking' },
        },
      ]);
    });

    it('parses custom event names without leading space', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event:done\ndata: {"ok":true}\n\n');

      expect(messages).toEqual([
        {
          event: 'done',
          data: { ok: true },
        },
      ]);
    });

    it('parses data lines without leading space', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data:{"count":42}\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: { count: 42 },
        },
      ]);
    });

    it('parses non-JSON data as raw string', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: Plain text response from agent\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'Plain text response from agent',
        },
      ]);
    });

    it('joins multiline data lines with newline for non-JSON content', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: First line\ndata: Second line\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'First line\nSecond line',
        },
      ]);
    });

    it('joins multiline data lines that form valid JSON when concatenated', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: {\ndata: "chunk": "data"\ndata: }\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: { chunk: 'data' },
        },
      ]);
    });

    it('ignores SSE comment lines starting with colon', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push(': ping heartbeat\n\n');
      expect(messages).toHaveLength(0);

      parser.push(':just-a-comment\ndata: {"actual":"message"}\n\n');
      expect(messages).toEqual([
        {
          event: 'message',
          data: { actual: 'message' },
        },
      ]);
    });

    it('handles bare "event" line by resetting currentEvent to empty string and falling back to "message"', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event\ndata: {"bareEvent":true}\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: { bareEvent: true },
        },
      ]);
    });

    it('handles bare "data" line by appending empty string line', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: '',
        },
      ]);
    });

    it('ignores unknown fields without crashing or emitting false messages', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push(
        'id: 12345\nretry: 3000\nunknown_field: ignore\ndata: "test"\n\n',
      );

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'test',
        },
      ]);
    });

    it('handles CRLF (\\r\\n) line endings correctly', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event: crlf_event\r\ndata: {"ok":true}\r\n\r\n');

      expect(messages).toEqual([
        {
          event: 'crlf_event',
          data: { ok: true },
        },
      ]);
    });

    it('handles CR-only (\\r) line endings correctly', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event: cr_event\rdata: {"ok":true}\r\r');
      parser.end();

      expect(messages).toEqual([
        {
          event: 'cr_event',
          data: { ok: true },
        },
      ]);
    });

    it('handles incomplete \\r delimiter split across push chunks', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: split-chunk\r');
      expect(messages).toHaveLength(0);

      parser.push('\n\r\n');
      expect(messages).toEqual([
        {
          event: 'message',
          data: 'split-chunk',
        },
      ]);
    });

    it('flushes pending un-terminated buffer on end()', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: unterminated-message');
      expect(messages).toHaveLength(0);

      parser.end();

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'unterminated-message',
        },
      ]);
    });

    it('handles end() when buffer is empty without emitting message if no dataLines', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.end();
      expect(messages).toHaveLength(0);
    });

    it('handles end() when dataLines are pending but empty line was omitted', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: pending-without-double-newline\n');
      expect(messages).toHaveLength(0);

      parser.end();
      expect(messages).toEqual([
        {
          event: 'message',
          data: 'pending-without-double-newline',
        },
      ]);
    });

    it('handles empty line without dataLines by resetting currentEvent to "message"', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event: pending\n\n');
      expect(messages).toHaveLength(0);

      parser.push('data: {"final":true}\n\n');
      expect(messages).toEqual([
        {
          event: 'message',
          data: { final: true },
        },
      ]);
    });
  });

  describe('ApiStreamError', () => {
    it('initializes with number status, custom message, and error code', () => {
      const error = new ApiStreamError(
        404,
        'Tài nguyên không tìm thấy.',
        'NOT_FOUND',
      );

      expect(error).toBeInstanceOf(ApiStreamError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ApiStreamError');
      expect(error.status).toBe(404);
      expect(error.message).toBe('Tài nguyên không tìm thấy.');
      expect(error.code).toBe('NOT_FOUND');
    });

    it('defaults message when initialized with number status and empty or whitespace message', () => {
      const errorWithEmpty = new ApiStreamError(500, '');
      expect(errorWithEmpty.status).toBe(500);
      expect(errorWithEmpty.message).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );

      const errorWithSpaces = new ApiStreamError(400, '   ');
      expect(errorWithSpaces.status).toBe(400);
      expect(errorWithSpaces.message).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );
    });

    it('defaults message when initialized with number status and undefined or non-string message', () => {
      const error = new ApiStreamError(503, undefined, 'SERVICE_UNAVAILABLE');
      expect(error.status).toBe(503);
      expect(error.message).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');

      const errorNonString = new ApiStreamError(502, 12345 as any);
      expect(errorNonString.status).toBe(502);
      expect(errorNonString.message).toBe(
        'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      );
    });

    it('creates instance with string message and number status', () => {
      const error = new ApiStreamError(
        'Yêu cầu không hợp lệ.',
        400,
        'BAD_REQUEST',
      );

      expect(error.status).toBe(400);
      expect(error.message).toBe('Yêu cầu không hợp lệ.');
      expect(error.code).toBe('BAD_REQUEST');
    });

    it('defaults status to 500 when initialized with string message and non-number status', () => {
      const error = new ApiStreamError('Lỗi máy chủ nội bộ.');
      expect(error.status).toBe(500);
      expect(error.message).toBe('Lỗi máy chủ nội bộ.');
      expect(error.code).toBeUndefined();

      const errorWithUndefinedStatus = new ApiStreamError(
        'Lỗi khác.',
        undefined,
      );
      expect(errorWithUndefinedStatus.status).toBe(500);
      expect(errorWithUndefinedStatus.message).toBe('Lỗi khác.');
    });

    it('handles empty string message and defaults message and status', () => {
      const error = new ApiStreamError('');
      expect(error.status).toBe(500);
      expect(error.message).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    });

    it('handles empty string message with explicit numeric status', () => {
      const error = new ApiStreamError('', 422);
      expect(error.status).toBe(422);
      expect(error.message).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    });
  });

  describe('streamAgentRequest', () => {
    describe('URL and headers configuration', () => {
      it('normalizes path by prepending slash when omitted', async () => {
        const { body } = createMockStream(['data: "ok"\n\n']);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await streamAgentRequest('agent/chat', { prompt: 'hello' }, vi.fn());

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/agent/chat`,
          expect.any(Object),
        );
      });

      it('preserves path when leading slash is provided', async () => {
        const { body } = createMockStream(['data: "ok"\n\n']);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await streamAgentRequest('/agent/chat', { prompt: 'hello' }, vi.fn());

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/agent/chat`,
          expect.any(Object),
        );
      });

      it('configures POST method, credentials, session header, and stringified body', async () => {
        const { body } = createMockStream(['data: "ok"\n\n']);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        const payload = { query: 'test question', model: 'default' };
        await streamAgentRequest('/chat', payload, vi.fn());

        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/api/chat`,
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Accept: 'text/event-stream',
              'X-Chat-Session': 'mock-session-id-123',
            }),
            body: JSON.stringify(payload),
          }),
        );
      });

      it('includes Authorization header when authToken is present', async () => {
        vi.mocked(authToken.get).mockReturnValue('jwt-token-xyz');
        const { body } = createMockStream(['data: "ok"\n\n']);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await streamAgentRequest('/chat', {}, vi.fn());

        const callOptions = mockFetch.mock.calls[0][1];
        expect(callOptions.headers['Authorization']).toBe(
          'Bearer jwt-token-xyz',
        );
      });

      it('omits Authorization header when authToken is absent', async () => {
        vi.mocked(authToken.get).mockReturnValue(null as any);
        const { body } = createMockStream(['data: "ok"\n\n']);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await streamAgentRequest('/chat', {}, vi.fn());

        const callOptions = mockFetch.mock.calls[0][1];
        expect(callOptions.headers['Authorization']).toBeUndefined();
      });

      it('includes X-CSRF-Token header when csrf_token cookie is present', async () => {
        vi.mocked(getCookie).mockReturnValue('csrf-token-123');
        const { body } = createMockStream(['data: "ok"\n\n']);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await streamAgentRequest('/chat', {}, vi.fn());

        const callOptions = mockFetch.mock.calls[0][1];
        expect(callOptions.headers['X-CSRF-Token']).toBe('csrf-token-123');
      });

      it('omits X-CSRF-Token header when csrf_token cookie is absent', async () => {
        vi.mocked(getCookie).mockReturnValue(null);
        const { body } = createMockStream(['data: "ok"\n\n']);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await streamAgentRequest('/chat', {}, vi.fn());

        const callOptions = mockFetch.mock.calls[0][1];
        expect(callOptions.headers['X-CSRF-Token']).toBeUndefined();
      });

      it('forwards AbortSignal when provided in options', async () => {
        const controller = new AbortController();
        const { body } = createMockStream(['data: "ok"\n\n']);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await streamAgentRequest('/chat', {}, vi.fn(), {
          signal: controller.signal,
        });

        const callOptions = mockFetch.mock.calls[0][1];
        expect(callOptions.signal).toBe(controller.signal);
      });
    });

    describe('401 handling and token refresh', () => {
      it('refreshes token and retries request on 401 response', async () => {
        const { body: successBody } = createMockStream([
          'data: {"retried":true}\n\n',
        ]);

        mockFetch
          .mockResolvedValueOnce(createMockResponse({ status: 401, ok: false }))
          .mockResolvedValueOnce(
            createMockResponse({ status: 200, ok: true, body: successBody }),
          );

        const onMessage = vi.fn();
        await streamAgentRequest('/chat', { prompt: 'retry' }, onMessage);

        expect(refreshAccessToken).toHaveBeenCalledTimes(1);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(onMessage).toHaveBeenCalledWith({
          event: 'message',
          data: { retried: true },
        });
      });

      it('throws ApiStreamError and removes token when refresh rejects with array message', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 401, ok: false }),
        );
        vi.mocked(refreshAccessToken).mockRejectedValueOnce({
          response: {
            data: {
              message: ['Phiên đã hết hạn', 'Vui lòng đăng nhập lại'],
            },
          },
        });

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 401,
          message: 'Phiên đã hết hạn; Vui lòng đăng nhập lại',
        });
        expect(authToken.remove).toHaveBeenCalledTimes(1);
      });

      it('throws ApiStreamError and removes token when refresh rejects with string message', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 401, ok: false }),
        );
        vi.mocked(refreshAccessToken).mockRejectedValueOnce({
          response: {
            data: {
              message: '  Token làm mới không hợp lệ.  ',
            },
          },
        });

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 401,
          message: 'Token làm mới không hợp lệ.',
        });
        expect(authToken.remove).toHaveBeenCalledTimes(1);
      });

      it('throws ApiStreamError with default message when refresh rejects without custom message', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 401, ok: false }),
        );
        vi.mocked(refreshAccessToken).mockRejectedValueOnce(
          new Error('Network error'),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 401,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        });
        expect(authToken.remove).toHaveBeenCalledTimes(1);
      });

      it('throws ApiStreamError with default message when refresh response has empty array message', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 401, ok: false }),
        );
        vi.mocked(refreshAccessToken).mockRejectedValueOnce({
          response: {
            data: {
              message: [],
            },
          },
        });

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 401,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        });
        expect(authToken.remove).toHaveBeenCalledTimes(1);
      });

      it('throws ApiStreamError with default message when refresh response has empty string message', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 401, ok: false }),
        );
        vi.mocked(refreshAccessToken).mockRejectedValueOnce({
          response: {
            data: {
              message: '   ',
            },
          },
        });

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 401,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        });
        expect(authToken.remove).toHaveBeenCalledTimes(1);
      });

      it('throws ApiStreamError when refresh resolves with non-string or empty token', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 401, ok: false }),
        );
        vi.mocked(refreshAccessToken).mockResolvedValueOnce('' as any);

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 401,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        });
        expect(authToken.remove).toHaveBeenCalledTimes(1);

        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 401, ok: false }),
        );
        vi.mocked(refreshAccessToken).mockResolvedValueOnce(null as any);

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 401,
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        });
      });
    });

    describe('parseErrorResponse and non-ok status handling', () => {
      it('parses error response with code and message', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 400,
            ok: false,
            json: async () => ({
              code: 'INVALID_INPUT',
              message: 'Nội dung tin nhắn không hợp lệ.',
            }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 400,
          code: 'INVALID_INPUT',
          message: 'Nội dung tin nhắn không hợp lệ.',
        });
      });

      it('parses error response with nested data.code and data.message', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 422,
            ok: false,
            json: async () => ({
              data: {
                code: 'NESTED_DATA_CODE',
                message: 'Dữ liệu không đủ điều kiện xử lý.',
              },
            }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 422,
          code: 'NESTED_DATA_CODE',
          message: 'Dữ liệu không đủ điều kiện xử lý.',
        });
      });

      it('joins error message array with semicolon delimiter', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 400,
            ok: false,
            json: async () => ({
              message: ['Trường tin nhắn bắt buộc', 'Độ dài tối thiểu 2 ký tự'],
              code: 'VALIDATION_ERROR',
            }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 400,
          message: 'Trường tin nhắn bắt buộc; Độ dài tối thiểu 2 ký tự',
          code: 'VALIDATION_ERROR',
        });
      });

      it('filters out falsy values in message array', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 400,
            ok: false,
            json: async () => ({
              message: [
                'Lỗi duy nhất hợp lệ',
                '',
                null as any,
                undefined as any,
              ],
            }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 400,
          message: 'Lỗi duy nhất hợp lệ',
        });
      });

      it('falls back to error field when message array contains only falsy items', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 400,
            ok: false,
            json: async () => ({
              message: [],
              error: 'Fallback thông báo lỗi từ trường error',
            }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 400,
          message: 'Fallback thông báo lỗi từ trường error',
        });
      });

      it('falls back to DEFAULT_ERROR_MESSAGE when message array has only falsy values and no error field', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 400,
            ok: false,
            json: async () => ({
              message: ['', null as any],
              code: 'ONLY_CODE',
            }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 400,
          message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
          code: 'ONLY_CODE',
        });
      });

      it('trims string message in error response', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 500,
            ok: false,
            json: async () => ({
              message: '  Lỗi có khoảng trắng ở đầu và cuối.  ',
            }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 500,
          message: 'Lỗi có khoảng trắng ở đầu và cuối.',
        });
      });

      it('falls back to error field when message is an empty string', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 403,
            ok: false,
            json: async () => ({
              message: '   ',
              error: 'Bạn không có quyền thực hiện thao tác này.',
            }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 403,
          message: 'Bạn không có quyền thực hiện thao tác này.',
        });
      });

      it('falls back to DEFAULT_ERROR_MESSAGE when error field is whitespace only', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 500,
            ok: false,
            json: async () => ({
              error: '   ',
            }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 500,
          message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        });
      });

      it('falls back to DEFAULT_ERROR_MESSAGE when response body is not an object', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 500,
            ok: false,
            json: async () => null,
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 500,
          message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        });

        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 500,
            ok: false,
            json: async () => 'Non-object string error',
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 500,
          message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        });
      });

      it('falls back to DEFAULT_ERROR_MESSAGE when response.json() throws', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 502,
            ok: false,
            json: async () => {
              throw new Error('Unexpected token < in JSON at position 0');
            },
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 502,
          message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
          code: undefined,
        });
      });

      it('falls back to DEFAULT_ERROR_MESSAGE when error body object has no message or error', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 500,
            ok: false,
            json: async () => ({ otherProp: 123 }),
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 500,
          message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        });
      });
    });

    describe('Response body and stream processing', () => {
      it('throws ApiStreamError when response body is null', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            status: 200,
            ok: true,
            body: null,
          }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).rejects.toMatchObject({
          status: 200,
          message: 'Không thể đọc luồng dữ liệu từ máy chủ.',
        });
      });

      it('reads stream chunks, decodes UTF-8 bytes, and delivers messages to callback', async () => {
        const { body, reader } = createMockStream([
          'event: message\ndata: {"chunk":1}\n\n',
          'event: done\ndata: {"chunk":2}\n\n',
        ]);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        const messages: SseMessage[] = [];
        await streamAgentRequest('/chat', {}, (m) => messages.push(m));

        expect(messages).toEqual([
          { event: 'message', data: { chunk: 1 } },
          { event: 'done', data: { chunk: 2 } },
        ]);
        expect(reader.releaseLock).toHaveBeenCalledTimes(1);
        expect(reader.cancel).not.toHaveBeenCalled();
      });

      it('ignores empty chunks and undefined values during stream consumption', async () => {
        const { body } = createMockStream(
          ['data: {"first":true}\n\n', 'data: {"second":true}\n\n'],
          {
            emitEmptyOrUndefinedChunkAt: 1,
            emptyChunkType: 'empty-uint8',
          },
        );
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        const messages: SseMessage[] = [];
        await streamAgentRequest('/chat', {}, (m) => messages.push(m));

        expect(messages).toEqual([
          { event: 'message', data: { first: true } },
          { event: 'message', data: { second: true } },
        ]);
      });

      it('handles stream reading when result.value is undefined while not done', async () => {
        const { body } = createMockStream(['data: "single"\n\n'], {
          emitEmptyOrUndefinedChunkAt: 0,
          emptyChunkType: 'undefined',
        });
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        const messages: SseMessage[] = [];
        await streamAgentRequest('/chat', {}, (m) => messages.push(m));

        expect(messages).toEqual([{ event: 'message', data: 'single' }]);
      });

      it('flushes incomplete multi-byte UTF-8 bytes at stream completion', async () => {
        // 0xE2 0x82 0xAC is the 3-byte UTF-8 sequence for '€'.
        // Sending [0xE2, 0x82] leaves incomplete bytes that are flushed by decoder.decode() at the end.
        const incompleteUtf8Bytes = new Uint8Array([0xe2, 0x82]);
        const { body } = createMockStream([incompleteUtf8Bytes]);
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await expect(
          streamAgentRequest('/chat', {}, vi.fn()),
        ).resolves.toBeUndefined();
      });

      it('cancels reader, releases lock, and re-throws when reader.read() fails', async () => {
        const readErr = new Error('Mạng bị gián đoạn khi đang truyền luồng.');
        const { body, reader } = createMockStream([], {
          throwAtReadIndex: 0,
          readError: readErr,
        });
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await expect(streamAgentRequest('/chat', {}, vi.fn())).rejects.toThrow(
          readErr,
        );

        expect(reader.cancel).toHaveBeenCalledWith(readErr);
        expect(reader.releaseLock).toHaveBeenCalledTimes(1);
      });

      it('ignores error thrown by reader.cancel() when stream read fails', async () => {
        const readErr = new Error('Lỗi đọc luồng.');
        const cancelErr = new Error('Lỗi khi hủy luồng đọc.');
        const { body, reader } = createMockStream([], {
          throwAtReadIndex: 0,
          readError: readErr,
          cancelError: cancelErr,
        });
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await expect(streamAgentRequest('/chat', {}, vi.fn())).rejects.toThrow(
          readErr,
        );

        expect(reader.cancel).toHaveBeenCalledWith(readErr);
        expect(reader.releaseLock).toHaveBeenCalledTimes(1);
      });

      it('ignores error thrown by reader.releaseLock() when stream read fails', async () => {
        const readErr = new Error('Lỗi đọc luồng.');
        const lockErr = new Error('Lỗi khi giải phóng lock stream.');
        const { body, reader } = createMockStream([], {
          throwAtReadIndex: 0,
          readError: readErr,
          releaseLockError: lockErr,
        });
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        await expect(streamAgentRequest('/chat', {}, vi.fn())).rejects.toThrow(
          readErr,
        );

        expect(reader.releaseLock).toHaveBeenCalledTimes(1);
      });

      it('ignores error thrown by reader.releaseLock() on successful stream completion', async () => {
        const lockErr = new Error('Lock đã giải phóng.');
        const { body, reader } = createMockStream(['data: "success"\n\n'], {
          releaseLockError: lockErr,
        });
        mockFetch.mockResolvedValueOnce(
          createMockResponse({ status: 200, ok: true, body }),
        );

        const messages: SseMessage[] = [];
        await expect(
          streamAgentRequest('/chat', {}, (m) => messages.push(m)),
        ).resolves.toBeUndefined();

        expect(messages).toEqual([{ event: 'message', data: 'success' }]);
        expect(reader.releaseLock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('getChatSessionId re-export', () => {
    it('re-exports getChatSessionId from lib/session', () => {
      const sessionId = getChatSessionId();
      expect(sessionId).toBe('mock-session-id-123');
    });
  });
});
