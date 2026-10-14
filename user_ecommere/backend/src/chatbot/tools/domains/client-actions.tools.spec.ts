import { createClientActionTools, ClientActionToolDeps } from './client-actions.tools';
import { AgentToolDef, ToolContext } from '../tool.types';

describe('client-actions tools', () => {
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

  describe('createClientActionTools factory', () => {
    it('returns 6 tools with unique names, all auth "public"', () => {
      expect(tools).toHaveLength(6);

      const names = tools.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(6);

      expect(names).toEqual([
        'cart_get',
        'cart_add_item',
        'cart_update_item',
        'cart_remove_item',
        'cart_clear',
        'navigate_to',
      ]);

      for (const tool of tools) {
        expect(tool.auth).toBe('public');
      }
    });

    it('ensures all schemas are strict and reject injected userId or role', () => {
      for (const tool of tools) {
        const injectedWithUserId = { userId: 'attacker' };
        const injectedWithRole = { role: 'ADMIN' };

        expect(() => tool.schema.parse(injectedWithUserId)).toThrow();
        expect(() => tool.schema.parse(injectedWithRole)).toThrow();
      }
    });
  });

  describe('cart_get', () => {
    it('returns the browser cart unchanged and does not call Prisma', async () => {
      const tool = getTool('cart_get');
      expect(tool.risk).toBe('READ');
      expect(tool.uiAction).toBeUndefined();

      const browserCart = [
        { variantId: 'var-1', quantity: 2, name: 'Sản phẩm 1', price: 100000 },
        { variantId: 'var-2', quantity: 1, name: 'Sản phẩm 2', price: 150000 },
      ];

      const ctxWithCart: ToolContext = {
        ...mockContext,
        clientContext: { cart: browserCart },
      };

      const result = await tool.handler({}, ctxWithCart);
      expect(result).toEqual({ items: browserCart });
      expect(mockPrisma.productVariant.findUnique).not.toHaveBeenCalled();
    });

    it('returns empty array when clientContext or cart is missing', async () => {
      const tool = getTool('cart_get');

      const resultNoClient = await tool.handler({}, mockContext);
      expect(resultNoClient).toEqual({ items: [] });

      const resultEmptyContext = await tool.handler(
        {},
        { ...mockContext, clientContext: {} },
      );
      expect(resultEmptyContext).toEqual({ items: [] });
      expect(mockPrisma.productVariant.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('cart_add_item', () => {
    it('never calls Prisma with a quantity above 99 (schema rejects it first)', async () => {
      const tool = getTool('cart_add_item');
      expect(() =>
        tool.schema.parse({ variantId: 'var-1', quantity: 100 }),
      ).toThrow();
      expect(mockPrisma.productVariant.findUnique).not.toHaveBeenCalled();
    });

    it('rejects non-positive quantity and empty variantId in schema', () => {
      const tool = getTool('cart_add_item');
      expect(() => tool.schema.parse({ variantId: 'var-1', quantity: 0 })).toThrow();
      expect(() => tool.schema.parse({ variantId: 'var-1', quantity: -5 })).toThrow();
      expect(() => tool.schema.parse({ variantId: '', quantity: 1 })).toThrow();
      expect(() =>
        tool.schema.parse({ variantId: 'a'.repeat(65), quantity: 1 }),
      ).toThrow();
    });

    it('throws when variant is missing', async () => {
      const tool = getTool('cart_add_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        tool.handler({ variantId: 'var-missing', quantity: 1 }, mockContext),
      ).rejects.toThrow(/không tồn tại/i);

      expect(mockPrisma.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'var-missing' },
        include: { product: true },
      });
    });

    it('throws when product is inactive', async () => {
      const tool = getTool('cart_add_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-inactive',
        stock: 10,
        scent: 'Lavender',
        volumeMl: 100,
        price: 120000,
        salePrice: null,
        product: {
          name: 'Tinh dầu xịt phòng',
          active: false,
        },
      });

      await expect(
        tool.handler({ variantId: 'var-inactive', quantity: 1 }, mockContext),
      ).rejects.toThrow(/ngừng|không còn kinh doanh/i);
    });

    it('throws when insufficient stock and mentions remaining stock', async () => {
      const tool = getTool('cart_add_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-low-stock',
        stock: 3,
        scent: 'Rose',
        volumeMl: 50,
        price: 90000,
        salePrice: null,
        product: {
          name: 'Nước hoa mini',
          active: true,
        },
      });

      await expect(
        tool.handler({ variantId: 'var-low-stock', quantity: 5 }, mockContext),
      ).rejects.toThrow(/3/);
    });

    it('returns server-side name, price, quantity, stock and uiAction builds cart.add with exact values (price when no salePrice)', async () => {
      const tool = getTool('cart_add_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-123',
        productId: 'prod-123',
        stock: 15,
        scent: 'Bạc Hà',
        volumeMl: 100,
        price: 150000,
        salePrice: null,
        product: {
          id: 'prod-123',
          name: 'Xịt thơm phòng',
          images: ['https://example.com/spray.jpg'],
          active: true,
        },
      });

      const parsedArgs = tool.schema.parse({ variantId: 'var-123', quantity: 2 });
      const result: any = await tool.handler(parsedArgs, mockContext);

      expect(result).toEqual({
        variantId: 'var-123',
        productId: 'prod-123',
        name: 'Xịt thơm phòng',
        image: 'https://example.com/spray.jpg',
        price: 150000,
        quantity: 2,
        scent: 'Bạc Hà',
        volumeMl: 100,
        stock: 15,
      });

      expect(tool.uiAction).toBeDefined();
      const action = tool.uiAction!(result);
      expect(action).toEqual({
        type: 'cart.add',
        payload: {
          variantId: 'var-123',
          quantity: 2,
          productId: 'prod-123',
          name: 'Xịt thơm phòng',
          image: 'https://example.com/spray.jpg',
          scent: 'Bạc Hà',
          volumeMl: 100,
          price: 150000,
        },
      });
    });

    it('salePrice wins over price when set', async () => {
      const tool = getTool('cart_add_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-discount',
        productId: 'prod-456',
        stock: 10,
        scent: 'Gỗ Đàn Hương',
        volumeMl: 200,
        price: 250000,
        salePrice: 199000,
        product: {
          id: 'prod-456',
          name: 'Xịt phòng cao cấp',
          images: ['https://example.com/luxury.jpg'],
          active: true,
        },
      });

      const parsedArgs = tool.schema.parse({
        variantId: 'var-discount',
        quantity: 1,
      });
      const result: any = await tool.handler(parsedArgs, mockContext);

      expect(result.price).toBe(199000);

      const action = tool.uiAction!(result);
      expect(action).toEqual({
        type: 'cart.add',
        payload: {
          variantId: 'var-discount',
          quantity: 1,
          productId: 'prod-456',
          name: 'Xịt phòng cao cấp',
          image: 'https://example.com/luxury.jpg',
          scent: 'Gỗ Đàn Hương',
          volumeMl: 200,
          price: 199000,
        },
      });
    });

    it('yields image "" when product has no images', async () => {
      const tool = getTool('cart_add_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-no-img',
        productId: 'prod-no-img',
        stock: 8,
        scent: 'Sả Chanh',
        volumeMl: 50,
        price: 95000,
        salePrice: null,
        product: {
          id: 'prod-no-img',
          name: 'Xịt phòng sả chanh',
          images: [],
          active: true,
        },
      });

      const parsedArgs = tool.schema.parse({
        variantId: 'var-no-img',
        quantity: 1,
      });
      const result: any = await tool.handler(parsedArgs, mockContext);

      expect(result.image).toBe('');

      const action = tool.uiAction!(result);
      expect(action).toEqual({
        type: 'cart.add',
        payload: {
          variantId: 'var-no-img',
          quantity: 1,
          productId: 'prod-no-img',
          name: 'Xịt phòng sả chanh',
          image: '',
          scent: 'Sả Chanh',
          volumeMl: 50,
          price: 95000,
        },
      });
    });
  });

  describe('cart_update_item', () => {
    it('never calls Prisma with a quantity above 99 (schema rejects it first)', async () => {
      const tool = getTool('cart_update_item');
      expect(() =>
        tool.schema.parse({ variantId: 'var-1', quantity: 150 }),
      ).toThrow();
      expect(mockPrisma.productVariant.findUnique).not.toHaveBeenCalled();
    });

    it('throws when variant is missing', async () => {
      const tool = getTool('cart_update_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        tool.handler({ variantId: 'var-missing', quantity: 2 }, mockContext),
      ).rejects.toThrow(/không tồn tại/i);
    });

    it('throws when product is inactive', async () => {
      const tool = getTool('cart_update_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-inactive',
        stock: 10,
        product: { active: false },
      });

      await expect(
        tool.handler({ variantId: 'var-inactive', quantity: 2 }, mockContext),
      ).rejects.toThrow(/ngừng|không còn kinh doanh/i);
    });

    it('throws when insufficient stock and mentions remaining stock', async () => {
      const tool = getTool('cart_update_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        stock: 4,
        product: { active: true },
      });

      await expect(
        tool.handler({ variantId: 'var-1', quantity: 10 }, mockContext),
      ).rejects.toThrow(/4/);
    });

    it('returns { variantId, quantity } and uiAction returns cart.update', async () => {
      const tool = getTool('cart_update_item');
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'var-1',
        stock: 10,
        product: { active: true },
      });

      const result: any = await tool.handler(
        { variantId: 'var-1', quantity: 5 },
        mockContext,
      );
      expect(result).toEqual({ variantId: 'var-1', quantity: 5 });

      expect(tool.uiAction).toBeDefined();
      expect(tool.uiAction!(result)).toEqual({
        type: 'cart.update',
        payload: {
          variantId: 'var-1',
          quantity: 5,
        },
      });
    });
  });

  describe('cart_remove_item', () => {
    it('returns { variantId } without database and uiAction returns cart.remove', async () => {
      const tool = getTool('cart_remove_item');
      expect(tool.risk).toBe('WRITE');

      const parsedArgs = tool.schema.parse({ variantId: 'var-to-remove' });
      const result: any = await tool.handler(parsedArgs, mockContext);

      expect(result).toEqual({ variantId: 'var-to-remove' });
      expect(mockPrisma.productVariant.findUnique).not.toHaveBeenCalled();

      expect(tool.uiAction).toBeDefined();
      expect(tool.uiAction!(result)).toEqual({
        type: 'cart.remove',
        payload: { variantId: 'var-to-remove' },
      });
    });
  });

  describe('cart_clear', () => {
    it('returns { cleared: true } without database and uiAction returns cart.clear', async () => {
      const tool = getTool('cart_clear');
      expect(tool.risk).toBe('DESTRUCTIVE');

      const parsedArgs = tool.schema.parse({});
      const result: any = await tool.handler(parsedArgs, mockContext);

      expect(result).toEqual({ cleared: true });
      expect(mockPrisma.productVariant.findUnique).not.toHaveBeenCalled();

      expect(tool.uiAction).toBeDefined();
      expect(tool.uiAction!(result)).toEqual({
        type: 'cart.clear',
        payload: {},
      });
    });
  });

  describe('navigate_to', () => {
    let tool: AgentToolDef;

    beforeEach(() => {
      tool = getTool('navigate_to');
    });

    it('accepts "/p/some-slug" and returns { path } with uiAction navigate', async () => {
      const parsedArgs = tool.schema.parse({ path: '/p/some-slug' });
      const result: any = await tool.handler(parsedArgs, mockContext);

      expect(result).toEqual({ path: '/p/some-slug' });
      expect(tool.uiAction).toBeDefined();
      expect(tool.uiAction!(result)).toEqual({
        type: 'navigate',
        payload: { path: '/p/some-slug' },
      });
    });

    it('accepts all allowed exact paths and prefix paths', async () => {
      const allowedPaths = [
        '/',
        '/catalog',
        '/cart',
        '/wishlist',
        '/account',
        '/addresses',
        '/orders',
        '/checkout',
        '/referral',
        '/p/perfume-rose-100ml',
        '/c/fragrance-collection',
        '/orders/ord-999888',
      ];

      for (const path of allowedPaths) {
        expect(() => tool.schema.parse({ path })).not.toThrow();
        const res: any = await tool.handler({ path }, mockContext);
        expect(res).toEqual({ path });
      }
    });

    it('rejects "//evil.example", "https://x" and "/admin"', async () => {
      // Schema level rejection
      expect(() => tool.schema.parse({ path: '//evil.example' })).toThrow();
      expect(() => tool.schema.parse({ path: 'https://x' })).toThrow();
      expect(() => tool.schema.parse({ path: '/admin' })).toThrow();

      // Handler level rejection
      await expect(
        tool.handler({ path: '//evil.example' }, mockContext),
      ).rejects.toThrow();
      await expect(
        tool.handler({ path: 'https://x' }, mockContext),
      ).rejects.toThrow();
      await expect(
        tool.handler({ path: '/admin' }, mockContext),
      ).rejects.toThrow();
    });

    it('rejects paths with empty prefix segments like "/p/", "/c/", "/orders/"', async () => {
      expect(() => tool.schema.parse({ path: '/p/' })).toThrow();
      expect(() => tool.schema.parse({ path: '/c/' })).toThrow();
      expect(() => tool.schema.parse({ path: '/orders/' })).toThrow();

      await expect(tool.handler({ path: '/p/' }, mockContext)).rejects.toThrow();
      await expect(tool.handler({ path: '/c/' }, mockContext)).rejects.toThrow();
      await expect(tool.handler({ path: '/orders/' }, mockContext)).rejects.toThrow();
    });
  });
});
