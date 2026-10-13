import { buildAdminToolRegistry, AdminRegistryDeps } from './admin-registry.factory';
import { ToolContext } from './tool.types';
import { ToolRegistry } from './tool.registry';

describe('buildAdminToolRegistry', () => {
  const createMockDeps = (): AdminRegistryDeps => ({
    admin: {} as any,
    reports: {} as any,
    customers: {} as any,
    orders: {} as any,
    products: {} as any,
    categories: {} as any,
    coupons: {} as any,
    referrals: {} as any,
    reviews: {} as any,
    inventory: {} as any,
    uploads: {} as any,
  });

  let registry: ToolRegistry;

  beforeEach(() => {
    registry = buildAdminToolRegistry(createMockDeps());
  });

  it('should register exactly 41 tools with unique names', () => {
    const adminCtx: ToolContext = {
      role: 'ADMIN',
      app: 'ADMIN',
      userId: 'admin-1',
      threadId: 'thread-admin',
    };

    const allTools = registry.forContext(adminCtx);
    expect(allTools).toHaveLength(41);

    const toolNames = allTools.map((t) => t.name);
    const uniqueNames = new Set(toolNames);
    expect(uniqueNames.size).toBe(41);
    expect(toolNames.length).toBe(41);
  });

  it('forContext for an ADMIN in the ADMIN app includes update_order_status, delete_product and stock_set', () => {
    const adminCtx: ToolContext = {
      role: 'ADMIN',
      app: 'ADMIN',
      userId: 'admin-1',
      threadId: 'thread-admin',
    };

    const adminTools = registry.forContext(adminCtx);
    const toolNames = adminTools.map((t) => t.name);

    expect(toolNames).toContain('update_order_status');
    expect(toolNames).toContain('delete_product');
    expect(toolNames).toContain('stock_set');
  });

  it('every tool has auth "admin"', () => {
    const adminCtx: ToolContext = {
      role: 'ADMIN',
      app: 'ADMIN',
      userId: 'admin-1',
      threadId: 'thread-admin',
    };

    const adminTools = registry.forContext(adminCtx);
    expect(adminTools.length).toBe(41);
    expect(adminTools.every((t) => t.auth === 'admin')).toBe(true);
  });

  it('has no tool named checkout or search_products', () => {
    expect(registry.get('checkout')).toBeUndefined();
    expect(registry.get('search_products')).toBeUndefined();

    const adminCtx: ToolContext = {
      role: 'ADMIN',
      app: 'ADMIN',
      userId: 'admin-1',
      threadId: 'thread-admin',
    };

    const adminToolNames = registry.forContext(adminCtx).map((t) => t.name);
    expect(adminToolNames).not.toContain('checkout');
    expect(adminToolNames).not.toContain('search_products');
  });

  it('does not expose admin tools to GUEST or CUSTOMER contexts', () => {
    const guestCtx: ToolContext = {
      role: 'GUEST',
      app: 'USER',
      userId: null,
      threadId: 'thread-guest',
    };
    expect(registry.forContext(guestCtx)).toEqual([]);

    const customerCtx: ToolContext = {
      role: 'CUSTOMER',
      app: 'USER',
      userId: 'customer-1',
      threadId: 'thread-customer',
    };
    expect(registry.forContext(customerCtx)).toEqual([]);
  });
});
