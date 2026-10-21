import { ConflictException, NotFoundException } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { AgentBusyError, AgentNotPendingError } from './agent/agent.runner';
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
  headers: Record<string, string>;
  user?: { id: string; role?: string };
  on: jest.Mock;
  removeListener: jest.Mock;
  off: jest.Mock;
  emit: (event: string, ...args: any[]) => void;
}

function createFakeRequest(user?: { id: string; role?: string }): FakeRequest {
  const listeners: Record<string, Function[]> = {};
  const req: any = {
    headers: {},
    user,
  };
  req.on = jest.fn((event: string, cb: Function) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(cb);
    return req;
  });
  req.removeListener = jest.fn((event: string, cb: Function) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((fn) => fn !== cb);
    }
    return req;
  });
  req.off = jest.fn((event: string, cb: Function) => {
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

describe('ChatbotController', () => {
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

  describe('Route 1: POST /chatbot/stream', () => {
    it('stream with no token creates a thread and sends the thread event first', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-created-1' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({
            event: 'thread',
            data: { threadId: 'thread-created-1' },
          });
          params.sink({ event: 'token', data: { text: 'Xin chào' } });
          params.sink({ event: 'done', data: { usage: null } });
        },
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();
      const body: SendAgentMessageDto = { prompt: 'Hello' };

      await controller.stream(req as any, res as any, body);

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: null,
        app: 'USER',
      });
      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            userId: null,
            role: 'GUEST',
            app: 'USER',
            threadId: 'thread-created-1',
          }),
          message: 'Hello',
        }),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream; charset=utf-8',
      );
      expect(res.write).toHaveBeenCalled();
      const firstChunk = res.write.mock.calls[0][0];
      expect(firstChunk).toContain('event: thread');
      expect(firstChunk).toContain('"threadId":"thread-created-1"');
      expect(res.end).toHaveBeenCalled();
    });

    it('a provided threadId that is not owned gives 404 (assertOwned throws) and runner.run is not called', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();
      const body: SendAgentMessageDto = {
        prompt: 'Hello',
        threadId: 'unowned-thread-id',
      };

      await expect(
        controller.stream(req as any, res as any, body),
      ).rejects.toThrow(NotFoundException);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith(
        'unowned-thread-id',
        {
          userId: null,
          app: 'USER',
        },
      );
      expect(mockRunner.run).not.toHaveBeenCalled();
    });

    it('AgentBusyError before any event gives 409 JSON', async () => {
      mockThreads.create.mockResolvedValue({ id: 'busy-thread-id' });
      mockRunner.run.mockImplementation(() => {
        throw new AgentBusyError('Cuộc trò chuyện đang được xử lý');
      });

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();
      const body: SendAgentMessageDto = { prompt: 'Hello' };

      await controller.stream(req as any, res as any, body);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 409,
        message: 'Cuộc trò chuyện đang được xử lý',
      });
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.write).not.toHaveBeenCalled();
    });

    it('no apiKey gives 503 and runner.run is not called', async () => {
      const controllerWithoutKey = new ChatbotController(
        { ...mockConfig, apiKey: null },
        mockRunner as any,
        mockThreads as any,
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();
      const body: SendAgentMessageDto = { prompt: 'Hello' };

      await controllerWithoutKey.stream(req as any, res as any, body);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 503,
        message: 'Trợ lý chưa được cấu hình',
      });
      expect(mockRunner.run).not.toHaveBeenCalled();
      expect(mockThreads.create).not.toHaveBeenCalled();
    });

    it('stream route uses provided threadId if owned', async () => {
      const ownedId = 'owned-thread-id';
      mockThreads.assertOwned.mockResolvedValue({
        id: ownedId,
        userId: 'user-1',
        app: 'USER',
      } as any);
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'OK' } });
        },
      );

      const req = createFakeRequest({ id: 'user-1', role: 'CUSTOMER' });
      const res = createFakeResponse();
      const body: SendAgentMessageDto = { prompt: 'Hello', threadId: ownedId };

      await controller.stream(req as any, res as any, body);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith(ownedId, {
        userId: 'user-1',
        app: 'USER',
      });
      expect(mockThreads.create).not.toHaveBeenCalled();
      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            userId: 'user-1',
            role: 'CUSTOMER',
            threadId: ownedId,
          }),
        }),
      );
    });

    it('aborts runner when the response closes before it finishes', async () => {
      let runSignal: AbortSignal | undefined;
      mockThreads.create.mockResolvedValue({ id: 'stream-abort-thread' });
      mockRunner.run.mockImplementation(
        async (params: { signal?: AbortSignal; sink: any }) => {
          runSignal = params.signal;
          params.sink({
            event: 'thread',
            data: { threadId: 'stream-abort-thread' },
          });
          return new Promise((resolve) => setTimeout(resolve, 50));
        },
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      const streamPromise = controller.stream(req as any, res as any, {
        prompt: 'Hi',
      });
      // Let the thread be created and the turn start before the client leaves.
      await new Promise((resolve) => setTimeout(resolve, 0));
      res.emit('close');
      await streamPromise;

      expect(runSignal?.aborted).toBe(true);
      expect(res.end).toHaveBeenCalled();
    });

    it('does not abort when the request body is read and only the request emits close', async () => {
      let runSignal: AbortSignal | undefined;
      mockThreads.create.mockResolvedValue({ id: 'stream-keep-thread' });
      mockRunner.run.mockImplementation(
        async (params: { signal?: AbortSignal; sink: any }) => {
          runSignal = params.signal;
          return new Promise((resolve) => setTimeout(resolve, 20));
        },
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      const streamPromise = controller.stream(req as any, res as any, {
        prompt: 'Hi',
      });
      req.emit('close');
      await streamPromise;

      expect(runSignal?.aborted).toBe(false);
    });

    it('stream route sends error event when runner rejects unexpectedly', async () => {
      mockThreads.create.mockResolvedValue({ id: 'stream-err-thread' });
      mockRunner.run.mockImplementation(async () => {
        throw new Error('Graph failure');
      });

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hi' });

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining('event: error'),
      );
      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining(
          'Trợ lý tạm thời không phản hồi, vui lòng thử lại sau.',
        ),
      );
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('Route 2: POST /chatbot/threads/:threadId/resume', () => {
    it('the resume route calls runner.run with resume.decisions', async () => {
      const threadId = 'thread-to-resume';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'user-resume',
        app: 'USER',
      } as any);
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'Tiếp tục xử lý' } });
          params.sink({ event: 'done', data: { usage: null } });
        },
      );

      const req = createFakeRequest({ id: 'user-resume', role: 'CUSTOMER' });
      const res = createFakeResponse();
      const body: ResumeAgentDto = {
        decisions: [
          { callId: 'call_1', approve: true },
          { callId: 'call_2', approve: false },
        ],
      };

      await controller.resume(req as any, res as any, threadId, body);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith(threadId, {
        userId: 'user-resume',
        app: 'USER',
      });
      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            userId: 'user-resume',
            role: 'CUSTOMER',
            app: 'USER',
            threadId,
          }),
          resume: {
            decisions: [
              { callId: 'call_1', approve: true },
              { callId: 'call_2', approve: false },
            ],
          },
        }),
      );
      expect(res.end).toHaveBeenCalled();
    });

    it('resume route with no apiKey gives 503', async () => {
      const controllerWithoutKey = new ChatbotController(
        { ...mockConfig, apiKey: null },
        mockRunner as any,
        mockThreads as any,
      );

      const req = createFakeRequest(undefined);
      const res = createFakeResponse();

      await controllerWithoutKey.resume(req as any, res as any, 't1', {
        decisions: [{ callId: 'c1', approve: true }],
      });

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 503,
        message: 'Trợ lý chưa được cấu hình',
      });
      expect(mockRunner.run).not.toHaveBeenCalled();
    });

    it('the resume route answers 409 JSON and does not start a run when assertResumable rejects with AgentNotPendingError', async () => {
      const threadId = 'thread-not-pending';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'user-resume',
        app: 'USER',
      } as any);
      mockRunner.assertResumable.mockRejectedValue(
        new AgentNotPendingError('Không có thao tác nào đang chờ xác nhận'),
      );

      const req = createFakeRequest({ id: 'user-resume', role: 'CUSTOMER' });
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
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.write).not.toHaveBeenCalled();
    });

    it('the resume route passes the decision call ids to assertResumable', async () => {
      const threadId = 'thread-to-resume';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'user-resume',
        app: 'USER',
      } as any);

      const req = createFakeRequest({ id: 'user-resume', role: 'CUSTOMER' });
      const res = createFakeResponse();
      const body: ResumeAgentDto = {
        decisions: [
          { callId: 'call_1', approve: true },
          { callId: 'call_2', approve: false },
        ],
      };

      await controller.resume(req as any, res as any, threadId, body);

      expect(mockRunner.assertResumable).toHaveBeenCalledWith(threadId, [
        'call_1',
        'call_2',
      ]);
    });
  });

  describe('Route 3: GET /chatbot/threads', () => {
    it('GET threads for a guest returns [] without calling listForUser for a null user', async () => {
      const req = createFakeRequest(undefined);
      const result = await controller.listThreads(req as any, { limit: 20 });

      expect(result).toEqual([]);
      expect(mockThreads.listForUser).not.toHaveBeenCalled();
    });

    it('GET threads for logged in user calls listForUser with default limit 20', async () => {
      const threadsData = [
        {
          id: 't-1',
          title: 'Cuộc trò chuyện 1',
          userId: 'user-logged',
          app: 'USER',
        },
      ];
      mockThreads.listForUser.mockResolvedValue(threadsData);

      const req = createFakeRequest({ id: 'user-logged', role: 'CUSTOMER' });
      const result = await controller.listThreads(req as any, {});

      expect(mockThreads.listForUser).toHaveBeenCalledWith(
        { userId: 'user-logged', app: 'USER' },
        20,
      );
      expect(result).toEqual(threadsData);
    });

    it('GET threads respects query limit', async () => {
      mockThreads.listForUser.mockResolvedValue([]);

      const req = createFakeRequest({ id: 'user-logged', role: 'CUSTOMER' });
      await controller.listThreads(req as any, { limit: 5 });

      expect(mockThreads.listForUser).toHaveBeenCalledWith(
        { userId: 'user-logged', app: 'USER' },
        5,
      );
    });
  });

  describe('Route 4: GET /chatbot/threads/:threadId', () => {
    it('GET /chatbot/threads/:threadId returns thread details using assertOwned', async () => {
      const date = new Date();
      mockThreads.assertOwned.mockResolvedValue({
        id: 'thread-detail-1',
        title: 'Tiêu đề cuộc trò chuyện',
        app: 'USER',
        totalTokens: 150,
        createdAt: date,
        updatedAt: date,
        userId: 'user-owner',
      });

      const req = createFakeRequest({ id: 'user-owner', role: 'CUSTOMER' });
      const result = await controller.getThread(req as any, 'thread-detail-1');

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('thread-detail-1', {
        userId: 'user-owner',
        app: 'USER',
      });
      expect(result).toEqual({
        id: 'thread-detail-1',
        title: 'Tiêu đề cuộc trò chuyện',
        app: 'USER',
        totalTokens: 150,
        createdAt: date,
        updatedAt: date,
      });
    });

    it('GET /chatbot/threads/:threadId throws 404 when not owned', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'other-user', role: 'CUSTOMER' });

      await expect(
        controller.getThread(req as any, 'thread-detail-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Route: GET /chatbot/threads/:threadId/messages', () => {
    it("the owner gets the runner's messages in order, and readTranscript is called with the same threadId", async () => {
      const messages = [
        { id: '1', role: 'user', content: 'Tìm sơn màu đen' },
        {
          id: '2',
          role: 'assistant',
          content: 'Shop có sơn màu đen mờ và đen bóng.',
        },
      ];
      mockThreads.assertOwned.mockResolvedValue({
        id: 'thread-detail-1',
        title: 'Tìm sơn màu đen',
        app: 'USER',
        totalTokens: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-owner-1',
      });
      mockRunner.readTranscript.mockResolvedValue(messages);

      const req = createFakeRequest({ id: 'user-owner-1', role: 'CUSTOMER' });
      const result = await controller.getMessages(
        req as any,
        'thread-detail-1',
      );

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('thread-detail-1', {
        userId: 'user-owner-1',
        app: 'USER',
      });
      expect(mockRunner.readTranscript).toHaveBeenCalledWith('thread-detail-1');
      expect(result).toEqual(messages);
    });

    it('guest with x-chat-session owner key gets saved messages if owned', async () => {
      const messages = [
        { id: '1', role: 'user', content: 'Chào shop' },
        { id: '2', role: 'assistant', content: 'Chào bạn!' },
      ];
      mockThreads.assertOwned.mockResolvedValue({
        id: 'guest-thread-1',
        app: 'USER',
        totalTokens: 50,
      });
      mockRunner.readTranscript.mockResolvedValue(messages);

      const req = createFakeRequest(undefined);
      req.headers['x-chat-session'] = '0123456789abcdef0123456789abcdef';

      const result = await controller.getMessages(req as any, 'guest-thread-1');

      expect(mockThreads.assertOwned).toHaveBeenCalledWith(
        'guest-thread-1',
        expect.objectContaining({
          userId: null,
          app: 'USER',
          sessionKeyHash: expect.any(String),
        }),
      );
      expect(mockRunner.readTranscript).toHaveBeenCalledWith('guest-thread-1');
      expect(result).toEqual(messages);
    });

    it('a thread not owned gives 404 and readTranscript is not called', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'other-user', role: 'CUSTOMER' });

      await expect(
        controller.getMessages(req as any, 'thread-detail-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('thread-detail-1', {
        userId: 'other-user',
        app: 'USER',
      });
      expect(mockRunner.readTranscript).not.toHaveBeenCalled();
    });
  });

  describe('Route 5: DELETE /chatbot/threads/:threadId', () => {
    it('DELETE returns { deleted: true }', async () => {
      mockThreads.remove.mockResolvedValue(undefined);

      const req = createFakeRequest({ id: 'user-del', role: 'CUSTOMER' });
      const result = await controller.deleteThread(req as any, 'thread-del-id');

      expect(mockThreads.remove).toHaveBeenCalledWith('thread-del-id', {
        userId: 'user-del',
        app: 'USER',
      });
      expect(result).toEqual({ deleted: true });
    });

    it('DELETE throws 404 if thread not owned', async () => {
      mockThreads.remove.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'user-del', role: 'CUSTOMER' });

      await expect(
        controller.deleteThread(req as any, 'thread-del-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('the delete route calls assertOwned before deleteCheckpoints, and deleteCheckpoints before threads.remove', async () => {
      const order: string[] = [];
      mockThreads.assertOwned.mockImplementation(async () => {
        order.push('assertOwned');
      });
      mockRunner.deleteCheckpoints.mockImplementation(async () => {
        order.push('deleteCheckpoints');
      });
      mockThreads.remove.mockImplementation(async () => {
        order.push('remove');
      });

      const req = createFakeRequest({ id: 'user-del', role: 'CUSTOMER' });
      const result = await controller.deleteThread(req as any, 'thread-del-id');

      expect(order).toEqual(['assertOwned', 'deleteCheckpoints', 'remove']);
      expect(mockThreads.assertOwned).toHaveBeenCalledWith('thread-del-id', {
        userId: 'user-del',
        app: 'USER',
      });
      expect(mockRunner.deleteCheckpoints).toHaveBeenCalledWith(
        'thread-del-id',
      );
      expect(mockThreads.remove).toHaveBeenCalledWith('thread-del-id', {
        userId: 'user-del',
        app: 'USER',
      });
      expect(result).toEqual({ deleted: true });
    });

    it('a foreign thread answers 404 on delete and deleteCheckpoints is not called', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'user-del', role: 'CUSTOMER' });

      await expect(
        controller.deleteThread(req as any, 'foreign-thread-id'),
      ).rejects.toThrow(NotFoundException);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith(
        'foreign-thread-id',
        {
          userId: 'user-del',
          app: 'USER',
        },
      );
      expect(mockRunner.deleteCheckpoints).not.toHaveBeenCalled();
      expect(mockThreads.remove).not.toHaveBeenCalled();
    });

    it('throws 409 ConflictException when thread is running and does not call deleteCheckpoints or remove', async () => {
      mockRunner.isThreadRunning.mockReturnValue(true);

      const req = createFakeRequest({ id: 'user-del', role: 'CUSTOMER' });

      await expect(
        controller.deleteThread(req as any, 'running-thread-id'),
      ).rejects.toThrow(ConflictException);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith(
        'running-thread-id',
        {
          userId: 'user-del',
          app: 'USER',
        },
      );
      expect(mockRunner.isThreadRunning).toHaveBeenCalledWith(
        'running-thread-id',
      );
      expect(mockRunner.deleteCheckpoints).not.toHaveBeenCalled();
      expect(mockThreads.remove).not.toHaveBeenCalled();
    });
  });

  describe('Route names and IDOR check', () => {
    it('the controller has no route named sessions (check the route metadata by reading the method names only)', () => {
      const methodNames = Object.getOwnPropertyNames(
        ChatbotController.prototype,
      ).filter((name) => name !== 'constructor');

      for (const name of methodNames) {
        expect(name.toLowerCase()).not.toContain('session');
      }
    });
  });
});
