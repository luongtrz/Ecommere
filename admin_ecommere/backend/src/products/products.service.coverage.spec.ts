import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CategoriesService } from '@/categories/categories.service';
import { ProductSortBy } from './dtos/product-filter.dto';
import { CreateProductDto } from './dtos/create-product.dto';
import { CreateVariantDto } from './dtos/create-variant.dto';
import { UpdateVariantDto } from './dtos/update-variant.dto';

describe('ProductsService (Coverage companion)', () => {
  let service: ProductsService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
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
    $transaction: jest.fn(),
  };

  const mockCategoriesService = {
    validateProductAssignment: jest.fn(),
    getDescendantIds: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      if (typeof callback === 'function') {
        return callback(mockPrismaService);
      }
      return callback;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll - additional branches', () => {
    it('should include inactive products and calculate multi-page pagination correctly', async () => {
      const mockProduct = {
        id: 'p-inactive',
        name: 'Inactive Item',
        slug: 'inactive-item',
        active: false,
        _count: { reviews: 2 },
      };

      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(25);
      mockPrismaService.review.groupBy.mockResolvedValue([
        {
          productId: 'p-inactive',
          _avg: { rating: 4.6666 },
        },
      ]);

      const result = await service.findAll({ page: 2, limit: 10 }, true);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 10,
          take: 10,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
      expect(result.data[0].averageRating).toBe(4.67);
      expect(result.data[0].reviewCount).toBe(2);
    });

    it('should filter by categoryId with descendant ids when getDescendantIds returns descendants', async () => {
      mockCategoriesService.getDescendantIds.mockResolvedValue([
        'child-1',
        'child-2',
      ]);
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, categoryId: 'parent-cat' });

      expect(mockCategoriesService.getDescendantIds).toHaveBeenCalledWith(
        'parent-cat',
      );
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { in: ['child-1', 'child-2'] },
          }),
        }),
      );
    });

    it('should filter by categorySlug when category exists and has descendant ids', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-root',
        slug: 'root-slug',
      });
      mockCategoriesService.getDescendantIds.mockResolvedValue([
        'cat-sub-1',
        'cat-sub-2',
      ]);
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, categorySlug: 'root-slug' });

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'root-slug' },
      });
      expect(mockCategoriesService.getDescendantIds).toHaveBeenCalledWith(
        'cat-root',
      );
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { in: ['cat-sub-1', 'cat-sub-2'] },
          }),
        }),
      );
    });

    it('should filter by categorySlug when category exists without descendant ids', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-leaf',
        slug: 'leaf-slug',
      });
      mockCategoriesService.getDescendantIds.mockResolvedValue([]);
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, categorySlug: 'leaf-slug' });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat-leaf',
          }),
        }),
      );
    });

    it('should return empty result without querying products when categorySlug is not found', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      const result = await service.findAll({
        page: 2,
        limit: 10,
        categorySlug: 'non-existent',
      });

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
    });

    it('should filter by minPrice only', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, minPrice: 50000 });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            variants: {
              some: {
                AND: [
                  {
                    OR: [
                      { salePrice: { gte: 50000 } },
                      { salePrice: null, price: { gte: 50000 } },
                    ],
                  },
                ],
              },
            },
          }),
        }),
      );
    });

    it('should filter by maxPrice only', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, maxPrice: 150000 });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            variants: {
              some: {
                AND: [
                  {
                    OR: [
                      { salePrice: { lte: 150000 } },
                      { salePrice: null, price: { lte: 150000 } },
                    ],
                  },
                ],
              },
            },
          }),
        }),
      );
    });

    it('should filter by both minPrice and maxPrice together', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 10,
        minPrice: 50000,
        maxPrice: 150000,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            variants: {
              some: {
                AND: [
                  {
                    OR: [
                      { salePrice: { gte: 50000 } },
                      { salePrice: null, price: { gte: 50000 } },
                    ],
                  },
                  {
                    OR: [
                      { salePrice: { lte: 150000 } },
                      { salePrice: null, price: { lte: 150000 } },
                    ],
                  },
                ],
              },
            },
          }),
        }),
      );
    });

    it('should order by oldest when sortBy is OLDEST', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ sortBy: ProductSortBy.OLDEST });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should order by price descending when sortBy is PRICE_DESC', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ sortBy: ProductSortBy.PRICE_DESC });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { basePrice: 'desc' },
        }),
      );
    });

    it('should order by name ascending when sortBy is NAME_ASC', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ sortBy: ProductSortBy.NAME_ASC });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should order by name descending when sortBy is NAME_DESC', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ sortBy: ProductSortBy.NAME_DESC });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        }),
      );
    });

    it('should execute BEST_SELLING query with includeInactive=true, search, categoryId array, minPrice, and maxPrice', async () => {
      mockCategoriesService.getDescendantIds.mockResolvedValue([
        'cat-1',
        'cat-2',
      ]);
      mockPrismaService.$queryRaw.mockResolvedValue([
        { id: 'p2' },
        { id: 'p1' },
      ]);
      mockPrismaService.product.count.mockResolvedValue(2);

      const prod1 = { id: 'p1', name: 'Product 1', _count: { reviews: 0 } };
      const prod2 = { id: 'p2', name: 'Product 2', _count: { reviews: 1 } };
      mockPrismaService.product.findMany.mockResolvedValue([prod1, prod2]);
      mockPrismaService.review.groupBy.mockResolvedValue([
        { productId: 'p2', _avg: { rating: 5.0 } },
      ]);

      const result = await service.findAll(
        {
          sortBy: ProductSortBy.BEST_SELLING,
          search: 'aroma',
          categoryId: 'cat-parent',
          minPrice: 10000,
          maxPrice: 90000,
          page: 1,
          limit: 10,
        },
        true,
      );

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('p2');
      expect(result.data[1].id).toBe('p1');
      expect(result.data[0].averageRating).toBe(5.0);
      expect(result.data[1].averageRating).toBe(0);
    });

    it('should return empty data when ranked rows return 0 ids for BEST_SELLING', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      const result = await service.findAll({
        sortBy: ProductSortBy.BEST_SELLING,
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
      expect(mockPrismaService.review.groupBy).not.toHaveBeenCalled();
    });

    it('should execute RATING query with single categoryId string and default active constraint', async () => {
      mockCategoriesService.getDescendantIds.mockResolvedValue([]);
      mockPrismaService.$queryRaw.mockResolvedValue([{ id: 'p-rate-1' }]);
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: 'p-rate-1', name: 'Rated Prod', _count: { reviews: 0 } },
      ]);
      mockPrismaService.review.groupBy.mockResolvedValue([]);

      const result = await service.findAll({
        sortBy: ProductSortBy.RATING,
        categoryId: 'single-cat',
      });

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('p-rate-1');
    });
  });

  describe('findOne - additional branches', () => {
    it('should find inactive product when includeInactive is true', async () => {
      const mockProduct = {
        id: 'p-inact',
        active: false,
        name: 'Inactive',
      };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });

      const result = await service.findOne('p-inact', true);

      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p-inact' },
        }),
      );
      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });
  });

  describe('findBySlug', () => {
    it('should return a product by slug with review stats', async () => {
      const mockProduct = {
        id: 'p-slug-1',
        slug: 'lavender-spray',
        name: 'Lavender Spray',
        active: true,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.75 },
        _count: { rating: 12 },
      });

      const result = await service.findBySlug('lavender-spray');

      expect(result).toBeDefined();
      expect(result.id).toBe('p-slug-1');
      expect(result.averageRating).toBe(4.75);
      expect(result.reviewCount).toBe(12);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'lavender-spray', active: true },
        }),
      );
      expect(mockPrismaService.review.aggregate).toHaveBeenCalledWith({
        where: { productId: 'p-slug-1' },
        _avg: { rating: true },
        _count: { rating: true },
      });
    });

    it('should throw NotFoundException when product is not found by slug', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('create - additional branches', () => {
    it('should throw BadRequestException when salePrice exceeds price on any variant', async () => {
      const createDto: CreateProductDto = {
        name: 'Invalid Price Spray',
        description: 'Desc',
        brand: 'Brand',
        images: ['img.jpg'],
        categoryId: 'cat-1',
        basePrice: 100000,
        variants: [
          {
            scent: 'Rose',
            volumeMl: 100,
            price: 50000,
            salePrice: 70000,
            stock: 10,
          },
        ],
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Sale price cannot exceed the regular price',
      );
      expect(mockPrismaService.category.findUnique).not.toHaveBeenCalled();
    });

    it('should validate leaf category assignment during create', async () => {
      const createDto: CreateProductDto = {
        name: 'Leaf Valid Spray',
        description: 'Desc',
        brand: 'Brand',
        images: ['img.jpg'],
        categoryId: 'cat-leaf',
        basePrice: 100000,
        variants: [
          {
            scent: 'Mint',
            volumeMl: 100,
            price: 50000,
            salePrice: 40000,
            stock: 0,
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-leaf',
      });
      mockCategoriesService.validateProductAssignment.mockResolvedValue(
        undefined,
      );
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({
        id: 'p-leaf',
        variants: [],
      });

      await service.create(createDto);

      expect(
        mockCategoriesService.validateProductAssignment,
      ).toHaveBeenCalledWith('cat-leaf');
    });

    it('should catch Prisma P2002 error in transaction and throw BadRequestException', async () => {
      const createDto: CreateProductDto = {
        name: 'Duplicate SKU Product',
        description: 'Desc',
        brand: 'Brand',
        images: ['img.jpg'],
        categoryId: 'cat-1',
        basePrice: 100000,
        variants: [
          {
            scent: 'Rose',
            volumeMl: 100,
            price: 50000,
            stock: 10,
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockCategoriesService.validateProductAssignment.mockResolvedValue(
        undefined,
      );
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.product.create.mockRejectedValue(p2002Error);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Product name or variant SKU already exists',
      );
    });

    it('should rethrow non-P2002 error in create', async () => {
      const createDto: CreateProductDto = {
        name: 'Error Product',
        description: 'Desc',
        brand: 'Brand',
        images: ['img.jpg'],
        categoryId: 'cat-1',
        basePrice: 100000,
        variants: [],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockCategoriesService.validateProductAssignment.mockResolvedValue(
        undefined,
      );
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockRejectedValue(
        new Error('Connection failure'),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        'Connection failure',
      );
    });
  });

  describe('update - additional branches', () => {
    it('should throw BadRequestException when updated categoryId is not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Existing',
      });
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('p-1', { categoryId: 'invalid-category' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('p-1', { categoryId: 'invalid-category' }),
      ).rejects.toThrow('Category not found');
    });

    it('should validate leaf category assignment when updating categoryId', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Existing',
      });
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-new',
      });
      mockCategoriesService.validateProductAssignment.mockResolvedValue(
        undefined,
      );
      mockPrismaService.product.update.mockResolvedValue({ id: 'p-1' });

      await service.update('p-1', { categoryId: 'cat-new' });

      expect(
        mockCategoriesService.validateProductAssignment,
      ).toHaveBeenCalledWith('cat-new');
    });

    it('should not regenerate slug when updated name is identical to existing name', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Same Name',
        slug: 'same-name',
      });
      mockPrismaService.product.update.mockResolvedValue({ id: 'p-1' });

      await service.update('p-1', { name: 'Same Name', basePrice: 200000 });

      expect(mockPrismaService.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p-1' },
          data: { name: 'Same Name', basePrice: 200000 },
        }),
      );
    });

    it('should catch Prisma P2002 error in update and throw BadRequestException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Old Name',
      });

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.product.update.mockRejectedValue(p2002Error);

      await expect(
        service.update('p-1', { name: 'Existing Conflict Name' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('p-1', { name: 'Existing Conflict Name' }),
      ).rejects.toThrow('Product name already exists');
    });

    it('should rethrow non-P2002 error in update', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Old Name',
      });
      mockPrismaService.product.update.mockRejectedValue(
        new Error('DB read error'),
      );

      await expect(
        service.update('p-1', { basePrice: 300000 }),
      ).rejects.toThrow('DB read error');
    });
  });

  describe('remove - additional branches', () => {
    it('should throw NotFoundException when product to delete is not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('unknown-prod')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('unknown-prod')).rejects.toThrow(
        'Product not found',
      );
    });

    it('should throw BadRequestException when product variant has orderItems', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p-orders',
        variants: [
          {
            id: 'v1',
            cartItems: [],
            orderItems: [{ id: 'order-item-1' }],
            stockMovements: [],
          },
        ],
      });

      await expect(service.remove('p-orders')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('p-orders')).rejects.toThrow(
        'Cannot delete product with existing carts, orders, or stock history',
      );
    });

    it('should throw BadRequestException when product variant has stockMovements', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p-stock',
        variants: [
          {
            id: 'v1',
            cartItems: [],
            orderItems: [],
            stockMovements: [{ id: 'sm-1' }],
          },
        ],
      });

      await expect(service.remove('p-stock')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('p-stock')).rejects.toThrow(
        'Cannot delete product with existing carts, orders, or stock history',
      );
    });

    it('should delete product when variants is undefined or empty', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p-no-variants',
        variants: undefined,
      });
      mockPrismaService.product.delete.mockResolvedValue({
        id: 'p-no-variants',
      });

      const result = await service.remove('p-no-variants');

      expect(result).toEqual({ message: 'Product deleted successfully' });
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: 'p-no-variants' },
      });
    });
  });

  describe('createVariant', () => {
    it('should throw NotFoundException when product is not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      const dto: CreateVariantDto = {
        scent: 'Lavender',
        volumeMl: 100,
        price: 50000,
        stock: 10,
      };

      await expect(service.createVariant('missing-prod', dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createVariant('missing-prod', dto)).rejects.toThrow(
        'Product not found',
      );
    });

    it('should throw BadRequestException when variant salePrice exceeds price', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        slug: 'prod-1',
      });

      const dto: CreateVariantDto = {
        scent: 'Lavender',
        volumeMl: 100,
        price: 50000,
        salePrice: 80000,
        stock: 10,
      };

      await expect(service.createVariant('prod-1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createVariant('prod-1', dto)).rejects.toThrow(
        'Sale price cannot exceed the regular price',
      );
    });

    it('should create variant and stock movement when stock is positive', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        slug: 'essential-oil',
      });

      const dto: CreateVariantDto = {
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        salePrice: 80000,
        stock: 15,
        barcode: 'BC-123456',
      };

      const createdVariant = {
        id: 'v-new-1',
        productId: 'prod-1',
        sku: 'ESSENTIAL-OIL-LAV-250ML',
        ...dto,
      };

      mockPrismaService.productVariant.create.mockResolvedValue(createdVariant);
      mockPrismaService.stockMovement.create.mockResolvedValue({
        id: 'sm-new',
      });

      const result = await service.createVariant('prod-1', dto);

      expect(result).toEqual(createdVariant);
      expect(mockPrismaService.productVariant.create).toHaveBeenCalledWith({
        data: {
          productId: 'prod-1',
          sku: 'ESSENTIAL-OIL-LAV-250ML',
          scent: 'Lavender',
          volumeMl: 250,
          price: 100000,
          salePrice: 80000,
          stock: 15,
          barcode: 'BC-123456',
        },
      });
      expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: 'v-new-1',
          type: StockMovementType.IN,
          quantity: 15,
          previousStock: 0,
          newStock: 15,
        },
      });
    });

    it('should create variant without stock movement when initial stock is 0', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        slug: 'spray-bottle',
      });

      const dto: CreateVariantDto = {
        scent: 'Citrus',
        volumeMl: 50,
        price: 40000,
        stock: 0,
      };

      const createdVariant = {
        id: 'v-zero',
        productId: 'prod-1',
        sku: 'SPRAY-BOTTLE-CIT-50ML',
        ...dto,
      };

      mockPrismaService.productVariant.create.mockResolvedValue(createdVariant);

      const result = await service.createVariant('prod-1', dto);

      expect(result).toEqual(createdVariant);
      expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when variant SKU violates uniqueness (Prisma P2002)', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        slug: 'spray-bottle',
      });

      const dto: CreateVariantDto = {
        scent: 'Citrus',
        volumeMl: 50,
        price: 40000,
        stock: 5,
      };

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.productVariant.create.mockRejectedValue(p2002Error);

      await expect(service.createVariant('prod-1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createVariant('prod-1', dto)).rejects.toThrow(
        'Variant SKU already exists',
      );
    });

    it('should rethrow unexpected error during variant creation', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        slug: 'spray-bottle',
      });

      const dto: CreateVariantDto = {
        scent: 'Citrus',
        volumeMl: 50,
        price: 40000,
        stock: 5,
      };

      mockPrismaService.productVariant.create.mockRejectedValue(
        new Error('Tx rollback'),
      );

      await expect(service.createVariant('prod-1', dto)).rejects.toThrow(
        'Tx rollback',
      );
    });
  });

  describe('updateVariant', () => {
    it('should throw NotFoundException when variant to update does not exist', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.updateVariant('v-missing', { price: 60000 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateVariant('v-missing', { price: 60000 }),
      ).rejects.toThrow('Variant not found');
    });

    it('should throw BadRequestException when updated salePrice exceeds updated price', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'v-1',
        price: 50000,
        salePrice: 40000,
        product: { slug: 'room-diffuser' },
      });

      await expect(
        service.updateVariant('v-1', { price: 50000, salePrice: 70000 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateVariant('v-1', { price: 50000, salePrice: 70000 }),
      ).rejects.toThrow('Sale price cannot exceed the regular price');
    });

    it('should throw BadRequestException when updated salePrice exceeds existing variant price', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'v-1',
        price: 50000,
        salePrice: 40000,
        product: { slug: 'room-diffuser' },
      });

      await expect(
        service.updateVariant('v-1', { salePrice: 60000 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateVariant('v-1', { salePrice: 60000 }),
      ).rejects.toThrow('Sale price cannot exceed the regular price');
    });

    it('should update scent, volumeMl, recalculate SKU, and omit stock from update payload', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'v-1',
        scent: 'OldScent',
        volumeMl: 100,
        price: 50000,
        salePrice: 40000,
        product: { slug: 'diffuser' },
      });

      const updatedVariant = {
        id: 'v-1',
        sku: 'DIFFUSER-NEW-200ML',
        scent: 'NewScent',
        volumeMl: 200,
      };
      mockPrismaService.productVariant.update.mockResolvedValue(updatedVariant);

      const updateDto: UpdateVariantDto & { stock?: number } = {
        scent: 'NewScent',
        volumeMl: 200,
        stock: 999,
      };

      const result = await service.updateVariant('v-1', updateDto);

      expect(result).toEqual(updatedVariant);
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v-1' },
        data: {
          scent: 'NewScent',
          volumeMl: 200,
          sku: 'DIFFUSER-NEW-200ML',
        },
      });
    });

    it('should recalculate SKU using existing volumeMl when only scent is updated', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'v-1',
        scent: 'OldScent',
        volumeMl: 150,
        price: 50000,
        salePrice: null,
        product: { slug: 'diffuser' },
      });

      mockPrismaService.productVariant.update.mockResolvedValue({ id: 'v-1' });

      await service.updateVariant('v-1', { scent: 'Jasmine' });

      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v-1' },
        data: {
          scent: 'Jasmine',
          sku: 'DIFFUSER-JAS-150ML',
        },
      });
    });

    it('should recalculate SKU using existing scent when only volumeMl is updated', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'v-1',
        scent: 'Lemongrass',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        product: { slug: 'diffuser' },
      });

      mockPrismaService.productVariant.update.mockResolvedValue({ id: 'v-1' });

      await service.updateVariant('v-1', { volumeMl: 500 });

      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v-1' },
        data: {
          volumeMl: 500,
          sku: 'DIFFUSER-LEM-500ML',
        },
      });
    });

    it('should update price without recalculating SKU when neither scent nor volumeMl is supplied', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'v-1',
        scent: 'Lemongrass',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        product: { slug: 'diffuser' },
      });

      mockPrismaService.productVariant.update.mockResolvedValue({ id: 'v-1' });

      await service.updateVariant('v-1', { price: 65000 });

      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v-1' },
        data: {
          price: 65000,
        },
      });
    });

    it('should throw BadRequestException when SKU conflict occurs during variant update (Prisma P2002)', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'v-1',
        scent: 'OldScent',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        product: { slug: 'diffuser' },
      });

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.productVariant.update.mockRejectedValue(p2002Error);

      await expect(
        service.updateVariant('v-1', { scent: 'ConflictScent' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateVariant('v-1', { scent: 'ConflictScent' }),
      ).rejects.toThrow('Variant SKU already exists');
    });

    it('should rethrow unexpected error during variant update', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'v-1',
        scent: 'OldScent',
        volumeMl: 100,
        price: 50000,
        salePrice: null,
        product: { slug: 'diffuser' },
      });

      mockPrismaService.productVariant.update.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        service.updateVariant('v-1', { price: 60000 }),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('removeVariant', () => {
    it('should throw NotFoundException when variant to delete does not exist', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.removeVariant('var-missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeVariant('var-missing')).rejects.toThrow(
        'Variant not found',
      );
    });

    it('should throw BadRequestException when attempting to delete the last variant of a product', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-only',
        product: {
          _count: { variants: 1 },
        },
        _count: {
          cartItems: 0,
          orderItems: 0,
          stockMovements: 0,
        },
      });

      await expect(service.removeVariant('var-only')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removeVariant('var-only')).rejects.toThrow(
        'Cannot delete the last variant of a product',
      );
    });

    it('should throw BadRequestException when variant is referenced by cart items', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-cart',
        product: {
          _count: { variants: 2 },
        },
        _count: {
          cartItems: 1,
          orderItems: 0,
          stockMovements: 0,
        },
      });

      await expect(service.removeVariant('var-cart')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removeVariant('var-cart')).rejects.toThrow(
        'Cannot delete a variant referenced by carts, orders, or stock history',
      );
    });

    it('should throw BadRequestException when variant is referenced by order items', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-order',
        product: {
          _count: { variants: 2 },
        },
        _count: {
          cartItems: 0,
          orderItems: 3,
          stockMovements: 0,
        },
      });

      await expect(service.removeVariant('var-order')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removeVariant('var-order')).rejects.toThrow(
        'Cannot delete a variant referenced by carts, orders, or stock history',
      );
    });

    it('should throw BadRequestException when variant is referenced by stock movements', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-stock',
        product: {
          _count: { variants: 2 },
        },
        _count: {
          cartItems: 0,
          orderItems: 0,
          stockMovements: 2,
        },
      });

      await expect(service.removeVariant('var-stock')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removeVariant('var-stock')).rejects.toThrow(
        'Cannot delete a variant referenced by carts, orders, or stock history',
      );
    });

    it('should successfully delete variant when it has no references and product has multiple variants', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        id: 'var-free',
        product: {
          _count: { variants: 3 },
        },
        _count: {
          cartItems: 0,
          orderItems: 0,
          stockMovements: 0,
        },
      });
      mockPrismaService.productVariant.delete.mockResolvedValue({
        id: 'var-free',
      });

      const result = await service.removeVariant('var-free');

      expect(result).toEqual({ message: 'Variant deleted successfully' });
      expect(mockPrismaService.productVariant.delete).toHaveBeenCalledWith({
        where: { id: 'var-free' },
      });
    });
  });
});
