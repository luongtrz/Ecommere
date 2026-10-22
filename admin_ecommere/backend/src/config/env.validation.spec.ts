import 'reflect-metadata';
import { validate } from './env.validation';

describe('env.validation', () => {
  const validBaseConfig: Record<string, unknown> = {
    DATABASE_URL:
      'postgresql://postgres:password@localhost:5432/ecommerce_admin_db',
    ADMIN_JWT_ACCESS_SECRET: 'test-admin-jwt-access-secret-12345678',
    ADMIN_JWT_REFRESH_SECRET: 'test-admin-jwt-refresh-secret-87654321',
  };

  describe('validate - valid configurations', () => {
    it('should validate and return instance with defaults when only required fields are provided', () => {
      const result = validate(validBaseConfig);

      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe(4001);
      expect(result.DATABASE_URL).toBe(
        'postgresql://postgres:password@localhost:5432/ecommerce_admin_db',
      );
      expect(result.ADMIN_JWT_ACCESS_SECRET).toBe(
        'test-admin-jwt-access-secret-12345678',
      );
      expect(result.ADMIN_JWT_REFRESH_SECRET).toBe(
        'test-admin-jwt-refresh-secret-87654321',
      );
      expect(result.TOKEN_EXPIRES_IN).toBe('15m');
      expect(result.REFRESH_EXPIRES_IN).toBe('7d');
      expect(result.CORS_ORIGIN).toBe('http://localhost:5174');
      expect(result.UPLOAD_DIR).toBe('./uploads');
      expect(result.RATE_LIMIT_TTL).toBe(60);
      expect(result.RATE_LIMIT_MAX).toBe(100);
      expect(result.DEFAULT_PAGE_SIZE).toBe(20);
      expect(result.MAX_PAGE_SIZE).toBe(100);

      // Optional fields should be undefined
      expect(result.SMTP_HOST).toBeUndefined();
      expect(result.SMTP_PORT).toBeUndefined();
      expect(result.SMTP_SECURE).toBeUndefined();
      expect(result.SMTP_USER).toBeUndefined();
      expect(result.SMTP_USERNAME).toBeUndefined();
      expect(result.SMTP_PASS).toBeUndefined();
      expect(result.SMTP_PASSWORD).toBeUndefined();
      expect(result.SMTP_FROM).toBeUndefined();
      expect(result.FRONTEND_URL).toBeUndefined();
    });

    it('should accept valid NODE_ENV values: production and test', () => {
      const prodResult = validate({
        ...validBaseConfig,
        NODE_ENV: 'production',
      });
      expect(prodResult.NODE_ENV).toBe('production');

      const testResult = validate({
        ...validBaseConfig,
        NODE_ENV: 'test',
      });
      expect(testResult.NODE_ENV).toBe('test');

      const devResult = validate({
        ...validBaseConfig,
        NODE_ENV: 'development',
      });
      expect(devResult.NODE_ENV).toBe('development');
    });

    it('should implicitly convert string numbers to numbers and apply all custom overrides', () => {
      const customConfig: Record<string, unknown> = {
        NODE_ENV: 'production',
        PORT: '5001',
        DATABASE_URL:
          'postgresql://prod_admin:secret@db.prod.internal:5432/admin_db',
        ADMIN_JWT_ACCESS_SECRET: 'custom-admin-access-secret-production',
        ADMIN_JWT_REFRESH_SECRET: 'custom-admin-refresh-secret-production',
        TOKEN_EXPIRES_IN: '30m',
        REFRESH_EXPIRES_IN: '14d',
        CORS_ORIGIN: 'https://admin.thai-spray.com',
        UPLOAD_DIR: '/mnt/storage/uploads',
        RATE_LIMIT_TTL: '120',
        RATE_LIMIT_MAX: '250',
        DEFAULT_PAGE_SIZE: '50',
        MAX_PAGE_SIZE: '500',
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_SECURE: 'tls',
        SMTP_USER: 'admin@example.com',
        SMTP_USERNAME: 'admin_user',
        SMTP_PASS: 'smtp-secret-pass',
        SMTP_PASSWORD: 'smtp-secret-password',
        SMTP_FROM: 'noreply@example.com',
        FRONTEND_URL: 'https://admin.thai-spray.com',
      };

      const result = validate(customConfig);

      expect(result.NODE_ENV).toBe('production');
      expect(result.PORT).toBe(5001);
      expect(result.DATABASE_URL).toBe(
        'postgresql://prod_admin:secret@db.prod.internal:5432/admin_db',
      );
      expect(result.ADMIN_JWT_ACCESS_SECRET).toBe(
        'custom-admin-access-secret-production',
      );
      expect(result.ADMIN_JWT_REFRESH_SECRET).toBe(
        'custom-admin-refresh-secret-production',
      );
      expect(result.TOKEN_EXPIRES_IN).toBe('30m');
      expect(result.REFRESH_EXPIRES_IN).toBe('14d');
      expect(result.CORS_ORIGIN).toBe('https://admin.thai-spray.com');
      expect(result.UPLOAD_DIR).toBe('/mnt/storage/uploads');
      expect(result.RATE_LIMIT_TTL).toBe(120);
      expect(result.RATE_LIMIT_MAX).toBe(250);
      expect(result.DEFAULT_PAGE_SIZE).toBe(50);
      expect(result.MAX_PAGE_SIZE).toBe(500);
      expect(result.SMTP_HOST).toBe('smtp.example.com');
      expect(result.SMTP_PORT).toBe(587);
      expect(result.SMTP_SECURE).toBe('tls');
      expect(result.SMTP_USER).toBe('admin@example.com');
      expect(result.SMTP_USERNAME).toBe('admin_user');
      expect(result.SMTP_PASS).toBe('smtp-secret-pass');
      expect(result.SMTP_PASSWORD).toBe('smtp-secret-password');
      expect(result.SMTP_FROM).toBe('noreply@example.com');
      expect(result.FRONTEND_URL).toBe('https://admin.thai-spray.com');
    });

    it('should accept native number types directly without conversion issues', () => {
      const numericConfig: Record<string, unknown> = {
        ...validBaseConfig,
        PORT: 3001,
        RATE_LIMIT_TTL: 30,
        RATE_LIMIT_MAX: 50,
        DEFAULT_PAGE_SIZE: 10,
        MAX_PAGE_SIZE: 50,
        SMTP_PORT: 465,
      };

      const result = validate(numericConfig);

      expect(result.PORT).toBe(3001);
      expect(result.RATE_LIMIT_TTL).toBe(30);
      expect(result.RATE_LIMIT_MAX).toBe(50);
      expect(result.DEFAULT_PAGE_SIZE).toBe(10);
      expect(result.MAX_PAGE_SIZE).toBe(50);
      expect(result.SMTP_PORT).toBe(465);
    });
  });

  describe('validate - validation errors (error path throwing Error)', () => {
    it('should throw Error when config is empty and missing required fields', () => {
      expect(() => validate({})).toThrow(Error);
      expect(() => validate({})).toThrow(/DATABASE_URL/);
      expect(() => validate({})).toThrow(/ADMIN_JWT_ACCESS_SECRET/);
      expect(() => validate({})).toThrow(/ADMIN_JWT_REFRESH_SECRET/);
    });

    it('should throw Error when DATABASE_URL is missing', () => {
      const config = {
        ADMIN_JWT_ACCESS_SECRET: 'access-secret',
        ADMIN_JWT_REFRESH_SECRET: 'refresh-secret',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/DATABASE_URL/);
    });

    it('should throw Error when ADMIN_JWT_ACCESS_SECRET is missing', () => {
      const config = {
        DATABASE_URL: 'postgresql://localhost:5432/admin_db',
        ADMIN_JWT_REFRESH_SECRET: 'refresh-secret',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/ADMIN_JWT_ACCESS_SECRET/);
    });

    it('should throw Error when ADMIN_JWT_REFRESH_SECRET is missing', () => {
      const config = {
        DATABASE_URL: 'postgresql://localhost:5432/admin_db',
        ADMIN_JWT_ACCESS_SECRET: 'access-secret',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/ADMIN_JWT_REFRESH_SECRET/);
    });

    it('should throw Error when NODE_ENV is not a valid Environment enum value', () => {
      const config = {
        ...validBaseConfig,
        NODE_ENV: 'staging',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/NODE_ENV/);
    });

    it('should throw Error when PORT is not a valid number', () => {
      const config = {
        ...validBaseConfig,
        PORT: 'not-a-number',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/PORT/);
    });

    it('should throw Error when RATE_LIMIT_TTL is not a valid number', () => {
      const config = {
        ...validBaseConfig,
        RATE_LIMIT_TTL: 'invalid-ttl',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/RATE_LIMIT_TTL/);
    });

    it('should throw Error when RATE_LIMIT_MAX is not a valid number', () => {
      const config = {
        ...validBaseConfig,
        RATE_LIMIT_MAX: 'invalid-max',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/RATE_LIMIT_MAX/);
    });

    it('should throw Error when DEFAULT_PAGE_SIZE is not a valid number', () => {
      const config = {
        ...validBaseConfig,
        DEFAULT_PAGE_SIZE: 'invalid-page-size',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/DEFAULT_PAGE_SIZE/);
    });

    it('should throw Error when MAX_PAGE_SIZE is not a valid number', () => {
      const config = {
        ...validBaseConfig,
        MAX_PAGE_SIZE: 'invalid-max-page-size',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/MAX_PAGE_SIZE/);
    });

    it('should throw Error when optional SMTP_PORT is not a valid number', () => {
      const config = {
        ...validBaseConfig,
        SMTP_PORT: 'invalid-port',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/SMTP_PORT/);
    });
  });
});
