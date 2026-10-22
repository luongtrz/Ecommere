import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductFilterDto, ProductSortBy } from './dtos/product-filter.dto';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { CreateVariantDto } from './dtos/create-variant.dto';
import { UpdateVariantDto } from './dtos/update-variant.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockProductsService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findBySlug: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    createVariant: jest.Mock;
    updateVariant: jest.Mock;
    removeVariant: jest.Mock;
  };

  const mockJwtGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCsrfGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    mockProductsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createVariant: jest.fn(),
      updateVariant: jest.fn(),
      removeVariant: jest.fn(),
    };

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
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(CsrfGuard)
      .useValue(mockCsrfGuard)
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products matching filters', async () => {
      const filterDto: ProductFilterDto = {
        page: 1,
        limit: 12,
        search: 'spray',
        sortBy: ProductSortBy.NEWEST,
      };

      const mockResponse = {
        data: [{ id: 'prod-1', name: 'Spray 1' }],
        total: 1,
        page: 1,
        limit: 12,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockProductsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual(mockResponse);
      expect(mockProductsService.findAll).toHaveBeenCalledWith(filterDto);
    });

    it('should propagate service errors', async () => {
      mockProductsService.findAll.mockRejectedValue(
        new BadRequestException('Invalid query'),
      );

      await expect(controller.findAll({})).rejects.toThrow(BadRequestException);
      await expect(controller.findAll({})).rejects.toThrow('Invalid query');
    });
  });

  describe('findOneForAdmin', () => {
    it('should call productsService.findOne with id and includeInactive = true', async () => {
      const mockProduct = {
        id: 'admin-prod-1',
        active: false,
        name: 'Inactive Item',
      };
      mockProductsService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOneForAdmin('admin-prod-1');

      expect(result).toEqual(mockProduct);
      expect(mockProductsService.findOne).toHaveBeenCalledWith(
        'admin-prod-1',
        true,
      );
    });

    it('should propagate NotFoundException when product is not found', async () => {
      mockProductsService.findOne.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(controller.findOneForAdmin('missing-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOneForAdmin('missing-id')).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('findAllForAdmin', () => {
    it('should call productsService.findAll with filterDto and includeInactive = true', async () => {
      const filterDto: ProductFilterDto = { page: 1, limit: 20 };
      const mockResponse = {
        data: [
          { id: 'p1', active: false },
          { id: 'p2', active: true },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      mockProductsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAllForAdmin(filterDto);

      expect(result).toEqual(mockResponse);
      expect(mockProductsService.findAll).toHaveBeenCalledWith(filterDto, true);
    });

    it('should propagate errors from findAll for admin', async () => {
      mockProductsService.findAll.mockRejectedValue(
        new Error('Internal failure'),
      );

      await expect(controller.findAllForAdmin({})).rejects.toThrow(
        'Internal failure',
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by ID for public access', async () => {
      const mockProduct = {
        id: 'public-prod-1',
        active: true,
        name: 'Public Spray',
      };
      mockProductsService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne('public-prod-1');

      expect(result).toEqual(mockProduct);
      expect(mockProductsService.findOne).toHaveBeenCalledWith('public-prod-1');
    });

    it('should propagate NotFoundException when product does not exist', async () => {
      mockProductsService.findOne.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a product by slug', async () => {
      const mockProduct = {
        id: 'prod-slug-1',
        slug: 'thai-aroma-spray',
        name: 'Thai Aroma Spray',
      };
      mockProductsService.findBySlug.mockResolvedValue(mockProduct);

      const result = await controller.findBySlug('thai-aroma-spray');

      expect(result).toEqual(mockProduct);
      expect(mockProductsService.findBySlug).toHaveBeenCalledWith(
        'thai-aroma-spray',
      );
    });

    it('should propagate NotFoundException when product with slug does not exist', async () => {
      mockProductsService.findBySlug.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(controller.findBySlug('missing-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findBySlug('missing-slug')).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('create', () => {
    it('should create and return a new product', async () => {
      const createDto: CreateProductDto = {
        name: 'New Essential Oil',
        description: 'Pure essential oil',
        brand: 'Aroma Co',
        images: ['img1.png'],
        categoryId: 'cat-1',
        basePrice: 120000,
        variants: [
          {
            scent: 'Eucalyptus',
            volumeMl: 100,
            price: 120000,
            stock: 20,
          },
        ],
      };

      const mockCreated = {
        id: 'p-new-1',
        ...createDto,
        slug: 'new-essential-oil',
      };
      mockProductsService.create.mockResolvedValue(mockCreated);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockCreated);
      expect(mockProductsService.create).toHaveBeenCalledWith(createDto);
    });

    it('should propagate BadRequestException on creation conflict or invalid data', async () => {
      const createDto: CreateProductDto = {
        name: 'Duplicate Item',
        description: 'Desc',
        images: [],
        categoryId: 'cat-1',
        basePrice: 50000,
        variants: [],
      };

      mockProductsService.create.mockRejectedValue(
        new BadRequestException('Product with this name already exists'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.create(createDto)).rejects.toThrow(
        'Product with this name already exists',
      );
    });
  });

  describe('update', () => {
    it('should update and return the product', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Name',
        basePrice: 130000,
      };

      const mockUpdated = { id: 'prod-1', ...updateDto };
      mockProductsService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update('prod-1', updateDto);

      expect(result).toEqual(mockUpdated);
      expect(mockProductsService.update).toHaveBeenCalledWith(
        'prod-1',
        updateDto,
      );
    });

    it('should propagate NotFoundException when updating non-existent product', async () => {
      mockProductsService.update.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(
        controller.update('missing-id', { basePrice: 100000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException on update validation failure', async () => {
      mockProductsService.update.mockRejectedValue(
        new BadRequestException('Category not found'),
      );

      await expect(
        controller.update('prod-1', { categoryId: 'invalid-cat' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.update('prod-1', { categoryId: 'invalid-cat' }),
      ).rejects.toThrow('Category not found');
    });
  });

  describe('remove', () => {
    it('should delete a product and return success message', async () => {
      const mockResult = { message: 'Product deleted successfully' };
      mockProductsService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('prod-del-1');

      expect(result).toEqual(mockResult);
      expect(mockProductsService.remove).toHaveBeenCalledWith('prod-del-1');
    });

    it('should propagate NotFoundException when product to delete is not found', async () => {
      mockProductsService.remove.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(controller.remove('missing-del-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate BadRequestException when product has order references', async () => {
      mockProductsService.remove.mockRejectedValue(
        new BadRequestException(
          'Cannot delete product with existing carts, orders, or stock history',
        ),
      );

      await expect(controller.remove('prod-referenced')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.remove('prod-referenced')).rejects.toThrow(
        'Cannot delete product with existing carts, orders, or stock history',
      );
    });
  });

  describe('createVariant', () => {
    it('should create and return a product variant', async () => {
      const createVariantDto: CreateVariantDto = {
        scent: 'Peppermint',
        volumeMl: 100,
        price: 80000,
        salePrice: 65000,
        stock: 30,
        barcode: 'BAR-PEP-100',
      };

      const mockVariant = {
        id: 'var-1',
        productId: 'prod-1',
        sku: 'SPRAY-PEP-100ML',
        ...createVariantDto,
      };

      mockProductsService.createVariant.mockResolvedValue(mockVariant);

      const result = await controller.createVariant('prod-1', createVariantDto);

      expect(result).toEqual(mockVariant);
      expect(mockProductsService.createVariant).toHaveBeenCalledWith(
        'prod-1',
        createVariantDto,
      );
    });

    it('should propagate NotFoundException when parent product does not exist', async () => {
      const createVariantDto: CreateVariantDto = {
        scent: 'Peppermint',
        volumeMl: 100,
        price: 80000,
        stock: 10,
      };

      mockProductsService.createVariant.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(
        controller.createVariant('missing-prod', createVariantDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException when variant data is invalid', async () => {
      const createVariantDto: CreateVariantDto = {
        scent: 'Peppermint',
        volumeMl: 100,
        price: 80000,
        salePrice: 95000,
        stock: 10,
      };

      mockProductsService.createVariant.mockRejectedValue(
        new BadRequestException('Sale price cannot exceed the regular price'),
      );

      await expect(
        controller.createVariant('prod-1', createVariantDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateVariant', () => {
    it('should update and return the variant', async () => {
      const updateVariantDto: UpdateVariantDto = {
        scent: 'Wild Mint',
        volumeMl: 150,
        price: 90000,
      };

      const mockUpdatedVariant = {
        id: 'var-1',
        ...updateVariantDto,
        sku: 'SPRAY-WIL-150ML',
      };

      mockProductsService.updateVariant.mockResolvedValue(mockUpdatedVariant);

      const result = await controller.updateVariant('var-1', updateVariantDto);

      expect(result).toEqual(mockUpdatedVariant);
      expect(mockProductsService.updateVariant).toHaveBeenCalledWith(
        'var-1',
        updateVariantDto,
      );
    });

    it('should propagate NotFoundException when variant does not exist', async () => {
      mockProductsService.updateVariant.mockRejectedValue(
        new NotFoundException('Variant not found'),
      );

      await expect(
        controller.updateVariant('missing-var', { price: 50000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException when variant SKU or price is invalid', async () => {
      mockProductsService.updateVariant.mockRejectedValue(
        new BadRequestException('Variant SKU already exists'),
      );

      await expect(
        controller.updateVariant('var-1', { scent: 'Conflict' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeVariant', () => {
    it('should delete a variant and return success message', async () => {
      const mockResult = { message: 'Variant deleted successfully' };
      mockProductsService.removeVariant.mockResolvedValue(mockResult);

      const result = await controller.removeVariant('var-del-1');

      expect(result).toEqual(mockResult);
      expect(mockProductsService.removeVariant).toHaveBeenCalledWith(
        'var-del-1',
      );
    });

    it('should propagate NotFoundException when variant to delete does not exist', async () => {
      mockProductsService.removeVariant.mockRejectedValue(
        new NotFoundException('Variant not found'),
      );

      await expect(controller.removeVariant('missing-var')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate BadRequestException when attempting to delete the last variant', async () => {
      mockProductsService.removeVariant.mockRejectedValue(
        new BadRequestException('Cannot delete the last variant of a product'),
      );

      await expect(controller.removeVariant('last-var')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.removeVariant('last-var')).rejects.toThrow(
        'Cannot delete the last variant of a product',
      );
    });
  });
});
