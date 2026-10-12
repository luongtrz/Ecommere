import { z } from 'zod';
import { AgentToolDef, ToolContext } from '../tool.types';
import type { ReviewsService } from '../../../reviews/reviews.service';
import type { CouponsService } from '../../../coupons/coupons.service';
import type { OrdersService } from '../../../orders/orders.service';

export const SHIPPING_METHODS = ['STANDARD', 'EXPRESS'] as const;

export type ReviewsShippingToolDeps = {
  reviews: ReviewsService;
  coupons: CouponsService;
  orders: OrdersService;
};

export function createReviewsShippingTools(
  deps: ReviewsShippingToolDeps,
): AgentToolDef[] {
  const getProductReviewsTool: AgentToolDef = {
    name: 'get_product_reviews',
    domain: 'reviews',
    description:
      'Xem danh sách đánh giá của sản phẩm kèm phân trang và lọc theo số sao.',
    schema: z
      .object({
        productId: z.string().min(1).max(64),
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(50).optional(),
        rating: z.number().int().min(1).max(5).optional(),
      })
      .strict(),
    auth: 'public',
    risk: 'READ',
    handler: async (args) => {
      return deps.reviews.getProductReviews(args.productId, {
        page: args.page,
        limit: args.limit,
        rating: args.rating,
      });
    },
    summarize: (args) => `Xem đánh giá sản phẩm ${args.productId}`,
  };

  const getReviewStatsTool: AgentToolDef = {
    name: 'get_review_stats',
    domain: 'reviews',
    description:
      'Xem thống kê đánh giá của sản phẩm bao gồm điểm trung bình và phân bổ số sao.',
    schema: z
      .object({
        productId: z.string().min(1).max(64),
      })
      .strict(),
    auth: 'public',
    risk: 'READ',
    handler: async (args) => {
      return deps.reviews.getProductStats(args.productId);
    },
    summarize: (args) => `Xem thống kê đánh giá sản phẩm ${args.productId}`,
  };

  const quoteShippingTool: AgentToolDef = {
    name: 'quote_shipping',
    domain: 'shipping',
    description:
      'Phí vận chuyển theo đúng quy tắc khi thanh toán. Dùng công cụ này khi khách hỏi phí ship.',
    schema: z
      .object({
        province: z.string().min(1).max(100),
        shippingMethod: z.enum(SHIPPING_METHODS).optional(),
      })
      .strict(),
    auth: 'public',
    risk: 'READ',
    handler: async (args) => {
      return deps.orders.quoteShippingFee(args.province, args.shippingMethod);
    },
    summarize: (args) => `Tra cứu phí vận chuyển đến ${args.province}`,
  };

  const createReviewTool: AgentToolDef = {
    name: 'create_review',
    domain: 'reviews',
    description:
      'Gửi đánh giá sản phẩm. Chỉ khi khách đã nhận hàng và chưa đánh giá sản phẩm này.',
    schema: z
      .object({
        productId: z.string().min(1).max(64),
        rating: z.number().int().min(1).max(5),
        content: z.string().min(1).max(1000),
      })
      .strict(),
    auth: 'customer',
    risk: 'SENSITIVE',
    handler: async (args, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.reviews.createReview(ctx.userId, {
        productId: args.productId,
        rating: args.rating,
        content: args.content,
      });
    },
    summarize: (args: {
      productId?: string;
      rating?: number;
      content?: string;
    }) => {
      const parts: string[] = [];
      if (args?.rating !== undefined) {
        parts.push(`${args.rating} sao`);
      }
      if (typeof args?.content === 'string') {
        parts.push(`nhận xét ${args.content.length} ký tự`);
      }
      const details = parts.length > 0 ? ` (${parts.join(', ')})` : '';
      return `Đánh giá sản phẩm ${args?.productId || ''}${details}`.trim();
    },
  };

  const listMyReviewsTool: AgentToolDef = {
    name: 'list_my_reviews',
    domain: 'reviews',
    description: 'Danh sách đánh giá của chính khách hàng.',
    schema: z
      .object({
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      })
      .strict(),
    auth: 'customer',
    risk: 'READ',
    handler: async (args, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.reviews.getMyReviews(ctx.userId, {
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: () => 'Xem danh sách đánh giá của tôi',
  };

  const updateReviewBaseSchema = z
    .object({
      reviewId: z.string().min(1).max(64),
      rating: z.number().int().min(1).max(5).optional(),
      content: z.string().min(1).max(1000).optional(),
    })
    .strict();

  const updateReviewTool: AgentToolDef = {
    name: 'update_review',
    domain: 'reviews',
    description:
      'Cập nhật nội dung hoặc số sao đánh giá của chính khách hàng.',
    schema: updateReviewBaseSchema,
    auth: 'customer',
    risk: 'SENSITIVE',
    handler: async (args, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      if (args.rating === undefined && args.content === undefined) {
        throw new Error('Ít nhất một trong hai trường rating hoặc content phải có');
      }
      const fields: { rating?: number; content?: string } = {};
      if (args.rating !== undefined) {
        fields.rating = args.rating;
      }
      if (args.content !== undefined) {
        fields.content = args.content;
      }
      return deps.reviews.updateReview(ctx.userId, args.reviewId, fields);
    },
    summarize: (args: {
      reviewId?: string;
      rating?: number;
      content?: string;
    }) => {
      const parts: string[] = [];
      if (args?.rating !== undefined) {
        parts.push(`${args.rating} sao`);
      }
      if (typeof args?.content === 'string') {
        parts.push(`nhận xét ${args.content.length} ký tự`);
      }
      const details = parts.length > 0 ? ` (${parts.join(', ')})` : '';
      return `Cập nhật đánh giá ${args?.reviewId || ''}${details}`.trim();
    },
  };

  const deleteReviewTool: AgentToolDef = {
    name: 'delete_review',
    domain: 'reviews',
    description: 'Xóa đánh giá của chính khách. Không hoàn tác được.',
    schema: z
      .object({
        reviewId: z.string().min(1).max(64),
      })
      .strict(),
    auth: 'customer',
    risk: 'DESTRUCTIVE',
    handler: async (args, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.reviews.deleteReview(ctx.userId, args.reviewId);
    },
    summarize: (args) => `Xóa đánh giá ${args.reviewId}`,
  };

  const validateCouponTool: AgentToolDef = {
    name: 'validate_coupon',
    domain: 'coupons',
    description:
      'Kiểm tra mã giảm giá có dùng được với tổng tiền đơn hàng không. Phải truyền đúng orderTotal, nếu không mã có điều kiện đơn tối thiểu sẽ bị từ chối. Mã FREESHIP trả discountAmount 0 nhưng vẫn miễn phí ship.',
    schema: z
      .object({
        code: z.string().min(1).max(40),
        orderTotal: z.number().int().min(0),
      })
      .strict(),
    auth: 'customer',
    risk: 'READ',
    handler: async (args, ctx: ToolContext) => {
      if (!ctx.userId) {
        throw new Error('Cần đăng nhập để dùng chức năng này');
      }
      return deps.coupons.validateCoupon(
        args.code,
        ctx.userId,
        args.orderTotal,
      );
    },
    summarize: (args) => `Kiểm tra mã giảm giá ${args.code}`,
  };

  return [
    getProductReviewsTool,
    getReviewStatsTool,
    quoteShippingTool,
    createReviewTool,
    listMyReviewsTool,
    updateReviewTool,
    deleteReviewTool,
    validateCouponTool,
  ];
}
