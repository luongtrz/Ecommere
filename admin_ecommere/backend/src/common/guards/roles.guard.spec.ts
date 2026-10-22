import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockHandler = jest.fn();
  const mockClass = class TestController {};

  const createMockExecutionContext = (
    req: { user?: { id?: string; role?: Role | string } | null } = {},
    handler = mockHandler,
    classRef = mockClass,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
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
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate - Public endpoint', () => {
    it('should return true when IS_PUBLIC_KEY is true and not query ROLES_KEY', () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const context = createMockExecutionContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(1);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
    });
  });

  describe('canActivate - Required roles validation', () => {
    it('should throw ForbiddenException("Access denied") when requiredRoles is undefined', () => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return undefined;
        return undefined;
      });

      const context = createMockExecutionContext();

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Access denied');
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockHandler,
        mockClass,
      ]);
    });

    it('should throw ForbiddenException("Access denied") when requiredRoles is null', () => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return null;
        return undefined;
      });

      const context = createMockExecutionContext();

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Access denied');
    });

    it('should throw ForbiddenException("Access denied") when requiredRoles is empty array', () => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return [];
        return undefined;
      });

      const context = createMockExecutionContext();

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Access denied');
    });
  });

  describe('canActivate - Authentication validation', () => {
    it('should throw ForbiddenException("User not authenticated") when user is undefined in request', () => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return [Role.ADMIN];
        return undefined;
      });

      const context = createMockExecutionContext({ user: undefined });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'User not authenticated',
      );
    });

    it('should throw ForbiddenException("User not authenticated") when user is null in request', () => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return [Role.ADMIN];
        return undefined;
      });

      const context = createMockExecutionContext({ user: null });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'User not authenticated',
      );
    });
  });

  describe('canActivate - Role authorization matching', () => {
    it('should throw ForbiddenException with single required role when user does not have it', () => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return [Role.ADMIN];
        return undefined;
      });

      const context = createMockExecutionContext({
        user: { id: 'user-1', role: Role.CUSTOMER },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('Required roles: ADMIN');
    });

    it('should throw ForbiddenException with all required roles comma-separated when user role matches none', () => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return [Role.ADMIN, 'SUPER_ADMIN' as Role];
        return undefined;
      });

      const context = createMockExecutionContext({
        user: { id: 'user-2', role: Role.CUSTOMER },
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Required roles: ADMIN, SUPER_ADMIN',
      );
    });

    it('should return true when user role matches the single required role', () => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return [Role.ADMIN];
        return undefined;
      });

      const context = createMockExecutionContext({
        user: { id: 'user-admin', role: Role.ADMIN },
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user role matches one of multiple required roles', () => {
      reflector.getAllAndOverride.mockImplementation((key) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return [Role.ADMIN, Role.CUSTOMER];
        return undefined;
      });

      const context = createMockExecutionContext({
        user: { id: 'user-customer', role: Role.CUSTOMER },
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
