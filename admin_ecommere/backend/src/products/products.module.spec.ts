import { Test, TestingModule } from '@nestjs/testing';
import { Global, Module } from '@nestjs/common';
import { ProductsModule } from './products.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesModule } from '@/categories/categories.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('ProductsModule', () => {
  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    review: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  @Global()
  @Module({
    providers: [
      {
        provide: PrismaService,
        useValue: mockPrismaService,
      },
    ],
    exports: [PrismaService],
  })
  class MockPrismaModule {}

  describe('Module compilation with overridden provider', () => {
    let moduleRef: TestingModule;
    let productsModule: ProductsModule;
    let productsController: ProductsController;
    let productsService: ProductsService;

    const mockProductsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createVariant: jest.fn(),
      updateVariant: jest.fn(),
      removeVariant: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [MockPrismaModule, ProductsModule],
      })
        .overrideProvider(ProductsService)
        .useValue(mockProductsService)
        .compile();

      productsModule = moduleRef.get<ProductsModule>(ProductsModule);
      productsController =
        moduleRef.get<ProductsController>(ProductsController);
      productsService = moduleRef.get<ProductsService>(ProductsService);
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should be defined', () => {
      expect(productsModule).toBeDefined();
      expect(productsModule).toBeInstanceOf(ProductsModule);
    });

    it('should resolve ProductsController', () => {
      expect(productsController).toBeDefined();
      expect(productsController).toBeInstanceOf(ProductsController);
    });

    it('should resolve ProductsService with overridden provider', () => {
      expect(productsService).toBeDefined();
      expect(productsService).toBe(mockProductsService);
    });

    it('should allow ProductsController to interact with mocked ProductsService', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockProductsService.findAll.mockResolvedValueOnce(mockResult);

      const result = await productsController.findAll({ page: 1, limit: 12 });

      expect(result).toBe(mockResult);
      expect(mockProductsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 12,
      });
    });
  });

  describe('Module compilation with mocked PrismaService provider', () => {
    let moduleRef: TestingModule;

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [MockPrismaModule, ProductsModule],
      }).compile();
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should resolve real ProductsService and ProductsController with mocked PrismaService', () => {
      const module = moduleRef.get<ProductsModule>(ProductsModule);
      const service = moduleRef.get<ProductsService>(ProductsService);
      const controller = moduleRef.get<ProductsController>(ProductsController);

      expect(module).toBeDefined();
      expect(module).toBeInstanceOf(ProductsModule);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ProductsService);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(ProductsController);
    });
  });

  describe('Direct instantiation', () => {
    it('can be instantiated directly as a class instance', () => {
      const moduleInstance = new ProductsModule();
      expect(moduleInstance).toBeDefined();
      expect(moduleInstance).toBeInstanceOf(ProductsModule);
    });
  });

  describe('Module metadata decoration', () => {
    it('should register imports, controllers, providers, and exports metadata', () => {
      const imports = Reflect.getMetadata('imports', ProductsModule);
      const controllers = Reflect.getMetadata('controllers', ProductsModule);
      const providers = Reflect.getMetadata('providers', ProductsModule);
      const exportsList = Reflect.getMetadata('exports', ProductsModule);

      expect(imports).toEqual([CategoriesModule]);
      expect(controllers).toEqual([ProductsController]);
      expect(providers).toEqual([ProductsService]);
      expect(exportsList).toEqual([ProductsService]);
    });
  });
});
