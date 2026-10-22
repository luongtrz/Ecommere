import { createCatalogTools, CatalogToolDeps } from './catalog.tools';
import type { ProductsService } from '../../../products/products.service';
import type { CategoriesService } from '../../../categories/categories.service';
import type { ChatbotRetrievalService } from '../../chatbot-retrieval.service';
import { ToolContext } from '../tool.types';

describe('Catalog Tools - Gap Coverage', () => {
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

  describe('projectProduct branches (via get_product & search_products project)', () => {
    it('returns product as-is when product is falsy (null or undefined)', () => {
      const tools = createCatalogTools(deps);
      const getProductTool = tools.find((t) => t.name === 'get_product')!;

      expect(getProductTool.project!(null)).toBeNull();
      expect(getProductTool.project!(undefined)).toBeUndefined();
    });

    it('returns product as-is when product is not an object (primitive string or number)', () => {
      const tools = createCatalogTools(deps);
      const getProductTool = tools.find((t) => t.name === 'get_product')!;

      expect(getProductTool.project!('not-an-object')).toBe('not-an-object');
      expect(getProductTool.project!(12345)).toBe(12345);
      expect(getProductTool.project!(true)).toBe(true);
    });

    it('sets variants to [] when product.variants is undefined or not an array', () => {
      const tools = createCatalogTools(deps);
      const getProductTool = tools.find((t) => t.name === 'get_product')!;

      const rawProductWithoutVariants = {
        id: 'prod-no-variants',
        name: 'Sản phẩm không có biến thể',
        slug: 'san-pham-khong-co-bien-the',
        brand: 'Brand X',
        basePrice: 200000,
        variants: undefined,
      };

      const result: any = getProductTool.project!(rawProductWithoutVariants);

      expect(result).toEqual({
        id: 'prod-no-variants',
        name: 'Sản phẩm không có biến thể',
        slug: 'san-pham-khong-co-bien-the',
        brand: 'Brand X',
        basePrice: 200000,
        variants: [],
      });

      const rawProductWithNullVariants = {
        id: 'prod-null-variants',
        name: 'Sản phẩm biến thể null',
        slug: 'san-pham-bien-the-null',
        brand: 'Brand Y',
        basePrice: 300000,
        variants: null,
      };

      const resultNull: any = getProductTool.project!(
        rawProductWithNullVariants,
      );
      expect(resultNull.variants).toEqual([]);
    });

    it('handles null or undefined items within product.variants gracefully via optional chaining', () => {
      const tools = createCatalogTools(deps);
      const getProductTool = tools.find((t) => t.name === 'get_product')!;

      const rawProductWithSparseVariants = {
        id: 'prod-sparse',
        name: 'Sản phẩm biến thể rỗng',
        slug: 'san-pham-bien-the-rong',
        brand: 'Brand Z',
        basePrice: 100000,
        variants: [
          null,
          undefined,
          {
            id: 'v-valid',
            scent: 'Hoa bưởi',
            volumeMl: 50,
            price: 100000,
            salePrice: null,
            stock: 10,
          },
        ],
      };

      const result: any = getProductTool.project!(rawProductWithSparseVariants);

      expect(result.variants).toHaveLength(3);
      expect(result.variants[0]).toEqual({
        id: undefined,
        scent: undefined,
        volumeMl: undefined,
        price: undefined,
        salePrice: undefined,
        stock: undefined,
      });
      expect(result.variants[1]).toEqual({
        id: undefined,
        scent: undefined,
        volumeMl: undefined,
        price: undefined,
        salePrice: undefined,
        stock: undefined,
      });
      expect(result.variants[2]).toEqual({
        id: 'v-valid',
        scent: 'Hoa bưởi',
        volumeMl: 50,
        price: 100000,
        salePrice: null,
        stock: 10,
      });
    });
  });

  describe('projectCategoryTree branches (via list_categories project)', () => {
    it('returns categories as-is when categories is not an array', () => {
      const tools = createCatalogTools(deps);
      const listCategoriesTool = tools.find(
        (t) => t.name === 'list_categories',
      )!;

      expect(listCategoriesTool.project!(null)).toBeNull();
      expect(listCategoriesTool.project!(undefined)).toBeUndefined();
      expect(listCategoriesTool.project!('not-an-array')).toBe('not-an-array');
      expect(listCategoriesTool.project!({ id: 'cat-obj' })).toEqual({
        id: 'cat-obj',
      });
    });

    it('defaults productCount to 0 when productCount is null or undefined', () => {
      const tools = createCatalogTools(deps);
      const listCategoriesTool = tools.find(
        (t) => t.name === 'list_categories',
      )!;

      const rawCategories = [
        {
          id: 'cat-1',
          name: 'Danh mục không có productCount',
          slug: 'danh-muc-khong-count',
          productCount: null,
          children: [],
        },
        {
          id: 'cat-2',
          name: 'Danh mục undefined productCount',
          slug: 'danh-muc-undef-count',
          productCount: undefined,
          children: [],
        },
      ];

      const projected: any = listCategoriesTool.project!(rawCategories);

      expect(projected).toEqual([
        {
          id: 'cat-1',
          name: 'Danh mục không có productCount',
          slug: 'danh-muc-khong-count',
          productCount: 0,
          children: [],
        },
        {
          id: 'cat-2',
          name: 'Danh mục undefined productCount',
          slug: 'danh-muc-undef-count',
          productCount: 0,
          children: [],
        },
      ]);
    });

    it('sets children to [] when cat.children is not an array or undefined at depth < 2', () => {
      const tools = createCatalogTools(deps);
      const listCategoriesTool = tools.find(
        (t) => t.name === 'list_categories',
      )!;

      const rawCategories = [
        {
          id: 'cat-leaf',
          name: 'Danh mục không children',
          slug: 'danh-muc-khong-children',
          productCount: 5,
          children: null,
        },
        {
          id: 'cat-leaf-2',
          name: 'Danh mục children undefined',
          slug: 'danh-muc-children-undefined',
          productCount: 8,
          children: undefined,
        },
      ];

      const projected: any = listCategoriesTool.project!(rawCategories);

      expect(projected).toEqual([
        {
          id: 'cat-leaf',
          name: 'Danh mục không children',
          slug: 'danh-muc-khong-children',
          productCount: 5,
          children: [],
        },
        {
          id: 'cat-leaf-2',
          name: 'Danh mục children undefined',
          slug: 'danh-muc-children-undefined',
          productCount: 8,
          children: [],
        },
      ]);
    });

    it('handles null element inside categories array with optional chaining', () => {
      const tools = createCatalogTools(deps);
      const listCategoriesTool = tools.find(
        (t) => t.name === 'list_categories',
      )!;

      const projected: any = listCategoriesTool.project!([null]);

      expect(projected).toEqual([
        {
          id: undefined,
          name: undefined,
          slug: undefined,
          productCount: 0,
          children: [],
        },
      ]);
    });
  });

  describe('search_products tool handler & project gaps', () => {
    it('calls products.findAll without search key when query is undefined', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'search_products')!;

      (mockProductsService.findAll as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
      });

      const parsedArgs = tool.schema.parse({
        categoryId: 'cat-perfume',
        minPrice: 100000,
        limit: 5,
      });

      await tool.handler(parsedArgs, dummyContext);

      expect(mockProductsService.findAll).toHaveBeenCalledWith({
        categoryId: 'cat-perfume',
        minPrice: 100000,
        limit: 5,
      });
      // Verifies search property is not present in the called object
      const callArgs = (mockProductsService.findAll as jest.Mock).mock
        .calls[0][0];
      expect(callArgs).not.toHaveProperty('search');
    });

    it('project returns result as-is when result is null, undefined, or primitive', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'search_products')!;

      expect(tool.project!(null)).toBeNull();
      expect(tool.project!(undefined)).toBeUndefined();
      expect(tool.project!('plain-string')).toBe('plain-string');
      expect(tool.project!(999)).toBe(999);
      expect(tool.project!(false)).toBe(false);
    });

    it('project projects direct Array of products (slicing to max 8)', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'search_products')!;

      const directArray = Array.from({ length: 10 }, (_, i) => ({
        id: `prod-${i + 1}`,
        name: `Sản phẩm ${i + 1}`,
        slug: `san-pham-${i + 1}`,
        brand: 'Brand A',
        basePrice: 100000,
        variants: [
          {
            id: `v-${i + 1}`,
            scent: 'Hương hoa',
            volumeMl: 50,
            price: 100000,
            salePrice: null,
            stock: 5,
          },
        ],
      }));

      const projected: any = tool.project!(directArray);

      expect(Array.isArray(projected)).toBe(true);
      expect(projected).toHaveLength(8);
      expect(projected[0]).toEqual({
        id: 'prod-1',
        name: 'Sản phẩm 1',
        slug: 'san-pham-1',
        brand: 'Brand A',
        basePrice: 100000,
        variants: [
          {
            id: 'v-1',
            scent: 'Hương hoa',
            volumeMl: 50,
            price: 100000,
            salePrice: null,
            stock: 5,
          },
        ],
      });
    });

    it('project returns object as-is when neither result nor result.data is an array', () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'search_products')!;

      const nonArrayObject = {
        status: 'success',
        total: 0,
        message: 'Không tìm thấy sản phẩm',
      };

      const projected: any = tool.project!(nonArrayObject);
      expect(projected).toEqual(nonArrayObject);

      const objectWithNullData = {
        data: null,
        total: 0,
      };

      const projectedNullData: any = tool.project!(objectWithNullData);
      expect(projectedNullData).toEqual(objectWithNullData);
    });
  });

  describe('recommend_products tool handler fallback gaps', () => {
    it('falls back to empty context and empty sources when buildCatalogContext resolves to null or undefined', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'recommend_products')!;

      (
        mockRetrievalService.buildCatalogContext as jest.Mock
      ).mockResolvedValueOnce(null);

      const parsedArgs = tool.schema.parse({ query: 'nước hoa thanh lịch' });
      const resultNull = await tool.handler(parsedArgs, dummyContext);

      expect(resultNull).toEqual({
        context: '',
        sources: [],
      });

      (
        mockRetrievalService.buildCatalogContext as jest.Mock
      ).mockResolvedValueOnce(undefined);
      const resultUndefined = await tool.handler(parsedArgs, dummyContext);

      expect(resultUndefined).toEqual({
        context: '',
        sources: [],
      });
    });

    it('falls back to empty string when context is null and empty array when sources is null', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'recommend_products')!;

      (mockRetrievalService.buildCatalogContext as jest.Mock).mockResolvedValue(
        {
          context: null,
          sources: null,
        },
      );

      const parsedArgs = tool.schema.parse({ query: 'gợi ý quà tặng bạn gái' });
      const result = await tool.handler(parsedArgs, dummyContext);

      expect(result).toEqual({
        context: '',
        sources: [],
      });
    });

    it('retains context when present but falls back to empty sources when sources is missing', async () => {
      const tools = createCatalogTools(deps);
      const tool = tools.find((t) => t.name === 'recommend_products')!;

      (mockRetrievalService.buildCatalogContext as jest.Mock).mockResolvedValue(
        {
          context: 'Nội dung gợi ý sản phẩm...',
        },
      );

      const parsedArgs = tool.schema.parse({
        query: 'nước hoa hương hoa hồng',
      });
      const result = await tool.handler(parsedArgs, dummyContext);

      expect(result).toEqual({
        context: 'Nội dung gợi ý sản phẩm...',
        sources: [],
      });
    });
  });
});
