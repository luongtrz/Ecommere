import { createCatalogTools, CatalogToolDeps } from './catalog.tools';
import { ProductSortBy } from '../../../products/dtos/product-filter.dto';
import type { ProductsService } from '../../../products/products.service';
import type { CategoriesService } from '../../../categories/categories.service';
import type { ChatbotRetrievalService } from '../../chatbot-retrieval.service';
import { ToolContext } from '../tool.types';

describe('Catalog Tools', () => {
  let mockProductsService: jest.Mocked<Partial<ProductsService>>;
  let mockCategoriesService: jest.Mocked<Partial<CategoriesService>>;
  let mockRetrievalService: jest.Mocked<Partial<ChatbotRetrievalService>>;
  let deps: CatalogToolDeps;
  let dummyContext: ToolContext;

  beforeEach(() => {
    mockProductsService = {
      findAll: jest.fn(),
      findBySlug: jest.fn(),
      findOne: jest.fn(),
      getFilterOptions: jest.fn(),
    };

    mockCategoriesService = {
      getTreeStructure: jest.fn(),
    };

    mockRetrievalService = {
      buildCatalogContext: jest.fn(),
    };

    deps = {
      products: mockProductsService as unknown as ProductsService,
      categories: mockCategoriesService as unknown as CategoriesService,
      retrieval: mockRetrievalService as unknown as ChatbotRetrievalService,
    };

    dummyContext = {
      userId: null,
      role: 'GUEST',
      app: 'USER',
      threadId: 'test-thread',
    };
  });

  describe('createCatalogTools factory', () => {
    it('returns 5 tools with unique names, all auth "public" and risk "READ"', () => {
      const tools = createCatalogTools(deps);
      expect(tools).toHaveLength(5);

      const toolNames = tools.map((t) => t.name);
      const uniqueNames = new Set(toolNames);
      expect(uniqueNames.size).toBe(5);

      expect(toolNames).toEqual(
        expect.arrayContaining([
          'search_products',
          'get_product',
          'get_product_filters',
          'list_categories',
          'recommend_products',
        ]),
      );

      for (const tool of tools) {
        expect(tool.auth).toBe('public');
        expect(tool.risk).toBe('READ');
        expect(tool.domain).toBe('catalog');
        expect(typeof tool.description).toBe('string');
        expect(tool.description.length).toBeGreaterThan(0);
        expect(typeof tool.summarize).toBe('function');
        expect(typeof tool.handler).toBe('function');
      }
    });

    it('ensures no tool schema allows userId or role', () => {
      const tools = createCatalogTools(deps);
      for (const tool of tools) {
        const withUserId = tool.schema.safeParse({
          userId: 'injected-user-id',
        });
        expect(withUserId.success).toBe(false);

        const withRole = tool.schema.safeParse({ role: 'ADMIN' });
        expect(withRole.success).toBe(false);
      }
    });
  });

  describe('search_products tool', () => {
    it('calls products.findAll with expected ProductFilterDto-compatible arguments', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'search_products')!;

      const mockResult = {
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: true,
      };
      (mockProductsService.findAll as jest.Mock).mockResolvedValue(mockResult);

      const validArgs = {
        query: 'nước hoa xạ hương',
        categoryId: 'cat-woody',
        minPrice: 150000,
        maxPrice: 500000,
        sortBy: ProductSortBy.PRICE_ASC,
        page: 2,
        limit: 10,
      };
      const parsedArgs = tool.schema.parse(validArgs);
      const result = await tool.handler(parsedArgs, dummyContext);

      expect(mockProductsService.findAll).toHaveBeenCalledWith({
        search: 'nước hoa xạ hương',
        categoryId: 'cat-woody',
        minPrice: 150000,
        maxPrice: 500000,
        sortBy: ProductSortBy.PRICE_ASC,
        page: 2,
        limit: 10,
      });
      expect(result).toBe(mockResult);
    });

    it('defaults limit to 8 when omitted', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'search_products')!;

      (mockProductsService.findAll as jest.Mock).mockResolvedValue({
        data: [],
      });

      const parsedArgs = tool.schema.parse({ query: 'chanel' });
      expect(parsedArgs.limit).toBe(8);

      await tool.handler(parsedArgs, dummyContext);

      expect(mockProductsService.findAll).toHaveBeenCalledWith({
        search: 'chanel',
        limit: 8,
      });
    });

    it('rejects an extra key (strict) and a limit of 21', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'search_products')!;

      // Rejects extra key
      const extraKeyParse = tool.schema.safeParse({
        query: 'nước hoa',
        unrecognizedField: 'extra',
      });
      expect(extraKeyParse.success).toBe(false);
      expect(() =>
        tool.schema.parse({ query: 'nước hoa', unrecognizedField: 'extra' }),
      ).toThrow();

      // Rejects limit of 21
      const limit21Parse = tool.schema.safeParse({ limit: 21 });
      expect(limit21Parse.success).toBe(false);
      expect(() => tool.schema.parse({ limit: 21 })).toThrow();

      // Accepts limit of 20
      const limit20Parse = tool.schema.safeParse({ limit: 20 });
      expect(limit20Parse.success).toBe(true);

      // Rejects limit of 0
      const limit0Parse = tool.schema.safeParse({ limit: 0 });
      expect(limit0Parse.success).toBe(false);

      // Rejects page 0 and page 51
      expect(tool.schema.safeParse({ page: 0 }).success).toBe(false);
      expect(tool.schema.safeParse({ page: 51 }).success).toBe(false);
      expect(tool.schema.safeParse({ page: 50 }).success).toBe(true);

      // Rejects negative minPrice
      expect(tool.schema.safeParse({ minPrice: -100 }).success).toBe(false);

      // Rejects query longer than 120 characters
      expect(tool.schema.safeParse({ query: 'a'.repeat(121) }).success).toBe(
        false,
      );
      expect(tool.schema.safeParse({ query: 'a'.repeat(120) }).success).toBe(
        true,
      );
    });

    it('summarize returns a short Vietnamese line', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'search_products')!;

      expect(tool.summarize({ query: 'nước hoa' } as any)).toBe(
        'Tìm kiếm sản phẩm "nước hoa"',
      );
      expect(tool.summarize({} as any)).toBe('Tìm kiếm danh sách sản phẩm');
    });

    it('project keeps at most 8 items for lists and trims product and variant fields', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'search_products')!;

      const rawProducts = Array.from({ length: 10 }, (_, index) => ({
        id: `prod-${index + 1}`,
        name: `Sản phẩm ${index + 1}`,
        slug: `san-pham-${index + 1}`,
        brand: 'Thai Spray',
        basePrice: 150000,
        description: `Mô tả chi tiết sản phẩm ${index + 1}`,
        categoryId: 'cat-1',
        createdAt: new Date(),
        variants: [
          {
            id: `v-${index}-1`,
            sku: `SKU-${index}-1`,
            scent: 'Hoa hồng',
            volumeMl: 50,
            price: 150000,
            salePrice: 120000,
            stock: 10,
            barcode: '111',
          },
          {
            id: `v-${index}-2`,
            sku: `SKU-${index}-2`,
            scent: 'Vani',
            volumeMl: 100,
            price: 250000,
            salePrice: null,
            stock: 5,
            barcode: '222',
          },
          {
            id: `v-${index}-3`,
            sku: `SKU-${index}-3`,
            scent: 'Gỗ đàn hương',
            volumeMl: 30,
            price: 100000,
            salePrice: 90000,
            stock: 3,
            barcode: '333',
          },
          {
            id: `v-${index}-4`,
            sku: `SKU-${index}-4`,
            scent: 'Cam Bergamot',
            volumeMl: 20,
            price: 80000,
            salePrice: null,
            stock: 0,
            barcode: '444',
          },
        ],
      }));

      const paginatedResult = {
        data: rawProducts,
        total: 10,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      const projected: any = tool.project!(paginatedResult);

      expect(projected.data).toHaveLength(8);
      expect(projected.data[0]).toEqual({
        id: 'prod-1',
        name: 'Sản phẩm 1',
        slug: 'san-pham-1',
        brand: 'Thai Spray',
        basePrice: 150000,
        variants: [
          {
            id: 'v-0-1',
            scent: 'Hoa hồng',
            volumeMl: 50,
            price: 150000,
            salePrice: 120000,
            stock: 10,
          },
          {
            id: 'v-0-2',
            scent: 'Vani',
            volumeMl: 100,
            price: 250000,
            salePrice: null,
            stock: 5,
          },
          {
            id: 'v-0-3',
            scent: 'Gỗ đàn hương',
            volumeMl: 30,
            price: 100000,
            salePrice: 90000,
            stock: 3,
          },
        ],
      });

      expect(projected.data[0].variants).toHaveLength(3);
      expect(projected.data[0].variants[0].id).toBe('v-0-1');
      expect(projected.data[0].description).toBeUndefined();
      expect(projected.data[0].categoryId).toBeUndefined();
    });
  });

  describe('get_product tool', () => {
    it('calls products.findBySlug with the expected slug', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'get_product')!;

      const mockProduct = {
        id: 'prod-spray-1',
        name: 'Xịt thơm body',
        slug: 'xit-thom-body',
      };
      (mockProductsService.findBySlug as jest.Mock).mockResolvedValue(
        mockProduct,
      );

      const parsedArgs = tool.schema.parse({ slug: 'xit-thom-body' });
      const result = await tool.handler(parsedArgs, dummyContext);

      expect(mockProductsService.findBySlug).toHaveBeenCalledWith(
        'xit-thom-body',
      );
      expect(result).toBe(mockProduct);
    });

    it('rejects an empty slug', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'get_product')!;

      const emptySlugParse = tool.schema.safeParse({ slug: '' });
      expect(emptySlugParse.success).toBe(false);
      expect(() => tool.schema.parse({ slug: '' })).toThrow();

      const validSlugParse = tool.schema.safeParse({ slug: 'nuoc-hoa-nam' });
      expect(validSlugParse.success).toBe(true);

      const extraKeyParse = tool.schema.safeParse({
        slug: 'nuoc-hoa-nam',
        extra: 'field',
      });
      expect(extraKeyParse.success).toBe(false);
    });

    it('summarize returns a short Vietnamese line', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'get_product')!;

      expect(tool.summarize({ slug: 'xit-khoang-thai' } as any)).toBe(
        'Xem chi tiết sản phẩm "xit-khoang-thai"',
      );
    });

    it('project() of get_product keeps at most 3 variants', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'get_product')!;

      const rawProduct = {
        id: 'prod-42',
        name: 'Nước hoa hoàng gia',
        slug: 'nuoc-hoa-hoang-gia',
        brand: 'Royal Oud',
        basePrice: 650000,
        description: 'Mô tả không cần thiết cho mô hình',
        images: ['https://example.com/p1.jpg'],
        reviews: [{ id: 'rev-1', rating: 5 }],
        variants: [
          {
            id: 'v-1',
            sku: 'RO-OUD-50',
            scent: 'Trầm hương',
            volumeMl: 50,
            price: 650000,
            salePrice: 600000,
            stock: 8,
          },
          {
            id: 'v-2',
            sku: 'RO-AMB-100',
            scent: 'Hổ phách',
            volumeMl: 100,
            price: 950000,
            salePrice: null,
            stock: 4,
          },
          {
            id: 'v-3',
            sku: 'RO-MUS-30',
            scent: 'Xạ hương',
            volumeMl: 30,
            price: 450000,
            salePrice: 400000,
            stock: 0,
          },
          {
            id: 'v-4',
            sku: 'RO-ROSE-50',
            scent: 'Hoa hồng Damask',
            volumeMl: 50,
            price: 680000,
            salePrice: null,
            stock: 12,
          },
          {
            id: 'v-5',
            sku: 'RO-JAS-50',
            scent: 'Hoa nhài tây',
            volumeMl: 50,
            price: 670000,
            salePrice: 620000,
            stock: 3,
          },
        ],
      };

      const projected = tool.project!(rawProduct);

      expect(projected).toEqual({
        id: 'prod-42',
        name: 'Nước hoa hoàng gia',
        slug: 'nuoc-hoa-hoang-gia',
        brand: 'Royal Oud',
        basePrice: 650000,
        variants: [
          {
            id: 'v-1',
            scent: 'Trầm hương',
            volumeMl: 50,
            price: 650000,
            salePrice: 600000,
            stock: 8,
          },
          {
            id: 'v-2',
            scent: 'Hổ phách',
            volumeMl: 100,
            price: 950000,
            salePrice: null,
            stock: 4,
          },
          {
            id: 'v-3',
            scent: 'Xạ hương',
            volumeMl: 30,
            price: 450000,
            salePrice: 400000,
            stock: 0,
          },
        ],
      });

      expect((projected as any).variants).toHaveLength(3);
      expect((projected as any).variants[0].id).toBe('v-1');
      expect((projected as any).description).toBeUndefined();
      expect((projected as any).images).toBeUndefined();
      expect((projected as any).reviews).toBeUndefined();
    });
  });

  describe('get_product_filters tool', () => {
    it('calls products.getFilterOptions with no arguments', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'get_product_filters')!;

      const mockFilterOptions = {
        brands: ['Brand A', 'Brand B'],
        scents: ['Hương gỗ', 'Hương hoa'],
        volumes: [30, 50, 100],
        priceRange: { min: 50000, max: 1000000 },
      };
      (mockProductsService.getFilterOptions as jest.Mock).mockResolvedValue(
        mockFilterOptions,
      );

      const parsedArgs = tool.schema.parse({});
      const result = await tool.handler(parsedArgs, dummyContext);

      expect(mockProductsService.getFilterOptions).toHaveBeenCalledWith();
      expect(result).toBe(mockFilterOptions);
    });

    it('rejects unexpected arguments (strict schema)', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'get_product_filters')!;

      const result = tool.schema.safeParse({ anyProp: 123 });
      expect(result.success).toBe(false);
      expect(() => tool.schema.parse({ anyProp: 123 })).toThrow();
    });

    it('summarize returns a short Vietnamese line', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'get_product_filters')!;

      expect(tool.summarize({} as any)).toBe(
        'Xem các bộ lọc tìm kiếm sản phẩm',
      );
    });
  });

  describe('list_categories tool', () => {
    it('calls categories.getTreeStructure with no arguments', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'list_categories')!;

      const mockTree = [
        {
          id: 'cat-1',
          name: 'Nước hoa nam',
          slug: 'nuoc-hoa-nam',
          productCount: 12,
          children: [],
        },
      ];
      (mockCategoriesService.getTreeStructure as jest.Mock).mockResolvedValue(
        mockTree,
      );

      const parsedArgs = tool.schema.parse({});
      const result = await tool.handler(parsedArgs, dummyContext);

      expect(mockCategoriesService.getTreeStructure).toHaveBeenCalledWith();
      expect(result).toBe(mockTree);
    });

    it('rejects unexpected arguments (strict schema)', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'list_categories')!;

      const result = tool.schema.safeParse({ unknown: true });
      expect(result.success).toBe(false);
      expect(() => tool.schema.parse({ unknown: true })).toThrow();
    });

    it('summarize returns a short Vietnamese line', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'list_categories')!;

      expect(tool.summarize({} as any)).toBe('Xem danh mục sản phẩm');
    });

    it('project keeps id, name, slug, productCount and children two levels deep', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'list_categories')!;

      const rawTree = [
        {
          id: 'root-1',
          name: 'Nước hoa',
          slug: 'nuoc-hoa',
          parentId: null,
          productCount: 30,
          isLeaf: false,
          extraMetadata: 'remove-me',
          children: [
            {
              id: 'sub-1',
              name: 'Nước hoa mùa hè',
              slug: 'nuoc-hoa-mua-he',
              parentId: 'root-1',
              productCount: 15,
              isLeaf: false,
              children: [
                {
                  id: 'leaf-deep-1',
                  name: 'Nước hoa hương biển',
                  slug: 'nuoc-hoa-huong-bien',
                  parentId: 'sub-1',
                  productCount: 5,
                  isLeaf: true,
                  children: [],
                },
              ],
            },
            {
              id: 'sub-2',
              name: 'Nước hoa mùa đông',
              slug: 'nuoc-hoa-mua-dong',
              parentId: 'root-1',
              productCount: 15,
              isLeaf: true,
              children: [],
            },
          ],
        },
      ];

      const projected = tool.project!(rawTree);

      expect(projected).toEqual([
        {
          id: 'root-1',
          name: 'Nước hoa',
          slug: 'nuoc-hoa',
          productCount: 30,
          children: [
            {
              id: 'sub-1',
              name: 'Nước hoa mùa hè',
              slug: 'nuoc-hoa-mua-he',
              productCount: 15,
            },
            {
              id: 'sub-2',
              name: 'Nước hoa mùa đông',
              slug: 'nuoc-hoa-mua-dong',
              productCount: 15,
            },
          ],
        },
      ]);

      // Level 2 children should not contain level 3
      expect((projected as any)[0].children[0].children).toBeUndefined();
      expect((projected as any)[0].parentId).toBeUndefined();
      expect((projected as any)[0].isLeaf).toBeUndefined();
    });
  });

  describe('recommend_products tool', () => {
    it('calls retrieval.buildCatalogContext with query and expected parameters', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'recommend_products')!;

      const mockRetrievalResult = {
        hasResults: true,
        context: '1. Nước hoa cam sả...',
        sources: [
          {
            id: 'prod-rec-1',
            name: 'Nước hoa cam sả',
            slug: 'nuoc-hoa-cam-sa',
            score: 98,
          },
        ],
      };
      (mockRetrievalService.buildCatalogContext as jest.Mock).mockResolvedValue(
        mockRetrievalResult,
      );

      const parsedArgs = tool.schema.parse({
        query: 'tư vấn nước hoa thanh mát đi làm văn phòng',
      });
      const result = await tool.handler(parsedArgs, dummyContext);

      expect(mockRetrievalService.buildCatalogContext).toHaveBeenCalledWith(
        'tư vấn nước hoa thanh mát đi làm văn phòng',
        {
          productLimit: 4,
          variantLimit: 3,
          candidateLimit: 12,
        },
      );
      expect(result).toEqual({
        context: '1. Nước hoa cam sả...',
        sources: mockRetrievalResult.sources,
      });
    });

    it('rejects empty query, query > 500 chars, and extra keys', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'recommend_products')!;

      expect(tool.schema.safeParse({ query: '' }).success).toBe(false);
      expect(() => tool.schema.parse({ query: '' })).toThrow();

      expect(tool.schema.safeParse({ query: 'a'.repeat(501) }).success).toBe(
        false,
      );
      expect(tool.schema.safeParse({ query: 'a'.repeat(500) }).success).toBe(
        true,
      );

      expect(
        tool.schema.safeParse({ query: 'hương hoa', extra: 'key' }).success,
      ).toBe(false);
    });

    it('summarize returns a short Vietnamese line', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'recommend_products')!;

      expect(tool.summarize({ query: 'hương hoa nhài' } as any)).toBe(
        'Gợi ý sản phẩm cho nhu cầu "hương hoa nhài"',
      );
    });
  });
});
