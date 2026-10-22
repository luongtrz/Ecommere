import { Response } from 'express';
import { createHash } from 'crypto';
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

describe('Token Utilities', () => {
  const DEFAULT_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 604800000 ms

  describe('hashToken', () => {
    it('should hash a non-empty token using SHA-256 and return hex digest', () => {
      const rawToken = 'my-secret-token-value-12345';
      const expectedHash = createHash('sha256').update(rawToken).digest('hex');

      const result = hashToken(rawToken);

      expect(result).toBe(expectedHash);
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should correctly hash an empty string', () => {
      const emptyToken = '';
      const expectedEmptyHash = createHash('sha256')
        .update(emptyToken)
        .digest('hex');

      const result = hashToken(emptyToken);

      expect(result).toBe(expectedEmptyHash);
      expect(result).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      );
    });

    it('should return different hashes for different token inputs', () => {
      const tokenA = 'token-alpha';
      const tokenB = 'token-beta';

      const hashA = hashToken(tokenA);
      const hashB = hashToken(tokenB);

      expect(hashA).not.toBe(hashB);
    });
  });

  describe('generateTokenFamily', () => {
    it('should generate a 32-character hexadecimal string (16 bytes)', () => {
      const familyId = generateTokenFamily();

      expect(typeof familyId).toBe('string');
      expect(familyId).toHaveLength(32);
      expect(familyId).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate unique values on consecutive calls', () => {
      const familyId1 = generateTokenFamily();
      const familyId2 = generateTokenFamily();

      expect(familyId1).not.toBe(familyId2);
    });
  });

  describe('generateCsrfToken', () => {
    it('should generate a 64-character hexadecimal string (32 bytes)', () => {
      const csrfToken = generateCsrfToken();

      expect(typeof csrfToken).toBe('string');
      expect(csrfToken).toHaveLength(64);
      expect(csrfToken).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique values on consecutive calls', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('getCookieOptions', () => {
    it('should return options with secure=true and sameSite="none" in production with default maxAge', () => {
      const options = getCookieOptions(true);

      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: DEFAULT_COOKIE_MAX_AGE_MS,
      });
    });

    it('should return options with secure=false and sameSite="lax" in non-production with default maxAge', () => {
      const options = getCookieOptions(false);

      expect(options).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: DEFAULT_COOKIE_MAX_AGE_MS,
      });
    });

    it('should use custom maxAge when provided in production mode', () => {
      const customMaxAge = 3600000; // 1 hour
      const options = getCookieOptions(true, customMaxAge);

      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: customMaxAge,
      });
    });

    it('should use custom maxAge when provided in non-production mode', () => {
      const customMaxAge = 15000;
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
    it('should return options with httpOnly=false, secure=true, and sameSite="none" in production with default maxAge', () => {
      const options = getCsrfCookieOptions(true);

      expect(options).toEqual({
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: DEFAULT_COOKIE_MAX_AGE_MS,
      });
    });

    it('should return options with httpOnly=false, secure=false, and sameSite="lax" in non-production with default maxAge', () => {
      const options = getCsrfCookieOptions(false);

      expect(options).toEqual({
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: DEFAULT_COOKIE_MAX_AGE_MS,
      });
    });

    it('should use custom maxAge when provided in production mode', () => {
      const customMaxAge = 60000; // 1 minute
      const options = getCsrfCookieOptions(true, customMaxAge);

      expect(options).toEqual({
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: customMaxAge,
      });
    });

    it('should use custom maxAge when provided in non-production mode', () => {
      const customMaxAge = 86400000; // 1 day
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
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        cookie: jest.fn(),
      };
    });

    it('should set refreshToken cookie with production options and default maxAge', () => {
      const token = 'sample-refresh-token-prod';

      setRefreshTokenCookie(mockResponse as Response, token, true);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: DEFAULT_COOKIE_MAX_AGE_MS,
      });
    });

    it('should set refreshToken cookie with non-production options and default maxAge', () => {
      const token = 'sample-refresh-token-dev';

      setRefreshTokenCookie(mockResponse as Response, token, false);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: DEFAULT_COOKIE_MAX_AGE_MS,
      });
    });

    it('should set refreshToken cookie with custom maxAge in production mode', () => {
      const token = 'sample-refresh-token-custom';
      const customMaxAge = 500000;

      setRefreshTokenCookie(
        mockResponse as Response,
        token,
        true,
        customMaxAge,
      );

      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: customMaxAge,
      });
    });

    it('should set refreshToken cookie with custom maxAge in non-production mode', () => {
      const token = 'sample-refresh-token-custom-dev';
      const customMaxAge = 120000;

      setRefreshTokenCookie(
        mockResponse as Response,
        token,
        false,
        customMaxAge,
      );

      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: customMaxAge,
      });
    });
  });

  describe('setCsrfTokenCookie', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        cookie: jest.fn(),
      };
    });

    it('should set csrf_token cookie with production options and default maxAge', () => {
      const token = 'sample-csrf-token-prod';

      setCsrfTokenCookie(mockResponse as Response, token, true);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith('csrf_token', token, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: DEFAULT_COOKIE_MAX_AGE_MS,
      });
    });

    it('should set csrf_token cookie with non-production options and default maxAge', () => {
      const token = 'sample-csrf-token-dev';

      setCsrfTokenCookie(mockResponse as Response, token, false);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith('csrf_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: DEFAULT_COOKIE_MAX_AGE_MS,
      });
    });

    it('should set csrf_token cookie with custom maxAge in production mode', () => {
      const token = 'sample-csrf-token-custom-prod';
      const customMaxAge = 45000;

      setCsrfTokenCookie(mockResponse as Response, token, true, customMaxAge);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith('csrf_token', token, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: customMaxAge,
      });
    });

    it('should set csrf_token cookie with custom maxAge in non-production mode', () => {
      const token = 'sample-csrf-token-custom-dev';
      const customMaxAge = 150000;

      setCsrfTokenCookie(mockResponse as Response, token, false, customMaxAge);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
      expect(mockResponse.cookie).toHaveBeenCalledWith('csrf_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: customMaxAge,
      });
    });
  });

  describe('clearAuthCookies', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        clearCookie: jest.fn(),
      };
    });

    it('should clear refreshToken and csrf_token cookies with non-production options by default', () => {
      clearAuthCookies(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenNthCalledWith(
        1,
        'refreshToken',
        {
          path: '/',
          secure: false,
          sameSite: 'lax',
        },
      );
      expect(mockResponse.clearCookie).toHaveBeenNthCalledWith(
        2,
        'csrf_token',
        {
          path: '/',
          secure: false,
          sameSite: 'lax',
        },
      );
    });

    it('should clear cookies with non-production options when isProduction is explicitly false', () => {
      clearAuthCookies(mockResponse as Response, false);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenNthCalledWith(
        1,
        'refreshToken',
        {
          path: '/',
          secure: false,
          sameSite: 'lax',
        },
      );
      expect(mockResponse.clearCookie).toHaveBeenNthCalledWith(
        2,
        'csrf_token',
        {
          path: '/',
          secure: false,
          sameSite: 'lax',
        },
      );
    });

    it('should clear cookies with production options when isProduction is true', () => {
      clearAuthCookies(mockResponse as Response, true);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenNthCalledWith(
        1,
        'refreshToken',
        {
          path: '/',
          secure: true,
          sameSite: 'none',
        },
      );
      expect(mockResponse.clearCookie).toHaveBeenNthCalledWith(
        2,
        'csrf_token',
        {
          path: '/',
          secure: true,
          sameSite: 'none',
        },
      );
    });
  });
});
