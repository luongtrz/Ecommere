import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CsrfGuard } from './csrf.guard';
import { IS_CSRF_EXEMPT_KEY } from '../decorators/csrf-exempt.decorator';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockHandler = jest.fn();
  const mockClass = class TestController {};

  const createMockExecutionContext = (
    req: Partial<Request> = {},
    handler = mockHandler,
    classRef = mockClass,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => req as Request,
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getHandler: () => handler,
      getClass: () => classRef,
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<CsrfGuard>(CsrfGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('HTTP method checks (non-mutation)', () => {
    it.each(['GET', 'get', 'HEAD', 'head', 'OPTIONS', 'options'])(
      'should return true for safe HTTP method: %s without checking exemptions or tokens',
      (method) => {
        const req = {
          method,
          headers: {},
          cookies: {},
        };
        const context = createMockExecutionContext(req);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).not.toHaveBeenCalled();
      },
    );
  });

  describe('CSRF exempt checks', () => {
    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
      'should return true for mutation method %s when route is marked as CSRF exempt',
      (method) => {
        reflector.getAllAndOverride.mockReturnValue(true);

        const req = {
          method,
          headers: {},
          cookies: {},
        };
        const context = createMockExecutionContext(req);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
          IS_CSRF_EXEMPT_KEY,
          [mockHandler, mockClass],
        );
      },
    );
  });

  describe('Bearer authorization header bypass', () => {
    it('should return true when request has valid Authorization header with Bearer token', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const req = {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid.jwt.token',
        },
        cookies: {},
      };
      const context = createMockExecutionContext(req);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_CSRF_EXEMPT_KEY,
        [mockHandler, mockClass],
      );
    });

    it('should not bypass CSRF check when Authorization header is present but does not start with Bearer', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const req = {
        method: 'POST',
        path: '/api/admin/users',
        headers: {
          authorization: 'Basic dXNlcjpwYXNz',
        },
        cookies: {},
      };
      const context = createMockExecutionContext(req);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
    });

    it('should not bypass CSRF check when Authorization header is "Bearer" without trailing space', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const req = {
        method: 'POST',
        path: '/api/admin/users',
        headers: {
          authorization: 'Bearer',
        },
        cookies: {},
      };
      const context = createMockExecutionContext(req);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
    });
  });

  describe('CSRF token validation failure paths', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    });

    it('should throw ForbiddenException when x-csrf-token header is missing', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const req = {
        method: 'POST',
        path: '/api/admin/categories',
        headers: {},
        cookies: {
          csrf_token: 'valid-cookie-token',
        },
      };
      const context = createMockExecutionContext(req);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for POST /api/admin/categories. Header: false, Cookie: true, Match: false',
      );
    });

    it('should throw ForbiddenException when x-csrf-token header is empty string', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const req = {
        method: 'PUT',
        path: '/api/admin/categories/1',
        headers: {
          'x-csrf-token': '',
        },
        cookies: {
          csrf_token: 'valid-cookie-token',
        },
      };
      const context = createMockExecutionContext(req);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for PUT /api/admin/categories/1. Header: false, Cookie: true, Match: false',
      );
    });

    it('should throw ForbiddenException when csrf_token cookie is missing', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const req = {
        method: 'DELETE',
        path: '/api/admin/products/5',
        headers: {
          'x-csrf-token': 'token-123',
        },
        cookies: {},
      };
      const context = createMockExecutionContext(req);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for DELETE /api/admin/products/5. Header: true, Cookie: false, Match: false',
      );
    });

    it('should throw ForbiddenException when csrf_token cookie is empty string', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const req = {
        method: 'PATCH',
        path: '/api/admin/orders/10',
        headers: {
          'x-csrf-token': 'token-123',
        },
        cookies: {
          csrf_token: '',
        },
      };
      const context = createMockExecutionContext(req);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for PATCH /api/admin/orders/10. Header: true, Cookie: false, Match: false',
      );
    });

    it('should throw ForbiddenException when both header and cookie tokens are missing', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const req = {
        method: 'POST',
        path: '/api/admin/upload',
        headers: {},
        cookies: {},
      };
      const context = createMockExecutionContext(req);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for POST /api/admin/upload. Header: false, Cookie: false, Match: true',
      );
    });

    it('should throw ForbiddenException when header token does not match cookie token', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const req = {
        method: 'POST',
        path: '/api/admin/settings',
        headers: {
          'x-csrf-token': 'token-xyz',
        },
        cookies: {
          csrf_token: 'token-abc',
        },
      };
      const context = createMockExecutionContext(req);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for POST /api/admin/settings. Header: true, Cookie: true, Match: false',
      );
    });
  });

  describe('CSRF token validation success paths', () => {
    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
      'should return true for %s when x-csrf-token header matches csrf_token cookie',
      (method) => {
        reflector.getAllAndOverride.mockReturnValue(false);

        const token = 'matching-csrf-token-12345';
        const req = {
          method,
          path: '/api/admin/test',
          headers: {
            'x-csrf-token': token,
          },
          cookies: {
            csrf_token: token,
          },
        };
        const context = createMockExecutionContext(req);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      },
    );
  });
});
