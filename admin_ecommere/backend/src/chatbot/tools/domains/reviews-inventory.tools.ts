import { z } from 'zod';
import { AgentToolDef, ToolContext, UiAction } from '../tool.types';
import type { ReviewsService } from '../../../reviews/reviews.service';
import type { InventoryService } from '../../../inventory/inventory.service';
import type { UploadsService } from '../../../uploads/uploads.service';

export type ReviewsInventoryToolDeps = {
  reviews: ReviewsService;
  inventory: InventoryService;
  uploads: UploadsService;
};

export const ADMIN_NAVIGATE_PATH_REGEX = /^\/(?!\/)[A-Za-z0-9/_-]{0,120}$/;

export const ADMIN_ALLOWED_EXACT_PATHS = new Set([
  '/admin',
  '/admin/products',
  '/admin/products/new',
  '/admin/orders',
  '/admin/coupons',
  '/admin/inventory',
  '/admin/categories',
  '/admin/account',
]);

export const ADMIN_PRODUCTS_EDIT_REGEX = /^\/admin\/products\/([^/]+)\/edit$/;
export const ADMIN_ORDERS_DETAIL_REGEX = /^\/admin\/orders\/([^/]+)$/;

export function isAdminAllowedPath(path: string): boolean {
  if (typeof path !== 'string') {
    return false;
  }
  if (!ADMIN_NAVIGATE_PATH_REGEX.test(path)) {
    return false;
  }
  if (ADMIN_ALLOWED_EXACT_PATHS.has(path)) {
    return true;
  }
  const productsEditMatch = ADMIN_PRODUCTS_EDIT_REGEX.exec(path);
  if (productsEditMatch && productsEditMatch[1].length > 0) {
    return true;
  }
  const ordersMatch = ADMIN_ORDERS_DETAIL_REGEX.exec(path);
  if (ordersMatch && ordersMatch[1].length > 0) {
    return true;
  }
  return false;
}

function tagAuditNotes(threadId: string, notes?: string): string {
  const prefix = `[AI:${threadId}] `;
  return notes ? `${prefix}${notes}` : prefix;
}

function projectReviewsList(result: unknown): unknown {
  if (!result || typeof result !== 'object') {
    return result;
  }
  const projectItem = (item: any) => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    const content =
      typeof item.content === 'string'
        ? item.content.slice(0, 300)
        : item.content;
    const authorName = item.user?.name ?? item.authorName ?? null;
    const productName = item.product?.name ?? item.productName ?? null;

    return {
      id: item.id,
      rating: item.rating,
      content,
      createdAt: item.createdAt,
      authorName,
      productName,
    };
  };

  if (Array.isArray(result)) {
    return result.slice(0, 20).map(projectItem);
  }

  if (Array.isArray((result as any).data)) {
    return {
      ...result,
      data: (result as any).data.slice(0, 20).map(projectItem),
    };
  }

  return result;
}

function projectListMax20(result: unknown): unknown {
  if (!result || typeof result !== 'object') {
    return result;
  }
  if (Array.isArray(result)) {
    return result.slice(0, 20);
  }
  if (Array.isArray((result as any).data)) {
    return {
      ...result,
      data: (result as any).data.slice(0, 20),
    };
  }
  return result;
}

