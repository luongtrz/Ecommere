import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminModule } from './admin.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('AdminModule', () => {
  let moduleRef: TestingModule;

  const mockPrismaService = {
    user: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
    order: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    product: { count: jest.fn() },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AdminModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('should compile the module successfully', () => {
    const adminModule = moduleRef.get<AdminModule>(AdminModule);
    expect(adminModule).toBeDefined();
    expect(adminModule).toBeInstanceOf(AdminModule);
  });

  describe('Providers resolution', () => {
    it('should resolve AdminService', () => {
      const adminService = moduleRef.get<AdminService>(AdminService);
      expect(adminService).toBeDefined();
      expect(adminService).toBeInstanceOf(AdminService);
    });

    it('should resolve ReportsService', () => {
      const reportsService = moduleRef.get<ReportsService>(ReportsService);
      expect(reportsService).toBeDefined();
      expect(reportsService).toBeInstanceOf(ReportsService);
    });

    it('should resolve CustomersService', () => {
      const customersService =
        moduleRef.get<CustomersService>(CustomersService);
      expect(customersService).toBeDefined();
      expect(customersService).toBeInstanceOf(CustomersService);
    });
  });

  describe('Controllers resolution', () => {
    it('should resolve AdminController', () => {
      const adminController = moduleRef.get<AdminController>(AdminController);
      expect(adminController).toBeDefined();
      expect(adminController).toBeInstanceOf(AdminController);
    });

    it('should resolve ReportsController', () => {
      const reportsController =
        moduleRef.get<ReportsController>(ReportsController);
      expect(reportsController).toBeDefined();
      expect(reportsController).toBeInstanceOf(ReportsController);
    });

    it('should resolve CustomersController', () => {
      const customersController =
        moduleRef.get<CustomersController>(CustomersController);
      expect(customersController).toBeDefined();
      expect(customersController).toBeInstanceOf(CustomersController);
    });
  });

  describe('Module metadata decoration', () => {
    it('should have PrismaModule in imports metadata', () => {
      const imports = Reflect.getMetadata('imports', AdminModule);
      expect(imports).toBeDefined();
      expect(imports).toContain(PrismaModule);
    });

    it('should have all controllers registered in metadata', () => {
      const controllers = Reflect.getMetadata('controllers', AdminModule);
      expect(controllers).toBeDefined();
      expect(controllers).toEqual([
        AdminController,
        ReportsController,
        CustomersController,
      ]);
    });

    it('should have all services registered in providers metadata', () => {
      const providers = Reflect.getMetadata('providers', AdminModule);
      expect(providers).toBeDefined();
      expect(providers).toEqual([
        AdminService,
        ReportsService,
        CustomersService,
      ]);
    });

    it('should have all services exported in exports metadata', () => {
      const exports = Reflect.getMetadata('exports', AdminModule);
      expect(exports).toBeDefined();
      expect(exports).toEqual([AdminService, ReportsService, CustomersService]);
    });
  });

  describe('Module exportability', () => {
    it('should allow exported providers to be consumed by an importing module', async () => {
      @Module({
        imports: [AdminModule],
      })
      class TestConsumerModule {}

      const hostModule = await Test.createTestingModule({
        imports: [TestConsumerModule],
      })
        .overrideProvider(PrismaService)
        .useValue(mockPrismaService)
        .compile();

      expect(hostModule.get<AdminService>(AdminService)).toBeDefined();
      expect(hostModule.get<ReportsService>(ReportsService)).toBeDefined();
      expect(hostModule.get<CustomersService>(CustomersService)).toBeDefined();

      await hostModule.close();
    });
  });
});
