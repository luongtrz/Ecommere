import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from './optional-jwt.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  const createMockContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canActivate', () => {
    it('returns true and request.user stays undefined when no Authorization header is present', () => {
      const request: any = { headers: {} };
      const context = createMockContext(request);
      const superSpy = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toBeUndefined();
      expect(superSpy).not.toHaveBeenCalled();
    });

    it('returns true and sets request.user to undefined when Authorization header is blank', () => {
      const request: any = {
        headers: { authorization: '   ' },
        user: { id: 'previous-user' },
      };
      const context = createMockContext(request);
      const superSpy = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toBeUndefined();
      expect(superSpy).not.toHaveBeenCalled();
    });

    it('returns true and leaves request.user undefined when Authorization header is an empty string', () => {
      const request: any = { headers: { authorization: '' } };
      const context = createMockContext(request);
      const superSpy = jest.spyOn(AuthGuard('jwt').prototype, 'canActivate');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toBeUndefined();
      expect(superSpy).not.toHaveBeenCalled();
    });

    it('delegates to super.canActivate when Authorization header is present', async () => {
      const request: any = {
        headers: { authorization: 'Bearer token-123' },
      };
      const context = createMockContext(request);
      const superSpy = jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockResolvedValue(true);

      const result = await guard.canActivate(context);

      expect(superSpy).toHaveBeenCalledWith(context);
      expect(result).toBe(true);
    });

    it('returns the user when Authorization header is present and handleRequest gets a user', async () => {
      const mockUser = { id: 'cust-1', email: 'cust@example.com' };
      const request: any = {
        headers: { authorization: 'Bearer valid.jwt.token' },
      };
      const context = createMockContext(request);

      jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockImplementation(async function (this: any, ctx: ExecutionContext) {
          const req = ctx.switchToHttp().getRequest();
          req.user = this.handleRequest(null, mockUser, null);
          return true;
        });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(mockUser);
    });

    it('throws UnauthorizedException when Authorization header is present and no user', async () => {
      const request: any = {
        headers: { authorization: 'Bearer invalid.jwt.token' },
      };
      const context = createMockContext(request);

      jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockImplementation(async function (this: any) {
          this.handleRequest(null, null, null);
          return true;
        });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Phiên đăng nhập không hợp lệ',
      );
    });
  });

  describe('handleRequest', () => {
    it('returns the user when user is provided', () => {
      const mockUser = { id: 'cust-1', email: 'cust@example.com' };
      const result = guard.handleRequest(null, mockUser, null);
      expect(result).toEqual(mockUser);
    });

    it('throws UnauthorizedException when user is not provided', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        'Phiên đăng nhập không hợp lệ',
      );
      expect(() => guard.handleRequest(null, false, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws the error when err is provided', () => {
      const error = new Error('Token verification failed');
      expect(() => guard.handleRequest(error, null, null)).toThrow(error);
    });

    it('throws err even if user is also falsy', () => {
      const error = new Error('Expired token');
      expect(() => guard.handleRequest(error, null, null)).toThrow(error);
    });
  });
});
