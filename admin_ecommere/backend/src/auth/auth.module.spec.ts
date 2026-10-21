import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@/mail/mail.service';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER } from './auth.constants';

describe('AuthModule', () => {
  it('should be defined', () => {
    expect(AuthModule).toBeDefined();
  });

  describe('Module metadata', () => {
    it('declares AuthController', () => {
      const controllers = Reflect.getMetadata('controllers', AuthModule);
      expect(controllers).toBeDefined();
      expect(controllers).toContain(AuthController);
    });

    it('exports AuthService', () => {
      const exports = Reflect.getMetadata('exports', AuthModule);
      expect(exports).toBeDefined();
      expect(exports).toContain(AuthService);
    });

    it('imports PassportModule and an async JwtModule', () => {
      const imports = Reflect.getMetadata('imports', AuthModule);
      expect(imports).toBeDefined();
      expect(imports).toContain(PassportModule);

      const jwtDynamicModule = imports.find(
        (item: any) =>
          item &&
          (item.module === JwtModule ||
            item.providers?.some(
              (p: any) => typeof p?.useFactory === 'function',
            )),
      );
      expect(jwtDynamicModule).toBeDefined();
    });

    it('provides AuthService and JwtAccessStrategy', () => {
      const providers = Reflect.getMetadata('providers', AuthModule) as any[];
      expect(providers).toBeDefined();
      expect(providers).toContain(AuthService);
      expect(providers).toContain(JwtAccessStrategy);
    });

    it('provides APP_GUARD for JwtAuthGuard, RolesGuard, CsrfGuard, and ThrottlerGuard', () => {
      const providers = Reflect.getMetadata('providers', AuthModule) as any[];
      const appGuards = providers.filter((p) => p && p.provide === APP_GUARD);
      expect(appGuards).toHaveLength(4);

      const guardClasses = appGuards.map((g) => g.useClass);
      expect(guardClasses).toContain(JwtAuthGuard);
      expect(guardClasses).toContain(RolesGuard);
      expect(guardClasses).toContain(CsrfGuard);
      expect(guardClasses).toContain(ThrottlerGuard);
    });
  });

  describe('JwtModule async options useFactory', () => {
    let useFactory: (configService: ConfigService) => Promise<any>;

    beforeAll(() => {
      const imports = Reflect.getMetadata('imports', AuthModule) as any[];
      const jwtDynamicModule = imports.find(
        (item: any) =>
          item &&
          (item.module === JwtModule ||
            item.providers?.some(
              (p: any) => typeof p?.useFactory === 'function',
            )),
      );
      const jwtOptionsProvider = jwtDynamicModule?.providers?.find(
        (p: any) => typeof p?.useFactory === 'function',
      );
      useFactory = jwtOptionsProvider?.useFactory;
    });

    it('should be extracted as a function from the dynamic module definition', () => {
      expect(typeof useFactory).toBe('function');
    });

    it('throws Error when ADMIN_JWT_ACCESS_SECRET is undefined', async () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ADMIN_JWT_REFRESH_SECRET') return 'test-refresh-secret';
          return undefined;
        }),
      } as unknown as ConfigService;

      await expect(useFactory(configService)).rejects.toThrow(Error);
      await expect(useFactory(configService)).rejects.toThrow(
        'ADMIN_JWT_ACCESS_SECRET is required',
      );
      expect(configService.get).toHaveBeenCalledWith('ADMIN_JWT_ACCESS_SECRET');
    });

    it('throws Error when ADMIN_JWT_ACCESS_SECRET is an empty string', async () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ADMIN_JWT_ACCESS_SECRET') return '';
          if (key === 'ADMIN_JWT_REFRESH_SECRET') return 'test-refresh-secret';
          return undefined;
        }),
      } as unknown as ConfigService;

      await expect(useFactory(configService)).rejects.toThrow(Error);
      await expect(useFactory(configService)).rejects.toThrow(
        'ADMIN_JWT_ACCESS_SECRET is required',
      );
    });

    it('throws Error when ADMIN_JWT_ACCESS_SECRET consists only of whitespace', async () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ADMIN_JWT_ACCESS_SECRET') return '   ';
          if (key === 'ADMIN_JWT_REFRESH_SECRET') return 'test-refresh-secret';
          return undefined;
        }),
      } as unknown as ConfigService;

      await expect(useFactory(configService)).rejects.toThrow(Error);
      await expect(useFactory(configService)).rejects.toThrow(
        'ADMIN_JWT_ACCESS_SECRET is required',
      );
    });

    it('throws Error when ADMIN_JWT_REFRESH_SECRET is undefined', async () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ADMIN_JWT_ACCESS_SECRET') return 'test-access-secret';
          return undefined;
        }),
      } as unknown as ConfigService;

      await expect(useFactory(configService)).rejects.toThrow(Error);
      await expect(useFactory(configService)).rejects.toThrow(
        'ADMIN_JWT_REFRESH_SECRET is required',
      );
      expect(configService.get).toHaveBeenCalledWith('ADMIN_JWT_REFRESH_SECRET');
    });

    it('throws Error when ADMIN_JWT_REFRESH_SECRET is an empty string', async () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ADMIN_JWT_ACCESS_SECRET') return 'test-access-secret';
          if (key === 'ADMIN_JWT_REFRESH_SECRET') return '';
          return undefined;
        }),
      } as unknown as ConfigService;

      await expect(useFactory(configService)).rejects.toThrow(Error);
      await expect(useFactory(configService)).rejects.toThrow(
        'ADMIN_JWT_REFRESH_SECRET is required',
      );
    });

    it('throws Error when ADMIN_JWT_REFRESH_SECRET consists only of whitespace', async () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ADMIN_JWT_ACCESS_SECRET') return 'test-access-secret';
          if (key === 'ADMIN_JWT_REFRESH_SECRET') return '   ';
          return undefined;
        }),
      } as unknown as ConfigService;

      await expect(useFactory(configService)).rejects.toThrow(Error);
      await expect(useFactory(configService)).rejects.toThrow(
        'ADMIN_JWT_REFRESH_SECRET is required',
      );
    });

    it('returns the JWT configuration when valid access and refresh secrets are provided', async () => {
      const configService = {
        get: jest.fn((key: string) => {
          if (key === 'ADMIN_JWT_ACCESS_SECRET') return 'valid-admin-access-secret';
          if (key === 'ADMIN_JWT_REFRESH_SECRET') return 'valid-admin-refresh-secret';
          if (key === 'TOKEN_EXPIRES_IN') return '15m';
          return undefined;
        }),
      } as unknown as ConfigService;

      const result = await useFactory(configService);

      expect(result).toEqual({
        secret: 'valid-admin-access-secret',
        signOptions: {
          expiresIn: '15m',
          issuer: ADMIN_JWT_ISSUER,
          audience: ADMIN_JWT_AUDIENCE,
        },
      });
      expect(configService.get).toHaveBeenCalledWith('ADMIN_JWT_ACCESS_SECRET');
      expect(configService.get).toHaveBeenCalledWith('ADMIN_JWT_REFRESH_SECRET');
      expect(configService.get).toHaveBeenCalledWith('TOKEN_EXPIRES_IN');
    });
  });

  describe('Module compilation', () => {
    it('compiles successfully with providers overridden and no real connections', async () => {
      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'ADMIN_JWT_ACCESS_SECRET') return 'compiled-access-secret';
          if (key === 'ADMIN_JWT_REFRESH_SECRET') return 'compiled-refresh-secret';
          if (key === 'TOKEN_EXPIRES_IN') return '15m';
          return null;
        }),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
          ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
          AuthModule,
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .overrideProvider(AuthService)
        .useValue({
          register: jest.fn(),
          login: jest.fn(),
          refresh: jest.fn(),
          logout: jest.fn(),
          forgotPassword: jest.fn(),
          resetPassword: jest.fn(),
        })
        .overrideProvider(JwtAccessStrategy)
        .useValue({})
        .overrideProvider(PrismaService)
        .useValue({})
        .overrideProvider(MailService)
        .useValue({})
        .compile();

      expect(moduleRef).toBeDefined();

      const authModule = moduleRef.get<AuthModule>(AuthModule);
      expect(authModule).toBeDefined();

      const authController = moduleRef.get<AuthController>(AuthController);
      expect(authController).toBeDefined();

      const authService = moduleRef.get<AuthService>(AuthService);
      expect(authService).toBeDefined();
    });
  });
});
