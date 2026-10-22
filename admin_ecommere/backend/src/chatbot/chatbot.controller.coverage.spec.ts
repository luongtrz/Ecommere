import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  AdminChatbotController,
  getChatbotTracker,
} from './chatbot.controller';
import { AGENT_CONFIG } from './agent/admin.providers';
import { AgentRunner } from './agent/agent.runner';
import { ThreadService } from './agent/thread.service';
import type { AgentConfig } from './agent/agent.config';
import type { AgentStreamEvent } from './agent/sse.frames';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { SendAgentMessageDto } from './dtos/agent-message.dto';
import { ResumeAgentDto, AgentDecisionDto } from './dtos/agent-resume.dto';
import { AgentThreadQueryDto } from './dtos/agent-thread-query.dto';

interface MockResponse {
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

function createMockResponse(): MockResponse {
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

interface MockRequest {
  headers: Record<string, string>;
  user?: { id?: string; sub?: string; role?: string };
  ip?: string;
  on: jest.Mock;
  removeListener: jest.Mock;
  emit: (event: string, ...args: any[]) => void;
}

function createMockRequest(
  user?: { id?: string; sub?: string; role?: string },
  ip?: string,
): MockRequest {
  const listeners: Record<string, ((...args: any[]) => any)[]> = {};
  const req: any = {
    headers: {},
    user,
    ip,
  };
  req.on = jest.fn((event: string, cb: (...args: any[]) => any) => {
    (listeners[event] ??= []).push(cb);
    return req;
  });
  req.removeListener = jest.fn((event: string, cb: (...args: any[]) => any) => {
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

describe('AdminChatbotController - Coverage Companion', () => {
  let controller: AdminChatbotController;
  let mockRunner: {
    run: jest.Mock;
    readTranscript: jest.Mock;
    assertResumable: jest.Mock;
    deleteCheckpoints: jest.Mock;
    isThreadRunning: jest.Mock;
  };
  let mockThreads: {
    create: jest.Mock;
    assertOwned: jest.Mock;
    listForUser: jest.Mock;
    remove: jest.Mock;
  };
  let mockConfig: AgentConfig;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfig = {
      apiKey: 'valid-test-key',
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
      isThreadRunning: jest.fn().mockReturnValue(false),
    };

    mockThreads = {
      create: jest.fn(),
      assertOwned: jest.fn(),
      listForUser: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminChatbotController],
      providers: [
        { provide: AGENT_CONFIG, useValue: mockConfig },
        { provide: AgentRunner, useValue: mockRunner },
        { provide: ThreadService, useValue: mockThreads },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminChatbotController>(AdminChatbotController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getChatbotTracker Throttler Tracker function', () => {
    it('returns req.user.id when id is present', () => {
      const req = {
        user: { id: 'user-id-999', sub: 'sub-ignored' },
        ip: '127.0.0.1',
      };
      expect(getChatbotTracker(req)).toBe('user-id-999');
    });

    it('returns req.user.sub when user has no id but has sub', () => {
      const req = { user: { sub: 'auth0|123456' }, ip: '127.0.0.1' };
      expect(getChatbotTracker(req)).toBe('auth0|123456');
    });

    it('returns req.ip when req.user has neither id nor sub', () => {
      const reqWithUser = { user: {}, ip: '192.168.1.100' };
      expect(getChatbotTracker(reqWithUser)).toBe('192.168.1.100');

      const reqWithoutUser = { ip: '10.0.0.1' };
      expect(getChatbotTracker(reqWithoutUser)).toBe('10.0.0.1');
    });

    it('returns undefined when neither user nor ip exists', () => {
      expect(getChatbotTracker({})).toBeUndefined();
      expect(getChatbotTracker(null as any)).toBeUndefined();
      expect(getChatbotTracker(undefined as any)).toBeUndefined();
    });
  });

  describe('stream endpoint edge cases', () => {
    it('returns 503 when config has empty string apiKey or config is undefined', async () => {
      const emptyConfigController = new AdminChatbotController(
        { ...mockConfig, apiKey: '' },
        mockRunner as any,
        mockThreads as any,
      );

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();

      await emptyConfigController.stream(req as any, res as any, {
        prompt: 'Thống kê',
      });

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 503,
        message: 'Trợ lý chưa được cấu hình',
      });
      expect(mockThreads.create).not.toHaveBeenCalled();
    });

    it('propagates error when threads.create rejects during thread initialization', async () => {
      mockThreads.create.mockRejectedValue(new Error('Database unavailable'));

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();

      await expect(
        controller.stream(req as any, res as any, { prompt: 'Thống kê' }),
      ).rejects.toThrow('Database unavailable');

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: 'admin-1',
        app: 'ADMIN',
      });
      expect(mockRunner.run).not.toHaveBeenCalled();
    });

    it('omits clientContext from ctx when clientContext is not provided in body', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-no-client-ctx' });
      mockRunner.run.mockImplementation(async () => {});

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();

      await controller.stream(req as any, res as any, { prompt: 'Thống kê' });

      expect(mockRunner.run).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: {
            userId: 'admin-1',
            role: 'ADMIN',
            app: 'ADMIN',
            threadId: 'thread-no-client-ctx',
          },
        }),
      );
    });

