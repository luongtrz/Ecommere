import { INestApplication } from '@nestjs/common';
import { SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { setupSwagger } from './swagger';

describe('setupSwagger', () => {
  let mockApp: jest.Mocked<INestApplication>;
  let createDocumentSpy: jest.SpyInstance;
  let setupSpy: jest.SpyInstance;

  const mockDocument: OpenAPIObject = {
    openapi: '3.0.0',
    info: {
      title: 'Thai Spray Shop API',
      description:
        'Backend API for Thai Spray Shop - E-commerce platform for Thai spray products',
      version: '1.0',
    },
    paths: {},
  };

  beforeEach(() => {
    mockApp = {} as unknown as jest.Mocked<INestApplication>;
    createDocumentSpy = jest
      .spyOn(SwaggerModule, 'createDocument')
      .mockReturnValue(mockDocument);
    setupSpy = jest
      .spyOn(SwaggerModule, 'setup')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should build document and setup Swagger docs with expected configuration', () => {
    setupSwagger(mockApp);

    expect(createDocumentSpy).toHaveBeenCalledTimes(1);
    const [passedApp, passedConfig] = createDocumentSpy.mock.calls[0];
    expect(passedApp).toBe(mockApp);

    expect(passedConfig).toEqual(
      expect.objectContaining({
        openapi: '3.0.0',
        info: expect.objectContaining({
          title: 'Thai Spray Shop API',
          description:
            'Backend API for Thai Spray Shop - E-commerce platform for Thai spray products',
          version: '1.0',
        }),
        components: expect.objectContaining({
          securitySchemes: expect.objectContaining({
            'JWT-auth': {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              name: 'JWT',
              description: 'Enter JWT token',
              in: 'header',
            },
          }),
        }),
      }),
    );

    const expectedTags = [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Categories', description: 'Product categories' },
      { name: 'Products', description: 'Products and variants' },
      { name: 'Inventory', description: 'Stock management' },
      { name: 'Coupons', description: 'Discount coupons' },
      { name: 'Cart', description: 'Shopping cart' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Reviews', description: 'Product reviews' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Uploads', description: 'File uploads' },
    ];
    expect(passedConfig.tags).toEqual(expectedTags);

    expect(setupSpy).toHaveBeenCalledTimes(1);
    expect(setupSpy).toHaveBeenCalledWith('api/docs', mockApp, mockDocument, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  });

  it('should throw and propagate error when SwaggerModule.createDocument fails', () => {
    const error = new Error('Swagger document creation failed');
    createDocumentSpy.mockImplementation(() => {
      throw error;
    });

    expect(() => setupSwagger(mockApp)).toThrow(error);
    expect(createDocumentSpy).toHaveBeenCalledTimes(1);
    expect(setupSpy).not.toHaveBeenCalled();
  });

  it('should throw and propagate error when SwaggerModule.setup fails', () => {
    const error = new Error('Swagger UI setup failed');
    setupSpy.mockImplementation(() => {
      throw error;
    });

    expect(() => setupSwagger(mockApp)).toThrow(error);
    expect(createDocumentSpy).toHaveBeenCalledTimes(1);
    expect(setupSpy).toHaveBeenCalledTimes(1);
  });
});
