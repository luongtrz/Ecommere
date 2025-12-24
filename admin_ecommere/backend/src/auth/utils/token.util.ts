import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';

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
export function getCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax' as const, // CSRF protection
    path: '/api/auth/refresh', // Only send to refresh endpoint
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * Cookie configuration for CSRF token
 */
export function getCsrfCookieOptions(isProduction: boolean) {
  return {
    httpOnly: false, // Frontend needs to read this
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

/**
 * Set refresh token cookie
 */
export function setRefreshTokenCookie(
  response: Response,
  token: string,
  isProduction: boolean,
) {
  response.cookie('refreshToken', token, getCookieOptions(isProduction));
}

/**
 * Set CSRF token cookie
 */
export function setCsrfTokenCookie(
  response: Response,
  token: string,
  isProduction: boolean,
) {
  response.cookie('csrf_token', token, getCsrfCookieOptions(isProduction));
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(response: Response) {
  response.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  response.clearCookie('csrf_token');
}
