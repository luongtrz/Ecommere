import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAccessStrategy, JwtPayload } from './jwt-access.strategy';
import { PrismaService } from '@/prisma/prisma.service';

describe('JwtAccessStrategy', () => {
  let strategy: JwtAccessStrategy;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_ACCESS_SECRET') {
        return 'test-access-secret-key';
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAccessStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strategy = module.get<JwtAccessStrategy>(JwtAccessStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
    expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
  });

  describe('constructor', () => {
    it('initializes passport-jwt with options from ConfigService and constants', () => {
      const customConfig = {
        get: jest.fn().mockReturnValue('custom-secret'),
      } as unknown as ConfigService;
      const customPrisma = {} as PrismaService;

      const customStrategy = new JwtAccessStrategy(customConfig, customPrisma);

      expect(customStrategy).toBeDefined();
      expect(customConfig.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
    });

    it('extracts bearer token from request headers using configured extractor', () => {
      const reqWithBearer = {
        headers: {
          authorization: 'Bearer token-abc-123',
        },
      };
      const reqWithoutBearer = {
        headers: {},
      };

      const jwtExtractor = (strategy as any)._jwtFromRequest;
      if (typeof jwtExtractor === 'function') {
        expect(jwtExtractor(reqWithBearer)).toBe('token-abc-123');
        expect(jwtExtractor(reqWithoutBearer)).toBeNull();
      }
    });
  });

  describe('validate', () => {
    const payload: JwtPayload = {
      sub: 'user-uuid-1',
      email: 'user1@example.com',
      role: 'CUSTOMER',
    };

    const mockUser = {
      id: 'user-uuid-1',
      email: 'user1@example.com',
      role: 'CUSTOMER',
      name: 'Nguyen Van A',
      phone: '0912345678',
    };

    it('returns user when user is found in database (branch: user exists)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
        },
      });
    });

    it('throws UnauthorizedException when user is not found (branch: !user)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found',
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
        },
      });
    });

    it('rethrows unexpected Prisma errors during user lookup', async () => {
      const dbError = new Error('Database connection failure');
      mockPrismaService.user.findUnique.mockRejectedValue(dbError);

      await expect(strategy.validate(payload)).rejects.toThrow(dbError);
    });
  });
});
