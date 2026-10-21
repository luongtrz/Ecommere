import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { JwtAccessStrategy, JwtPayload } from './jwt-access.strategy';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER } from '../auth.constants';

describe('JwtAccessStrategy', () => {
  let strategy: JwtAccessStrategy;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'ADMIN_JWT_ACCESS_SECRET') {
        return 'test-admin-access-secret';
      }
      return undefined;
    });

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
  });

  describe('JwtPayload interface', () => {
    it('should adhere to the JwtPayload interface structure', () => {
      const payload: JwtPayload = {
        sub: 'admin-uuid-123',
        email: 'admin@thaispray.com',
        role: 'ADMIN',
      };

      expect(payload).toEqual({
        sub: 'admin-uuid-123',
        email: 'admin@thaispray.com',
        role: 'ADMIN',
      });
      expect(payload.sub).toBe('admin-uuid-123');
      expect(payload.email).toBe('admin@thaispray.com');
      expect(payload.role).toBe('ADMIN');
    });
  });

  describe('constructor', () => {
    it('should retrieve ADMIN_JWT_ACCESS_SECRET from ConfigService and initialize correctly', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'ADMIN_JWT_ACCESS_SECRET',
      );

      const strategyAny = strategy as any;
      expect(strategyAny._verifOpts).toBeDefined();
      expect(strategyAny._verifOpts.issuer).toBe(ADMIN_JWT_ISSUER);
      expect(strategyAny._verifOpts.audience).toBe(ADMIN_JWT_AUDIENCE);
      expect(strategyAny._verifOpts.ignoreExpiration).toBe(false);
    });

    it('should extract JWT bearer token from authorization header', () => {
      const strategyAny = strategy as any;
      expect(typeof strategyAny._jwtFromRequest).toBe('function');

      const reqWithBearer = {
        headers: {
          authorization: 'Bearer sample-access-token-xyz',
        },
      };
      expect(strategyAny._jwtFromRequest(reqWithBearer)).toBe(
        'sample-access-token-xyz',
      );

      const reqWithoutAuth = {
        headers: {},
      };
      expect(strategyAny._jwtFromRequest(reqWithoutAuth)).toBeNull();

      const reqWithNonBearer = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz',
        },
      };
      expect(strategyAny._jwtFromRequest(reqWithNonBearer)).toBeNull();
    });

    it('should throw an error during instantiation if ADMIN_JWT_ACCESS_SECRET is missing', () => {
      const emptyConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      expect(
        () =>
          new JwtAccessStrategy(
            emptyConfigService as any,
            mockPrismaService as any,
          ),
      ).toThrow(new TypeError('JwtStrategy requires a secret or key'));
      expect(emptyConfigService.get).toHaveBeenCalledWith(
        'ADMIN_JWT_ACCESS_SECRET',
      );
    });
  });

  describe('validate', () => {
    const payload: JwtPayload = {
      sub: 'admin-user-id-1',
      email: 'superadmin@example.com',
      role: 'SUPER_ADMIN',
    };

    const mockAdminUser = {
      id: 'admin-user-id-1',
      email: 'superadmin@example.com',
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      phone: '0901234567',
    };

    it('should return user data when user exists in the database', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAdminUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockAdminUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
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

    it('should throw UnauthorizedException with message "User not found" when user is null', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
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

    it('should throw UnauthorizedException with message "User not found" when user is undefined', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(undefined);

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should rethrow any unexpected error thrown by prisma.user.findUnique', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.user.findUnique.mockRejectedValue(dbError);

      await expect(strategy.validate(payload)).rejects.toThrow(dbError);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(1);
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
  });

  describe('passport verify callback integration', () => {
    it('should invoke validate and pass user to done callback on success', async () => {
      const payload: JwtPayload = {
        sub: 'admin-user-id-2',
        email: 'admin2@example.com',
        role: 'ADMIN',
      };
      const mockUser = {
        id: 'admin-user-id-2',
        email: 'admin2@example.com',
        role: 'ADMIN',
        name: 'Admin Two',
        phone: '0988888888',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const doneCallback = jest.fn();
      const strategyAny = strategy as any;

      await strategyAny._verify(payload, doneCallback);

      expect(doneCallback).toHaveBeenCalledTimes(1);
      expect(doneCallback).toHaveBeenCalledWith(null, mockUser);
    });

    it('should invoke validate and pass error to done callback when user not found', async () => {
      const payload: JwtPayload = {
        sub: 'non-existent-id',
        email: 'ghost@example.com',
        role: 'ADMIN',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const doneCallback = jest.fn();
      const strategyAny = strategy as any;

      await strategyAny._verify(payload, doneCallback);

      expect(doneCallback).toHaveBeenCalledTimes(1);
      const [err, user] = doneCallback.mock.calls[0];
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.message).toBe('User not found');
      expect(user).toBeNull();
    });
  });
});
