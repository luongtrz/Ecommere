import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, ToolAuditEntry, redactArgs } from './audit.service';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  const mockPrismaService = {
    agentToolLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
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
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('redactArgs', () => {
    it('masks keys matching password, token and secret', () => {
      const input = {
        password: 'x',
        accessToken: 'y',
        clientSecret: 'secretValue',
        authorization: 'Bearer token',
        cookie: 'sessionId=123',
        cvv: '999',
        cardNumber: '1234567890123456',
        normalField: 'clean',
      };

      const result = redactArgs(input) as Record<string, unknown>;

      expect(result.password).toBe('[REDACTED]');
      expect(result.accessToken).toBe('[REDACTED]');
      expect(result.clientSecret).toBe('[REDACTED]');
      expect(result.authorization).toBe('[REDACTED]');
      expect(result.cookie).toBe('[REDACTED]');
      expect(result.cvv).toBe('[REDACTED]');
      expect(result.cardNumber).toBe('[REDACTED]');
      expect(result.normalField).toBe('clean');
    });

    it('masks a phone string to its last 3 characters with a *** prefix', () => {
      const input = {
        phone: '0912345678',
        customerPhone: '0812345678',
        shortPhone: '12',
        exactThreePhone: '123',
      };

      const result = redactArgs(input) as Record<string, unknown>;

      expect(result.phone).toBe('***678');
      expect(result.customerPhone).toBe('***678');
      expect(result.shortPhone).toBe('***12');
      expect(result.exactThreePhone).toBe('***123');
    });

    it('passes through non-string phone value', () => {
      const input = { phone: 123456789 };

      const result = redactArgs(input) as Record<string, unknown>;

      expect(result.phone).toBe(123456789);
    });

    it('does not mutate its input object', () => {
      const input = {
        password: 'mySecretPassword',
        accessToken: 'myAccessToken',
        phone: '0912345678',
        nested: {
          secret: 'nestedSecret',
          phone: '0987654321',
        },
        items: [
          { token: 'arrayToken' },
        ],
      };

      Object.freeze(input);
      Object.freeze(input.nested);
      Object.freeze(input.items);
      Object.freeze(input.items[0]);

      const result = redactArgs(input) as any;

      expect(result.password).toBe('[REDACTED]');
      expect(input.password).toBe('mySecretPassword');
      expect(input.accessToken).toBe('myAccessToken');
      expect(input.phone).toBe('0912345678');
      expect(input.nested.secret).toBe('nestedSecret');
      expect(input.nested.phone).toBe('0987654321');
      expect(input.items[0].token).toBe('arrayToken');
    });

    it('returns [TRUNCATED] beyond depth 5', () => {
      const deeplyNested = {
        l1: {
          l2: {
            l3: {
              l4: {
                l5: {
                  l6: {
                    value: 'deep',
                  },
                },
              },
            },
          },
        },
      };

      const result = redactArgs(deeplyNested) as any;

      expect(result.l1.l2.l3.l4.l5.l6).toBe('[TRUNCATED]');
    });

    it('cuts a string longer than 500 characters to 500 characters plus …', () => {
      const longString = 'a'.repeat(600);

      const result = redactArgs(longString);

      expect(result).toBe('a'.repeat(500) + '…');
    });

    it('preserves a string of 500 characters or fewer unchanged', () => {
      const exact500 = 'b'.repeat(500);

      expect(redactArgs(exact500)).toBe(exact500);
      expect(redactArgs('short text')).toBe('short text');
    });

    it('passes through primitives and null/undefined values', () => {
      expect(redactArgs(null)).toBeNull();
      expect(redactArgs(undefined)).toBeUndefined();
      expect(redactArgs(12345)).toBe(12345);
      expect(redactArgs(true)).toBe(true);
      expect(redactArgs(false)).toBe(false);
    });

    it('recurses into arrays and redacts elements', () => {
      const arrayInput = [
        { password: 'arrPassword' },
        { phone: '0912345678' },
        'c'.repeat(550),
      ];

      const result = redactArgs(arrayInput) as any[];

      expect(result[0]).toEqual({ password: '[REDACTED]' });
      expect(result[1]).toEqual({ phone: '***678' });
      expect(result[2]).toBe('c'.repeat(500) + '…');
    });
  });

  describe('record', () => {
    it('calls prisma.agentToolLog.create with redacted args (not the raw password)', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-1' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-123',
        userId: 'user-456',
        role: 'CUSTOMER',
        app: 'USER',
        toolName: 'searchProducts',
        risk: 'LOW',
        status: 'OK',
        args: {
          password: 'rawPassword123',
          phone: '0912345678',
          query: 'lavender spray',
        },
        resultSummary: 'Found 3 products',
        durationMs: 120,
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: {
          threadId: 'thread-123',
          userId: 'user-456',
          role: 'CUSTOMER',
          app: 'USER',
          toolName: 'searchProducts',
          risk: 'LOW',
          status: 'OK',
          args: {
            password: '[REDACTED]',
            phone: '***678',
            query: 'lavender spray',
          },
          resultSummary: 'Found 3 products',
          error: null,
          durationMs: 120,
        },
      });
    });

    it('sets JsonNull when args is undefined or null', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-2' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-123',
        userId: null,
        role: null,
        app: 'USER',
        toolName: 'listCategories',
        risk: 'LOW',
        status: 'OK',
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          threadId: 'thread-123',
          userId: null,
          role: null,
          app: 'USER',
          args: Prisma.JsonNull,
          resultSummary: null,
          error: null,
          durationMs: null,
        }),
      });
    });

    it('cuts resultSummary and error to 500 characters', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-3' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-123',
        userId: 'user-456',
        role: 'ADMIN',
        app: 'ADMIN',
        toolName: 'updateStock',
        risk: 'HIGH',
        status: 'ERROR',
        resultSummary: 's'.repeat(600),
        error: 'e'.repeat(600),
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          resultSummary: 's'.repeat(500),
          error: 'e'.repeat(500),
        }),
      });
    });

    it('swallows a Prisma error: it resolves and does not throw', async () => {
      mockPrismaService.agentToolLog.create.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const entry: ToolAuditEntry = {
        threadId: 'thread-123',
        userId: 'user-456',
        role: 'CUSTOMER',
        app: 'USER',
        toolName: 'searchProducts',
        risk: 'LOW',
        status: 'OK',
        args: { query: 'test' },
      };

      await expect(service.record(entry)).resolves.not.toThrow();
      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalled();
    });

    it('attaches toolCallId to args when toolCallId is provided', async () => {
      mockPrismaService.agentToolLog.create.mockResolvedValue({ id: 'log-4' });

      const entry: ToolAuditEntry = {
        threadId: 'thread-123',
        userId: 'admin-1',
        role: 'ADMIN',
        app: 'ADMIN',
        toolName: 'stock_add',
        risk: 'WRITE',
        status: 'OK',
        toolCallId: 'call_add_1',
        args: { variantId: 'v1', quantity: 5 },
        resultSummary: 'Đã nhập thêm tồn kho',
      };

      await service.record(entry);

      expect(mockPrismaService.agentToolLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          threadId: 'thread-123',
          toolName: 'stock_add',
          status: 'OK',
          args: {
            variantId: 'v1',
            quantity: 5,
            toolCallId: 'call_add_1',
          },
          resultSummary: 'Đã nhập thêm tồn kho',
        }),
      });
    });
  });

  describe('findCompleted', () => {
    it('returns the resultSummary when a completed OK row matches', async () => {
      mockPrismaService.agentToolLog.findFirst.mockResolvedValue({
        id: 'log-found-1',
        threadId: 'thread-123',
        status: 'OK',
        args: {
          variantId: 'v1',
          toolCallId: 'call_match_1',
        },
        resultSummary: 'Đã thực hiện thao tác',
      });

      const result = await service.findCompleted('thread-123', 'call_match_1');

      expect(result).toBe('Đã thực hiện thao tác');
      expect(mockPrismaService.agentToolLog.findFirst).toHaveBeenCalledWith({
        where: {
          threadId: 'thread-123',
          status: 'OK',
          args: {
            path: ['toolCallId'],
            equals: 'call_match_1',
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('does not replay an ERROR row and returns null', async () => {
      mockPrismaService.agentToolLog.findFirst.mockResolvedValue(null);

      const result = await service.findCompleted('thread-123', 'call_error_1');

      expect(result).toBeNull();
      expect(mockPrismaService.agentToolLog.findFirst).toHaveBeenCalledWith({
        where: {
          threadId: 'thread-123',
          status: 'OK',
          args: {
            path: ['toolCallId'],
            equals: 'call_error_1',
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns null when no matching audit row exists', async () => {
      mockPrismaService.agentToolLog.findFirst.mockResolvedValue(null);

      const result = await service.findCompleted('thread-123', 'call_not_found');

      expect(result).toBeNull();
    });

    it('returns null and does not throw when Prisma throws an error', async () => {
      mockPrismaService.agentToolLog.findFirst.mockRejectedValue(new Error('DB failure'));

      const result = await service.findCompleted('thread-123', 'call_err');

      expect(result).toBeNull();
    });
  });
});
