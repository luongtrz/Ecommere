import {
  createReviewsShippingTools,
  ReviewsShippingToolDeps,
  SHIPPING_METHODS,
} from './reviews-shipping.tools';
import { AgentToolDef, ToolContext } from '../tool.types';
import type { ReviewsService } from '../../../reviews/reviews.service';
import type { CouponsService } from '../../../coupons/coupons.service';
import type { OrdersService } from '../../../orders/orders.service';

describe('Reviews and Shipping Tools', () => {
  let mockReviewsService: {
    getProductReviews: jest.Mock;
    getProductStats: jest.Mock;
    createReview: jest.Mock;
    getMyReviews: jest.Mock;
    updateReview: jest.Mock;
    deleteReview: jest.Mock;
  };
  let mockCouponsService: {
    validateCoupon: jest.Mock;
  };
  let mockOrdersService: {
    quoteShippingFee: jest.Mock;
  };

  let tools: AgentToolDef[];
  let getProductReviewsTool: AgentToolDef;
  let getReviewStatsTool: AgentToolDef;
  let quoteShippingTool: AgentToolDef;
  let createReviewTool: AgentToolDef;
  let listMyReviewsTool: AgentToolDef;
  let updateReviewTool: AgentToolDef;
  let deleteReviewTool: AgentToolDef;
  let validateCouponTool: AgentToolDef;

  const validCustomerCtx: ToolContext = {
    userId: 'user-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'thread-1',
  };

  const unauthenticatedCtx: ToolContext = {
    userId: null,
    role: 'GUEST',
    app: 'USER',
    threadId: 'thread-2',
  };

  beforeEach(() => {
    mockReviewsService = {
      getProductReviews: jest.fn(),
      getProductStats: jest.fn(),
      createReview: jest.fn(),
      getMyReviews: jest.fn(),
      updateReview: jest.fn(),
      deleteReview: jest.fn(),
    };

    mockCouponsService = {
      validateCoupon: jest.fn(),
    };

    mockOrdersService = {
      quoteShippingFee: jest.fn(),
    };

    const deps: ReviewsShippingToolDeps = {
      reviews: mockReviewsService as unknown as ReviewsService,
      coupons: mockCouponsService as unknown as CouponsService,
      orders: mockOrdersService as unknown as OrdersService,
    };

    tools = createReviewsShippingTools(deps);
    getProductReviewsTool = tools.find(
      (t) => t.name === 'get_product_reviews',
    )!;
    getReviewStatsTool = tools.find((t) => t.name === 'get_review_stats')!;
    quoteShippingTool = tools.find((t) => t.name === 'quote_shipping')!;
    createReviewTool = tools.find((t) => t.name === 'create_review')!;
    listMyReviewsTool = tools.find((t) => t.name === 'list_my_reviews')!;
    updateReviewTool = tools.find((t) => t.name === 'update_review')!;
    deleteReviewTool = tools.find((t) => t.name === 'delete_review')!;
    validateCouponTool = tools.find((t) => t.name === 'validate_coupon')!;
  });

  describe('Factory and General Requirements', () => {
    it('returns exactly 8 tools with unique names', () => {
      expect(tools).toHaveLength(8);
      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(8);
      expect(names).toEqual([
        'get_product_reviews',
        'get_review_stats',
        'quote_shipping',
        'create_review',
        'list_my_reviews',
        'update_review',
        'delete_review',
        'validate_coupon',
      ]);
    });

    it('sets auth to public for get_product_reviews, get_review_stats, quote_shipping, and customer for everything else', () => {
      expect(getProductReviewsTool.auth).toBe('public');
      expect(getReviewStatsTool.auth).toBe('public');
      expect(quoteShippingTool.auth).toBe('public');

      expect(createReviewTool.auth).toBe('customer');
      expect(listMyReviewsTool.auth).toBe('customer');
      expect(updateReviewTool.auth).toBe('customer');
      expect(deleteReviewTool.auth).toBe('customer');
      expect(validateCouponTool.auth).toBe('customer');
    });

    it('enforces strict schema on all tools (rejects unknown properties)', () => {
      for (const tool of tools) {
        const result = tool.schema.safeParse({ unknownProp: 'value' });
        expect(result.success).toBe(false);
      }
    });

    it('does not include userId or role in any schema', () => {
      for (const tool of tools) {
        expect(tool.schema.shape).not.toHaveProperty('userId');
        expect(tool.schema.shape).not.toHaveProperty('role');

        const checkUserId = tool.schema.safeParse({ userId: 'user-1' });
        expect(checkUserId.success).toBe(false);

        const checkRole = tool.schema.safeParse({ role: 'CUSTOMER' });
        expect(checkRole.success).toBe(false);
      }
    });

    it('throws "Cần đăng nhập để dùng chức năng này" for all customer tools when ctx.userId is null', async () => {
      await expect(
        createReviewTool.handler(
          { productId: 'p1', rating: 5, content: 'Tốt' },
          unauthenticatedCtx,
        ),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');

      await expect(
        listMyReviewsTool.handler({}, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');

      await expect(
        updateReviewTool.handler(
          { reviewId: 'r1', rating: 4 },
          unauthenticatedCtx,
        ),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');

      await expect(
        deleteReviewTool.handler({ reviewId: 'r1' }, unauthenticatedCtx),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');

      await expect(
        validateCouponTool.handler(
          { code: 'DISCOUNT', orderTotal: 100000 },
          unauthenticatedCtx,
        ),
      ).rejects.toThrow('Cần đăng nhập để dùng chức năng này');
    });

    it('does not throw when ctx.userId is null for public tools', async () => {
      mockReviewsService.getProductReviews.mockResolvedValue({
        data: [],
        total: 0,
      });
      mockReviewsService.getProductStats.mockResolvedValue({
        totalReviews: 0,
      });
      mockOrdersService.quoteShippingFee.mockReturnValue({
        province: 'Hà Nội',
        shippingMethod: 'STANDARD',
        fee: 30000,
      });

      await expect(
        getProductReviewsTool.handler({ productId: 'p1' }, unauthenticatedCtx),
      ).resolves.toBeDefined();

      await expect(
        getReviewStatsTool.handler({ productId: 'p1' }, unauthenticatedCtx),
      ).resolves.toBeDefined();

      await expect(
        quoteShippingTool.handler({ province: 'Hà Nội' }, unauthenticatedCtx),
      ).resolves.toBeDefined();
    });
  });

  describe('get_product_reviews', () => {
    it('has risk READ, domain reviews, and calls getProductReviews with expected arguments', async () => {
      expect(getProductReviewsTool.risk).toBe('READ');
      expect(getProductReviewsTool.domain).toBe('reviews');

      mockReviewsService.getProductReviews.mockResolvedValue({
        data: [],
        total: 0,
      });

      const args = {
        productId: 'prod-123',
        page: 2,
        limit: 15,
        rating: 4,
      };

      await getProductReviewsTool.handler(args, validCustomerCtx);

      expect(mockReviewsService.getProductReviews).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.getProductReviews).toHaveBeenCalledWith(
        'prod-123',
        {
          page: 2,
          limit: 15,
          rating: 4,
        },
      );
    });

    it('accepts minimal arguments (only productId)', async () => {
      mockReviewsService.getProductReviews.mockResolvedValue({
        data: [],
        total: 0,
      });

      const parsed = getProductReviewsTool.schema.safeParse({
        productId: 'prod-456',
      });
      expect(parsed.success).toBe(true);

      await getProductReviewsTool.handler(
        { productId: 'prod-456' },
        validCustomerCtx,
      );

      expect(mockReviewsService.getProductReviews).toHaveBeenCalledWith(
        'prod-456',
        {
          page: undefined,
          limit: undefined,
          rating: undefined,
        },
      );
    });

    it('validates schema bounds for productId, page, limit, rating', () => {
      expect(
        getProductReviewsTool.schema.safeParse({ productId: '' }).success,
      ).toBe(false);
      expect(
        getProductReviewsTool.schema.safeParse({ productId: 'a'.repeat(65) })
          .success,
      ).toBe(false);

      expect(
        getProductReviewsTool.schema.safeParse({
          productId: 'p1',
          page: 0,
        }).success,
      ).toBe(false);
      expect(
        getProductReviewsTool.schema.safeParse({
          productId: 'p1',
          page: 51,
        }).success,
      ).toBe(false);

      expect(
        getProductReviewsTool.schema.safeParse({
          productId: 'p1',
          limit: 0,
        }).success,
      ).toBe(false);
      expect(
        getProductReviewsTool.schema.safeParse({
          productId: 'p1',
          limit: 51,
        }).success,
      ).toBe(false);

      expect(
        getProductReviewsTool.schema.safeParse({
          productId: 'p1',
          rating: 0,
        }).success,
      ).toBe(false);
      expect(
        getProductReviewsTool.schema.safeParse({
          productId: 'p1',
          rating: 6,
        }).success,
      ).toBe(false);
      expect(
        getProductReviewsTool.schema.safeParse({
          productId: 'p1',
          rating: 5,
        }).success,
      ).toBe(true);
    });

    it('summarize returns a Vietnamese string mentioning productId', () => {
      expect(
        getProductReviewsTool.summarize({ productId: 'prod-123' }),
      ).toContain('prod-123');
    });
  });

  describe('get_review_stats', () => {
    it('has risk READ, domain reviews, and calls getProductStats with productId', async () => {
      expect(getReviewStatsTool.risk).toBe('READ');
      expect(getReviewStatsTool.domain).toBe('reviews');

      const stats = {
        totalReviews: 25,
        averageRating: 4.8,
        ratingDistribution: { 5: 20, 4: 5, 3: 0, 2: 0, 1: 0 },
      };
      mockReviewsService.getProductStats.mockResolvedValue(stats);

      const result = await getReviewStatsTool.handler(
        { productId: 'prod-789' },
        validCustomerCtx,
      );

      expect(mockReviewsService.getProductStats).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.getProductStats).toHaveBeenCalledWith(
        'prod-789',
      );
      expect(result).toEqual(stats);
    });

    it('validates productId constraints', () => {
      expect(
        getReviewStatsTool.schema.safeParse({ productId: '' }).success,
      ).toBe(false);
      expect(
        getReviewStatsTool.schema.safeParse({ productId: 'a'.repeat(65) })
          .success,
      ).toBe(false);
      expect(
        getReviewStatsTool.schema.safeParse({ productId: 'prod-789' }).success,
      ).toBe(true);
    });

    it('summarize returns a Vietnamese string mentioning productId', () => {
      expect(getReviewStatsTool.summarize({ productId: 'prod-789' })).toContain(
        'prod-789',
      );
    });
  });

  describe('quote_shipping', () => {
    it('has risk READ, domain shipping, and expected description', () => {
      expect(quoteShippingTool.risk).toBe('READ');
      expect(quoteShippingTool.domain).toBe('shipping');
      expect(quoteShippingTool.description).toBe(
        'Phí vận chuyển theo đúng quy tắc khi thanh toán. Dùng công cụ này khi khách hỏi phí ship.',
      );
    });

    it('returns exactly what quoteShippingFee returns', async () => {
      const mockQuoteResult = {
        province: 'Hà Nội',
        shippingMethod: 'STANDARD' as const,
        fee: 30000,
      };
      mockOrdersService.quoteShippingFee.mockReturnValue(mockQuoteResult);

      const result = await quoteShippingTool.handler(
        { province: 'Hà Nội' },
        validCustomerCtx,
      );

      expect(mockOrdersService.quoteShippingFee).toHaveBeenCalledTimes(1);
      expect(mockOrdersService.quoteShippingFee).toHaveBeenCalledWith(
        'Hà Nội',
        undefined,
      );
      expect(result).toEqual(mockQuoteResult);
    });

    it('calls quoteShippingFee with custom shippingMethod', async () => {
      const mockQuoteResult = {
        province: 'Đà Nẵng',
        shippingMethod: 'EXPRESS' as const,
        fee: 50000,
      };
      mockOrdersService.quoteShippingFee.mockReturnValue(mockQuoteResult);

      const result = await quoteShippingTool.handler(
        { province: 'Đà Nẵng', shippingMethod: 'EXPRESS' },
        validCustomerCtx,
      );

      expect(mockOrdersService.quoteShippingFee).toHaveBeenCalledWith(
        'Đà Nẵng',
        'EXPRESS',
      );
      expect(result).toEqual(mockQuoteResult);
    });

    it('rejects an empty province at the schema level and accepts a valid one', () => {
      expect(quoteShippingTool.schema.safeParse({ province: '' }).success).toBe(
        false,
      );
      expect(
        quoteShippingTool.schema.safeParse({ province: 'Hồ Chí Minh' }).success,
      ).toBe(true);
      expect(
        quoteShippingTool.schema.safeParse({ province: 'a'.repeat(101) })
          .success,
      ).toBe(false);
    });

    it('accepts valid shippingMethod values and rejects invalid ones', () => {
      for (const method of SHIPPING_METHODS) {
        expect(
          quoteShippingTool.schema.safeParse({
            province: 'Hà Nội',
            shippingMethod: method,
          }).success,
        ).toBe(true);
      }
      expect(
        quoteShippingTool.schema.safeParse({
          province: 'Hà Nội',
          shippingMethod: 'SAME_DAY',
        }).success,
      ).toBe(false);
    });

    it('summarize returns a Vietnamese string mentioning province', () => {
      expect(quoteShippingTool.summarize({ province: 'Hải Phòng' })).toContain(
        'Hải Phòng',
      );
    });
  });

  describe('create_review', () => {
    it('has risk SENSITIVE, domain reviews, and expected description', () => {
      expect(createReviewTool.risk).toBe('SENSITIVE');
      expect(createReviewTool.domain).toBe('reviews');
      expect(createReviewTool.description).toBe(
        'Gửi đánh giá sản phẩm. Chỉ khi khách đã nhận hàng và chưa đánh giá sản phẩm này.',
      );
    });

    it('calls createReview with userId and DTO', async () => {
      const createdReview = {
        id: 'rev-001',
        productId: 'prod-001',
        rating: 5,
        content: 'Chất lượng rất tốt',
      };
      mockReviewsService.createReview.mockResolvedValue(createdReview);

      const args = {
        productId: 'prod-001',
        rating: 5,
        content: 'Chất lượng rất tốt',
      };
      const result = await createReviewTool.handler(args, validCustomerCtx);

      expect(mockReviewsService.createReview).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.createReview).toHaveBeenCalledWith(
        'user-123',
        args,
      );
      expect(result).toEqual(createdReview);
    });

    it('rejects a rating of 0 and 6, accepts 1 and 5', () => {
      expect(
        createReviewTool.schema.safeParse({
          productId: 'p1',
          rating: 0,
          content: 'Đánh giá',
        }).success,
      ).toBe(false);

      expect(
        createReviewTool.schema.safeParse({
          productId: 'p1',
          rating: 6,
          content: 'Đánh giá',
        }).success,
      ).toBe(false);

      expect(
        createReviewTool.schema.safeParse({
          productId: 'p1',
          rating: 1,
          content: 'Đánh giá',
        }).success,
      ).toBe(true);

      expect(
        createReviewTool.schema.safeParse({
          productId: 'p1',
          rating: 5,
          content: 'Đánh giá',
        }).success,
      ).toBe(true);
    });

    it('validates content length (1..1000) and productId length (1..64)', () => {
      expect(
        createReviewTool.schema.safeParse({
          productId: 'p1',
          rating: 5,
          content: '',
        }).success,
      ).toBe(false);

      expect(
        createReviewTool.schema.safeParse({
          productId: 'p1',
          rating: 5,
          content: 'a'.repeat(1001),
        }).success,
      ).toBe(false);

      expect(
        createReviewTool.schema.safeParse({
          productId: '',
          rating: 5,
          content: 'Tốt',
        }).success,
      ).toBe(false);

      expect(
        createReviewTool.schema.safeParse({
          productId: 'a'.repeat(65),
          rating: 5,
          content: 'Tốt',
        }).success,
      ).toBe(false);
    });

    it('summarize returns a Vietnamese string mentioning productId, rating, and comment length without comment text', () => {
      const payload = {
        productId: 'prod-001',
        rating: 5,
        content: 'Chất lượng rất tốt',
      };
      const summary = createReviewTool.summarize(payload);
      expect(summary).toContain('prod-001');
      expect(summary).toContain('5 sao');
      expect(summary).toContain(`${payload.content.length} ký tự`);
      expect(summary).not.toContain(payload.content);
      expect(summary).toBe(
        'Đánh giá sản phẩm prod-001 (5 sao, nhận xét 18 ký tự)',
      );

      const minimalSummary = createReviewTool.summarize({
        productId: 'prod-001',
        rating: 5,
      });
      expect(minimalSummary).toBe('Đánh giá sản phẩm prod-001 (5 sao)');
    });
  });

  describe('list_my_reviews', () => {
    it('has risk READ, domain reviews, and calls getMyReviews with userId and pagination', async () => {
      expect(listMyReviewsTool.risk).toBe('READ');
      expect(listMyReviewsTool.domain).toBe('reviews');

      mockReviewsService.getMyReviews.mockResolvedValue({
        data: [],
        total: 0,
      });

      const args = { page: 2, limit: 10 };
      await listMyReviewsTool.handler(args, validCustomerCtx);

      expect(mockReviewsService.getMyReviews).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.getMyReviews).toHaveBeenCalledWith(
        'user-123',
        args,
      );
    });

    it('validates page and limit range (1..50)', () => {
      expect(listMyReviewsTool.schema.safeParse({ page: 0 }).success).toBe(
        false,
      );
      expect(listMyReviewsTool.schema.safeParse({ page: 51 }).success).toBe(
        false,
      );
      expect(listMyReviewsTool.schema.safeParse({ limit: 0 }).success).toBe(
        false,
      );
      expect(listMyReviewsTool.schema.safeParse({ limit: 51 }).success).toBe(
        false,
      );
      expect(
        listMyReviewsTool.schema.safeParse({ page: 1, limit: 50 }).success,
      ).toBe(true);
      expect(listMyReviewsTool.schema.safeParse({}).success).toBe(true);
    });

    it('summarize returns a Vietnamese line', () => {
      expect(listMyReviewsTool.summarize({})).toBe(
        'Xem danh sách đánh giá của tôi',
      );
    });
  });

  describe('update_review', () => {
    it('has risk SENSITIVE, domain reviews, and calls updateReview with userId, reviewId, and fields', async () => {
      expect(updateReviewTool.risk).toBe('SENSITIVE');
      expect(updateReviewTool.domain).toBe('reviews');

      mockReviewsService.updateReview.mockResolvedValue({
        id: 'rev-100',
        rating: 4,
        content: 'Nội dung cập nhật',
      });

      const args = {
        reviewId: 'rev-100',
        rating: 4,
        content: 'Nội dung cập nhật',
      };
      await updateReviewTool.handler(args, validCustomerCtx);

      expect(mockReviewsService.updateReview).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.updateReview).toHaveBeenCalledWith(
        'user-123',
        'rev-100',
        { rating: 4, content: 'Nội dung cập nhật' },
      );
    });

    it('rejects a call with neither rating nor content', async () => {
      await expect(
        updateReviewTool.handler(
          { reviewId: 'rev-100' },
          {
            userId: 'cust-1',
            role: 'CUSTOMER',
            app: 'USER',
            threadId: 'thread-1',
          },
        ),
      ).rejects.toThrow(
        'Ít nhất một trong hai trường rating hoặc content phải có',
      );
    });

    it('accepts a call with rating only', async () => {
      const res = updateReviewTool.schema.safeParse({
        reviewId: 'rev-100',
        rating: 5,
      });
      expect(res.success).toBe(true);

      mockReviewsService.updateReview.mockResolvedValue({ id: 'rev-100' });
      await updateReviewTool.handler(
        { reviewId: 'rev-100', rating: 5 },
        validCustomerCtx,
      );

      expect(mockReviewsService.updateReview).toHaveBeenCalledWith(
        'user-123',
        'rev-100',
        { rating: 5 },
      );
    });

    it('accepts a call with content only', async () => {
      const res = updateReviewTool.schema.safeParse({
        reviewId: 'rev-100',
        content: 'Rất ưng ý',
      });
      expect(res.success).toBe(true);

      mockReviewsService.updateReview.mockResolvedValue({ id: 'rev-100' });
      await updateReviewTool.handler(
        { reviewId: 'rev-100', content: 'Rất ưng ý' },
        validCustomerCtx,
      );

      expect(mockReviewsService.updateReview).toHaveBeenCalledWith(
        'user-123',
        'rev-100',
        { content: 'Rất ưng ý' },
      );
    });

    it('validates rating bounds (1..5) and content length (1..1000)', () => {
      expect(
        updateReviewTool.schema.safeParse({
          reviewId: 'rev-1',
          rating: 0,
        }).success,
      ).toBe(false);
      expect(
        updateReviewTool.schema.safeParse({
          reviewId: 'rev-1',
          rating: 6,
        }).success,
      ).toBe(false);
      expect(
        updateReviewTool.schema.safeParse({
          reviewId: 'rev-1',
          content: '',
        }).success,
      ).toBe(false);
      expect(
        updateReviewTool.schema.safeParse({
          reviewId: 'rev-1',
          content: 'a'.repeat(1001),
        }).success,
      ).toBe(false);
      expect(
        updateReviewTool.schema.safeParse({
          reviewId: '',
          rating: 4,
        }).success,
      ).toBe(false);
      expect(
        updateReviewTool.schema.safeParse({
          reviewId: 'a'.repeat(65),
          rating: 4,
        }).success,
      ).toBe(false);
    });

    it('summarize returns a Vietnamese string mentioning reviewId and provided fields without comment text', () => {
      expect(updateReviewTool.summarize({ reviewId: 'rev-100' })).toBe(
        'Cập nhật đánh giá rev-100',
      );

      const fullSummary = updateReviewTool.summarize({
        reviewId: 'rev-100',
        rating: 4,
        content: 'Nội dung cập nhật',
      });
      expect(fullSummary).toContain('rev-100');
      expect(fullSummary).toContain('4 sao');
      expect(fullSummary).toContain('17 ký tự');
      expect(fullSummary).not.toContain('Nội dung cập nhật');
      expect(fullSummary).toBe(
        'Cập nhật đánh giá rev-100 (4 sao, nhận xét 17 ký tự)',
      );

      const ratingSummary = updateReviewTool.summarize({
        reviewId: 'rev-100',
        rating: 5,
      });
      expect(ratingSummary).toBe('Cập nhật đánh giá rev-100 (5 sao)');

      const contentSummary = updateReviewTool.summarize({
        reviewId: 'rev-100',
        content: 'Rất ưng ý',
      });
      expect(contentSummary).not.toContain('Rất ưng ý');
      expect(contentSummary).toBe(
        'Cập nhật đánh giá rev-100 (nhận xét 9 ký tự)',
      );
    });
  });

  describe('delete_review', () => {
    it('has risk DESTRUCTIVE, domain reviews, and expected description', () => {
      expect(deleteReviewTool.risk).toBe('DESTRUCTIVE');
      expect(deleteReviewTool.domain).toBe('reviews');
      expect(deleteReviewTool.description).toBe(
        'Xóa đánh giá của chính khách. Không hoàn tác được.',
      );
    });

    it('calls deleteReview with userId and reviewId', async () => {
      mockReviewsService.deleteReview.mockResolvedValue({
        message: 'Review deleted successfully',
      });

      const result = await deleteReviewTool.handler(
        { reviewId: 'rev-555' },
        validCustomerCtx,
      );

      expect(mockReviewsService.deleteReview).toHaveBeenCalledTimes(1);
      expect(mockReviewsService.deleteReview).toHaveBeenCalledWith(
        'user-123',
        'rev-555',
      );
      expect(result).toEqual({ message: 'Review deleted successfully' });
    });

    it('validates reviewId constraints (1..64)', () => {
      expect(deleteReviewTool.schema.safeParse({ reviewId: '' }).success).toBe(
        false,
      );
      expect(
        deleteReviewTool.schema.safeParse({ reviewId: 'a'.repeat(65) }).success,
      ).toBe(false);
      expect(
        deleteReviewTool.schema.safeParse({ reviewId: 'rev-555' }).success,
      ).toBe(true);
    });

    it('summarize returns a Vietnamese string mentioning reviewId', () => {
      expect(deleteReviewTool.summarize({ reviewId: 'rev-555' })).toContain(
        'rev-555',
      );
    });
  });

  describe('validate_coupon', () => {
    it('has risk READ, domain coupons, and expected description', () => {
      expect(validateCouponTool.risk).toBe('READ');
      expect(validateCouponTool.domain).toBe('coupons');
      expect(validateCouponTool.description).toBe(
        'Kiểm tra mã giảm giá có dùng được với tổng tiền đơn hàng không. Phải truyền đúng orderTotal, nếu không mã có điều kiện đơn tối thiểu sẽ bị từ chối. Mã FREESHIP trả discountAmount 0 nhưng vẫn miễn phí ship.',
      );
    });

    it('calls validateCoupon with code, userId, and orderTotal', async () => {
      const mockValidationResult = {
        valid: true,
        message: 'Coupon is valid',
        discountAmount: 25000,
      };
      mockCouponsService.validateCoupon.mockResolvedValue(mockValidationResult);

      const args = { code: 'DISCOUNT25', orderTotal: 250000 };
      const result = await validateCouponTool.handler(args, validCustomerCtx);

      expect(mockCouponsService.validateCoupon).toHaveBeenCalledTimes(1);
      expect(mockCouponsService.validateCoupon).toHaveBeenCalledWith(
        'DISCOUNT25',
        'user-123',
        250000,
      );
      expect(result).toEqual(mockValidationResult);
    });

    it('requires orderTotal (rejects a missing field)', () => {
      const missingTotal = validateCouponTool.schema.safeParse({
        code: 'DISCOUNT25',
      });
      expect(missingTotal.success).toBe(false);
    });

    it('rejects negative orderTotal and non-integer orderTotal', () => {
      expect(
        validateCouponTool.schema.safeParse({
          code: 'DISCOUNT25',
          orderTotal: -1,
        }).success,
      ).toBe(false);

      expect(
        validateCouponTool.schema.safeParse({
          code: 'DISCOUNT25',
          orderTotal: 100.5,
        }).success,
      ).toBe(false);
    });

    it('accepts orderTotal of 0 and positive integers', () => {
      expect(
        validateCouponTool.schema.safeParse({
          code: 'FREESHIP',
          orderTotal: 0,
        }).success,
      ).toBe(true);

      expect(
        validateCouponTool.schema.safeParse({
          code: 'FREESHIP',
          orderTotal: 150000,
        }).success,
      ).toBe(true);
    });

    it('validates code string constraints (1..40)', () => {
      expect(
        validateCouponTool.schema.safeParse({
          code: '',
          orderTotal: 100000,
        }).success,
      ).toBe(false);

      expect(
        validateCouponTool.schema.safeParse({
          code: 'a'.repeat(41),
          orderTotal: 100000,
        }).success,
      ).toBe(false);

      expect(
        validateCouponTool.schema.safeParse({
          code: 'SUMMER2026',
          orderTotal: 100000,
        }).success,
      ).toBe(true);
    });

    it('summarize returns a Vietnamese string mentioning coupon code', () => {
      expect(validateCouponTool.summarize({ code: 'SUMMER2026' })).toContain(
        'SUMMER2026',
      );
    });
  });
});
