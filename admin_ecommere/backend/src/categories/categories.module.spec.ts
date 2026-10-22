import { Test, TestingModule } from '@nestjs/testing';
import { Global, Module } from '@nestjs/common';
import { CategoriesModule } from './categories.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('CategoriesModule', () => {
  describe('Module compilation with overridden provider', () => {
    let moduleRef: TestingModule;
    let categoriesModule: CategoriesModule;
    let categoriesController: CategoriesController;
    let categoriesService: CategoriesService;

    const mockCategoriesService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getTreeStructure: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [CategoriesModule],
      })
        .overrideProvider(CategoriesService)
        .useValue(mockCategoriesService)
        .compile();

      categoriesModule = moduleRef.get<CategoriesModule>(CategoriesModule);
      categoriesController =
        moduleRef.get<CategoriesController>(CategoriesController);
      categoriesService = moduleRef.get<CategoriesService>(CategoriesService);
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should be defined', () => {
      expect(categoriesModule).toBeDefined();
      expect(categoriesModule).toBeInstanceOf(CategoriesModule);
    });

    it('should resolve CategoriesController', () => {
      expect(categoriesController).toBeDefined();
      expect(categoriesController).toBeInstanceOf(CategoriesController);
    });

    it('should resolve CategoriesService with the overridden provider', () => {
      expect(categoriesService).toBeDefined();
      expect(categoriesService).toBe(mockCategoriesService);
    });

    it('should allow CategoriesController to interact with the mocked CategoriesService', async () => {
      const mockResult = [
        {
          id: 'cat-1',
          name: 'Category 1',
          slug: 'category-1',
          productCount: 0,
        },
      ];
      mockCategoriesService.findAll.mockResolvedValueOnce(mockResult);

      const result = await categoriesController.findAll();

      expect(result).toBe(mockResult);
      expect(mockCategoriesService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('Module compilation with mocked PrismaService provider', () => {
    let moduleRef: TestingModule;

    const mockPrismaService = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
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

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [MockPrismaModule, CategoriesModule],
      }).compile();
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should resolve real CategoriesService and CategoriesController with mocked PrismaService', () => {
      const module = moduleRef.get<CategoriesModule>(CategoriesModule);
      const service = moduleRef.get<CategoriesService>(CategoriesService);
      const controller =
        moduleRef.get<CategoriesController>(CategoriesController);

      expect(module).toBeDefined();
      expect(module).toBeInstanceOf(CategoriesModule);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(CategoriesService);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(CategoriesController);
    });
  });

  describe('Direct instantiation', () => {
    it('can be instantiated directly as a class instance', () => {
      const moduleInstance = new CategoriesModule();
      expect(moduleInstance).toBeDefined();
      expect(moduleInstance).toBeInstanceOf(CategoriesModule);
    });
  });

  describe('Module metadata decoration', () => {
    it('should register controllers, providers, and exports metadata', () => {
      const controllers = Reflect.getMetadata('controllers', CategoriesModule);
      const providers = Reflect.getMetadata('providers', CategoriesModule);
      const exportsList = Reflect.getMetadata('exports', CategoriesModule);

      expect(controllers).toEqual([CategoriesController]);
      expect(providers).toEqual([CategoriesService]);
      expect(exportsList).toEqual([CategoriesService]);
    });
  });
});
