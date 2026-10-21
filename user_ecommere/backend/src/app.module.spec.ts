import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, getOptionsToken } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// Mock domain modules to prevent any real DB, network, or third-party connections
const createMockModule = (name: string) => {
  const { Module } = require('@nestjs/common');
  class MockModule {}
  Object.defineProperty(MockModule, 'name', { value: name });
  Module({})(MockModule);
  return MockModule;
};

jest.mock('./config/config.module', () => ({
  AppConfigModule: createMockModule('AppConfigModule'),
}));
jest.mock('./prisma/prisma.module', () => ({
  PrismaModule: createMockModule('PrismaModule'),
}));
jest.mock('./auth/auth.module', () => ({
  AuthModule: createMockModule('AuthModule'),
}));
jest.mock('./users/users.module', () => ({
  UsersModule: createMockModule('UsersModule'),
}));
jest.mock('./categories/categories.module', () => ({
  CategoriesModule: createMockModule('CategoriesModule'),
}));
jest.mock('./products/products.module', () => ({
  ProductsModule: createMockModule('ProductsModule'),
}));
jest.mock('./coupons/coupons.module', () => ({
  CouponsModule: createMockModule('CouponsModule'),
}));
jest.mock('./cart/cart.module', () => ({
  CartModule: createMockModule('CartModule'),
}));
jest.mock('./orders/orders.module', () => ({
  OrdersModule: createMockModule('OrdersModule'),
}));
jest.mock('./reviews/reviews.module', () => ({
  ReviewsModule: createMockModule('ReviewsModule'),
}));
jest.mock('./payments/payments.module', () => ({
  PaymentsModule: createMockModule('PaymentsModule'),
}));
jest.mock('./shipping/shipping.module', () => ({
  ShippingModule: createMockModule('ShippingModule'),
}));
jest.mock('./uploads/uploads.module', () => ({
  UploadsModule: createMockModule('UploadsModule'),
}));
jest.mock('./referrals/referrals.module', () => ({
  ReferralsModule: createMockModule('ReferralsModule'),
}));
jest.mock('./chatbot/chatbot.module', () => ({
  ChatbotModule: createMockModule('ChatbotModule'),
}));

import { AppModule } from './app.module';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CouponsModule } from './coupons/coupons.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { ShippingModule } from './shipping/shipping.module';
import { UploadsModule } from './uploads/uploads.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ChatbotModule } from './chatbot/chatbot.module';

