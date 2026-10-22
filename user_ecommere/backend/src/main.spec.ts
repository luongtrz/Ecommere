import { ConfigService } from '@nestjs/config';
import { join } from 'path';

// Mock dependencies before requiring main.ts
const mockExpressInstance = {
  set: jest.fn(),
};

const mockHttpAdapter = {
  getInstance: jest.fn(() => mockExpressInstance),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockApp = {
  getHttpAdapter: jest.fn(() => mockHttpAdapter),
  get: jest.fn((token: any) => {
    if (token === ConfigService || token?.name === 'ConfigService') {
      return mockConfigService;
    }
    return undefined;
  }),
  setGlobalPrefix: jest.fn(),
  use: jest.fn(),
  enableCors: jest.fn(),
  useGlobalPipes: jest.fn(),
  useGlobalFilters: jest.fn(),
  useGlobalInterceptors: jest.fn(),
  listen: jest.fn(),
};

const mockNestCreate = jest.fn();

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: (...args: any[]) => mockNestCreate(...args),
  },
}));

const mockHelmetMiddleware = jest.fn((req, res, next) => next?.());
const mockHelmet = jest.fn(() => mockHelmetMiddleware);
jest.mock('helmet', () => {
  const fn = Object.assign(mockHelmet, {
    default: mockHelmet,
    __esModule: true,
  });
  return fn;
});

const mockCookieParserMiddleware = jest.fn((req, res, next) => next?.());
const mockCookieParser = jest.fn(() => mockCookieParserMiddleware);
jest.mock('cookie-parser', () => {
  const fn = Object.assign(mockCookieParser, {
    default: mockCookieParser,
    __esModule: true,
  });
  return fn;
});

const mockExpressStaticMiddleware = jest.fn((req, res, next) => next?.());
const mockExpressStatic = jest.fn(() => mockExpressStaticMiddleware);
jest.mock('express', () => ({
  static: mockExpressStatic,
  default: {
    static: mockExpressStatic,
  },
  __esModule: true,
}));

const mockSetupSwagger = jest.fn();
jest.mock('./swagger', () => ({
  setupSwagger: mockSetupSwagger,
}));

jest.mock('./app.module', () => ({
  AppModule: class MockAppModule {},
}));

jest.mock('module-alias/register', () => ({}), { virtual: true });

