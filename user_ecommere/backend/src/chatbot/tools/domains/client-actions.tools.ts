import { z } from 'zod';
import { AgentToolDef, ToolContext, UiAction } from '../tool.types';

export interface ClientActionToolDeps {
  prisma: {
    productVariant: {
      findUnique(args: any): Promise<any>;
    };
  };
}

const NAVIGATE_PATH_REGEX = /^\/(?!\/)[A-Za-z0-9/_-]{0,120}$/;

const ALLOWED_EXACT_PATHS = new Set([
  '/',
  '/catalog',
  '/cart',
  '/wishlist',
  '/account',
  '/addresses',
  '/orders',
  '/checkout',
  '/referral',
]);

const ALLOWED_PREFIXES = ['/p/', '/c/', '/orders/'];

function isAllowedPath(path: string): boolean {
  if (typeof path !== 'string') {
    return false;
  }
  if (!NAVIGATE_PATH_REGEX.test(path)) {
    return false;
  }
  if (ALLOWED_EXACT_PATHS.has(path)) {
    return true;
  }
  for (const prefix of ALLOWED_PREFIXES) {
    if (path.startsWith(prefix)) {
      const segment = path.slice(prefix.length);
      if (segment.length > 0 && !segment.startsWith('/') && !segment.includes('//')) {
        return true;
      }
    }
  }
  return false;
}

export function createClientActionTools(deps: ClientActionToolDeps): AgentToolDef[] {
  const cartGetTool: AgentToolDef = {
    name: 'cart_get',
    domain: 'cart',
    description: 'Xem các sản phẩm hiện có trong giỏ hàng từ trình duyệt của khách hàng.',
    schema: z.object({}).strict(),
    auth: 'public',
    risk: 'READ',
    handler: async (_args: Record<string, never>, ctx: ToolContext) => {
      const items = (ctx.clientContext?.cart as unknown[]) ?? [];
      return { items };
    },
    summarize: () => 'Xem giỏ hàng hiện tại',
  };

  const cartAddItemTool: AgentToolDef = {
    name: 'cart_add_item',
    domain: 'cart',
    description:
      'Thêm sản phẩm vào giỏ hàng trong trình duyệt sau khi máy chủ kiểm tra tồn kho.',
    schema: z
      .object({
        variantId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(99),
      })
      .strict(),
    auth: 'public',
    risk: 'WRITE',
    handler: async (args: { variantId: string; quantity: number }) => {
      const variant = await deps.prisma.productVariant.findUnique({
        where: { id: args.variantId },
        include: { product: true },
      });

      if (!variant) {
        throw new Error('Biến thể sản phẩm không tồn tại.');
      }

      if (!variant.product || !variant.product.active) {
        throw new Error('Sản phẩm hiện không còn kinh doanh hoặc đã ngừng hoạt động.');
      }

      if (variant.stock < args.quantity) {
        throw new Error(`Số lượng tồn kho không đủ (chỉ còn ${variant.stock} sản phẩm).`);
      }

      const name = `${variant.product.name} ${variant.scent} ${variant.volumeMl}ml`;
      const price = variant.salePrice ?? variant.price;

      return {
        variantId: args.variantId,
        name,
        price,
        quantity: args.quantity,
        stock: variant.stock,
      };
    },
    summarize: (args: { variantId: string; quantity: number }) =>
      `Thêm ${args.quantity} sản phẩm vào giỏ hàng`,
    uiAction: (result: unknown): UiAction => {
      const res = result as {
        variantId: string;
        quantity: number;
        name: string;
        price: number;
      };
      return {
        type: 'cart.add',
        payload: {
          variantId: res.variantId,
          quantity: res.quantity,
          name: res.name,
          price: res.price,
        },
      };
    },
  };

  const cartUpdateItemTool: AgentToolDef = {
    name: 'cart_update_item',
    domain: 'cart',
    description:
      'Cập nhật số lượng sản phẩm trong giỏ hàng trình duyệt sau khi máy chủ kiểm tra tồn kho.',
    schema: z
      .object({
        variantId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(99),
      })
      .strict(),
    auth: 'public',
    risk: 'WRITE',
    handler: async (args: { variantId: string; quantity: number }) => {
      const variant = await deps.prisma.productVariant.findUnique({
        where: { id: args.variantId },
        include: { product: true },
      });

      if (!variant) {
        throw new Error('Biến thể sản phẩm không tồn tại.');
      }

      if (!variant.product || !variant.product.active) {
        throw new Error('Sản phẩm hiện không còn kinh doanh hoặc đã ngừng hoạt động.');
      }

      if (variant.stock < args.quantity) {
        throw new Error(`Số lượng tồn kho không đủ (chỉ còn ${variant.stock} sản phẩm).`);
      }

      return {
        variantId: args.variantId,
        quantity: args.quantity,
      };
    },
    summarize: (args: { variantId: string; quantity: number }) =>
      `Cập nhật số lượng sản phẩm (${args.variantId}) thành ${args.quantity}`,
    uiAction: (result: unknown): UiAction => {
      const res = result as { variantId: string; quantity: number };
      return {
        type: 'cart.update',
        payload: {
          variantId: res.variantId,
          quantity: res.quantity,
        },
      };
    },
  };

  const cartRemoveItemTool: AgentToolDef = {
    name: 'cart_remove_item',
    domain: 'cart',
    description: 'Xóa sản phẩm khỏi giỏ hàng trong trình duyệt.',
    schema: z
      .object({
        variantId: z.string().min(1).max(64),
      })
      .strict(),
    auth: 'public',
    risk: 'WRITE',
    handler: async (args: { variantId: string }) => {
      return {
        variantId: args.variantId,
      };
    },
    summarize: (args: { variantId: string }) =>
      `Xóa sản phẩm (${args.variantId}) khỏi giỏ hàng`,
    uiAction: (result: unknown): UiAction => {
      const res = result as { variantId: string };
      return {
        type: 'cart.remove',
        payload: {
          variantId: res.variantId,
        },
      };
    },
  };

  const cartClearTool: AgentToolDef = {
    name: 'cart_clear',
    domain: 'cart',
    description: 'Xóa toàn bộ sản phẩm khỏi giỏ hàng trong trình duyệt.',
    schema: z.object({}).strict(),
    auth: 'public',
    risk: 'WRITE',
    handler: async () => {
      return {
        cleared: true,
      };
    },
    summarize: () => 'Xóa toàn bộ giỏ hàng',
    uiAction: (): UiAction => {
      return {
        type: 'cart.clear',
        payload: {},
      };
    },
  };

  const navigateToTool: AgentToolDef = {
    name: 'navigate_to',
    domain: 'navigation',
    description: 'Chuyển hướng người dùng đến trang được chỉ định trong trình duyệt.',
    schema: z
      .object({
        path: z
          .string()
          .regex(NAVIGATE_PATH_REGEX, 'Đường dẫn không đúng định dạng')
          .refine(isAllowedPath, 'Đường dẫn không được phép truy cập'),
      })
      .strict(),
    auth: 'public',
    risk: 'WRITE',
    handler: async (args: { path: string }) => {
      if (!isAllowedPath(args.path)) {
        throw new Error('Đường dẫn không hợp lệ hoặc không được phép truy cập.');
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
    cartGetTool,
    cartAddItemTool,
    cartUpdateItemTool,
    cartRemoveItemTool,
    cartClearTool,
    navigateToTool,
  ];
}