describe('AppModule', () => {
  let appModule: AppModule;
  let testingModule: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    appModule = testingModule.get<AppModule>(AppModule);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (testingModule) {
      await testingModule.close();
    }
  });

  it('should be defined and instantiate AppModule', () => {
    expect(appModule).toBeDefined();
    expect(appModule).toBeInstanceOf(AppModule);
  });

  describe('Module metadata imports', () => {
    it('should include all required domain and infrastructure modules in imports metadata', async () => {
      const rawImports: any[] = Reflect.getMetadata('imports', AppModule);

      expect(rawImports).toBeDefined();
      expect(rawImports.length).toBe(18);

      const imports = await Promise.all(rawImports);

      // Verify domain modules are imported
      expect(imports).toContain(AppConfigModule);
      expect(imports).toContain(PrismaModule);
      expect(imports).toContain(AuthModule);
      expect(imports).toContain(UsersModule);
      expect(imports).toContain(CategoriesModule);
      expect(imports).toContain(ProductsModule);
      expect(imports).toContain(CouponsModule);
      expect(imports).toContain(CartModule);
      expect(imports).toContain(OrdersModule);
      expect(imports).toContain(ReviewsModule);
      expect(imports).toContain(PaymentsModule);
      expect(imports).toContain(ShippingModule);
      expect(imports).toContain(UploadsModule);
      expect(imports).toContain(ReferralsModule);
      expect(imports).toContain(ChatbotModule);

      // Verify ScheduleModule dynamic module is imported
      const hasScheduleModule = imports.some(
        (item) => item === ScheduleModule || item?.module === ScheduleModule,
      );
      expect(hasScheduleModule).toBe(true);

      // Verify ConfigModule dynamic module is imported with global flag and .env file
      const configDynamicModule = imports.find(
        (item) => item === ConfigModule || item?.module === ConfigModule,
      );
      expect(configDynamicModule).toBeDefined();
      expect(configDynamicModule?.module).toBe(ConfigModule);
      expect(configDynamicModule?.global).toBe(true);

      // Verify ThrottlerModule dynamic module is imported with ConfigModule
      const throttlerDynamicModule = imports.find(
        (item) => item?.module === ThrottlerModule,
      );
      expect(throttlerDynamicModule).toBeDefined();
      expect(throttlerDynamicModule.imports).toEqual([ConfigModule]);
    });
  });

  describe('ThrottlerModule configuration (useFactory)', () => {
    let useFactory: (configService: ConfigService) => any[];

    beforeEach(() => {
      const imports: any[] = Reflect.getMetadata('imports', AppModule);
      const throttlerDynamic = imports.find(
        (item) => item?.module === ThrottlerModule,
      );
      const optionsProvider = throttlerDynamic.providers.find(
        (provider: any) =>
          provider?.provide === getOptionsToken() ||
          typeof provider?.useFactory === 'function',
      );

      useFactory = optionsProvider.useFactory;
    });

    it('should configure inject with ConfigService', () => {
      const imports: any[] = Reflect.getMetadata('imports', AppModule);
      const throttlerDynamic = imports.find(
        (item) => item?.module === ThrottlerModule,
      );
      const optionsProvider = throttlerDynamic.providers.find(
        (provider: any) =>
          provider?.provide === getOptionsToken() ||
          typeof provider?.useFactory === 'function',
      );

      expect(optionsProvider.inject).toEqual([ConfigService]);
    });

    it('should configure throttler with custom RATE_LIMIT_TTL and RATE_LIMIT_MAX values from ConfigService', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'RATE_LIMIT_TTL') return 120;
          if (key === 'RATE_LIMIT_MAX') return 50;
          return undefined;
        }),
      } as unknown as ConfigService;

      const result = useFactory(mockConfigService);

      expect(result).toEqual([
        {
          ttl: 120000,
          limit: 50,
        },
      ]);
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_TTL');
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_MAX');
    });

    it('should fall back to default TTL (60s -> 60000ms) and limit (100) when ConfigService returns undefined', () => {
      const mockConfigService = {
        get: jest.fn(() => undefined),
      } as unknown as ConfigService;

      const result = useFactory(mockConfigService);

      expect(result).toEqual([
        {
          ttl: 60000,
          limit: 100,
        },
      ]);
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_TTL');
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_MAX');
    });

    it('should fall back to default TTL and limit when ConfigService returns falsy 0', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'RATE_LIMIT_TTL') return 0;
          if (key === 'RATE_LIMIT_MAX') return 0;
          return undefined;
        }),
      } as unknown as ConfigService;

      const result = useFactory(mockConfigService);

      expect(result).toEqual([
        {
          ttl: 60000,
          limit: 100,
        },
      ]);
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_TTL');
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_MAX');
    });

    it('should fall back to default TTL and limit when ConfigService returns null', () => {
      const mockConfigService = {
        get: jest.fn(() => null),
      } as unknown as ConfigService;

      const result = useFactory(mockConfigService);

      expect(result).toEqual([
        {
          ttl: 60000,
          limit: 100,
        },
      ]);
    });

    it('should propagate exception when ConfigService throws an error', () => {
      const configError = new Error('Failed to read config');
      const mockConfigService = {
        get: jest.fn(() => {
          throw configError;
        }),
      } as unknown as ConfigService;

      expect(() => useFactory(mockConfigService)).toThrow(Error);
      expect(() => useFactory(mockConfigService)).toThrow(
        'Failed to read config',
      );
    });
  });
});
