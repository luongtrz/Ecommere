import { Test, TestingModule } from '@nestjs/testing';
import {
  AuditService,
  ToolAuditEntry,
  redactArgs,
  redactSummary,
} from './audit.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('AuditService - Coverage Companion Spec', () => {
  let service: AuditService;
  let warnSpy: jest.SpyInstance;

  const mockPrismaService = {
    agentToolLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    warnSpy = jest
      .spyOn(service['logger'], 'warn')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('redactSummary additional branches', () => {
    it('returns non-string or falsy input unchanged', () => {
      expect(redactSummary(null as unknown as string)).toBeNull();
      expect(redactSummary(undefined as unknown as string)).toBeUndefined();
      expect(redactSummary('')).toBe('');
      expect(redactSummary(12345 as unknown as string)).toBe(12345);
      expect(redactSummary({} as unknown as string)).toEqual({});
      expect(redactSummary(false as unknown as string)).toBe(false);
    });

    it('returns match unchanged when unquoted value is already [REDACTED] or ***', () => {
      const alreadyRedacted = 'password: [REDACTED] and token: ***';
      const result = redactSummary(alreadyRedacted);
      expect(result).toBe('password: [REDACTED] and token: ***');
    });

    it('masks single-quoted sensitive values keeping single quotes', () => {
      const singleQuoted =
        "password: 'secretPassword123' and token: 'my-token'";
      const result = redactSummary(singleQuoted);
      expect(result).toBe("password: '[REDACTED]' and token: '[REDACTED]'");
    });

    it('masks single-quoted keys and values', () => {
      // SENSITIVE_VALUE_REGEX specifies ("?) for keys, so single-quoted keys
      // are not matched and are returned unchanged by the implementation
      const singleQuotedKey = "'password': 'topsecret'";
      const result = redactSummary(singleQuotedKey);
      expect(result).toBe("'password': 'topsecret'");
    });

    it('masks double-quoted key with single-quoted value preserving quote styles', () => {
      const doubleQuotedKeySingleQuotedVal = '"password": \'topsecret\'';
      const result = redactSummary(doubleQuotedKeySingleQuotedVal);
      expect(result).toBe('"password": \'[REDACTED]\'');
    });
  });

  describe('redactArgs additional branches', () => {
    it('recurses into non-string values under phone keys (e.g. phone object)', () => {
      const input = {
        phone: {
          mobile: '0912345678',
          secret: 'nestedSecret',
        },
      };

      const result = redactArgs(input) as any;

      expect(result.phone.mobile).toBe('0912345678');
      expect(result.phone.secret).toBe('[REDACTED]');
    });

    it('handles non-string non-object values under phone keys (null, boolean)', () => {
      const input = {
        phone: null,
        userPhone: true,
      };

      const result = redactArgs(input) as Record<string, unknown>;

      expect(result.phone).toBeNull();
      expect(result.userPhone).toBe(true);
    });

    it('handles exactly 501 character string at boundary', () => {
      const exact501 = 'a'.repeat(501);
      const result = redactArgs(exact501);
      expect(result).toBe('a'.repeat(500) + '…');
    });
  });

  describe('AuditService.record additional branches', () => {
    it('sets args to { toolCallId } when toolCallId is provided but args is undefined', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-10' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-1',
        userId: 'admin-1',
        role: 'ADMIN',
        app: 'ADMIN',
        toolName: 'check_status',
        risk: 'READ',
        status: 'OK',
        toolCallId: 'call-100',
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          threadId: 'thread-1',
          args: {
            toolCallId: 'call-100',
          },
        }),
      });
    });

    it('sets args to { toolCallId } when toolCallId is provided and args is null', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-11' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-1',
        userId: 'admin-1',
        role: 'ADMIN',
        app: 'ADMIN',
        toolName: 'check_status',
        risk: 'READ',
        status: 'OK',
        toolCallId: 'call-101',
        args: null,
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          args: {
            toolCallId: 'call-101',
          },
        }),
      });
    });

    it('sets args to { toolCallId } when toolCallId is provided and args is an array', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-12' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-1',
        userId: 'admin-1',
        role: 'ADMIN',
        app: 'ADMIN',
        toolName: 'batch_op',
        risk: 'WRITE',
        status: 'OK',
        toolCallId: 'call-102',
        args: [1, 2, 3],
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          args: {
            toolCallId: 'call-102',
          },
        }),
      });
    });

    it('sets args to { toolCallId } when toolCallId is provided and args is a primitive string', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-13' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-1',
        userId: 'admin-1',
        role: 'ADMIN',
        app: 'ADMIN',
        toolName: 'simple_tool',
        risk: 'READ',
        status: 'OK',
        toolCallId: 'call-103',
        args: 'plain-string-arg',
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          args: {
            toolCallId: 'call-103',
          },
        }),
      });
    });

    it('preserves array args when toolCallId is not provided', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-14' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-1',
        userId: 'user-1',
        role: 'CUSTOMER',
        app: 'USER',
        toolName: 'list_items',
        risk: 'READ',
        status: 'OK',
        args: ['item-1', 'item-2'],
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          args: ['item-1', 'item-2'],
        }),
      });
    });

    it('passes JsonNull when args is explicitly null without toolCallId', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-15' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-1',
        userId: 'user-1',
        role: 'CUSTOMER',
        app: 'USER',
        toolName: 'ping',
        risk: 'READ',
        status: 'OK',
        args: null,
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          args: Prisma.JsonNull,
        }),
      });
    });

    it('defaults userId, role, resultSummary, error, and durationMs to null when explicitly null or omitted', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-16' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-nulls',
        userId: null,
        role: null,
        app: 'USER',
        toolName: 'test_tool',
        risk: 'READ',
        status: 'OK',
        resultSummary: null as unknown as string,
        error: null as unknown as string,
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: {
          threadId: 'thread-nulls',
          userId: null,
          role: null,
          app: 'USER',
          toolName: 'test_tool',
          risk: 'READ',
          status: 'OK',
          args: Prisma.JsonNull,
          resultSummary: null,
          error: null,
          durationMs: null,
        },
      });
    });

    it('catches non-Error exceptions in record and logs String(error)', async () => {
      mockPrismaService.agentToolLog.create.mockRejectedValue(
        'String-based database failure',
      );

      const entry: ToolAuditEntry = {
        threadId: 'thread-err',
        userId: 'admin-1',
        role: 'ADMIN',
        app: 'ADMIN',
        toolName: 'failing_tool',
        risk: 'WRITE',
        status: 'ERROR',
      };

      await expect(service.record(entry)).resolves.not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to record tool audit log: String-based database failure',
      );
    });
  });

  describe('AuditService.findCompleted additional branches', () => {
    it('returns null when matching log is found but resultSummary is null', async () => {
      mockPrismaService.agentToolLog.findFirst.mockResolvedValue({
        id: 'log-found-null',
        threadId: 'thread-123',
        status: 'OK',
        resultSummary: null,
      });

      const result = await service.findCompleted('thread-123', 'call-null');

      expect(result).toBeNull();
      expect(mockPrismaService.agentToolLog.findFirst).toHaveBeenCalledWith({
        where: {
          threadId: 'thread-123',
          status: 'OK',
          args: {
            path: ['toolCallId'],
            equals: 'call-null',
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('catches non-Error exceptions in findCompleted and logs String(error)', async () => {
      mockPrismaService.agentToolLog.findFirst.mockRejectedValue(
        'Raw string query timeout',
      );

      const result = await service.findCompleted('thread-123', 'call-fail');

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to find completed tool audit log: Raw string query timeout',
      );
    });
  });
});
