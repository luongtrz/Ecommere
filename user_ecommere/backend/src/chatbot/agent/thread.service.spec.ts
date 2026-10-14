import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ThreadService, AgentActor } from './thread.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('ThreadService', () => {
  let service: ThreadService;
  let prisma: PrismaService;

  const mockPrismaService = {
    agentThread: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    agentToolLog: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    mockPrismaService.$transaction.mockImplementation((ops) =>
      Array.isArray(ops) ? Promise.all(ops) : ops(mockPrismaService),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThreadService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ThreadService>(ThreadService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a thread with a UUID-shaped id for a logged-in user', async () => {
      const actor: AgentActor = { userId: 'user-1', app: 'USER' };
      mockPrismaService.agentThread.create.mockResolvedValue({
        id: 'mock-id',
        userId: 'user-1',
        sessionKeyHash: null,
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(actor);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(mockPrismaService.agentThread.create).toHaveBeenCalledWith({
        data: {
          id: result.id,
          userId: 'user-1',
          sessionKeyHash: null,
          app: 'USER',
        },
      });
    });

    it('creates a guest thread with userId null and a UUID-shaped id', async () => {
      const actor: AgentActor = { userId: null, app: 'USER' };
      mockPrismaService.agentThread.create.mockResolvedValue({
        id: 'mock-id',
        userId: null,
        sessionKeyHash: null,
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(actor);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(mockPrismaService.agentThread.create).toHaveBeenCalledWith({
        data: {
          id: result.id,
          userId: null,
          sessionKeyHash: null,
          app: 'USER',
        },
      });
    });

    it('creates a guest thread with sessionKeyHash and a UUID-shaped id', async () => {
      const actor: AgentActor = {
        userId: null,
        app: 'USER',
        sessionKeyHash: 'guest-hash-1',
      };
      mockPrismaService.agentThread.create.mockResolvedValue({
        id: 'mock-id',
        userId: null,
        sessionKeyHash: 'guest-hash-1',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(actor);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(mockPrismaService.agentThread.create).toHaveBeenCalledWith({
        data: {
          id: result.id,
          userId: null,
          sessionKeyHash: 'guest-hash-1',
          app: 'USER',
        },
      });
    });
  });

  describe('assertOwned', () => {
    it('returns thread when owned by the logged-in user with matching app', async () => {
      const mockThread = {
        id: 't-user',
        userId: 'user-1',
        sessionKeyHash: null,
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      const result = await service.assertOwned('t-user', { userId: 'user-1', app: 'USER' });

      expect(result).toBe(mockThread);
      expect(mockPrismaService.agentThread.findUnique).toHaveBeenCalledWith({
        where: { id: 't-user' },
      });
    });

    it('returns thread for a guest with matching hash', async () => {
      const mockThread = {
        id: 't-guest',
        userId: null,
        sessionKeyHash: 'hash-guest-1',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      const result = await service.assertOwned('t-guest', {
        userId: null,
        app: 'USER',
        sessionKeyHash: 'hash-guest-1',
      });

      expect(result).toBe(mockThread);
    });

    it('throws 404 NotFoundException for a guest with different hash', async () => {
      const mockThread = {
        id: 't-guest',
        userId: null,
        sessionKeyHash: 'hash-guest-1',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      await expect(
        service.assertOwned('t-guest', {
          userId: null,
          app: 'USER',
          sessionKeyHash: 'hash-guest-2',
        }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy cuộc trò chuyện'));
    });

    it('throws 404 NotFoundException for a guest without hash', async () => {
      const mockThread = {
        id: 't-guest',
        userId: null,
        sessionKeyHash: 'hash-guest-1',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      await expect(
        service.assertOwned('t-guest', {
          userId: null,
          app: 'USER',
        }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy cuộc trò chuyện'));
    });

    it('throws 404 NotFoundException for a logged-in actor on guest thread', async () => {
      const mockThread = {
        id: 't-guest',
        userId: null,
        sessionKeyHash: 'hash-guest-1',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      await expect(
        service.assertOwned('t-guest', {
          userId: 'user-1',
          app: 'USER',
          sessionKeyHash: 'hash-guest-1',
        }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy cuộc trò chuyện'));
    });

    it('throws 404 NotFoundException for a guest thread with null sessionKeyHash (legacy)', async () => {
      const mockThread = {
        id: 't-guest-legacy',
        userId: null,
        sessionKeyHash: null,
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      await expect(
        service.assertOwned('t-guest-legacy', {
          userId: null,
          app: 'USER',
          sessionKeyHash: 'hash-guest-1',
        }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy cuộc trò chuyện'));
    });

    it('throws 404 NotFoundException if thread is not found', async () => {
      mockPrismaService.agentThread.findUnique.mockResolvedValue(null);

      await expect(
        service.assertOwned('missing-id', { userId: 'user-1', app: 'USER' }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy cuộc trò chuyện'));
    });

    it('throws 404 NotFoundException when thread app differs', async () => {
      const mockThread = {
        id: 't-1',
        userId: 'user-1',
        app: 'ADMIN',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      await expect(
        service.assertOwned('t-1', { userId: 'user-1', app: 'USER' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns 404 for another user\'s thread', async () => {
      const mockThread = {
        id: 't-1',
        userId: 'user-2',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      await expect(
        service.assertOwned('t-1', { userId: 'user-1', app: 'USER' }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy cuộc trò chuyện'));
    });

    it('returns 404 for a user reading a guest thread', async () => {
      const mockThread = {
        id: 't-guest',
        userId: null,
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      await expect(
        service.assertOwned('t-guest', { userId: 'user-1', app: 'USER' }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy cuộc trò chuyện'));
    });

    it('returns 404 for a guest reading a user thread', async () => {
      const mockThread = {
        id: 't-user',
        userId: 'user-1',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);

      await expect(
        service.assertOwned('t-user', { userId: null, app: 'USER' }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy cuộc trò chuyện'));
    });
  });

  describe('listForUser', () => {
    it('returns [] for a guest and never calls Prisma', async () => {
      const result = await service.listForUser({ userId: null, app: 'USER' }, 10);

      expect(result).toEqual([]);
      expect(mockPrismaService.agentThread.findMany).not.toHaveBeenCalled();
    });

    it('returns threads for a logged-in user ordered by updatedAt desc with limit', async () => {
      const mockThreads = [
        {
          id: 't-1',
          userId: 'user-1',
          app: 'USER',
          title: 'Title 1',
          totalTokens: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.agentThread.findMany.mockResolvedValue(mockThreads);

      const result = await service.listForUser({ userId: 'user-1', app: 'USER' }, 5);

      expect(result).toBe(mockThreads);
      expect(mockPrismaService.agentThread.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          app: 'USER',
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
      });
    });
  });

  describe('remove', () => {
    it('calls assertOwned before the delete', async () => {
      const mockThread = {
        id: 't-1',
        userId: 'user-1',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);
      mockPrismaService.agentThread.delete.mockResolvedValue(mockThread);
      const assertOwnedSpy = jest.spyOn(service, 'assertOwned');

      await service.remove('t-1', { userId: 'user-1', app: 'USER' });

      expect(assertOwnedSpy).toHaveBeenCalledWith('t-1', { userId: 'user-1', app: 'USER' });
      expect(mockPrismaService.agentThread.delete).toHaveBeenCalledWith({
        where: { id: 't-1' },
      });
    });

    it('deletes the thread and keeps its tool-call audit rows', async () => {
      const mockThread = {
        id: 't-1',
        userId: 'user-1',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(mockThread);
      mockPrismaService.agentThread.delete.mockReturnValue(mockThread);
      mockPrismaService.agentToolLog.deleteMany.mockClear();

      await service.remove('t-1', { userId: 'user-1', app: 'USER' });

      expect(mockPrismaService.agentToolLog.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaService.agentThread.delete).toHaveBeenCalledWith({
        where: { id: 't-1' },
      });
    });

    it('does not call delete when assertOwned fails', async () => {
      mockPrismaService.agentThread.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('t-missing', { userId: 'user-1', app: 'USER' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.agentToolLog.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaService.agentThread.delete).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('refuses a foreign thread and deletes nothing', async () => {
      const foreignThread = {
        id: 't-foreign',
        userId: 'user-2',
        app: 'USER',
        title: null,
        totalTokens: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.agentThread.findUnique.mockResolvedValue(foreignThread);

      await expect(
        service.remove('t-foreign', { userId: 'user-1', app: 'USER' }),
      ).rejects.toThrow(new NotFoundException('Không tìm thấy cuộc trò chuyện'));

      expect(mockPrismaService.agentToolLog.deleteMany).not.toHaveBeenCalled();
      expect(mockPrismaService.agentThread.delete).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('recordUsage', () => {
    it('increments totalTokens by tokens for positive finite number', async () => {
      await service.recordUsage('t-1', 250);

      expect(mockPrismaService.agentThread.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: {
          totalTokens: {
            increment: 250,
          },
        },
      });
    });

    it('ignores non-positive tokens (0 or negative)', async () => {
      await service.recordUsage('t-1', 0);
      await service.recordUsage('t-1', -15);

      expect(mockPrismaService.agentThread.update).not.toHaveBeenCalled();
    });

    it('ignores non-finite tokens (NaN, Infinity, -Infinity)', async () => {
      await service.recordUsage('t-1', NaN);
      await service.recordUsage('t-1', Infinity);
      await service.recordUsage('t-1', -Infinity);

      expect(mockPrismaService.agentThread.update).not.toHaveBeenCalled();
    });
  });

  describe('setTitleIfEmpty', () => {
    it('sets title only when it is null with trimmed title cut to 60 characters', async () => {
      const longTitle = '   ' + 'x'.repeat(70) + '   ';
      await service.setTitleIfEmpty('t-1', longTitle);

      expect(mockPrismaService.agentThread.updateMany).toHaveBeenCalledWith({
        where: {
          id: 't-1',
          title: null,
        },
        data: {
          title: 'x'.repeat(60),
        },
      });
    });
  });
});
