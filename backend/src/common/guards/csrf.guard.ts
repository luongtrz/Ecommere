import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * CSRF Guard for mutation operations
 * Validates that X-CSRF-Token header matches the cookie value
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Only check mutation methods
    const method = request.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return true;
    }

    // Skip CSRF check for public endpoints (auth routes)
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get CSRF token from header
    const headerToken = request.headers['x-csrf-token'] as string;

    // Get CSRF token from cookie
    const cookieToken = request.cookies['csrf_token'];

    // Validate
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      this.logger.warn(
        `CSRF validation failed for ${method} ${request.path}. ` +
          `Header: ${!!headerToken}, Cookie: ${!!cookieToken}, Match: ${headerToken === cookieToken}`,
      );
      throw new ForbiddenException('CSRF token validation failed');
    }

    return true;
  }
}
