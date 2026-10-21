import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { HashUtil } from '@/common/utils/hash.util';
import { MailService } from '@/mail/mail.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthTokensEntity } from './entities/auth-tokens.entity';
import { hashToken } from './utils/token.util';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER } from './auth.constants';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  const createMockResponse = (): Response => {
    const res: Partial<Response> = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    return res as Response;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'ADMIN_JWT_ACCESS_SECRET':
          return 'test-admin-access-secret';
        case 'ADMIN_JWT_REFRESH_SECRET':
          return 'test-admin-refresh-secret';
        case 'TOKEN_EXPIRES_IN':
          return '15m';
        case 'REFRESH_EXPIRES_IN':
          return '7d';
        case 'NODE_ENV':
          return 'development';
        case 'FRONTEND_URL':
          return 'http://localhost:5174';
        case 'CORS_ORIGIN':
          return 'http://localhost:5174';
        default:
          return undefined;
      }
    });

    mockJwtService.sign.mockImplementation((payload: any, options?: any) => {
      if (options?.expiresIn === '7d' || payload?.family) {
        return 'mock-refresh-token';
      }
      return 'mock-access-token';
    });

    mockJwtService.verify.mockReturnValue({
      sub: 'admin-1',
      family: 'fam-1',
    });

    mockJwtService.decode.mockReturnValue({
      sub: 'admin-1',
      family: 'fam-1',
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    });

    mockMailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    jest.spyOn(HashUtil, 'hash').mockResolvedValue('mock-password-hash');
    jest.spyOn(HashUtil, 'compare').mockResolvedValue(true);

    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    });

    mockPrismaService.refreshToken.create.mockResolvedValue({
      id: 'ref-token-id-1',
      userId: 'admin-1',
      tokenFamily: 'fam-1',
      tokenHash: 'mock-token-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      replacedBy: null,
      revokedAt: null,
    });

    mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      phone: '0912345678',
      password: 'Password@123',
      name: 'Admin User',
      email: 'admin@example.com',
    };

    const mockCreatedUser = {
      id: 'user-1',
      email: 'admin@example.com',
      role: 'CUSTOMER',
      name: 'Admin User',
      phone: '0912345678',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('should register a new user successfully with all fields', async () => {
      const response = createMockResponse();

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.register(registerDto, response);

      expect(result).toEqual({
        user: mockCreatedUser,
        accessToken: 'mock-access-token',
        expiresIn: '15m',
      });
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { phone: registerDto.phone },
      });
      expect(HashUtil.hash).toHaveBeenCalledWith('Password@123');
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          phone: registerDto.phone,
          passwordHash: 'mock-password-hash',
          name: registerDto.name,
          email: registerDto.email,
          role: 'CUSTOMER',
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        }),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          httpOnly: false,
          path: '/',
        }),
      );
    });

    it('should register a new user successfully without optional fields (no name, no email)', async () => {
      const response = createMockResponse();
      const minimalDto: RegisterDto = {
        phone: '0987654321',
        password: 'Password@123',
      };

      const minimalUser = {
        id: 'user-2',
        email: null,
        role: 'CUSTOMER',
        name: null,
        phone: '0987654321',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(minimalUser);

      const result = await service.register(minimalDto, response);

      expect(result).toEqual({
        user: minimalUser,
        accessToken: 'mock-access-token',
        expiresIn: '15m',
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          phone: minimalDto.phone,
          passwordHash: 'mock-password-hash',
          name: undefined,
          email: undefined,
          role: 'CUSTOMER',
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });
    });

    it('should throw BadRequestException when phone is already registered in preliminary check', async () => {
      const response = createMockResponse();

      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'existing-user-id',
        phone: registerDto.phone,
      });

      await expect(service.register(registerDto, response)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(registerDto, response)).rejects.toThrow(
        'Số điện thoại đã được đăng ký',
      );
      expect(HashUtil.hash).not.toHaveBeenCalled();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user.create throws PrismaClientKnownRequestError with code P2002', async () => {
      const response = createMockResponse();

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the constraint: `users_phone_key`',
        {
          code: 'P2002',
          clientVersion: '5.8.0',
        },
      );
      mockPrismaService.user.create.mockRejectedValue(p2002Error);

      await expect(service.register(registerDto, response)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.register(registerDto, response)).rejects.toThrow(
        'Số điện thoại đã được đăng ký',
      );
    });

    it('should rethrow PrismaClientKnownRequestError when error code is not P2002', async () => {
      const response = createMockResponse();

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      const p2025Error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.8.0',
        },
      );
      mockPrismaService.user.create.mockRejectedValue(p2025Error);

      await expect(service.register(registerDto, response)).rejects.toThrow(
        p2025Error,
      );
    });

    it('should rethrow unexpected non-Prisma errors during user creation', async () => {
      const response = createMockResponse();

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      const unexpectedError = new Error('Database connection failed');
      mockPrismaService.user.create.mockRejectedValue(unexpectedError);

      await expect(service.register(registerDto, response)).rejects.toThrow(
        unexpectedError,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      phone: '0912345678',
      password: 'Password@123',
    };

    const mockAdminUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      name: 'Admin User',
      phone: '0912345678',
      passwordHash: 'mock-password-hash',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('should login successfully when admin credentials are valid', async () => {
      const response = createMockResponse();

      mockPrismaService.user.findFirst.mockResolvedValue(mockAdminUser);
      jest.spyOn(HashUtil, 'compare').mockResolvedValue(true);

      const result = await service.login(loginDto, response);

      expect(result).toEqual({
        user: {
          id: mockAdminUser.id,
          email: mockAdminUser.email,
          role: mockAdminUser.role,
          name: mockAdminUser.name,
          phone: mockAdminUser.phone,
          createdAt: mockAdminUser.createdAt,
        },
        accessToken: 'mock-access-token',
        expiresIn: '15m',
      });
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { phone: loginDto.phone },
      });
      expect(HashUtil.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockAdminUser.passwordHash,
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({ httpOnly: false, path: '/' }),
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const response = createMockResponse();

      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto, response)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, response)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(HashUtil.compare).not.toHaveBeenCalled();
      expect(response.cookie).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const response = createMockResponse();

      mockPrismaService.user.findFirst.mockResolvedValue(mockAdminUser);
      jest.spyOn(HashUtil, 'compare').mockResolvedValue(false);

      await expect(service.login(loginDto, response)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, response)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(HashUtil.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockAdminUser.passwordHash,
      );
      expect(response.cookie).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password matches but user is not ADMIN', async () => {
      const response = createMockResponse();
      const customerUser = {
        ...mockAdminUser,
        role: 'CUSTOMER',
      };

      mockPrismaService.user.findFirst.mockResolvedValue(customerUser);
      jest.spyOn(HashUtil, 'compare').mockResolvedValue(true);

      await expect(service.login(loginDto, response)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto, response)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(response.cookie).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const rawOldRefreshToken = 'mock-raw-refresh-token';

    it('should throw UnauthorizedException when refresh token verification fails', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired or invalid signature');
      });

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow('Invalid refresh token');
      expect(mockPrismaService.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('should revoke token family and throw UnauthorizedException when token record is not found in database and payload has sub and family', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(
        'Token reuse detected. All sessions revoked for security.',
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'admin-1',
          tokenFamily: 'fam-1',
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException without revoking when token record is missing and payload lacks sub or family', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({});
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(
        'Token reuse detected. All sessions revoked for security.',
      );
      expect(mockPrismaService.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('should revoke token family and throw UnauthorizedException when token record is already revoked', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'tok-revoked',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        revokedAt: new Date('2026-01-01T00:00:00.000Z'),
        user: { phone: '0912345678', role: 'ADMIN' },
      });

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(
        'Token reuse detected. All sessions revoked for security.',
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'admin-1',
          tokenFamily: 'fam-1',
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException when tokenRecord.userId does not match payload.sub', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-2',
        family: 'fam-1',
      });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'tok-1',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      });

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw UnauthorizedException when tokenRecord.tokenFamily does not match payload.family', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-different',
      });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'tok-1',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      });

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should revoke family and throw UnauthorizedException when tokenRecord.user.role is not ADMIN', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'tok-1',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        revokedAt: null,
        user: { phone: '0912345678', role: 'CUSTOMER' },
      });

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow('Invalid refresh token');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'admin-1',
          tokenFamily: 'fam-1',
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should allow token reuse and return new tokens within grace period (< 30s) when replacement token is valid', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });

      const oldTokenRecord = {
        id: 'old-token-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        replacedBy: 'already-issued-new-token-id',
        updatedAt: new Date(Date.now() - 5000),
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      const issuedNewTokenRecord = {
        id: 'already-issued-new-token-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      mockPrismaService.refreshToken.findUnique
        .mockResolvedValueOnce(oldTokenRecord)
        .mockResolvedValueOnce(issuedNewTokenRecord);

      const result = await service.refresh(rawOldRefreshToken, response);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        expiresIn: '15m',
      });
      expect(mockPrismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { id: 'already-issued-new-token-id' },
        include: { user: true },
      });
      expect(mockPrismaService.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('should revoke family and throw UnauthorizedException when within grace period but replacement token is revoked', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });

      const oldTokenRecord = {
        id: 'old-token-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        replacedBy: 'revoked-issued-token-id',
        updatedAt: new Date(Date.now() - 5000),
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      const revokedIssuedTokenRecord = {
        id: 'revoked-issued-token-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        revokedAt: new Date(),
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      mockPrismaService.refreshToken.findUnique.mockImplementation(
        async ({ where }: any) => {
          if (where?.id === 'revoked-issued-token-id') {
            return revokedIssuedTokenRecord;
          }
          if (where?.tokenHash) {
            return oldTokenRecord;
          }
          return null;
        },
      );

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(
        'Token reuse detected. All sessions revoked for security.',
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'admin-1',
          tokenFamily: 'fam-1',
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should revoke family and throw UnauthorizedException when within grace period but replacement token is not found', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });

      const oldTokenRecord = {
        id: 'old-token-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        replacedBy: 'nonexistent-token-id',
        updatedAt: new Date(Date.now() - 5000),
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      mockPrismaService.refreshToken.findUnique.mockImplementation(
        async ({ where }: any) => {
          if (where?.id === 'nonexistent-token-id') {
            return null;
          }
          if (where?.tokenHash) {
            return oldTokenRecord;
          }
          return null;
        },
      );

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(
        'Token reuse detected. All sessions revoked for security.',
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'admin-1',
          tokenFamily: 'fam-1',
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should revoke family and throw UnauthorizedException when token reuse occurs outside grace period (>= 30s)', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });

      const oldTokenRecord = {
        id: 'old-token-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        replacedBy: 'some-issued-token-id',
        updatedAt: new Date(Date.now() - 35000),
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        oldTokenRecord,
      );

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(
        'Token reuse detected. All sessions revoked for security.',
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'admin-1',
          tokenFamily: 'fam-1',
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException when refresh token has expired', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });

      const expiredTokenRecord = {
        id: 'tok-expired',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        replacedBy: null,
        expiresAt: new Date(Date.now() - 5000),
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        expiredTokenRecord,
      );

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow('Refresh token expired');
    });

    it('should throw UnauthorizedException when atomic token replacement count is not 1', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });

      const validTokenRecord = {
        id: 'valid-tok-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        replacedBy: null,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        validTokenRecord,
      );
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh(rawOldRefreshToken, response),
      ).rejects.toThrow('Refresh token already used');
    });

    it('should refresh tokens successfully in development/non-production environment', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });

      const validTokenRecord = {
        id: 'valid-tok-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        replacedBy: null,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        validTokenRecord,
      );
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.refresh(rawOldRefreshToken, response);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        expiresIn: '15m',
      });
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'valid-tok-id',
          replacedBy: null,
          revokedAt: null,
        },
        data: { replacedBy: 'ref-token-id-1' },
      });
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({
          secure: false,
          sameSite: 'lax',
          httpOnly: true,
          path: '/',
        }),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          secure: false,
          sameSite: 'lax',
          httpOnly: false,
          path: '/',
        }),
      );
    });

    it('should refresh tokens successfully in production environment', async () => {
      const response = createMockResponse();

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'TOKEN_EXPIRES_IN') return '15m';
        if (key === 'REFRESH_EXPIRES_IN') return '7d';
        if (key === 'ADMIN_JWT_REFRESH_SECRET') return 'test-admin-refresh-secret';
        if (key === 'ADMIN_JWT_ACCESS_SECRET') return 'test-admin-access-secret';
        return undefined;
      });

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });

      const validTokenRecord = {
        id: 'valid-tok-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        replacedBy: null,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        validTokenRecord,
      );
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.refresh(rawOldRefreshToken, response);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        expiresIn: '15m',
      });
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({
          secure: true,
          sameSite: 'none',
          httpOnly: true,
        }),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          secure: true,
          sameSite: 'none',
          httpOnly: false,
        }),
      );
    });

    it('should calculate cookieMaxAge as 0 when refreshTokenExpiresAt is in the past', async () => {
      const response = createMockResponse();

      mockJwtService.verify.mockReturnValue({
        sub: 'admin-1',
        family: 'fam-1',
      });

      mockJwtService.decode.mockReturnValueOnce({
        sub: 'admin-1',
        exp: Math.floor(Date.now() / 1000) - 10,
      });

      const validTokenRecord = {
        id: 'valid-tok-id',
        userId: 'admin-1',
        tokenFamily: 'fam-1',
        replacedBy: null,
        expiresAt: new Date(Date.now() + 60000),
        revokedAt: null,
        user: { phone: '0912345678', role: 'ADMIN' },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        validTokenRecord,
      );
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.refresh(rawOldRefreshToken, response);

      expect(result).toEqual({
        accessToken: 'mock-access-token',
        expiresIn: '15m',
      });
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({
          maxAge: 0,
        }),
      );
    });
  });

  describe('forgotPassword', () => {
    const mockUser = {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
      phone: '0912345678',
    };

    it('should return generic message when user does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result).toEqual({
        message: 'If email exists, reset link will be sent',
      });
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should send email with FRONTEND_URL when configured', async () => {
      mockConfigService.get.mockImplementation((k: string) => {
        if (k === 'FRONTEND_URL') return 'https://admin.example.com/';
        return undefined;
      });

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('admin@example.com');

      expect(result).toEqual({
        message: 'If email exists, reset link will be sent',
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: {
          passwordResetTokenHash: expect.any(String),
          passwordResetExpiresAt: expect.any(Date),
        },
      });
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'admin@example.com',
        expect.stringMatching(
          /^https:\/\/admin\.example\.com\/reset-password\?token=[0-9a-f]{64}$/,
        ),
      );
    });

    it('should send email with CORS_ORIGIN fallback when FRONTEND_URL is not set', async () => {
      mockConfigService.get.mockImplementation((k: string) => {
        if (k === 'CORS_ORIGIN') {
          return 'https://admin-origin1.example.com, https://admin-origin2.example.com';
        }
        return undefined;
      });

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('admin@example.com');

      expect(result).toEqual({
        message: 'If email exists, reset link will be sent',
      });
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'admin@example.com',
        expect.stringMatching(
          /^https:\/\/admin-origin1\.example\.com\/reset-password\?token=[0-9a-f]{64}$/,
        ),
      );
    });

    it('should send email with default localhost:5174 fallback when neither FRONTEND_URL nor CORS_ORIGIN is set', async () => {
      mockConfigService.get.mockImplementation(() => undefined);

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('admin@example.com');

      expect(result).toEqual({
        message: 'If email exists, reset link will be sent',
      });
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'admin@example.com',
        expect.stringMatching(
          /^http:\/\/localhost:5174\/reset-password\?token=[0-9a-f]{64}$/,
        ),
      );
    });

    it('should fallback to parameter email when user.email is null or empty', async () => {
      mockConfigService.get.mockImplementation(() => undefined);

      const userWithoutEmail = {
        id: 'user-no-email',
        email: null,
      };
      mockPrismaService.user.findFirst.mockResolvedValue(userWithoutEmail);
      mockPrismaService.user.update.mockResolvedValue(userWithoutEmail);

      const result = await service.forgotPassword('fallback@example.com');

      expect(result).toEqual({
        message: 'If email exists, reset link will be sent',
      });
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'fallback@example.com',
        expect.any(String),
      );
    });

    it('should catch and log error silently when mailService throws Error with message', async () => {
      mockConfigService.get.mockImplementation(() => undefined);

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockMailService.sendPasswordResetEmail.mockRejectedValue(
        new Error('SMTP connection timed out'),
      );

      const result = await service.forgotPassword('admin@example.com');

      expect(result).toEqual({
        message: 'If email exists, reset link will be sent',
      });
    });

    it('should catch and log error silently when mailService throws non-Error or message-less error', async () => {
      mockConfigService.get.mockImplementation(() => undefined);

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockMailService.sendPasswordResetEmail.mockRejectedValue('Mail server unavailable');

      const result = await service.forgotPassword('admin@example.com');

      expect(result).toEqual({
        message: 'If email exists, reset link will be sent',
      });
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException when reset token is invalid or expired', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'NewPassword@123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resetPassword('invalid-token', 'NewPassword@123'),
      ).rejects.toThrow('Invalid or expired reset token');
      expect(HashUtil.hash).not.toHaveBeenCalled();
      expect(mockPrismaService.user.updateMany).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when consumed token count is not 1 (already consumed)', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'admin-1' });
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.resetPassword('expired-or-used-token', 'NewPassword@123'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resetPassword('expired-or-used-token', 'NewPassword@123'),
      ).rejects.toThrow('Invalid or expired reset token');
      expect(mockPrismaService.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('should successfully reset password and revoke active refresh tokens', async () => {
      const resetUser = { id: 'admin-1' };
      mockPrismaService.user.findFirst.mockResolvedValue(resetUser);
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.resetPassword(
        'valid-reset-token',
        'NewPassword@123',
      );

      expect(result).toEqual({ message: 'Password reset successful' });
      expect(HashUtil.hash).toHaveBeenCalledWith('NewPassword@123');
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          passwordResetTokenHash: hashToken('valid-reset-token'),
          passwordResetExpiresAt: { gt: expect.any(Date) },
        },
        select: { id: true },
      });
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'admin-1',
          passwordResetTokenHash: hashToken('valid-reset-token'),
          passwordResetExpiresAt: { gt: expect.any(Date) },
        },
        data: {
          passwordHash: 'mock-password-hash',
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      });
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'admin-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('logout', () => {
    it('should clear auth cookies and succeed when refreshToken is undefined', async () => {
      const response = createMockResponse();

      const result = await service.logout(undefined, response);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(response.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/',
        secure: false,
        sameSite: 'lax',
      });
      expect(response.clearCookie).toHaveBeenCalledWith('csrf_token', {
        path: '/',
        secure: false,
        sameSite: 'lax',
      });
      expect(mockJwtService.decode).not.toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('should clear cookies and succeed when decoded token lacks sub', async () => {
      const response = createMockResponse();
      mockJwtService.decode.mockReturnValueOnce({});

      const result = await service.logout('token-without-sub', response);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(response.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('should clear cookies and succeed when tokenRecord is not found in database', async () => {
      const response = createMockResponse();
      mockJwtService.decode.mockReturnValueOnce({ sub: 'admin-1' });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      const result = await service.logout('token-record-missing', response);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockPrismaService.refreshToken.updateMany).not.toHaveBeenCalled();
      expect(response.clearCookie).toHaveBeenCalledTimes(2);
    });

    it('should revoke entire token family and clear cookies when tokenRecord exists', async () => {
      const response = createMockResponse();
      mockJwtService.decode.mockReturnValueOnce({ sub: 'admin-1' });
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'tok-id-1',
        tokenFamily: 'fam-admin-2',
      });

      const result = await service.logout('valid-logout-token', response);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockPrismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: hashToken('valid-logout-token') },
      });
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'admin-1',
          tokenFamily: 'fam-admin-2',
        },
        data: { revokedAt: expect.any(Date) },
      });
      expect(response.clearCookie).toHaveBeenCalledTimes(2);
    });

    it('should catch and log error silently when error occurs during revocation', async () => {
      const response = createMockResponse();
      mockJwtService.decode.mockReturnValueOnce({ sub: 'admin-1' });
      mockPrismaService.refreshToken.findUnique.mockRejectedValue(
        new Error('DB disconnect'),
      );

      const result = await service.logout('error-token', response);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(response.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateTokens (private method)', () => {
    it('should generate access and refresh tokens and return AuthTokensEntity', () => {
      const tokens = (service as any).generateTokens(
        'admin-1',
        '0912345678',
        'ADMIN',
      );

      expect(tokens).toBeInstanceOf(AuthTokensEntity);
      expect(tokens.accessToken).toBe('mock-access-token');
      expect(tokens.refreshToken).toBe('mock-refresh-token');
      expect(tokens.expiresIn).toBe('15m');
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: 'admin-1', phone: '0912345678', role: 'ADMIN' },
        expect.objectContaining({
          secret: 'test-admin-access-secret',
          expiresIn: '15m',
          issuer: ADMIN_JWT_ISSUER,
          audience: ADMIN_JWT_AUDIENCE,
        }),
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: 'admin-1', phone: '0912345678', role: 'ADMIN' },
        expect.objectContaining({
          secret: 'test-admin-refresh-secret',
          expiresIn: '7d',
          issuer: ADMIN_JWT_ISSUER,
          audience: ADMIN_JWT_AUDIENCE,
        }),
      );
    });
  });

  describe('generateTokensWithRotation (private method)', () => {
    it('should throw Error when decoded refresh token lacks exp property', async () => {
      const response = createMockResponse();
      mockJwtService.decode.mockReturnValue({});

      await expect(
        (service as any).generateTokensWithRotation(
          'admin-1',
          '0912345678',
          'ADMIN',
          response,
        ),
      ).rejects.toThrow('Refresh token expiry is not configured');
    });

    it('should throw Error when refresh token hash collision occurs during create', async () => {
      const response = createMockResponse();
      mockPrismaService.refreshToken.create.mockRejectedValue(
        new Error('Token hash collision'),
      );

      await expect(
        (service as any).generateTokensWithRotation(
          'admin-1',
          '0912345678',
          'ADMIN',
          response,
        ),
      ).rejects.toThrow('Failed to generate unique token. Please try again.');
    });

    it('should use existingFamily when provided instead of generating a new one', async () => {
      const response = createMockResponse();

      const result = await (service as any).generateTokensWithRotation(
        'admin-1',
        '0912345678',
        'ADMIN',
        response,
        'custom-family-123',
      );

      expect(result.accessToken).toBe('mock-access-token');
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tokenFamily: 'custom-family-123',
          }),
        }),
      );
    });

    it('should not set cookies when setCookies is false', async () => {
      const response = createMockResponse();

      const result = await (service as any).generateTokensWithRotation(
        'admin-1',
        '0912345678',
        'ADMIN',
        response,
        undefined,
        mockPrismaService,
        false,
      );

      expect(result.accessToken).toBe('mock-access-token');
      expect(response.cookie).not.toHaveBeenCalled();
    });

    it('should set production cookie options when NODE_ENV is production', async () => {
      const response = createMockResponse();

      mockConfigService.get.mockImplementation((k: string) => {
        if (k === 'NODE_ENV') return 'production';
        if (k === 'TOKEN_EXPIRES_IN') return '15m';
        if (k === 'REFRESH_EXPIRES_IN') return '7d';
        if (k === 'ADMIN_JWT_ACCESS_SECRET') return 'test-admin-access-secret';
        if (k === 'ADMIN_JWT_REFRESH_SECRET') return 'test-admin-refresh-secret';
        return undefined;
      });

      const result = await (service as any).generateTokensWithRotation(
        'admin-1',
        '0912345678',
        'ADMIN',
        response,
      );

      expect(result.accessToken).toBe('mock-access-token');
      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'mock-refresh-token',
        expect.objectContaining({
          secure: true,
          sameSite: 'none',
        }),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.any(String),
        expect.objectContaining({
          secure: true,
          sameSite: 'none',
        }),
      );
    });
  });
});
