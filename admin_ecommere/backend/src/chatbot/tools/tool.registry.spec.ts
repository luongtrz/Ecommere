import { z } from 'zod';
import { AgentToolDef, ToolContext } from './tool.types';
import { ToolRegistry } from './tool.registry';

describe('ToolRegistry', () => {
  const createMockTool = (
    name: string,
    auth: AgentToolDef['auth'],
    risk: AgentToolDef['risk'] = 'READ',
    schema: z.ZodObject<any> = z.object({ query: z.string() }).strict(),
  ): AgentToolDef => ({
    name,
    domain: 'test',
    description: `Mô tả cho công cụ ${name}`,
    schema,
    auth,
    risk,
    handler: jest.fn().mockResolvedValue({ success: true }),
    summarize: () => `Tóm tắt cho ${name}`,
  });

  let publicTool: AgentToolDef;
  let customerTool: AgentToolDef;
  let adminTool: AgentToolDef;

  beforeEach(() => {
    publicTool = createMockTool('search_products', 'public');
    customerTool = createMockTool('get_order_details', 'customer');
    adminTool = createMockTool('update_inventory', 'admin');
  });

  describe('constructor', () => {
    it('should throw an error when two tools share the same name', () => {
      const toolA = createMockTool('duplicate_name', 'public');
      const toolB = createMockTool('duplicate_name', 'customer');

      expect(() => new ToolRegistry([toolA, toolB])).toThrow(
        /duplicate tool name/i,
      );
    });

    it('should successfully register distinct tools', () => {
      const registry = new ToolRegistry([publicTool, customerTool, adminTool]);
      expect(registry.get('search_products')).toBe(publicTool);
      expect(registry.get('get_order_details')).toBe(customerTool);
      expect(registry.get('update_inventory')).toBe(adminTool);
    });
  });

  describe('get', () => {
    it('should return the tool by name if it exists', () => {
      const registry = new ToolRegistry([publicTool]);
      expect(registry.get('search_products')).toBe(publicTool);
    });

    it('should return undefined if the tool does not exist', () => {
      const registry = new ToolRegistry([publicTool]);
      expect(registry.get('non_existent')).toBeUndefined();
    });
  });

  describe('forContext filtering rules', () => {
    let registry: ToolRegistry;

    beforeEach(() => {
      registry = new ToolRegistry([publicTool, customerTool, adminTool]);
    });

    it('should allow GUEST to see only public tools', () => {
      const ctx: ToolContext = {
        userId: null,
        role: 'GUEST',
        app: 'USER',
        threadId: 'thread-guest',
      };

      const tools = registry.forContext(ctx);
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toEqual(['search_products']);
      expect(tools.every((t) => t.auth === 'public')).toBe(true);
    });

    it('should allow CUSTOMER to see public and customer tools, and never admin tools', () => {
      const ctx: ToolContext = {
        userId: 'cust-123',
        role: 'CUSTOMER',
        app: 'USER',
        threadId: 'thread-customer',
      };

      const tools = registry.forContext(ctx);
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('search_products');
      expect(toolNames).toContain('get_order_details');
      expect(toolNames).not.toContain('update_inventory');
      expect(tools.every((t) => t.auth !== 'admin')).toBe(true);
      expect(tools.some((t) => t.auth === 'admin')).toBe(false);
    });

    it('should not expose admin tools to ADMIN role in USER app', () => {
      const ctx: ToolContext = {
        userId: 'admin-123',
        role: 'ADMIN',
        app: 'USER',
        threadId: 'thread-admin-in-user-app',
      };

      const tools = registry.forContext(ctx);
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('search_products');
      expect(toolNames).toContain('get_order_details');
      expect(toolNames).not.toContain('update_inventory');
      expect(tools.every((t) => t.auth !== 'admin')).toBe(true);
    });

    it('should expose all tools to ADMIN role in ADMIN app', () => {
      const ctx: ToolContext = {
        userId: 'admin-123',
        role: 'ADMIN',
        app: 'ADMIN',
        threadId: 'thread-admin-in-admin-app',
      };

      const tools = registry.forContext(ctx);
      const toolNames = tools.map((t) => t.name);

      expect(tools).toHaveLength(3);
      expect(toolNames).toEqual(
        expect.arrayContaining([
          'search_products',
          'get_order_details',
          'update_inventory',
        ]),
      );
    });
  });

  describe('schema validation and strictness', () => {
    it('should reject an extra userId key when fixture schema is strict', () => {
      const fixtureSchema = z
        .object({
          orderId: z.string(),
          reason: z.string().optional(),
        })
        .strict();

      const fixtureTool: AgentToolDef = {
        name: 'cancel_order',
        domain: 'orders',
        description: 'Hủy đơn hàng của khách hàng',
        schema: fixtureSchema,
        auth: 'customer',
        risk: 'SENSITIVE',
        handler: jest.fn().mockResolvedValue({ cancelled: true }),
        summarize: (args) => `Hủy đơn hàng ${args.orderId}`,
      };

      // Valid arguments without userId
      const validPayload = { orderId: 'ord-999', reason: 'Đổi ý không mua nữa' };
      const validParsed = fixtureTool.schema.safeParse(validPayload);
      expect(validParsed.success).toBe(true);

      // Injected payload with an extra userId key
      const injectedPayload = {
        orderId: 'ord-999',
        userId: 'attacker-injected-id',
      };
      const invalidParsed = fixtureTool.schema.safeParse(injectedPayload);

      expect(invalidParsed.success).toBe(false);
      if (!invalidParsed.success) {
        const unrecognizedIssue = invalidParsed.error.issues.find(
          (issue) => issue.code === 'unrecognized_keys',
        );
        expect(unrecognizedIssue).toBeDefined();
        if (unrecognizedIssue && 'keys' in unrecognizedIssue) {
          expect((unrecognizedIssue as any).keys).toContain('userId');
        }
      }

      expect(() => fixtureTool.schema.parse(injectedPayload)).toThrow();
    });
  });
});
