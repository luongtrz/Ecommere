import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import { setupSwagger } from './swagger';

describe('setupSwagger', () => {
  let mockApp: INestApplication;
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
    jest.clearAllMocks();
    mockApp = {} as unknown as INestApplication;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(setupSwagger).toBeDefined();
  });

  it('should configure DocumentBuilder and setup SwaggerModule with correct configuration', () => {
    const createDocSpy = jest
      .spyOn(SwaggerModule, 'createDocument')
      .mockReturnValue(mockDocument);
    const setupSpy = jest
      .spyOn(SwaggerModule, 'setup')
      .mockImplementation(() => {});

    setupSwagger(mockApp);

    expect(createDocSpy).toHaveBeenCalledTimes(1);
    expect(createDocSpy).toHaveBeenCalledWith(
      mockApp,
      expect.objectContaining({
        openapi: '3.0.0',
        info: expect.objectContaining({
          title: 'Thai Spray Shop API',
          description:
            'Backend API for Thai Spray Shop - E-commerce platform for Thai spray products',
          version: '1.0',
        }),
        tags: [
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
        ],
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

    expect(setupSpy).toHaveBeenCalledTimes(1);
    expect(setupSpy).toHaveBeenCalledWith('api/docs', mockApp, mockDocument, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  });

  it('should propagate exception when SwaggerModule.createDocument throws', () => {
    const error = new Error('Failed to create swagger document');
    jest.spyOn(SwaggerModule, 'createDocument').mockImplementation(() => {
      throw error;
    });
    const setupSpy = jest
      .spyOn(SwaggerModule, 'setup')
      .mockImplementation(() => {});

    expect(() => setupSwagger(mockApp)).toThrow(Error);
    expect(() => setupSwagger(mockApp)).toThrow(
      'Failed to create swagger document',
    );
    expect(setupSpy).not.toHaveBeenCalled();
  });

  it('should propagate exception when SwaggerModule.setup throws', () => {
    const error = new Error('Failed to mount swagger UI');
    jest.spyOn(SwaggerModule, 'createDocument').mockReturnValue(mockDocument);
    jest.spyOn(SwaggerModule, 'setup').mockImplementation(() => {
      throw error;
    });

    expect(() => setupSwagger(mockApp)).toThrow(Error);
    expect(() => setupSwagger(mockApp)).toThrow('Failed to mount swagger UI');
  });

  it('should chain all DocumentBuilder methods with exact arguments', () => {
    const setTitleSpy = jest.spyOn(DocumentBuilder.prototype, 'setTitle');
    const setDescriptionSpy = jest.spyOn(
      DocumentBuilder.prototype,
      'setDescription',
    );
    const setVersionSpy = jest.spyOn(DocumentBuilder.prototype, 'setVersion');
    const addBearerAuthSpy = jest.spyOn(
      DocumentBuilder.prototype,
      'addBearerAuth',
    );
    const addTagSpy = jest.spyOn(DocumentBuilder.prototype, 'addTag');
    const buildSpy = jest.spyOn(DocumentBuilder.prototype, 'build');

    jest.spyOn(SwaggerModule, 'createDocument').mockReturnValue(mockDocument);
    jest.spyOn(SwaggerModule, 'setup').mockImplementation(() => {});

    setupSwagger(mockApp);

    expect(setTitleSpy).toHaveBeenCalledWith('Thai Spray Shop API');
    expect(setDescriptionSpy).toHaveBeenCalledWith(
      'Backend API for Thai Spray Shop - E-commerce platform for Thai spray products',
    );
    expect(setVersionSpy).toHaveBeenCalledWith('1.0');
    expect(addBearerAuthSpy).toHaveBeenCalledWith(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    );
    expect(addTagSpy).toHaveBeenCalledTimes(11);
    expect(addTagSpy).toHaveBeenNthCalledWith(
      1,
      'Auth',
      'Authentication endpoints',
    );
    expect(addTagSpy).toHaveBeenNthCalledWith(
      2,
      'Users',
      'User management endpoints',
    );
    expect(addTagSpy).toHaveBeenNthCalledWith(
      3,
      'Categories',
      'Product categories',
    );
    expect(addTagSpy).toHaveBeenNthCalledWith(
      4,
      'Products',
      'Products and variants',
    );
    expect(addTagSpy).toHaveBeenNthCalledWith(
      5,
      'Inventory',
      'Stock management',
    );
    expect(addTagSpy).toHaveBeenNthCalledWith(6, 'Coupons', 'Discount coupons');
    expect(addTagSpy).toHaveBeenNthCalledWith(7, 'Cart', 'Shopping cart');
    expect(addTagSpy).toHaveBeenNthCalledWith(8, 'Orders', 'Order management');
    expect(addTagSpy).toHaveBeenNthCalledWith(9, 'Reviews', 'Product reviews');
    expect(addTagSpy).toHaveBeenNthCalledWith(
      10,
      'Payments',
      'Payment processing',
    );
    expect(addTagSpy).toHaveBeenNthCalledWith(11, 'Uploads', 'File uploads');
    expect(buildSpy).toHaveBeenCalledTimes(1);
  });
});