export function createReviewsInventoryTools(
  deps: ReviewsInventoryToolDeps,
): AgentToolDef[] {
  // 1. get_product_reviews
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
    auth: 'admin',
    risk: 'READ',
    handler: async (args: {
      productId: string;
      page?: number;
      limit?: number;
      rating?: number;
    }) => {
      return deps.reviews.getProductReviews(args.productId, {
        page: args.page,
        limit: args.limit,
        rating: args.rating,
      });
    },
    summarize: (args) => `Xem đánh giá sản phẩm ${args.productId}`,
  };

  // 2. get_review_stats
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
    auth: 'admin',
    risk: 'READ',
    handler: async (args: { productId: string }) => {
      return deps.reviews.getProductStats(args.productId);
    },
    summarize: (args) => `Xem thống kê đánh giá sản phẩm ${args.productId}`,
  };

  // 3. list_reviews
  const listReviewsTool: AgentToolDef = {
    name: 'list_reviews',
    domain: 'reviews',
    description:
      'Xem danh sách tất cả đánh giá trên toàn hệ thống kèm bộ lọc sản phẩm, số sao và phân trang.',
    schema: z
      .object({
        productId: z.string().min(1).max(64).optional(),
        rating: z.number().int().min(1).max(5).optional(),
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (args: {
      productId?: string;
      rating?: number;
      page?: number;
      limit?: number;
    }) => {
      return deps.reviews.getAllReviewsForAdmin({
        productId: args.productId,
        rating: args.rating,
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: (args) =>
      args?.productId
        ? `Xem danh sách đánh giá của sản phẩm ${args.productId}`
        : 'Xem danh sách đánh giá toàn cửa hàng',
    project: projectReviewsList,
  };

  // 4. delete_review
  const deleteReviewTool: AgentToolDef = {
    name: 'delete_review',
    domain: 'reviews',
    description:
      'Xóa đánh giá của khách hàng. Không hoàn tác được. Quản trị viên có thể xóa mọi đánh giá.',
    schema: z
      .object({
        reviewId: z.string().min(1).max(64),
      })
      .strict(),
    auth: 'admin',
    risk: 'DESTRUCTIVE',
    handler: async (args: { reviewId: string }) => {
      return deps.reviews.deleteReviewAsAdmin(args.reviewId);
    },
    summarize: (args) => `Xóa đánh giá ${args.reviewId}`,
  };

  // 5. get_stock_levels
  const getStockLevelsTool: AgentToolDef = {
    name: 'get_stock_levels',
    domain: 'inventory',
    description: 'Xem mức tồn kho của tất cả biến thể sản phẩm kèm phân trang.',
    schema: z
      .object({
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (args: { page?: number; limit?: number }) => {
      return deps.inventory.getAllStockLevels({
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: (args) =>
      args?.page
        ? `Xem mức tồn kho sản phẩm (trang ${args.page})`
        : 'Xem mức tồn kho sản phẩm',
    project: projectListMax20,
  };

  // 6. get_low_stock
  const getLowStockTool: AgentToolDef = {
    name: 'get_low_stock',
    domain: 'inventory',
    description:
      'Xem danh sách các biến thể sản phẩm có tồn kho thấp hơn hoặc bằng ngưỡng quy định.',
    schema: z
      .object({
        threshold: z.number().int().min(0).max(1000).optional().default(10),
      })
      .strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (args: { threshold?: number }) => {
      return deps.inventory.getLowStockVariants(args.threshold ?? 10);
    },
    summarize: (args) =>
      `Xem danh sách sản phẩm sắp hết hàng (ngưỡng ${args?.threshold ?? 10})`,
  };

  // 7. get_stock_history
  const getStockHistoryTool: AgentToolDef = {
    name: 'get_stock_history',
    domain: 'inventory',
    description: 'Xem lịch sử biến động tồn kho của một biến thể sản phẩm.',
    schema: z
      .object({
        variantId: z.string().min(1).max(64),
        page: z.number().int().min(1).max(50).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'READ',
    handler: async (args: {
      variantId: string;
      page?: number;
      limit?: number;
    }) => {
      return deps.inventory.getStockHistory(args.variantId, {
        page: args.page,
        limit: args.limit,
      });
    },
    summarize: (args) =>
      args?.page
        ? `Xem lịch sử tồn kho biến thể ${args.variantId} (trang ${args.page})`
        : `Xem lịch sử tồn kho biến thể ${args.variantId}`,
    project: projectListMax20,
  };

  // 8. stock_add
  const stockAddTool: AgentToolDef = {
    name: 'stock_add',
    domain: 'inventory',
    description: 'Nhập thêm tồn kho cho một biến thể (cộng thêm số lượng).',
    schema: z
      .object({
        variantId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(10000),
        notes: z.string().max(200).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'WRITE',
    handler: async (
      args: { variantId: string; quantity: number; notes?: string },
      ctx: ToolContext,
    ) => {
      return deps.inventory.adjustStock(
        {
          variantId: args.variantId,
          type: 'IN',
          quantity: args.quantity,
          notes: tagAuditNotes(ctx.threadId, args.notes),
        },
        ctx.userId as string,
      );
    },
    summarize: (args) =>
      `Nhập thêm ${args.quantity} tồn kho cho biến thể ${args.variantId}`,
  };

  // 9. stock_remove
  const stockRemoveTool: AgentToolDef = {
    name: 'stock_remove',
    domain: 'inventory',
    description:
      'Xuất bớt tồn kho cho một biến thể (trừ đi số lượng). Không cho âm tồn.',
    schema: z
      .object({
        variantId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(10000),
        notes: z.string().max(200).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'WRITE',
    handler: async (
      args: { variantId: string; quantity: number; notes?: string },
      ctx: ToolContext,
    ) => {
      return deps.inventory.adjustStock(
        {
          variantId: args.variantId,
          type: 'OUT',
          quantity: args.quantity,
          notes: tagAuditNotes(ctx.threadId, args.notes),
        },
        ctx.userId as string,
      );
    },
    summarize: (args) =>
      `Xuất bớt ${args.quantity} tồn kho cho biến thể ${args.variantId}`,
  };

  // 10. stock_set
  const stockSetTool: AgentToolDef = {
    name: 'stock_set',
    domain: 'inventory',
    description:
      'Đặt tồn kho về một con số tuyệt đối (không phải số cộng thêm). Dùng stock_add hoặc stock_remove nếu khách muốn cộng hoặc trừ.',
    schema: z
      .object({
        variantId: z.string().min(1).max(64),
        quantity: z.number().int().min(0).max(100000),
        notes: z.string().max(200).optional(),
      })
      .strict(),
    auth: 'admin',
    risk: 'SENSITIVE',
    handler: async (
      args: { variantId: string; quantity: number; notes?: string },
      ctx: ToolContext,
    ) => {
      return deps.inventory.adjustStock(
        {
          variantId: args.variantId,
          type: 'ADJUST',
          quantity: args.quantity,
          notes: tagAuditNotes(ctx.threadId, args.notes),
        },
        ctx.userId as string,
      );
    },
    summarize: (args) =>
      `Đặt tồn kho biến thể ${args.variantId} về ${args.quantity}`,
  };

  // 11. delete_image
  const deleteImageTool: AgentToolDef = {
    name: 'delete_image',
    domain: 'images',
    description:
      'Xóa một ảnh đã tải lên Cloudinary theo public id. Ảnh đang được sản phẩm dùng vẫn còn được tham chiếu, nên kiểm tra trước khi xóa.',
    schema: z
      .object({
        publicId: z.string().min(1).max(200),
      })
      .strict(),
    auth: 'admin',
    risk: 'DESTRUCTIVE',
    handler: async (args: { publicId: string }) => {
      return deps.uploads.deleteFile(args.publicId);
    },
    summarize: (args) => `Xóa ảnh ${args.publicId}`,
  };

  // 12. navigate_to
  const navigateToTool: AgentToolDef = {
    name: 'navigate_to',
    domain: 'navigation',
    description:
      'Chuyển hướng người quản trị đến trang quản trị được chỉ định trong trình duyệt.',
    schema: z
      .object({
        path: z
          .string()
          .min(1)
          .max(120)
          .regex(ADMIN_NAVIGATE_PATH_REGEX, 'Đường dẫn không đúng định dạng')
          .refine(
            isAdminAllowedPath,
            'Đường dẫn quản trị không hợp lệ hoặc không được phép truy cập',
          ),
      })
      .strict(),
    auth: 'admin',
    risk: 'WRITE',
    handler: async (args: { path: string }) => {
      if (!isAdminAllowedPath(args.path)) {
        throw new Error(
          'Đường dẫn quản trị không hợp lệ hoặc không được phép truy cập',
        );
      }
      return {
        path: args.path,
      };
    },
    summarize: (args: { path: string }) => `Chuyển hướng đến ${args.path}`,
    uiAction: (result: unknown): UiAction => {
      const res = result as { path: string };
      return {
        type: 'navigate',
        payload: {
          path: res.path,
        },
      };
    },
  };

  return [
    getProductReviewsTool,
    getReviewStatsTool,
    listReviewsTool,
    deleteReviewTool,
    getStockLevelsTool,
    getLowStockTool,
    getStockHistoryTool,
    stockAddTool,
    stockRemoveTool,
    stockSetTool,
    deleteImageTool,
    navigateToTool,
  ];
}
