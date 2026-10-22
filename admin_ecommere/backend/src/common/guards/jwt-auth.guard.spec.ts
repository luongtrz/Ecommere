import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { of, firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockHandler = jest.fn();
  const mockClass = class TestController {};

  const createMockExecutionContext = (
    req = {},
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
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate - Public endpoint', () => {
    it('should return true and bypass super.canActivate when route is public', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const superSpy = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate');

      const context = createMockExecutionContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
      expect(superSpy).not.toHaveBeenCalled();
    });
  });

  describe('canActivate - Non-public endpoint', () => {
    it('should delegate to super.canActivate and return true when authentication succeeds synchronously', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockReturnValue(true);

      const context = createMockExecutionContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
      expect(superSpy).toHaveBeenCalledWith(context);
    });

    it('should delegate to super.canActivate and return false when authentication returns false', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockReturnValue(false);

      const context = createMockExecutionContext();
      const result = guard.canActivate(context);

      expect(result).toBe(false);
      expect(superSpy).toHaveBeenCalledWith(context);
    });

    it('should delegate to super.canActivate and return true when super returns a Promise resolving to true', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockResolvedValue(true);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(superSpy).toHaveBeenCalledWith(context);
    });

    it('should delegate to super.canActivate and return false when super returns a Promise resolving to false', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockResolvedValue(false);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(false);
      expect(superSpy).toHaveBeenCalledWith(context);
    });

    it('should delegate to super.canActivate when isPublic is undefined', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const superSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockResolvedValue(true);

      const context = createMockExecutionContext();
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(superSpy).toHaveBeenCalledWith(context);
    });

    it('should delegate to super.canActivate when super returns an Observable', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockReturnValue(of(true));

      const context = createMockExecutionContext();
      const result = guard.canActivate(context) as any;

      expect(superSpy).toHaveBeenCalledWith(context);
      expect(await firstValueFrom(result)).toBe(true);
    });

    it('should propagate UnauthorizedException thrown synchronously by super.canActivate', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockImplementation(() => {
          throw new UnauthorizedException('Unauthorized');
        });

      const context = createMockExecutionContext();

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow('Unauthorized');
      expect(superSpy).toHaveBeenCalledWith(context);
    });

    it('should propagate UnauthorizedException rejected asynchronously by super.canActivate', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException('Token expired'));

      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow('Token expired');
      expect(superSpy).toHaveBeenCalledWith(context);
    });
  });
});
