import { HttpException, NotFoundException } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { AgentBusyError, AgentNotPendingError } from './agent/agent.runner';
import type { AgentConfig } from './agent/agent.config';
import type { AgentStreamEvent } from './agent/sse.frames';
import { SendAgentMessageDto } from './dtos/agent-message.dto';
import { ResumeAgentDto } from './dtos/agent-resume.dto';
import { SendChatbotMessageDto } from './dtos/send-chatbot-message.dto';

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

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('unowned-thread-id', {
        userId: null,
        app: 'USER',
      });
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

      await controllerWithoutKey.resume(
        req as any,
        res as any,
        't1',
        { decisions: [{ callId: 'c1', approve: true }] },
      );

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
      expect(mockRunner.deleteCheckpoints).toHaveBeenCalledWith('thread-del-id');
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

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('foreign-thread-id', {
        userId: 'user-del',
        app: 'USER',
      });
      expect(mockRunner.deleteCheckpoints).not.toHaveBeenCalled();
      expect(mockThreads.remove).not.toHaveBeenCalled();
    });
  });

  describe('Route 6: POST /chatbot/messages (legacy compatibility)', () => {
    it('the legacy route returns message, sessionId and sources', async () => {
      mockThreads.create.mockResolvedValue({ id: 'legacy-thread-new' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'Nước hoa ' } });
          params.sink({ event: 'token', data: { text: 'mùa hè tươi mát.' } });
          params.sink({
            event: 'sources',
            data: [{ id: 'sp-1', name: 'Nước hoa A' }],
          });
          params.sink({
            event: 'done',
            data: { usage: { totalTokens: 85 } },
          });
        },
      );

      const req = createFakeRequest(undefined);
      const dto: SendChatbotMessageDto = {
        prompt: 'Gợi ý nước hoa mùa hè',
        sessionId: 'chat_old_style_session_id',
      } as any;

      const result = await controller.sendMessage(req as any, dto);

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: null,
        app: 'USER',
      });
      expect(result).toEqual({
        message: 'Nước hoa mùa hè tươi mát.',
        model: 'gpt-4.1-mini',
        usage: { totalTokens: 85 },
        sessionId: 'legacy-thread-new',
        sources: [{ id: 'sp-1', name: 'Nước hoa A' }],
      });
    });

    it('an error event in the legacy route gives 502', async () => {
      mockThreads.create.mockResolvedValue({ id: 'legacy-err-thread' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({
            event: 'error',
            data: { message: 'OpenAI upstream error', code: 'AGENT_ERROR' },
          });
        },
      );

      const req = createFakeRequest(undefined);
      const dto: SendChatbotMessageDto = { prompt: 'Hello' } as any;

      await expect(controller.sendMessage(req as any, dto)).rejects.toThrow(
        HttpException,
      );

      try {
        await controller.sendMessage(req as any, dto);
        fail('Expected exception');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(502);
        expect(err.getResponse()).toEqual({
          statusCode: 502,
          message: 'OpenAI upstream error',
        });
      }
    });

    it('the legacy route uses existing thread if sessionId is a valid UUID v4', async () => {
      const validUuid = '0f5f4fe8-c1e2-43ec-9e2c-85f0f7b52d10';
      mockThreads.assertOwned.mockResolvedValue({
        id: validUuid,
        userId: null,
        app: 'USER',
      } as any);
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'Câu trả lời' } });
          params.sink({ event: 'done', data: { usage: null } });
        },
      );

      const req = createFakeRequest(undefined);
      const dto: SendChatbotMessageDto = {
        prompt: 'Tiếp tục',
        sessionId: validUuid,
      } as any;

      const result = await controller.sendMessage(req as any, dto);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith(validUuid, {
        userId: null,
        app: 'USER',
      });
      expect(mockThreads.create).not.toHaveBeenCalled();
      expect(result.sessionId).toBe(validUuid);
    });

    it('the legacy route handles confirm_required event', async () => {
      mockThreads.create.mockResolvedValue({ id: 'legacy-thread-confirm' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({
            event: 'confirm_required',
            data: {
              calls: [
                {
                  id: 'call_del',
                  name: 'cancel_order',
                  summary: 'Hủy đơn hàng',
                  risk: 'DESTRUCTIVE',
                },
              ],
            },
          });
        },
      );

      const req = createFakeRequest(undefined);
      const dto: SendChatbotMessageDto = { prompt: 'Hủy đơn hàng' } as any;

      const result = await controller.sendMessage(req as any, dto);

      expect(result.message).toBe('Cần xác nhận thao tác trước khi tiếp tục.');
      expect(result.pendingConfirm).toEqual([
        {
          id: 'call_del',
          name: 'cancel_order',
          summary: 'Hủy đơn hàng',
          risk: 'DESTRUCTIVE',
        },
      ]);
    });

    it('legacy route throws 503 when apiKey is missing', async () => {
      const controllerWithoutKey = new ChatbotController(
        { ...mockConfig, apiKey: null },
        mockRunner as any,
        mockThreads as any,
      );

      const req = createFakeRequest(undefined);
      const dto: SendChatbotMessageDto = { prompt: 'Hello' } as any;

      await expect(
        controllerWithoutKey.sendMessage(req as any, dto),
      ).rejects.toThrow(HttpException);

      try {
        await controllerWithoutKey.sendMessage(req as any, dto);
        fail('Expected exception');
      } catch (err: any) {
        expect(err.getStatus()).toBe(503);
        expect(err.getResponse()).toEqual({
          statusCode: 503,
          message: 'Trợ lý chưa được cấu hình',
        });
      }
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
