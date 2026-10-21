import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { PrismaService } from '@/prisma/prisma.service';
import { StockAdjustmentDto } from './dtos/stock-adjustment.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockPrismaService = {
    productVariant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.productVariant.findUnique.mockReset();
    mockPrismaService.productVariant.findMany.mockReset();
    mockPrismaService.productVariant.update.mockReset();
    mockPrismaService.productVariant.updateMany.mockReset();
    mockPrismaService.productVariant.count.mockReset();
    mockPrismaService.stockMovement.create.mockReset();
    mockPrismaService.stockMovement.findMany.mockReset();
    mockPrismaService.stockMovement.count.mockReset();
    mockPrismaService.$transaction.mockReset();

    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('adjustStock', () => {
    const userId = 'admin-user-1';

    it('should throw BadRequestException when type is IN and quantity is less than 1', async () => {
      const dto: StockAdjustmentDto = {
        variantId: 'var-1',
        type: StockMovementType.IN,
        quantity: 0,
        notes: 'Restock invalid',
      };

      await expect(service.adjustStock(dto, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.adjustStock(dto, userId)).rejects.toThrow(
        'Quantity must be greater than zero for stock in/out',
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when type is OUT and quantity is less than 1', async () => {
      const dto: StockAdjustmentDto = {
        variantId: 'var-1',
        type: StockMovementType.OUT,
        quantity: -2,
        notes: 'Out invalid',
      };

      await expect(service.adjustStock(dto, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.adjustStock(dto, userId)).rejects.toThrow(
        'Quantity must be greater than zero for stock in/out',
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when product variant does not exist', async () => {
      const dto: StockAdjustmentDto = {
        variantId: 'var-nonexistent',
        type: StockMovementType.IN,
        quantity: 5,
        notes: 'Restock missing',
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.adjustStock(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.adjustStock(dto, userId)).rejects.toThrow(
        'Product variant not found',
      );
      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var-nonexistent' },
      });
      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
    });

    it('should successfully perform stock IN movement and update variant stock', async () => {
      const dto: StockAdjustmentDto = {
        variantId: 'var-1',
        type: StockMovementType.IN,
        quantity: 10,
        notes: 'Supplier shipment',
      };

      const existingVariant = {
        id: 'var-1',
        stock: 20,
      };

      const updatedVariant = {
        id: 'var-1',
        stock: 30,
      };

      const createdMovement = {
        id: 'mov-1',
        variantId: 'var-1',
        type: StockMovementType.IN,
        quantity: 10,
        previousStock: 20,
        newStock: 30,
        notes: 'Supplier shipment',
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockResolvedValue(updatedVariant);
      mockPrismaService.stockMovement.create.mockResolvedValue(createdMovement);

      const result = await service.adjustStock(dto, userId);

      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var-1' },
      });
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { stock: { increment: 10 } },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var-1',
          type: StockMovementType.IN,
          quantity: 10,
          previousStock: 20,
          newStock: 30,
          notes: 'Supplier shipment',
        },
      });
      expect(result).toEqual({
        ...createdMovement,
        variant: updatedVariant,
      });
    });

    it('should throw BadRequestException on stock OUT if stock is insufficient', async () => {
      const dto: StockAdjustmentDto = {
        variantId: 'var-1',
        type: StockMovementType.OUT,
        quantity: 50,
        notes: 'Large order removal',
      };

      const existingVariant = {
        id: 'var-1',
        stock: 15,
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.adjustStock(dto, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.adjustStock(dto, userId)).rejects.toThrow(
        'Insufficient stock for this operation',
      );
      expect(mockPrismaService.productVariant.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'var-1',
          stock: { gte: 50 },
        },
        data: { stock: { decrement: 50 } },
      });
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException on stock OUT if variant is missing after updateMany', async () => {
      const dto: StockAdjustmentDto = {
        variantId: 'var-1',
        type: StockMovementType.OUT,
        quantity: 5,
        notes: 'Damaged item',
      };

      const existingVariant = {
        id: 'var-1',
        stock: 10,
      };

      mockPrismaService.productVariant.findUnique
        .mockResolvedValueOnce(existingVariant)
        .mockResolvedValueOnce(null);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });

      const promise = service.adjustStock(dto, userId);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Product variant not found');
      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledTimes(
        2,
      );
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });

    it('should successfully perform stock OUT movement when sufficient stock exists', async () => {
      const dto: StockAdjustmentDto = {
        variantId: 'var-1',
        type: StockMovementType.OUT,
        quantity: 4,
        notes: 'Damaged disposal',
      };

      const initialVariant = {
        id: 'var-1',
        stock: 10,
      };
      const afterUpdateVariant = {
        id: 'var-1',
        stock: 6,
      };
      const createdMovement = {
        id: 'mov-out-1',
        variantId: 'var-1',
        type: StockMovementType.OUT,
        quantity: 4,
        previousStock: 10,
        newStock: 6,
        notes: 'Damaged disposal',
        createdAt: new Date('2026-01-01T11:00:00.000Z'),
      };

      mockPrismaService.productVariant.findUnique
        .mockResolvedValueOnce(initialVariant)
        .mockResolvedValueOnce(afterUpdateVariant);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.stockMovement.create.mockResolvedValue(createdMovement);

      const result = await service.adjustStock(dto, userId);

      expect(mockPrismaService.productVariant.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'var-1',
          stock: { gte: 4 },
        },
        data: { stock: { decrement: 4 } },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var-1',
          type: StockMovementType.OUT,
          quantity: 4,
          previousStock: 10,
          newStock: 6,
          notes: 'Damaged disposal',
        },
      });
      expect(result).toEqual({
        ...createdMovement,
        variant: afterUpdateVariant,
      });
    });

    it('should successfully perform stock ADJUST movement to increase target stock', async () => {
      const dto: StockAdjustmentDto = {
        variantId: 'var-1',
        type: StockMovementType.ADJUST,
        quantity: 25,
        notes: 'Audit recount increase',
      };

      const existingVariant = {
        id: 'var-1',
        stock: 15,
      };
      const updatedVariant = {
        id: 'var-1',
        stock: 25,
      };
      const createdMovement = {
        id: 'mov-adj-1',
        variantId: 'var-1',
        type: StockMovementType.ADJUST,
        quantity: 10,
        previousStock: 15,
        newStock: 25,
        notes: 'Audit recount increase',
        createdAt: new Date('2026-01-01T12:00:00.000Z'),
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockResolvedValue(updatedVariant);
      mockPrismaService.stockMovement.create.mockResolvedValue(createdMovement);

      const result = await service.adjustStock(dto, userId);

      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { stock: 25 },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var-1',
          type: StockMovementType.ADJUST,
          quantity: 10,
          previousStock: 15,
          newStock: 25,
          notes: 'Audit recount increase',
        },
      });
      expect(result).toEqual({
        ...createdMovement,
        variant: updatedVariant,
      });
    });

    it('should successfully perform stock ADJUST movement to decrease target stock to zero', async () => {
      const dto: StockAdjustmentDto = {
        variantId: 'var-1',
        type: StockMovementType.ADJUST,
        quantity: 0,
        notes: 'Clear inventory to zero',
      };

      const existingVariant = {
        id: 'var-1',
        stock: 12,
      };
      const updatedVariant = {
        id: 'var-1',
        stock: 0,
      };
      const createdMovement = {
        id: 'mov-adj-2',
        variantId: 'var-1',
        type: StockMovementType.ADJUST,
        quantity: 12,
        previousStock: 12,
        newStock: 0,
        notes: 'Clear inventory to zero',
        createdAt: new Date('2026-01-01T13:00:00.000Z'),
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockResolvedValue(updatedVariant);
      mockPrismaService.stockMovement.create.mockResolvedValue(createdMovement);

      const result = await service.adjustStock(dto, userId);

      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var-1' },
        data: { stock: 0 },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'var-1',
          type: StockMovementType.ADJUST,
          quantity: 12,
          previousStock: 12,
          newStock: 0,
          notes: 'Clear inventory to zero',
        },
      });
      expect(result).toEqual({
        ...createdMovement,
        variant: updatedVariant,
      });
    });
  });

  describe('getStockHistory', () => {
    const variantId = 'var-1';
    const mockVariant = {
      id: 'var-1',
      sku: 'LAV-100',
      scent: 'Lavender',
      volumeMl: 100,
      stock: 40,
      product: {
        id: 'prod-1',
        name: 'Lavender Spray',
        slug: 'lavender-spray',
      },
    };

    it('should throw NotFoundException when variant does not exist', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.getStockHistory(variantId, {} as PaginationDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getStockHistory(variantId, {} as PaginationDto),
      ).rejects.toThrow('Product variant not found');

      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: variantId },
        include: { product: true },
      });
      expect(mockPrismaService.stockMovement.findMany).not.toHaveBeenCalled();
    });

    it('should return paginated history with default pagination parameters', async () => {
      const mockMovements = [
        {
          id: 'mov-1',
          variantId,
          type: StockMovementType.IN,
          quantity: 20,
          previousStock: 20,
          newStock: 40,
          notes: 'Restock',
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
        },
      ];

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );
      mockPrismaService.stockMovement.findMany.mockResolvedValue(mockMovements);
      mockPrismaService.stockMovement.count.mockResolvedValue(35);

      const result = await service.getStockHistory(variantId, {});

      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: variantId },
        include: { product: true },
      });
      expect(mockPrismaService.stockMovement.findMany).toHaveBeenCalledWith({
        where: { variantId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(mockPrismaService.stockMovement.count).toHaveBeenCalledWith({
        where: { variantId },
      });

      expect(result).toEqual({
        data: mockMovements,
        total: 35,
        page: 1,
        limit: 20,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
        variant: {
          id: 'var-1',
          sku: 'LAV-100',
          scent: 'Lavender',
          volumeMl: 100,
          currentStock: 40,
          product: {
            id: 'prod-1',
            name: 'Lavender Spray',
            slug: 'lavender-spray',
          },
        },
      });
    });

    it('should return paginated history with custom page and limit on last page', async () => {
      const paginationDto: PaginationDto = {
        page: 3,
        limit: 10,
      };

      const mockMovements = [
        {
          id: 'mov-2',
          variantId,
          type: StockMovementType.OUT,
          quantity: 5,
          previousStock: 45,
          newStock: 40,
          notes: 'Sale',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ];

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );
      mockPrismaService.stockMovement.findMany.mockResolvedValue(mockMovements);
      mockPrismaService.stockMovement.count.mockResolvedValue(25);

      const result = await service.getStockHistory(variantId, paginationDto);

      expect(mockPrismaService.stockMovement.findMany).toHaveBeenCalledWith({
        where: { variantId },
        orderBy: { createdAt: 'desc' },
        skip: 20,
        take: 10,
      });
      expect(mockPrismaService.stockMovement.count).toHaveBeenCalledWith({
        where: { variantId },
      });

      expect(result).toEqual({
        data: mockMovements,
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
        variant: {
          id: 'var-1',
          sku: 'LAV-100',
          scent: 'Lavender',
          volumeMl: 100,
          currentStock: 40,
          product: {
            id: 'prod-1',
            name: 'Lavender Spray',
            slug: 'lavender-spray',
          },
        },
      });
    });
  });

  describe('getLowStockVariants', () => {
    const mockVariants = [
      {
        id: 'var-1',
        sku: 'LAV-100',
        scent: 'Lavender',
        volumeMl: 100,
        stock: 3,
        price: 150000,
        salePrice: 120000,
        product: {
          id: 'prod-1',
          name: 'Lavender Spray',
          slug: 'lavender-spray',
          active: true,
        },
      },
      {
        id: 'var-2',
        sku: 'ROS-200',
        scent: 'Rose',
        volumeMl: 200,
        stock: 7,
        price: 200000,
        salePrice: null,
        product: {
          id: 'prod-2',
          name: 'Rose Spray',
          slug: 'rose-spray',
          active: true,
        },
      },
    ];

    it('should query low stock variants with default threshold (10) and limit (100)', async () => {
      mockPrismaService.productVariant.findMany.mockResolvedValue(mockVariants);

      const result = await service.getLowStockVariants();

      expect(mockPrismaService.productVariant.findMany).toHaveBeenCalledWith({
        where: {
          stock: { lte: 10 },
          product: { active: true },
        },
        take: 100,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
            },
          },
        },
        orderBy: { stock: 'asc' },
      });

      expect(result).toEqual([
        {
          id: 'var-1',
          sku: 'LAV-100',
          scent: 'Lavender',
          volumeMl: 100,
          stock: 3,
          price: 150000,
          salePrice: 120000,
          product: mockVariants[0].product,
        },
        {
          id: 'var-2',
          sku: 'ROS-200',
          scent: 'Rose',
          volumeMl: 200,
          stock: 7,
          price: 200000,
          salePrice: null,
          product: mockVariants[1].product,
        },
      ]);
    });

    it('should query low stock variants with custom threshold and limit', async () => {
      mockPrismaService.productVariant.findMany.mockResolvedValue([
        mockVariants[0],
      ]);

      const result = await service.getLowStockVariants(5, 20);

      expect(mockPrismaService.productVariant.findMany).toHaveBeenCalledWith({
        where: {
          stock: { lte: 5 },
          product: { active: true },
        },
        take: 20,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
            },
          },
        },
        orderBy: { stock: 'asc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('var-1');
    });
  });

  describe('getAllStockLevels', () => {
    const mockVariants = [
      {
        id: 'var-1',
        sku: 'LAV-100',
        scent: 'Lavender',
        volumeMl: 100,
        stock: 50,
        price: 150000,
        salePrice: null,
        product: {
          id: 'prod-1',
          name: 'Lavender Spray',
          slug: 'lavender-spray',
          active: true,
          categoryId: 'cat-1',
        },
      },
    ];

    it('should return all stock levels with default pagination (page=1, limit=50)', async () => {
      mockPrismaService.productVariant.findMany.mockResolvedValue(mockVariants);
      mockPrismaService.productVariant.count.mockResolvedValue(90);

      const result = await service.getAllStockLevels({});

      expect(mockPrismaService.productVariant.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 50,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
              categoryId: true,
            },
          },
        },
        orderBy: [{ product: { name: 'asc' } }, { scent: 'asc' }],
      });
      expect(mockPrismaService.productVariant.count).toHaveBeenCalled();

      expect(result).toEqual({
        data: [
          {
            id: 'var-1',
            sku: 'LAV-100',
            scent: 'Lavender',
            volumeMl: 100,
            stock: 50,
            price: 150000,
            salePrice: null,
            product: mockVariants[0].product,
          },
        ],
        total: 90,
        page: 1,
        limit: 50,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should return all stock levels with custom pagination on page 2', async () => {
      mockPrismaService.productVariant.findMany.mockResolvedValue(mockVariants);
      mockPrismaService.productVariant.count.mockResolvedValue(20);

      const result = await service.getAllStockLevels({ page: 2, limit: 10 });

      expect(mockPrismaService.productVariant.findMany).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              active: true,
              categoryId: true,
            },
          },
        },
        orderBy: [{ product: { name: 'asc' } }, { scent: 'asc' }],
      });

      expect(result).toEqual({
        data: [
          {
            id: 'var-1',
            sku: 'LAV-100',
            scent: 'Lavender',
            volumeMl: 100,
            stock: 50,
            price: 150000,
            salePrice: null,
            product: mockVariants[0].product,
          },
        ],
        total: 20,
        page: 2,
        limit: 10,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });
  });

  describe('reserveStock', () => {
    const variantId = 'var-1';
    const orderId = 'order-123';
    const quantity = 3;

    it('should throw NotFoundException when variant does not exist', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      const promise = service.reserveStock(variantId, quantity, orderId);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Product variant not found');

      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: variantId },
      });
      expect(
        mockPrismaService.productVariant.updateMany,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when insufficient stock is available', async () => {
      const existingVariant = {
        id: variantId,
        sku: 'LAV-100',
        stock: 2,
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(
        service.reserveStock(variantId, quantity, orderId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.reserveStock(variantId, quantity, orderId),
      ).rejects.toThrow('Insufficient stock for variant LAV-100');

      expect(mockPrismaService.productVariant.updateMany).toHaveBeenCalledWith({
        where: {
          id: variantId,
          stock: { gte: quantity },
        },
        data: { stock: { decrement: quantity } },
      });
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when variant disappears after updating stock', async () => {
      const existingVariant = {
        id: variantId,
        sku: 'LAV-100',
        stock: 10,
      };

      mockPrismaService.productVariant.findUnique
        .mockResolvedValueOnce(existingVariant)
        .mockResolvedValueOnce(null);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });

      const promise = service.reserveStock(variantId, quantity, orderId);
      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('Product variant not found');

      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledTimes(
        2,
      );
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });

    it('should successfully decrement stock and create stock movement for reservation', async () => {
      const initialVariant = {
        id: variantId,
        sku: 'LAV-100',
        stock: 10,
      };
      const updatedVariant = {
        id: variantId,
        sku: 'LAV-100',
        stock: 7,
      };

      mockPrismaService.productVariant.findUnique
        .mockResolvedValueOnce(initialVariant)
        .mockResolvedValueOnce(updatedVariant);
      mockPrismaService.productVariant.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.stockMovement.create.mockResolvedValue({
        id: 'mov-res-1',
      });

      const result = await service.reserveStock(variantId, quantity, orderId);

      expect(mockPrismaService.productVariant.updateMany).toHaveBeenCalledWith({
        where: {
          id: variantId,
          stock: { gte: quantity },
        },
        data: { stock: { decrement: quantity } },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId,
          type: StockMovementType.OUT,
          quantity: 3,
          previousStock: 10,
          newStock: 7,
          notes: 'Reserved for order order-123',
        },
      });
      expect(result).toEqual(updatedVariant);
    });
  });

  describe('restoreStock', () => {
    const variantId = 'var-1';
    const orderId = 'order-123';
    const quantity = 4;
    const reason = 'Order cancelled';

    it('should throw NotFoundException when variant does not exist', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.restoreStock(variantId, quantity, orderId, reason),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.restoreStock(variantId, quantity, orderId, reason),
      ).rejects.toThrow('Product variant not found');

      expect(mockPrismaService.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: variantId },
      });
      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
    });

    it('should successfully increment stock and record stock movement when restoring stock', async () => {
      const existingVariant = {
        id: variantId,
        sku: 'LAV-100',
        stock: 6,
      };
      const updatedVariant = {
        id: variantId,
        sku: 'LAV-100',
        stock: 10,
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockResolvedValue(updatedVariant);
      mockPrismaService.stockMovement.create.mockResolvedValue({
        id: 'mov-rest-1',
      });

      const result = await service.restoreStock(
        variantId,
        quantity,
        orderId,
        reason,
      );

      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: variantId },
        data: { stock: { increment: quantity } },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId,
          type: StockMovementType.IN,
          quantity: 4,
          previousStock: 6,
          newStock: 10,
          notes: 'Order cancelled - Order order-123',
        },
      });
      expect(result).toEqual(updatedVariant);
    });
  });

  describe('runSerializableTransaction (retry mechanism)', () => {
    const dto: StockAdjustmentDto = {
      variantId: 'var-1',
      type: StockMovementType.IN,
      quantity: 5,
      notes: 'Retry test',
    };
    const userId = 'user-1';

    it('should retry transaction and succeed when P2034 conflict occurs on initial attempt', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError(
        'Transaction conflict',
        {
          code: 'P2034',
          clientVersion: '5.8.0',
        },
      );

      const existingVariant = { id: 'var-1', stock: 10 };
      const updatedVariant = { id: 'var-1', stock: 15 };
      const createdMovement = {
        id: 'mov-ret-1',
        variantId: 'var-1',
        type: StockMovementType.IN,
        quantity: 5,
        previousStock: 10,
        newStock: 15,
        notes: 'Retry test',
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockResolvedValue(updatedVariant);
      mockPrismaService.stockMovement.create.mockResolvedValue(createdMovement);

      mockPrismaService.$transaction
        .mockRejectedValueOnce(p2034Error)
        .mockImplementationOnce(async (callback) => {
          return callback(mockPrismaService);
        });

      const result = await service.adjustStock(dto, userId);

      expect(result).toEqual({
        ...createdMovement,
        variant: updatedVariant,
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.$transaction).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    });

    it('should retry up to 3 attempts and rethrow P2034 error if all attempts fail', async () => {
      const p2034Error = new Prisma.PrismaClientKnownRequestError(
        'Transaction conflict',
        {
          code: 'P2034',
          clientVersion: '5.8.0',
        },
      );

      mockPrismaService.$transaction.mockRejectedValue(p2034Error);

      await expect(service.adjustStock(dto, userId)).rejects.toThrow(
        p2034Error,
      );
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(3);
    });

    it('should immediately rethrow non-P2034 error without retrying', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaService.$transaction.mockRejectedValue(dbError);

      await expect(service.adjustStock(dto, userId)).rejects.toThrow(dbError);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});
