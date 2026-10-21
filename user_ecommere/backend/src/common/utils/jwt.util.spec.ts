import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_ISSUER, JWT_AUDIENCE } from '@/auth/constants';
import { JwtUtil, JwtPayload } from './jwt.util';

describe('JwtUtil', () => {
  let mockJwtService: {
    sign: jest.Mock;
    verify: jest.Mock;
  };

  let mockConfigService: {
    get: jest.Mock;
  };

  beforeEach(() => {
    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined and can be instantiated', () => {
    const util = new JwtUtil();
    expect(util).toBeDefined();
    expect(util).toBeInstanceOf(JwtUtil);
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with access secret, token expiration, issuer and audience', () => {
      const payload: JwtPayload = {
        sub: 'user-uuid-123',
        email: 'user@example.com',
        role: 'CUSTOMER',
      };

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'access-secret-key';
        if (key === 'TOKEN_EXPIRES_IN') return '15m';
        return undefined;
      });

      mockJwtService.sign.mockReturnValue('mocked.access.jwt.token');

      const result = JwtUtil.generateAccessToken(
        mockJwtService as unknown as JwtService,
        mockConfigService as unknown as ConfigService,
        payload,
      );

      expect(result).toBe('mocked.access.jwt.token');
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
      expect(mockConfigService.get).toHaveBeenCalledWith('TOKEN_EXPIRES_IN');
      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'access-secret-key',
        expiresIn: '15m',
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with refresh secret, refresh expiration, issuer and audience', () => {
      const payload: JwtPayload = {
        sub: 'user-uuid-123',
        email: 'user@example.com',
        role: 'CUSTOMER',
      };

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret-key';
        if (key === 'REFRESH_EXPIRES_IN') return '7d';
        return undefined;
      });

      mockJwtService.sign.mockReturnValue('mocked.refresh.jwt.token');

      const result = JwtUtil.generateRefreshToken(
        mockJwtService as unknown as JwtService,
        mockConfigService as unknown as ConfigService,
        payload,
      );

      expect(result).toBe('mocked.refresh.jwt.token');
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
      expect(mockConfigService.get).toHaveBeenCalledWith('REFRESH_EXPIRES_IN');
      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'refresh-secret-key',
        expiresIn: '7d',
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and decode access token using access secret, issuer and audience', () => {
      const token = 'valid.access.jwt.token';
      const expectedPayload: JwtPayload = {
        sub: 'user-uuid-123',
        email: 'user@example.com',
        role: 'CUSTOMER',
      };

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'access-secret-key';
        return undefined;
      });

      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = JwtUtil.verifyAccessToken(
        mockJwtService as unknown as JwtService,
        mockConfigService as unknown as ConfigService,
        token,
      );

      expect(result).toEqual(expectedPayload);
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
      expect(mockJwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'access-secret-key',
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    });

    it('should rethrow error when access token verification fails', () => {
      const token = 'invalid.access.jwt.token';
      mockConfigService.get.mockReturnValue('access-secret-key');
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      expect(() =>
        JwtUtil.verifyAccessToken(
          mockJwtService as unknown as JwtService,
          mockConfigService as unknown as ConfigService,
          token,
        ),
      ).toThrow('jwt expired');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode refresh token using refresh secret, issuer and audience', () => {
      const token = 'valid.refresh.jwt.token';
      const expectedPayload: JwtPayload = {
        sub: 'user-uuid-123',
        email: 'user@example.com',
        role: 'CUSTOMER',
      };

      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret-key';
        return undefined;
      });

      mockJwtService.verify.mockReturnValue(expectedPayload);

      const result = JwtUtil.verifyRefreshToken(
        mockJwtService as unknown as JwtService,
        mockConfigService as unknown as ConfigService,
        token,
      );

      expect(result).toEqual(expectedPayload);
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
      expect(mockJwtService.verify).toHaveBeenCalledWith(token, {
        secret: 'refresh-secret-key',
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
    });

    it('should rethrow error when refresh token verification fails', () => {
      const token = 'invalid.refresh.jwt.token';
      mockConfigService.get.mockReturnValue('refresh-secret-key');
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid signature');
      });

      expect(() =>
        JwtUtil.verifyRefreshToken(
          mockJwtService as unknown as JwtService,
          mockConfigService as unknown as ConfigService,
          token,
        ),
      ).toThrow('invalid signature');
    });
  });
});
