import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createSseParser,
  ApiStreamError,
  streamAgentRequest,
  type SseMessage,
} from './sse';
import {
  refreshAccessToken,
  authToken,
  getCookie,
  API_BASE_URL,
} from '@/lib/api';

vi.mock('@/lib/api', () => ({
  refreshAccessToken: vi.fn(),
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    decode: vi.fn(),
  },
  getCookie: vi.fn(),
  API_BASE_URL: 'https://api.example.com',
}));

describe('sse', () => {
  describe('createSseParser', () => {
    it('parses a JSON data message with standard event', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: {"message":"Xin chào","sender":"bot"}\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: { message: 'Xin chào', sender: 'bot' },
        },
      ]);
    });

    it('falls back to raw string when data is not valid JSON', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: plain non-json text\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'plain non-json text',
        },
      ]);
    });

    it('parses custom event name with leading space and without leading space', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event: custom_event\ndata: {"step":1}\n\n');
      parser.push('event:second_event\ndata:{"step":2}\n\n');

      expect(messages).toEqual([
        {
          event: 'custom_event',
          data: { step: 1 },
        },
        {
          event: 'second_event',
          data: { step: 2 },
        },
      ]);
    });

    it('joins multiple data lines with newline', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: line 1\ndata: line 2\ndata: line 3\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'line 1\nline 2\nline 3',
        },
      ]);
    });

    it('ignores comment lines starting with colon', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push(': ping heartbeat\n: another comment\ndata: payload\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'payload',
        },
      ]);
    });

    it('handles "event" line without value and defaults event to "message" upon flush', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event\ndata: test\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'test',
        },
      ]);
    });

    it('handles "data" line without value by pushing empty string', () => {
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

    it('ignores unsupported SSE fields like id and retry', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('id: 123\nretry: 1000\ncustomField: hello\ndata: ok\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'ok',
        },
      ]);
    });

    it('resets currentEvent and does not invoke callback when flushing empty data lines', () => {
      const onMessage = vi.fn();
      const parser = createSseParser(onMessage);

      parser.push('event: ignored\n\n');
      expect(onMessage).not.toHaveBeenCalled();

      parser.push('data: real\n\n');
      expect(onMessage).toHaveBeenCalledWith({
        event: 'message',
        data: 'real',
      });
    });

    it('handles Windows CRLF (\\r\\n) line endings', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event: crlf_test\r\ndata: {"ok":true}\r\n\r\n');

      expect(messages).toEqual([
        {
          event: 'crlf_test',
          data: { ok: true },
        },
      ]);
    });

    it('handles standalone CR (\\r) line endings', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event: cr_test\rdata: cr_content\r\r');
      parser.end();

      expect(messages).toEqual([
        {
          event: 'cr_test',
          data: 'cr_content',
        },
      ]);
    });

    it('handles chunk boundary when \\r is the last character and \\n is in the next chunk', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('event: split\r');
      parser.push('\ndata: split_value\r\n\r\n');

      expect(messages).toEqual([
        {
          event: 'split',
          data: 'split_value',
        },
      ]);
    });

    it('handles chunk boundary when \\r is the last character and followed by non-\\n in the next chunk', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: line1\r');
      parser.push('data: line2\n\n');

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'line1\nline2',
        },
      ]);
    });

    it('buffers chunks that split lines across multiple pushes', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('ev');
      parser.push('ent: my_');
      parser.push('event\nda');
      parser.push('ta: {"chunk":');
      parser.push('1}\n\n');

      expect(messages).toEqual([
        {
          event: 'my_event',
          data: { chunk: 1 },
        },
      ]);
    });

    it('flushes pending buffer when end() is called with non-empty buffer', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: trailing without ending newlines');
      parser.end();

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'trailing without ending newlines',
        },
      ]);
    });

    it('handles end() when buffer is already empty without duplicate emission', () => {
      const messages: SseMessage[] = [];
      const parser = createSseParser((m) => messages.push(m));

      parser.push('data: complete\n\n');
      expect(messages).toHaveLength(1);

      parser.end();
      expect(messages).toHaveLength(1);
    });
  });

  describe('ApiStreamError', () => {
    it('constructs with status number, message string, and code', () => {
      const err = new ApiStreamError(404, 'Không tìm thấy trang', 'NOT_FOUND');

      expect(err.name).toBe('ApiStreamError');
      expect(err.status).toBe(404);
      expect(err.message).toBe('Không tìm thấy trang');
      expect(err.code).toBe('NOT_FOUND');
      expect(err).toBeInstanceOf(ApiStreamError);
      expect(err).toBeInstanceOf(Error);
    });

    it('falls back to default Vietnamese message when status is number and message is missing or whitespace', () => {
      const err1 = new ApiStreamError(500);
      expect(err1.status).toBe(500);
      expect(err1.message).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      expect(err1.code).toBeUndefined();

      const err2 = new ApiStreamError(400, '');
      expect(err2.status).toBe(400);
      expect(err2.message).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');

      const err3 = new ApiStreamError(403, '   ');
      expect(err3.status).toBe(403);
      expect(err3.message).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    });

    it('constructs with message string, status number, and code', () => {
      const err = new ApiStreamError(
        'Lỗi tùy biến',
        422,
        'UNPROCESSABLE_ENTITY',
      );

      expect(err.status).toBe(422);
      expect(err.message).toBe('Lỗi tùy biến');
      expect(err.code).toBe('UNPROCESSABLE_ENTITY');
    });

    it('constructs with message string and defaults status to 500 when status is omitted', () => {
      const err = new ApiStreamError('Lỗi dịch vụ');

      expect(err.status).toBe(500);
      expect(err.message).toBe('Lỗi dịch vụ');
      expect(err.code).toBeUndefined();
    });

    it('falls back to default Vietnamese message when statusOrMessage is empty string', () => {
      const err1 = new ApiStreamError('', 401);
      expect(err1.status).toBe(401);
      expect(err1.message).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');

      const err2 = new ApiStreamError('');
      expect(err2.status).toBe(500);
      expect(err2.message).toBe('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    });
  });

  describe('streamAgentRequest', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
      vi.stubGlobal('fetch', mockFetch);
      vi.mocked(authToken.get).mockReturnValue('mock-access-token');
      vi.mocked(getCookie).mockReturnValue('mock-csrf-token');
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function createMockReader(
      chunks: (Uint8Array | undefined)[] = [],
      options: {
        errorOnRead?: Error;
        cancelError?: Error;
        releaseLockError?: Error;
      } = {},
    ) {
      let index = 0;
      const read = vi.fn().mockImplementation(async () => {
        if (options.errorOnRead && index >= chunks.length) {
          throw options.errorOnRead;
        }
        if (index < chunks.length) {
          const value = chunks[index++];
          return { done: false, value };
        }
        return { done: true, value: undefined };
      });

      const cancel = vi.fn().mockImplementation(async () => {
        if (options.cancelError) {
          throw options.cancelError;
        }
        return undefined;
      });

      const releaseLock = vi.fn().mockImplementation(() => {
        if (options.releaseLockError) {
          throw options.releaseLockError;
        }
      });

      return { read, cancel, releaseLock };
    }

    function createMockResponse(overrides: Partial<Response> = {}): Response {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: null,
        json: vi.fn().mockResolvedValue({}),
        text: vi.fn().mockResolvedValue(''),
        ...overrides,
      } as unknown as Response;
    }

    it('streams requests successfully and normalizes path without leading slash', async () => {
      const reader = createMockReader([
        new TextEncoder().encode(
          'event: message\ndata: {"text":"chào bạn"}\n\n',
        ),
      ]);
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          body: { getReader: () => reader } as any,
        }),
      );

      const messages: SseMessage[] = [];
      await streamAgentRequest('agent/chat', { prompt: 'xin chào' }, (m) =>
        messages.push(m),
      );

      expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/agent/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: 'Bearer mock-access-token',
          'X-CSRF-Token': 'mock-csrf-token',
        },
        body: JSON.stringify({ prompt: 'xin chào' }),
        signal: undefined,
      });
      expect(messages).toEqual([
        {
          event: 'message',
          data: { text: 'chào bạn' },
        },
      ]);
      expect(reader.releaseLock).toHaveBeenCalled();
      expect(reader.cancel).not.toHaveBeenCalled();
    });

    it('normalizes path with leading slash and respects custom signal', async () => {
      const reader = createMockReader([
        new TextEncoder().encode('data: single line\n\n'),
      ]);
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          body: { getReader: () => reader } as any,
        }),
      );

      const controller = new AbortController();
      const messages: SseMessage[] = [];
      await streamAgentRequest(
        '/agent/stream',
        { query: 'test' },
        (m) => messages.push(m),
        { signal: controller.signal },
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/agent/stream`,
        expect.objectContaining({
          signal: controller.signal,
        }),
      );
      expect(messages).toEqual([
        {
          event: 'message',
          data: 'single line',
        },
      ]);
    });

    it('omits Authorization and X-CSRF-Token headers when token and cookie are absent', async () => {
      vi.mocked(authToken.get).mockReturnValue(null);
      vi.mocked(getCookie).mockReturnValue(null);

      const reader = createMockReader([
        new TextEncoder().encode('data: hello\n\n'),
      ]);
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          body: { getReader: () => reader } as any,
        }),
      );

      await streamAgentRequest('/chat', {}, () => {});

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/chat`,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
        }),
      );
    });

    it('refreshes token on 401 response and retries the request', async () => {
      const reader = createMockReader([
        new TextEncoder().encode('data: {"retried":true}\n\n'),
      ]);

      mockFetch
        .mockResolvedValueOnce(
          createMockResponse({
            status: 401,
            ok: false,
          }),
        )
        .mockResolvedValueOnce(
          createMockResponse({
            status: 200,
            ok: true,
            body: { getReader: () => reader } as any,
          }),
        );

      vi.mocked(refreshAccessToken).mockResolvedValueOnce('new-token-123');

      const messages: SseMessage[] = [];
      await streamAgentRequest('/agent/chat', { ping: true }, (m) =>
        messages.push(m),
      );

      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(messages).toEqual([
        {
          event: 'message',
          data: { retried: true },
        },
      ]);
    });

    it('throws ApiStreamError when refreshAccessToken resolves with non-string token', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 401,
          ok: false,
        }),
      );
      vi.mocked(refreshAccessToken).mockResolvedValueOnce('' as any);

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 401,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      });

      expect(authToken.remove).toHaveBeenCalled();
    });

    it('throws ApiStreamError when refresh fails with array error message', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 401,
          ok: false,
        }),
      );
      vi.mocked(refreshAccessToken).mockRejectedValueOnce({
        response: {
          data: {
            message: ['Mã phiên không hợp lệ', 'Vui lòng xác thực lại'],
          },
        },
      });

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 401,
        message: 'Mã phiên không hợp lệ; Vui lòng xác thực lại',
      });

      expect(authToken.remove).toHaveBeenCalled();
    });

    it('throws ApiStreamError when refresh fails with trimmed string error message', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 401,
          ok: false,
        }),
      );
      vi.mocked(refreshAccessToken).mockRejectedValueOnce({
        response: {
          data: {
            message: '   Phiên làm việc đã kết thúc   ',
          },
        },
      });

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 401,
        message: 'Phiên làm việc đã kết thúc',
      });

      expect(authToken.remove).toHaveBeenCalled();
    });

    it('throws ApiStreamError with default message when refresh fails with empty array or whitespace message', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 401,
          ok: false,
        }),
      );
      vi.mocked(refreshAccessToken).mockRejectedValueOnce({
        response: {
          data: {
            message: [],
          },
        },
      });

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 401,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      });

      expect(authToken.remove).toHaveBeenCalled();
    });

    it('throws ApiStreamError with default message when refresh fails with general network error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 401,
          ok: false,
        }),
      );
      vi.mocked(refreshAccessToken).mockRejectedValueOnce(
        new Error('Network offline'),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 401,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      });

      expect(authToken.remove).toHaveBeenCalled();
    });

    it('parses error response with JSON message string and code', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 400,
          ok: false,
          json: vi.fn().mockResolvedValue({
            message: 'Dữ liệu không hợp lệ',
            code: 'INVALID_REQUEST',
          }),
        }),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 400,
        message: 'Dữ liệu không hợp lệ',
        code: 'INVALID_REQUEST',
      });
    });

    it('parses error response with array message and data.code', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 422,
          ok: false,
          json: vi.fn().mockResolvedValue({
            message: ['Trường query là bắt buộc', 'Trường mode không đúng'],
            data: {
              code: 'VALIDATION_FAILED',
            },
          }),
        }),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 422,
        message: 'Trường query là bắt buộc; Trường mode không đúng',
        code: 'VALIDATION_FAILED',
      });
    });

    it('parses error response when message array contains only falsy items', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 400,
          ok: false,
          json: vi.fn().mockResolvedValue({
            message: ['', null],
            code: 'EMPTY_ARRAY_ERR',
          }),
        }),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 400,
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
        code: 'EMPTY_ARRAY_ERR',
      });
    });

    it('parses error response with nested data.message', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 400,
          ok: false,
          json: vi.fn().mockResolvedValue({
            data: {
              message: 'Lỗi từ data.message',
            },
          }),
        }),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 400,
        message: 'Lỗi từ data.message',
      });
    });

    it('parses error response with error string field', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 500,
          ok: false,
          json: vi.fn().mockResolvedValue({
            error: 'Lỗi máy chủ',
          }),
        }),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 500,
        message: 'Lỗi máy chủ',
      });
    });

    it('falls back to default error message when error fields are empty whitespace', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 500,
          ok: false,
          json: vi.fn().mockResolvedValue({
            message: '   ',
            error: '   ',
          }),
        }),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 500,
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      });
    });

    it('falls back to default error message when response body is not an object', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 500,
          ok: false,
          json: vi.fn().mockResolvedValue(null),
        }),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 500,
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      });
    });

    it('falls back to default error message when response.json() throws non-JSON error', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 502,
          ok: false,
          json: vi.fn().mockRejectedValue(new SyntaxError('Bad Gateway HTML')),
        }),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 502,
        message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
      });
    });

    it('throws ApiStreamError when response.body is missing', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          status: 200,
          ok: true,
          body: null,
        }),
      );

      await expect(
        streamAgentRequest('/chat', {}, () => {}),
      ).rejects.toMatchObject({
        name: 'ApiStreamError',
        status: 200,
        message: 'Không thể đọc luồng dữ liệu từ máy chủ.',
      });
    });

    it('handles stream reading with empty chunks and undefined values safely', async () => {
      const reader = createMockReader([
        undefined,
        new Uint8Array(0),
        new TextEncoder().encode('data: valid after empty\n\n'),
      ]);
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          body: { getReader: () => reader } as any,
        }),
      );

      const messages: SseMessage[] = [];
      await streamAgentRequest('/chat', {}, (m) => messages.push(m));

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'valid after empty',
        },
      ]);
      expect(reader.releaseLock).toHaveBeenCalled();
    });

    it('pushes finalChunk when multi-byte UTF-8 bytes are completed at end of stream', async () => {
      // 0xE2, 0x82 is an incomplete UTF-8 prefix for '€' (0xE2 0x82 0xAC).
      // decoder.decode(..., { stream: true }) buffers it, then final decode() flushes it.
      const reader = createMockReader([new Uint8Array([0xe2, 0x82])]);
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          body: { getReader: () => reader } as any,
        }),
      );

      const messages: SseMessage[] = [];
      await streamAgentRequest('/chat', {}, (m) => messages.push(m));

      expect(reader.releaseLock).toHaveBeenCalled();
    });

    it('cancels reader and releases lock when an error occurs during stream reading', async () => {
      const readError = new Error('Connection reset while reading');
      const reader = createMockReader([], {
        errorOnRead: readError,
      });

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          body: { getReader: () => reader } as any,
        }),
      );

      await expect(streamAgentRequest('/chat', {}, () => {})).rejects.toThrow(
        'Connection reset while reading',
      );

      expect(reader.cancel).toHaveBeenCalledWith(readError);
      expect(reader.releaseLock).toHaveBeenCalled();
    });

    it('suppresses error when reader.cancel() throws and still calls releaseLock()', async () => {
      const readError = new Error('Read aborted');
      const reader = createMockReader([], {
        errorOnRead: readError,
        cancelError: new Error('Cancel stream failed'),
      });

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          body: { getReader: () => reader } as any,
        }),
      );

      await expect(streamAgentRequest('/chat', {}, () => {})).rejects.toThrow(
        'Read aborted',
      );

      expect(reader.cancel).toHaveBeenCalled();
      expect(reader.releaseLock).toHaveBeenCalled();
    });

    it('suppresses error when reader.releaseLock() throws in finally', async () => {
      const reader = createMockReader(
        [new TextEncoder().encode('data: normal\n\n')],
        {
          releaseLockError: new Error('Lock release failed'),
        },
      );

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          body: { getReader: () => reader } as any,
        }),
      );

      const messages: SseMessage[] = [];
      await expect(
        streamAgentRequest('/chat', {}, (m) => messages.push(m)),
      ).resolves.toBeUndefined();

      expect(messages).toEqual([
        {
          event: 'message',
          data: 'normal',
        },
      ]);
      expect(reader.releaseLock).toHaveBeenCalled();
    });
  });
});
