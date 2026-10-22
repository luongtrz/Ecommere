import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import {
  productsApi,
  type ProductFilters,
  type ProductsResponse,
} from './products.api';

vi.mock('@/lib/api', () => {
  const mockClient = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mockClient,
    apiClient: mockClient,
  };
});

const mockRawProduct = {
  id: 'prod-1',
  name: 'Xịt Thơm Quần Áo Hương Hoa Nhài',
  slug: 'xit-thom-quan-ao-huong-hoa-nhai',
  description: 'Xịt thơm lưu hương lâu cho quần áo Thái Lan chính hãng',
  images: ['/images/spray-1.jpg', '/images/spray-2.jpg'],
  categoryId: 'cat-1',
  category: {
    id: 'cat-1',
    name: 'Xịt Quần Áo',
    slug: 'xit-quan-ao',
  },
  variants: [
    {
      id: 'var-1',
      scent: 'Hoa Nhài',
      volumeMl: 200,
      price: 180000,
      salePrice: 150000,
      stock: 50,
      sku: 'XQA-LAV-200',
      barcode: '893000111222',
    },
  ],
  basePrice: 180000,
  active: true,
  averageRating: 4.9,
  reviewCount: 42,
  createdAt: '2026-02-01T10:00:00.000Z',
};

const mockRawProductMinimal = {
  id: 'prod-2',
  name: 'Xịt Khử Mùi Ô Tô',
  slug: 'xit-khu-mui-o-to',
  description: 'Khử mùi xe hơi nhanh chóng',
  images: ['/images/car-1.jpg'],
  categoryId: 'cat-2',
  variants: [
    {
      id: 'var-2',
      scent: 'Bạc Hà',
      volumeMl: 100,
      price: 120000,
      salePrice: null,
      stock: 10,
      sku: 'XKM-BH-100',
      barcode: null,
    },
  ],
  basePrice: 120000,
  active: false,
  createdAt: '2026-02-10T15:30:00.000Z',
};

