import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let originalEnv: string | undefined;

  const allKnownModels = [
    'user',
    'refreshToken',
    'address',
    'category',
    'product',
    'productVariant',
    'coupon',
    'cart',
    'cartItem',
    'order',
    'orderItem',
    'review',
    'stockMovement',
    'referralConfig',
    'referral',
    'agentThread',
    'agentToolLog',
  ];

  beforeEach(async () => {
    originalEnv = process.env.NODE_ENV;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Mock all model delegates on service so deleteMany never invokes real database
    for (const modelName of allKnownModels) {
      try {
        const model = (service as any)[modelName];
        if (model && typeof model.deleteMany === 'function') {
          jest.spyOn(model, 'deleteMany').mockResolvedValue({ count: 0 });
        }
      } catch {}

      try {
        Object.defineProperty(service, modelName, {
          value: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } catch {
        (service as any)[modelName] = {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        };
      }
    }

    for (const key of Reflect.ownKeys(service)) {
      if (typeof key === 'string' && key[0] !== '_' && key[0] !== '$') {
        try {
          const prop = (service as any)[key];
          if (
            prop &&
            typeof prop === 'object' &&
            typeof prop.deleteMany === 'function'
          ) {
            if (!jest.isMockFunction(prop.deleteMany)) {
              jest.spyOn(prop, 'deleteMany').mockResolvedValue({ count: 0 });
            }
          }
        } catch {}
      }
    }
  });

  afterEach(async () => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('calls $connect and logs connection success', async () => {
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockResolvedValue(undefined as never);
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith('✅ Connected to database');
    });
  });

  describe('onModuleDestroy', () => {
    it('calls $disconnect and logs disconnection', async () => {
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValue(undefined as never);
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith('👋 Disconnected from database');
    });
  });

  describe('cleanDatabase', () => {
    it('throws error when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      await expect(service.cleanDatabase()).rejects.toThrow(
        'Cannot clean database in production',
      );
    });

    it('cleans all valid models and filters out private, internal, symbol, and non-model properties', async () => {
      process.env.NODE_ENV = 'test';

      const mockDeleteUser = jest.fn().mockResolvedValue({ count: 3 });
      const mockDeleteProduct = jest.fn().mockResolvedValue({ count: 10 });
      const mockDeleteOrder = jest.fn().mockResolvedValue({ count: 1 });

      const mockDeletePrivate = jest.fn().mockResolvedValue({ count: 0 });
      const mockDeletePrismaInternal = jest
        .fn()
        .mockResolvedValue({ count: 0 });
      const mockDeleteSymbol = jest.fn().mockResolvedValue({ count: 0 });

      // Override user, product, order with specific mocks
      Object.defineProperty(service, 'user', {
        value: { deleteMany: mockDeleteUser },
        writable: true,
        configurable: true,
        enumerable: true,
      });
      Object.defineProperty(service, 'product', {
        value: { deleteMany: mockDeleteProduct },
        writable: true,
        configurable: true,
        enumerable: true,
      });
      Object.defineProperty(service, 'order', {
        value: { deleteMany: mockDeleteOrder },
        writable: true,
        configurable: true,
        enumerable: true,
      });

      // Keys starting with '_' should be filtered out (branch key[0] !== '_')
      Object.defineProperty(service, '_privateHelper', {
        value: { deleteMany: mockDeletePrivate },
        writable: true,
        configurable: true,
        enumerable: true,
      });

      // Keys starting with '$' should be filtered out (branch key[0] !== '$')
      Object.defineProperty(service, '$internalPrismaMethod', {
        value: { deleteMany: mockDeletePrismaInternal },
        writable: true,
        configurable: true,
        enumerable: true,
      });

      // Symbol keys should be filtered out (branch typeof key === 'string')
      const sym = Symbol('symbolModel');
      Object.defineProperty(service, sym, {
        value: { deleteMany: mockDeleteSymbol },
        writable: true,
        configurable: true,
        enumerable: true,
      });

      // Property where model is falsy (branch !model)
      Object.defineProperty(service, 'nullModel', {
        value: null,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      Object.defineProperty(service, 'undefinedModel', {
        value: undefined,
        writable: true,
        configurable: true,
        enumerable: true,
      });

      // Property where model is truthy but typeof deleteMany !== 'function' (branch !deleteMany)
      Object.defineProperty(service, 'nonModelObject', {
        value: { someMethod: () => {} },
        writable: true,
        configurable: true,
        enumerable: true,
      });
      Object.defineProperty(service, 'stringProp', {
        value: 'plain-string',
        writable: true,
        configurable: true,
        enumerable: true,
      });

      const results = await service.cleanDatabase();

      // Valid models were called
      expect(mockDeleteUser).toHaveBeenCalledTimes(1);
      expect(mockDeleteProduct).toHaveBeenCalledTimes(1);
      expect(mockDeleteOrder).toHaveBeenCalledTimes(1);

      // Filtered keys were NOT called
      expect(mockDeletePrivate).not.toHaveBeenCalled();
      expect(mockDeletePrismaInternal).not.toHaveBeenCalled();
      expect(mockDeleteSymbol).not.toHaveBeenCalled();

      // Results contain the resolved values and undefined
      expect(results).toContainEqual({ count: 3 });
      expect(results).toContainEqual({ count: 10 });
      expect(results).toContainEqual({ count: 1 });
      expect(results).toContain(undefined);
    });
  });
});
