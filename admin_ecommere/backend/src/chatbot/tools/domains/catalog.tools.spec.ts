import { createAdminCatalogTools, AdminCatalogToolDeps } from './catalog.tools';
import { AgentToolDef, ToolContext } from '../tool.types';
import { ToolError } from '../tool-result.util';
import type { ProductsService } from '../../../products/products.service';
import type { CategoriesService } from '../../../categories/categories.service';

describe('Admin Catalog Tools', () => {
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
    userId: 'admin-123',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'thread-admin-1',
  };

  beforeEach(() => {
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

  describe('Factory and General Requirements', () => {
    it('returns exactly 12 tools with unique names', () => {
      expect(tools).toHaveLength(12);
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(12);
      expect(names).toEqual([
        'list_products',
        'get_product',
        'create_product',
        'update_product',
        'create_variant',
        'update_variant',
        'delete_product',
        'delete_variant',
        'list_categories',
        'create_category',
        'update_category',
        'delete_category',
      ]);
    });

    it('sets auth to "admin" on all tools', () => {
      for (const tool of tools) {
        expect(tool.auth).toBe('admin');
      }
    });

    it('sets domain to "catalog" on all tools', () => {
      for (const tool of tools) {
        expect(tool.domain).toBe('catalog');
      }
    });

    it('assigns correct risk levels: delete_product, delete_variant, and delete_category are DESTRUCTIVE, other write tools are WRITE, read tools are READ', () => {
      expect(deleteProductTool.risk).toBe('DESTRUCTIVE');
      expect(deleteVariantTool.risk).toBe('DESTRUCTIVE');
      expect(deleteCategoryTool.risk).toBe('DESTRUCTIVE');

      expect(createProductTool.risk).toBe('WRITE');
      expect(updateProductTool.risk).toBe('WRITE');
      expect(createVariantTool.risk).toBe('WRITE');
      expect(updateVariantTool.risk).toBe('WRITE');
      expect(createCategoryTool.risk).toBe('WRITE');
      expect(updateCategoryTool.risk).toBe('WRITE');

      expect(listProductsTool.risk).toBe('READ');
      expect(getProductTool.risk).toBe('READ');
      expect(listCategoriesTool.risk).toBe('READ');
    });

    it('enforces strict schema on all tools (rejects unknown properties)', () => {
      for (const tool of tools) {
        const result = tool.schema.safeParse({ unexpectedProperty: 'value' });
        expect(result.success).toBe(false);
      }
    });

    it('does not include userId or role in any schema', () => {
      for (const tool of tools) {
        expect(tool.schema.shape).not.toHaveProperty('userId');
        expect(tool.schema.shape).not.toHaveProperty('role');

        const checkUserId = tool.schema.safeParse({ userId: 'user-1' });
        expect(checkUserId.success).toBe(false);

        const checkRole = tool.schema.safeParse({ role: 'ADMIN' });
        expect(checkRole.success).toBe(false);
      }
    });

    it('ensures each tool has a summarize function returning a short Vietnamese string', () => {
      for (const tool of tools) {
        const summary = tool.summarize({
          id: 'id-1',
          name: 'Hoa Hồng',
          productId: 'prod-1',
          variantId: 'var-1',
          search: 'lavender',
        });
        expect(typeof summary).toBe('string');
        expect(summary.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('list_products', () => {
    it('has risk READ and calls products.findAll with expected arguments including includeInactive === true', async () => {
      expect(listProductsTool.risk).toBe('READ');
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      mockProductsService.findAll.mockResolvedValue(mockResult);

      const args = {
        search: 'xit phong',
        categoryId: 'cat-1',
        includeInactive: true,
        page: 2,
        limit: 10,
      };
      const result = await listProductsTool.handler(args, adminCtx);

      expect(mockProductsService.findAll).toHaveBeenCalledTimes(1);
      expect(mockProductsService.findAll).toHaveBeenCalledWith(
        {
          search: 'xit phong',
          categoryId: 'cat-1',
          page: 2,
          limit: 10,
        },
        true,
      );
      expect(result).toBe(mockResult);
    });

    it('passes includeInactive === false when false or omitted', async () => {
      await listProductsTool.handler({}, adminCtx);
      expect(mockProductsService.findAll).toHaveBeenCalledWith(
        {
          search: undefined,
          categoryId: undefined,
          page: undefined,
          limit: undefined,
        },
        false,
      );

      mockProductsService.findAll.mockClear();
      await listProductsTool.handler({ includeInactive: false }, adminCtx);
      expect(mockProductsService.findAll).toHaveBeenCalledWith(
        {
          search: undefined,
          categoryId: undefined,
          page: undefined,
          limit: undefined,
        },
        false,
      );
    });

    it('validates schema bounds (page 1..50, limit 1..50, search 1..100)', () => {
      expect(listProductsTool.schema.safeParse({ page: 0 }).success).toBe(
        false,
      );
      expect(listProductsTool.schema.safeParse({ page: 51 }).success).toBe(
        false,
      );
      expect(listProductsTool.schema.safeParse({ limit: 0 }).success).toBe(
        false,
      );
      expect(listProductsTool.schema.safeParse({ limit: 51 }).success).toBe(
        false,
      );
      expect(listProductsTool.schema.safeParse({ search: '' }).success).toBe(
        false,
      );
      expect(
        listProductsTool.schema.safeParse({ search: 'a'.repeat(101) }).success,
      ).toBe(false);
      expect(
        listProductsTool.schema.safeParse({
          search: 'a'.repeat(100),
          page: 50,
          limit: 50,
        }).success,
      ).toBe(true);
    });

    it('project() keeps at most 20 items and at most 3 variants per product', () => {
      const rawProducts = Array.from({ length: 25 }, (_, i) => ({
        id: `prod-${i + 1}`,
        name: `Product ${i + 1}`,
        slug: `product-${i + 1}`,
        brand: 'Brand X',
        active: true,
        basePrice: 100000,
        description: 'Detailed description should be omitted',
        extraField: 'should-be-omitted',
        variants: Array.from({ length: 5 }, (_, vi) => ({
          id: `var-${i + 1}-${vi + 1}`,
          sku: `SKU-${vi + 1}`,
          scent: `Scent ${vi + 1}`,
          volumeMl: 100,
          price: 100000,
          salePrice: 90000,
          stock: 20,
          barcode: '123456',
        })),
      }));

      const paginatedResult = {
        data: rawProducts,
        total: 25,
        page: 1,
        limit: 25,
      };

      const projected = listProductsTool.project!(paginatedResult) as {
        data: Array<Record<string, unknown>>;
      };

      expect(projected.data).toHaveLength(20);
      expect(projected.data[0].id).toBe('prod-1');
      expect(projected.data[0].name).toBe('Product 1');
      expect(projected.data[0].slug).toBe('product-1');
      expect(projected.data[0].active).toBe(true);
      expect(projected.data[0].basePrice).toBe(100000);
      expect(projected.data[0]).not.toHaveProperty('brand');
      expect(projected.data[0]).not.toHaveProperty('description');
      expect(projected.data[0]).not.toHaveProperty('extraField');

      const variants = projected.data[0].variants as Array<
        Record<string, unknown>
      >;
      expect(variants).toHaveLength(3);
      expect(variants[0]).toEqual({
        id: 'var-1-1',
        scent: 'Scent 1',
        volumeMl: 100,
        price: 100000,
        salePrice: 90000,
        stock: 20,
      });
      expect(variants[0]).not.toHaveProperty('sku');
      expect(variants[0]).not.toHaveProperty('barcode');
    });

    it('summarize returns a Vietnamese line', () => {
      expect(listProductsTool.summarize({})).toBe('Xem danh sách sản phẩm');
      expect(listProductsTool.summarize({ search: 'lavender' })).toBe(
        'Tìm kiếm sản phẩm "lavender"',
      );
    });
  });

  describe('get_product', () => {
    it('has risk READ and calls products.findOne with id and true (includeInactive)', async () => {
      expect(getProductTool.risk).toBe('READ');
      mockProductsService.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Sản phẩm 1',
      });

      const result = await getProductTool.handler({ id: 'prod-1' }, adminCtx);

      expect(mockProductsService.findOne).toHaveBeenCalledTimes(1);
      expect(mockProductsService.findOne).toHaveBeenCalledWith('prod-1', true);
      expect(result).toEqual({ id: 'prod-1', name: 'Sản phẩm 1' });
    });

    it('project() cuts a description longer than 300 characters', () => {
      const longDescription = 'D'.repeat(350);
      const rawProduct = {
        id: 'prod-1',
        name: 'Sản phẩm 1',
        slug: 'san-pham-1',
        brand: 'Aroma',
        active: true,
        basePrice: 150000,
        description: longDescription,
        unwantedField: 'remove',
        variants: [],
      };

      const projected = getProductTool.project!(rawProduct) as Record<
        string,
        unknown
      >;

      expect(projected.description).toHaveLength(300);
      expect(projected.description).toBe('D'.repeat(300));
      expect(projected).not.toHaveProperty('unwantedField');
    });

    it('project() keeps at most 20 variants and preserves barcode', () => {
      const rawProduct = {
        id: 'prod-1',
        name: 'Sản phẩm 1',
        slug: 'san-pham-1',
        brand: 'Aroma',
        active: false,
        basePrice: 200000,
        description: 'Mô tả ngắn',
        variants: Array.from({ length: 25 }, (_, i) => ({
          id: `var-${i + 1}`,
          scent: `Hương ${i + 1}`,
          volumeMl: 50,
          price: 200000,
          salePrice: 180000,
          stock: 10,
          barcode: `BARCODE-${i + 1}`,
          secretCost: 50000,
        })),
      };

      const projected = getProductTool.project!(rawProduct) as {
        variants: Array<Record<string, unknown>>;
      };

      expect(projected.variants).toHaveLength(20);
      expect(projected.variants[0]).toEqual({
        id: 'var-1',
        scent: 'Hương 1',
        volumeMl: 50,
        price: 200000,
        salePrice: 180000,
        stock: 10,
        barcode: 'BARCODE-1',
      });
      expect(projected.variants[0]).not.toHaveProperty('secretCost');
    });

    it('summarize returns a Vietnamese line', () => {
      expect(getProductTool.summarize({ id: 'prod-123' })).toBe(
        'Xem thông tin chi tiết sản phẩm prod-123',
      );
    });
  });

  describe('create_product', () => {
    const validCreateProductPayload = {
      name: 'Xịt phòng hoa oải hương',
      description: 'Hương thơm lavender dịu nhẹ nhập khẩu từ Pháp',
      brand: 'Thai Aroma',
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      categoryId: 'cat-leaf-1',
      basePrice: 180000,
      active: true,
      variants: [
        {
          scent: 'Lavender',
          volumeMl: 250,
          price: 180000,
          salePrice: 150000,
          stock: 100,
          barcode: '89300001',
        },
      ],
    };

    it('has risk WRITE, exact description, and calls products.create with expected DTO', async () => {
      expect(createProductTool.risk).toBe('WRITE');
      expect(createProductTool.description).toBe(
        'Tạo sản phẩm mới kèm các biến thể. Giá tính bằng VND. Danh mục phải là danh mục lá.',
      );

      mockProductsService.create.mockResolvedValue({
        id: 'prod-created',
        ...validCreateProductPayload,
      });

      const result = await createProductTool.handler(
        validCreateProductPayload,
        adminCtx,
      );

      expect(mockProductsService.create).toHaveBeenCalledTimes(1);
      expect(mockProductsService.create).toHaveBeenCalledWith(
        validCreateProductPayload,
      );
      expect(result).toEqual({
        id: 'prod-created',
        ...validCreateProductPayload,
      });
    });

    it('rejects an empty variants array', () => {
      const payloadWithEmptyVariants = {
        ...validCreateProductPayload,
        variants: [],
      };
      const res = createProductTool.schema.safeParse(payloadWithEmptyVariants);
      expect(res.success).toBe(false);
    });

    it('rejects a variant with volumeMl 0', () => {
      const payloadWithVolumeZero = {
        ...validCreateProductPayload,
        variants: [
          {
            ...validCreateProductPayload.variants[0],
            volumeMl: 0,
          },
        ],
      };
      const res = createProductTool.schema.safeParse(payloadWithVolumeZero);
      expect(res.success).toBe(false);
    });

    it('rejects an extra key (strict)', () => {
      const payloadWithExtra = {
        ...validCreateProductPayload,
        extraProperty: 'not allowed',
      };
      const res = createProductTool.schema.safeParse(payloadWithExtra);
      expect(res.success).toBe(false);
    });

    it('rejects an extra key inside variant (strict)', () => {
      const payloadWithVariantExtra = {
        ...validCreateProductPayload,
        variants: [
          {
            ...validCreateProductPayload.variants[0],
            extraVariantProp: 'forbidden',
          },
        ],
      };
      const res = createProductTool.schema.safeParse(payloadWithVariantExtra);
      expect(res.success).toBe(false);
    });

    it('summarize returns a Vietnamese line', () => {
      expect(
        createProductTool.summarize({ name: 'Xịt phòng hoa oải hương' } as any),
      ).toBe('Tạo sản phẩm mới "Xịt phòng hoa oải hương"');
    });
  });

  describe('update_product', () => {
    it('has risk WRITE and calls products.update with id and fields', async () => {
      expect(updateProductTool.risk).toBe('WRITE');
      mockProductsService.update.mockResolvedValue({
        id: 'prod-1',
        name: 'Tên mới',
        basePrice: 200000,
      });

      const args = {
        id: 'prod-1',
        name: 'Tên mới',
        basePrice: 200000,
      };

      const result = await updateProductTool.handler(args, adminCtx);

      expect(mockProductsService.update).toHaveBeenCalledTimes(1);
      expect(mockProductsService.update).toHaveBeenCalledWith('prod-1', {
        name: 'Tên mới',
        basePrice: 200000,
      });
      expect(result).toEqual({
        id: 'prod-1',
        name: 'Tên mới',
        basePrice: 200000,
      });
    });

    it('rejects a call with only id (handler check)', async () => {
      await expect(
        updateProductTool.handler({ id: 'prod-1' }, adminCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        updateProductTool.handler({ id: 'prod-1' }, adminCtx),
      ).rejects.toThrow('Cần ít nhất một trường để cập nhật sản phẩm ngoài id');
    });

    it('rejects a variants key (strict)', () => {
      const res = updateProductTool.schema.safeParse({
        id: 'prod-1',
        variants: [
          {
            scent: 'Lavender',
            volumeMl: 100,
            price: 100000,
            stock: 10,
          },
        ],
      });
      expect(res.success).toBe(false);
    });

    it('summarize returns a Vietnamese line', () => {
      expect(updateProductTool.summarize({ id: 'prod-1' } as any)).toBe(
        'Cập nhật sản phẩm prod-1',
      );
    });
  });

  describe('create_variant', () => {
    const validVariantArgs = {
      productId: 'prod-1',
      scent: 'Bạc hà',
      volumeMl: 150,
      price: 120000,
      salePrice: 100000,
      stock: 50,
      barcode: '89300022',
    };

    it('has risk WRITE and calls products.createVariant with productId and DTO', async () => {
      expect(createVariantTool.risk).toBe('WRITE');
      mockProductsService.createVariant.mockResolvedValue({
        id: 'var-new',
        ...validVariantArgs,
      });

      const result = await createVariantTool.handler(
        validVariantArgs,
        adminCtx,
      );

      expect(mockProductsService.createVariant).toHaveBeenCalledTimes(1);
      expect(mockProductsService.createVariant).toHaveBeenCalledWith('prod-1', {
        scent: 'Bạc hà',
        volumeMl: 150,
        price: 120000,
        salePrice: 100000,
        stock: 50,
        barcode: '89300022',
      });
      expect(result).toEqual({
        id: 'var-new',
        ...validVariantArgs,
      });
    });

    it('rejects volumeMl 0 and extra key (strict)', () => {
      expect(
        createVariantTool.schema.safeParse({
          ...validVariantArgs,
          volumeMl: 0,
        }).success,
      ).toBe(false);

      expect(
        createVariantTool.schema.safeParse({
          ...validVariantArgs,
          extraKey: 'invalid',
        }).success,
      ).toBe(false);
    });

    it('summarize returns a Vietnamese line', () => {
      expect(createVariantTool.summarize({ productId: 'prod-1' } as any)).toBe(
        'Tạo biến thể mới cho sản phẩm prod-1',
      );
    });
  });

  describe('update_variant', () => {
    it('has risk WRITE and calls products.updateVariant with variantId and fields', async () => {
      expect(updateVariantTool.risk).toBe('WRITE');
      mockProductsService.updateVariant.mockResolvedValue({
        id: 'var-1',
        price: 130000,
        barcode: 'BAR123',
      });

      const args = {
        variantId: 'var-1',
        price: 130000,
        barcode: 'BAR123',
      };

      const result = await updateVariantTool.handler(args, adminCtx);

      expect(mockProductsService.updateVariant).toHaveBeenCalledTimes(1);
      expect(mockProductsService.updateVariant).toHaveBeenCalledWith('var-1', {
        price: 130000,
        barcode: 'BAR123',
      });
      expect(result).toEqual({
        id: 'var-1',
        price: 130000,
        barcode: 'BAR123',
      });
    });

    it('rejects stock in input schema (audit ABA-06: stock changes must go through stock tools)', () => {
      const res = updateVariantTool.schema.safeParse({
        variantId: 'var-1',
        stock: 60,
      });
      expect(res.success).toBe(false);
    });

    it('rejects a call with only variantId (handler check)', async () => {
      await expect(
        updateVariantTool.handler({ variantId: 'var-1' }, adminCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        updateVariantTool.handler({ variantId: 'var-1' }, adminCtx),
      ).rejects.toThrow(
        'Cần ít nhất một trường để cập nhật biến thể ngoài variantId',
      );
    });

    it('accepts salePrice null to remove sale price and calls products.updateVariant', async () => {
      mockProductsService.updateVariant.mockResolvedValue({
        id: 'var-1',
        salePrice: null,
      });

      const parsed = updateVariantTool.schema.safeParse({
        variantId: 'var-1',
        salePrice: null,
      });
      expect(parsed.success).toBe(true);

      const result = await updateVariantTool.handler(
        { variantId: 'var-1', salePrice: null },
        adminCtx,
      );

      expect(mockProductsService.updateVariant).toHaveBeenCalledTimes(1);
      expect(mockProductsService.updateVariant).toHaveBeenCalledWith('var-1', {
        salePrice: null,
      });
      expect(result).toEqual({ id: 'var-1', salePrice: null });
    });

    it('accepts numeric salePrice and calls products.updateVariant', async () => {
      mockProductsService.updateVariant.mockResolvedValue({
        id: 'var-1',
        salePrice: 120000,
      });

      const parsed = updateVariantTool.schema.safeParse({
        variantId: 'var-1',
        salePrice: 120000,
      });
      expect(parsed.success).toBe(true);

      const result = await updateVariantTool.handler(
        { variantId: 'var-1', salePrice: 120000 },
        adminCtx,
      );

      expect(mockProductsService.updateVariant).toHaveBeenCalledWith('var-1', {
        salePrice: 120000,
      });
      expect(result).toEqual({ id: 'var-1', salePrice: 120000 });
    });

    it('rejects extra keys (strict)', () => {
      const res = updateVariantTool.schema.safeParse({
        variantId: 'var-1',
        price: 100000,
        unknownField: true,
      });
      expect(res.success).toBe(false);
    });

    it('summarize returns a Vietnamese line', () => {
      expect(updateVariantTool.summarize({ variantId: 'var-1' } as any)).toBe(
        'Cập nhật biến thể var-1',
      );
    });
  });

  describe('delete_product', () => {
    it('has risk DESTRUCTIVE, exact description, and calls products.remove with id', async () => {
      expect(deleteProductTool.risk).toBe('DESTRUCTIVE');
      expect(deleteProductTool.description).toBe(
        'Xóa sản phẩm. Không hoàn tác được. Bị từ chối nếu sản phẩm đã có trong giỏ hàng, đơn hàng hoặc lịch sử kho.',
      );

      mockProductsService.remove.mockResolvedValue({
        message: 'Product deleted successfully',
      });

      const result = await deleteProductTool.handler(
        { id: 'prod-1' },
        adminCtx,
      );

      expect(mockProductsService.remove).toHaveBeenCalledTimes(1);
      expect(mockProductsService.remove).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual({ message: 'Product deleted successfully' });
    });

    it('summarize returns a Vietnamese line', () => {
      expect(deleteProductTool.summarize({ id: 'prod-1' } as any)).toBe(
        'Xóa sản phẩm prod-1',
      );
    });
  });

  describe('delete_variant', () => {
    it('has risk DESTRUCTIVE and calls products.removeVariant with variantId', async () => {
      expect(deleteVariantTool.risk).toBe('DESTRUCTIVE');
      mockProductsService.removeVariant.mockResolvedValue({
        message: 'Variant deleted successfully',
      });

      const result = await deleteVariantTool.handler(
        { variantId: 'var-1' },
        adminCtx,
      );

      expect(mockProductsService.removeVariant).toHaveBeenCalledTimes(1);
      expect(mockProductsService.removeVariant).toHaveBeenCalledWith('var-1');
      expect(result).toEqual({ message: 'Variant deleted successfully' });
    });

    it('summarize returns a Vietnamese line', () => {
      expect(deleteVariantTool.summarize({ variantId: 'var-1' } as any)).toBe(
        'Xóa biến thể var-1',
      );
    });
  });

  describe('list_categories', () => {
    it('has risk READ and calls categories.getTreeStructure with no arguments', async () => {
      expect(listCategoriesTool.risk).toBe('READ');
      const mockTree = [
        {
          id: 'cat-1',
          name: 'Xịt phòng',
          slug: 'xit-phong',
          productCount: 10,
          children: [],
        },
      ];
      mockCategoriesService.getTreeStructure.mockResolvedValue(mockTree);

      const result = await listCategoriesTool.handler({}, adminCtx);

      expect(mockCategoriesService.getTreeStructure).toHaveBeenCalledTimes(1);
      expect(mockCategoriesService.getTreeStructure).toHaveBeenCalledWith();
      expect(result).toBe(mockTree);
    });

    it('project() exposes leaf categories in a three-level category tree', () => {
      const rawTree = [
        {
          id: 'root-1',
          name: 'Tinh Dầu & Xịt Phòng',
          slug: 'tinh-dau-xit-phong',
          productCount: 20,
          children: [
            {
              id: 'sub-1',
              name: 'Xịt phòng',
              slug: 'xit-phong',
              productCount: 15,
              children: [
                {
                  id: 'leaf-1',
                  name: 'Xịt phòng tự động',
                  slug: 'xit-phong-tu-dong',
                  productCount: 5,
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      const projected = listCategoriesTool.project!(rawTree) as any[];

      expect(projected).toEqual([
        {
          id: 'root-1',
          name: 'Tinh Dầu & Xịt Phòng',
          slug: 'tinh-dau-xit-phong',
          productCount: 20,
          children: [
            {
              id: 'sub-1',
              name: 'Xịt phòng',
              slug: 'xit-phong',
              productCount: 15,
              children: [
                {
                  id: 'leaf-1',
                  name: 'Xịt phòng tự động',
                  slug: 'xit-phong-tu-dong',
                  productCount: 5,
                },
              ],
            },
          ],
        },
      ]);
      expect(projected[0].children[0].children[0].id).toBe('leaf-1');
      expect(projected[0].children[0].children[0].children).toBeUndefined();
    });

    it('summarize returns a Vietnamese line', () => {
      expect(listCategoriesTool.summarize({})).toBe('Xem danh mục sản phẩm');
    });
  });

  describe('create_category', () => {
    it('has risk WRITE and calls categories.create with expected DTO', async () => {
      expect(createCategoryTool.risk).toBe('WRITE');
      mockCategoriesService.create.mockResolvedValue({
        id: 'cat-new',
        name: 'Nước hoa ô tô',
        parentId: 'cat-parent-1',
      });

      const args = {
        name: 'Nước hoa ô tô',
        parentId: 'cat-parent-1',
      };

      const result = await createCategoryTool.handler(args, adminCtx);

      expect(mockCategoriesService.create).toHaveBeenCalledTimes(1);
      expect(mockCategoriesService.create).toHaveBeenCalledWith(args);
      expect(result).toEqual({
        id: 'cat-new',
        name: 'Nước hoa ô tô',
        parentId: 'cat-parent-1',
      });
    });

    it('validates name length and optional parentId', () => {
      expect(createCategoryTool.schema.safeParse({ name: '' }).success).toBe(
        false,
      );
      expect(
        createCategoryTool.schema.safeParse({ name: 'a'.repeat(101) }).success,
      ).toBe(false);
      expect(
        createCategoryTool.schema.safeParse({ name: 'Hợp lệ' }).success,
      ).toBe(true);
      expect(
        createCategoryTool.schema.safeParse({ name: 'Hợp lệ', parentId: 'p-1' })
          .success,
      ).toBe(true);
    });

    it('summarize returns a Vietnamese line', () => {
      expect(
        createCategoryTool.summarize({ name: 'Nước hoa ô tô' } as any),
      ).toBe('Tạo danh mục "Nước hoa ô tô"');
    });
  });

  describe('update_category', () => {
    it('has risk WRITE and calls categories.update with id and fields', async () => {
      expect(updateCategoryTool.risk).toBe('WRITE');
      mockCategoriesService.update.mockResolvedValue({
        id: 'cat-1',
        name: 'Tên danh mục mới',
      });

      const args = {
        id: 'cat-1',
        name: 'Tên danh mục mới',
      };

      const result = await updateCategoryTool.handler(args, adminCtx);

      expect(mockCategoriesService.update).toHaveBeenCalledTimes(1);
      expect(mockCategoriesService.update).toHaveBeenCalledWith('cat-1', {
        name: 'Tên danh mục mới',
      });
      expect(result).toEqual({
        id: 'cat-1',
        name: 'Tên danh mục mới',
      });
    });

    it('rejects a call with only id (handler check)', async () => {
      await expect(
        updateCategoryTool.handler({ id: 'cat-1' }, adminCtx),
      ).rejects.toThrow(ToolError);
      await expect(
        updateCategoryTool.handler({ id: 'cat-1' }, adminCtx),
      ).rejects.toThrow(
        'Cần ít nhất một trong hai trường name hoặc parentId để cập nhật danh mục',
      );
    });

    it('accepts parentId only', async () => {
      mockCategoriesService.update.mockResolvedValue({
        id: 'cat-1',
        parentId: 'cat-parent-2',
      });

      await updateCategoryTool.handler(
        { id: 'cat-1', parentId: 'cat-parent-2' },
        adminCtx,
      );

      expect(mockCategoriesService.update).toHaveBeenCalledWith('cat-1', {
        parentId: 'cat-parent-2',
      });
    });

    it('summarize returns a Vietnamese line', () => {
      expect(updateCategoryTool.summarize({ id: 'cat-1' } as any)).toBe(
        'Cập nhật danh mục cat-1',
      );
    });
  });

  describe('delete_category', () => {
    it('has risk DESTRUCTIVE and calls categories.remove with id', async () => {
      expect(deleteCategoryTool.risk).toBe('DESTRUCTIVE');
      mockCategoriesService.remove.mockResolvedValue({
        message: 'Category deleted successfully',
      });

      const result = await deleteCategoryTool.handler(
        { id: 'cat-1' },
        adminCtx,
      );

      expect(mockCategoriesService.remove).toHaveBeenCalledTimes(1);
      expect(mockCategoriesService.remove).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual({ message: 'Category deleted successfully' });
    });

    it('summarize returns a Vietnamese line', () => {
      expect(deleteCategoryTool.summarize({ id: 'cat-1' } as any)).toBe(
        'Xóa danh mục cat-1',
      );
    });
  });
});
