import { Test, TestingModule } from '@nestjs/testing';
import { Global, Module } from '@nestjs/common';
import { OrdersModule } from './orders.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('OrdersModule', () => {
  describe('Module compilation with overridden provider', () => {
    let moduleRef: TestingModule;
    let ordersModule: OrdersModule;
    let ordersController: OrdersController;
    let ordersService: OrdersService;

    const mockOrdersService = {
      getAllOrders: jest.fn(),
      getOrderById: jest.fn(),
      updateOrderStatus: jest.fn(),
      checkout: jest.fn(),
      getMyOrders: jest.fn(),
      getMyOrderById: jest.fn(),
      cancelOrder: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [OrdersModule],
      })
        .overrideProvider(OrdersService)
        .useValue(mockOrdersService)
        .compile();

      ordersModule = moduleRef.get<OrdersModule>(OrdersModule);
      ordersController = moduleRef.get<OrdersController>(OrdersController);
      ordersService = moduleRef.get<OrdersService>(OrdersService);
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should be defined', () => {
      expect(ordersModule).toBeDefined();
      expect(ordersModule).toBeInstanceOf(OrdersModule);
    });

    it('should resolve OrdersController', () => {
      expect(ordersController).toBeDefined();
      expect(ordersController).toBeInstanceOf(OrdersController);
    });

    it('should resolve OrdersService with the overridden provider', () => {
      expect(ordersService).toBeDefined();
      expect(ordersService).toBe(mockOrdersService);
    });

    it('should allow OrdersController to interact with the mocked OrdersService', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockOrdersService.getAllOrders.mockResolvedValueOnce(mockResult);

      const result = await ordersController.getAllOrders({});

      expect(result).toBe(mockResult);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledTimes(1);
    });
  });

  describe('Module compilation with mocked PrismaService provider', () => {
    let moduleRef: TestingModule;

    const mockPrismaService = {
      cart: { findUnique: jest.fn(), update: jest.fn() },
      cartItem: { deleteMany: jest.fn() },
      address: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      productVariant: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      coupon: {
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      stockMovement: { create: jest.fn() },
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

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [MockPrismaModule, OrdersModule],
      }).compile();
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should resolve real OrdersService and OrdersController with mocked PrismaService', () => {
      const module = moduleRef.get<OrdersModule>(OrdersModule);
      const service = moduleRef.get<OrdersService>(OrdersService);
      const controller = moduleRef.get<OrdersController>(OrdersController);

      expect(module).toBeDefined();
      expect(module).toBeInstanceOf(OrdersModule);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(OrdersService);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(OrdersController);
    });
  });

  describe('Direct instantiation', () => {
    it('can be instantiated directly as a class instance', () => {
      const moduleInstance = new OrdersModule();
      expect(moduleInstance).toBeDefined();
      expect(moduleInstance).toBeInstanceOf(OrdersModule);
    });
  });

  describe('Module metadata decoration', () => {
    it('should register controllers, providers, and exports metadata', () => {
      const controllers = Reflect.getMetadata('controllers', OrdersModule);
      const providers = Reflect.getMetadata('providers', OrdersModule);
      const exportsList = Reflect.getMetadata('exports', OrdersModule);

      expect(controllers).toEqual([OrdersController]);
      expect(providers).toEqual([OrdersService]);
      expect(exportsList).toEqual([OrdersService]);
    });
  });
});
