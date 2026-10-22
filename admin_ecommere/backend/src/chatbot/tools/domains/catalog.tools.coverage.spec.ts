import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { createAdminCatalogTools, AdminCatalogToolDeps } from './catalog.tools';
import { AgentToolDef, ToolContext } from '../tool.types';
import { ToolError } from '../tool-result.util';
import type { ProductsService } from '../../../products/products.service';
import type { CategoriesService } from '../../../categories/categories.service';

describe('Admin Catalog Tools - Coverage Companion', () => {
  let mockProductsService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    createVariant: jest.Mock;
    updateVariant: jest.Mock;
    removeVariant: jest.Mock;
  };

  let mockCategoriesService: {
    getTreeStructure: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  let tools: AgentToolDef[];
  let listProductsTool: AgentToolDef;
  let getProductTool: AgentToolDef;
  let createProductTool: AgentToolDef;
  let updateProductTool: AgentToolDef;
  let createVariantTool: AgentToolDef;
  let updateVariantTool: AgentToolDef;
  let deleteProductTool: AgentToolDef;
  let deleteVariantTool: AgentToolDef;
  let listCategoriesTool: AgentToolDef;
  let createCategoryTool: AgentToolDef;
  let updateCategoryTool: AgentToolDef;
  let deleteCategoryTool: AgentToolDef;

  const adminCtx: ToolContext = {
    userId: 'admin-coverage-user',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'thread-cov-catalog',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockProductsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createVariant: jest.fn(),
      updateVariant: jest.fn(),
      removeVariant: jest.fn(),
    };

    mockCategoriesService = {
      getTreeStructure: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const deps: AdminCatalogToolDeps = {
      products: mockProductsService as unknown as ProductsService,
      categories: mockCategoriesService as unknown as CategoriesService,
    };

    tools = createAdminCatalogTools(deps);
    listProductsTool = tools.find((t) => t.name === 'list_products')!;
    getProductTool = tools.find((t) => t.name === 'get_product')!;
    createProductTool = tools.find((t) => t.name === 'create_product')!;
    updateProductTool = tools.find((t) => t.name === 'update_product')!;
    createVariantTool = tools.find((t) => t.name === 'create_variant')!;
    updateVariantTool = tools.find((t) => t.name === 'update_variant')!;
    deleteProductTool = tools.find((t) => t.name === 'delete_product')!;
    deleteVariantTool = tools.find((t) => t.name === 'delete_variant')!;
    listCategoriesTool = tools.find((t) => t.name === 'list_categories')!;
    createCategoryTool = tools.find((t) => t.name === 'create_category')!;
    updateCategoryTool = tools.find((t) => t.name === 'update_category')!;
    deleteCategoryTool = tools.find((t) => t.name === 'delete_category')!;
  });

  describe('list_products projection and edge cases', () => {
    it('returns raw result as-is when input is null, undefined, or primitive', () => {
      expect(listProductsTool.project!(null)).toBeNull();
      expect(listProductsTool.project!(undefined)).toBeUndefined();
      expect(listProductsTool.project!('simple-string')).toBe('simple-string');
      expect(listProductsTool.project!(12345)).toBe(12345);
    });

    it('projectProductList handles bare array input and slices to 20', () => {
      const rawArray = Array.from({ length: 25 }, (_, i) => ({
        id: `p-${i + 1}`,
        name: `Product ${i + 1}`,
        slug: `product-${i + 1}`,
        active: true,
        basePrice: 50000,
        variants: [
          {
            id: `v-${i + 1}`,
            scent: 'Rose',
            volumeMl: 50,
            price: 50000,
            salePrice: 45000,
            stock: 10,
          },
        ],
      }));

      const projected = listProductsTool.project!(rawArray) as any[];
      expect(Array.isArray(projected)).toBe(true);
      expect(projected).toHaveLength(20);
      expect(projected[0]).toEqual({
        id: 'p-1',
        name: 'Product 1',
        slug: 'product-1',
        active: true,
        basePrice: 50000,
        variants: [
          {
            id: 'v-1',
            scent: 'Rose',
            volumeMl: 50,
            price: 50000,
            salePrice: 45000,
            stock: 10,
          },
        ],
      });
    });

    it('projectProductList returns result unchanged if object has no data array', () => {
      const customResult = { total: 0, items: [] };
      expect(listProductsTool.project!(customResult)).toEqual(customResult);
    });

    it('projectListProductItem handles non-object item and product without variants array', () => {
      const items = [
        null,
        'non-object-product',
        {
          id: 'p-no-variants',
          name: 'No Variants Product',
          slug: 'no-variants',
          active: false,
          basePrice: 100000,
          variants: null, // non-array variants
        },
        {
          id: 'p-missing-variants',
          name: 'Missing Variants',
          slug: 'missing-variants',
          active: true,
          basePrice: 150000,
          // variants undefined
        },
        {
          id: 'p-sparse-variants',
          name: 'Sparse Variants',
          slug: 'sparse',
          active: true,
          basePrice: 200000,
          variants: [null, undefined], // elements null/undefined
        },
      ];

      const projected = listProductsTool.project!(items) as any[];
      expect(projected[0]).toBeNull();
      expect(projected[1]).toBe('non-object-product');

      expect(projected[2]).toEqual({
        id: 'p-no-variants',
        name: 'No Variants Product',
        slug: 'no-variants',
        active: false,
        basePrice: 100000,
        variants: [],
      });

      expect(projected[3]).toEqual({
        id: 'p-missing-variants',
        name: 'Missing Variants',
        slug: 'missing-variants',
        active: true,
        basePrice: 150000,
        variants: [],
      });

      expect(projected[4].variants).toEqual([
        {
          id: undefined,
          scent: undefined,
          volumeMl: undefined,
          price: undefined,
          salePrice: undefined,
          stock: undefined,
        },
        {
          id: undefined,
          scent: undefined,
          volumeMl: undefined,
          price: undefined,
          salePrice: undefined,
          stock: undefined,
        },
      ]);
    });
  });

  describe('get_product projection and edge cases', () => {
    it('returns raw result as-is when input is null, undefined, or primitive', () => {
      expect(getProductTool.project!(null)).toBeNull();
      expect(getProductTool.project!(undefined)).toBeUndefined();
      expect(getProductTool.project!(999)).toBe(999);
      expect(getProductTool.project!(true)).toBe(true);
    });

    it('projectProductDetail handles non-string description and non-array variants', () => {
      const productWithNullDesc = {
        id: 'p-null-desc',
        name: 'Null Description',
        slug: 'null-desc',
        brand: 'Aroma',
        active: true,
        basePrice: 80000,
        description: null,
        variants: undefined,
      };

      const projected1 = getProductTool.project!(productWithNullDesc) as any;
      expect(projected1.description).toBeNull();
      expect(projected1.variants).toEqual([]);

      const productWithNumberDesc = {
        id: 'p-num-desc',
        name: 'Number Description',
        slug: 'num-desc',
        brand: 'Aroma',
        active: false,
        basePrice: 90000,
        description: 12345,
        variants: 'not-an-array',
      };

      const projected2 = getProductTool.project!(productWithNumberDesc) as any;
      expect(projected2.description).toBe(12345);
      expect(projected2.variants).toEqual([]);
    });

    it('projectProductDetail handles variants array with null elements or missing properties', () => {
      const rawProduct = {
        id: 'p-detail',
        name: 'Detail Product',
        slug: 'detail-prod',
        brand: 'Luxe',
        active: true,
        basePrice: 200000,
        description: 'Mô tả ngắn gọn',
        variants: [
          null,
          {
            id: 'v-only-id',
          },
        ],
      };

      const projected = getProductTool.project!(rawProduct) as any;
      expect(projected.variants).toEqual([
        {
          id: undefined,
          scent: undefined,
          volumeMl: undefined,
          price: undefined,
          salePrice: undefined,
          stock: undefined,
          barcode: undefined,
        },
        {
          id: 'v-only-id',
          scent: undefined,
          volumeMl: undefined,
          price: undefined,
          salePrice: undefined,
          stock: undefined,
          barcode: undefined,
        },
      ]);
    });
  });

  describe('list_categories projection and edge cases', () => {
    it('returns categories as-is if input is not an array', () => {
      expect(listCategoriesTool.project!(null)).toBeNull();
      expect(listCategoriesTool.project!(undefined)).toBeUndefined();
      expect(listCategoriesTool.project!({ id: 'cat-1' })).toEqual({
        id: 'cat-1',
      });
      expect(listCategoriesTool.project!('not-array')).toBe('not-array');
    });

    it('projectCategoryTree defaults productCount to 0 when missing or null', () => {
      const tree = [
        {
          id: 'c-1',
          name: 'Danh mục không có count',
          slug: 'dm-khong-count',
          productCount: undefined,
        },
        {
          id: 'c-2',
          name: 'Danh mục count null',
          slug: 'dm-null-count',
          productCount: null,
        },
      ];

      const projected = listCategoriesTool.project!(tree) as any[];
      expect(projected[0].productCount).toBe(0);
      expect(projected[1].productCount).toBe(0);
    });

    it('projectCategoryTree sets children to [] when children is non-array at depth < maxDepth', () => {
      const tree = [
        {
          id: 'c-root',
          name: 'Danh mục gốc',
          slug: 'goc',
          children: null, // non-array
        },
        {
          id: 'c-root-2',
          name: 'Danh mục gốc 2',
          slug: 'goc-2',
          // children undefined
        },
      ];

      const projected = listCategoriesTool.project!(tree) as any[];
      expect(projected[0].children).toEqual([]);
      expect(projected[1].children).toEqual([]);
    });

    it('projectCategoryTree handles null items inside categories array', () => {
      const tree = [null];
      const projected = listCategoriesTool.project!(tree) as any[];
      expect(projected[0]).toEqual({
        id: undefined,
        name: undefined,
        slug: undefined,
        productCount: 0,
        children: [],
      });
    });
  });

  describe('Summarize function edge cases for all 12 catalog tools', () => {
    it('list_products summarize handles undefined or missing search', () => {
      expect(listProductsTool.summarize(undefined as any)).toBe(
        'Xem danh sách sản phẩm',
      );
      expect(listProductsTool.summarize({})).toBe('Xem danh sách sản phẩm');
      expect(listProductsTool.summarize({ search: 'tinh dau' })).toBe(
        'Tìm kiếm sản phẩm "tinh dau"',
      );
    });

    it('get_product summarize mentions id', () => {
      expect(getProductTool.summarize({ id: 'p-999' })).toBe(
        'Xem thông tin chi tiết sản phẩm p-999',
      );
    });

    it('create_product summarize mentions product name', () => {
      expect(
        createProductTool.summarize({ name: 'Nước hoa hồng' } as any),
      ).toBe('Tạo sản phẩm mới "Nước hoa hồng"');
    });

    it('update_product summarize mentions product id', () => {
      expect(updateProductTool.summarize({ id: 'p-777' } as any)).toBe(
        'Cập nhật sản phẩm p-777',
      );
    });

    it('create_variant summarize mentions product id', () => {
      expect(createVariantTool.summarize({ productId: 'p-888' } as any)).toBe(
        'Tạo biến thể mới cho sản phẩm p-888',
      );
    });

    it('update_variant summarize mentions variant id', () => {
      expect(updateVariantTool.summarize({ variantId: 'v-555' } as any)).toBe(
        'Cập nhật biến thể v-555',
      );
    });

    it('delete_product summarize mentions product id', () => {
      expect(deleteProductTool.summarize({ id: 'p-444' } as any)).toBe(
        'Xóa sản phẩm p-444',
      );
    });

    it('delete_variant summarize mentions variant id', () => {
      expect(deleteVariantTool.summarize({ variantId: 'v-333' } as any)).toBe(
        'Xóa biến thể v-333',
      );
    });

    it('list_categories summarize returns static line', () => {
      expect(listCategoriesTool.summarize({})).toBe('Xem danh mục sản phẩm');
    });

    it('create_category summarize mentions category name', () => {
      expect(
        createCategoryTool.summarize({ name: 'Xịt thơm quần áo' } as any),
      ).toBe('Tạo danh mục "Xịt thơm quần áo"');
    });

    it('update_category summarize mentions category id', () => {
      expect(updateCategoryTool.summarize({ id: 'cat-222' } as any)).toBe(
        'Cập nhật danh mục cat-222',
      );
    });

    it('delete_category summarize mentions category id', () => {
      expect(deleteCategoryTool.summarize({ id: 'cat-111' } as any)).toBe(
        'Xóa danh mục cat-111',
      );
    });
  });

  describe('Dependency failure and error paths for all 12 catalog tools', () => {
    it('list_products propagates InternalServerErrorException on database error', async () => {
      mockProductsService.findAll.mockRejectedValue(
        new InternalServerErrorException('Lỗi kết nối cơ sở dữ liệu'),
      );

      await expect(listProductsTool.handler({}, adminCtx)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(listProductsTool.handler({}, adminCtx)).rejects.toThrow(
        'Lỗi kết nối cơ sở dữ liệu',
      );
    });

    it('get_product propagates NotFoundException when product is missing', async () => {
      mockProductsService.findOne.mockRejectedValue(
        new NotFoundException('Sản phẩm không tồn tại'),
      );

      await expect(
        getProductTool.handler({ id: 'p-not-found' }, adminCtx),
      ).rejects.toThrow(NotFoundException);
      await expect(
        getProductTool.handler({ id: 'p-not-found' }, adminCtx),
      ).rejects.toThrow('Sản phẩm không tồn tại');
    });

    it('create_product propagates ConflictException on duplicate name', async () => {
      mockProductsService.create.mockRejectedValue(
        new ConflictException('Tên sản phẩm đã tồn tại trong hệ thống'),
      );

      const validDto = {
        name: 'Trùng lặp tên',
        description: 'Mô tả hợp lệ cho sản phẩm',
        images: ['https://example.com/img.jpg'],
        categoryId: 'cat-1',
        basePrice: 100000,
        variants: [
          {
            scent: 'Hoa bưởi',
            volumeMl: 100,
            price: 100000,
            stock: 10,
          },
        ],
      };

      await expect(
        createProductTool.handler(validDto, adminCtx),
      ).rejects.toThrow(ConflictException);
      await expect(
        createProductTool.handler(validDto, adminCtx),
      ).rejects.toThrow('Tên sản phẩm đã tồn tại trong hệ thống');
    });

    it('update_product throws ToolError when no update fields are passed', async () => {
      await expect(
        updateProductTool.handler({ id: 'prod-target' }, adminCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        updateProductTool.handler({ id: 'prod-target' }, adminCtx),
      ).rejects.toThrow('Cần ít nhất một trường để cập nhật sản phẩm ngoài id');
    });

    it('update_product propagates NotFoundException when target product is not found', async () => {
      mockProductsService.update.mockRejectedValue(
        new NotFoundException('Sản phẩm không tồn tại'),
      );

      await expect(
        updateProductTool.handler(
          { id: 'p-missing', name: 'Tên mới' },
          adminCtx,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        updateProductTool.handler(
          { id: 'p-missing', name: 'Tên mới' },
          adminCtx,
        ),
      ).rejects.toThrow('Sản phẩm không tồn tại');
    });

    it('create_variant propagates NotFoundException when parent product is not found', async () => {
      mockProductsService.createVariant.mockRejectedValue(
        new NotFoundException('Sản phẩm cha không tồn tại'),
      );

      const variantDto = {
        productId: 'p-missing',
        scent: 'Hoa hồng',
        volumeMl: 100,
        price: 120000,
        stock: 50,
      };

      await expect(
        createVariantTool.handler(variantDto, adminCtx),
      ).rejects.toThrow(NotFoundException);
      await expect(
        createVariantTool.handler(variantDto, adminCtx),
      ).rejects.toThrow('Sản phẩm cha không tồn tại');
    });

    it('update_variant throws ToolError when no update fields are passed', async () => {
      await expect(
        updateVariantTool.handler({ variantId: 'var-empty' }, adminCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        updateVariantTool.handler({ variantId: 'var-empty' }, adminCtx),
      ).rejects.toThrow(
        'Cần ít nhất một trường để cập nhật biến thể ngoài variantId',
      );
    });

    it('update_variant propagates NotFoundException when target variant is not found', async () => {
      mockProductsService.updateVariant.mockRejectedValue(
        new NotFoundException('Biến thể không tồn tại'),
      );

      await expect(
        updateVariantTool.handler(
          { variantId: 'var-missing', price: 90000 },
          adminCtx,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        updateVariantTool.handler(
          { variantId: 'var-missing', price: 90000 },
          adminCtx,
        ),
      ).rejects.toThrow('Biến thể không tồn tại');
    });

    it('delete_product propagates BadRequestException when product cannot be deleted', async () => {
      mockProductsService.remove.mockRejectedValue(
        new BadRequestException(
          'Không thể xóa sản phẩm đã có trong đơn hàng hoặc giỏ hàng',
        ),
      );

      await expect(
        deleteProductTool.handler({ id: 'p-ordered' }, adminCtx),
      ).rejects.toThrow(BadRequestException);
      await expect(
        deleteProductTool.handler({ id: 'p-ordered' }, adminCtx),
      ).rejects.toThrow(
        'Không thể xóa sản phẩm đã có trong đơn hàng hoặc giỏ hàng',
      );
    });

    it('delete_variant propagates BadRequestException when variant cannot be deleted', async () => {
      mockProductsService.removeVariant.mockRejectedValue(
        new BadRequestException(
          'Không thể xóa biến thể cuối cùng của sản phẩm',
        ),
      );

      await expect(
        deleteVariantTool.handler({ variantId: 'var-last' }, adminCtx),
      ).rejects.toThrow(BadRequestException);
      await expect(
        deleteVariantTool.handler({ variantId: 'var-last' }, adminCtx),
      ).rejects.toThrow('Không thể xóa biến thể cuối cùng của sản phẩm');
    });

    it('list_categories propagates Error when category service fails', async () => {
      mockCategoriesService.getTreeStructure.mockRejectedValue(
        new Error('Lỗi truy vấn danh mục cây'),
      );

      await expect(listCategoriesTool.handler({}, adminCtx)).rejects.toThrow(
        Error,
      );
      await expect(listCategoriesTool.handler({}, adminCtx)).rejects.toThrow(
        'Lỗi truy vấn danh mục cây',
      );
    });

    it('create_category propagates ConflictException on duplicate category name', async () => {
      mockCategoriesService.create.mockRejectedValue(
        new ConflictException('Danh mục đã tồn tại'),
      );

      await expect(
        createCategoryTool.handler({ name: 'Trùng lặp' }, adminCtx),
      ).rejects.toThrow(ConflictException);
      await expect(
        createCategoryTool.handler({ name: 'Trùng lặp' }, adminCtx),
      ).rejects.toThrow('Danh mục đã tồn tại');
    });

    it('update_category throws ToolError when both name and parentId are undefined', async () => {
      await expect(
        updateCategoryTool.handler({ id: 'cat-empty' }, adminCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        updateCategoryTool.handler({ id: 'cat-empty' }, adminCtx),
      ).rejects.toThrow(
        'Cần ít nhất một trong hai trường name hoặc parentId để cập nhật danh mục',
      );
    });

    it('update_category propagates NotFoundException when category does not exist', async () => {
      mockCategoriesService.update.mockRejectedValue(
        new NotFoundException('Danh mục không tồn tại'),
      );

      await expect(
        updateCategoryTool.handler(
          { id: 'cat-missing', name: 'Tên mới' },
          adminCtx,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        updateCategoryTool.handler(
          { id: 'cat-missing', name: 'Tên mới' },
          adminCtx,
        ),
      ).rejects.toThrow('Danh mục không tồn tại');
    });

    it('delete_category propagates BadRequestException when category has children', async () => {
      mockCategoriesService.remove.mockRejectedValue(
        new BadRequestException('Không thể xóa danh mục có danh mục con'),
      );

      await expect(
        deleteCategoryTool.handler({ id: 'cat-parent' }, adminCtx),
      ).rejects.toThrow(BadRequestException);
      await expect(
        deleteCategoryTool.handler({ id: 'cat-parent' }, adminCtx),
      ).rejects.toThrow('Không thể xóa danh mục có danh mục con');
    });
  });

  describe('Schema validation boundary cases', () => {
    it('create_product rejects when variants array has > 20 items or basePrice < 0', () => {
      const basePayload = {
        name: 'Sản phẩm thử nghiệm',
        description: 'Mô tả sản phẩm',
        images: ['https://example.com/img.png'],
        categoryId: 'cat-1',
        basePrice: 50000,
        variants: [
          {
            scent: 'Cam',
            volumeMl: 50,
            price: 50000,
            stock: 10,
          },
        ],
      };

      const payloadTooManyVariants = {
        ...basePayload,
        variants: Array.from({ length: 21 }, (_, i) => ({
          scent: `Scent ${i + 1}`,
          volumeMl: 50,
          price: 50000,
          stock: 5,
        })),
      };
      expect(
        createProductTool.schema.safeParse(payloadTooManyVariants).success,
      ).toBe(false);

      const payloadNegativeBasePrice = {
        ...basePayload,
        basePrice: -1,
      };
      expect(
        createProductTool.schema.safeParse(payloadNegativeBasePrice).success,
      ).toBe(false);
    });

    it('create_variant rejects when price < 0 or stock < 0 or barcode > 64 chars', () => {
      const valid = {
        productId: 'p-1',
        scent: 'Chanh',
        volumeMl: 100,
        price: 50000,
        stock: 10,
      };

      expect(
        createVariantTool.schema.safeParse({ ...valid, price: -100 }).success,
      ).toBe(false);
      expect(
        createVariantTool.schema.safeParse({ ...valid, stock: -5 }).success,
      ).toBe(false);
      expect(
        createVariantTool.schema.safeParse({
          ...valid,
          barcode: 'b'.repeat(65),
        }).success,
      ).toBe(false);
    });

    it('delete_product and delete_category reject empty id or id > 64 chars', () => {
      expect(deleteProductTool.schema.safeParse({ id: '' }).success).toBe(
        false,
      );
      expect(
        deleteProductTool.schema.safeParse({ id: 'a'.repeat(65) }).success,
      ).toBe(false);
      expect(
        deleteProductTool.schema.safeParse({ id: 'valid-id' }).success,
      ).toBe(true);

      expect(deleteCategoryTool.schema.safeParse({ id: '' }).success).toBe(
        false,
      );
      expect(
        deleteCategoryTool.schema.safeParse({ id: 'a'.repeat(65) }).success,
      ).toBe(false);
      expect(
        deleteCategoryTool.schema.safeParse({ id: 'valid-id' }).success,
      ).toBe(true);
    });
  });
});
