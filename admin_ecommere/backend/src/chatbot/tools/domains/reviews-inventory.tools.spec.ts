import {
  createReviewsInventoryTools,
  ReviewsInventoryToolDeps,
} from './reviews-inventory.tools';
import type { AgentToolDef, ToolContext } from '../tool.types';
import type { ReviewsService } from '../../../reviews/reviews.service';
import type { InventoryService } from '../../../inventory/inventory.service';
import type { UploadsService } from '../../../uploads/uploads.service';

describe('Reviews and Inventory Admin Tools', () => {
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

  describe('Factory and General Requirements', () => {
    it('returns exactly 12 tools with unique names', () => {
      expect(tools).toHaveLength(12);
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(12);
      expect(names).toEqual([
        'get_product_reviews',
        'get_review_stats',
        'list_reviews',
        'delete_review',
        'get_stock_levels',
        'get_low_stock',
        'get_stock_history',
        'stock_add',
        'stock_remove',
        'stock_set',
        'delete_image',
        'navigate_to',
      ]);
    });

    it('sets auth to "admin" on all tools', () => {
      for (const tool of tools) {
        expect(tool.auth).toBe('admin');
      }
    });

    it('assigns correct risk levels: delete_review and delete_image are DESTRUCTIVE, stock_set is SENSITIVE, stock writes and navigate_to are WRITE, reads are READ', () => {
      expect(getTool('delete_review').risk).toBe('DESTRUCTIVE');
      expect(getTool('delete_image').risk).toBe('DESTRUCTIVE');
      expect(getTool('stock_set').risk).toBe('SENSITIVE');
      expect(getTool('stock_add').risk).toBe('WRITE');
      expect(getTool('stock_remove').risk).toBe('WRITE');
      expect(getTool('navigate_to').risk).toBe('WRITE');

      expect(getTool('get_product_reviews').risk).toBe('READ');
      expect(getTool('get_review_stats').risk).toBe('READ');
      expect(getTool('list_reviews').risk).toBe('READ');
      expect(getTool('get_stock_levels').risk).toBe('READ');
      expect(getTool('get_low_stock').risk).toBe('READ');
      expect(getTool('get_stock_history').risk).toBe('READ');
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

        const checkUserId = tool.schema.safeParse({ userId: 'admin-1' });
        expect(checkUserId.success).toBe(false);

        const checkRole = tool.schema.safeParse({ role: 'ADMIN' });
        expect(checkRole.success).toBe(false);
      }
    });

    it('ensures each tool has a summarize function returning a non-empty Vietnamese string', () => {
      const dummyArgs: Record<string, any> = {
        productId: 'prod-001',
        reviewId: 'rev-001',
        variantId: 'var-001',
        quantity: 10,
        page: 1,
        limit: 10,
        threshold: 5,
        publicId: 'img-001',
        path: '/admin',
      };

      for (const tool of tools) {
        const summary = tool.summarize(dummyArgs);
        expect(typeof summary).toBe('string');
        expect(summary.trim().length).toBeGreaterThan(0);
      }
    });

    it('defines uiAction only for navigate_to, leaving it undefined for the other 11 tools', () => {
      expect(getTool('navigate_to').uiAction).toBeDefined();

      const toolsWithoutUiAction = tools.filter(
        (t) => t.name !== 'navigate_to',
      );
      for (const tool of toolsWithoutUiAction) {
        expect(tool.uiAction).toBeUndefined();
      }
    });
  });

  describe('get_product_reviews', () => {
    it('has risk READ and calls reviews.getProductReviews with productId and filter', async () => {
      const tool = getTool('get_product_reviews');
      expect(tool.risk).toBe('READ');

      const mockResponse = { data: [], total: 0 };
      mockReviewsService.getProductReviews.mockResolvedValue(mockResponse);

      const args = {
        productId: 'prod-123',
        page: 2,
        limit: 15,
        rating: 4,
      };

      const result = await tool.handler(args, adminCtx);

      expect(mockReviewsService.getProductReviews).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.getProductReviews).toHaveBeenCalledWith(
        'prod-123',
        { page: 2, limit: 15, rating: 4 },
      );
      expect(result).toEqual(mockResponse);
    });

    it('accepts minimal arguments (only productId)', async () => {
      const tool = getTool('get_product_reviews');
      mockReviewsService.getProductReviews.mockResolvedValue({
        data: [],
        total: 0,
      });

      const parsed = tool.schema.safeParse({ productId: 'prod-456' });
      expect(parsed.success).toBe(true);

      await tool.handler({ productId: 'prod-456' }, adminCtx);

      expect(mockReviewsService.getProductReviews).toHaveBeenCalledWith(
        'prod-456',
        { page: undefined, limit: undefined, rating: undefined },
      );
    });

    it('validates bounds for productId, page, limit, rating', () => {
      const tool = getTool('get_product_reviews');

      expect(tool.schema.safeParse({ productId: '' }).success).toBe(false);
      expect(tool.schema.safeParse({ productId: 'a'.repeat(65) }).success).toBe(
        false,
      );

      expect(tool.schema.safeParse({ productId: 'p1', page: 0 }).success).toBe(
        false,
      );
      expect(tool.schema.safeParse({ productId: 'p1', page: 51 }).success).toBe(
        false,
      );

      expect(tool.schema.safeParse({ productId: 'p1', limit: 0 }).success).toBe(
        false,
      );
      expect(
        tool.schema.safeParse({ productId: 'p1', limit: 51 }).success,
      ).toBe(false);

      expect(
        tool.schema.safeParse({ productId: 'p1', rating: 0 }).success,
      ).toBe(false);
      expect(
        tool.schema.safeParse({ productId: 'p1', rating: 6 }).success,
      ).toBe(false);
      expect(
        tool.schema.safeParse({ productId: 'p1', rating: 5 }).success,
      ).toBe(true);
    });

    it('summarize returns a Vietnamese string mentioning productId', () => {
      const tool = getTool('get_product_reviews');
      expect(tool.summarize({ productId: 'prod-123' })).toContain('prod-123');
    });
  });

  describe('get_review_stats', () => {
    it('has risk READ and calls reviews.getProductStats with productId', async () => {
      const tool = getTool('get_review_stats');
      expect(tool.risk).toBe('READ');

      const mockStats = {
        totalReviews: 12,
        averageRating: 4.5,
        ratingDistribution: { 5: 8, 4: 4, 3: 0, 2: 0, 1: 0 },
      };
      mockReviewsService.getProductStats.mockResolvedValue(mockStats);

      const result = await tool.handler({ productId: 'prod-789' }, adminCtx);

      expect(mockReviewsService.getProductStats).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.getProductStats).toHaveBeenCalledWith(
        'prod-789',
      );
      expect(result).toEqual(mockStats);
    });

    it('validates bounds for productId (1..64)', () => {
      const tool = getTool('get_review_stats');
      expect(tool.schema.safeParse({ productId: '' }).success).toBe(false);
      expect(tool.schema.safeParse({ productId: 'a'.repeat(65) }).success).toBe(
        false,
      );
      expect(tool.schema.safeParse({ productId: 'prod-ok' }).success).toBe(
        true,
      );
    });

    it('summarize returns a Vietnamese string mentioning productId', () => {
      const tool = getTool('get_review_stats');
      expect(tool.summarize({ productId: 'prod-789' })).toContain('prod-789');
    });
  });

  describe('list_reviews', () => {
    it('has risk READ and calls reviews.getAllReviewsForAdmin with filter', async () => {
      const tool = getTool('list_reviews');
      expect(tool.risk).toBe('READ');

      mockReviewsService.getAllReviewsForAdmin.mockResolvedValue({
        data: [],
        total: 0,
      });

      const args = {
        productId: 'prod-100',
        rating: 5,
        page: 1,
        limit: 20,
      };

      await tool.handler(args, adminCtx);

      expect(mockReviewsService.getAllReviewsForAdmin).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.getAllReviewsForAdmin).toHaveBeenCalledWith(
        args,
      );
    });

    it('validates schema bounds for productId, rating, page, limit', () => {
      const tool = getTool('list_reviews');
      expect(tool.schema.safeParse({ productId: '' }).success).toBe(false);
      expect(tool.schema.safeParse({ productId: 'a'.repeat(65) }).success).toBe(
        false,
      );
      expect(tool.schema.safeParse({ rating: 0 }).success).toBe(false);
      expect(tool.schema.safeParse({ rating: 6 }).success).toBe(false);
      expect(tool.schema.safeParse({ page: 0 }).success).toBe(false);
      expect(tool.schema.safeParse({ page: 51 }).success).toBe(false);
      expect(tool.schema.safeParse({ limit: 0 }).success).toBe(false);
      expect(tool.schema.safeParse({ limit: 101 }).success).toBe(false);

      expect(tool.schema.safeParse({}).success).toBe(true);
      expect(
        tool.schema.safeParse({
          productId: 'p1',
          rating: 4,
          page: 1,
          limit: 100,
        }).success,
      ).toBe(true);
    });

    it('project() keeps at most 20 items, cuts content to 300 characters, keeps author and product names', () => {
      const tool = getTool('list_reviews');
      expect(tool.project).toBeDefined();

      const sampleReviews = Array.from({ length: 25 }, (_, i) => ({
        id: `rev-${i + 1}`,
        rating: 5,
        content: `Nội dung đánh giá ${i + 1} `.repeat(30), // > 300 chars
        createdAt: new Date('2026-01-01T00:00:00Z'),
        userId: `user-${i + 1}`,
        productId: `prod-${i + 1}`,
        user: {
          id: `user-${i + 1}`,
          name: `Khách hàng ${i + 1}`,
          email: 'test@example.com',
        },
        product: {
          id: `prod-${i + 1}`,
          name: `Sản phẩm ${i + 1}`,
          slug: `san-pham-${i + 1}`,
        },
      }));

      const rawResult = {
        data: sampleReviews,
        total: 25,
        page: 1,
        limit: 25,
      };

      const projected = tool.project!(rawResult) as {
        data: any[];
        total: number;
      };
      expect(projected.data).toHaveLength(20);

      const first = projected.data[0];
      expect(first.id).toBe('rev-1');
      expect(first.rating).toBe(5);
      expect(first.content.length).toBeLessThanOrEqual(300);
      expect(first.authorName).toBe('Khách hàng 1');
      expect(first.productName).toBe('Sản phẩm 1');
      expect(first.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));

      // Check stripped fields
      expect(first).not.toHaveProperty('userId');
      expect(first).not.toHaveProperty('user');
      expect(first).not.toHaveProperty('product');
    });

    it('summarize returns a Vietnamese string mentioning productId when provided', () => {
      const tool = getTool('list_reviews');
      expect(tool.summarize({ productId: 'prod-999' })).toContain('prod-999');
      expect(tool.summarize({})).toBe('Xem danh sách đánh giá toàn cửa hàng');
    });
  });

  describe('delete_review', () => {
    it('has risk DESTRUCTIVE, exact description, and calls reviews.deleteReviewAsAdmin', async () => {
      const tool = getTool('delete_review');
      expect(tool.risk).toBe('DESTRUCTIVE');
      expect(tool.description).toBe(
        'Xóa đánh giá của khách hàng. Không hoàn tác được. Quản trị viên có thể xóa mọi đánh giá.',
      );

      mockReviewsService.deleteReviewAsAdmin.mockResolvedValue({
        message: 'Review deleted successfully',
      });

      const result = await tool.handler({ reviewId: 'rev-target-1' }, adminCtx);

      expect(mockReviewsService.deleteReviewAsAdmin).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.deleteReviewAsAdmin).toHaveBeenCalledWith(
        'rev-target-1',
      );
      expect(result).toEqual({ message: 'Review deleted successfully' });
    });

    it('validates bounds for reviewId (1..64)', () => {
      const tool = getTool('delete_review');
      expect(tool.schema.safeParse({ reviewId: '' }).success).toBe(false);
      expect(tool.schema.safeParse({ reviewId: 'a'.repeat(65) }).success).toBe(
        false,
      );
      expect(tool.schema.safeParse({ reviewId: 'rev-valid' }).success).toBe(
        true,
      );
    });

    it('summarize returns a Vietnamese string mentioning reviewId', () => {
      const tool = getTool('delete_review');
      expect(tool.summarize({ reviewId: 'rev-target-1' })).toContain(
        'rev-target-1',
      );
    });
  });

  describe('get_stock_levels', () => {
    it('has risk READ and calls inventory.getAllStockLevels with pagination', async () => {
      const tool = getTool('get_stock_levels');
      expect(tool.risk).toBe('READ');

      mockInventoryService.getAllStockLevels.mockResolvedValue({
        data: [],
        total: 0,
      });

      await tool.handler({ page: 2, limit: 30 }, adminCtx);

      expect(mockInventoryService.getAllStockLevels).toHaveBeenCalledTimes(1);
      expect(mockInventoryService.getAllStockLevels).toHaveBeenCalledWith({
        page: 2,
        limit: 30,
      });
    });

    it('validates schema bounds for page (1..50) and limit (1..100)', () => {
      const tool = getTool('get_stock_levels');
      expect(tool.schema.safeParse({ page: 0 }).success).toBe(false);
      expect(tool.schema.safeParse({ page: 51 }).success).toBe(false);
      expect(tool.schema.safeParse({ limit: 0 }).success).toBe(false);
      expect(tool.schema.safeParse({ limit: 101 }).success).toBe(false);
      expect(tool.schema.safeParse({ page: 1, limit: 100 }).success).toBe(true);
    });

    it('project() keeps at most 20 items', () => {
      const tool = getTool('get_stock_levels');
      expect(tool.project).toBeDefined();

      const items = Array.from({ length: 25 }, (_, i) => ({
        id: `var-${i + 1}`,
        stock: 50,
      }));

      const raw = { data: items, total: 25 };
      const projected = tool.project!(raw) as { data: any[]; total: number };
      expect(projected.data).toHaveLength(20);
      expect(projected.data[0].id).toBe('var-1');
      expect(projected.data[19].id).toBe('var-20');
    });

    it('summarize returns a Vietnamese line', () => {
      const tool = getTool('get_stock_levels');
      expect(tool.summarize({})).toBe('Xem mức tồn kho sản phẩm');
      expect(tool.summarize({ page: 2 })).toBe(
        'Xem mức tồn kho sản phẩm (trang 2)',
      );
    });
  });

  describe('get_low_stock', () => {
    it('has risk READ and calls inventory.getLowStockVariants with threshold (defaults to 10)', async () => {
      const tool = getTool('get_low_stock');
      expect(tool.risk).toBe('READ');

      mockInventoryService.getLowStockVariants.mockResolvedValue([]);

      await tool.handler({ threshold: 5 }, adminCtx);
      expect(mockInventoryService.getLowStockVariants).toHaveBeenCalledWith(5);

      mockInventoryService.getLowStockVariants.mockClear();
      await tool.handler({}, adminCtx);
      expect(mockInventoryService.getLowStockVariants).toHaveBeenCalledWith(10);
    });

    it('validates schema bounds for threshold (0..1000)', () => {
      const tool = getTool('get_low_stock');
      expect(tool.schema.safeParse({ threshold: -1 }).success).toBe(false);
      expect(tool.schema.safeParse({ threshold: 1001 }).success).toBe(false);
      expect(tool.schema.safeParse({ threshold: 0 }).success).toBe(true);
      expect(tool.schema.safeParse({ threshold: 1000 }).success).toBe(true);
    });

    it('summarize returns a Vietnamese line mentioning threshold', () => {
      const tool = getTool('get_low_stock');
      expect(tool.summarize({ threshold: 5 })).toContain('5');
    });
  });

  describe('get_stock_history', () => {
    it('has risk READ and calls inventory.getStockHistory with variantId and pagination', async () => {
      const tool = getTool('get_stock_history');
      expect(tool.risk).toBe('READ');

      mockInventoryService.getStockHistory.mockResolvedValue({
        data: [],
        total: 0,
      });

      await tool.handler(
        { variantId: 'var-123', page: 1, limit: 10 },
        adminCtx,
      );

      expect(mockInventoryService.getStockHistory).toHaveBeenCalledTimes(1);
      expect(mockInventoryService.getStockHistory).toHaveBeenCalledWith(
        'var-123',
        {
          page: 1,
          limit: 10,
        },
      );
    });

    it('project() keeps at most 20 movements', () => {
      const tool = getTool('get_stock_history');
      expect(tool.project).toBeDefined();

      const movements = Array.from({ length: 30 }, (_, i) => ({
        id: `mov-${i + 1}`,
        quantity: i + 1,
      }));

      const raw = { data: movements, total: 30 };
      const projected = tool.project!(raw) as { data: any[]; total: number };
      expect(projected.data).toHaveLength(20);
      expect(projected.data[0].id).toBe('mov-1');
      expect(projected.data[19].id).toBe('mov-20');
    });

    it('validates bounds for variantId, page, limit', () => {
      const tool = getTool('get_stock_history');
      expect(tool.schema.safeParse({ variantId: '' }).success).toBe(false);
      expect(tool.schema.safeParse({ variantId: 'a'.repeat(65) }).success).toBe(
        false,
      );
      expect(tool.schema.safeParse({ variantId: 'v1', page: 0 }).success).toBe(
        false,
      );
      expect(tool.schema.safeParse({ variantId: 'v1', page: 51 }).success).toBe(
        false,
      );
      expect(tool.schema.safeParse({ variantId: 'v1', limit: 0 }).success).toBe(
        false,
      );
      expect(
        tool.schema.safeParse({ variantId: 'v1', limit: 101 }).success,
      ).toBe(false);
    });

    it('summarize returns a Vietnamese line mentioning variantId', () => {
      const tool = getTool('get_stock_history');
      expect(tool.summarize({ variantId: 'var-123' })).toContain('var-123');
    });
  });

  describe('stock_add', () => {
    it('has risk WRITE and exact description', () => {
      const tool = getTool('stock_add');
      expect(tool.risk).toBe('WRITE');
      expect(tool.description).toBe(
        'Nhập thêm tồn kho cho một biến thể (cộng thêm số lượng).',
      );
    });

    it('sends type IN, notes with prefix "[AI:<threadId>] ", and passes ctx.userId as second argument', async () => {
      const tool = getTool('stock_add');
      mockInventoryService.adjustStock.mockResolvedValue({
        id: 'mov-1',
        type: 'IN',
      });

      const args = {
        variantId: 'var-100',
        quantity: 50,
        notes: 'Nhập lô hàng mới từ nhà cung cấp',
      };

      await tool.handler(args, adminCtx);

      expect(mockInventoryService.adjustStock).toHaveBeenCalledTimes(1);
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        {
          variantId: 'var-100',
          type: 'IN',
          quantity: 50,
          notes: '[AI:thread-xyz-789] Nhập lô hàng mới từ nhà cung cấp',
        },
        'admin-user-001',
      );
    });

    it('rejects quantity 0 and a negative quantity (schema)', () => {
      const tool = getTool('stock_add');
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 0 }),
      ).toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: -5 }),
      ).toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 10001 }),
      ).toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 1 }),
      ).not.toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 10000 }),
      ).not.toThrow();
    });

    it('handles omitted notes by still attaching the [AI:<threadId>] prefix', async () => {
      const tool = getTool('stock_add');
      mockInventoryService.adjustStock.mockResolvedValue({ id: 'mov-1' });

      await tool.handler({ variantId: 'var-100', quantity: 10 }, adminCtx);

      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'IN',
          notes: expect.stringMatching(/^\[AI:thread-xyz-789\]/),
        }),
        'admin-user-001',
      );
    });

    it('summarize returns a Vietnamese string mentioning quantity and variantId', () => {
      const tool = getTool('stock_add');
      const summary = tool.summarize({ variantId: 'var-100', quantity: 50 });
      expect(summary).toContain('50');
      expect(summary).toContain('var-100');
    });
  });

  describe('stock_remove', () => {
    it('has risk WRITE and exact description', () => {
      const tool = getTool('stock_remove');
      expect(tool.risk).toBe('WRITE');
      expect(tool.description).toBe(
        'Xuất bớt tồn kho cho một biến thể (trừ đi số lượng). Không cho âm tồn.',
      );
    });

    it('sends type OUT, notes with prefix "[AI:<threadId>] ", and passes ctx.userId as second argument', async () => {
      const tool = getTool('stock_remove');
      mockInventoryService.adjustStock.mockResolvedValue({
        id: 'mov-2',
        type: 'OUT',
      });

      const args = {
        variantId: 'var-200',
        quantity: 15,
        notes: 'Xuất mẫu dùng thử',
      };

      await tool.handler(args, adminCtx);

      expect(mockInventoryService.adjustStock).toHaveBeenCalledTimes(1);
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        {
          variantId: 'var-200',
          type: 'OUT',
          quantity: 15,
          notes: '[AI:thread-xyz-789] Xuất mẫu dùng thử',
        },
        'admin-user-001',
      );
    });

    it('rejects quantity 0 and a negative quantity (schema)', () => {
      const tool = getTool('stock_remove');
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 0 }),
      ).toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: -1 }),
      ).toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 10001 }),
      ).toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 1 }),
      ).not.toThrow();
    });

    it('summarize returns a Vietnamese string mentioning quantity and variantId', () => {
      const tool = getTool('stock_remove');
      const summary = tool.summarize({ variantId: 'var-200', quantity: 15 });
      expect(summary).toContain('15');
      expect(summary).toContain('var-200');
    });
  });

  describe('stock_set', () => {
    it('has risk SENSITIVE and exact description', () => {
      const tool = getTool('stock_set');
      expect(tool.risk).toBe('SENSITIVE');
      expect(tool.description).toBe(
        'Đặt tồn kho về một con số tuyệt đối (không phải số cộng thêm). Dùng stock_add hoặc stock_remove nếu khách muốn cộng hoặc trừ.',
      );
    });

    it('sends type ADJUST with absolute target quantity, prefixed notes, and ctx.userId as second argument', async () => {
      const tool = getTool('stock_set');
      mockInventoryService.adjustStock.mockResolvedValue({
        id: 'mov-3',
        type: 'ADJUST',
      });

      const args = {
        variantId: 'var-300',
        quantity: 120,
        notes: 'Kiểm kê định kỳ tháng 10',
      };

      await tool.handler(args, adminCtx);

      expect(mockInventoryService.adjustStock).toHaveBeenCalledTimes(1);
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        {
          variantId: 'var-300',
          type: 'ADJUST',
          quantity: 120,
          notes: '[AI:thread-xyz-789] Kiểm kê định kỳ tháng 10',
        },
        'admin-user-001',
      );
    });

    it('accepts quantity 0 (out of stock) and up to 100000, rejects negative and > 100000', () => {
      const tool = getTool('stock_set');
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 0 }),
      ).not.toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 100000 }),
      ).not.toThrow();

      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: -1 }),
      ).toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'v1', quantity: 100001 }),
      ).toThrow();
    });

    it('summarize returns a Vietnamese string mentioning variantId and absolute quantity', () => {
      const tool = getTool('stock_set');
      const summary = tool.summarize({ variantId: 'var-300', quantity: 0 });
      expect(summary).toContain('var-300');
      expect(summary).toContain('0');
    });
  });

  describe('delete_image', () => {
    it('has risk DESTRUCTIVE, exact description, and calls uploads.deleteFile with publicId', async () => {
      const tool = getTool('delete_image');
      expect(tool.risk).toBe('DESTRUCTIVE');
      expect(tool.description).toBe(
        'Xóa một ảnh đã tải lên Cloudinary theo public id. Ảnh đang được sản phẩm dùng vẫn còn được tham chiếu, nên kiểm tra trước khi xóa.',
      );

      mockUploadsService.deleteFile.mockResolvedValue({
        message: 'File deleted successfully',
      });

      const result = await tool.handler(
        { publicId: 'products/sample-perfume-1' },
        adminCtx,
      );

      expect(mockUploadsService.deleteFile).toHaveBeenCalledTimes(1);
      expect(mockUploadsService.deleteFile).toHaveBeenCalledWith(
        'products/sample-perfume-1',
      );
      expect(result).toEqual({ message: 'File deleted successfully' });
    });

    it('validates schema bounds for publicId (1..200)', () => {
      const tool = getTool('delete_image');
      expect(tool.schema.safeParse({ publicId: '' }).success).toBe(false);
      expect(tool.schema.safeParse({ publicId: 'a'.repeat(201) }).success).toBe(
        false,
      );
      expect(
        tool.schema.safeParse({ publicId: 'products/img-123' }).success,
      ).toBe(true);
    });

    it('summarize returns a Vietnamese string mentioning publicId', () => {
      const tool = getTool('delete_image');
      expect(tool.summarize({ publicId: 'products/img-123' })).toContain(
        'products/img-123',
      );
    });
  });

  describe('navigate_to', () => {
    let tool: AgentToolDef;

    beforeEach(() => {
      tool = getTool('navigate_to');
    });

    it('has risk WRITE and defines uiAction returning { type: "navigate", payload: { path } }', async () => {
      expect(tool.risk).toBe('WRITE');
      expect(tool.uiAction).toBeDefined();

      const result = await tool.handler(
        { path: '/admin/orders/abc' },
        adminCtx,
      );
      expect(result).toEqual({ path: '/admin/orders/abc' });

      const action = tool.uiAction!(result);
      expect(action).toEqual({
        type: 'navigate',
        payload: {
          path: '/admin/orders/abc',
        },
      });
    });

    it('accepts "/admin/orders/abc" and all allowed exact admin paths', async () => {
      const allowedPaths = [
        '/admin',
        '/admin/products',
        '/admin/products/new',
        '/admin/orders',
        '/admin/coupons',
        '/admin/inventory',
        '/admin/categories',
        '/admin/account',
        '/admin/orders/abc',
        '/admin/orders/ord-998877',
        '/admin/products/prod-abc-123/edit',
      ];

      for (const path of allowedPaths) {
        expect(() => tool.schema.parse({ path })).not.toThrow();
        const res = await tool.handler({ path }, adminCtx);
        expect(res).toEqual({ path });
      }
    });

    it('rejects "/cart", "//evil.example" and "/admin/unknown" at both schema and handler levels', async () => {
      const forbiddenPaths = [
        '/cart',
        '//evil.example',
        '/admin/unknown',
        'https://external.example.com',
        '/account',
        '/catalog',
        '/orders',
        '/admin/products/delete',
      ];

      for (const path of forbiddenPaths) {
        expect(() => tool.schema.parse({ path })).toThrow();
        await expect(tool.handler({ path }, adminCtx)).rejects.toThrow();
      }
    });

    it('rejects paths with empty segments like "/admin/orders/" or "/admin/products//edit"', async () => {
      expect(() => tool.schema.parse({ path: '/admin/orders/' })).toThrow();
      expect(() =>
        tool.schema.parse({ path: '/admin/products//edit' }),
      ).toThrow();

      await expect(
        tool.handler({ path: '/admin/orders/' }, adminCtx),
      ).rejects.toThrow();
      await expect(
        tool.handler({ path: '/admin/products//edit' }, adminCtx),
      ).rejects.toThrow();
    });

    it('rejects path exceeding 120 characters', () => {
      const longPath = `/admin/orders/${'a'.repeat(120)}`;
      expect(() => tool.schema.parse({ path: longPath })).toThrow();
    });

    it('summarize returns a Vietnamese string mentioning path', () => {
      expect(tool.summarize({ path: '/admin/orders' })).toContain(
        '/admin/orders',
      );
    });
  });
});
