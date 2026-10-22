import { createHash } from 'crypto';
import { ChatbotController } from './chatbot.controller';
import { AgentBusyError } from './agent/agent.runner';
import type { AgentConfig } from './agent/agent.config';
import type { AgentStreamEvent } from './agent/sse.frames';
import { SendAgentMessageDto } from './dtos/agent-message.dto';
import { ResumeAgentDto } from './dtos/agent-resume.dto';

jest.mock(
  './agent/agent.providers',
  () => ({
    AGENT_CONFIG: Symbol('AGENT_CONFIG'),
  }),
  { virtual: true },
);

interface FakeResponse {
  headers: Record<string, string>;
  chunks: string[];
  statusCode: number;
  body: any;
  setHeader: jest.Mock;
  write: jest.Mock;
  flushHeaders: jest.Mock;
  status: jest.Mock;
  json: jest.Mock;
  end: jest.Mock;
  on: jest.Mock;
  removeListener: jest.Mock;
  emit: (event: string) => void;
  writableFinished: boolean;
}

function createFakeResponse(): FakeResponse {
  const res: any = {
    headers: {},
    chunks: [],
    statusCode: 200,
    body: null,
  };
  res.setHeader = jest.fn((name: string, value: string) => {
    res.headers[name.toLowerCase()] = value;
    return res;
  });
  res.write = jest.fn((chunk: string) => {
    res.chunks.push(chunk);
    return true;
  });
  res.flushHeaders = jest.fn();
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((body: any) => {
    res.body = body;
    return res;
  });
  const listeners: Record<string, Array<() => void>> = {};
  res.on = jest.fn((event: string, cb: () => void) => {
    (listeners[event] ??= []).push(cb);
    return res;
  });
  res.removeListener = jest.fn((event: string, cb: () => void) => {
    listeners[event] = (listeners[event] ?? []).filter((f) => f !== cb);
    return res;
  });
  res.emit = (event: string) => {
    (listeners[event] ?? []).forEach((f) => f());
  };
  res.writableFinished = false;
  res.end = jest.fn(() => {
    res.writableFinished = true;
    return res;
  });
  return res;
}

interface FakeRequest {
  headers?: Record<string, string | string[]>;
  user?: { id?: string; role?: string };
  header?: jest.Mock;
  on: jest.Mock;
  removeListener: jest.Mock;
  off: jest.Mock;
  emit: (event: string, ...args: any[]) => void;
}

function createFakeRequest(user?: { id?: string; role?: string }): FakeRequest {
  const listeners: Record<string, ((...args: any[]) => any)[]> = {};
  const req: any = {
    headers: {},
    user,
  };
  req.on = jest.fn((event: string, cb: (...args: any[]) => any) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(cb);
    return req;
  });
  req.removeListener = jest.fn((event: string, cb: (...args: any[]) => any) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((fn) => fn !== cb);
    }
    return req;
  });
  req.off = jest.fn((event: string, cb: (...args: any[]) => any) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((fn) => fn !== cb);
    }
    return req;
  });
  req.emit = (event: string, ...args: any[]) => {
    if (listeners[event]) {
      listeners[event].forEach((fn) => fn(...args));
    }
  };
  return req;
}

