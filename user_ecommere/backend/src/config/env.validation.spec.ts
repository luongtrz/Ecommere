import 'reflect-metadata';
import { validate } from './env.validation';

describe('env.validation', () => {
  const validBaseConfig: Record<string, unknown> = {
    DATABASE_URL: 'postgresql://user:password@localhost:5432/ecommerce_db',
    JWT_ACCESS_SECRET: 'super-secret-jwt-access-key-12345678',
    JWT_REFRESH_SECRET: 'super-secret-jwt-refresh-key-87654321',
  };

  describe('validate - valid configurations', () => {
    it('should validate and return instance with defaults when only required fields are provided', () => {
      const result = validate(validBaseConfig);

      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe(4000);
      expect(result.DATABASE_URL).toBe(
        'postgresql://user:password@localhost:5432/ecommerce_db',
      );
      expect(result.JWT_ACCESS_SECRET).toBe(
        'super-secret-jwt-access-key-12345678',
      );
      expect(result.JWT_REFRESH_SECRET).toBe(
        'super-secret-jwt-refresh-key-87654321',
      );
      expect(result.TOKEN_EXPIRES_IN).toBe('15m');
      expect(result.REFRESH_EXPIRES_IN).toBe('7d');
      expect(result.CORS_ORIGIN).toBe('http://localhost:5173');
      expect(result.UPLOAD_DIR).toBe('./uploads');
      expect(result.RATE_LIMIT_TTL).toBe(60);
      expect(result.RATE_LIMIT_MAX).toBe(100);
      expect(result.DEFAULT_PAGE_SIZE).toBe(20);
      expect(result.MAX_PAGE_SIZE).toBe(100);
      expect(result.CHATBOT_RAG_PRODUCT_LIMIT).toBe(4);
      expect(result.CHATBOT_RAG_VARIANT_LIMIT).toBe(3);
      expect(result.CHATBOT_RAG_CANDIDATE_LIMIT).toBe(12);

      // Optional fields should be undefined
      expect(result.OPENAI_API_KEY).toBeUndefined();
      expect(result.OPENAI_BASE_URL).toBeUndefined();
      expect(result.AGENT_MODEL).toBeUndefined();
      expect(result.AGENT_TEMPERATURE).toBeUndefined();
      expect(result.AGENT_MAX_OUTPUT_TOKENS).toBeUndefined();
      expect(result.AGENT_TIMEOUT_MS).toBeUndefined();
      expect(result.AGENT_MAX_STEPS).toBeUndefined();
      expect(result.AGENT_MAX_TOOL_CALLS_PER_TURN).toBeUndefined();
      expect(result.AGENT_HISTORY_MAX_MESSAGES).toBeUndefined();
      expect(result.AGENT_CHECKPOINT_SCHEMA).toBeUndefined();
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
    });

    it('should implicitly convert string numbers to numbers and apply all custom overrides', () => {
      const customConfig: Record<string, unknown> = {
        NODE_ENV: 'production',
        PORT: '5000',
        DATABASE_URL: 'postgresql://prod_user:secret@db.prod.internal:5432/app',
        JWT_ACCESS_SECRET: 'custom-access-secret-production',
        JWT_REFRESH_SECRET: 'custom-refresh-secret-production',
        TOKEN_EXPIRES_IN: '30m',
        REFRESH_EXPIRES_IN: '14d',
        CORS_ORIGIN: 'https://shop.example.com',
        UPLOAD_DIR: '/mnt/storage/uploads',
        RATE_LIMIT_TTL: '120',
        RATE_LIMIT_MAX: '250',
        DEFAULT_PAGE_SIZE: '50',
        MAX_PAGE_SIZE: '500',
        CHATBOT_RAG_PRODUCT_LIMIT: '8',
        CHATBOT_RAG_VARIANT_LIMIT: '6',
        CHATBOT_RAG_CANDIDATE_LIMIT: '24',
        OPENAI_API_KEY: 'sk-test-openai-key-999',
        OPENAI_BASE_URL: 'https://custom-openai-proxy.internal/v1',
        AGENT_MODEL: 'gpt-4o',
        AGENT_TEMPERATURE: '0.7',
        AGENT_MAX_OUTPUT_TOKENS: '2048',
        AGENT_TIMEOUT_MS: '45000',
        AGENT_MAX_STEPS: '32',
        AGENT_MAX_TOOL_CALLS_PER_TURN: '10',
        AGENT_HISTORY_MAX_MESSAGES: '50',
        AGENT_CHECKPOINT_SCHEMA: 'custom_checkpoints',
      };

      const result = validate(customConfig);

      expect(result.NODE_ENV).toBe('production');
      expect(result.PORT).toBe(5000);
      expect(result.DATABASE_URL).toBe(
        'postgresql://prod_user:secret@db.prod.internal:5432/app',
      );
      expect(result.JWT_ACCESS_SECRET).toBe('custom-access-secret-production');
      expect(result.JWT_REFRESH_SECRET).toBe(
        'custom-refresh-secret-production',
      );
      expect(result.TOKEN_EXPIRES_IN).toBe('30m');
      expect(result.REFRESH_EXPIRES_IN).toBe('14d');
      expect(result.CORS_ORIGIN).toBe('https://shop.example.com');
      expect(result.UPLOAD_DIR).toBe('/mnt/storage/uploads');
      expect(result.RATE_LIMIT_TTL).toBe(120);
      expect(result.RATE_LIMIT_MAX).toBe(250);
      expect(result.DEFAULT_PAGE_SIZE).toBe(50);
      expect(result.MAX_PAGE_SIZE).toBe(500);
      expect(result.CHATBOT_RAG_PRODUCT_LIMIT).toBe(8);
      expect(result.CHATBOT_RAG_VARIANT_LIMIT).toBe(6);
      expect(result.CHATBOT_RAG_CANDIDATE_LIMIT).toBe(24);
      expect(result.OPENAI_API_KEY).toBe('sk-test-openai-key-999');
      expect(result.OPENAI_BASE_URL).toBe(
        'https://custom-openai-proxy.internal/v1',
      );
      expect(result.AGENT_MODEL).toBe('gpt-4o');
      expect(result.AGENT_TEMPERATURE).toBe(0.7);
      expect(result.AGENT_MAX_OUTPUT_TOKENS).toBe(2048);
      expect(result.AGENT_TIMEOUT_MS).toBe(45000);
      expect(result.AGENT_MAX_STEPS).toBe(32);
      expect(result.AGENT_MAX_TOOL_CALLS_PER_TURN).toBe(10);
      expect(result.AGENT_HISTORY_MAX_MESSAGES).toBe(50);
      expect(result.AGENT_CHECKPOINT_SCHEMA).toBe('custom_checkpoints');
    });

    it('should accept native number types directly without conversion issues', () => {
      const numericConfig: Record<string, unknown> = {
        ...validBaseConfig,
        PORT: 3000,
        RATE_LIMIT_TTL: 30,
        RATE_LIMIT_MAX: 50,
        DEFAULT_PAGE_SIZE: 10,
        MAX_PAGE_SIZE: 50,
        CHATBOT_RAG_PRODUCT_LIMIT: 2,
        CHATBOT_RAG_VARIANT_LIMIT: 2,
        CHATBOT_RAG_CANDIDATE_LIMIT: 6,
        AGENT_TEMPERATURE: 0.1,
        AGENT_MAX_OUTPUT_TOKENS: 512,
        AGENT_TIMEOUT_MS: 15000,
        AGENT_MAX_STEPS: 12,
        AGENT_MAX_TOOL_CALLS_PER_TURN: 4,
        AGENT_HISTORY_MAX_MESSAGES: 20,
      };

      const result = validate(numericConfig);

      expect(result.PORT).toBe(3000);
      expect(result.RATE_LIMIT_TTL).toBe(30);
      expect(result.RATE_LIMIT_MAX).toBe(50);
      expect(result.DEFAULT_PAGE_SIZE).toBe(10);
      expect(result.MAX_PAGE_SIZE).toBe(50);
      expect(result.CHATBOT_RAG_PRODUCT_LIMIT).toBe(2);
      expect(result.CHATBOT_RAG_VARIANT_LIMIT).toBe(2);
      expect(result.CHATBOT_RAG_CANDIDATE_LIMIT).toBe(6);
      expect(result.AGENT_TEMPERATURE).toBe(0.1);
      expect(result.AGENT_MAX_OUTPUT_TOKENS).toBe(512);
      expect(result.AGENT_TIMEOUT_MS).toBe(15000);
      expect(result.AGENT_MAX_STEPS).toBe(12);
      expect(result.AGENT_MAX_TOOL_CALLS_PER_TURN).toBe(4);
      expect(result.AGENT_HISTORY_MAX_MESSAGES).toBe(20);
    });
  });

  describe('validate - validation errors (error path throwing Error)', () => {
    it('should throw Error when config is empty and missing required fields', () => {
      expect(() => validate({})).toThrow(Error);
      expect(() => validate({})).toThrow(/DATABASE_URL/);
      expect(() => validate({})).toThrow(/JWT_ACCESS_SECRET/);
      expect(() => validate({})).toThrow(/JWT_REFRESH_SECRET/);
    });

    it('should throw Error when DATABASE_URL is missing', () => {
      const config = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/DATABASE_URL/);
    });

    it('should throw Error when JWT_ACCESS_SECRET is missing', () => {
      const config = {
        DATABASE_URL: 'postgresql://localhost:5432/db',
        JWT_REFRESH_SECRET: 'refresh-secret',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/JWT_ACCESS_SECRET/);
    });

    it('should throw Error when JWT_REFRESH_SECRET is missing', () => {
      const config = {
        DATABASE_URL: 'postgresql://localhost:5432/db',
        JWT_ACCESS_SECRET: 'access-secret',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/JWT_REFRESH_SECRET/);
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

    it('should throw Error when CHATBOT_RAG_PRODUCT_LIMIT is not a valid number', () => {
      const config = {
        ...validBaseConfig,
        CHATBOT_RAG_PRODUCT_LIMIT: 'invalid-product-limit',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/CHATBOT_RAG_PRODUCT_LIMIT/);
    });

    it('should throw Error when CHATBOT_RAG_VARIANT_LIMIT is not a valid number', () => {
      const config = {
        ...validBaseConfig,
        CHATBOT_RAG_VARIANT_LIMIT: 'invalid-variant-limit',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/CHATBOT_RAG_VARIANT_LIMIT/);
    });

    it('should throw Error when CHATBOT_RAG_CANDIDATE_LIMIT is not a valid number', () => {
      const config = {
        ...validBaseConfig,
        CHATBOT_RAG_CANDIDATE_LIMIT: 'invalid-candidate-limit',
      };

      expect(() => validate(config)).toThrow(Error);
      expect(() => validate(config)).toThrow(/CHATBOT_RAG_CANDIDATE_LIMIT/);
    });

    it('should throw Error when optional number fields contain non-numeric values', () => {
      const invalidOptionalNumericFields = [
        { field: 'AGENT_TEMPERATURE', value: 'not-a-number' },
        { field: 'AGENT_MAX_OUTPUT_TOKENS', value: 'not-a-number' },
        { field: 'AGENT_TIMEOUT_MS', value: 'not-a-number' },
        { field: 'AGENT_MAX_STEPS', value: 'not-a-number' },
        { field: 'AGENT_MAX_TOOL_CALLS_PER_TURN', value: 'not-a-number' },
        { field: 'AGENT_HISTORY_MAX_MESSAGES', value: 'not-a-number' },
      ];

      for (const item of invalidOptionalNumericFields) {
        const config = {
          ...validBaseConfig,
          [item.field]: item.value,
        };

        expect(() => validate(config)).toThrow(Error);
        expect(() => validate(config)).toThrow(new RegExp(item.field));
      }
    });

    // Note: class-transformer with enableImplicitConversion: true coerces non-string objects and arrays
    // to strings via String(val). Missing/undefined required string fields are tested in the tests above.
  });
});
