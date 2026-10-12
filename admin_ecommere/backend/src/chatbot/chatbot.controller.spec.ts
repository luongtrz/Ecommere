import { NotFoundException } from '@nestjs/common';
import { AdminChatbotController } from './chatbot.controller';
import { AgentBusyError, AgentNotPendingError } from './agent/agent.runner';
import type { AgentConfig } from './agent/agent.config';
import type { AgentStreamEvent } from './agent/sse.frames';
import { SendAgentMessageDto } from './dtos/agent-message.dto';
import { ResumeAgentDto } from './dtos/agent-resume.dto';

jest.mock(
  './agent/admin.providers',
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

describe('AdminChatbotController', () => {
  let controller: AdminChatbotController;
  let mockRunner: {
    run: jest.Mock;
    readTranscript: jest.Mock;
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
      readTranscript: jest.fn(),
      assertResumable: jest.fn().mockResolvedValue(undefined),
      deleteCheckpoints: jest.fn().mockResolvedValue(undefined),
    };

    mockThreads = {
      create: jest.fn(),
      assertOwned: jest.fn(),
      listForUser: jest.fn(),
      remove: jest.fn(),
    };

    controller = new AdminChatbotController(
      mockConfig,
      mockRunner as any,
      mockThreads as any,
    );
  });

  describe('Route 1: POST /admin/chatbot/stream', () => {
    it('stream creates a thread for an admin and sends the thread event first', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-admin-1' });
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({
            event: 'thread',
            data: { threadId: 'thread-admin-1' },
          });
          params.sink({ event: 'token', data: { text: 'Báo cáo bán hàng' } });
          params.sink({ event: 'done', data: { usage: null } });
        },
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();
      const body: SendAgentMessageDto = { prompt: 'Thống kê doanh thu' };

      await controller.stream(req as any, res as any, body);

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            userId: 'admin-user-1',
            role: 'ADMIN',
            app: 'ADMIN',
            threadId: 'thread-admin-1',
          }),
          message: 'Thống kê doanh thu',
        }),
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream; charset=utf-8',
      );
      expect(res.headers['content-type']).toBe(
        'text/event-stream; charset=utf-8',
      );
      expect(res.write).toHaveBeenCalled();
      const firstChunk = res.write.mock.calls[0][0];
      expect(firstChunk).toContain('event: thread');
      expect(firstChunk).toContain('"threadId":"thread-admin-1"');
      expect(res.end).toHaveBeenCalled();
    });

    it('a foreign threadId gives 404 and the runner is not called', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();
      const body: SendAgentMessageDto = {
        prompt: 'Thống kê',
        threadId: 'foreign-thread-id',
      };

      await expect(
        controller.stream(req as any, res as any, body),
      ).rejects.toThrow(NotFoundException);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('foreign-thread-id', {
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(mockRunner.run).not.toHaveBeenCalled();
    });

    it('a busy thread gives 409 JSON before any event', async () => {
      mockThreads.create.mockResolvedValue({ id: 'busy-thread-id' });
      mockRunner.run.mockImplementation(() => {
        throw new AgentBusyError('Cuộc trò chuyện đang được xử lý');
      });

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();
      const body: SendAgentMessageDto = { prompt: 'Thống kê' };

      await controller.stream(req as any, res as any, body);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 409,
        message: 'Cuộc trò chuyện đang được xử lý',
      });
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(res.write).not.toHaveBeenCalled();
    });

    it('a missing key gives 503', async () => {
      const controllerWithoutKey = new AdminChatbotController(
        { ...mockConfig, apiKey: null },
        mockRunner as any,
        mockThreads as any,
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();
      const body: SendAgentMessageDto = { prompt: 'Thống kê' };

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
        userId: 'admin-user-1',
        app: 'ADMIN',
      } as any);
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'OK' } });
        },
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();
      const body: SendAgentMessageDto = { prompt: 'Tiếp tục', threadId: ownedId };

      await controller.stream(req as any, res as any, body);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith(ownedId, {
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(mockThreads.create).not.toHaveBeenCalled();
      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            userId: 'admin-user-1',
            role: 'ADMIN',
            app: 'ADMIN',
            threadId: ownedId,
          }),
        }),
      );
    });

    it('stream route includes clientContext in ctx if provided', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-admin-ctx' });
      mockRunner.run.mockImplementation(async () => {});

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();
      const body: SendAgentMessageDto = {
        prompt: 'Thống kê',
        clientContext: { path: '/admin/orders' } as any,
      };

      await controller.stream(req as any, res as any, body);

      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            userId: 'admin-user-1',
            role: 'ADMIN',
            app: 'ADMIN',
            threadId: 'thread-admin-ctx',
            clientContext: { path: '/admin/orders' },
          }),
        }),
      );
    });
  });

  describe('Route 2: POST /admin/chatbot/threads/:threadId/resume', () => {
    it('the resume route passes the decisions', async () => {
      const threadId = 'thread-to-resume';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'admin-user-1',
        app: 'ADMIN',
      } as any);
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          params.sink({ event: 'token', data: { text: 'Tiếp tục xử lý' } });
          params.sink({ event: 'done', data: { usage: null } });
        },
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();
      const body: ResumeAgentDto = {
        decisions: [
          { callId: 'call_1', approve: true },
          { callId: 'call_2', approve: false },
        ],
      };

      await controller.resume(req as any, res as any, threadId, body);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith(threadId, {
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: expect.objectContaining({
            userId: 'admin-user-1',
            role: 'ADMIN',
            app: 'ADMIN',
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

    it('resume route with missing key gives 503', async () => {
      const controllerWithoutKey = new AdminChatbotController(
        { ...mockConfig, apiKey: null },
        mockRunner as any,
        mockThreads as any,
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();

      await controllerWithoutKey.resume(
        req as any,
        res as any,
        'thread-1',
        { decisions: [{ callId: 'call_1', approve: true }] },
      );

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 503,
        message: 'Trợ lý chưa được cấu hình',
      });
      expect(mockRunner.run).not.toHaveBeenCalled();
    });

    it('resume throws 404 for unowned thread', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();

      await expect(
        controller.resume(req as any, res as any, 'foreign-id', {
          decisions: [{ callId: 'call_1', approve: true }],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockRunner.run).not.toHaveBeenCalled();
    });

    it('the resume route answers 409 JSON and does not start a run when assertResumable rejects with AgentNotPendingError', async () => {
      const threadId = 'thread-not-pending';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'admin-user-1',
        app: 'ADMIN',
      } as any);
      mockRunner.assertResumable.mockRejectedValue(
        new AgentNotPendingError('Không có thao tác nào đang chờ xác nhận'),
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
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
        userId: 'admin-user-1',
        app: 'ADMIN',
      } as any);

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
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

  describe('Route 3: GET /admin/chatbot/threads', () => {
    it('the thread list route calls the thread service with the admin actor (app ADMIN)', async () => {
      const threadsData = [
        {
          id: 't-1',
          title: 'Cuộc trò chuyện 1',
          userId: 'admin-user-1',
          app: 'ADMIN',
        },
      ];
      mockThreads.listForUser.mockResolvedValue(threadsData);

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const result = await controller.listThreads(req as any, {});

      expect(mockThreads.listForUser).toHaveBeenCalledWith(
        { userId: 'admin-user-1', app: 'ADMIN' },
        20,
      );
      expect(result).toEqual(threadsData);
    });

    it('GET threads respects query limit', async () => {
      mockThreads.listForUser.mockResolvedValue([]);

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      await controller.listThreads(req as any, { limit: 5 });

      expect(mockThreads.listForUser).toHaveBeenCalledWith(
        { userId: 'admin-user-1', app: 'ADMIN' },
        5,
      );
    });

    it('GET threads returns empty array if actor has no userId', async () => {
      const req = createFakeRequest(undefined);
      const result = await controller.listThreads(req as any, {});

      expect(result).toEqual([]);
      expect(mockThreads.listForUser).not.toHaveBeenCalled();
    });
  });

  describe('Route 4: GET /admin/chatbot/threads/:threadId', () => {
    it('the thread detail route calls the thread service with the admin actor (app ADMIN)', async () => {
      const date = new Date();
      mockThreads.assertOwned.mockResolvedValue({
        id: 'thread-detail-1',
        title: 'Báo cáo bán hàng',
        app: 'ADMIN',
        totalTokens: 250,
        createdAt: date,
        updatedAt: date,
        userId: 'admin-user-1',
      });

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const result = await controller.getThread(req as any, 'thread-detail-1');

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('thread-detail-1', {
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(result).toEqual({
        id: 'thread-detail-1',
        title: 'Báo cáo bán hàng',
        app: 'ADMIN',
        totalTokens: 250,
        createdAt: date,
        updatedAt: date,
      });
    });

    it('GET threads/:threadId throws 404 when not owned', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'other-user', role: 'ADMIN' });

      await expect(
        controller.getThread(req as any, 'thread-detail-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /admin/chatbot/threads/:threadId/messages', () => {
    it("the owner gets the runner's messages in order, and readTranscript is called with the same threadId", async () => {
      const messages = [
        { id: '1', role: 'user', content: 'Thống kê doanh thu' },
        { id: '2', role: 'assistant', content: 'Doanh thu tháng này đạt 50 triệu.' },
      ];
      mockThreads.assertOwned.mockResolvedValue({
        id: 'thread-detail-1',
        title: 'Thống kê doanh thu',
        app: 'ADMIN',
        totalTokens: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'admin-user-1',
      });
      mockRunner.readTranscript.mockResolvedValue(messages);

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const result = await controller.getMessages(req as any, 'thread-detail-1');

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('thread-detail-1', {
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(mockRunner.readTranscript).toHaveBeenCalledWith('thread-detail-1');
      expect(result).toEqual(messages);
    });

    it('a thread owned by another admin gives 404 and readTranscript is not called', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'other-user', role: 'ADMIN' });

      await expect(
        controller.getMessages(req as any, 'thread-detail-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('thread-detail-1', {
        userId: 'other-user',
        app: 'ADMIN',
      });
      expect(mockRunner.readTranscript).not.toHaveBeenCalled();
    });
  });

  describe('Route 5: DELETE /admin/chatbot/threads/:threadId', () => {
    it('the delete route calls the thread service with the admin actor (app ADMIN)', async () => {
      mockThreads.remove.mockResolvedValue(undefined);

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const result = await controller.deleteThread(req as any, 'thread-del-id');

      expect(mockThreads.remove).toHaveBeenCalledWith('thread-del-id', {
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(result).toEqual({ deleted: true });
    });

    it('DELETE threads/:threadId throws 404 when not owned', async () => {
      mockThreads.remove.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });

      await expect(
        controller.deleteThread(req as any, 'unowned-id'),
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

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const result = await controller.deleteThread(req as any, 'thread-del-id');

      expect(order).toEqual(['assertOwned', 'deleteCheckpoints', 'remove']);
      expect(mockThreads.assertOwned).toHaveBeenCalledWith('thread-del-id', {
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(mockRunner.deleteCheckpoints).toHaveBeenCalledWith('thread-del-id');
      expect(mockThreads.remove).toHaveBeenCalledWith('thread-del-id', {
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(result).toEqual({ deleted: true });
    });

    it('a foreign thread answers 404 on delete and deleteCheckpoints is not called', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Không tìm thấy cuộc trò chuyện'),
      );

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });

      await expect(
        controller.deleteThread(req as any, 'foreign-thread-id'),
      ).rejects.toThrow(NotFoundException);

      expect(mockThreads.assertOwned).toHaveBeenCalledWith('foreign-thread-id', {
        userId: 'admin-user-1',
        app: 'ADMIN',
      });
      expect(mockRunner.deleteCheckpoints).not.toHaveBeenCalled();
      expect(mockThreads.remove).not.toHaveBeenCalled();
    });
  });

  describe('Cancellation', () => {
    it('cancellation happens when the response closes early and not when only the request emits close', async () => {
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

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();

      const streamPromise = controller.stream(req as any, res as any, {
        prompt: 'Hi',
      });
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

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
      const res = createFakeResponse();

      const streamPromise = controller.stream(req as any, res as any, {
        prompt: 'Hi',
      });
      req.emit('close');
      await streamPromise;

      expect(runSignal?.aborted).toBe(false);
    });

    it('sends error event when runner rejects unexpectedly', async () => {
      mockThreads.create.mockResolvedValue({ id: 'stream-err-thread' });
      mockRunner.run.mockImplementation(async () => {
        throw new Error('Graph failure');
      });

      const req = createFakeRequest({ id: 'admin-user-1', role: 'ADMIN' });
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
});
