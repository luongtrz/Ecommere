import { join } from 'path';

const mockSet = jest.fn();
const mockHttpInstance = {
  set: mockSet,
};
const mockHttpAdapter = {
  getInstance: jest.fn(() => mockHttpInstance),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockApp = {
  get: jest.fn(),
  getHttpAdapter: jest.fn(() => mockHttpAdapter),
  setGlobalPrefix: jest.fn(),
  use: jest.fn(),
  enableCors: jest.fn(),
  useGlobalPipes: jest.fn(),
  useGlobalFilters: jest.fn(),
  useGlobalInterceptors: jest.fn(),
  listen: jest.fn(),
};

const mockNestFactoryCreate = jest.fn();

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: (moduleOrApp: any, options?: any) =>
      (mockNestFactoryCreate as any)(moduleOrApp, options),
  },
}));

const mockHelmetMiddleware = jest.fn();
const mockHelmet = jest.fn((_options?: any) => mockHelmetMiddleware);
jest.mock('helmet', () => {
  const fn: any = (options?: any) => (mockHelmet as any)(options);
  fn.default = fn;
  return fn;
});

const mockCookieParserMiddleware = jest.fn();
const mockCookieParser = jest.fn(
  (..._args: any[]) => mockCookieParserMiddleware,
);
jest.mock('cookie-parser', () => {
  const fn: any = (secret?: any, options?: any) =>
    (mockCookieParser as any)(secret, options);
  fn.default = fn;
  return fn;
});

const mockExpressStaticMiddleware = jest.fn();
const mockExpressStatic = jest.fn(
  (_root?: any, _options?: any) => mockExpressStaticMiddleware,
);
jest.mock('express', () => ({
  static: (root: any, options?: any) =>
    (mockExpressStatic as any)(root, options),
}));

const mockSetupSwagger = jest.fn((_app?: any) => undefined);
jest.mock('./swagger', () => ({
  setupSwagger: (app: any) => (mockSetupSwagger as any)(app),
}));

jest.mock('./app.module', () => ({
  AppModule: class MockAppModule {},
}));

