import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CategoriesService } from '@/categories/categories.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductSortBy } from './dtos/product-filter.dto';

describe('ProductsService - Coverage Companion', () => {
  let service: ProductsService;

  const mockPrismaService = {
    $queryRaw: jest.fn().mockResolvedValue([]),
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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    review: {
      groupBy: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      }),
    },
  };

  const mockCategoriesService = {
    validateProductAssignment: jest.fn().mockResolvedValue(undefined),
    getDescendantIds: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    mockCategoriesService.validateProductAssignment.mockReset();
    mockCategoriesService.validateProductAssignment.mockResolvedValue(
      undefined,
    );
    mockCategoriesService.getDescendantIds.mockReset();
    mockCategoriesService.getDescendantIds.mockResolvedValue([]);

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

  describe('findAll', () => {
    it('should filter by categoryId with descendant category IDs', async () => {
      mockCategoriesService.getDescendantIds.mockResolvedValue([
        'cat1',
        'subcat1',
        'subcat2',
      ]);
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 12, categoryId: 'cat1' });

      expect(mockCategoriesService.getDescendantIds).toHaveBeenCalledWith(
        'cat1',
      );
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { in: ['cat1', 'subcat1', 'subcat2'] },
          }),
        }),
      );
    });

    it('should filter by categorySlug and resolve descendant IDs when category exists', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat1',
        slug: 'room-sprays',
      });
      mockCategoriesService.getDescendantIds.mockResolvedValue([
        'cat1',
        'subcat1',
      ]);
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 12,
        categorySlug: 'room-sprays',
      });

      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { slug: 'room-sprays' },
      });
      expect(mockCategoriesService.getDescendantIds).toHaveBeenCalledWith(
        'cat1',
      );
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: { in: ['cat1', 'subcat1'] },
          }),
        }),
      );
    });

    it('should filter by categorySlug using category id when it has no descendants', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat1',
        slug: 'room-sprays',
      });
      mockCategoriesService.getDescendantIds.mockResolvedValue([]);
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 12,
        categorySlug: 'room-sprays',
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat1',
          }),
        }),
      );
    });

    it('should return empty pagination response immediately when categorySlug is not found', async () => {
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
      expect(mockPrismaService.product.count).not.toHaveBeenCalled();
    });

    it('should filter by comma-separated brand list and ignore empty brand tokens', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({
        page: 1,
        limit: 12,
        brand: 'Thai Aroma, Herbal Mist,  ',
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brand: { in: ['Thai Aroma', 'Herbal Mist'] },
          }),
        }),
      );
    });

    it('should not add brand where condition if brand string only contains whitespace/commas', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 12, brand: ' , , ' });

      const callArg = mockPrismaService.product.findMany.mock.calls[0][0];
      expect(callArg.where.brand).toBeUndefined();
    });

    it('should apply variant-level filters for minPrice, maxPrice, scent, and volumeMl', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({
        minPrice: 50000,
        maxPrice: 150000,
        scent: 'Lavender, Rose, ',
        volumeMl: '100, 250, invalid',
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
                  { scent: { in: ['Lavender', 'Rose'] } },
                  { volumeMl: { in: [100, 250] } },
                ],
              },
            },
          }),
        }),
      );
    });

    it('should sort by oldest (ProductSortBy.OLDEST)', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ sortBy: ProductSortBy.OLDEST });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should sort by price descending (ProductSortBy.PRICE_DESC)', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ sortBy: ProductSortBy.PRICE_DESC });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { basePrice: 'desc' },
        }),
      );
    });

    it('should sort by name ascending (ProductSortBy.NAME_ASC)', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ sortBy: ProductSortBy.NAME_ASC });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should sort by name descending (ProductSortBy.NAME_DESC)', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ sortBy: ProductSortBy.NAME_DESC });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        }),
      );
    });

    it('should return empty products array when BEST_SELLING raw query returns no ranked rows', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      const result = await service.findAll({
        sortBy: ProductSortBy.BEST_SELLING,
      });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
      expect(mockPrismaService.review.groupBy).not.toHaveBeenCalled();
    });

    it('should build all raw SQL conditions when ranking by BEST_SELLING with search, categoryIds array, brand, and variant filters', async () => {
      mockCategoriesService.getDescendantIds.mockResolvedValue([
        'cat1',
        'cat2',
      ]);
      mockPrismaService.$queryRaw.mockResolvedValue([{ id: 'p1' }]);
      mockPrismaService.product.count.mockResolvedValue(1);

      const mockProduct = {
        id: 'p1',
        name: 'Lavender Spray',
        category: { id: 'cat1' },
        variants: [],
        _count: { reviews: 1 },
      };
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.review.groupBy.mockResolvedValue([
        { productId: 'p1', _avg: { rating: 4.2 } },
      ]);

      const result = await service.findAll({
        sortBy: ProductSortBy.BEST_SELLING,
        search: 'spray',
        categoryId: 'cat1',
        brand: 'Thai Aroma',
        minPrice: 50000,
        maxPrice: 150000,
        scent: 'Lavender',
        volumeMl: '250',
        page: 2,
        limit: 1,
      });

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(result.data[0].averageRating).toBe(4.2);
      expect(result.data[0].reviewCount).toBe(1);
      expect(result.hasPreviousPage).toBe(true);
      expect(result.hasNextPage).toBe(false);
    });

    it('should rank products by RATING using database query and scoreExpression', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ id: 'p1' }]);
      mockPrismaService.product.count.mockResolvedValue(1);

      const mockProduct = {
        id: 'p1',
        name: 'Lavender Spray',
        category: { id: 'cat1' },
        variants: [],
        _count: { reviews: 1 },
      };
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.review.groupBy.mockResolvedValue([
        { productId: 'p1', _avg: { rating: 4.8 } },
      ]);

      const result = await service.findAll({
        sortBy: ProductSortBy.RATING,
      });

      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      expect(result.data[0].averageRating).toBe(4.8);
      expect(result.data[0].reviewCount).toBe(1);
    });

    it('should map averageRating to 0 if product review average is null in groupBy', async () => {
      const mockProduct = {
        id: 'p1',
        name: 'Spray',
        category: { id: 'cat1' },
        variants: [],
        _count: { reviews: 0 },
      };
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);
      mockPrismaService.review.groupBy.mockResolvedValue([
        { productId: 'p1', _avg: { rating: null } },
      ]);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.data[0].averageRating).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return averageRating 0 and reviewCount 0 when review aggregate has null rating', async () => {
      const mockProduct = {
        id: 'prod1',
        name: 'Test Prod',
        active: true,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });

      const result = await service.findOne('prod1');

      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod1', active: true },
        include: {
          category: true,
          variants: true,
          reviews: {
            include: {
              user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: { select: { reviews: true } },
        },
      });
      expect(mockPrismaService.review.aggregate).toHaveBeenCalledWith({
        where: { productId: 'prod1' },
        _avg: { rating: true },
        _count: { rating: true },
      });
    });
  });

  describe('findBySlug', () => {
    it('should return product by slug with reviews and calculated averageRating', async () => {
      const mockProduct = {
        id: 'p1',
        name: 'Lavender Spray',
        slug: 'lavender-spray',
        active: true,
        category: { id: 'cat1', name: 'Room Spray' },
        variants: [],
        reviews: [],
        _count: { reviews: 5 },
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.8 },
        _count: { rating: 5 },
      });

      const result = await service.findBySlug('lavender-spray');

      expect(result.id).toBe('p1');
      expect(result.averageRating).toBe(4.8);
      expect(result.reviewCount).toBe(5);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'lavender-spray', active: true },
        include: {
          category: true,
          variants: true,
          reviews: {
            include: {
              user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          _count: { select: { reviews: true } },
        },
      });
      expect(mockPrismaService.review.aggregate).toHaveBeenCalledWith({
        where: { productId: 'p1' },
        _avg: { rating: true },
        _count: { rating: true },
      });
    });

    it('should return averageRating 0 when review aggregate rating is null', async () => {
      const mockProduct = {
        id: 'p1',
        name: 'Lavender Spray',
        slug: 'lavender-spray',
        active: true,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });

      const result = await service.findBySlug('lavender-spray');

      expect(result.averageRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });

    it('should throw NotFoundException when product is not found by slug', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(
        'Product not found',
      );
      expect(mockPrismaService.review.aggregate).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should throw BadRequestException when variant salePrice exceeds regular price', async () => {
      const dto = {
        name: 'Lavender Spray',
        description: 'Test description',
        images: ['img.jpg'],
        categoryId: 'cat1',
        basePrice: 100000,
        variants: [
          {
            scent: 'Lavender',
            volumeMl: 250,
            price: 100000,
            salePrice: 120000,
            stock: 10,
          },
        ],
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Sale price cannot exceed the regular price',
      );
      expect(mockPrismaService.category.findUnique).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category is not a leaf category', async () => {
      const dto = {
        name: 'Lavender Spray',
        description: 'Test description',
        images: ['img.jpg'],
        categoryId: 'cat1',
        basePrice: 100000,
        variants: [
          {
            scent: 'Lavender',
            volumeMl: 250,
            price: 100000,
            salePrice: 90000,
            stock: 10,
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat1',
        name: 'Sprays',
      });
      mockCategoriesService.validateProductAssignment.mockRejectedValueOnce(
        new BadRequestException(
          'Products can only be assigned to leaf categories (categories without subcategories)',
        ),
      );

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException(
          'Products can only be assigned to leaf categories (categories without subcategories)',
        ),
      );
      expect(mockPrismaService.product.findUnique).not.toHaveBeenCalled();
    });

    it('should create product with active=false and custom barcode', async () => {
      const dto = {
        name: 'Room Mist',
        description: 'Mist description',
        brand: 'Thai Aroma',
        images: ['img1.jpg'],
        categoryId: 'cat1',
        basePrice: 80000,
        active: false,
        variants: [
          {
            scent: 'Mint',
            volumeMl: 100,
            price: 80000,
            salePrice: 70000,
            stock: 20,
            barcode: '123456789',
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat1',
        name: 'Room Sprays',
      });
      mockCategoriesService.validateProductAssignment.mockResolvedValue(
        undefined,
      );
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue({
        id: 'p1',
        slug: 'room-mist',
        ...dto,
      });

      const result = await service.create(dto);

      expect(result.id).toBe('p1');
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: {
          name: 'Room Mist',
          slug: 'room-mist',
          description: 'Mist description',
          brand: 'Thai Aroma',
          images: ['img1.jpg'],
          categoryId: 'cat1',
          basePrice: 80000,
          active: false,
          variants: {
            create: [
              {
                sku: 'ROOM-MIST-MIN-100ML',
                scent: 'Mint',
                volumeMl: 100,
                price: 80000,
                salePrice: 70000,
                stock: 20,
                barcode: '123456789',
              },
            ],
          },
        },
        include: {
          variants: true,
          category: true,
        },
      });
    });

    it('should throw BadRequestException when Prisma throws P2002 on product creation', async () => {
      const dto = {
        name: 'Room Mist',
        description: 'Mist description',
        images: ['img1.jpg'],
        categoryId: 'cat1',
        basePrice: 80000,
        variants: [
          {
            scent: 'Mint',
            volumeMl: 100,
            price: 80000,
            stock: 20,
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat1',
        name: 'Room Sprays',
      });
      mockCategoriesService.validateProductAssignment.mockResolvedValue(
        undefined,
      );
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.product.create.mockRejectedValue(p2002);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'Product name or variant SKU already exists',
      );
    });

    it('should rethrow non-P2002 errors during product creation', async () => {
      const dto = {
        name: 'Room Mist',
        description: 'Mist description',
        images: ['img1.jpg'],
        categoryId: 'cat1',
        basePrice: 80000,
        variants: [
          {
            scent: 'Mint',
            volumeMl: 100,
            price: 80000,
            stock: 20,
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat1',
        name: 'Room Sprays',
      });
      mockCategoriesService.validateProductAssignment.mockResolvedValue(
        undefined,
      );
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockRejectedValue(
        new Error('Database disk full'),
      );

      await expect(service.create(dto)).rejects.toThrow('Database disk full');
    });
  });

  describe('update', () => {
    it('should update product without regenerating slug if name is unchanged', async () => {
      const existingProduct = {
        id: 'p1',
        name: 'Lavender Spray',
        slug: 'lavender-spray',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...existingProduct,
        description: 'New description',
      });

      const result = await service.update('p1', {
        description: 'New description',
      });

      expect(result.description).toBe('New description');
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { description: 'New description' },
        include: { variants: true, category: true },
      });
    });

    it('should not regenerate slug if name is passed but equals current name', async () => {
      const existingProduct = {
        id: 'p1',
        name: 'Lavender Spray',
        slug: 'lavender-spray',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
      mockPrismaService.product.update.mockResolvedValue(existingProduct);

      await service.update('p1', { name: 'Lavender Spray' });

      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { name: 'Lavender Spray' },
        include: { variants: true, category: true },
      });
    });

    it('should validate categoryId when updating category and succeed if category is valid leaf', async () => {
      const existingProduct = {
        id: 'p1',
        name: 'Lavender Spray',
        categoryId: 'cat1',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat2',
        name: 'Body Mist',
      });
      mockCategoriesService.validateProductAssignment.mockResolvedValue(
        undefined,
      );
      mockPrismaService.product.update.mockResolvedValue({
        ...existingProduct,
        categoryId: 'cat2',
      });

      const result = await service.update('p1', { categoryId: 'cat2' });

      expect(result.categoryId).toBe('cat2');
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat2' },
      });
      expect(
        mockCategoriesService.validateProductAssignment,
      ).toHaveBeenCalledWith('cat2');
    });

    it('should throw BadRequestException when updating categoryId to a non-existent category', async () => {
      const existingProduct = {
        id: 'p1',
        name: 'Lavender Spray',
        categoryId: 'cat1',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('p1', { categoryId: 'cat999' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('p1', { categoryId: 'cat999' }),
      ).rejects.toThrow('Category not found');
      expect(
        mockCategoriesService.validateProductAssignment,
      ).not.toHaveBeenCalled();
      expect(mockPrismaService.product.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when Prisma throws P2002 on product update', async () => {
      const existingProduct = { id: 'p1', name: 'Old Name' };

      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.product.update.mockRejectedValue(p2002);

      await expect(
        service.update('p1', { name: 'Duplicate Name' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('p1', { name: 'Duplicate Name' }),
      ).rejects.toThrow('Product name already exists');
    });

    it('should rethrow non-P2002 errors during product update', async () => {
      const existingProduct = { id: 'p1', name: 'Old Name' };

      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
      mockPrismaService.product.update.mockRejectedValue(
        new Error('Connection failure'),
      );

      await expect(service.update('p1', { name: 'New Name' })).rejects.toThrow(
        'Connection failure',
      );
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException when product to remove does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('unknown-id')).rejects.toThrow(
        'Product not found',
      );
      expect(mockPrismaService.product.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when product has order items', async () => {
      const mockProduct = {
        id: 'p1',
        variants: [
          {
            cartItems: [],
            orderItems: [{ id: 'oi1' }],
            stockMovements: [],
          },
        ],
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.remove('p1')).rejects.toThrow(BadRequestException);
      await expect(service.remove('p1')).rejects.toThrow(
        'Cannot delete product with existing carts, orders, or stock history',
      );
      expect(mockPrismaService.product.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when product has stock movements', async () => {
      const mockProduct = {
        id: 'p1',
        variants: [
          {
            cartItems: [],
            orderItems: [],
            stockMovements: [{ id: 'sm1' }],
          },
        ],
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.remove('p1')).rejects.toThrow(BadRequestException);
      await expect(service.remove('p1')).rejects.toThrow(
        'Cannot delete product with existing carts, orders, or stock history',
      );
      expect(mockPrismaService.product.delete).not.toHaveBeenCalled();
    });

    it('should delete product when variants have no references', async () => {
      const mockProduct = {
        id: 'p1',
        variants: [
          {
            cartItems: [],
            orderItems: [],
            stockMovements: [],
          },
        ],
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('p1');

      expect(result).toEqual({ message: 'Product deleted successfully' });
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
    });

    it('should delete product when variants array is undefined or null', async () => {
      const mockProduct = {
        id: 'p1',
        variants: null,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('p1');

      expect(result).toEqual({ message: 'Product deleted successfully' });
    });
  });

  describe('getFilterOptions', () => {
    it('should return distinct brands, scents, volumes and price range', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { brand: 'Thai Aroma' },
        { brand: 'Mist King' },
      ]);
      mockPrismaService.productVariant.findMany
        .mockResolvedValueOnce([{ scent: 'Lavender' }, { scent: 'Rose' }])
        .mockResolvedValueOnce([{ volumeMl: 100 }, { volumeMl: 250 }])
        .mockResolvedValueOnce([
          { price: 60000, salePrice: 50000 },
          { price: 250000, salePrice: null },
        ]);

      const result = await service.getFilterOptions();

      expect(result).toEqual({
        brands: ['Thai Aroma', 'Mist King'],
        scents: ['Lavender', 'Rose'],
        volumes: [100, 250],
        priceRange: { min: 50000, max: 250000 },
      });
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { active: true, brand: { not: null } },
        select: { brand: true },
        distinct: ['brand'],
        orderBy: { brand: 'asc' },
      });
      expect(mockPrismaService.productVariant.findMany).toHaveBeenNthCalledWith(
        1,
        {
          where: { product: { active: true } },
          select: { scent: true },
          distinct: ['scent'],
          orderBy: { scent: 'asc' },
        },
      );
      expect(mockPrismaService.productVariant.findMany).toHaveBeenNthCalledWith(
        2,
        {
          where: { product: { active: true } },
          select: { volumeMl: true },
          distinct: ['volumeMl'],
          orderBy: { volumeMl: 'asc' },
        },
      );
      expect(mockPrismaService.productVariant.findMany).toHaveBeenNthCalledWith(
        3,
        {
          where: { product: { active: true } },
          select: { price: true, salePrice: true },
        },
      );
    });

    it('should default priceRange to 0 when min or max price is null, and filter falsy brands', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { brand: 'Thai Aroma' },
        { brand: '' },
        { brand: null },
      ]);
      mockPrismaService.productVariant.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getFilterOptions();

      expect(result.brands).toEqual(['Thai Aroma']);
      expect(result.scents).toEqual([]);
      expect(result.volumes).toEqual([]);
      expect(result.priceRange).toEqual({ min: 0, max: 0 });
    });

    it('should calculate effective price using salePrice when salePrice is lower than price', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.productVariant.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { price: 100000, salePrice: 80000 },
          { price: 150000, salePrice: 120000 },
        ]);

      const result = await service.getFilterOptions();

      expect(result.priceRange).toEqual({ min: 80000, max: 120000 });
    });

    it('should fallback to price when salePrice is null, undefined, or not less than price', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.productVariant.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { price: 50000, salePrice: null },
          { price: 70000, salePrice: undefined },
          { price: 80000, salePrice: 90000 },
          { price: 90000, salePrice: 90000 },
          { price: 200000, salePrice: null },
        ]);

      const result = await service.getFilterOptions();

      expect(result.priceRange).toEqual({ min: 50000, max: 200000 });
    });

    it('should handle single variant setting both min and max price', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.productVariant.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ price: 100000, salePrice: 75000 }]);

      const result = await service.getFilterOptions();

      expect(result.priceRange).toEqual({ min: 75000, max: 75000 });
    });

    it('should fallback minPrice and maxPrice to 0 when variants result in non-finite bounds', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.productVariant.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ price: NaN, salePrice: null }]);

      const result = await service.getFilterOptions();

      expect(result.priceRange).toEqual({ min: 0, max: 0 });
    });
  });

  describe('createVariant', () => {
    it('should throw NotFoundException when product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      const dto = {
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        stock: 10,
      };

      await expect(service.createVariant('p999', dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createVariant('p999', dto)).rejects.toThrow(
        'Product not found',
      );
      expect(mockPrismaService.productVariant.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when salePrice exceeds regular price', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'lavender-spray',
      });

      const dto = {
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        salePrice: 120000,
        stock: 10,
      };

      await expect(service.createVariant('p1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createVariant('p1', dto)).rejects.toThrow(
        'Sale price cannot exceed the regular price',
      );
      expect(mockPrismaService.productVariant.create).not.toHaveBeenCalled();
    });

    it('should create variant and format SKU correctly', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'lavender-spray',
      });

      const dto = {
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        salePrice: 90000,
        stock: 15,
        barcode: 'BC123',
      };
      const createdVariant = {
        id: 'v1',
        productId: 'p1',
        sku: 'LAVENDER-SPRAY-LAV-250ML',
        ...dto,
      };

      mockPrismaService.productVariant.create.mockResolvedValue(createdVariant);

      const result = await service.createVariant('p1', dto);

      expect(result).toEqual(createdVariant);
      expect(mockPrismaService.productVariant.create).toHaveBeenCalledWith({
        data: {
          productId: 'p1',
          sku: 'LAVENDER-SPRAY-LAV-250ML',
          scent: 'Lavender',
          volumeMl: 250,
          price: 100000,
          salePrice: 90000,
          stock: 15,
          barcode: 'BC123',
        },
      });
    });

    it('should throw BadRequestException when Prisma throws P2002 error', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'lavender-spray',
      });

      const dto = {
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        stock: 10,
      };
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.productVariant.create.mockRejectedValue(p2002);

      await expect(service.createVariant('p1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createVariant('p1', dto)).rejects.toThrow(
        'Variant SKU already exists',
      );
    });

    it('should rethrow generic errors during variant creation', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'p1',
        slug: 'lavender-spray',
      });

      const dto = {
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        stock: 10,
      };
      mockPrismaService.productVariant.create.mockRejectedValue(
        new Error('DB failure'),
      );

      await expect(service.createVariant('p1', dto)).rejects.toThrow(
        'DB failure',
      );
    });
  });

  describe('updateVariant', () => {
    it('should throw NotFoundException when variant does not exist', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.updateVariant('v999', { price: 100000 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateVariant('v999', { price: 100000 }),
      ).rejects.toThrow('Variant not found');
      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when updating salePrice above existing variant price', async () => {
      const existingVariant = {
        id: 'v1',
        price: 100000,
        salePrice: null,
        product: { slug: 'lavender-spray' },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );

      await expect(
        service.updateVariant('v1', { salePrice: 120000 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateVariant('v1', { salePrice: 120000 }),
      ).rejects.toThrow('Sale price cannot exceed the regular price');
      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when lowering price below existing variant salePrice', async () => {
      const existingVariant = {
        id: 'v1',
        price: 100000,
        salePrice: 90000,
        product: { slug: 'lavender-spray' },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );

      await expect(
        service.updateVariant('v1', { price: 80000 }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateVariant('v1', { price: 80000 }),
      ).rejects.toThrow('Sale price cannot exceed the regular price');
      expect(mockPrismaService.productVariant.update).not.toHaveBeenCalled();
    });

    it('should recalculate SKU when scent is updated', async () => {
      const existingVariant = {
        id: 'v1',
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        salePrice: 90000,
        product: { slug: 'lavender-spray' },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockResolvedValue({
        ...existingVariant,
        scent: 'Jasmine',
        sku: 'LAVENDER-SPRAY-JAS-250ML',
      });

      const result = await service.updateVariant('v1', { scent: 'Jasmine' });

      expect(result.scent).toBe('Jasmine');
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: {
          scent: 'Jasmine',
          sku: 'LAVENDER-SPRAY-JAS-250ML',
        },
      });
    });

    it('should recalculate SKU when volumeMl is updated', async () => {
      const existingVariant = {
        id: 'v1',
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        salePrice: null,
        product: { slug: 'lavender-spray' },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockResolvedValue({
        ...existingVariant,
        volumeMl: 500,
        sku: 'LAVENDER-SPRAY-LAV-500ML',
      });

      const result = await service.updateVariant('v1', { volumeMl: 500 });

      expect(result.volumeMl).toBe(500);
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: {
          volumeMl: 500,
          sku: 'LAVENDER-SPRAY-LAV-500ML',
        },
      });
    });

    it('should recalculate SKU when both scent and volumeMl are updated', async () => {
      const existingVariant = {
        id: 'v1',
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        salePrice: null,
        product: { slug: 'lavender-spray' },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockResolvedValue({
        ...existingVariant,
        scent: 'Rose',
        volumeMl: 100,
        sku: 'LAVENDER-SPRAY-ROS-100ML',
      });

      const result = await service.updateVariant('v1', {
        scent: 'Rose',
        volumeMl: 100,
      });

      expect(result.scent).toBe('Rose');
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: {
          scent: 'Rose',
          volumeMl: 100,
          sku: 'LAVENDER-SPRAY-ROS-100ML',
        },
      });
    });

    it('should update non-sku fields without changing SKU when neither scent nor volumeMl is updated', async () => {
      const existingVariant = {
        id: 'v1',
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        salePrice: null,
        stock: 10,
        product: { slug: 'lavender-spray' },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockResolvedValue({
        ...existingVariant,
        stock: 25,
        price: 110000,
      });

      const result = await service.updateVariant('v1', {
        stock: 25,
        price: 110000,
      });

      expect(result.stock).toBe(25);
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: {
          stock: 25,
          price: 110000,
        },
      });
    });

    it('should throw BadRequestException when Prisma throws P2002 error on updateVariant', async () => {
      const existingVariant = {
        id: 'v1',
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        salePrice: null,
        product: { slug: 'lavender-spray' },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.8.0' },
      );
      mockPrismaService.productVariant.update.mockRejectedValue(p2002);

      await expect(
        service.updateVariant('v1', { scent: 'ExistingScent' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateVariant('v1', { scent: 'ExistingScent' }),
      ).rejects.toThrow('Variant SKU already exists');
    });

    it('should rethrow generic errors during updateVariant', async () => {
      const existingVariant = {
        id: 'v1',
        scent: 'Lavender',
        volumeMl: 250,
        price: 100000,
        salePrice: null,
        product: { slug: 'lavender-spray' },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        existingVariant,
      );
      mockPrismaService.productVariant.update.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(service.updateVariant('v1', { stock: 50 })).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('removeVariant', () => {
    it('should throw NotFoundException when variant does not exist', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.removeVariant('v999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeVariant('v999')).rejects.toThrow(
        'Variant not found',
      );
      expect(mockPrismaService.productVariant.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when deleting the last variant of a product', async () => {
      const mockVariant = {
        id: 'v1',
        product: {
          _count: { variants: 1 },
        },
        _count: {
          cartItems: 0,
          orderItems: 0,
          stockMovements: 0,
        },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );

      await expect(service.removeVariant('v1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removeVariant('v1')).rejects.toThrow(
        'Cannot delete the last variant of a product',
      );
      expect(mockPrismaService.productVariant.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when variant has cartItems', async () => {
      const mockVariant = {
        id: 'v1',
        product: {
          _count: { variants: 2 },
        },
        _count: {
          cartItems: 1,
          orderItems: 0,
          stockMovements: 0,
        },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );

      await expect(service.removeVariant('v1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removeVariant('v1')).rejects.toThrow(
        'Cannot delete a variant referenced by carts, orders, or stock history',
      );
      expect(mockPrismaService.productVariant.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when variant has orderItems', async () => {
      const mockVariant = {
        id: 'v1',
        product: {
          _count: { variants: 2 },
        },
        _count: {
          cartItems: 0,
          orderItems: 2,
          stockMovements: 0,
        },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );

      await expect(service.removeVariant('v1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removeVariant('v1')).rejects.toThrow(
        'Cannot delete a variant referenced by carts, orders, or stock history',
      );
      expect(mockPrismaService.productVariant.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when variant has stockMovements', async () => {
      const mockVariant = {
        id: 'v1',
        product: {
          _count: { variants: 2 },
        },
        _count: {
          cartItems: 0,
          orderItems: 0,
          stockMovements: 1,
        },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );

      await expect(service.removeVariant('v1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.removeVariant('v1')).rejects.toThrow(
        'Cannot delete a variant referenced by carts, orders, or stock history',
      );
      expect(mockPrismaService.productVariant.delete).not.toHaveBeenCalled();
    });

    it('should delete variant when there are multiple variants and no references', async () => {
      const mockVariant = {
        id: 'v1',
        product: {
          _count: { variants: 3 },
        },
        _count: {
          cartItems: 0,
          orderItems: 0,
          stockMovements: 0,
        },
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue(
        mockVariant,
      );
      mockPrismaService.productVariant.delete.mockResolvedValue(mockVariant);

      const result = await service.removeVariant('v1');

      expect(result).toEqual({ message: 'Variant deleted successfully' });
      expect(mockPrismaService.productVariant.delete).toHaveBeenCalledWith({
        where: { id: 'v1' },
      });
    });
  });
});
