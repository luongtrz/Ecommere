import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';

const PRISMA_MODELS = [
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

describe('PrismaService', () => {
  let service: PrismaService;
  let loggerSpy: jest.SpyInstance;
  const originalEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  const mockAllModels = (defaultCount = 0) => {
    for (const model of PRISMA_MODELS) {
      (service as any)[model] = {
        deleteMany: jest.fn().mockResolvedValue({ count: defaultCount }),
      };
    }

    for (const key of Reflect.ownKeys(service)) {
      if (
        typeof key === 'string' &&
        key[0] !== '_' &&
        key[0] !== '$' &&
        key !== 'logger'
      ) {
        const prop = (service as any)[key];
        if (prop && typeof prop.deleteMany === 'function') {
          (service as any)[key] = {
            deleteMany: jest.fn().mockResolvedValue({ count: defaultCount }),
          };
        }
      }
    }
  };

  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        'postgresql://mock:mock@localhost:5432/mock_db?schema=public';
    }
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';

    jest
      .spyOn(PrismaClient.prototype, '$connect')
      .mockResolvedValue(undefined as any);
    jest
      .spyOn(PrismaClient.prototype, '$disconnect')
      .mockResolvedValue(undefined as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    jest.spyOn(service, '$connect').mockResolvedValue(undefined as any);
    jest.spyOn(service, '$disconnect').mockResolvedValue(undefined as any);
    loggerSpy = jest.spyOn((service as any).logger, 'log').mockImplementation();
    mockAllModels(0);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PrismaService);
    expect(service).toBeInstanceOf(PrismaClient);
  });

  describe('onModuleInit', () => {
    it('should connect to the database and log success message on initialization', async () => {
      const connectMock = jest
        .spyOn(service, '$connect')
        .mockResolvedValue(undefined as any);

      await service.onModuleInit();

      expect(connectMock).toHaveBeenCalledTimes(1);
      expect(connectMock).toHaveBeenCalledWith();
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith('✅ Connected to database');
    });

    it('should rethrow error and not log success if $connect fails', async () => {
      const connectionError = new Error('Database connection failed');
      const connectMock = jest
        .spyOn(service, '$connect')
        .mockRejectedValue(connectionError);

      await expect(service.onModuleInit()).rejects.toThrow(connectionError);

      expect(connectMock).toHaveBeenCalledTimes(1);
      expect(connectMock).toHaveBeenCalledWith();
      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from the database and log disconnection message on destroy', async () => {
      const disconnectMock = jest
        .spyOn(service, '$disconnect')
        .mockResolvedValue(undefined as any);

      await service.onModuleDestroy();

      expect(disconnectMock).toHaveBeenCalledTimes(1);
      expect(disconnectMock).toHaveBeenCalledWith();
      expect(loggerSpy).toHaveBeenCalledTimes(1);
      expect(loggerSpy).toHaveBeenCalledWith('👋 Disconnected from database');
    });

    it('should rethrow error and not log disconnection if $disconnect fails', async () => {
      const disconnectionError = new Error('Database disconnection error');
      const disconnectMock = jest
        .spyOn(service, '$disconnect')
        .mockRejectedValue(disconnectionError);

      await expect(service.onModuleDestroy()).rejects.toThrow(
        disconnectionError,
      );

      expect(disconnectMock).toHaveBeenCalledTimes(1);
      expect(disconnectMock).toHaveBeenCalledWith();
      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });

  describe('cleanDatabase', () => {
    it('should throw an Error when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      await expect(service.cleanDatabase()).rejects.toThrow(Error);
      await expect(service.cleanDatabase()).rejects.toThrow(
        'Cannot clean database in production',
      );
    });

    it('should deleteMany on all valid models while ignoring symbols, private keys, $ keys, and non-model properties in test env', async () => {
      process.env.NODE_ENV = 'test';
      mockAllModels(0);

      const mockUserDeleteMany = jest.fn().mockResolvedValue({ count: 5 });
      const mockProductDeleteMany = jest.fn().mockResolvedValue({ count: 12 });
      const mockOrderDeleteMany = jest.fn().mockResolvedValue({ count: 3 });

      const mockInternalDeleteMany = jest.fn();
      const mockDollarDeleteMany = jest.fn();
      const mockSymbolDeleteMany = jest.fn();

      const symKey = Symbol('ignoredSymbol');

      (service as any).user = { deleteMany: mockUserDeleteMany };
      (service as any).product = { deleteMany: mockProductDeleteMany };
      (service as any).order = { deleteMany: mockOrderDeleteMany };

      (service as any)._internal = { deleteMany: mockInternalDeleteMany };
      (service as any).$utility = { deleteMany: mockDollarDeleteMany };
      (service as any)[symKey] = { deleteMany: mockSymbolDeleteMany };

      (service as any).plainHelper = { otherAction: jest.fn() };
      (service as any).nullProperty = null;
      (service as any).undefinedProperty = undefined;
      (service as any).scalarProperty = 42;

      const result = await service.cleanDatabase();

      expect(mockUserDeleteMany).toHaveBeenCalledTimes(1);
      expect(mockUserDeleteMany).toHaveBeenCalledWith();

      expect(mockProductDeleteMany).toHaveBeenCalledTimes(1);
      expect(mockProductDeleteMany).toHaveBeenCalledWith();

      expect(mockOrderDeleteMany).toHaveBeenCalledTimes(1);
      expect(mockOrderDeleteMany).toHaveBeenCalledWith();

      expect(mockInternalDeleteMany).not.toHaveBeenCalled();
      expect(mockDollarDeleteMany).not.toHaveBeenCalled();
      expect(mockSymbolDeleteMany).not.toHaveBeenCalled();

      expect(result).toContainEqual({ count: 5 });
      expect(result).toContainEqual({ count: 12 });
      expect(result).toContainEqual({ count: 3 });
    });

    it('should clean database successfully when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      mockAllModels(0);

      const mockCategoryDeleteMany = jest.fn().mockResolvedValue({ count: 8 });
      (service as any).category = { deleteMany: mockCategoryDeleteMany };

      const result = await service.cleanDatabase();

      expect(mockCategoryDeleteMany).toHaveBeenCalledTimes(1);
      expect(mockCategoryDeleteMany).toHaveBeenCalledWith();
      expect(result).toContainEqual({ count: 8 });
    });

    it('should clean database successfully when NODE_ENV is undefined', async () => {
      delete process.env.NODE_ENV;
      mockAllModels(0);

      const mockReviewDeleteMany = jest.fn().mockResolvedValue({ count: 2 });
      (service as any).review = { deleteMany: mockReviewDeleteMany };

      const result = await service.cleanDatabase();

      expect(mockReviewDeleteMany).toHaveBeenCalledTimes(1);
      expect(mockReviewDeleteMany).toHaveBeenCalledWith();
      expect(result).toContainEqual({ count: 2 });
    });

    it('should rethrow error if any model deleteMany rejects', async () => {
      process.env.NODE_ENV = 'test';
      mockAllModels(0);

      const dbError = new Error('Foreign key constraint violation on truncate');
      (service as any).user = {
        deleteMany: jest.fn().mockRejectedValue(dbError),
      };

      await expect(service.cleanDatabase()).rejects.toThrow(dbError);
    });
  });
});
