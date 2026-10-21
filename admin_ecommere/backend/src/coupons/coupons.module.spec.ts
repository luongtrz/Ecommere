import { Test, TestingModule } from '@nestjs/testing';
import { Global, Module } from '@nestjs/common';
import { CouponsModule } from './coupons.module';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('CouponsModule', () => {
  describe('Module compilation with overridden provider', () => {
    let moduleRef: TestingModule;
    let couponsModule: CouponsModule;
    let couponsController: CouponsController;
    let couponsService: CouponsService;

    const mockCouponsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [CouponsModule],
      })
        .overrideProvider(CouponsService)
        .useValue(mockCouponsService)
        .compile();

      couponsModule = moduleRef.get<CouponsModule>(CouponsModule);
      couponsController = moduleRef.get<CouponsController>(CouponsController);
      couponsService = moduleRef.get<CouponsService>(CouponsService);
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should be defined', () => {
      expect(couponsModule).toBeDefined();
      expect(couponsModule).toBeInstanceOf(CouponsModule);
    });

    it('should resolve CouponsController', () => {
      expect(couponsController).toBeDefined();
      expect(couponsController).toBeInstanceOf(CouponsController);
    });

    it('should resolve CouponsService with the overridden provider', () => {
      expect(couponsService).toBeDefined();
      expect(couponsService).toBe(mockCouponsService);
    });

    it('should allow CouponsController to interact with the mocked CouponsService', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockCouponsService.findAll.mockResolvedValueOnce(mockResult);

      const result = await couponsController.findAll({ page: 1, limit: 20 });

      expect(result).toBe(mockResult);
      expect(mockCouponsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
    });
  });

  describe('Module compilation with mocked PrismaService provider', () => {
    let moduleRef: TestingModule;

    const mockPrismaService = {
      coupon: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      order: { count: jest.fn() },
      cart: { count: jest.fn() },
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
        imports: [MockPrismaModule, CouponsModule],
      }).compile();
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should resolve real CouponsService and CouponsController with mocked PrismaService', () => {
      const module = moduleRef.get<CouponsModule>(CouponsModule);
      const service = moduleRef.get<CouponsService>(CouponsService);
      const controller = moduleRef.get<CouponsController>(CouponsController);

      expect(module).toBeDefined();
      expect(module).toBeInstanceOf(CouponsModule);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(CouponsService);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(CouponsController);
    });
  });

  describe('Direct instantiation', () => {
    it('can be instantiated directly as a class instance', () => {
      const moduleInstance = new CouponsModule();
      expect(moduleInstance).toBeDefined();
      expect(moduleInstance).toBeInstanceOf(CouponsModule);
    });
  });

  describe('Module metadata decoration', () => {
    it('should register controllers, providers, and exports metadata', () => {
      const controllers = Reflect.getMetadata('controllers', CouponsModule);
      const providers = Reflect.getMetadata('providers', CouponsModule);
      const exportsList = Reflect.getMetadata('exports', CouponsModule);

      expect(controllers).toEqual([CouponsController]);
      expect(providers).toEqual([CouponsService]);
      expect(exportsList).toEqual([CouponsService]);
    });
  });
});
