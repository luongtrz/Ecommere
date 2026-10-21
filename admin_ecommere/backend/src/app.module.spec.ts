import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppModule } from './app.module';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { CouponsModule } from './coupons/coupons.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UploadsModule } from './uploads/uploads.module';
import { UploadsService } from './uploads/uploads.service';
import { AdminModule } from './admin/admin.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import {
  AGENT_CHECKPOINTER,
  AGENT_GRAPH,
} from './chatbot/agent/admin.providers';

// Mock env.validation so AppConfigModule doesn't throw when instantiated during module import
jest.mock('./config/env.validation', () => ({
  validate: jest.fn((config: Record<string, unknown>) => config),
}));

// Prevent any real third-party connections
jest.mock('@langchain/langgraph-checkpoint-postgres', () => ({
  PostgresSaver: {
    fromConnString: jest.fn().mockReturnValue({
      setup: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    bindTools: jest.fn().mockReturnValue({
      invoke: jest.fn(),
    }),
  })),
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  }),
}));

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('AppModule', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      PORT: '4001',
      DATABASE_URL:
        'postgresql://postgres:postgres@localhost:5432/test?schema=public',
      ADMIN_JWT_ACCESS_SECRET: 'test-admin-jwt-access-secret-32-chars-minimum',
      ADMIN_JWT_REFRESH_SECRET:
        'test-admin-jwt-refresh-secret-32-chars-minimum',
      TOKEN_EXPIRES_IN: '15m',
      REFRESH_EXPIRES_IN: '7d',
      CORS_ORIGIN: 'http://localhost:5174',
      UPLOAD_DIR: './uploads',
      RATE_LIMIT_TTL: '60',
      RATE_LIMIT_MAX: '100',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined when instantiated directly', () => {
    const appModule = new AppModule();
    expect(appModule).toBeDefined();
    expect(appModule).toBeInstanceOf(AppModule);
  });

  describe('module metadata and imports', () => {
    const imports = Reflect.getMetadata('imports', AppModule);

    it('should include all required static application modules in imports', () => {
      expect(imports).toBeDefined();
      expect(Array.isArray(imports)).toBe(true);

      const staticModules = [
        AppConfigModule,
        PrismaModule,
        MailModule,
        AuthModule,
        UsersModule,
        CategoriesModule,
        ProductsModule,
        InventoryModule,
        CouponsModule,
        OrdersModule,
        ReviewsModule,
        UploadsModule,
        AdminModule,
        ReferralsModule,
        ChatbotModule,
      ];

      for (const mod of staticModules) {
        expect(imports).toContain(mod);
      }
    });

    it('should include ConfigModule configured for global env loading', async () => {
      const resolvedImports = await Promise.all(imports);
      const configDynamicModule = resolvedImports.find(
        (item: any) =>
          item &&
          (item.module === ConfigModule ||
            item.module?.name === 'ConfigModule'),
      );
      expect(configDynamicModule).toBeDefined();
      expect(configDynamicModule.global).toBe(true);
    });

    it('should include ThrottlerModule configured with async options', () => {
      const throttlerDynamicModule = imports.find(
        (item: any) =>
          item &&
          (item.module === ThrottlerModule ||
            item.module?.name === 'ThrottlerModule'),
      );
      expect(throttlerDynamicModule).toBeDefined();
    });
  });

  describe('ThrottlerModule useFactory', () => {
    const imports = Reflect.getMetadata('imports', AppModule);
    const throttlerDynamicModule = imports.find(
      (item: any) =>
        item &&
        (item.module === ThrottlerModule ||
          item.module?.name === 'ThrottlerModule'),
    );

    const optionsProvider = throttlerDynamicModule?.providers?.find(
      (p: any) => typeof p?.useFactory === 'function',
    );

    it('should inject ConfigService into ThrottlerModule factory provider', () => {
      expect(optionsProvider).toBeDefined();
      expect(optionsProvider.inject).toEqual([ConfigService]);
    });

    it('should return configured ttl and limit when RATE_LIMIT_TTL and RATE_LIMIT_MAX are provided', () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'RATE_LIMIT_TTL') return 120;
          if (key === 'RATE_LIMIT_MAX') return 50;
          return undefined;
        }),
      } as unknown as ConfigService;

      const result = optionsProvider.useFactory(mockConfigService);

      expect(result).toEqual([
        {
          ttl: 120000,
          limit: 50,
        },
      ]);
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_TTL');
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_MAX');
    });

    it('should return default ttl (60000ms) and limit (100) when env values are undefined', () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as ConfigService;

      const result = optionsProvider.useFactory(mockConfigService);

      expect(result).toEqual([
        {
          ttl: 60000,
          limit: 100,
        },
      ]);
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_TTL');
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_MAX');
    });

    it('should fall back to default values when RATE_LIMIT_TTL and RATE_LIMIT_MAX evaluate to falsy 0', () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(0),
      } as unknown as ConfigService;

      const result = optionsProvider.useFactory(mockConfigService);

      expect(result).toEqual([
        {
          ttl: 60000,
          limit: 100,
        },
      ]);
    });

    it('should use custom ttl when RATE_LIMIT_TTL is provided and default limit when RATE_LIMIT_MAX is missing', () => {
      const mockConfigService = {
        get: jest.fn((key: string) =>
          key === 'RATE_LIMIT_TTL' ? 30 : undefined,
        ),
      } as unknown as ConfigService;

      const result = optionsProvider.useFactory(mockConfigService);

      expect(result).toEqual([
        {
          ttl: 30000,
          limit: 100,
        },
      ]);
    });

    it('should use default ttl when RATE_LIMIT_TTL is missing and custom limit when RATE_LIMIT_MAX is provided', () => {
      const mockConfigService = {
        get: jest.fn((key: string) =>
          key === 'RATE_LIMIT_MAX' ? 250 : undefined,
        ),
      } as unknown as ConfigService;

      const result = optionsProvider.useFactory(mockConfigService);

      expect(result).toEqual([
        {
          ttl: 60000,
          limit: 250,
        },
      ]);
    });
  });

  describe('module compilation', () => {
    let moduleRef: TestingModule;

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should compile AppModule successfully with external providers overridden', async () => {
      moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue({})
        .overrideProvider(AGENT_CHECKPOINTER)
        .useValue({
          setup: jest.fn().mockResolvedValue(undefined),
          deleteThread: jest.fn().mockResolvedValue(undefined),
        })
        .overrideProvider(AGENT_GRAPH)
        .useValue({})
        .overrideProvider(MailService)
        .useValue({ sendMail: jest.fn() })
        .overrideProvider(UploadsService)
        .useValue({ uploadFile: jest.fn() })
        .compile();

      const appModule = moduleRef.get<AppModule>(AppModule);
      expect(appModule).toBeDefined();
      expect(appModule).toBeInstanceOf(AppModule);
    });

    it('should propagate error when a required dependency fails during compilation', async () => {
      const compilationError = new Error('Database checkpointer failed');

      await expect(
        Test.createTestingModule({
          imports: [AppModule],
        })
          .overrideProvider(PrismaService)
          .useValue({})
          .overrideProvider(AGENT_CHECKPOINTER)
          .useFactory({
            factory: () => {
              throw compilationError;
            },
          })
          .overrideProvider(AGENT_GRAPH)
          .useValue({})
          .compile(),
      ).rejects.toThrow(compilationError);
    });
  });
});
