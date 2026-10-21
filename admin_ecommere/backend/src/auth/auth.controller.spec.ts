import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const canActivateStub = jest.fn(() => true);

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  const createMockResponse = (): Response =>
    ({
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }) as unknown as Response;

  const createMockRequest = (
    cookies: Record<string, string> = {},
  ): Request =>
    ({
      cookies,
    }) as unknown as Request;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: canActivateStub })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: canActivateStub })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
  });

  describe('Route guards', () => {
    it('overrides route guards with a canActivate stub returning true', () => {
      expect(canActivateStub()).toBe(true);
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      phone: '0912345678',
      password: 'Password@123',
      name: 'Nguyen Van A',
      email: 'user@example.com',
    };

    it('delegates to authService.register with registerDto and response, and returns the result', async () => {
      const mockResponse = createMockResponse();
      const expectedResult = {
        user: {
          id: 'user-uuid-1',
          phone: registerDto.phone,
          name: registerDto.name,
          email: registerDto.email,
          role: 'CUSTOMER',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        accessToken: 'access-token-xyz',
        expiresIn: '15m',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto, mockResponse);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto,
        mockResponse,
      );
      expect(result).toEqual(expectedResult);
    });

    it('propagates BadRequestException when authService.register rejects on duplicate phone/email', async () => {
      const mockResponse = createMockResponse();
      const error = new BadRequestException('Số điện thoại đã được đăng ký');
      mockAuthService.register.mockRejectedValue(error);

      await expect(
        controller.register(registerDto, mockResponse),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.register(registerDto, mockResponse),
      ).rejects.toThrow('Số điện thoại đã được đăng ký');

      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto,
        mockResponse,
      );
    });

    it('propagates unexpected errors when authService.register fails', async () => {
      const mockResponse = createMockResponse();
      const error = new Error('Database service unavailable');
      mockAuthService.register.mockRejectedValue(error);

      await expect(
        controller.register(registerDto, mockResponse),
      ).rejects.toThrow(error);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto,
        mockResponse,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      phone: '0901234567',
      password: 'StrongPassword@123',
    };

    it('delegates to authService.login with loginDto and response, and returns the result', async () => {
      const mockResponse = createMockResponse();
      const expectedResult = {
        user: {
          id: 'admin-uuid-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          name: 'Admin User',
          phone: loginDto.phone,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        accessToken: 'jwt-access-token-admin',
        expiresIn: '15m',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, mockResponse);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto,
        mockResponse,
      );
      expect(result).toEqual(expectedResult);
    });

    it('propagates UnauthorizedException when authService.login rejects on invalid credentials', async () => {
      const mockResponse = createMockResponse();
      const error = new UnauthorizedException('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto,
        mockResponse,
      );
    });

    it('propagates unexpected errors when authService.login fails', async () => {
      const mockResponse = createMockResponse();
      const error = new Error('Internal authentication failure');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        error,
      );

      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto,
        mockResponse,
      );
    });
  });

  describe('refresh', () => {
    it('extracts refreshToken from cookies, delegates to authService.refresh, and returns the result', async () => {
      const refreshToken = 'valid-refresh-token-123';
      const mockRequest = createMockRequest({ refreshToken });
      const mockResponse = createMockResponse();
      const expectedResult = {
        accessToken: 'new-access-token-456',
        expiresIn: '15m',
      };

      mockAuthService.refresh.mockResolvedValue(expectedResult);

      const result = await controller.refresh(mockRequest, mockResponse);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshToken,
        mockResponse,
      );
      expect(result).toEqual(expectedResult);
    });

    it('throws UnauthorizedException when refreshToken cookie is missing from cookies', async () => {
      const mockRequest = createMockRequest({});
      const mockResponse = createMockResponse();

      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow('Refresh token not found in cookies');

      expect(mockAuthService.refresh).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when refreshToken cookie is an empty string', async () => {
      const mockRequest = createMockRequest({ refreshToken: '' });
      const mockResponse = createMockResponse();

      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow('Refresh token not found in cookies');

      expect(mockAuthService.refresh).not.toHaveBeenCalled();
    });

    it('propagates UnauthorizedException when authService.refresh rejects on invalid token signature', async () => {
      const refreshToken = 'invalid-token-signature';
      const mockRequest = createMockRequest({ refreshToken });
      const mockResponse = createMockResponse();
      const error = new UnauthorizedException('Invalid refresh token');
      mockAuthService.refresh.mockRejectedValue(error);

      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow('Invalid refresh token');

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshToken,
        mockResponse,
      );
    });

    it('propagates UnauthorizedException when authService.refresh detects token reuse', async () => {
      const refreshToken = 'reused-token';
      const mockRequest = createMockRequest({ refreshToken });
      const mockResponse = createMockResponse();
      const error = new UnauthorizedException(
        'Token reuse detected. All sessions revoked for security.',
      );
      mockAuthService.refresh.mockRejectedValue(error);

      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(
        'Token reuse detected. All sessions revoked for security.',
      );

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshToken,
        mockResponse,
      );
    });

    it('propagates UnauthorizedException when authService.refresh rejects on expired refresh token', async () => {
      const refreshToken = 'expired-token';
      const mockRequest = createMockRequest({ refreshToken });
      const mockResponse = createMockResponse();
      const error = new UnauthorizedException('Refresh token expired');
      mockAuthService.refresh.mockRejectedValue(error);

      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.refresh(mockRequest, mockResponse),
      ).rejects.toThrow('Refresh token expired');

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshToken,
        mockResponse,
      );
    });
  });

  describe('logout', () => {
    it('extracts refreshToken from cookies, delegates to authService.logout, and returns the result', async () => {
      const refreshToken = 'token-to-revoke';
      const mockRequest = createMockRequest({ refreshToken });
      const mockResponse = createMockResponse();
      const expectedResult = { message: 'Logged out successfully' };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(mockRequest, mockResponse);

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        refreshToken,
        mockResponse,
      );
      expect(result).toEqual(expectedResult);
    });

    it('delegates with undefined refreshToken when cookie is absent, and returns the result', async () => {
      const mockRequest = createMockRequest({});
      const mockResponse = createMockResponse();
      const expectedResult = { message: 'Logged out successfully' };

      mockAuthService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout(mockRequest, mockResponse);

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        undefined,
        mockResponse,
      );
      expect(result).toEqual(expectedResult);
    });

    it('propagates unexpected errors when authService.logout rejects', async () => {
      const refreshToken = 'faulty-token';
      const mockRequest = createMockRequest({ refreshToken });
      const mockResponse = createMockResponse();
      const error = new Error('Logout failure');

      mockAuthService.logout.mockRejectedValue(error);

      await expect(
        controller.logout(mockRequest, mockResponse),
      ).rejects.toThrow(error);

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        refreshToken,
        mockResponse,
      );
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'user@example.com',
    };

    it('delegates forgotPasswordDto.email to authService.forgotPassword and returns the result', async () => {
      const expectedResult = {
        message: 'If email exists, reset link will be sent',
      };

      mockAuthService.forgotPassword.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors when authService.forgotPassword rejects', async () => {
      const error = new Error('Mail provider offline');
      mockAuthService.forgotPassword.mockRejectedValue(error);

      await expect(
        controller.forgotPassword(forgotPasswordDto),
      ).rejects.toThrow(error);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto.email,
      );
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'secure-reset-token-abc',
      newPassword: 'NewPassword@123',
    };

    it('delegates token and newPassword to authService.resetPassword and returns the result', async () => {
      const expectedResult = { message: 'Password reset successful' };

      mockAuthService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
      expect(result).toEqual(expectedResult);
    });

    it('propagates BadRequestException when authService.resetPassword rejects with invalid or expired token', async () => {
      const error = new BadRequestException('Invalid or expired reset token');
      mockAuthService.resetPassword.mockRejectedValue(error);

      await expect(
        controller.resetPassword(resetPasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.resetPassword(resetPasswordDto),
      ).rejects.toThrow('Invalid or expired reset token');

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
    });

    it('propagates unexpected errors when authService.resetPassword fails', async () => {
      const error = new Error('Password hashing error');
      mockAuthService.resetPassword.mockRejectedValue(error);

      await expect(
        controller.resetPassword(resetPasswordDto),
      ).rejects.toThrow(error);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
    });
  });
});
