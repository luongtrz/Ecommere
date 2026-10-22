import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';

const originalEnv: NodeJS.ProcessEnv = { ...process.env };
const defaultValidEnv: Record<string, string> = {
  DATABASE_URL: 'postgresql://test_user:pass@localhost:5432/test_db',
  JWT_ACCESS_SECRET: 'test-jwt-access-secret-key-12345',
  JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-key-67890',
  PORT: '4000',
  NODE_ENV: 'test',
};

// Set valid environment variables before importing config.module so ConfigModule.forRoot passes validation at load time
Object.assign(process.env, defaultValidEnv);

// require must run after process.env is set above, so it cannot be a hoisted import
const { AppConfigModule } =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./config.module') as typeof import('./config.module');

describe('AppConfigModule', () => {
  beforeEach(() => {
    Object.assign(process.env, defaultValidEnv);
  });

  afterEach(() => {
    Object.assign(process.env, defaultValidEnv);
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should instantiate AppConfigModule directly', () => {
    const module = new AppConfigModule();
    expect(module).toBeDefined();
    expect(module).toBeInstanceOf(AppConfigModule);
  });

  describe('Module metadata', () => {
    it('should define imports containing ConfigModule dynamic module configured as global with validate function', async () => {
      const imports: any[] = Reflect.getMetadata('imports', AppConfigModule);

      expect(imports).toBeDefined();
      expect(Array.isArray(imports)).toBe(true);
      expect(imports.length).toBe(1);

      // ConfigModule.forRoot returns a Promise<DynamicModule>
      const dynamicConfigModule = await imports[0];
      expect(dynamicConfigModule).toBeDefined();
      expect(dynamicConfigModule.module).toBe(ConfigModule);
      expect(dynamicConfigModule.global).toBe(true);
    });
  });

  describe('TestingModule compilation - valid environment', () => {
    let moduleRef: TestingModule;

    beforeEach(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [AppConfigModule],
      }).compile();
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should compile AppConfigModule successfully', () => {
      const appConfigModule = moduleRef.get(AppConfigModule);
      expect(appConfigModule).toBeDefined();
      expect(appConfigModule).toBeInstanceOf(AppConfigModule);
    });

    it('should provide ConfigService with validated environment values', () => {
      const configService = moduleRef.get<ConfigService>(ConfigService);
      expect(configService).toBeDefined();
      expect(configService.get('DATABASE_URL')).toBe(
        'postgresql://test_user:pass@localhost:5432/test_db',
      );
      expect(configService.get('JWT_ACCESS_SECRET')).toBe(
        'test-jwt-access-secret-key-12345',
      );
      expect(configService.get('JWT_REFRESH_SECRET')).toBe(
        'test-jwt-refresh-secret-key-67890',
      );
      expect(configService.get('PORT')).toBe(4000);
      expect(configService.get('NODE_ENV')).toBe('test');
    });
  });

  describe('TestingModule compilation - invalid environment (validation failure)', () => {
    it('should throw an error during compile when required environment variables are missing', async () => {
      let isolatedAppConfigModule: any;
      jest.isolateModules(() => {
        delete process.env.DATABASE_URL;
        delete process.env.JWT_ACCESS_SECRET;
        delete process.env.JWT_REFRESH_SECRET;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        isolatedAppConfigModule = require('./config.module').AppConfigModule;
      });

      await expect(
        Test.createTestingModule({
          imports: [isolatedAppConfigModule],
        }).compile(),
      ).rejects.toThrow(Error);
    });

    it('should throw an error during compile when NODE_ENV is invalid', async () => {
      let isolatedAppConfigModule: any;
      jest.isolateModules(() => {
        process.env.DATABASE_URL =
          'postgresql://test_user:pass@localhost:5432/test_db';
        process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-key-12345';
        process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-67890';
        process.env.NODE_ENV = 'unsupported-environment-value';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        isolatedAppConfigModule = require('./config.module').AppConfigModule;
      });

      await expect(
        Test.createTestingModule({
          imports: [isolatedAppConfigModule],
        }).compile(),
      ).rejects.toThrow(Error);
    });
  });
});
