import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  createReviewsInventoryTools,
  ReviewsInventoryToolDeps,
  isAdminAllowedPath,
  ADMIN_NAVIGATE_PATH_REGEX,
  ADMIN_ALLOWED_EXACT_PATHS,
  ADMIN_PRODUCTS_EDIT_REGEX,
  ADMIN_ORDERS_DETAIL_REGEX,
} from './reviews-inventory.tools';
import type { AgentToolDef, ToolContext } from '../tool.types';
import type { ReviewsService } from '../../../reviews/reviews.service';
import type { InventoryService } from '../../../inventory/inventory.service';
import type { UploadsService } from '../../../uploads/uploads.service';

describe('Reviews and Inventory Admin Tools - Coverage Companion', () => {
  let mockReviewsService: {
    getProductReviews: jest.Mock;
    getProductStats: jest.Mock;
    getAllReviewsForAdmin: jest.Mock;
    deleteReviewAsAdmin: jest.Mock;
  };

  let mockInventoryService: {
    adjustStock: jest.Mock;
    getStockHistory: jest.Mock;
    getLowStockVariants: jest.Mock;
    getAllStockLevels: jest.Mock;
  };

  let mockUploadsService: {
    deleteFile: jest.Mock;
  };

  let deps: ReviewsInventoryToolDeps;
  let tools: AgentToolDef[];

  const adminCtx: ToolContext = {
    userId: 'admin-user-001',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'thread-xyz-789',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockReviewsService = {
      getProductReviews: jest.fn(),
      getProductStats: jest.fn(),
      getAllReviewsForAdmin: jest.fn(),
      deleteReviewAsAdmin: jest.fn(),
    };

    mockInventoryService = {
      adjustStock: jest.fn(),
      getStockHistory: jest.fn(),
      getLowStockVariants: jest.fn(),
      getAllStockLevels: jest.fn(),
    };

    mockUploadsService = {
      deleteFile: jest.fn(),
    };

    deps = {
      reviews: mockReviewsService as unknown as ReviewsService,
      inventory: mockInventoryService as unknown as InventoryService,
      uploads: mockUploadsService as unknown as UploadsService,
    };

    tools = createReviewsInventoryTools(deps);
  });

  const getTool = (name: string): AgentToolDef => {
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return tool;
  };

  describe('isAdminAllowedPath function and constants', () => {
    it('verifies exported regex and set constants are defined', () => {
      expect(ADMIN_NAVIGATE_PATH_REGEX).toBeInstanceOf(RegExp);
      expect(ADMIN_PRODUCTS_EDIT_REGEX).toBeInstanceOf(RegExp);
      expect(ADMIN_ORDERS_DETAIL_REGEX).toBeInstanceOf(RegExp);
      expect(ADMIN_ALLOWED_EXACT_PATHS).toBeInstanceOf(Set);
      expect(ADMIN_ALLOWED_EXACT_PATHS.size).toBe(8);
    });

    it('returns false for non-string inputs', () => {
      expect(isAdminAllowedPath(undefined as any)).toBe(false);
      expect(isAdminAllowedPath(null as any)).toBe(false);
      expect(isAdminAllowedPath(123 as any)).toBe(false);
      expect(isAdminAllowedPath({} as any)).toBe(false);
      expect(isAdminAllowedPath([] as any)).toBe(false);
      expect(isAdminAllowedPath(true as any)).toBe(false);
    });

    it('returns false for paths failing ADMIN_NAVIGATE_PATH_REGEX', () => {
      expect(isAdminAllowedPath('')).toBe(false);
      expect(isAdminAllowedPath('//evil.example.com')).toBe(false);
      expect(isAdminAllowedPath('admin/products')).toBe(false); // missing leading slash
      expect(isAdminAllowedPath('/admin?param=true')).toBe(false); // invalid query character
      expect(isAdminAllowedPath('/admin/orders#hash')).toBe(false); // invalid hash character
      expect(isAdminAllowedPath('/admin/orders/ ')).toBe(false); // space not allowed
      const tooLong = '/' + 'a'.repeat(121);
      expect(isAdminAllowedPath(tooLong)).toBe(false);
    });

    it('returns true for every exact path in ADMIN_ALLOWED_EXACT_PATHS', () => {
      for (const exactPath of ADMIN_ALLOWED_EXACT_PATHS) {
        expect(isAdminAllowedPath(exactPath)).toBe(true);
      }
    });

    it('returns true for valid /admin/products/:id/edit paths', () => {
      expect(isAdminAllowedPath('/admin/products/p-100/edit')).toBe(true);
      expect(isAdminAllowedPath('/admin/products/prod_perfume_rose/edit')).toBe(
        true,
      );
    });

    it('returns false for malformed products edit paths', () => {
      expect(isAdminAllowedPath('/admin/products//edit')).toBe(false);
      expect(isAdminAllowedPath('/admin/products/edit')).toBe(false);
      expect(isAdminAllowedPath('/admin/products/p-1/edit/extra')).toBe(false);
    });

    it('returns true for valid /admin/orders/:id paths', () => {
      expect(isAdminAllowedPath('/admin/orders/ord-12345')).toBe(true);
      expect(isAdminAllowedPath('/admin/orders/ORDER_999')).toBe(true);
    });

    it('returns false for malformed orders detail paths and other unknown paths', () => {
      expect(isAdminAllowedPath('/admin/orders/')).toBe(false);
      expect(isAdminAllowedPath('/admin/orders/ord-1/items')).toBe(false);
      expect(isAdminAllowedPath('/admin/settings')).toBe(false);
      expect(isAdminAllowedPath('/admin/customers')).toBe(false);
      expect(isAdminAllowedPath('/admin/analytics')).toBe(false);
    });
  });

  describe('tagAuditNotes behavior in stock mutations', () => {
    it('stock_remove attaches "[AI:<threadId>] " prefix when notes is undefined', async () => {
      const tool = getTool('stock_remove');
      mockInventoryService.adjustStock.mockResolvedValue({ id: 'mov-10' });

      await tool.handler(
        { variantId: 'var-99', quantity: 3, notes: undefined },
        adminCtx,
      );

      expect(mockInventoryService.adjustStock).toHaveBeenCalledTimes(1);
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        {
          variantId: 'var-99',
          type: 'OUT',
          quantity: 3,
          notes: '[AI:thread-xyz-789] ',
        },
        'admin-user-001',
      );
    });

    it('stock_set attaches "[AI:<threadId>] " prefix when notes is omitted or empty', async () => {
      const tool = getTool('stock_set');
      mockInventoryService.adjustStock.mockResolvedValue({ id: 'mov-11' });

      await tool.handler({ variantId: 'var-88', quantity: 0 }, adminCtx);

      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        {
          variantId: 'var-88',
          type: 'ADJUST',
          quantity: 0,
          notes: '[AI:thread-xyz-789] ',
        },
        'admin-user-001',
      );

      mockInventoryService.adjustStock.mockClear();

      await tool.handler(
        { variantId: 'var-88', quantity: 5, notes: '' },
        adminCtx,
      );

      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        {
          variantId: 'var-88',
          type: 'ADJUST',
          quantity: 5,
          notes: '[AI:thread-xyz-789] ',
        },
        'admin-user-001',
      );
    });

    it('stock_add attaches "[AI:<threadId>] " prefix when notes is empty string', async () => {
      const tool = getTool('stock_add');
      mockInventoryService.adjustStock.mockResolvedValue({ id: 'mov-12' });

      await tool.handler(
        { variantId: 'var-77', quantity: 10, notes: '' },
        adminCtx,
      );

      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        {
          variantId: 'var-77',
          type: 'IN',
          quantity: 10,
          notes: '[AI:thread-xyz-789] ',
        },
        'admin-user-001',
      );
    });
  });

  describe('projectReviewsList projections and edge cases', () => {
    let tool: AgentToolDef;

    beforeEach(() => {
      tool = getTool('list_reviews');
    });

    it('returns raw result as-is if result is null, undefined, or primitive', () => {
      expect(tool.project!(null)).toBeNull();
      expect(tool.project!(undefined)).toBeUndefined();
      expect(tool.project!('simple string')).toBe('simple string');
      expect(tool.project!(42)).toBe(42);
      expect(tool.project!(false)).toBe(false);
    });

    it('handles bare array input directly and limits items to 20', () => {
      const rawArray = Array.from({ length: 25 }, (_, i) => ({
        id: `rev-${i + 1}`,
        rating: 4,
        content: `Review content ${i + 1}`,
        createdAt: '2026-03-01',
        authorName: `User ${i + 1}`,
        productName: `Product ${i + 1}`,
      }));

      const projected = tool.project!(rawArray) as any[];
      expect(Array.isArray(projected)).toBe(true);
      expect(projected).toHaveLength(20);
      expect(projected[0]).toEqual({
        id: 'rev-1',
        rating: 4,
        content: 'Review content 1',
        createdAt: '2026-03-01',
        authorName: 'User 1',
        productName: 'Product 1',
      });
    });

    it('returns result unchanged if result is an object without data array', () => {
      const customObj = { status: 'ok', count: 0 };
      expect(tool.project!(customObj)).toEqual(customObj);
    });

    it('projectItem handles null item, non-string content, and fallback authorName / productName', () => {
      const rawData = [
        null,
        'non-object-item',
        {
          id: 'rev-item-1',
          rating: 5,
          content: null, // non-string content
          createdAt: '2026-01-01',
          authorName: 'Fallback Author',
          productName: 'Fallback Product',
        },
        {
          id: 'rev-item-2',
          rating: 3,
          content: 12345, // non-string number content
          createdAt: '2026-01-02',
          // no user and no authorName
          // no product and no productName
        },
        {
          id: 'rev-item-3',
          rating: 5,
          content: 'x'.repeat(400),
          createdAt: '2026-01-03',
          user: { name: 'Nested User' },
          product: { name: 'Nested Product' },
        },
      ];

      const projected = tool.project!(rawData) as any[];
      expect(projected[0]).toBeNull();
      expect(projected[1]).toBe('non-object-item');

      expect(projected[2]).toEqual({
        id: 'rev-item-1',
        rating: 5,
        content: null,
        createdAt: '2026-01-01',
        authorName: 'Fallback Author',
        productName: 'Fallback Product',
      });

      expect(projected[3]).toEqual({
        id: 'rev-item-2',
        rating: 3,
        content: 12345,
        createdAt: '2026-01-02',
        authorName: null,
        productName: null,
      });

      expect(projected[4].content).toHaveLength(300);
      expect(projected[4].authorName).toBe('Nested User');
      expect(projected[4].productName).toBe('Nested Product');
    });
  });

  describe('projectListMax20 projections and edge cases', () => {
    let tool: AgentToolDef;

    beforeEach(() => {
      tool = getTool('get_stock_levels');
    });

    it('returns raw result as-is if result is null, undefined, or primitive', () => {
      expect(tool.project!(null)).toBeNull();
      expect(tool.project!(undefined)).toBeUndefined();
      expect(tool.project!('not an object')).toBe('not an object');
      expect(tool.project!(999)).toBe(999);
    });

    it('handles bare array input directly and limits items to 20', () => {
      const bareArray = Array.from({ length: 30 }, (_, i) => ({
        id: `variant-${i + 1}`,
        stock: i * 10,
      }));

      const projected = tool.project!(bareArray) as any[];
      expect(Array.isArray(projected)).toBe(true);
      expect(projected).toHaveLength(20);
      expect(projected[0].id).toBe('variant-1');
      expect(projected[19].id).toBe('variant-20');
    });

    it('returns result unchanged if result is an object without data array', () => {
      const nonDataObj = { total: 100, page: 1, items: [] };
      expect(tool.project!(nonDataObj)).toEqual(nonDataObj);
    });
  });

  describe('summarize edge cases and optional argument fallbacks', () => {
    it('list_reviews summarize handles null/undefined args', () => {
      const tool = getTool('list_reviews');
      expect(tool.summarize(undefined as any)).toBe(
        'Xem danh sách đánh giá toàn cửa hàng',
      );
      expect(tool.summarize(null as any)).toBe(
        'Xem danh sách đánh giá toàn cửa hàng',
      );
      expect(tool.summarize({})).toBe('Xem danh sách đánh giá toàn cửa hàng');
      expect(tool.summarize({ productId: 'prod-abc' })).toBe(
        'Xem danh sách đánh giá của sản phẩm prod-abc',
      );
    });

    it('get_stock_levels summarize handles null/undefined/missing page', () => {
      const tool = getTool('get_stock_levels');
      expect(tool.summarize(undefined as any)).toBe('Xem mức tồn kho sản phẩm');
      expect(tool.summarize({})).toBe('Xem mức tồn kho sản phẩm');
      expect(tool.summarize({ page: 4 })).toBe(
        'Xem mức tồn kho sản phẩm (trang 4)',
      );
    });

    it('get_low_stock summarize handles null/undefined/missing threshold', () => {
      const tool = getTool('get_low_stock');
      expect(tool.summarize(undefined as any)).toBe(
        'Xem danh sách sản phẩm sắp hết hàng (ngưỡng 10)',
      );
      expect(tool.summarize({})).toBe(
        'Xem danh sách sản phẩm sắp hết hàng (ngưỡng 10)',
      );
      expect(tool.summarize({ threshold: 25 })).toBe(
        'Xem danh sách sản phẩm sắp hết hàng (ngưỡng 25)',
      );
    });

    it('get_stock_history summarize handles missing page vs present page', () => {
      const tool = getTool('get_stock_history');
      expect(tool.summarize({ variantId: 'v-100', page: 3 })).toBe(
        'Xem lịch sử tồn kho biến thể v-100 (trang 3)',
      );
      expect(tool.summarize({ variantId: 'v-100' })).toBe(
        'Xem lịch sử tồn kho biến thể v-100',
      );
    });
  });

  describe('Dependency failure and error paths for all 12 tools', () => {
    it('get_product_reviews propagates NotFoundException when reviews service fails', async () => {
      const tool = getTool('get_product_reviews');
      mockReviewsService.getProductReviews.mockRejectedValue(
        new NotFoundException('Sản phẩm không tồn tại'),
      );

      await expect(
        tool.handler({ productId: 'prod-none' }, adminCtx),
      ).rejects.toThrow(NotFoundException);
      await expect(
        tool.handler({ productId: 'prod-none' }, adminCtx),
      ).rejects.toThrow('Sản phẩm không tồn tại');
    });

    it('get_review_stats propagates NotFoundException when reviews service fails', async () => {
      const tool = getTool('get_review_stats');
      mockReviewsService.getProductStats.mockRejectedValue(
        new NotFoundException('Không tìm thấy thống kê'),
      );

      await expect(
        tool.handler({ productId: 'prod-none' }, adminCtx),
      ).rejects.toThrow(NotFoundException);
      await expect(
        tool.handler({ productId: 'prod-none' }, adminCtx),
      ).rejects.toThrow('Không tìm thấy thống kê');
    });

    it('list_reviews propagates BadRequestException when reviews service fails', async () => {
      const tool = getTool('list_reviews');
      mockReviewsService.getAllReviewsForAdmin.mockRejectedValue(
        new BadRequestException('Bộ lọc đánh giá không hợp lệ'),
      );

      await expect(
        tool.handler({ rating: 5, page: 1 }, adminCtx),
      ).rejects.toThrow(BadRequestException);
      await expect(
        tool.handler({ rating: 5, page: 1 }, adminCtx),
      ).rejects.toThrow('Bộ lọc đánh giá không hợp lệ');
    });

    it('delete_review propagates NotFoundException when review does not exist', async () => {
      const tool = getTool('delete_review');
      mockReviewsService.deleteReviewAsAdmin.mockRejectedValue(
        new NotFoundException('Đánh giá không tồn tại'),
      );

      await expect(
        tool.handler({ reviewId: 'rev-missing' }, adminCtx),
      ).rejects.toThrow(NotFoundException);
      await expect(
        tool.handler({ reviewId: 'rev-missing' }, adminCtx),
      ).rejects.toThrow('Đánh giá không tồn tại');
    });

    it('get_stock_levels propagates InternalServerErrorException on database error', async () => {
      const tool = getTool('get_stock_levels');
      mockInventoryService.getAllStockLevels.mockRejectedValue(
        new InternalServerErrorException('Lỗi cơ sở dữ liệu tồn kho'),
      );

      await expect(tool.handler({}, adminCtx)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(tool.handler({}, adminCtx)).rejects.toThrow(
        'Lỗi cơ sở dữ liệu tồn kho',
      );
    });

    it('get_low_stock propagates Error on service failure', async () => {
      const tool = getTool('get_low_stock');
      mockInventoryService.getLowStockVariants.mockRejectedValue(
        new Error('Inventory service failure'),
      );

      await expect(tool.handler({ threshold: 5 }, adminCtx)).rejects.toThrow(
        Error,
      );
      await expect(tool.handler({ threshold: 5 }, adminCtx)).rejects.toThrow(
        'Inventory service failure',
      );
    });

    it('get_stock_history propagates NotFoundException when variant does not exist', async () => {
      const tool = getTool('get_stock_history');
      mockInventoryService.getStockHistory.mockRejectedValue(
        new NotFoundException('Biến thể không tồn tại'),
      );

      await expect(
        tool.handler({ variantId: 'var-missing' }, adminCtx),
      ).rejects.toThrow(NotFoundException);
      await expect(
        tool.handler({ variantId: 'var-missing' }, adminCtx),
      ).rejects.toThrow('Biến thể không tồn tại');
    });

    it('stock_add propagates BadRequestException on validation failure in service', async () => {
      const tool = getTool('stock_add');
      mockInventoryService.adjustStock.mockRejectedValue(
        new BadRequestException('Biến thể đã bị vô hiệu hóa'),
      );

      await expect(
        tool.handler({ variantId: 'var-disabled', quantity: 10 }, adminCtx),
      ).rejects.toThrow(BadRequestException);
      await expect(
        tool.handler({ variantId: 'var-disabled', quantity: 10 }, adminCtx),
      ).rejects.toThrow('Biến thể đã bị vô hiệu hóa');
    });

    it('stock_remove propagates BadRequestException on negative stock error', async () => {
      const tool = getTool('stock_remove');
      mockInventoryService.adjustStock.mockRejectedValue(
        new BadRequestException('Tồn kho không đủ để xuất'),
      );

      await expect(
        tool.handler({ variantId: 'var-1', quantity: 500 }, adminCtx),
      ).rejects.toThrow(BadRequestException);
      await expect(
        tool.handler({ variantId: 'var-1', quantity: 500 }, adminCtx),
      ).rejects.toThrow('Tồn kho không đủ để xuất');
    });

    it('stock_set propagates NotFoundException when variant not found', async () => {
      const tool = getTool('stock_set');
      mockInventoryService.adjustStock.mockRejectedValue(
        new NotFoundException('Không tìm thấy biến thể'),
      );

      await expect(
        tool.handler({ variantId: 'var-none', quantity: 10 }, adminCtx),
      ).rejects.toThrow(NotFoundException);
      await expect(
        tool.handler({ variantId: 'var-none', quantity: 10 }, adminCtx),
      ).rejects.toThrow('Không tìm thấy biến thể');
    });

    it('delete_image propagates BadRequestException when image deletion fails', async () => {
      const tool = getTool('delete_image');
      mockUploadsService.deleteFile.mockRejectedValue(
        new BadRequestException('Không thể xóa ảnh từ Cloudinary'),
      );

      await expect(
        tool.handler({ publicId: 'products/invalid' }, adminCtx),
      ).rejects.toThrow(BadRequestException);
      await expect(
        tool.handler({ publicId: 'products/invalid' }, adminCtx),
      ).rejects.toThrow('Không thể xóa ảnh từ Cloudinary');
    });

    it('navigate_to throws Error with exact message when handler is called with disallowed path', async () => {
      const tool = getTool('navigate_to');

      await expect(
        tool.handler({ path: '/admin/forbidden-path' }, adminCtx),
      ).rejects.toThrow(Error);
      await expect(
        tool.handler({ path: '/admin/forbidden-path' }, adminCtx),
      ).rejects.toThrow(
        'Đường dẫn quản trị không hợp lệ hoặc không được phép truy cập',
      );
    });
  });
});
