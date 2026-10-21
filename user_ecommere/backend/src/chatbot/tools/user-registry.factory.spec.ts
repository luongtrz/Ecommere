import {
  buildUserToolRegistry,
  UserRegistryDeps,
} from './user-registry.factory';
import { ToolContext } from './tool.types';
import { ToolRegistry } from './tool.registry';

describe('buildUserToolRegistry', () => {
  const createMockDeps = (): UserRegistryDeps => ({
    products: {} as any,
    categories: {} as any,
    retrieval: {} as any,
    users: {} as any,
    referrals: {} as any,
    orders: {} as any,
    reviews: {} as any,
    coupons: {} as any,
    prisma: {} as any,
    cart: {} as any,
  });

  let registry: ToolRegistry;

  beforeEach(() => {
    registry = buildUserToolRegistry(createMockDeps());
  });

  it('should register exactly 32 tools with unique names', () => {
    const allTools = registry.forContext({
      role: 'ADMIN',
      app: 'ADMIN',
      userId: 'admin-1',
      threadId: 'thread-admin',
    });

    expect(allTools).toHaveLength(32);

    const toolNames = allTools.map((t) => t.name);
    const uniqueNames = new Set(toolNames);
    expect(uniqueNames.size).toBe(32);
    expect(toolNames.length).toBe(32);
  });

  it('forContext for a GUEST includes search_products and not checkout', () => {
    const guestContext: ToolContext = {
      role: 'GUEST',
      app: 'USER',
      userId: null,
      threadId: 'thread-guest',
    };

    const guestTools = registry.forContext(guestContext);
    const guestToolNames = guestTools.map((t) => t.name);

    expect(guestToolNames).toContain('search_products');
    expect(guestToolNames).not.toContain('checkout');
    expect(guestTools.every((t) => t.auth === 'public')).toBe(true);
  });

  it('forContext for a CUSTOMER includes checkout and not any admin tool name', () => {
    const customerContext: ToolContext = {
      role: 'CUSTOMER',
      app: 'USER',
      userId: 'customer-1',
      threadId: 'thread-customer',
    };

    const customerTools = registry.forContext(customerContext);
    const customerToolNames = customerTools.map((t) => t.name);

    expect(customerToolNames).toContain('checkout');
    expect(customerTools.some((t) => t.auth === 'admin')).toBe(false);
    expect(customerTools.every((t) => t.auth !== 'admin')).toBe(true);
    expect(customerToolNames).not.toContain('update_order_status');
  });

  it('the USER app has no tool named update_order_status', () => {
    expect(registry.get('update_order_status')).toBeUndefined();

    const userAppTools = registry.forContext({
      role: 'ADMIN',
      app: 'USER',
      userId: 'admin-1',
      threadId: 'thread-user-app',
    });
    const userAppToolNames = userAppTools.map((t) => t.name);
    expect(userAppToolNames).not.toContain('update_order_status');
  });
});