describe('productsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches products with default filters when called without arguments and handles wrapped response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [mockRawProduct],
            total: 10,
            page: 1,
            limit: 12,
            totalPages: 1,
          },
        },
      });

      const result: ProductsResponse = await productsApi.getAll();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/products', { params: {} });
      expect(result.products).toHaveLength(1);
      expect(result.products[0].id).toBe('prod-1');
      expect(result.products[0].rating).toBe(4.9);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(12);
      expect(result.totalPages).toBe(1);
    });

    it('fetches products with custom filters and handles unwrapped response', async () => {
      const filters: ProductFilters = {
        page: 2,
        limit: 8,
        categoryId: 'cat-1',
        categorySlug: 'xit-quan-ao',
        search: 'hoa nhai',
        minPrice: 100000,
        maxPrice: 200000,
        scent: 'Hoa Nhài',
        volumeMl: 200,
        sortBy: 'price_asc',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [mockRawProductMinimal],
            total: 25,
            page: 2,
            limit: 8,
            totalPages: 4,
          },
        },
      });

      const result = await productsApi.getAll(filters);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/products', {
        params: filters,
      });
      expect(result.products).toHaveLength(1);
      expect(result.products[0].id).toBe('prod-2');
      expect(result.products[0].rating).toBeUndefined();
      expect(result.products[0].category).toBeUndefined();
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(8);
      expect(result.totalPages).toBe(4);
    });

    it('uses fallback defaults when actualData fields are missing or empty', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {},
        },
      });

      const result = await productsApi.getAll();

      expect(result).toEqual({
        products: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 1,
      });
    });

    it('throws validation error when product data does not match schema', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [
              {
                id: 12345, // invalid id type
                name: 'Sản phẩm lỗi',
              },
            ],
          },
        },
      });

      await expect(productsApi.getAll()).rejects.toThrow();
    });

    it('propagates error when apiClient.get rejects', async () => {
      const networkError = new Error('Lỗi kết nối máy chủ');
      vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

      await expect(productsApi.getAll()).rejects.toThrow('Lỗi kết nối máy chủ');
    });
  });

  describe('getAllAdmin', () => {
    it('fetches admin products with default filters when called without arguments and handles wrapped response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [mockRawProduct],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
          },
        },
      });

      const result = await productsApi.getAllAdmin();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/products/admin', {
        params: {},
      });
      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Xịt Thơm Quần Áo Hương Hoa Nhài');
      expect(result.limit).toBe(20);
    });

    it('fetches admin products with custom filters and handles unwrapped response', async () => {
      const filters: ProductFilters = {
        page: 3,
        limit: 20,
        search: 'o to',
        sortBy: 'newest',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [mockRawProductMinimal],
            total: 50,
            page: 3,
            limit: 20,
            totalPages: 3,
          },
        },
      });

      const result = await productsApi.getAllAdmin(filters);

      expect(apiClient.get).toHaveBeenCalledWith('/products/admin', {
        params: filters,
      });
      expect(result.products[0].id).toBe('prod-2');
      expect(result.page).toBe(3);
    });

    it('uses fallback defaults when actualData fields are omitted', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {},
      });

      const result = await productsApi.getAllAdmin();

      expect(result).toEqual({
        products: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 1,
      });
    });

    it('throws validation error when admin product item violates schema', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [
              {
                id: 'prod-invalid',
                name: 'Invalid variant structure',
                slug: 'invalid',
                description: 'desc',
                images: [],
                categoryId: 'cat-1',
                variants: 'invalid-variants', // should be array
                basePrice: 100,
                active: true,
                createdAt: '2026-01-01',
              },
            ],
          },
        },
      });

      await expect(productsApi.getAllAdmin()).rejects.toThrow();
    });

    it('propagates error when apiClient.get rejects', async () => {
      const authError = new Error('Không có quyền truy cập');
      vi.mocked(apiClient.get).mockRejectedValueOnce(authError);

      await expect(productsApi.getAllAdmin()).rejects.toThrow(
        'Không có quyền truy cập',
      );
    });
  });

  describe('getBySlug', () => {
    it('fetches product by slug when response is doubly wrapped (actualData.data)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: mockRawProduct,
          },
        },
      });

      const result = await productsApi.getBySlug(
        'xit-thom-quan-ao-huong-hoa-nhai',
      );

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/products/slug/xit-thom-quan-ao-huong-hoa-nhai',
      );
      expect(result.id).toBe('prod-1');
      expect(result.name).toBe('Xịt Thơm Quần Áo Hương Hoa Nhài');
      expect(result.rating).toBe(4.9);
      expect(result.variants[0].scent).toBe('Hoa Nhài');
    });

    it('fetches product by slug when response is singly wrapped (actualData has no .data property)', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockRawProduct,
        },
      });

      const result = await productsApi.getBySlug(
        'xit-thom-quan-ao-huong-hoa-nhai',
      );

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/products/slug/xit-thom-quan-ao-huong-hoa-nhai',
      );
      expect(result.id).toBe('prod-1');
      expect(result.rating).toBe(4.9);
    });

    it('fetches product by slug when response data is unwrapped directly in response.data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockRawProductMinimal,
      });

      const result = await productsApi.getBySlug('xit-khu-mui-o-to');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/products/slug/xit-khu-mui-o-to',
      );
      expect(result.id).toBe('prod-2');
      expect(result.rating).toBeUndefined();
      expect(result.category).toBeUndefined();
    });

    it('throws validation error when product details do not conform to productSchema', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'invalid-prod',
          // missing required name, slug, description, etc.
        },
      });

      await expect(productsApi.getBySlug('invalid-prod')).rejects.toThrow();
    });

    it('propagates error when apiClient.get rejects', async () => {
      const notFoundError = new Error('Sản phẩm không tồn tại');
      vi.mocked(apiClient.get).mockRejectedValueOnce(notFoundError);

      await expect(productsApi.getBySlug('khong-ton-tai')).rejects.toThrow(
        'Sản phẩm không tồn tại',
      );
    });
  });

  describe('search', () => {
    it('searches products with query and default filters when called without filters', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [mockRawProduct],
            total: 1,
            page: 1,
            limit: 12,
            totalPages: 1,
          },
        },
      });

      const result = await productsApi.search('hoa nhai');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/products', {
        params: { search: 'hoa nhai' },
      });
      expect(result.products).toHaveLength(1);
      expect(result.products[0].id).toBe('prod-1');
      expect(result.total).toBe(1);
    });

    it('searches products with query and extra filters and handles unwrapped response', async () => {
      const extraFilters: ProductFilters = {
        minPrice: 50000,
        maxPrice: 150000,
        sortBy: 'rating',
        page: 2,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [mockRawProductMinimal],
            total: 15,
            page: 2,
            limit: 12,
            totalPages: 2,
          },
        },
      });

      const result = await productsApi.search('o to', extraFilters);

      expect(apiClient.get).toHaveBeenCalledWith('/products', {
        params: {
          search: 'o to',
          minPrice: 50000,
          maxPrice: 150000,
          sortBy: 'rating',
          page: 2,
        },
      });
      expect(result.products[0].name).toBe('Xịt Khử Mùi Ô Tô');
      expect(result.page).toBe(2);
    });

    it('uses fallback values for missing fields in search response', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {},
      });

      const result = await productsApi.search('khong-co-ket-qua');

      expect(result).toEqual({
        products: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 1,
      });
    });

    it('throws validation error when search response items violate schema', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: {
            data: [{ id: 9999 }],
          },
        },
      });

      await expect(productsApi.search('loi')).rejects.toThrow();
    });

    it('propagates error when apiClient.get rejects during search', async () => {
      const searchError = new Error('Lỗi tìm kiếm');
      vi.mocked(apiClient.get).mockRejectedValueOnce(searchError);

      await expect(productsApi.search('test')).rejects.toThrow('Lỗi tìm kiếm');
    });
  });
});
