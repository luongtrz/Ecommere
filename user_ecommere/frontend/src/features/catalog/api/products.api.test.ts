import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import { productsApi, type ProductFilters } from './products.api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('productsApi', () => {
  const createMockVariant = (overrides = {}) => ({
    id: 'var-1',
    scent: 'Hoa hồng',
    volumeMl: 100,
    price: 150000,
    salePrice: 120000,
    stock: 25,
    sku: 'SP-VAR-001',
    ...overrides,
  });

  const createMockProduct = (overrides = {}) => ({
    id: 'prod-1',
    name: 'Xịt thơm phòng hoa hồng',
    slug: 'xit-thom-phong-hoa-hong',
    description: 'Mùi hương dịu nhẹ, thanh mát.',
    images: ['/images/rose.jpg'],
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Xịt phòng',
      slug: 'xit-phong',
    },
    variants: [createMockVariant()],
    basePrice: 150000,
    averageRating: 4.8,
    reviewCount: 30,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('calls apiClient.get with default empty filters when no argument is passed', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [createMockProduct()],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
            hasNextPage: false,
          },
        },
      });

      const result = await productsApi.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/products', {
        params: {},
      });
      expect(result.products).toHaveLength(1);
      expect(result.products[0].rating).toBe(4.8);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
    });

    it('passes custom filters in params to apiClient.get', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [createMockProduct()],
            total: 1,
            page: 2,
            limit: 10,
            totalPages: 3,
            hasNextPage: true,
          },
        },
      });

      const filters: ProductFilters = {
        categorySlug: 'xit-thom',
        search: 'hoa hong',
        minPrice: 50000,
        maxPrice: 200000,
        brand: 'ThaiBrand',
        scent: 'Hoa hồng',
        volumeMl: '100',
        sortBy: 'price_asc',
        page: 2,
        limit: 10,
      };

      const result = await productsApi.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/products', {
        params: filters,
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
    });

    it('extracts actualData directly from response.data when response.data.data is undefined', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          total: 10,
          page: 2,
          limit: 5,
          totalPages: 4,
        },
      });

      const result = await productsApi.getAll();

      expect(result.products).toEqual([]);
      expect(result.total).toBe(10);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(4);
      expect(result.hasNextPage).toBe(true);
    });

    it('applies default fallback values when actualData fields are missing or falsy', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {},
      });

      const result = await productsApi.getAll();

      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.totalPages).toBe(1);
      // hasNextPage: page (1) < totalPages (1) -> false
      expect(result.hasNextPage).toBe(false);
    });

    it('computes hasNextPage as true when hasNextPage is omitted and page < totalPages', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [],
            total: 20,
            page: 1,
            limit: 10,
            totalPages: 2,
            // hasNextPage undefined
          },
        },
      });

      const result = await productsApi.getAll();

      expect(result.hasNextPage).toBe(true);
    });

    it('computes hasNextPage as false when hasNextPage is omitted and page >= totalPages', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [],
            total: 20,
            page: 2,
            limit: 10,
            totalPages: 2,
          },
        },
      });

      const result = await productsApi.getAll();

      expect(result.hasNextPage).toBe(false);
    });

    it('preserves explicit hasNextPage boolean even when false and page < totalPages', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [],
            total: 30,
            page: 1,
            limit: 10,
            totalPages: 3,
            hasNextPage: false,
          },
        },
      });

      const result = await productsApi.getAll();

      expect(result.hasNextPage).toBe(false);
    });

    it('parses product without optional category, averageRating, and reviewCount', async () => {
      const minimalProduct = createMockProduct({
        category: undefined,
        averageRating: undefined,
        reviewCount: undefined,
        variants: [
          createMockVariant({
            salePrice: null,
          }),
        ],
      });

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [minimalProduct],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
          },
        },
      });

      const result = await productsApi.getAll();

      expect(result.products[0].category).toBeUndefined();
      expect(result.products[0].rating).toBeUndefined();
      expect(result.products[0].variants[0].salePrice).toBeNull();
    });

    it('rejects when response data fails schema parsing', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [{ invalid: 'structure' }],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
          },
        },
      });

      await expect(productsApi.getAll()).rejects.toThrow();
    });

    it('propagates apiClient errors', async () => {
      const networkError = new Error('Network error');
      vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

      await expect(productsApi.getAll()).rejects.toThrow('Network error');
    });
  });

  describe('getBySlug', () => {
    it('fetches a product by slug with double-wrapped response data', async () => {
      const mockProduct = createMockProduct();
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: mockProduct,
          },
        },
      });

      const result = await productsApi.getBySlug('xit-thom-phong-hoa-hong');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/products/slug/xit-thom-phong-hoa-hong',
      );
      expect(result.id).toBe('prod-1');
      expect(result.name).toBe('Xịt thơm phòng hoa hồng');
      expect(result.rating).toBe(4.8);
    });

    it('fetches a product by slug when actualData is not wrapped in another data property', async () => {
      const mockProduct = createMockProduct();
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockProduct,
        },
      });

      const result = await productsApi.getBySlug('xit-thom-phong-hoa-hong');

      expect(result.slug).toBe('xit-thom-phong-hoa-hong');
      expect(result.basePrice).toBe(150000);
    });

    it('fetches a product by slug when response.data.data is undefined', async () => {
      const mockProduct = createMockProduct();
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockProduct,
      });

      const result = await productsApi.getBySlug('xit-thom-phong-hoa-hong');

      expect(result.id).toBe('prod-1');
      expect(result.name).toBe('Xịt thơm phòng hoa hồng');
    });

    it('parses variant with undefined salePrice', async () => {
      const mockProduct = createMockProduct({
        variants: [
          createMockVariant({
            salePrice: undefined,
          }),
        ],
      });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: mockProduct },
      });

      const result = await productsApi.getBySlug('xit-thom-phong-hoa-hong');

      expect(result.variants[0].salePrice).toBeUndefined();
    });

    it('rejects when getBySlug response fails schema validation', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: { id: 123 },
        },
      });

      await expect(
        productsApi.getBySlug('xit-thom-phong-hoa-hong'),
      ).rejects.toThrow();
    });

    it('propagates apiClient errors in getBySlug', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Product not found'),
      );

      await expect(productsApi.getBySlug('khong-ton-tai')).rejects.toThrow(
        'Product not found',
      );
    });
  });

  describe('search', () => {
    it('calls apiClient.get with search query and default empty filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [createMockProduct()],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
            hasNextPage: false,
          },
        },
      });

      const result = await productsApi.search('hoa hong');

      expect(apiClient.get).toHaveBeenCalledWith('/products', {
        params: { search: 'hoa hong' },
      });
      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('calls apiClient.get with search query merged with additional filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [createMockProduct()],
            total: 5,
            page: 2,
            limit: 5,
            totalPages: 1,
            hasNextPage: false,
          },
        },
      });

      const filters: ProductFilters = {
        minPrice: 100000,
        maxPrice: 300000,
        sortBy: 'best_selling',
        page: 2,
        limit: 5,
      };

      const result = await productsApi.search('hoa hong', filters);

      expect(apiClient.get).toHaveBeenCalledWith('/products', {
        params: {
          search: 'hoa hong',
          minPrice: 100000,
          maxPrice: 300000,
          sortBy: 'best_selling',
          page: 2,
          limit: 5,
        },
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('falls back to response.data when response.data.data is undefined in search', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          total: 8,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      const result = await productsApi.search('xit thom');

      expect(result.products).toEqual([]);
      expect(result.total).toBe(8);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('applies fallback values when search response fields are missing', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {},
      });

      const result = await productsApi.search('unknown');

      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
    });

    it('computes hasNextPage as true when page < totalPages and hasNextPage is omitted', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [],
            total: 50,
            page: 1,
            limit: 10,
            totalPages: 5,
          },
        },
      });

      const result = await productsApi.search('test');

      expect(result.hasNextPage).toBe(true);
    });

    it('computes hasNextPage as false when page >= totalPages and hasNextPage is omitted', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [],
            total: 10,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      });

      const result = await productsApi.search('test');

      expect(result.hasNextPage).toBe(false);
    });

    it('preserves explicit hasNextPage in search', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [],
            total: 20,
            page: 1,
            limit: 10,
            totalPages: 2,
            hasNextPage: false,
          },
        },
      });

      const result = await productsApi.search('test');

      expect(result.hasNextPage).toBe(false);
    });

    it('rejects when search result fails schema validation', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [{ invalidProduct: true }],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
          },
        },
      });

      await expect(productsApi.search('bad-response')).rejects.toThrow();
    });

    it('propagates apiClient errors in search', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Search service down'),
      );

      await expect(productsApi.search('error')).rejects.toThrow(
        'Search service down',
      );
    });
  });

  describe('getFilterOptions', () => {
    it('fetches filter options with response.data.data wrapper', async () => {
      const mockOptions = {
        brands: ['Brand Thai', 'Brand VN'],
        scents: ['Hoa nhài', 'Hoa hồng'],
        volumes: [50, 100],
        priceRange: { min: 20000, max: 500000 },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockOptions,
        },
      });

      const result = await productsApi.getFilterOptions();

      expect(apiClient.get).toHaveBeenCalledWith('/products/filters');
      expect(result).toEqual(mockOptions);
    });

    it('fetches filter options with direct response.data', async () => {
      const mockOptions = {
        brands: ['Brand A'],
        scents: ['Bạc hà'],
        volumes: [30],
        priceRange: { min: 30000, max: 100000 },
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockOptions,
      });

      const result = await productsApi.getFilterOptions();

      expect(result).toEqual(mockOptions);
    });

    it('propagates apiClient errors in getFilterOptions', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Failed to load filter options'),
      );

      await expect(productsApi.getFilterOptions()).rejects.toThrow(
        'Failed to load filter options',
      );
    });
  });
});
