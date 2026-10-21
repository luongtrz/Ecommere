import { Test, TestingModule } from '@nestjs/testing';
import {
  ChatbotRetrievalService,
  RetrievalResult,
} from './chatbot-retrieval.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('ChatbotRetrievalService', () => {
  let service: ChatbotRetrievalService;

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  };

  const defaultOptions = {
    productLimit: 5,
    variantLimit: 3,
    candidateLimit: 10,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotRetrievalService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChatbotRetrievalService>(ChatbotRetrievalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildCatalogContext', () => {
    const createMockProduct = (overrides: Partial<any> = {}) => ({
      id: 'prod-1',
      name: 'Xịt Thơm Phòng Lavender',
      slug: 'xit-thom-phong-lavender',
      description: 'Xịt thơm phòng hương hoa lavender tự nhiên dễ chịu',
      brand: 'AromaCo',
      basePrice: 120000,
      active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      category: {
        id: 'cat-1',
        name: 'Xịt Thơm',
        slug: 'xit-thom',
      },
      variants: [
        {
          id: 'var-1',
          sku: 'LAV-100',
          scent: 'Lavender Mộc',
          volumeMl: 100,
          price: 120000,
          salePrice: 99000,
          stock: 10,
        },
        {
          id: 'var-2',
          sku: 'LAV-200',
          scent: 'Lavender Pháp',
          volumeMl: 200,
          price: 180000,
          salePrice: null,
          stock: 0,
        },
      ],
      ...overrides,
    });

    describe('empty query handling', () => {
      it('should return empty retrieval result without calling database when query is empty string', async () => {
        const result = await service.buildCatalogContext('', defaultOptions);

        expect(result).toEqual<RetrievalResult>({
          hasResults: false,
          context: '',
          sources: [],
        });
        expect(mockPrismaService.category.findMany).not.toHaveBeenCalled();
        expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
      });

      it('should return empty retrieval result without calling database when query is whitespace only', async () => {
        const result = await service.buildCatalogContext(
          '   \t\n   ',
          defaultOptions,
        );

        expect(result).toEqual<RetrievalResult>({
          hasResults: false,
          context: '',
          sources: [],
        });
        expect(mockPrismaService.category.findMany).not.toHaveBeenCalled();
        expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
      });
    });

    describe('dependency failure paths', () => {
      it('should rethrow error when prisma.category.findMany rejects', async () => {
        const dbError = new Error('Database category connection error');
        mockPrismaService.category.findMany.mockRejectedValue(dbError);

        await expect(
          service.buildCatalogContext('lavender', defaultOptions),
        ).rejects.toThrow(Error);

        await expect(
          service.buildCatalogContext('lavender', defaultOptions),
        ).rejects.toThrow('Database category connection error');

        expect(mockPrismaService.product.findMany).not.toHaveBeenCalled();
      });

      it('should rethrow error when prisma.product.findMany rejects', async () => {
        mockPrismaService.category.findMany.mockResolvedValue([
          { id: 'cat-1' },
        ]);
        const dbError = new Error('Database product query timeout');
        mockPrismaService.product.findMany.mockRejectedValue(dbError);

        await expect(
          service.buildCatalogContext('lavender', defaultOptions),
        ).rejects.toThrow(Error);

        await expect(
          service.buildCatalogContext('lavender', defaultOptions),
        ).rejects.toThrow('Database product query timeout');
      });
    });

    describe('not-found / no results paths', () => {
      it('should return empty retrieval result when database returns no products', async () => {
        mockPrismaService.category.findMany.mockResolvedValue([]);
        mockPrismaService.product.findMany.mockResolvedValue([]);

        const result = await service.buildCatalogContext(
          'lavender',
          defaultOptions,
        );

        expect(result).toEqual<RetrievalResult>({
          hasResults: false,
          context: '',
          sources: [],
        });
        expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
          where: {
            OR: [
              { name: { contains: 'lavender', mode: 'insensitive' } },
              { slug: { contains: 'lavender', mode: 'insensitive' } },
            ],
          },
          select: { id: true },
          take: 6,
        });
        expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
          where: {
            active: true,
            OR: [
              { name: { contains: 'lavender', mode: 'insensitive' } },
              { description: { contains: 'lavender', mode: 'insensitive' } },
              { brand: { contains: 'lavender', mode: 'insensitive' } },
              { slug: { contains: 'lavender', mode: 'insensitive' } },
              {
                category: {
                  name: { contains: 'lavender', mode: 'insensitive' },
                },
              },
              {
                variants: {
                  some: {
                    scent: { contains: 'lavender', mode: 'insensitive' },
                  },
                },
              },
              {
                variants: {
                  some: { sku: { contains: 'lavender', mode: 'insensitive' } },
                },
              },
            ],
          },
          include: {
            category: true,
            variants: true,
          },
          take: defaultOptions.candidateLimit,
          orderBy: {
            createdAt: 'desc',
          },
        });
      });

      it('should return empty retrieval result when products are found but all have a score of 0', async () => {
        mockPrismaService.category.findMany.mockResolvedValue([]);
        const zeroScoreProduct = createMockProduct({
          id: 'prod-diff',
          name: 'Nến Thơm Cao Cấp',
          slug: 'nen-thom-cao-cap',
          description: 'Hương thơm dễ chịu',
          brand: 'CandleVN',
          category: {
            id: 'cat-99',
            name: 'Nến',
            slug: 'nen',
          },
          variants: [
            {
              id: 'var-99',
              sku: 'NEN-01',
              scent: 'Vani',
              volumeMl: 50,
              price: 80000,
              salePrice: null,
              stock: 0,
            },
          ],
        });
        mockPrismaService.product.findMany.mockResolvedValue([zeroScoreProduct]);

        const result = await service.buildCatalogContext(
          'lavender',
          defaultOptions,
        );

        expect(result).toEqual<RetrievalResult>({
          hasResults: false,
          context: '',
          sources: [],
        });
      });
    });

    describe('success paths', () => {
      it('should search products with category match, rank them, and format context', async () => {
        const product = createMockProduct();
        mockPrismaService.category.findMany.mockResolvedValue([
          { id: 'cat-1' },
        ]);
        mockPrismaService.product.findMany.mockResolvedValue([product]);

        const result = await service.buildCatalogContext(
          'lavender',
          defaultOptions,
        );

        expect(result.hasResults).toBe(true);
        expect(result.sources).toEqual([
          {
            id: 'prod-1',
            name: 'Xịt Thơm Phòng Lavender',
            slug: 'xit-thom-phong-lavender',
            score: expect.any(Number),
          },
        ]);
        expect(result.sources[0].score).toBeGreaterThan(0);

        expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
          where: {
            OR: [
              { name: { contains: 'lavender', mode: 'insensitive' } },
              { slug: { contains: 'lavender', mode: 'insensitive' } },
            ],
          },
          select: { id: true },
          take: 6,
        });

        expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
          where: {
            active: true,
            OR: [
              { name: { contains: 'lavender', mode: 'insensitive' } },
              { description: { contains: 'lavender', mode: 'insensitive' } },
              { brand: { contains: 'lavender', mode: 'insensitive' } },
              { slug: { contains: 'lavender', mode: 'insensitive' } },
              {
                category: {
                  name: { contains: 'lavender', mode: 'insensitive' },
                },
              },
              {
                variants: {
                  some: {
                    scent: { contains: 'lavender', mode: 'insensitive' },
                  },
                },
              },
              {
                variants: {
                  some: { sku: { contains: 'lavender', mode: 'insensitive' } },
                },
              },
              { categoryId: { in: ['cat-1'] } },
            ],
          },
          include: {
            category: true,
            variants: true,
          },
          take: defaultOptions.candidateLimit,
          orderBy: {
            createdAt: 'desc',
          },
        });

        const expectedPriceRange = (service as any).formatPriceRange(
          99000,
          180000,
        );
        const expectedSalePrice = (service as any).formatMoney(99000);
        const expectedRegularPrice = (service as any).formatMoney(180000);

        expect(result.context).toContain(
          `1. Xịt Thơm Phòng Lavender (score ${result.sources[0].score})`,
        );
        expect(result.context).toContain('- Slug: xit-thom-phong-lavender');
        expect(result.context).toContain('- Danh mục: Xịt Thơm');
        expect(result.context).toContain('- Thương hiệu: AromaCo');
        expect(result.context).toContain(
          '- Mô tả: Xịt thơm phòng hương hoa lavender tự nhiên dễ chịu',
        );
        expect(result.context).toContain(
          `- Giá tham khảo: ${expectedPriceRange}`,
        );
        expect(result.context).toContain('- Biến thể nổi bật:');
        expect(result.context).toContain(
          `* Lavender Mộc | 100ml | ${expectedSalePrice} | còn 10 | SKU LAV-100`,
        );
        expect(result.context).toContain(
          `* Lavender Pháp | 200ml | ${expectedRegularPrice} | hết hàng | SKU LAV-200`,
        );
      });

      it('should sort multiple products descending by score and respect productLimit', async () => {
        const highMatch = createMockProduct({
          id: 'prod-high',
          name: 'Tinh Dầu Lavender Nguyên Chất',
          slug: 'tinh-dau-lavender-nguyen-chat',
        });
        const mediumMatch = createMockProduct({
          id: 'prod-med',
          name: 'Nước Hoa Hồng Xịt Toàn Thân',
          slug: 'nuoc-hoa-hong-xit-toan-than',
          description: 'Có thoang thoảng hương lavender thơm dịu',
          brand: null,
        });
        const lowMatch = createMockProduct({
          id: 'prod-low',
          name: 'Nến Thơm Sáp Đậu Nành',
          slug: 'nen-thom-sap-dau-nanh',
          description: 'lavender',
          brand: null,
          category: { id: 'cat-other', name: 'Nến', slug: 'nen' },
          variants: [
            {
              id: 'var-low',
              sku: 'NEN-1',
              scent: 'Hoa',
              volumeMl: 50,
              price: 50000,
              salePrice: null,
              stock: 0,
            },
          ],
        });

        mockPrismaService.category.findMany.mockResolvedValue([]);
        mockPrismaService.product.findMany.mockResolvedValue([
          lowMatch,
          highMatch,
          mediumMatch,
        ]);

        const result = await service.buildCatalogContext('lavender', {
          productLimit: 2,
          variantLimit: 2,
          candidateLimit: 5,
        });

        expect(result.hasResults).toBe(true);
        expect(result.sources).toHaveLength(2);
        expect(result.sources[0].id).toBe('prod-high');
        expect(result.sources[1].id).toBe('prod-med');
        expect(result.sources[0].score).toBeGreaterThan(
          result.sources[1].score,
        );

        expect(result.context).toContain('1. Tinh Dầu Lavender Nguyên Chất');
        expect(result.context).toContain('2. Nước Hoa Hồng Xịt Toàn Thân');
        expect(result.context).not.toContain('Nến Thơm Sáp Đậu Nành');
        expect(result.context).toContain('\n\n');
      });

      it('should omit brand line when product brand is null', async () => {
        const product = createMockProduct({
          brand: null,
        });
        mockPrismaService.category.findMany.mockResolvedValue([]);
        mockPrismaService.product.findMany.mockResolvedValue([product]);

        const result = await service.buildCatalogContext(
          'lavender',
          defaultOptions,
        );

        expect(result.hasResults).toBe(true);
        expect(result.context).not.toContain('- Thương hiệu:');
      });

      it('should truncate product description if it exceeds 180 characters', async () => {
        const longDescription = 'A'.repeat(200);
        const product = createMockProduct({
          description: longDescription,
        });
        mockPrismaService.category.findMany.mockResolvedValue([]);
        mockPrismaService.product.findMany.mockResolvedValue([product]);

        const result = await service.buildCatalogContext(
          'lavender',
          defaultOptions,
        );

        const expectedShortDesc = `${longDescription.slice(0, 177)}...`;
        expect(result.context).toContain(`- Mô tả: ${expectedShortDesc}`);
        expect(result.context).not.toContain(longDescription);
      });

      it('should preserve full product description if it is 180 characters or fewer', async () => {
        const exactDescription = 'B'.repeat(180);
        const product = createMockProduct({
          description: exactDescription,
        });
        mockPrismaService.category.findMany.mockResolvedValue([]);
        mockPrismaService.product.findMany.mockResolvedValue([product]);

        const result = await service.buildCatalogContext(
          'lavender',
          defaultOptions,
        );

        expect(result.context).toContain(`- Mô tả: ${exactDescription}`);
        expect(result.context).not.toContain('...');
      });

      it('should display single price when minPrice equals maxPrice', async () => {
        const product = createMockProduct({
          variants: [
            {
              id: 'var-1',
              sku: 'LAV-100',
              scent: 'Lavender Mộc',
              volumeMl: 100,
              price: 150000,
              salePrice: null,
              stock: 5,
            },
            {
              id: 'var-2',
              sku: 'LAV-101',
              scent: 'Lavender Trắng',
              volumeMl: 100,
              price: 150000,
              salePrice: null,
              stock: 3,
            },
          ],
        });
        mockPrismaService.category.findMany.mockResolvedValue([]);
        mockPrismaService.product.findMany.mockResolvedValue([product]);

        const result = await service.buildCatalogContext(
          'lavender',
          defaultOptions,
        );

        const formattedSinglePrice = (service as any).formatMoney(150000);
        expect(result.context).toContain(
          `- Giá tham khảo: ${formattedSinglePrice}`,
        );
        expect(result.context).not.toContain(
          `- Giá tham khảo: ${formattedSinglePrice} -`,
        );
      });

      it('should fallback to product basePrice and fallback variant message when product has no variants', async () => {
        const product = createMockProduct({
          basePrice: 250000,
          variants: [],
        });
        mockPrismaService.category.findMany.mockResolvedValue([]);
        mockPrismaService.product.findMany.mockResolvedValue([product]);

        const result = await service.buildCatalogContext(
          'lavender',
          defaultOptions,
        );

        const expectedPrice = (service as any).formatMoney(250000);
        expect(result.context).toContain(`- Giá tham khảo: ${expectedPrice}`);
        expect(result.context).toContain(
          '  * Chưa có biến thể phù hợp được truy xuất',
        );
      });

      it('should break variant score ties by variant stock descending and respect variantLimit', async () => {
        const product = createMockProduct({
          variants: [
            {
              id: 'var-1',
              sku: 'LAV-50',
              scent: 'Hoa',
              volumeMl: 50,
              price: 50000,
              salePrice: null,
              stock: 3,
            },
            {
              id: 'var-2',
              sku: 'LAV-60',
              scent: 'Hoa',
              volumeMl: 60,
              price: 60000,
              salePrice: null,
              stock: 25,
            },
            {
              id: 'var-3',
              sku: 'LAV-70',
              scent: 'Hoa',
              volumeMl: 70,
              price: 70000,
              salePrice: null,
              stock: 12,
            },
          ],
        });
        mockPrismaService.category.findMany.mockResolvedValue([]);
        mockPrismaService.product.findMany.mockResolvedValue([product]);

        const result = await service.buildCatalogContext('lavender', {
          productLimit: 1,
          variantLimit: 2,
          candidateLimit: 5,
        });

        expect(result.context).toContain('còn 25 | SKU LAV-60');
        expect(result.context).toContain('còn 12 | SKU LAV-70');
        expect(result.context).not.toContain('SKU LAV-50');
      });
    });
  });

  describe('buildProductWhereClauses (internal)', () => {
    it('should return fallback name contains clause when terms and categoryIds are empty', () => {
      const clauses = (service as any).buildProductWhereClauses('', [], []);

      expect(clauses).toEqual([
        { name: { contains: '', mode: 'insensitive' } },
      ]);
    });

    it('should limit terms to 8 items', () => {
      const tokens = [
        'term1',
        'term2',
        'term3',
        'term4',
        'term5',
        'term6',
        'term7',
        'term8',
        'term9',
        'term10',
      ];
      const clauses = (service as any).buildProductWhereClauses(
        'query',
        tokens,
        [],
      );

      // 8 terms * 7 clauses per term = 56 clauses
      expect(clauses).toHaveLength(56);
    });

    it('should include categoryId in clause when categoryIds are provided', () => {
      const clauses = (service as any).buildProductWhereClauses(
        'spray',
        ['spray'],
        ['cat-1', 'cat-2'],
      );

      expect(clauses).toContainEqual({
        categoryId: { in: ['cat-1', 'cat-2'] },
      });
    });

    it('should not include categoryId in clause when categoryIds array is empty', () => {
      const clauses = (service as any).buildProductWhereClauses(
        'spray',
        ['spray'],
        [],
      );

      const hasCategoryClause = clauses.some((clause: any) => clause.categoryId);
      expect(hasCategoryClause).toBe(false);
    });
  });

  describe('findRelevantCategoryIds (internal)', () => {
    it('should return empty array without querying database when terms are empty', async () => {
      const result = await (service as any).findRelevantCategoryIds('', []);

      expect(result).toEqual([]);
      expect(mockPrismaService.category.findMany).not.toHaveBeenCalled();
    });

    it('should limit terms to 6 items when querying categories', async () => {
      const tokens = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];
      mockPrismaService.category.findMany.mockResolvedValue([
        { id: 'cat-1' },
        { id: 'cat-2' },
      ]);

      const result = await (service as any).findRelevantCategoryIds(
        'query',
        tokens,
      );

      expect(result).toEqual(['cat-1', 'cat-2']);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        where: {
          OR: expect.arrayContaining([
            { name: { contains: 'query', mode: 'insensitive' } },
            { slug: { contains: 'query', mode: 'insensitive' } },
          ]),
        },
        select: { id: true },
        take: 6,
      });

      const callArgs = mockPrismaService.category.findMany.mock.calls[0][0];
      // 6 terms * 2 OR clauses = 12 clauses
      expect(callArgs.where.OR).toHaveLength(12);
    });
  });

  describe('scoreProduct (internal)', () => {
    const baseProduct = {
      name: 'Item',
      description: 'Desc',
      brand: 'Brand',
      slug: 'item',
      category: { id: 'c1', name: 'Cat', slug: 'cat' },
      variants: [
        {
          sku: 'SKU1',
          scent: 'Scent',
          volumeMl: 50,
          price: 10000,
          salePrice: null,
          stock: 0,
        },
      ],
    };

    it('should add 120 points when product name includes normalized query', () => {
      const product = { ...baseProduct, name: 'Lavender Spray' };
      const score = (service as any).scoreProduct(
        product,
        'lavender',
        [],
        new Set(),
      );

      expect(score).toBe(120);
    });

    it('should add 90 points when variant scent includes normalized query', () => {
      const product = {
        ...baseProduct,
        variants: [{ ...baseProduct.variants[0], scent: 'Pure Lavender' }],
      };
      const score = (service as any).scoreProduct(
        product,
        'lavender',
        [],
        new Set(),
      );

      expect(score).toBe(90);
    });

    it('should add 70 points when category name includes normalized query', () => {
      const product = {
        ...baseProduct,
        category: { id: 'c1', name: 'Lavender Category', slug: 'cat' },
      };
      const score = (service as any).scoreProduct(
        product,
        'lavender',
        [],
        new Set(),
      );

      expect(score).toBe(70);
    });

    it('should add 70 points when category slug includes normalized query', () => {
      const product = {
        ...baseProduct,
        category: { id: 'c1', name: 'Cat', slug: 'lavender-spray' },
      };
      const score = (service as any).scoreProduct(
        product,
        'lavender-spray',
        [],
        new Set(),
      );

      expect(score).toBe(70);
    });

    it('should add 50 points when brand includes normalized query', () => {
      const product = { ...baseProduct, brand: 'LavenderCo' };
      const score = (service as any).scoreProduct(
        product,
        'lavender',
        [],
        new Set(),
      );

      expect(score).toBe(50);
    });

    it('should add 30 points when description includes normalized query', () => {
      const product = {
        ...baseProduct,
        description: 'Contains fresh lavender flowers',
      };
      const score = (service as any).scoreProduct(
        product,
        'lavender',
        [],
        new Set(),
      );

      expect(score).toBe(30);
    });

    it('should add 20 points when variant SKU includes normalized query', () => {
      const product = {
        ...baseProduct,
        variants: [{ ...baseProduct.variants[0], sku: 'LAV-100' }],
      };
      const score = (service as any).scoreProduct(
        product,
        'lav',
        [],
        new Set(),
      );

      expect(score).toBe(20);
    });

    it('should add 25 points when category ID is in matched category IDs', () => {
      const score = (service as any).scoreProduct(
        baseProduct,
        'nomatch',
        [],
        new Set(['c1']),
      );

      expect(score).toBe(25);
    });

    it('should accumulate token scores across all fields', () => {
      const product = {
        name: 'Alpha',
        description: 'Beta',
        brand: 'Gamma',
        slug: 'slug',
        category: { id: 'c1', name: 'Delta', slug: 'epsilon' },
        variants: [
          {
            sku: 'Zeta',
            scent: 'Eta',
            volumeMl: 50,
            price: 10000,
            salePrice: null,
            stock: 0,
          },
        ],
      };
      const tokens = [
        'alpha',
        'beta',
        'gamma',
        'delta',
        'epsilon',
        'zeta',
        'eta',
      ];
      const score = (service as any).scoreProduct(
        product,
        'nomatch',
        tokens,
        new Set(),
      );

      // Rules that add up to 96 for these exact inputs:
      // - token 'alpha': name 'alpha' (+18)
      // - token 'beta': description 'beta' (+6)
      // - token 'gamma': brand 'gamma' (+10)
      // - token 'delta': categoryName 'delta' (+12)
      // - token 'epsilon': categorySlug 'epsilon' (+12)
      // - token 'zeta': variantSkuText 'zeta' (+8)
      // - token 'eta':
      //     * variantScentText 'eta' contains 'eta' (+16)
      //     * description 'beta' contains 'eta' (+6)
      //     * variantSkuText 'zeta' contains 'eta' (+8)
      // Sum = 18 + 6 + 10 + 12 + 12 + 8 + (16 + 6 + 8) = 96
      expect(score).toBe(96);
    });

    it('should add 8 points when at least one variant has stock > 0', () => {
      const product = {
        ...baseProduct,
        variants: [{ ...baseProduct.variants[0], stock: 5 }],
      };
      const score = (service as any).scoreProduct(
        product,
        'nomatch',
        [],
        new Set(),
      );

      expect(score).toBe(8);
    });

    it('should handle product with null brand without throwing', () => {
      const product = { ...baseProduct, brand: null };
      const score = (service as any).scoreProduct(
        product,
        'nomatch',
        [],
        new Set(),
      );

      expect(score).toBe(0);
    });
  });

  describe('scoreVariant (internal)', () => {
    const baseVariant = {
      scent: 'Rose',
      sku: 'ROSE-100',
      volumeMl: 100,
      stock: 0,
    };

    it('should score 60 for scent match, 20 for sku match, 12 for volume match, and 4 for stock', () => {
      const variantWithStock = {
        scent: 'Lavender Deluxe',
        sku: 'LAV-100',
        volumeMl: 100,
        stock: 5,
      };

      // query: 'lavender 100'
      // scent contains 'lavender 100'? false.
      // sku contains 'lavender 100'? false.
      // query includes '100'? true -> +12
      // stock > 0? true -> +4
      const score = (service as any).scoreVariant(
        variantWithStock,
        'lavender 100',
        [],
      );
      expect(score).toBe(12 + 4);
    });

    it('should add token points: scent (+12), sku (+8), volume exact (+10)', () => {
      const variant = {
        scent: 'Lavender',
        sku: 'SKU-LAV',
        volumeMl: 50,
        stock: 0,
      };
      const tokens = ['lavender', 'lav', '50'];

      // tokens:
      // 'lavender': scent (+12)
      // 'lav': scent (+12), sku (+8)
      // '50': volume === token (+10)
      // Total = 12 + (12 + 8) + 10 = 42
      const score = (service as any).scoreVariant(variant, 'nomatch', tokens);
      expect(score).toBe(42);
    });

    it('should score 60 when scent exactly matches or contains normalizedQuery', () => {
      // Isolate scent match rule (+60) by using a variant whose SKU does not contain normalizedQuery:
      const isolatedVariant = {
        ...baseVariant,
        sku: 'VAR-100',
      };
      expect(
        (service as any).scoreVariant(isolatedVariant, 'rose', []),
      ).toBe(60);

      // On baseVariant, SKU 'ROSE-100' also contains normalizedQuery 'rose' (+20):
      // scent match 'Rose' (+60) + SKU match 'ROSE-100' (+20) = 80
      const score = (service as any).scoreVariant(
        baseVariant,
        'rose',
        [],
      );
      expect(score).toBe(80);
    });

    it('should score 20 when sku contains normalizedQuery', () => {
      // Isolate SKU match rule (+20) by using a volumeMl not contained in normalizedQuery:
      const isolatedVariant = {
        ...baseVariant,
        volumeMl: 50,
      };
      expect(
        (service as any).scoreVariant(isolatedVariant, 'rose-100', []),
      ).toBe(20);

      // On baseVariant, query 'rose-100' also contains volume '100' (+12):
      // SKU match 'ROSE-100' (+20) + volume match '100' in 'rose-100' (+12) = 32
      const score = (service as any).scoreVariant(
        baseVariant,
        'rose-100',
        [],
      );
      expect(score).toBe(32);
    });
  });

  describe('extractTokens (internal)', () => {
    it('should normalize, split on non-alphanumeric, filter out tokens shorter than 2 chars, and deduplicate', () => {
      const tokens = (service as any).extractTokens(
        'Xịt Thơm Phòng a b 100ml lavender! Lavender?',
      );

      expect(tokens).toContain('xit');
      expect(tokens).toContain('thom');
      expect(tokens).toContain('phong');
      expect(tokens).toContain('100ml');
      expect(tokens).toContain('lavender');
      expect(tokens).not.toContain('a');
      expect(tokens).not.toContain('b');
      // Lavender should only appear once
      expect(tokens.filter((t: string) => t === 'lavender')).toHaveLength(1);
    });

    it('should limit extracted tokens to 10', () => {
      const longInput =
        'one two three four five six seven eight nine ten eleven twelve thirteen';
      const tokens = (service as any).extractTokens(longInput);

      expect(tokens).toHaveLength(10);
    });
  });

  describe('normalize and slugify (internal)', () => {
    it('should remove Vietnamese diacritics and convert text to lowercase', () => {
      const normalized = (service as any).normalize('Nước Hoa Oải Hương CAO CẤP');
      expect(normalized).toBe('nuoc hoa oai huong cao cap');
    });

    it('should slugify text by replacing non-alphanumeric characters with single hyphens and trimming them', () => {
      const slug = (service as any).slugify(
        '---! Nước Hoa & Xịt Phòng 100% Nguyên Chất !---',
      );
      expect(slug).toBe('nuoc-hoa-xit-phong-100-nguyen-chat');
    });
  });

  describe('formatMoney and formatPriceRange (internal)', () => {
    it('should format numbers as Vietnamese currency (VND)', () => {
      const formatted = (service as any).formatMoney(150000);
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/150\.000/);
    });

    it('should format price range with hyphen when minPrice does not equal maxPrice', () => {
      const range = (service as any).formatPriceRange(100000, 200000);
      const minStr = (service as any).formatMoney(100000);
      const maxStr = (service as any).formatMoney(200000);

      expect(range).toBe(`${minStr} - ${maxStr}`);
    });

    it('should format single price without hyphen when minPrice equals maxPrice', () => {
      const single = (service as any).formatPriceRange(150000, 150000);
      const expectedStr = (service as any).formatMoney(150000);

      expect(single).toBe(expectedStr);
    });
  });
});
