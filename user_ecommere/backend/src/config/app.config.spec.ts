import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from './app.config';

describe('appConfig', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should export a config factory registered with the key "app"', () => {
    expect(appConfig.KEY).toBe('CONFIGURATION(app)');
    expect(typeof appConfig).toBe('function');
  });

  describe('default configuration (empty environment)', () => {
    it('should return default values when environment variables are undefined or empty', () => {
      process.env = {};

      const config = appConfig();

      expect(config).toEqual({
        nodeEnv: 'development',
        port: 4000,
        corsOrigin: 'http://localhost:5173',
        uploadDir: './uploads',
        jwt: {
          accessSecret: undefined,
          refreshSecret: undefined,
          accessExpiresIn: '15m',
          refreshExpiresIn: '7d',
        },
        rateLimit: {
          ttl: 60,
          max: 100,
        },
        pagination: {
          defaultPageSize: 20,
          maxPageSize: 100,
        },
        chatbot: {
          ragProductLimit: 4,
          ragVariantLimit: 3,
          ragCandidateLimit: 12,
        },
      });
    });
  });

  describe('custom configuration (explicit environment variables)', () => {
    it('should return custom values when all environment variables are provided', () => {
      process.env = {
        NODE_ENV: 'production',
        PORT: '8080',
        CORS_ORIGIN: 'https://shop.example.com',
        UPLOAD_DIR: '/var/data/uploads',
        JWT_ACCESS_SECRET: 'jwt-access-secret-custom',
        JWT_REFRESH_SECRET: 'jwt-refresh-secret-custom',
        TOKEN_EXPIRES_IN: '30m',
        REFRESH_EXPIRES_IN: '14d',
        RATE_LIMIT_TTL: '120',
        RATE_LIMIT_MAX: '300',
        DEFAULT_PAGE_SIZE: '10',
        MAX_PAGE_SIZE: '50',
        CHATBOT_RAG_PRODUCT_LIMIT: '8',
        CHATBOT_RAG_VARIANT_LIMIT: '5',
        CHATBOT_RAG_CANDIDATE_LIMIT: '20',
      };

      const config = appConfig();

      expect(config).toEqual({
        nodeEnv: 'production',
        port: 8080,
        corsOrigin: 'https://shop.example.com',
        uploadDir: '/var/data/uploads',
        jwt: {
          accessSecret: 'jwt-access-secret-custom',
          refreshSecret: 'jwt-refresh-secret-custom',
          accessExpiresIn: '30m',
          refreshExpiresIn: '14d',
        },
        rateLimit: {
          ttl: 120,
          max: 300,
        },
        pagination: {
          defaultPageSize: 10,
          maxPageSize: 50,
        },
        chatbot: {
          ragProductLimit: 8,
          ragVariantLimit: 5,
          ragCandidateLimit: 20,
        },
      });
    });
  });

  describe('fallback branches for falsy, zero and non-numeric environment values', () => {
    it('should fall back to defaults when string variables are empty strings', () => {
      process.env = {
        NODE_ENV: '',
        CORS_ORIGIN: '',
        UPLOAD_DIR: '',
        TOKEN_EXPIRES_IN: '',
        REFRESH_EXPIRES_IN: '',
        CHATBOT_RAG_PRODUCT_LIMIT: '',
        CHATBOT_RAG_VARIANT_LIMIT: '',
        CHATBOT_RAG_CANDIDATE_LIMIT: '',
      };

      const config = appConfig();

      expect(config.nodeEnv).toBe('development');
      expect(config.corsOrigin).toBe('http://localhost:5173');
      expect(config.uploadDir).toBe('./uploads');
      expect(config.jwt.accessExpiresIn).toBe('15m');
      expect(config.jwt.refreshExpiresIn).toBe('7d');
      expect(config.chatbot.ragProductLimit).toBe(4);
      expect(config.chatbot.ragVariantLimit).toBe(3);
      expect(config.chatbot.ragCandidateLimit).toBe(12);
    });

    it('should fall back to defaults when PORT is 0 or non-numeric', () => {
      process.env = { PORT: '0' };
      expect(appConfig().port).toBe(4000);

      process.env = { PORT: 'invalid-port' };
      expect(appConfig().port).toBe(4000);

      process.env = { PORT: '' };
      expect(appConfig().port).toBe(4000);
    });

    it('should fall back to defaults when rateLimit values are 0 or non-numeric', () => {
      process.env = {
        RATE_LIMIT_TTL: '0',
        RATE_LIMIT_MAX: '0',
      };
      let config = appConfig();
      expect(config.rateLimit.ttl).toBe(60);
      expect(config.rateLimit.max).toBe(100);

      process.env = {
        RATE_LIMIT_TTL: 'invalid-ttl',
        RATE_LIMIT_MAX: 'invalid-max',
      };
      config = appConfig();
      expect(config.rateLimit.ttl).toBe(60);
      expect(config.rateLimit.max).toBe(100);
    });

    it('should fall back to defaults when pagination values are 0 or non-numeric', () => {
      process.env = {
        DEFAULT_PAGE_SIZE: '0',
        MAX_PAGE_SIZE: '0',
      };
      let config = appConfig();
      expect(config.pagination.defaultPageSize).toBe(20);
      expect(config.pagination.maxPageSize).toBe(100);

      process.env = {
        DEFAULT_PAGE_SIZE: 'not-a-number',
        MAX_PAGE_SIZE: 'not-a-number',
      };
      config = appConfig();
      expect(config.pagination.defaultPageSize).toBe(20);
      expect(config.pagination.maxPageSize).toBe(100);
    });

    it('should fall back to defaults when chatbot values are 0 or non-numeric strings', () => {
      process.env = {
        CHATBOT_RAG_PRODUCT_LIMIT: '0',
        CHATBOT_RAG_VARIANT_LIMIT: '0',
        CHATBOT_RAG_CANDIDATE_LIMIT: '0',
      };
      let config = appConfig();
      expect(config.chatbot.ragProductLimit).toBe(4);
      expect(config.chatbot.ragVariantLimit).toBe(3);
      expect(config.chatbot.ragCandidateLimit).toBe(12);

      process.env = {
        CHATBOT_RAG_PRODUCT_LIMIT: 'invalid',
        CHATBOT_RAG_VARIANT_LIMIT: 'invalid',
        CHATBOT_RAG_CANDIDATE_LIMIT: 'invalid',
      };
      config = appConfig();
      expect(config.chatbot.ragProductLimit).toBe(4);
      expect(config.chatbot.ragVariantLimit).toBe(3);
      expect(config.chatbot.ragCandidateLimit).toBe(12);
    });
  });

  describe('NestJS ConfigModule integration', () => {
    let moduleRef: TestingModule;

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should be loadable by ConfigModule.forFeature and resolvable via ConfigService', async () => {
      process.env = {
        NODE_ENV: 'test',
        PORT: '4000',
        CORS_ORIGIN: 'http://localhost:3000',
        JWT_ACCESS_SECRET: 'jwt-access-test',
        JWT_REFRESH_SECRET: 'jwt-refresh-test',
      };

      moduleRef = await Test.createTestingModule({
        imports: [ConfigModule.forFeature(appConfig)],
      }).compile();

      const configService = moduleRef.get<ConfigService>(ConfigService);
      expect(configService).toBeDefined();

      const registeredApp =
        configService.get<ReturnType<typeof appConfig>>('app');
      expect(registeredApp).toBeDefined();
      expect(registeredApp?.nodeEnv).toBe('test');
      expect(registeredApp?.port).toBe(4000);
      expect(registeredApp?.corsOrigin).toBe('http://localhost:3000');
      expect(registeredApp?.jwt.accessSecret).toBe('jwt-access-test');
      expect(registeredApp?.jwt.refreshSecret).toBe('jwt-refresh-test');
    });
  });
});
