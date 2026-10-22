import { ExecutionContext } from '@nestjs/common';
import {
  CUSTOM_ROUTE_ARGS_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  // Helper to extract the parameter decorator factory function from route metadata
  const getParamDecoratorFactory = (): ((
    data: string | undefined,
    ctx: ExecutionContext,
  ) => any) => {
    class TestController {
      testMethod(@CurrentUser() user: any) {
        return user;
      }
    }

    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      'testMethod',
    );

    const key = Object.keys(metadata).find((k) =>
      k.includes(CUSTOM_ROUTE_ARGS_METADATA),
    );
    if (!key || !metadata[key]?.factory) {
      throw new Error(
        'Could not find CurrentUser parameter factory in metadata',
      );
    }
    return metadata[key].factory;
  };

  const createMockExecutionContext = (
    requestUser: any,
  ): {
    mockContext: ExecutionContext;
    mockSwitchToHttp: jest.Mock;
    mockGetRequest: jest.Mock;
  } => {
    const mockRequest = { user: requestUser };
    const mockGetRequest = jest.fn().mockReturnValue(mockRequest);
    const mockSwitchToHttp = jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
    });
    const mockContext = {
      switchToHttp: mockSwitchToHttp,
    } as unknown as ExecutionContext;

    return { mockContext, mockSwitchToHttp, mockGetRequest };
  };

  describe('Decorator metadata assignment', () => {
    it('should be defined as a function', () => {
      expect(CurrentUser).toBeDefined();
      expect(typeof CurrentUser).toBe('function');
    });

    it('should assign route parameter metadata without data argument', () => {
      class SampleController {
        findProfile(@CurrentUser() user: any) {
          return user;
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        SampleController,
        'findProfile',
      );
      expect(metadata).toBeDefined();

      const key = Object.keys(metadata).find((k) =>
        k.includes(CUSTOM_ROUTE_ARGS_METADATA),
      );
      expect(key).toBeDefined();
      expect(metadata[key!].index).toBe(0);
      expect(metadata[key!].data).toBeUndefined();
      expect(typeof metadata[key!].factory).toBe('function');
    });

    it('should assign route parameter metadata with data key argument', () => {
      class SampleController {
        findById(@CurrentUser('id') userId: string) {
          return userId;
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        SampleController,
        'findById',
      );
      expect(metadata).toBeDefined();

      const key = Object.keys(metadata).find((k) =>
        k.includes(CUSTOM_ROUTE_ARGS_METADATA),
      );
      expect(key).toBeDefined();
      expect(metadata[key!].index).toBe(0);
      expect(metadata[key!].data).toBe('id');
      expect(typeof metadata[key!].factory).toBe('function');
    });

    it('should assign route parameter metadata for multiple decorated parameters', () => {
      class SampleController {
        updateProfile(
          @CurrentUser() fullUser: any,
          @CurrentUser('id') userId: string,
          @CurrentUser('email') email: string,
        ) {
          return { fullUser, userId, email };
        }
      }

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        SampleController,
        'updateProfile',
      );
      expect(metadata).toBeDefined();

      const keys = Object.keys(metadata).filter((k) =>
        k.includes(CUSTOM_ROUTE_ARGS_METADATA),
      );
      expect(keys).toHaveLength(3);

      const sortedByIndices = keys
        .map((k) => metadata[k])
        .sort((a, b) => a.index - b.index);

      expect(sortedByIndices[0].index).toBe(0);
      expect(sortedByIndices[0].data).toBeUndefined();

      expect(sortedByIndices[1].index).toBe(1);
      expect(sortedByIndices[1].data).toBe('id');

      expect(sortedByIndices[2].index).toBe(2);
      expect(sortedByIndices[2].data).toBe('email');
    });

    it('should return a parameter decorator when invoked directly', () => {
      const decorator = CurrentUser('username');
      expect(typeof decorator).toBe('function');

      class ManualTargetController {
        action(name: string) {
          return name;
        }
      }

      decorator(ManualTargetController.prototype, 'action', 0);

      const metadata = Reflect.getMetadata(
        ROUTE_ARGS_METADATA,
        ManualTargetController,
        'action',
      );
      expect(metadata).toBeDefined();
    });
  });

  describe('Factory function execution', () => {
    let factory: (data: string | undefined, ctx: ExecutionContext) => any;

    beforeEach(() => {
      factory = getParamDecoratorFactory();
    });

    describe('when data is not provided (undefined)', () => {
      it('should return the full user object when user is present on request', () => {
        const mockUser = {
          id: 'admin_123',
          email: 'admin@shop.com',
          role: 'ADMIN',
        };
        const { mockContext, mockSwitchToHttp, mockGetRequest } =
          createMockExecutionContext(mockUser);

        const result = factory(undefined, mockContext);

        expect(mockSwitchToHttp).toHaveBeenCalledTimes(1);
        expect(mockGetRequest).toHaveBeenCalledTimes(1);
        expect(result).toBe(mockUser);
        expect(result).toEqual({
          id: 'admin_123',
          email: 'admin@shop.com',
          role: 'ADMIN',
        });
      });

      it('should return undefined when request.user is undefined', () => {
        const { mockContext, mockSwitchToHttp, mockGetRequest } =
          createMockExecutionContext(undefined);

        const result = factory(undefined, mockContext);

        expect(mockSwitchToHttp).toHaveBeenCalledTimes(1);
        expect(mockGetRequest).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();
      });

      it('should return null when request.user is null', () => {
        const { mockContext, mockSwitchToHttp, mockGetRequest } =
          createMockExecutionContext(null);

        const result = factory(undefined, mockContext);

        expect(mockSwitchToHttp).toHaveBeenCalledTimes(1);
        expect(mockGetRequest).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
      });
    });

    describe('when data is falsy but not undefined', () => {
      it('should return the full user object when data is empty string', () => {
        const mockUser = { id: 'admin_123' };
        const { mockContext } = createMockExecutionContext(mockUser);

        const result = factory('', mockContext);

        expect(result).toBe(mockUser);
      });
    });

    describe('when data is provided as a property key', () => {
      it('should extract the specified string property (id)', () => {
        const mockUser = {
          id: 'admin_123',
          email: 'admin@shop.com',
          role: 'ADMIN',
        };
        const { mockContext, mockSwitchToHttp, mockGetRequest } =
          createMockExecutionContext(mockUser);

        const result = factory('id', mockContext);

        expect(mockSwitchToHttp).toHaveBeenCalledTimes(1);
        expect(mockGetRequest).toHaveBeenCalledTimes(1);
        expect(result).toBe('admin_123');
      });

      it('should extract the specified email property', () => {
        const mockUser = {
          id: 'admin_123',
          email: 'admin@shop.com',
          role: 'ADMIN',
        };
        const { mockContext } = createMockExecutionContext(mockUser);

        const result = factory('email', mockContext);

        expect(result).toBe('admin@shop.com');
      });

      it('should extract boolean, number, and object properties correctly', () => {
        const mockUser = {
          id: 'admin_123',
          isActive: true,
          failedLoginAttempts: 0,
          profile: { firstName: 'Admin' },
          roles: ['ADMIN', 'SUPERADMIN'],
        };
        const { mockContext } = createMockExecutionContext(mockUser);

        expect(factory('isActive', mockContext)).toBe(true);
        expect(factory('failedLoginAttempts', mockContext)).toBe(0);
        expect(factory('profile', mockContext)).toEqual({
          firstName: 'Admin',
        });
        expect(factory('roles', mockContext)).toEqual(['ADMIN', 'SUPERADMIN']);
      });

      it('should return undefined when the requested property does not exist on user', () => {
        const mockUser = { id: 'admin_123' };
        const { mockContext } = createMockExecutionContext(mockUser);

        const result = factory('nonExistentKey', mockContext);

        expect(result).toBeUndefined();
      });

      it('should return undefined when data is provided but request.user is undefined', () => {
        const { mockContext, mockSwitchToHttp, mockGetRequest } =
          createMockExecutionContext(undefined);

        const result = factory('id', mockContext);

        expect(mockSwitchToHttp).toHaveBeenCalledTimes(1);
        expect(mockGetRequest).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();
      });

      it('should return undefined when data is provided but request.user is null', () => {
        const { mockContext, mockSwitchToHttp, mockGetRequest } =
          createMockExecutionContext(null);

        const result = factory('id', mockContext);

        expect(mockSwitchToHttp).toHaveBeenCalledTimes(1);
        expect(mockGetRequest).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();
      });
    });

    describe('error and dependency failure paths', () => {
      it('should rethrow error when ctx.switchToHttp() throws', () => {
        const failureError = new Error('HTTP context switch failed');
        const mockContext = {
          switchToHttp: jest.fn().mockImplementation(() => {
            throw failureError;
          }),
        } as unknown as ExecutionContext;

        expect(() => factory(undefined, mockContext)).toThrow(Error);
        expect(() => factory(undefined, mockContext)).toThrow(
          'HTTP context switch failed',
        );
        expect(mockContext.switchToHttp).toHaveBeenCalledTimes(2);
      });

      it('should rethrow error when getRequest() throws', () => {
        const failureError = new Error(
          'Unable to retrieve request from HTTP context',
        );
        const mockContext = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockImplementation(() => {
              throw failureError;
            }),
          }),
        } as unknown as ExecutionContext;

        expect(() => factory('id', mockContext)).toThrow(Error);
        expect(() => factory('id', mockContext)).toThrow(
          'Unable to retrieve request from HTTP context',
        );
        expect(mockContext.switchToHttp).toHaveBeenCalledTimes(2);
      });
    });
  });
});
