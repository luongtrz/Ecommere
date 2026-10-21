import {
  createClientActionTools,
  ClientActionToolDeps,
} from './client-actions.tools';
import { AgentToolDef, ToolContext } from '../tool.types';
import { ToolError } from '../tool-result.util';

describe('client-actions tools (gaps coverage)', () => {
  let mockPrisma: {
    productVariant: {
      findUnique: jest.Mock;
    };
  };
  let deps: ClientActionToolDeps;
  let tools: AgentToolDef[];
  let mockContext: ToolContext;

  beforeEach(() => {
    mockPrisma = {
      productVariant: {
        findUnique: jest.fn(),
      },
    };
    deps = { prisma: mockPrisma };
    tools = createClientActionTools(deps);
    mockContext = {
      userId: null,
      role: 'GUEST',
      app: 'USER',
      threadId: 'thread-test',
    };
  });

  const getTool = (name: string): AgentToolDef => {
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return tool;
  };

  describe('summarize functions for all tools', () => {
    it('exercises cart_get summarize', () => {
      const tool = getTool('cart_get');
      expect(tool.summarize).toBeDefined();
      expect(tool.summarize!({})).toBe('Xem giỏ hàng hiện tại');
    });

    it('exercises cart_add_item summarize', () => {
      const tool = getTool('cart_add_item');
      expect(tool.summarize).toBeDefined();
      expect(tool.summarize!({ variantId: 'var-101', quantity: 3 })).toBe(
        'Thêm 3 sản phẩm vào giỏ hàng',
      );
    });

    it('exercises cart_update_item summarize', () => {
      const tool = getTool('cart_update_item');
      expect(tool.summarize).toBeDefined();
      expect(tool.summarize!({ variantId: 'var-202', quantity: 5 })).toBe(
        'Cập nhật số lượng sản phẩm (var-202) thành 5',
      );
    });

    it('exercises cart_remove_item summarize', () => {
      const tool = getTool('cart_remove_item');
      expect(tool.summarize).toBeDefined();
      expect(tool.summarize!({ variantId: 'var-303' })).toBe(
        'Xóa sản phẩm (var-303) khỏi giỏ hàng',
      );
    });

    it('exercises cart_clear summarize', () => {
      const tool = getTool('cart_clear');
      expect(tool.summarize).toBeDefined();
      expect(tool.summarize!({})).toBe('Xóa toàn bộ giỏ hàng');
    });

    it('exercises navigate_to summarize', () => {
      const tool = getTool('navigate_to');
      expect(tool.summarize).toBeDefined();
      expect(tool.summarize!({ path: '/catalog' })).toBe(
        'Chuyển hướng đến /catalog',
      );
    });
  });

  describe('cart_add_item gap branches', () => {
    it('throws ToolError when variant.product is null/undefined (!variant.product branch)', async () => {
      const tool = getTool('cart_add_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-no-product',
        stock: 10,
        product: null,
      });

      await expect(
        tool.handler({ variantId: 'var-no-product', quantity: 1 }, mockContext),
      ).rejects.toThrow(ToolError);

      await expect(
        tool.handler({ variantId: 'var-no-product', quantity: 1 }, mockContext),
      ).rejects.toThrow(/ngừng|không còn kinh doanh/i);
    });

    it('falls back to variant.productId when variant.product.id is null or undefined', async () => {
      const tool = getTool('cart_add_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-id-fallback',
        productId: 'fallback-product-id-999',
        stock: 20,
        scent: 'Lemon',
        volumeMl: 50,
        price: 80000,
        salePrice: null,
        product: {
          id: undefined,
          name: 'Nước hoa sả chanh',
          images: ['https://example.com/lemon.jpg'],
          active: true,
        },
      });

      const result: any = await tool.handler(
        { variantId: 'var-id-fallback', quantity: 2 },
        mockContext,
      );

      expect(result.productId).toBe('fallback-product-id-999');
      expect(result.name).toBe('Nước hoa sả chanh');

      const action = tool.uiAction!(result);
      expect(action).toEqual({
        type: 'cart.add',
        payload: {
          variantId: 'var-id-fallback',
          quantity: 2,
          productId: 'fallback-product-id-999',
          name: 'Nước hoa sả chanh',
          image: 'https://example.com/lemon.jpg',
          scent: 'Lemon',
          volumeMl: 50,
          price: 80000,
        },
      });
    });

    it('falls back to empty string when variant.product.images is null or undefined', async () => {
      const tool = getTool('cart_add_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-null-images',
        productId: 'prod-null-images',
        stock: 15,
        scent: 'Cúc La Mã',
        volumeMl: 100,
        price: 110000,
        salePrice: null,
        product: {
          id: 'prod-null-images',
          name: 'Xịt thơm cúc la mã',
          images: null,
          active: true,
        },
      });

      const result: any = await tool.handler(
        { variantId: 'var-null-images', quantity: 1 },
        mockContext,
      );

      expect(result.image).toBe('');

      const action = tool.uiAction!(result);
      expect(action.payload).toMatchObject({
        image: '',
        name: 'Xịt thơm cúc la mã',
      });
    });
  });

  describe('cart_update_item gap branches', () => {
    it('throws ToolError when variant.product is null/undefined (!variant.product branch)', async () => {
      const tool = getTool('cart_update_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-no-product',
        stock: 10,
        product: null,
      });

      await expect(
        tool.handler({ variantId: 'var-no-product', quantity: 2 }, mockContext),
      ).rejects.toThrow(ToolError);

      await expect(
        tool.handler({ variantId: 'var-no-product', quantity: 2 }, mockContext),
      ).rejects.toThrow(/ngừng|không còn kinh doanh/i);
    });
  });

  describe('navigate_to gap branches (isAllowedPath paths)', () => {
    let tool: AgentToolDef;

    beforeEach(() => {
      tool = getTool('navigate_to');
    });

    it('handles non-string path in handler by throwing ToolError', async () => {
      await expect(
        tool.handler({ path: null as any }, mockContext),
      ).rejects.toThrow(ToolError);

      await expect(
        tool.handler({ path: 12345 as any }, mockContext),
      ).rejects.toThrow(
        'Đường dẫn không hợp lệ hoặc không được phép truy cập.',
      );
    });

    it('rejects path with segment starting with slash (e.g. /p//double-slash)', async () => {
      const invalidPath = '/p//double-slash';
      expect(tool.schema.safeParse({ path: invalidPath }).success).toBe(false);

      await expect(
        tool.handler({ path: invalidPath }, mockContext),
      ).rejects.toThrow(ToolError);
    });

    it('rejects path with segment containing consecutive slashes (e.g. /p/item//details)', async () => {
      const invalidPath = '/p/item//details';
      expect(tool.schema.safeParse({ path: invalidPath }).success).toBe(false);

      await expect(
        tool.handler({ path: invalidPath }, mockContext),
      ).rejects.toThrow(ToolError);
    });

    it('rejects path that does not match exact paths or prefixes (e.g. /other/unsupported)', async () => {
      const invalidPath = '/other/unsupported';
      expect(tool.schema.safeParse({ path: invalidPath }).success).toBe(false);

      await expect(
        tool.handler({ path: invalidPath }, mockContext),
      ).rejects.toThrow(ToolError);
    });
  });
});
