import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { StockAdjustmentDto } from './dtos/stock-adjustment.dto';
import { LowStockQueryDto } from './dtos/low-stock-query.dto';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

describe('InventoryController', () => {
  let controller: InventoryController;

  const mockInventoryService = {
    adjustStock: jest.fn(),
    getStockHistory: jest.fn(),
    getLowStockVariants: jest.fn(),
    getAllStockLevels: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('adjustStock', () => {
    const userId = 'admin-user-1';
    const adjustmentDto: StockAdjustmentDto = {
      variantId: 'var-1',
      type: StockMovementType.IN,
      quantity: 15,
      notes: 'Weekly restocking',
    };

    it('should adjust stock and return the created movement and variant', async () => {
      const mockResult = {
        id: 'mov-1',
        variantId: 'var-1',
        type: StockMovementType.IN,
        quantity: 15,
        previousStock: 10,
        newStock: 25,
        notes: 'Weekly restocking',
        createdAt: new Date(),
        variant: {
          id: 'var-1',
          stock: 25,
        },
      };

      mockInventoryService.adjustStock.mockResolvedValue(mockResult);

      const result = await controller.adjustStock(adjustmentDto, userId);

      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        adjustmentDto,
        userId,
      );
      expect(result).toEqual(mockResult);
    });

    it('should propagate BadRequestException when validation fails in service', async () => {
      mockInventoryService.adjustStock.mockRejectedValue(
        new BadRequestException(
          'Quantity must be greater than zero for stock in/out',
        ),
      );

      await expect(
        controller.adjustStock(adjustmentDto, userId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.adjustStock(adjustmentDto, userId),
      ).rejects.toThrow('Quantity must be greater than zero for stock in/out');

      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        adjustmentDto,
        userId,
      );
    });

    it('should propagate NotFoundException when variant is not found', async () => {
      mockInventoryService.adjustStock.mockRejectedValue(
        new NotFoundException('Product variant not found'),
      );

      await expect(
        controller.adjustStock(adjustmentDto, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.adjustStock(adjustmentDto, userId),
      ).rejects.toThrow('Product variant not found');

      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        adjustmentDto,
        userId,
      );
    });
  });

  describe('getStockHistory', () => {
    const variantId = 'var-1';
    const paginationDto: PaginationDto = {
      page: 1,
      limit: 20,
    };

    it('should return stock history for a variant', async () => {
      const mockHistory = {
        data: [
          {
            id: 'mov-1',
            variantId,
            type: StockMovementType.IN,
            quantity: 10,
            previousStock: 5,
            newStock: 15,
            notes: 'Restock',
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        variant: {
          id: variantId,
          sku: 'SKU-001',
          scent: 'Lavender',
          volumeMl: 100,
          currentStock: 15,
          product: {
            id: 'prod-1',
            name: 'Lavender Mist',
            slug: 'lavender-mist',
          },
        },
      };

      mockInventoryService.getStockHistory.mockResolvedValue(mockHistory);

      const result = await controller.getStockHistory(variantId, paginationDto);

      expect(mockInventoryService.getStockHistory).toHaveBeenCalledWith(
        variantId,
        paginationDto,
      );
      expect(result).toEqual(mockHistory);
    });

    it('should propagate NotFoundException when variant does not exist', async () => {
      mockInventoryService.getStockHistory.mockRejectedValue(
        new NotFoundException('Product variant not found'),
      );

      await expect(
        controller.getStockHistory(variantId, paginationDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.getStockHistory(variantId, paginationDto),
      ).rejects.toThrow('Product variant not found');

      expect(mockInventoryService.getStockHistory).toHaveBeenCalledWith(
        variantId,
        paginationDto,
      );
    });
  });

  describe('getLowStockVariants', () => {
    const mockVariants = [
      {
        id: 'var-1',
        sku: 'SKU-LOW-1',
        scent: 'Citrus',
        volumeMl: 50,
        stock: 2,
        price: 120000,
        salePrice: null,
        product: {
          id: 'prod-1',
          name: 'Citrus Fresh',
          slug: 'citrus-fresh',
          active: true,
        },
      },
    ];

    it('should call getLowStockVariants with custom threshold and limit', async () => {
      const query: LowStockQueryDto = {
        threshold: 5,
        limit: 25,
      };

      mockInventoryService.getLowStockVariants.mockResolvedValue(mockVariants);

      const result = await controller.getLowStockVariants(query);

      expect(mockInventoryService.getLowStockVariants).toHaveBeenCalledWith(
        5,
        25,
      );
      expect(result).toEqual(mockVariants);
    });

    it('should call getLowStockVariants with defaults when query has undefined threshold and limit', async () => {
      const query: LowStockQueryDto = {};

      mockInventoryService.getLowStockVariants.mockResolvedValue(mockVariants);

      const result = await controller.getLowStockVariants(query);

      expect(mockInventoryService.getLowStockVariants).toHaveBeenCalledWith(
        10,
        100,
      );
      expect(result).toEqual(mockVariants);
    });

    it('should call getLowStockVariants with defaults when called without arguments', async () => {
      mockInventoryService.getLowStockVariants.mockResolvedValue(mockVariants);

      const result = await controller.getLowStockVariants();

      expect(mockInventoryService.getLowStockVariants).toHaveBeenCalledWith(
        10,
        100,
      );
      expect(result).toEqual(mockVariants);
    });

    it('should call getLowStockVariants with 0 threshold when threshold is explicitly 0', async () => {
      const query: LowStockQueryDto = {
        threshold: 0,
        limit: 50,
      };

      mockInventoryService.getLowStockVariants.mockResolvedValue([]);

      const result = await controller.getLowStockVariants(query);

      expect(mockInventoryService.getLowStockVariants).toHaveBeenCalledWith(
        0,
        50,
      );
      expect(result).toEqual([]);
    });

    it('should call getLowStockVariants with defaults when query is explicitly undefined', async () => {
      mockInventoryService.getLowStockVariants.mockResolvedValue(mockVariants);

      const result = await controller.getLowStockVariants(undefined);

      expect(mockInventoryService.getLowStockVariants).toHaveBeenCalledWith(
        10,
        100,
      );
      expect(result).toEqual(mockVariants);
    });

    it('should propagate dependency failure when service throws an error', async () => {
      const dbError = new Error('Database connection failed');
      mockInventoryService.getLowStockVariants.mockRejectedValue(dbError);

      await expect(controller.getLowStockVariants()).rejects.toThrow(dbError);
      expect(mockInventoryService.getLowStockVariants).toHaveBeenCalledWith(
        10,
        100,
      );
    });
  });

  describe('getAllStockLevels', () => {
    const paginationDto: PaginationDto = {
      page: 2,
      limit: 15,
    };

    it('should return all stock levels with pagination', async () => {
      const mockStockLevels = {
        data: [
          {
            id: 'var-1',
            sku: 'SKU-001',
            scent: 'Amber',
            volumeMl: 100,
            stock: 30,
            price: 180000,
            salePrice: 150000,
            product: {
              id: 'prod-1',
              name: 'Amber Glow',
              slug: 'amber-glow',
              active: true,
              categoryId: 'cat-1',
            },
          },
        ],
        total: 1,
        page: 2,
        limit: 15,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: true,
      };

      mockInventoryService.getAllStockLevels.mockResolvedValue(mockStockLevels);

      const result = await controller.getAllStockLevels(paginationDto);

      expect(mockInventoryService.getAllStockLevels).toHaveBeenCalledWith(
        paginationDto,
      );
      expect(result).toEqual(mockStockLevels);
    });

    it('should propagate error when service fails', async () => {
      const error = new Error('Service failure');
      mockInventoryService.getAllStockLevels.mockRejectedValue(error);

      await expect(controller.getAllStockLevels(paginationDto)).rejects.toThrow(
        error,
      );
      expect(mockInventoryService.getAllStockLevels).toHaveBeenCalledWith(
        paginationDto,
      );
    });
  });
});
