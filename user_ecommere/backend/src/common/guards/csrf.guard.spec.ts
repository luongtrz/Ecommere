import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CsrfGuard } from './csrf.guard';
import { IS_CSRF_EXEMPT_KEY } from '../decorators/csrf-exempt.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let mockReflector: jest.Mocked<Partial<Reflector>>;

  const createMockExecutionContext = (
    requestOverrides: Partial<Request> = {},
  ): ExecutionContext => {
    const handler = jest.fn();
    const targetClass = jest.fn();

    const mockRequest = {
      method: 'POST',
      path: '/api/v1/test',
      headers: {},
      cookies: {},
      ...requestOverrides,
    } as unknown as Request;

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getHandler: () => handler,
      getClass: () => targetClass,
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    mockReflector = {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
    // Test direct instantiation as well
    const directGuard = new CsrfGuard(mockReflector as Reflector);
    expect(directGuard).toBeDefined();
  });

  describe('HTTP method checks', () => {
    it.each(['GET', 'HEAD', 'OPTIONS', 'get', 'head', 'options'])(
      'allows %s request without CSRF checks',
      (method) => {
        const context = createMockExecutionContext({
          method,
          headers: {},
          cookies: {},
        });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockReflector.getAllAndOverride).not.toHaveBeenCalled();
      },
    );
  });

  describe('CSRF exempt decorator', () => {
    it.each([
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'post',
      'put',
      'patch',
      'delete',
    ])('allows exempt mutation method %s without checking tokens', (method) => {
      mockReflector.getAllAndOverride!.mockReturnValue(true);

      const context = createMockExecutionContext({
        method,
        headers: {},
        cookies: {},
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_CSRF_EXEMPT_KEY,
        [context.getHandler(), context.getClass()],
      );
    });

    it('proceeds with CSRF checks when isCsrfExempt is false or undefined', () => {
      mockReflector.getAllAndOverride!.mockReturnValue(false);

      const context = createMockExecutionContext({
        method: 'POST',
        headers: { 'x-csrf-token': 'valid-token' },
        cookies: { csrf_token: 'valid-token' },
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_CSRF_EXEMPT_KEY,
        [context.getHandler(), context.getClass()],
      );
    });
  });

  describe('Public route decorator (IS_PUBLIC_KEY)', () => {
    it.each([
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'post',
      'put',
      'patch',
      'delete',
    ])('allows public mutation method %s without checking tokens', (method) => {
      mockReflector.getAllAndOverride!.mockImplementation((key: string) => {
        return key === IS_PUBLIC_KEY;
      });

      const context = createMockExecutionContext({
        method,
        headers: {},
        cookies: {},
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
    });

    it('proceeds with CSRF checks when isPublic is false or undefined', () => {
      mockReflector.getAllAndOverride!.mockReturnValue(false);

      const context = createMockExecutionContext({
        method: 'POST',
        headers: { 'x-csrf-token': 'valid-token' },
        cookies: { csrf_token: 'valid-token' },
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
    });
  });

  describe('Authorization Bearer bypass', () => {
    it('allows request when Authorization header starts with "Bearer "', () => {
      mockReflector.getAllAndOverride!.mockReturnValue(false);

      const context = createMockExecutionContext({
        method: 'POST',
        headers: { authorization: 'Bearer some-jwt-token-value' },
        cookies: {},
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('allows request when Authorization header is exactly "Bearer "', () => {
      mockReflector.getAllAndOverride!.mockReturnValue(false);

      const context = createMockExecutionContext({
        method: 'PUT',
        headers: { authorization: 'Bearer ' },
        cookies: {},
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('does not bypass CSRF when Authorization header does not start with "Bearer "', () => {
      mockReflector.getAllAndOverride!.mockReturnValue(false);

      const context = createMockExecutionContext({
        method: 'POST',
        headers: {
          authorization: 'Basic dXNlcjpwYXNzd29yZA==',
          'x-csrf-token': 'csrf-token-123',
        },
        cookies: { csrf_token: 'csrf-token-123' },
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('does not bypass CSRF when Authorization header is lowercase "bearer "', () => {
      mockReflector.getAllAndOverride!.mockReturnValue(false);

      const context = createMockExecutionContext({
        method: 'PATCH',
        headers: {
          authorization: 'bearer some-token',
          'x-csrf-token': 'my-csrf-token',
        },
        cookies: { csrf_token: 'my-csrf-token' },
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('does not bypass CSRF when Authorization header is empty string', () => {
      mockReflector.getAllAndOverride!.mockReturnValue(false);

      const context = createMockExecutionContext({
        method: 'DELETE',
        headers: {
          authorization: '',
          'x-csrf-token': 'del-token',
        },
        cookies: { csrf_token: 'del-token' },
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('CSRF token validation', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride!.mockReturnValue(false);
    });

    it('allows mutation when x-csrf-token header matches csrf_token cookie', () => {
      const validToken = 'valid-anti-csrf-token-xyz';
      const context = createMockExecutionContext({
        method: 'POST',
        headers: { 'x-csrf-token': validToken },
        cookies: { csrf_token: validToken },
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
      'allows %s when valid matching CSRF token is provided',
      (method) => {
        const token = 'token-for-method-test';
        const context = createMockExecutionContext({
          method,
          headers: { 'x-csrf-token': token },
          cookies: { csrf_token: token },
        });

        expect(guard.canActivate(context)).toBe(true);
      },
    );

    it('throws ForbiddenException when header token is missing', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const context = createMockExecutionContext({
        method: 'POST',
        path: '/api/v1/checkout',
        headers: {},
        cookies: { csrf_token: 'valid-cookie-token' },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for POST /api/v1/checkout. Header: false, Cookie: true, Match: false',
      );
    });

    it('throws ForbiddenException when cookie token is missing', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const context = createMockExecutionContext({
        method: 'PUT',
        path: '/api/v1/profile',
        headers: { 'x-csrf-token': 'valid-header-token' },
        cookies: {},
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for PUT /api/v1/profile. Header: true, Cookie: false, Match: false',
      );
    });

    it('throws ForbiddenException when both header and cookie tokens are missing', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const context = createMockExecutionContext({
        method: 'DELETE',
        path: '/api/v1/items/1',
        headers: {},
        cookies: {},
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for DELETE /api/v1/items/1. Header: false, Cookie: false, Match: true',
      );
    });

    it('throws ForbiddenException when header token does not match cookie token', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const context = createMockExecutionContext({
        method: 'PATCH',
        path: '/api/v1/orders/123',
        headers: { 'x-csrf-token': 'token-from-header-123' },
        cookies: { csrf_token: 'different-token-in-cookie-456' },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'CSRF token validation failed',
      );
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for PATCH /api/v1/orders/123. Header: true, Cookie: true, Match: false',
      );
    });

    it('throws ForbiddenException when header token is empty string', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const context = createMockExecutionContext({
        method: 'POST',
        path: '/api/v1/login',
        headers: { 'x-csrf-token': '' },
        cookies: { csrf_token: 'some-cookie' },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for POST /api/v1/login. Header: false, Cookie: true, Match: false',
      );
    });

    it('throws ForbiddenException when cookie token is empty string', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const context = createMockExecutionContext({
        method: 'POST',
        path: '/api/v1/login',
        headers: { 'x-csrf-token': 'some-header' },
        cookies: { csrf_token: '' },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(warnSpy).toHaveBeenCalledWith(
        'CSRF validation failed for POST /api/v1/login. Header: true, Cookie: false, Match: false',
      );
    });
  });
});
