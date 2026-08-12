import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';

const DEFAULT_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Hash token with SHA-256 for secure storage
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate random token family ID for rotation tracking
 */
export function generateTokenFamily(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Cookie configuration for refresh token
 */
export function getCookieOptions(
  isProduction: boolean,
  maxAge = DEFAULT_COOKIE_MAX_AGE_MS,
) {
  return {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax' as const, // CSRF protection
    path: '/api/auth/refresh', // Only send to refresh endpoint
    maxAge,
  };
}

/**
 * Cookie configuration for CSRF token
 */
export function getCsrfCookieOptions(
  isProduction: boolean,
  maxAge = DEFAULT_COOKIE_MAX_AGE_MS,
) {
  return {
    httpOnly: false, // Frontend needs to read this
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge,
  };
}

/**
 * Set refresh token cookie
 */
export function setRefreshTokenCookie(
  response: Response,
  token: string,
  isProduction: boolean,
  maxAge = DEFAULT_COOKIE_MAX_AGE_MS,
) {
  response.cookie('refreshToken', token, getCookieOptions(isProduction, maxAge));
}

/**
 * Set CSRF token cookie
 */
export function setCsrfTokenCookie(
  response: Response,
  token: string,
  isProduction: boolean,
  maxAge = DEFAULT_COOKIE_MAX_AGE_MS,
) {
  response.cookie('csrf_token', token, getCsrfCookieOptions(isProduction, maxAge));
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(response: Response) {
  response.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  response.clearCookie('csrf_token');
}