describe('ChatbotController (Coverage Gaps)', () => {
  let controller: ChatbotController;
  let mockRunner: {
    run: jest.Mock;
    assertResumable: jest.Mock;
    deleteCheckpoints: jest.Mock;
    isThreadRunning: jest.Mock;
    readTranscript: jest.Mock;
  };
  let mockThreads: {
    create: jest.Mock;
    assertOwned: jest.Mock;
    listForUser: jest.Mock;
    remove: jest.Mock;
  };
  let mockConfig: AgentConfig;

  beforeEach(() => {
    mockConfig = {
      apiKey: 'test-api-key',
      baseURL: null,
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      maxOutputTokens: 800,
      timeoutMs: 90000,
      maxSteps: 24,
      maxToolCallsPerTurn: 6,
      historyMaxMessages: 30,
      checkpointSchema: 'agent',
    };

    mockRunner = {
      run: jest.fn(),
      assertResumable: jest.fn().mockResolvedValue(undefined),
      deleteCheckpoints: jest.fn().mockResolvedValue(undefined),
      isThreadRunning: jest.fn().mockReturnValue(false),
      readTranscript: jest.fn(),
    };

    mockThreads = {
      create: jest.fn(),
      assertOwned: jest.fn(),
      listForUser: jest.fn(),
      remove: jest.fn(),
    };

    controller = new ChatbotController(
      mockConfig,
      mockRunner as any,
      mockThreads as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('clientContext propagation', () => {
    it('passes clientContext to tool context when provided in stream', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-stream-ctx' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();
      const clientContext = { currentRoute: '/cart', theme: 'dark' };
      const body: SendAgentMessageDto = {
        prompt: 'Help me checkout',
        clientContext: clientContext as any,
      };

      await controller.stream(req as any, res as any, body);

      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            clientContext,
          }),
        }),
      );
    });

    it('passes clientContext to tool context when provided in resume', async () => {
      const threadId = 'thread-resume-ctx';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'user-resume',
        app: 'USER',
      } as any);
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'resumed' } });
        },
      );

      const req = createFakeRequest({ id: 'user-resume', role: 'CUSTOMER' });
      const res = createFakeResponse();
      const clientContext = { page: '/orders' };
      const body: ResumeAgentDto = {
        decisions: [{ callId: 'call_1', approve: true }],
        clientContext: clientContext as any,
      };

      await controller.resume(req as any, res as any, threadId, body);

      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            clientContext,
          }),
        }),
      );
    });
  });

  describe('resume error handling gaps', () => {
    it('handles duck-typed AgentNotPendingError in resume (err?.name === "AgentNotPendingError")', async () => {
      const threadId = 'thread-duck-not-pending';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'user-1',
        app: 'USER',
      } as any);
      const duckErr = {
        name: 'AgentNotPendingError',
        message: 'Pending operation missing',
      };
      mockRunner.assertResumable.mockRejectedValue(duckErr);

      const req = createFakeRequest({ id: 'user-1', role: 'CUSTOMER' });
      const res = createFakeResponse();
      const body: ResumeAgentDto = {
        decisions: [{ callId: 'call_1', approve: true }],
      };

      await controller.resume(req as any, res as any, threadId, body);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 409,
        message: 'Không có thao tác nào đang chờ xác nhận',
      });
      expect(mockRunner.run).not.toHaveBeenCalled();
    });

    it('rethrows unexpected non-AgentNotPendingError error from assertResumable in resume', async () => {
      const threadId = 'thread-unexpected-err';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'user-1',
        app: 'USER',
      } as any);
      const unexpectedErr = new Error('Database connection failed');
      mockRunner.assertResumable.mockRejectedValue(unexpectedErr);

      const req = createFakeRequest({ id: 'user-1', role: 'CUSTOMER' });
      const res = createFakeResponse();
      const body: ResumeAgentDto = {
        decisions: [{ callId: 'call_1', approve: true }],
      };

      await expect(
        controller.resume(req as any, res as any, threadId, body),
      ).rejects.toThrow(unexpectedErr);
      expect(mockRunner.run).not.toHaveBeenCalled();
    });
  });

  describe('getRole gaps', () => {
    it('assigns ADMIN role to ctx when req.user.role is ADMIN', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-admin-1' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'Admin welcome' } });
        },
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();
      const body: SendAgentMessageDto = { prompt: 'Admin action' };

      await controller.stream(req as any, res as any, body);

      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            userId: 'admin-user-1',
            role: 'ADMIN',
          }),
        }),
      );
    });
  });

  describe('listThreads query gaps', () => {
    it('defaults limit to 20 when query is undefined in listThreads', async () => {
      mockThreads.listForUser.mockResolvedValue([]);

      const req = createFakeRequest({ id: 'user-logged', role: 'CUSTOMER' });
      const result = await controller.listThreads(req as any, undefined as any);

      expect(mockThreads.listForUser).toHaveBeenCalledWith(
        { userId: 'user-logged', app: 'USER' },
        20,
      );
      expect(result).toEqual([]);
    });
  });

  describe('runSseTurn onClose and error handling gaps', () => {
    it('does not abort runner when response emits close after writableFinished is already true', async () => {
      let runSignal: AbortSignal | undefined;
      mockThreads.create.mockResolvedValue({ id: 'stream-already-finished' });
      mockRunner.run.mockImplementation(
        async (params: { signal?: AbortSignal; sink: any }) => {
          runSignal = params.signal;
          return new Promise((resolve) => setTimeout(resolve, 30));
        },
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      const streamPromise = controller.stream(req as any, res as any, {
        prompt: 'Hi',
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      res.writableFinished = true;
      res.emit('close');
      await streamPromise;

      expect(runSignal?.aborted).toBe(false);
    });

    it('cleans up and rethrows when runner.run throws a synchronous non-AgentBusyError', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-sync-error' });
      const syncErr = new Error('Runner initialization failed');
      mockRunner.run.mockImplementation(() => {
        throw syncErr;
      });

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      await expect(
        controller.stream(req as any, res as any, { prompt: 'Hi' }),
      ).rejects.toThrow(syncErr);

      expect(res.removeListener).toHaveBeenCalledWith(
        'close',
        expect.any(Function),
      );
    });

    it('returns 409 when runner.run throws synchronous duck-typed AgentBusyError (err?.name === "AgentBusyError")', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-duck-busy' });
      const duckBusy = { name: 'AgentBusyError', message: 'Busy running' };
      mockRunner.run.mockImplementation(() => {
        throw duckBusy;
      });

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 409,
        message: 'Cuộc trò chuyện đang được xử lý',
      });
    });

    it('rethrows AgentBusyError if writer was already created before error was thrown', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-busy-after-writer' });
      mockRunner.run.mockImplementation(
        (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'start' } });
          throw new AgentBusyError('Busy after write');
        },
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      await expect(
        controller.stream(req as any, res as any, { prompt: 'Hi' }),
      ).rejects.toThrow(AgentBusyError);
    });

    it('does not throw in finally block if writer is null and res.end is not a function', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-no-res-end' });
      mockRunner.run.mockImplementation(async () => {});

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();
      delete (res as any).end;

      await expect(
        controller.stream(req as any, res as any, { prompt: 'Hi' }),
      ).resolves.not.toThrow();
    });
  });

  describe('getActor session key and header extraction gaps', () => {
    it('extracts session key via req.header() function when available', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-h-fn' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const sessionKey = 'session-key-from-header-function-123';
      const expectedHash = createHash('sha256')
        .update(sessionKey)
        .digest('hex');

      const req = createFakeRequest(undefined);
      req.header = jest.fn((name: string) => {
        if (name.toLowerCase() === 'x-chat-session') {
          return sessionKey;
        }
        return undefined;
      });
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(req.header).toHaveBeenCalledWith('x-chat-session');
      expect(mockThreads.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionKeyHash: expectedHash,
        }),
      );
    });

    it('extracts session key from req.headers["X-Chat-Session"] (capitalized key)', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-cap-header' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const sessionKey = 'session-key-from-capital-header-123';
      const expectedHash = createHash('sha256')
        .update(sessionKey)
        .digest('hex');

      const req = createFakeRequest(undefined);
      req.headers = {
        'X-Chat-Session': sessionKey,
      };
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(mockThreads.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionKeyHash: expectedHash,
        }),
      );
    });

    it('extracts session key by searching headers case-insensitively using find callback', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-find-header' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const sessionKey = 'session-key-from-find-entry-12345';
      const expectedHash = createHash('sha256')
        .update(sessionKey)
        .digest('hex');

      const req = createFakeRequest(undefined);
      req.headers = {
        'content-type': 'application/json',
        'x-ChAt-SeSsIoN': sessionKey,
      };
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(mockThreads.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionKeyHash: expectedHash,
        }),
      );
    });

    it('exercises find callback returning undefined when no header matches x-chat-session', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-no-match-header' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const req = createFakeRequest(undefined);
      req.headers = {
        accept: 'text/plain',
        'user-agent': 'jest-test',
      };
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: null,
        app: 'USER',
      });
    });

    it('extracts first element when session key header is an array of strings', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-arr-header' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const sessionKey = 'session-key-array-first-element-123';
      const expectedHash = createHash('sha256')
        .update(sessionKey)
        .digest('hex');

      const req = createFakeRequest(undefined);
      req.headers = {
        'x-chat-session': [sessionKey, 'secondary-key-ignored'],
      };
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(mockThreads.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionKeyHash: expectedHash,
        }),
      );
    });

    it('ignores session key when length is less than 16 characters', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-short-key' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const req = createFakeRequest(undefined);
      req.headers = {
        'x-chat-session': 'too-short',
      };
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: null,
        app: 'USER',
      });
    });

    it('ignores session key when length is greater than 128 characters', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-long-key' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const req = createFakeRequest(undefined);
      req.headers = {
        'x-chat-session': 'a'.repeat(129),
      };
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: null,
        app: 'USER',
      });
    });

    it('defaults userId to null when req.user has no id', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-user-no-id' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const req = createFakeRequest({ id: undefined as any });
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: null,
        app: 'USER',
      });
    });

    it('handles request when req.headers is undefined', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-no-headers' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'ok' } });
        },
      );

      const req = createFakeRequest(undefined);
      delete (req as any).headers;
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: null,
        app: 'USER',
      });
    });
  });

  describe('config guard gaps', () => {
    it('returns 503 in stream when config is null or undefined', async () => {
      const controllerWithNullConfig = new ChatbotController(
        null as any,
        mockRunner as any,
        mockThreads as any,
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      await controllerWithNullConfig.stream(req as any, res as any, {
        prompt: 'Hi',
      });

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 503,
        message: 'Trợ lý chưa được cấu hình',
      });
    });

    it('returns 503 in resume when config is null or undefined', async () => {
      const controllerWithNullConfig = new ChatbotController(
        null as any,
        mockRunner as any,
        mockThreads as any,
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      await controllerWithNullConfig.resume(req as any, res as any, 't-1', {
        decisions: [{ callId: 'c1', approve: true }],
      });

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 503,
        message: 'Trợ lý chưa được cấu hình',
      });
    });
  });
});