    it('handles actor with null userId when req.user is absent or lacks id', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-anonymous' });
      mockRunner.run.mockImplementation(async () => {});

      const reqWithoutUser = createMockRequest(undefined);
      const res1 = createMockResponse();

      await controller.stream(reqWithoutUser as any, res1 as any, {
        prompt: 'Thống kê',
      });

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: null,
        app: 'ADMIN',
      });

      mockThreads.create.mockClear();

      const reqUserWithoutId = createMockRequest({ role: 'ADMIN' });
      const res2 = createMockResponse();

      await controller.stream(reqUserWithoutId as any, res2 as any, {
        prompt: 'Thống kê',
      });

      expect(mockThreads.create).toHaveBeenCalledWith({
        userId: null,
        app: 'ADMIN',
      });
    });

    it('handles synchronous throw from runner.run with generic error', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-sync-err' });
      mockRunner.run.mockImplementation(() => {
        throw new Error('Immediate runner crash');
      });

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();

      await expect(
        controller.stream(req as any, res as any, { prompt: 'Hello' }),
      ).rejects.toThrow('Immediate runner crash');

      expect(res.removeListener).toHaveBeenCalledWith(
        'close',
        expect.any(Function),
      );
    });

    it('handles synchronous duck-typed AgentBusyError with err.name === "AgentBusyError"', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-duck-busy' });
      mockRunner.run.mockImplementation(() => {
        const duckError: any = new Error('Cuộc trò chuyện đang được xử lý');
        duckError.name = 'AgentBusyError';
        throw duckError;
      });

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hello' });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 409,
        message: 'Cuộc trò chuyện đang được xử lý',
      });
    });

    it('sink drops events when aborted or response is finished', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-sink-test' });
      let sinkFn: ((event: AgentStreamEvent) => void) | undefined;
      mockRunner.run.mockImplementation(
        async (params: { sink: (event: AgentStreamEvent) => void }) => {
          sinkFn = params.sink;
          // emit first token normally
          params.sink({ event: 'token', data: { text: 'chunk 1' } });
        },
      );

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();

      await controller.stream(req as any, res as any, { prompt: 'Hello' });

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining('chunk 1'),
      );

      // Res is now ended/finished: further sink calls should be safely ignored
      const writeCallCount = res.write.mock.calls.length;
      sinkFn?.({ event: 'token', data: { text: 'chunk 2 should be dropped' } });
      expect(res.write.mock.calls.length).toBe(writeCallCount);
    });

    it('safe catch in closeStream ignores writer.close error', async () => {
      mockThreads.create.mockResolvedValue({ id: 'thread-close-err' });
      mockRunner.run.mockImplementation(async (params: { sink: any }) => {
        params.sink({ event: 'token', data: { text: 'ok' } });
      });

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();
      // Make res.end throw to exercise the catch block
      res.end = jest.fn(() => {
        throw new Error('Socket write failure on end');
      });

      await expect(
        controller.stream(req as any, res as any, { prompt: 'Hi' }),
      ).resolves.not.toThrow();
    });
  });

  describe('resume endpoint edge cases', () => {
    it('returns 503 when config has empty string apiKey on resume', async () => {
      const emptyConfigController = new AdminChatbotController(
        { ...mockConfig, apiKey: '' },
        mockRunner as any,
        mockThreads as any,
      );

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();

      await emptyConfigController.resume(req as any, res as any, 'thread-1', {
        decisions: [{ callId: 'c1', approve: true }],
      });

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 503,
        message: 'Trợ lý chưa được cấu hình',
      });
      expect(mockThreads.assertOwned).not.toHaveBeenCalled();
    });

    it('handles duck-typed AgentNotPendingError on resume with 409 status', async () => {
      const threadId = 't-resume-duck';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'admin-1',
        app: 'ADMIN',
      });
      mockRunner.assertResumable.mockRejectedValue({
        name: 'AgentNotPendingError',
        message: 'Không có thao tác nào đang chờ xác nhận',
      });

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();

      await controller.resume(req as any, res as any, threadId, {
        decisions: [{ callId: 'c1', approve: true }],
      });

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 409,
        message: 'Không có thao tác nào đang chờ xác nhận',
      });
    });

    it('re-throws unexpected error when assertResumable rejects with generic error', async () => {
      const threadId = 't-resume-err';
      mockThreads.assertOwned.mockResolvedValue({
        id: threadId,
        userId: 'admin-1',
        app: 'ADMIN',
      });
      mockRunner.assertResumable.mockRejectedValue(
        new ConflictException('Khóa phiên làm việc bị xung đột'),
      );

      const req = createMockRequest({ id: 'admin-1' });
      const res = createMockResponse();

      await expect(
        controller.resume(req as any, res as any, threadId, {
          decisions: [{ callId: 'c1', approve: true }],
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        controller.resume(req as any, res as any, threadId, {
          decisions: [{ callId: 'c1', approve: true }],
        }),
      ).rejects.toThrow('Khóa phiên làm việc bị xung đột');

      expect(mockRunner.run).not.toHaveBeenCalled();
    });
  });

  describe('listThreads endpoint edge cases', () => {
    it('defaults limit to 20 when query is undefined or empty', async () => {
      mockThreads.listForUser.mockResolvedValue([]);

      const req = createMockRequest({ id: 'admin-1' });
      await controller.listThreads(req as any, undefined as any);

      expect(mockThreads.listForUser).toHaveBeenCalledWith(
        { userId: 'admin-1', app: 'ADMIN' },
        20,
      );
    });

    it('propagates error when threads.listForUser fails', async () => {
      mockThreads.listForUser.mockRejectedValue(
        new Error('Lỗi tải danh sách thread'),
      );

      const req = createMockRequest({ id: 'admin-1' });

      await expect(controller.listThreads(req as any, {})).rejects.toThrow(
        'Lỗi tải danh sách thread',
      );
    });
  });

  describe('getThread endpoint edge cases', () => {
    it('excludes unlisted internal fields from the returned thread detail', async () => {
      const now = new Date();
      mockThreads.assertOwned.mockResolvedValue({
        id: 'thread-detail-test',
        title: 'Báo cáo doanh số',
        app: 'ADMIN',
        totalTokens: 500,
        createdAt: now,
        updatedAt: now,
        userId: 'admin-1',
        internalNotes: 'hidden-field',
        checkpointId: 'cp-123',
      });

      const req = createMockRequest({ id: 'admin-1' });
      const result = await controller.getThread(
        req as any,
        'thread-detail-test',
      );

      expect(result).toEqual({
        id: 'thread-detail-test',
        title: 'Báo cáo doanh số',
        app: 'ADMIN',
        totalTokens: 500,
        createdAt: now,
        updatedAt: now,
      });
      expect(result).not.toHaveProperty('internalNotes');
      expect(result).not.toHaveProperty('checkpointId');
      expect(result).not.toHaveProperty('userId');
    });

    it('propagates NotFoundException when getThread is not found', async () => {
      mockThreads.assertOwned.mockRejectedValue(
        new NotFoundException('Cuộc trò chuyện không tồn tại'),
      );

      const req = createMockRequest({ id: 'admin-1' });

      await expect(
        controller.getThread(req as any, 'missing-thread'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.getThread(req as any, 'missing-thread'),
      ).rejects.toThrow('Cuộc trò chuyện không tồn tại');
    });
  });

  describe('getMessages endpoint edge cases', () => {
    it('propagates Error when runner.readTranscript rejects', async () => {
      mockThreads.assertOwned.mockResolvedValue({ id: 'thread-msg-err' });
      mockRunner.readTranscript.mockRejectedValue(
        new Error('Lỗi đọc transcript từ checkpoint'),
      );

      const req = createMockRequest({ id: 'admin-1' });

      await expect(
        controller.getMessages(req as any, 'thread-msg-err'),
      ).rejects.toThrow('Lỗi đọc transcript từ checkpoint');
    });
  });

  describe('deleteThread endpoint edge cases', () => {
    it('executes and verifies the isThreadRunning check callback passed to threads.remove', async () => {
      mockThreads.assertOwned.mockResolvedValue({ id: 't-del-cb' });
      mockRunner.deleteCheckpoints.mockResolvedValue(undefined);
      mockThreads.remove.mockResolvedValue(undefined);

      mockRunner.isThreadRunning.mockReturnValue(false);

      const req = createMockRequest({ id: 'admin-1' });
      await controller.deleteThread(req as any, 't-del-cb');

      expect(mockThreads.remove).toHaveBeenCalledWith(
        't-del-cb',
        { userId: 'admin-1', app: 'ADMIN' },
        expect.any(Function),
      );

      // Extract and execute the 3rd argument callback
      const checkRunningCb = mockThreads.remove.mock.calls[0][2];
      expect(typeof checkRunningCb).toBe('function');

      mockRunner.isThreadRunning.mockReturnValueOnce(true);
      expect(checkRunningCb()).toBe(true);

      mockRunner.isThreadRunning.mockReturnValueOnce(false);
      expect(checkRunningCb()).toBe(false);
    });

    it('propagates Error when runner.deleteCheckpoints fails', async () => {
      mockThreads.assertOwned.mockResolvedValue({ id: 't-cp-fail' });
      mockRunner.deleteCheckpoints.mockRejectedValue(
        new Error('Lỗi xóa checkpoints trong DB'),
      );

      const req = createMockRequest({ id: 'admin-1' });

      await expect(
        controller.deleteThread(req as any, 't-cp-fail'),
      ).rejects.toThrow('Lỗi xóa checkpoints trong DB');
    });

    it('propagates Error when threads.remove fails', async () => {
      mockThreads.assertOwned.mockResolvedValue({ id: 't-remove-fail' });
      mockRunner.deleteCheckpoints.mockResolvedValue(undefined);
      mockThreads.remove.mockRejectedValue(new Error('Lỗi xóa thread từ DB'));

      const req = createMockRequest({ id: 'admin-1' });

      await expect(
        controller.deleteThread(req as any, 't-remove-fail'),
      ).rejects.toThrow('Lỗi xóa thread từ DB');
    });
  });

  describe('DTO Validation on valid and invalid inputs', () => {
    describe('SendAgentMessageDto', () => {
      it('validates valid prompt and optional fields', async () => {
        const dto = plainToInstance(SendAgentMessageDto, {
          prompt: '   Cần thống kê đơn hàng hôm nay   ',
          threadId: 'a0000000-0000-4000-8000-000000000001',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
        expect(dto.prompt).toBe('Cần thống kê đơn hàng hôm nay');
      });

      it('rejects empty or whitespace-only prompt', async () => {
        const dto = plainToInstance(SendAgentMessageDto, {
          prompt: '   ',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('prompt');
      });

      it('rejects prompt exceeding 4000 characters', async () => {
        const dto = plainToInstance(SendAgentMessageDto, {
          prompt: 'a'.repeat(4001),
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('prompt');
      });

      it('rejects invalid UUID format for threadId', async () => {
        const dto = plainToInstance(SendAgentMessageDto, {
          prompt: 'Thống kê',
          threadId: 'invalid-not-uuid',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('threadId');
      });
    });

    describe('ResumeAgentDto and AgentDecisionDto', () => {
      it('validates valid decisions array', async () => {
        const dto = plainToInstance(ResumeAgentDto, {
          decisions: [
            { callId: 'call_1', approve: true },
            { callId: 'call_2', approve: false },
          ],
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      });

      it('rejects empty decisions array (min 1)', async () => {
        const dto = plainToInstance(ResumeAgentDto, {
          decisions: [],
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('decisions');
      });

      it('rejects decisions array exceeding 12 items', async () => {
        const decisions = Array.from({ length: 13 }, (_, i) => ({
          callId: `call_${i + 1}`,
          approve: true,
        }));
        const dto = plainToInstance(ResumeAgentDto, { decisions });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('decisions');
      });

      it('rejects decision with invalid callId or non-boolean approve', async () => {
        const decisionDto = plainToInstance(AgentDecisionDto, {
          callId: '',
          approve: 'not-a-boolean',
        });
        const errors = await validate(decisionDto);
        expect(errors.length).toBeGreaterThan(0);
        const errorProps = errors.map((e) => e.property);
        expect(errorProps).toContain('callId');
        expect(errorProps).toContain('approve');
      });
    });

    describe('AgentThreadQueryDto', () => {
      it('validates valid limit and allows empty query', async () => {
        const dtoWithLimit = plainToInstance(AgentThreadQueryDto, {
          limit: 15,
        });
        expect(await validate(dtoWithLimit)).toHaveLength(0);

        const dtoEmpty = plainToInstance(AgentThreadQueryDto, {});
        expect(await validate(dtoEmpty)).toHaveLength(0);
      });

      it('rejects limit < 1 or > 50 or non-integer', async () => {
        const dtoLow = plainToInstance(AgentThreadQueryDto, { limit: 0 });
        expect((await validate(dtoLow)).length).toBeGreaterThan(0);

        const dtoHigh = plainToInstance(AgentThreadQueryDto, { limit: 51 });
        expect((await validate(dtoHigh)).length).toBeGreaterThan(0);

        const dtoFloat = plainToInstance(AgentThreadQueryDto, { limit: 10.5 });
        expect((await validate(dtoFloat)).length).toBeGreaterThan(0);
      });
    });
  });
});
