import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SlugifyUtil } from '@/common/utils/slugify.util';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductSortBy } from './dtos/product-filter.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
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
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated products with default filters', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Lavender Spray',
          slug: 'lavender-spray',
          description: 'Test product',
          brand: 'Thai Aroma',
          images: ['image1.jpg'],
          categoryId: 'cat1',
          basePrice: 100000,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: { id: 'cat1', name: 'Room Spray' },
          variants: [],
          reviews: [],
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
          skip: 0,
          take: 12,
        }),
      );
    });

    it('should filter products by search term', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 12, search: 'lavender' });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'lavender', mode: 'insensitive' } },
              { description: { contains: 'lavender', mode: 'insensitive' } },
              { brand: { contains: 'lavender', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should filter products by category', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 12, categoryId: 'cat1' });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat1' }),
        }),
      );
    });

    it('should sort products by price ascending', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 12, sortBy: ProductSortBy.PRICE_ASC });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { basePrice: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const mockProduct = {
        id: '1',
        name: 'Lavender Spray',
        slug: 'lavender-spray',
        description: 'Test product',
        brand: 'Thai Aroma',
        images: ['image1.jpg'],
        categoryId: 'cat1',
        basePrice: 100000,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: { id: 'cat1', name: 'Room Spray' },
        variants: [],
        reviews: [{ rating: 5 }, { rating: 4 }],
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.averageRating).toBe(4.5);
      expect(result.reviewCount).toBe(2);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
        }),
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a product with variants', async () => {
      const createProductDto = {
        name: 'New Spray',
        description: 'Test description',
        brand: 'Thai Aroma',
        images: ['image1.jpg'],
        categoryId: 'cat1',
        basePrice: 100000,
        active: true,
        variants: [
          {
            scent: 'Lavender',
            volumeMl: 250,
            price: 100000,
            stock: 50,
          },
        ],
      };

      const mockCategory = { id: 'cat1', name: 'Room Spray' };
      const mockProduct = {
        id: '1',
        ...createProductDto,
        slug: 'new-spray',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: mockCategory,
        variants: [
          {
            id: 'v1',
            sku: 'NEW-SPRAY-LAV-250ML',
            scent: 'Lavender',
            volumeMl: 250,
            price: 100000,
            stock: 50,
          },
        ],
      };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(result).toBeDefined();
      expect(result.slug).toBe('new-spray');
      expect(mockPrismaService.product.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when category not found', async () => {
      const createProductDto = {
        name: 'New Spray',
        description: 'Test description',
        brand: 'Thai Aroma',
        images: ['image1.jpg'],
        categoryId: 'invalid-cat',
        basePrice: 100000,
        active: true,
        variants: [],
      };

      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(createProductDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createProductDto)).rejects.toThrow('Category not found');
    });

    it('should throw BadRequestException when product name already exists', async () => {
      const createProductDto = {
        name: 'Existing Product',
        description: 'Test description',
        brand: 'Thai Aroma',
        images: ['image1.jpg'],
        categoryId: 'cat1',
        basePrice: 100000,
        active: true,
        variants: [],
      };

      const mockCategory = { id: 'cat1', name: 'Room Spray' };
      const existingProduct = { id: '1', slug: 'existing-product' };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createProductDto)).rejects.toThrow('Product with this name already exists');
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto = {
        name: 'Updated Product',
        basePrice: 150000,
      };

      const existingProduct = {
        id: '1',
        name: 'Old Product',
        slug: 'old-product',
        description: 'Test',
        brand: 'Thai Aroma',
        images: ['image1.jpg'],
        categoryId: 'cat1',
        basePrice: 100000,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateProductDto,
        slug: 'updated-product',
      };

      mockPrismaService.product.findUnique.mockResolvedValue(existingProduct);
      mockPrismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update('1', updateProductDto);

      expect(result.name).toBe('Updated Product');
      expect(result.basePrice).toBe(150000);
      expect(mockPrismaService.product.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.update('999', { basePrice: 150000 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a product without dependencies', async () => {
      const mockProduct = {
        id: '1',
        _count: {
          cartItems: 0,
          orderItems: 0,
        },
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('1');

      expect(result.message).toBe('Product deleted successfully');
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw BadRequestException when product has cart items', async () => {
      const mockProduct = {
        id: '1',
        variants: [
          {
            id: 'var1',
            cartItems: [{ id: 'cart1' }],
            orderItems: [],
          },
        ],
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.remove('1')).rejects.toThrow(BadRequestException);
      await expect(service.remove('1')).rejects.toThrow('Cannot delete product with existing cart items or orders');
    });
  });
});
