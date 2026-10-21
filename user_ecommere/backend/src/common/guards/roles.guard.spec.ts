import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    const handler = jest.fn();
    const targetClass = jest.fn();
    const request = { user };

    return {
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue(targetClass),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
    expect(reflector).toBeDefined();
  });

  it('can be instantiated directly with Reflector instance', () => {
    const directGuard = new RolesGuard(mockReflector as unknown as Reflector);
    expect(directGuard).toBeDefined();
  });

  describe('canActivate', () => {
    describe('when no roles are required', () => {
      it('should return true when reflector returns undefined', () => {
        mockReflector.getAllAndOverride.mockReturnValue(undefined);
        const context = createMockExecutionContext();

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
          ROLES_KEY,
          [context.getHandler(), context.getClass()],
        );
        expect(context.switchToHttp).not.toHaveBeenCalled();
      });

      it('should return true when reflector returns null', () => {
        mockReflector.getAllAndOverride.mockReturnValue(null);
        const context = createMockExecutionContext();

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
          ROLES_KEY,
          [context.getHandler(), context.getClass()],
        );
        expect(context.switchToHttp).not.toHaveBeenCalled();
      });
    });

    describe('when user is not authenticated', () => {
      it('should throw ForbiddenException when user is undefined on request', () => {
        mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
        const context = createMockExecutionContext(undefined);

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'User not authenticated',
        );
      });

      it('should throw ForbiddenException when user is null on request', () => {
        mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
        const context = createMockExecutionContext(null);

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'User not authenticated',
        );
      });
    });

    describe('when user does not possess required role', () => {
      it('should throw ForbiddenException with single required role', () => {
        mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
        const context = createMockExecutionContext({
          id: 'user-1',
          role: Role.CUSTOMER,
        });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'Required roles: ADMIN',
        );
      });

      it('should throw ForbiddenException with multiple required roles', () => {
        mockReflector.getAllAndOverride.mockReturnValue([
          Role.ADMIN,
          Role.CUSTOMER,
        ]);
        const context = createMockExecutionContext({
          id: 'user-1',
          role: 'GUEST' as Role,
        });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow(
          'Required roles: ADMIN, CUSTOMER',
        );
      });

      it('should throw ForbiddenException when requiredRoles is an empty array', () => {
        mockReflector.getAllAndOverride.mockReturnValue([]);
        const context = createMockExecutionContext({
          id: 'user-1',
          role: Role.CUSTOMER,
        });

        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow('Required roles: ');
      });
    });

    describe('when user possesses required role', () => {
      it('should return true when user role exactly matches single required role', () => {
        mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
        const context = createMockExecutionContext({
          id: 'admin-1',
          role: Role.ADMIN,
        });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
          ROLES_KEY,
          [context.getHandler(), context.getClass()],
        );
      });

      it('should return true when user role matches one of multiple required roles', () => {
        mockReflector.getAllAndOverride.mockReturnValue([
          Role.ADMIN,
          Role.CUSTOMER,
        ]);
        const contextAdmin = createMockExecutionContext({
          id: 'admin-1',
          role: Role.ADMIN,
        });

        expect(guard.canActivate(contextAdmin)).toBe(true);

        const contextCustomer = createMockExecutionContext({
          id: 'customer-1',
          role: Role.CUSTOMER,
        });

        expect(guard.canActivate(contextCustomer)).toBe(true);
      });
    });
  });
});
