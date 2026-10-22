import { describe, expect, it, vi, beforeEach } from 'vitest';
import apiClient from '@/lib/api';
import { categoriesApi, type CategoryTreeNode } from './categories.api';

vi.mock('@/lib/api', () => ({
  default: {
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
      const mockRawCategories = [
        {
          id: 'cat-1',
          name: 'Xịt thơm phòng',
          slug: 'xit-thom-phong',
          description: 'Hương thơm tự nhiên cho căn phòng',
          parentId: null,
        },
        {
          id: 'cat-2',
          name: 'Tinh dầu thơm',
          slug: 'tinh-dau-thom',
          parentId: 'cat-1',
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
      const mockRawCategories = [
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
      const mockCategory = {
        id: 'cat-1',
        name: 'Xịt thơm phòng',
        slug: 'xit-thom-phong',
        description: 'Mô tả chi tiết',
        parentId: null,
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
      const mockCategory = {
        id: 'cat-2',
        name: 'Tinh dầu thơm',
        slug: 'tinh-dau-thom',
        parentId: 'cat-1',
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

  describe('getTree', () => {
    it('returns category tree when API wraps data in response.data.data', async () => {
      const mockTree: CategoryTreeNode[] = [
        {
          id: 'cat-1',
          name: 'Xịt thơm phòng',
          slug: 'xit-thom-phong',
          parentId: null,
          productCount: 15,
          isLeaf: false,
          children: [
            {
              id: 'cat-1-1',
              name: 'Xịt phòng tự động',
              slug: 'xit-phong-tu-dong',
              parentId: 'cat-1',
              productCount: 8,
              children: [],
              isLeaf: true,
            },
          ],
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          data: mockTree,
        },
      });

      const result = await categoriesApi.getTree();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories/tree');
      expect(result).toEqual(mockTree);
    });

    it('returns category tree when API returns data directly in response.data', async () => {
      const mockTree: CategoryTreeNode[] = [
        {
          id: 'cat-2',
          name: 'Đuổi chuột & Côn trùng',
          slug: 'duoi-chuot-con-trung',
          parentId: null,
          productCount: 5,
          children: [],
          isLeaf: true,
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockTree,
      });

      const result = await categoriesApi.getTree();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/categories/tree');
      expect(result).toEqual(mockTree);
    });

    it('propagates error when apiClient.get rejects', async () => {
      const serverError = new Error('Lỗi máy chủ khi lấy cây danh mục');
      vi.mocked(apiClient.get).mockRejectedValueOnce(serverError);

      await expect(categoriesApi.getTree()).rejects.toThrow(
        'Lỗi máy chủ khi lấy cây danh mục',
      );
    });
  });
});
