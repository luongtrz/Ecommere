import { Test, TestingModule } from '@nestjs/testing';
import { Global, Module } from '@nestjs/common';
import { ReferralsModule } from './referrals.module';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('ReferralsModule', () => {
  describe('Module compilation with overridden provider', () => {
    let moduleRef: TestingModule;
    let referralsModule: ReferralsModule;
    let referralsController: ReferralsController;
    let referralsService: ReferralsService;

    const mockReferralsService = {
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      getStats: jest.fn(),
      getAllReferrals: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [ReferralsModule],
      })
        .overrideProvider(ReferralsService)
        .useValue(mockReferralsService)
        .compile();

      referralsModule = moduleRef.get<ReferralsModule>(ReferralsModule);
      referralsController =
        moduleRef.get<ReferralsController>(ReferralsController);
      referralsService = moduleRef.get<ReferralsService>(ReferralsService);
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should be defined', () => {
      expect(referralsModule).toBeDefined();
      expect(referralsModule).toBeInstanceOf(ReferralsModule);
    });

    it('should resolve ReferralsController', () => {
      expect(referralsController).toBeDefined();
      expect(referralsController).toBeInstanceOf(ReferralsController);
    });

    it('should resolve ReferralsService with the overridden provider', () => {
      expect(referralsService).toBeDefined();
      expect(referralsService).toBe(mockReferralsService);
    });

    it('should allow ReferralsController to interact with the mocked ReferralsService', async () => {
      const mockConfig = { id: 'cfg-1', active: true };
      mockReferralsService.getConfig.mockResolvedValueOnce(mockConfig);

      const result = await referralsController.getConfig();

      expect(result).toBe(mockConfig);
      expect(mockReferralsService.getConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('Module compilation with mocked PrismaService provider', () => {
    let moduleRef: TestingModule;

    const mockPrismaService = {
      referralConfig: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      referral: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      coupon: {
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
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
        imports: [MockPrismaModule, ReferralsModule],
      }).compile();
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should resolve real ReferralsService and ReferralsController with mocked PrismaService', () => {
      const module = moduleRef.get<ReferralsModule>(ReferralsModule);
      const service = moduleRef.get<ReferralsService>(ReferralsService);
      const controller =
        moduleRef.get<ReferralsController>(ReferralsController);

      expect(module).toBeDefined();
      expect(module).toBeInstanceOf(ReferralsModule);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ReferralsService);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(ReferralsController);
    });
  });

  describe('Direct instantiation', () => {
    it('can be instantiated directly as a class instance', () => {
      const moduleInstance = new ReferralsModule();
      expect(moduleInstance).toBeDefined();
      expect(moduleInstance).toBeInstanceOf(ReferralsModule);
    });
  });

  describe('Module metadata decoration', () => {
    it('should register controllers, providers, and exports metadata', () => {
      const controllers = Reflect.getMetadata('controllers', ReferralsModule);
      const providers = Reflect.getMetadata('providers', ReferralsModule);
      const exportsList = Reflect.getMetadata('exports', ReferralsModule);

      expect(controllers).toEqual([ReferralsController]);
      expect(providers).toEqual([ReferralsService]);
      expect(exportsList).toEqual([ReferralsService]);
    });
  });
});
