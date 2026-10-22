import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { CreateVariantDto } from './dtos/create-variant.dto';
import { UpdateVariantDto } from './dtos/update-variant.dto';
import { ProductFilterDto, ProductSortBy } from './dtos/product-filter.dto';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductsService = {
    findAll: jest.fn(),
    getFilterOptions: jest.fn(),
    findOne: jest.fn(),
    findBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createVariant: jest.fn(),
    updateVariant: jest.fn(),
    removeVariant: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CsrfGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('delegates to productsService.findAll with filter query and returns result', async () => {
      const filterDto: ProductFilterDto = {
        page: 1,
        limit: 12,
        search: 'spray',
        sortBy: ProductSortBy.NEWEST,
      };
      const expectedResult = {
        data: [
          {
            id: 'prod-1',
            name: 'Room Spray',
            slug: 'room-spray',
            basePrice: 120000,
            active: true,
          },
        ],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockProductsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filterDto);

      expect(mockProductsService.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.findAll', async () => {
      const filterDto: ProductFilterDto = { page: 1, limit: 12 };
      mockProductsService.findAll.mockRejectedValue(
        new Error('Database query failure'),
      );

      await expect(controller.findAll(filterDto)).rejects.toThrow(
        'Database query failure',
      );
      expect(mockProductsService.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('getFilterOptions', () => {
    it('delegates to productsService.getFilterOptions and returns filter options', async () => {
      const expectedResult = {
        brands: ['Brand A', 'Brand B'],
        scents: ['Lavender', 'Jasmine'],
        volumes: [100, 250],
        priceRange: { min: 50000, max: 250000 },
      };
      mockProductsService.getFilterOptions.mockResolvedValue(expectedResult);

      const result = await controller.getFilterOptions();

      expect(mockProductsService.getFilterOptions).toHaveBeenCalledWith();
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.getFilterOptions', async () => {
      mockProductsService.getFilterOptions.mockRejectedValue(
        new Error('Filter lookup failed'),
      );

      await expect(controller.getFilterOptions()).rejects.toThrow(
        'Filter lookup failed',
      );
      expect(mockProductsService.getFilterOptions).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('delegates to productsService.findOne with id param and returns product', async () => {
      const productId = 'prod-100';
      const expectedResult = {
        id: productId,
        name: 'Lavender Spray',
        slug: 'lavender-spray',
        averageRating: 4.8,
        reviewCount: 20,
      };
      mockProductsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(productId);

      expect(mockProductsService.findOne).toHaveBeenCalledWith(productId);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.findOne', async () => {
      const productId = 'prod-nonexistent';
      mockProductsService.findOne.mockRejectedValue(
        new Error('Product not found'),
      );

      await expect(controller.findOne(productId)).rejects.toThrow(
        'Product not found',
      );
      expect(mockProductsService.findOne).toHaveBeenCalledWith(productId);
    });
  });

  describe('findBySlug', () => {
    it('delegates to productsService.findBySlug with slug param and returns product', async () => {
      const slug = 'lavender-spray-premium';
      const expectedResult = {
        id: 'prod-101',
        name: 'Lavender Spray Premium',
        slug,
        averageRating: 5.0,
        reviewCount: 15,
      };
      mockProductsService.findBySlug.mockResolvedValue(expectedResult);

      const result = await controller.findBySlug(slug);

      expect(mockProductsService.findBySlug).toHaveBeenCalledWith(slug);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.findBySlug', async () => {
      const slug = 'missing-slug';
      mockProductsService.findBySlug.mockRejectedValue(
        new Error('Product not found'),
      );

      await expect(controller.findBySlug(slug)).rejects.toThrow(
        'Product not found',
      );
      expect(mockProductsService.findBySlug).toHaveBeenCalledWith(slug);
    });
  });

  describe('create', () => {
    it('delegates to productsService.create with body DTO and returns created product', async () => {
      const createDto: CreateProductDto = {
        name: 'New Room Spray',
        description: 'Pleasant aroma for your room',
        brand: 'Thai Herbal',
        images: ['https://example.com/p1.jpg'],
        categoryId: 'cat-room',
        basePrice: 150000,
        active: true,
        variants: [
          {
            scent: 'Lemongrass',
            volumeMl: 250,
            price: 150000,
            stock: 100,
          },
        ],
      };
      const expectedResult = {
        id: 'prod-new-1',
        ...createDto,
        slug: 'new-room-spray',
      };
      mockProductsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(mockProductsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.create', async () => {
      const createDto: CreateProductDto = {
        name: 'Existing Product',
        description: 'Duplicate',
        images: [],
        categoryId: 'cat-1',
        basePrice: 100000,
        variants: [
          {
            scent: 'Orange',
            volumeMl: 100,
            price: 100000,
            stock: 10,
          },
        ],
      };
      mockProductsService.create.mockRejectedValue(
        new Error('Product with this name already exists'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        'Product with this name already exists',
      );
      expect(mockProductsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('delegates to productsService.update with id param and body DTO and returns updated product', async () => {
      const productId = 'prod-100';
      const updateDto: UpdateProductDto = {
        name: 'Updated Spray Name',
        basePrice: 160000,
      };
      const expectedResult = {
        id: productId,
        name: 'Updated Spray Name',
        basePrice: 160000,
      };
      mockProductsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(productId, updateDto);

      expect(mockProductsService.update).toHaveBeenCalledWith(
        productId,
        updateDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.update', async () => {
      const productId = 'prod-100';
      const updateDto: UpdateProductDto = { name: 'Conflict Name' };
      mockProductsService.update.mockRejectedValue(
        new Error('Product name already exists'),
      );

      await expect(controller.update(productId, updateDto)).rejects.toThrow(
        'Product name already exists',
      );
      expect(mockProductsService.update).toHaveBeenCalledWith(
        productId,
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('delegates to productsService.remove with id param and returns deletion result', async () => {
      const productId = 'prod-100';
      const expectedResult = { message: 'Product deleted successfully' };
      mockProductsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(productId);

      expect(mockProductsService.remove).toHaveBeenCalledWith(productId);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.remove', async () => {
      const productId = 'prod-100';
      mockProductsService.remove.mockRejectedValue(
        new Error(
          'Cannot delete product with existing carts, orders, or stock history',
        ),
      );

      await expect(controller.remove(productId)).rejects.toThrow(
        'Cannot delete product with existing carts, orders, or stock history',
      );
      expect(mockProductsService.remove).toHaveBeenCalledWith(productId);
    });
  });

  describe('createVariant', () => {
    it('delegates to productsService.createVariant with productId and body DTO and returns created variant', async () => {
      const productId = 'prod-100';
      const createVariantDto: CreateVariantDto = {
        scent: 'Citrus',
        volumeMl: 300,
        price: 180000,
        salePrice: 160000,
        stock: 50,
        barcode: 'BAR-12345',
      };
      const expectedResult = {
        id: 'var-new-1',
        productId,
        ...createVariantDto,
        sku: 'PROD-100-CIT-300ML',
      };
      mockProductsService.createVariant.mockResolvedValue(expectedResult);

      const result = await controller.createVariant(
        productId,
        createVariantDto,
      );

      expect(mockProductsService.createVariant).toHaveBeenCalledWith(
        productId,
        createVariantDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.createVariant', async () => {
      const productId = 'prod-100';
      const createVariantDto: CreateVariantDto = {
        scent: 'Citrus',
        volumeMl: 300,
        price: 180000,
        stock: 50,
      };
      mockProductsService.createVariant.mockRejectedValue(
        new Error('Variant SKU already exists'),
      );

      await expect(
        controller.createVariant(productId, createVariantDto),
      ).rejects.toThrow('Variant SKU already exists');
      expect(mockProductsService.createVariant).toHaveBeenCalledWith(
        productId,
        createVariantDto,
      );
    });
  });

  describe('updateVariant', () => {
    it('delegates to productsService.updateVariant with variantId and body DTO and returns updated variant', async () => {
      const variantId = 'var-100';
      const updateVariantDto: UpdateVariantDto = {
        price: 175000,
        stock: 45,
      };
      const expectedResult = {
        id: variantId,
        scent: 'Citrus',
        volumeMl: 300,
        price: 175000,
        stock: 45,
      };
      mockProductsService.updateVariant.mockResolvedValue(expectedResult);

      const result = await controller.updateVariant(
        variantId,
        updateVariantDto,
      );

      expect(mockProductsService.updateVariant).toHaveBeenCalledWith(
        variantId,
        updateVariantDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.updateVariant', async () => {
      const variantId = 'var-100';
      const updateVariantDto: UpdateVariantDto = { price: 200000 };
      mockProductsService.updateVariant.mockRejectedValue(
        new Error('Variant not found'),
      );

      await expect(
        controller.updateVariant(variantId, updateVariantDto),
      ).rejects.toThrow('Variant not found');
      expect(mockProductsService.updateVariant).toHaveBeenCalledWith(
        variantId,
        updateVariantDto,
      );
    });
  });

  describe('removeVariant', () => {
    it('delegates to productsService.removeVariant with variantId and returns deletion result', async () => {
      const variantId = 'var-100';
      const expectedResult = { message: 'Variant deleted successfully' };
      mockProductsService.removeVariant.mockResolvedValue(expectedResult);

      const result = await controller.removeVariant(variantId);

      expect(mockProductsService.removeVariant).toHaveBeenCalledWith(variantId);
      expect(result).toEqual(expectedResult);
    });

    it('propagates errors thrown by productsService.removeVariant', async () => {
      const variantId = 'var-100';
      mockProductsService.removeVariant.mockRejectedValue(
        new Error('Cannot delete the last variant of a product'),
      );

      await expect(controller.removeVariant(variantId)).rejects.toThrow(
        'Cannot delete the last variant of a product',
      );
      expect(mockProductsService.removeVariant).toHaveBeenCalledWith(variantId);
    });
  });
});