describe('main bootstrap', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    mockNestFactoryCreate.mockResolvedValue(mockApp);
    mockApp.get.mockReturnValue(mockConfigService);
    mockApp.getHttpAdapter.mockReturnValue(mockHttpAdapter);
    mockHttpAdapter.getInstance.mockReturnValue(mockHttpInstance);
    mockHelmet.mockReturnValue(mockHelmetMiddleware);
    mockCookieParser.mockReturnValue(mockCookieParserMiddleware);
    mockExpressStatic.mockReturnValue(mockExpressStaticMiddleware);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  const runBootstrap = async (): Promise<void> => {
    let onListenCalled: () => void;
    const listenPromise = new Promise<void>((resolve) => {
      onListenCalled = resolve;
    });

    mockApp.listen.mockImplementation(async () => {
      onListenCalled();
      return undefined;
    });

    jest.isolateModules(() => {
      require('./main');
    });

    await listenPromise;
    await new Promise((resolve) => setImmediate(resolve));
  };

  it('should bootstrap successfully in development environment with all standard configurations', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'CORS_ORIGIN':
          return ' https://admin.example.com , , https://shop.example.com ';
        case 'NODE_ENV':
          return 'development';
        case 'PORT':
          return 4001;
        default:
          return undefined;
      }
    });

    await runBootstrap();

    // Verify NestFactory initialization
    expect(mockNestFactoryCreate).toHaveBeenCalledTimes(1);

    // Verify ConfigService injection
    expect(mockApp.get).toHaveBeenCalledTimes(1);
    expect(mockApp.get.mock.calls[0][0].name).toBe('ConfigService');

    // Verify proxy trust configuration
    expect(mockHttpAdapter.getInstance).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith('trust proxy', 1);

    // Verify global prefix
    expect(mockApp.setGlobalPrefix).toHaveBeenCalledWith('api');

    // Verify security middleware (helmet)
    expect(mockHelmet).toHaveBeenCalledWith({
      crossOriginResourcePolicy: false,
    });
    expect(mockApp.use).toHaveBeenCalledWith(mockHelmetMiddleware);

    // Verify cookie parser
    expect(mockCookieParser).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalledWith(mockCookieParserMiddleware);

    // Verify static uploads directory
    const expectedUploadsPath = join(__dirname, '..', 'uploads');
    expect(mockExpressStatic.mock.calls[0][0]).toBe(expectedUploadsPath);
    expect(mockApp.use).toHaveBeenCalledWith(
      '/uploads',
      mockExpressStaticMiddleware,
    );

    // Verify global validation pipe
    expect(mockApp.useGlobalPipes).toHaveBeenCalledTimes(1);
    const pipe = mockApp.useGlobalPipes.mock.calls[0][0];
    expect(pipe.constructor.name).toBe('ValidationPipe');

    // Verify global filter
    expect(mockApp.useGlobalFilters).toHaveBeenCalledTimes(1);
    const filter = mockApp.useGlobalFilters.mock.calls[0][0];
    expect(filter.constructor.name).toBe('HttpExceptionFilter');

    // Verify global interceptors
    expect(mockApp.useGlobalInterceptors).toHaveBeenCalledTimes(1);
    const [interceptor1, interceptor2] =
      mockApp.useGlobalInterceptors.mock.calls[0];
    expect(interceptor1.constructor.name).toBe('LoggingInterceptor');
    expect(interceptor2.constructor.name).toBe('TransformInterceptor');

    // Verify swagger in development
    expect(mockSetupSwagger).toHaveBeenCalledWith(mockApp);

    // Verify listen and server console logs
    expect(mockApp.listen).toHaveBeenCalledWith(4001);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '🚀 Server running on http://localhost:4001',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '📚 Swagger docs available at http://localhost:4001/api/docs',
    );

    // Verify CORS options and origin evaluation branches
    expect(mockApp.enableCors).toHaveBeenCalledTimes(1);
    const corsConfig = mockApp.enableCors.mock.calls[0][0];

    expect(corsConfig.credentials).toBe(true);
    expect(corsConfig.methods).toEqual([
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ]);
    expect(corsConfig.allowedHeaders).toEqual([
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-Chat-Session',
      'x-chat-session',
    ]);
    expect(corsConfig.exposedHeaders).toEqual([
      'Content-Disposition',
      'X-CSRF-Token',
      'X-Chat-Session',
    ]);

    // Test CORS origin callback: null/undefined/empty origin allows health check / server-to-server
    const cbUndefined = jest.fn();
    corsConfig.origin(undefined, cbUndefined);
    expect(cbUndefined).toHaveBeenCalledWith(null, true);

    const cbEmpty = jest.fn();
    corsConfig.origin('', cbEmpty);
    expect(cbEmpty).toHaveBeenCalledWith(null, true);

    // Test CORS origin callback: allowed origins
    const cbAllowed1 = jest.fn();
    corsConfig.origin('https://admin.example.com', cbAllowed1);
    expect(cbAllowed1).toHaveBeenCalledWith(null, true);

    const cbAllowed2 = jest.fn();
    corsConfig.origin('https://shop.example.com', cbAllowed2);
    expect(cbAllowed2).toHaveBeenCalledWith(null, true);

    // Test CORS origin callback: unauthorized origin rejected with Error
    const cbRejected = jest.fn();
    corsConfig.origin('https://unauthorized-domain.com', cbRejected);
    expect(cbRejected).toHaveBeenCalledTimes(1);
    const [rejectionError, isAllowed] = cbRejected.mock.calls[0];
    expect(rejectionError).toBeInstanceOf(Error);
    expect(rejectionError.message).toBe('Not allowed by CORS');
    expect(isAllowed).toBeUndefined();
  });

  it('should bootstrap in production mode without swagger and with custom port and empty CORS_ORIGIN', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'CORS_ORIGIN':
          return undefined;
        case 'NODE_ENV':
          return 'production';
        case 'PORT':
          return 8080;
        default:
          return undefined;
      }
    });

    await runBootstrap();

    // Verify Swagger is disabled in production
    expect(mockSetupSwagger).not.toHaveBeenCalled();

    // Verify custom port
    expect(mockApp.listen).toHaveBeenCalledWith(8080);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '🚀 Server running on http://localhost:8080',
    );
    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Swagger docs available'),
    );

    // Verify CORS origin rejection when CORS_ORIGIN is undefined
    const corsConfig = mockApp.enableCors.mock.calls[0][0];

    const cbUndefined = jest.fn();
    corsConfig.origin(undefined, cbUndefined);
    expect(cbUndefined).toHaveBeenCalledWith(null, true);

    const cbOrigin = jest.fn();
    corsConfig.origin('https://example.com', cbOrigin);
    expect(cbOrigin).toHaveBeenCalledTimes(1);
    const [err] = cbOrigin.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Not allowed by CORS');
  });

  it('should fall back to default port 4001 when PORT is not provided in environment', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'CORS_ORIGIN':
          return '';
        case 'NODE_ENV':
          return 'production';
        case 'PORT':
          return undefined;
        default:
          return undefined;
      }
    });

    await runBootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(4001);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '🚀 Server running on http://localhost:4001',
    );
  });

  // Note: main.ts executes bootstrap() at module top-level as an unhandled floating promise
  // (bootstrap(); with no try/catch or .catch() handler). Any rejection from NestFactory.create
  // or app.listen results in an unhandled promise rejection in the Node/Jest process rather than
  // handled application behavior. Per instructions: "Do not remove tests unless they cannot be
  // made to match the code; say so in a comment." The tests attempting to assert handled rejections
  // from NestFactory.create and app.listen have been removed for this reason.
});
