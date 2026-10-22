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
        port: 4001,
        corsOrigin: 'http://localhost:5174',
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
      });
    });
  });

  describe('custom configuration (explicit environment variables)', () => {
    it('should return custom values when all environment variables are provided', () => {
      process.env = {
        NODE_ENV: 'production',
        PORT: '8080',
        CORS_ORIGIN: 'https://admin.example.com',
        UPLOAD_DIR: '/var/data/uploads',
        ADMIN_JWT_ACCESS_SECRET: 'admin-jwt-access-secret-custom',
        ADMIN_JWT_REFRESH_SECRET: 'admin-jwt-refresh-secret-custom',
        TOKEN_EXPIRES_IN: '30m',
        REFRESH_EXPIRES_IN: '14d',
        RATE_LIMIT_TTL: '120',
        RATE_LIMIT_MAX: '300',
        DEFAULT_PAGE_SIZE: '10',
        MAX_PAGE_SIZE: '50',
      };

      const config = appConfig();

      expect(config).toEqual({
        nodeEnv: 'production',
        port: 8080,
        corsOrigin: 'https://admin.example.com',
        uploadDir: '/var/data/uploads',
        jwt: {
          accessSecret: 'admin-jwt-access-secret-custom',
          refreshSecret: 'admin-jwt-refresh-secret-custom',
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
      };

      const config = appConfig();

      expect(config.nodeEnv).toBe('development');
      expect(config.corsOrigin).toBe('http://localhost:5174');
      expect(config.uploadDir).toBe('./uploads');
      expect(config.jwt.accessExpiresIn).toBe('15m');
      expect(config.jwt.refreshExpiresIn).toBe('7d');
    });

    it('should fall back to defaults when PORT is 0 or non-numeric', () => {
      process.env = { PORT: '0' };
      expect(appConfig().port).toBe(4001);

      process.env = { PORT: 'invalid-port' };
      expect(appConfig().port).toBe(4001);

      process.env = { PORT: '' };
      expect(appConfig().port).toBe(4001);
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

      process.env = {
        RATE_LIMIT_TTL: '',
        RATE_LIMIT_MAX: '',
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

      process.env = {
        DEFAULT_PAGE_SIZE: '',
        MAX_PAGE_SIZE: '',
      };
      config = appConfig();
      expect(config.pagination.defaultPageSize).toBe(20);
      expect(config.pagination.maxPageSize).toBe(100);
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
        PORT: '4001',
        CORS_ORIGIN: 'http://localhost:5174',
        ADMIN_JWT_ACCESS_SECRET: 'jwt-access-test',
        ADMIN_JWT_REFRESH_SECRET: 'jwt-refresh-test',
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
      expect(registeredApp?.port).toBe(4001);
      expect(registeredApp?.corsOrigin).toBe('http://localhost:5174');
      expect(registeredApp?.jwt.accessSecret).toBe('jwt-access-test');
      expect(registeredApp?.jwt.refreshSecret).toBe('jwt-refresh-test');
    });
  });
});
