import { createHash } from 'crypto';
import { Response } from 'express';
import {
  hashToken,
  generateTokenFamily,
  generateCsrfToken,
  getCookieOptions,
  getCsrfCookieOptions,
  setRefreshTokenCookie,
  setCsrfTokenCookie,
  clearAuthCookies,
} from './token.util';

describe('token.util', () => {
  const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

  let mockResponse: {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };

  beforeEach(() => {
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  describe('hashToken', () => {
    it('should correctly hash a token with sha256 hex digest', () => {
      const rawToken = 'my-secret-refresh-token';
      const expectedHash = createHash('sha256').update(rawToken).digest('hex');

      const result = hashToken(rawToken);

      expect(result).toBe(expectedHash);
      expect(result).toHaveLength(64);
    });

    it('should hash an empty token correctly', () => {
      const expectedHash = createHash('sha256').update('').digest('hex');

      const result = hashToken('');

      expect(result).toBe(expectedHash);
    });
  });

  describe('generateTokenFamily', () => {
    it('should return a 32-character hexadecimal string (16 bytes)', () => {
      const tokenFamily = generateTokenFamily();

      expect(typeof tokenFamily).toBe('string');
      expect(tokenFamily).toHaveLength(32);
      expect(tokenFamily).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should return unique token families on consecutive calls', () => {
      const family1 = generateTokenFamily();
      const family2 = generateTokenFamily();

      expect(family1).not.toBe(family2);
    });
  });

  describe('generateCsrfToken', () => {
    it('should return a 64-character hexadecimal string (32 bytes)', () => {
      const csrfToken = generateCsrfToken();

      expect(typeof csrfToken).toBe('string');
      expect(csrfToken).toHaveLength(64);
      expect(csrfToken).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should return unique csrf tokens on consecutive calls', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('getCookieOptions', () => {
    it('should return options with secure=true and sameSite=none in production with default maxAge', () => {
      const options = getCookieOptions(true);

      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: DEFAULT_MAX_AGE,
      });
    });

    it('should return options with secure=false and sameSite=lax in non-production with default maxAge', () => {
      const options = getCookieOptions(false);

      expect(options).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: DEFAULT_MAX_AGE,
      });
    });

    it('should return options with custom maxAge in production', () => {
      const customMaxAge = 3600000;
      const options = getCookieOptions(true, customMaxAge);

      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: customMaxAge,
      });
    });

    it('should return options with custom maxAge in non-production', () => {
      const customMaxAge = 1800000;
      const options = getCookieOptions(false, customMaxAge);

      expect(options).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: customMaxAge,
      });
    });
  });

  describe('getCsrfCookieOptions', () => {
    it('should return options with httpOnly=false, secure=true, sameSite=none in production with default maxAge', () => {
      const options = getCsrfCookieOptions(true);

      expect(options).toEqual({
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: DEFAULT_MAX_AGE,
      });
    });

    it('should return options with httpOnly=false, secure=false, sameSite=lax in non-production with default maxAge', () => {
      const options = getCsrfCookieOptions(false);

      expect(options).toEqual({
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: DEFAULT_MAX_AGE,
      });
    });

    it('should return options with custom maxAge in production', () => {
      const customMaxAge = 60000;
      const options = getCsrfCookieOptions(true, customMaxAge);

      expect(options).toEqual({
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: customMaxAge,
      });
    });

    it('should return options with custom maxAge in non-production', () => {
      const customMaxAge = 120000;
      const options = getCsrfCookieOptions(false, customMaxAge);

      expect(options).toEqual({
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: customMaxAge,
      });
    });
  });

  describe('setRefreshTokenCookie', () => {
    it('should set refreshToken cookie with default maxAge in production', () => {
      setRefreshTokenCookie(
        mockResponse as unknown as Response,
        'test-refresh-token',
        true,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh-token',
        {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/',
          maxAge: DEFAULT_MAX_AGE,
        },
      );
    });

    it('should set refreshToken cookie with default maxAge in non-production', () => {
      setRefreshTokenCookie(
        mockResponse as unknown as Response,
        'test-refresh-token',
        false,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh-token',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: DEFAULT_MAX_AGE,
        },
      );
    });

    it('should set refreshToken cookie with custom maxAge in production', () => {
      const customMaxAge = 500000;
      setRefreshTokenCookie(
        mockResponse as unknown as Response,
        'test-refresh-token',
        true,
        customMaxAge,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh-token',
        {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/',
          maxAge: customMaxAge,
        },
      );
    });

    it('should set refreshToken cookie with custom maxAge in non-production', () => {
      const customMaxAge = 250000;
      setRefreshTokenCookie(
        mockResponse as unknown as Response,
        'test-refresh-token',
        false,
        customMaxAge,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh-token',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: customMaxAge,
        },
      );
    });
  });

  describe('setCsrfTokenCookie', () => {
    it('should set csrf_token cookie with default maxAge in production', () => {
      setCsrfTokenCookie(
        mockResponse as unknown as Response,
        'test-csrf-token',
        true,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf_token',
        'test-csrf-token',
        {
          httpOnly: false,
          secure: true,
          sameSite: 'none',
          path: '/',
          maxAge: DEFAULT_MAX_AGE,
        },
      );
    });

    it('should set csrf_token cookie with default maxAge in non-production', () => {
      setCsrfTokenCookie(
        mockResponse as unknown as Response,
        'test-csrf-token',
        false,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf_token',
        'test-csrf-token',
        {
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: DEFAULT_MAX_AGE,
        },
      );
    });

    it('should set csrf_token cookie with custom maxAge in production', () => {
      const customMaxAge = 99999;
      setCsrfTokenCookie(
        mockResponse as unknown as Response,
        'test-csrf-token',
        true,
        customMaxAge,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf_token',
        'test-csrf-token',
        {
          httpOnly: false,
          secure: true,
          sameSite: 'none',
          path: '/',
          maxAge: customMaxAge,
        },
      );
    });

    it('should set csrf_token cookie with custom maxAge in non-production', () => {
      const customMaxAge = 88888;
      setCsrfTokenCookie(
        mockResponse as unknown as Response,
        'test-csrf-token',
        false,
        customMaxAge,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf_token',
        'test-csrf-token',
        {
          httpOnly: false,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: customMaxAge,
        },
      );
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear cookies with secure=false and sameSite=lax when isProduction defaults to false', () => {
      clearAuthCookies(mockResponse as unknown as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/',
        secure: false,
        sameSite: 'lax',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('csrf_token', {
        path: '/',
        secure: false,
        sameSite: 'lax',
      });
    });

    it('should clear cookies with secure=false and sameSite=lax when isProduction is explicitly false', () => {
      clearAuthCookies(mockResponse as unknown as Response, false);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/',
        secure: false,
        sameSite: 'lax',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('csrf_token', {
        path: '/',
        secure: false,
        sameSite: 'lax',
      });
    });

    it('should clear cookies with secure=true and sameSite=none when isProduction is true', () => {
      clearAuthCookies(mockResponse as unknown as Response, true);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', {
        path: '/',
        secure: true,
        sameSite: 'none',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('csrf_token', {
        path: '/',
        secure: true,
        sameSite: 'none',
      });
    });
  });
});
