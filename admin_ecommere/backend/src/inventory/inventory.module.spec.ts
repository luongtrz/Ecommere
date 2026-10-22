import { Test, TestingModule } from '@nestjs/testing';
import { InventoryModule } from './inventory.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaModule } from '@/prisma/prisma.module';

describe('InventoryModule', () => {
  it('should compile the module with overridden providers without real connections', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [InventoryModule],
    })
      .overrideProvider(InventoryService)
      .useValue({})
      .compile();

    expect(module).toBeDefined();
    expect(module.get<InventoryController>(InventoryController)).toBeDefined();
    expect(module.get<InventoryService>(InventoryService)).toBeDefined();
  });

  it('should resolve and instantiate InventoryController and InventoryService with mocked PrismaService', async () => {
    const mockPrismaService = {};

    const module: TestingModule = await Test.createTestingModule({
      imports: [InventoryModule, PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    expect(module).toBeDefined();
    const controller = module.get<InventoryController>(InventoryController);
    const service = module.get<InventoryService>(InventoryService);

    expect(controller).toBeInstanceOf(InventoryController);
    expect(service).toBeInstanceOf(InventoryService);
  });
});
