import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_CSRF_EXEMPT_KEY } from '../decorators/csrf-exempt.decorator';

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

    // Skip CSRF check for exempt endpoints
    const isCsrfExempt = this.reflector.getAllAndOverride<boolean>(
      IS_CSRF_EXEMPT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isCsrfExempt) {
      return true;
    }

    // Requests authenticated via Authorization: Bearer <token> header are inherently immune to CSRF
    // because cross-site requests cannot inject custom Authorization headers.
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
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
