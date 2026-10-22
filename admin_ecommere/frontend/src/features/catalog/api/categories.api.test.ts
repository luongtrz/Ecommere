import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import { categoriesApi, type Category } from './categories.api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('categoriesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns parsed categories when API wraps data in response.data.data', async () => {
      const mockRawCategories: Category[] = [
        {
          id: 'cat-1',
          name: 'Xịt thơm phòng',
          slug: 'xit-thom-phong',
          description: 'Hương thơm tự nhiên cho căn phòng',
        },
        {
          id: 'cat-2',
          name: 'Tinh dầu thơm',
          slug: 'tinh-dau-thom',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockRawCategories,
        },
      });

      const result = await categoriesApi.getAll();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockRawCategories);
    });

    it('returns parsed categories when API returns data directly in response.data', async () => {
      const mockRawCategories: Category[] = [
        {
          id: 'cat-3',
          name: 'Sáp thơm để phòng',
          slug: 'sap-thom-de-phong',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockRawCategories,
      });

      const result = await categoriesApi.getAll();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual([
        {
          id: 'cat-3',
          name: 'Sáp thơm để phòng',
          slug: 'sap-thom-de-phong',
        },
      ]);
    });

    it('throws validation error when category data does not match schema', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: [
          {
            id: 12345, // invalid type, should be string
            name: 'Sai định dạng',
          },
        ],
      });

      await expect(categoriesApi.getAll()).rejects.toThrow();
    });

    it('propagates error when apiClient.get rejects', async () => {
      const networkError = new Error('Lỗi kết nối mạng');
      vi.mocked(apiClient.get).mockRejectedValueOnce(networkError);

      await expect(categoriesApi.getAll()).rejects.toThrow('Lỗi kết nối mạng');
    });
  });

  describe('getBySlug', () => {
    it('returns parsed category when API wraps data in response.data.data', async () => {
      const mockCategory: Category = {
        id: 'cat-1',
        name: 'Xịt thơm phòng',
        slug: 'xit-thom-phong',
        description: 'Mô tả chi tiết',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockCategory,
        },
      });

      const result = await categoriesApi.getBySlug('xit-thom-phong');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/categories/slug/xit-thom-phong',
      );
      expect(result).toEqual(mockCategory);
    });

    it('returns parsed category when API returns data directly in response.data', async () => {
      const mockCategory: Category = {
        id: 'cat-2',
        name: 'Tinh dầu thơm',
        slug: 'tinh-dau-thom',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockCategory,
      });

      const result = await categoriesApi.getBySlug('tinh-dau-thom');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/categories/slug/tinh-dau-thom',
      );
      expect(result).toEqual(mockCategory);
    });

    it('throws validation error when category object violates schema', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          id: 'cat-invalid',
          // missing required name and slug
        },
      });

      await expect(categoriesApi.getBySlug('cat-invalid')).rejects.toThrow();
    });

    it('propagates error when apiClient.get rejects', async () => {
      const notFoundError = new Error('Không tìm thấy danh mục');
      vi.mocked(apiClient.get).mockRejectedValueOnce(notFoundError);

      await expect(categoriesApi.getBySlug('khong-ton-tai')).rejects.toThrow(
        'Không tìm thấy danh mục',
      );
    });
  });
});