describe('main bootstrap', () => {
  let consoleLogSpy: jest.SpyInstance;

  interface BootstrapOptions {
    nodeEnv?: string;
    port?: number | string;
    corsOrigin?: string;
  }

  async function runBootstrap(options: BootstrapOptions = {}) {
    let resolveListen: () => void;
    const listenPromise = new Promise<void>((resolve) => {
      resolveListen = resolve;
    });

    mockNestCreate.mockResolvedValue(mockApp);

    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return options.nodeEnv;
        case 'PORT':
          return options.port;
        case 'CORS_ORIGIN':
          return options.corsOrigin;
        default:
          return undefined;
      }
    });

    mockApp.listen.mockImplementation(async () => {
      resolveListen();
      return undefined;
    });

    jest.isolateModules(() => {
      require('./main');
    });

    await listenPromise;
    await new Promise((resolve) => setImmediate(resolve));
  }

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should bootstrap application in development mode with custom port, CORS origins, and swagger enabled', async () => {
    await runBootstrap({
      nodeEnv: 'development',
      port: 5000,
      corsOrigin:
        'http://localhost:3000, https://app.example.com, http://localhost:5173',
    });

    // 1. NestFactory.create called with AppModule
    expect(mockNestCreate).toHaveBeenCalledTimes(1);
    expect(mockNestCreate).toHaveBeenCalledWith(expect.any(Function));
    expect(mockNestCreate.mock.calls[0][0].name).toMatch(/AppModule/);

    // 2. ConfigService retrieval
    expect(mockApp.get).toHaveBeenCalledTimes(1);
    expect(mockApp.get).toHaveBeenCalledWith(expect.any(Function));
    expect(mockApp.get.mock.calls[0][0].name).toBe('ConfigService');

    // 3. Trust proxy configured on HTTP adapter instance
    expect(mockApp.getHttpAdapter).toHaveBeenCalledTimes(1);
    expect(mockHttpAdapter.getInstance).toHaveBeenCalledTimes(1);
    expect(mockExpressInstance.set).toHaveBeenCalledWith('trust proxy', 1);

    // 4. Global prefix
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');

    // 5. Security helmet middleware
    expect(mockHelmet).toHaveBeenCalledWith({
      crossOriginResourcePolicy: false,
    });
    expect(mockApp.use).toHaveBeenCalledWith(mockHelmetMiddleware);

    // 6. Cookie parser middleware
    expect(mockCookieParser).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalledWith(mockCookieParserMiddleware);

    // 7. Static file serving for uploads
    const expectedUploadsPath = join(__dirname, '..', 'uploads');
    expect(mockExpressStatic).toHaveBeenCalledWith(expectedUploadsPath);
    expect(mockApp.use).toHaveBeenCalledWith(
      '/uploads',
      mockExpressStaticMiddleware,
    );

    // 8. CORS configuration
    expect(mockApp.enableCors).toHaveBeenCalledTimes(1);
    const corsConfig = mockApp.enableCors.mock.calls[0][0];
    expect(corsConfig).toEqual(
      expect.objectContaining({
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'Origin',
          'X-CSRF-Token',
          'X-Chat-Session',
          'x-chat-session',
        ],
        exposedHeaders: [
          'Content-Disposition',
          'X-CSRF-Token',
          'X-Chat-Session',
        ],
      }),
    );

    // Test CORS origin callback branches
    const originFn = corsConfig.origin;

    // Branch: no origin (curl, mobile, Postman)
    const cbNoOrigin = jest.fn();
    originFn(undefined, cbNoOrigin);
    expect(cbNoOrigin).toHaveBeenCalledWith(null, true);

    const cbEmptyOrigin = jest.fn();
    originFn('', cbEmptyOrigin);
    expect(cbEmptyOrigin).toHaveBeenCalledWith(null, true);

    // Branch: allowed origin
    const cbAllowed1 = jest.fn();
    originFn('http://localhost:3000', cbAllowed1);
    expect(cbAllowed1).toHaveBeenCalledWith(null, true);

    const cbAllowed2 = jest.fn();
    originFn('https://app.example.com', cbAllowed2);
    expect(cbAllowed2).toHaveBeenCalledWith(null, true);

    const cbAllowed3 = jest.fn();
    originFn('http://localhost:5173', cbAllowed3);
    expect(cbAllowed3).toHaveBeenCalledWith(null, true);

    // Branch: disallowed origin
    const cbDisallowed = jest.fn();
    originFn('http://malicious-site.com', cbDisallowed);
    expect(cbDisallowed).toHaveBeenCalledWith(expect.any(Error));
    const errorArg = cbDisallowed.mock.calls[0][0];
    expect(errorArg.message).toBe('Not allowed by CORS');

    // 9. Global pipes (ValidationPipe)
    expect(mockApp.useGlobalPipes).toHaveBeenCalledTimes(1);
    const pipe = mockApp.useGlobalPipes.mock.calls[0][0];
    expect(pipe.constructor.name).toBe('ValidationPipe');
    expect((pipe as any).isTransformEnabled).toBe(true);
    expect((pipe as any).validatorOptions).toEqual(
      expect.objectContaining({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    expect((pipe as any).transformOptions).toEqual({
      enableImplicitConversion: true,
    });

    // 10. Global filters (HttpExceptionFilter)
    expect(mockApp.useGlobalFilters).toHaveBeenCalledTimes(1);
    const filter = mockApp.useGlobalFilters.mock.calls[0][0];
    expect(filter.constructor.name).toBe('HttpExceptionFilter');

    // 11. Global interceptors (LoggingInterceptor, TransformInterceptor)
    expect(mockApp.useGlobalInterceptors).toHaveBeenCalledTimes(1);
    const [interceptor1, interceptor2] =
      mockApp.useGlobalInterceptors.mock.calls[0];
    expect(interceptor1.constructor.name).toBe('LoggingInterceptor');
    expect(interceptor2.constructor.name).toBe('TransformInterceptor');

    // 12. Swagger enabled outside production
    expect(mockSetupSwagger).toHaveBeenCalledTimes(1);
    expect(mockSetupSwagger).toHaveBeenCalledWith(mockApp);

    // 13. Application listen on custom port
    expect(mockApp.listen).toHaveBeenCalledWith(5000);

    // 14. Logs printed
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '🚀 Server running on http://localhost:5000',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📚 Swagger docs available at http://localhost:5000/api/docs',
    );
  });

  it('should bootstrap application in production mode with default port 4000 and swagger disabled', async () => {
    await runBootstrap({
      nodeEnv: 'production',
      port: undefined,
      corsOrigin: 'http://localhost:5173',
    });

    // Swagger should NOT be set up in production
    expect(mockSetupSwagger).not.toHaveBeenCalled();

    // Default port 4000
    expect(mockApp.listen).toHaveBeenCalledWith(4000);

    // Logs in production
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '🚀 Server running on http://localhost:4000',
    );
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Swagger docs available'),
    );
  });

  it('should enable swagger when NODE_ENV is undefined and listen on configured port', async () => {
    await runBootstrap({
      nodeEnv: undefined,
      port: 8080,
      corsOrigin: 'http://localhost:3000',
    });

    // When NODE_ENV is undefined, !== 'production' is true, so swagger is enabled
    expect(mockSetupSwagger).toHaveBeenCalledWith(mockApp);
    expect(mockApp.listen).toHaveBeenCalledWith(8080);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '🚀 Server running on http://localhost:8080',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📚 Swagger docs available at http://localhost:8080/api/docs',
    );
  });

  it('should handle CORS origin checking when CORS_ORIGIN is undefined (empty default)', async () => {
    await runBootstrap({
      nodeEnv: 'development',
      port: 4000,
      corsOrigin: undefined,
    });

    const corsConfig = mockApp.enableCors.mock.calls[0][0];
    const originFn = corsConfig.origin;

    // Requests without origin still succeed
    const cbNoOrigin = jest.fn();
    originFn(undefined, cbNoOrigin);
    expect(cbNoOrigin).toHaveBeenCalledWith(null, true);

    // Any origin is rejected since allowed origins list is empty
    const cbAnyOrigin = jest.fn();
    originFn('http://localhost:3000', cbAnyOrigin);
    expect(cbAnyOrigin).toHaveBeenCalledWith(expect.any(Error));
    expect(cbAnyOrigin.mock.calls[0][0].message).toBe('Not allowed by CORS');
  });

  it('should trim origins and filter out empty entries from CORS_ORIGIN', async () => {
    await runBootstrap({
      nodeEnv: 'development',
      port: 4000,
      corsOrigin: '  http://domain1.com  ,   ,  http://domain2.com  ',
    });

    const corsConfig = mockApp.enableCors.mock.calls[0][0];
    const originFn = corsConfig.origin;

    // Both trimmed domains should be allowed
    const cb1 = jest.fn();
    originFn('http://domain1.com', cb1);
    expect(cb1).toHaveBeenCalledWith(null, true);

    const cb2 = jest.fn();
    originFn('http://domain2.com', cb2);
    expect(cb2).toHaveBeenCalledWith(null, true);

    // Non-listed domain should be rejected
    const cb3 = jest.fn();
    originFn('http://domain3.com', cb3);
    expect(cb3).toHaveBeenCalledWith(expect.any(Error));
    expect(cb3.mock.calls[0][0].message).toBe('Not allowed by CORS');
  });
});
