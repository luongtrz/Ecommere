import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtUtil, JwtPayload } from './jwt.util';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER } from '@/auth/auth.constants';

describe('JwtUtil', () => {
  let util: JwtUtil;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPayload: JwtPayload = {
    sub: 'admin-user-id-123',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtUtil,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    util = module.get<JwtUtil>(JwtUtil);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined and instantiable', () => {
    expect(util).toBeDefined();
    expect(util).toBeInstanceOf(JwtUtil);
    expect(new JwtUtil()).toBeInstanceOf(JwtUtil);
  });

  it('should conform to JwtPayload interface structure', () => {
    const payload: JwtPayload = {
      sub: 'admin-uuid',
      email: 'test@admin.com',
      role: 'SUPERADMIN',
    };
    expect(payload.sub).toBe('admin-uuid');
    expect(payload.email).toBe('test@admin.com');
    expect(payload.role).toBe('SUPERADMIN');
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with correct configuration and payload', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ADMIN_JWT_ACCESS_SECRET') return 'test-access-secret-123';
        if (key === 'TOKEN_EXPIRES_IN') return '15m';
        return undefined;
      });
      mockJwtService.sign.mockReturnValue('mocked-access-token');

      const result = JwtUtil.generateAccessToken(
        jwtService,
        configService,
        mockPayload,
      );

      expect(result).toBe('mocked-access-token');
      expect(configService.get).toHaveBeenCalledWith('ADMIN_JWT_ACCESS_SECRET');
      expect(configService.get).toHaveBeenCalledWith('TOKEN_EXPIRES_IN');
      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        secret: 'test-access-secret-123',
        expiresIn: '15m',
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
      });
    });

    it('should rethrow error when jwtService.sign fails', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ADMIN_JWT_ACCESS_SECRET') return 'test-access-secret-123';
        if (key === 'TOKEN_EXPIRES_IN') return '15m';
        return undefined;
      });
      const signError = new Error('JWT signing error');
      mockJwtService.sign.mockImplementation(() => {
        throw signError;
      });

      expect(() =>
        JwtUtil.generateAccessToken(jwtService, configService, mockPayload),
      ).toThrow(signError);
      expect(() =>
        JwtUtil.generateAccessToken(jwtService, configService, mockPayload),
      ).toThrow('JWT signing error');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with correct configuration and payload', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ADMIN_JWT_REFRESH_SECRET')
          return 'test-refresh-secret-456';
        if (key === 'REFRESH_EXPIRES_IN') return '7d';
        return undefined;
      });
      mockJwtService.sign.mockReturnValue('mocked-refresh-token');

      const result = JwtUtil.generateRefreshToken(
        jwtService,
        configService,
        mockPayload,
      );

      expect(result).toBe('mocked-refresh-token');
      expect(configService.get).toHaveBeenCalledWith(
        'ADMIN_JWT_REFRESH_SECRET',
      );
      expect(configService.get).toHaveBeenCalledWith('REFRESH_EXPIRES_IN');
      expect(jwtService.sign).toHaveBeenCalledWith(mockPayload, {
        secret: 'test-refresh-secret-456',
        expiresIn: '7d',
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
      });
    });

    it('should rethrow error when jwtService.sign fails during refresh token generation', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ADMIN_JWT_REFRESH_SECRET')
          return 'test-refresh-secret-456';
        if (key === 'REFRESH_EXPIRES_IN') return '7d';
        return undefined;
      });
      const refreshSignError = new Error('Refresh token signing error');
      mockJwtService.sign.mockImplementation(() => {
        throw refreshSignError;
      });

      expect(() =>
        JwtUtil.generateRefreshToken(jwtService, configService, mockPayload),
      ).toThrow(refreshSignError);
      expect(() =>
        JwtUtil.generateRefreshToken(jwtService, configService, mockPayload),
      ).toThrow('Refresh token signing error');
    });
  });

  describe('verifyAccessToken', () => {
    const rawToken = 'valid-access-token';

    it('should verify access token and return decoded payload', () => {
      mockConfigService.get.mockReturnValue('test-access-secret-123');
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = JwtUtil.verifyAccessToken(
        jwtService,
        configService,
        rawToken,
      );

      expect(result).toEqual(mockPayload);
      expect(configService.get).toHaveBeenCalledWith('ADMIN_JWT_ACCESS_SECRET');
      expect(jwtService.verify).toHaveBeenCalledWith(rawToken, {
        secret: 'test-access-secret-123',
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
      });
    });

    it('should rethrow error when jwtService.verify throws an exception for invalid access token', () => {
      mockConfigService.get.mockReturnValue('test-access-secret-123');
      const verifyError = new Error('jwt expired');
      mockJwtService.verify.mockImplementation(() => {
        throw verifyError;
      });

      expect(() =>
        JwtUtil.verifyAccessToken(jwtService, configService, 'expired-token'),
      ).toThrow(verifyError);
      expect(() =>
        JwtUtil.verifyAccessToken(jwtService, configService, 'expired-token'),
      ).toThrow('jwt expired');
    });
  });

  describe('verifyRefreshToken', () => {
    const rawToken = 'valid-refresh-token';

    it('should verify refresh token and return decoded payload', () => {
      mockConfigService.get.mockReturnValue('test-refresh-secret-456');
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = JwtUtil.verifyRefreshToken(
        jwtService,
        configService,
        rawToken,
      );

      expect(result).toEqual(mockPayload);
      expect(configService.get).toHaveBeenCalledWith(
        'ADMIN_JWT_REFRESH_SECRET',
      );
      expect(jwtService.verify).toHaveBeenCalledWith(rawToken, {
        secret: 'test-refresh-secret-456',
        issuer: ADMIN_JWT_ISSUER,
        audience: ADMIN_JWT_AUDIENCE,
      });
    });

    it('should rethrow error when jwtService.verify throws an exception for invalid refresh token', () => {
      mockConfigService.get.mockReturnValue('test-refresh-secret-456');
      const verifyError = new Error('invalid signature');
      mockJwtService.verify.mockImplementation(() => {
        throw verifyError;
      });

      expect(() =>
        JwtUtil.verifyRefreshToken(jwtService, configService, 'tampered-token'),
      ).toThrow(verifyError);
      expect(() =>
        JwtUtil.verifyRefreshToken(jwtService, configService, 'tampered-token'),
      ).toThrow('invalid signature');
    });
  });
});
