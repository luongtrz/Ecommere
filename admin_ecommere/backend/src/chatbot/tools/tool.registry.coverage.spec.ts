import { z } from 'zod';
import { AgentToolDef, ToolContext } from './tool.types';
import { ToolRegistry } from './tool.registry';

describe('ToolRegistry Coverage Companion', () => {
  const createMockTool = (
    name: string,
    auth: AgentToolDef['auth'],
    risk: AgentToolDef['risk'] = 'READ',
  ): AgentToolDef => ({
    name,
    domain: 'test-domain',
    description: `Description for ${name}`,
    schema: z.object({ query: z.string() }).strict(),
    auth,
    risk,
    handler: jest.fn().mockResolvedValue({ success: true }),
    summarize: () => `Summary for ${name}`,
  });

  let publicTool: AgentToolDef;
  let customerTool: AgentToolDef;
  let adminTool: AgentToolDef;

  beforeEach(() => {
    publicTool = createMockTool('search_catalog', 'public');
    customerTool = createMockTool('get_user_profile', 'customer');
    adminTool = createMockTool('delete_category', 'admin', 'DESTRUCTIVE');
  });

  describe('constructor and empty registry', () => {
    it('creates an empty registry when defs array is empty', () => {
      const registry = new ToolRegistry([]);

      expect(registry.get('search_catalog')).toBeUndefined();

      const guestCtx: ToolContext = {
        userId: null,
        role: 'GUEST',
        app: 'USER',
        threadId: 't-1',
      };
      expect(registry.forContext(guestCtx)).toEqual([]);
      expect(registry.forCtx(guestCtx)).toEqual([]);
    });

    it('throws an Error with exact message on duplicate tool registration', () => {
      const duplicate1 = createMockTool('my_duplicate_tool', 'public');
      const duplicate2 = createMockTool('my_duplicate_tool', 'admin');

      expect(() => new ToolRegistry([duplicate1, duplicate2])).toThrow(
        new Error('Duplicate tool name in registry: "my_duplicate_tool"'),
      );
      expect(() => new ToolRegistry([duplicate1, duplicate2])).toThrow(Error);
      expect(() => new ToolRegistry([duplicate1, duplicate2])).toThrow(
        'Duplicate tool name in registry: "my_duplicate_tool"',
      );
    });
  });

  describe('forCtx alias', () => {
    it('delegates directly to forContext and returns identical results for all contexts', () => {
      const registry = new ToolRegistry([publicTool, customerTool, adminTool]);
      const forContextSpy = jest.spyOn(registry, 'forContext');

      const ctx: ToolContext = {
        userId: 'u-1',
        role: 'CUSTOMER',
        app: 'USER',
        threadId: 't-cust',
      };

      const result = registry.forCtx(ctx);

      expect(forContextSpy).toHaveBeenCalledTimes(1);
      expect(forContextSpy).toHaveBeenCalledWith(ctx);
      expect(result).toEqual(registry.forContext(ctx));
      expect(result.map((t) => t.name)).toEqual([
        'search_catalog',
        'get_user_profile',
      ]);
    });
  });

  describe('forContext branch coverage', () => {
    let registry: ToolRegistry;

    beforeEach(() => {
      registry = new ToolRegistry([publicTool, customerTool, adminTool]);
    });

    it('filters non-admin tools when ADMIN role has an unhandled/fallback app value', () => {
      const otherAppCtx = {
        userId: 'admin-1',
        role: 'ADMIN' as const,
        app: 'EXTERNAL_INTEGRATION' as any,
        threadId: 't-admin-other',
      };

      const tools = registry.forContext(otherAppCtx);
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('search_catalog');
      expect(toolNames).toContain('get_user_profile');
      expect(toolNames).not.toContain('delete_category');
      expect(tools.every((t) => t.auth !== 'admin')).toBe(true);
    });

    it('filters non-admin tools when ADMIN role has undefined app value', () => {
      const undefinedAppCtx = {
        userId: 'admin-1',
        role: 'ADMIN' as const,
        app: undefined as any,
        threadId: 't-admin-no-app',
      };

      const tools = registry.forContext(undefinedAppCtx);
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toEqual(['search_catalog', 'get_user_profile']);
    });

    it('returns an empty array when role is unknown or unsupported', () => {
      const unknownRoleCtx = {
        userId: 'user-unknown',
        role: 'UNKNOWN_ROLE' as any,
        app: 'USER' as const,
        threadId: 't-unknown',
      };

      const tools = registry.forContext(unknownRoleCtx);
      expect(tools).toEqual([]);
    });

    it('returns an empty array when role is null or undefined', () => {
      const nullRoleCtx = {
        userId: null,
        role: null as any,
        app: 'USER' as const,
        threadId: 't-null',
      };

      expect(registry.forContext(nullRoleCtx)).toEqual([]);

      const undefinedRoleCtx = {
        userId: null,
        role: undefined as any,
        app: 'USER' as const,
        threadId: 't-undefined',
      };

      expect(registry.forContext(undefinedRoleCtx)).toEqual([]);
    });
  });

  describe('get', () => {
    it('returns undefined when tool name does not exist', () => {
      const registry = new ToolRegistry([publicTool]);
      expect(registry.get('non_existent_tool_name')).toBeUndefined();
    });

    it('returns exact tool instance when tool name exists', () => {
      const registry = new ToolRegistry([publicTool, adminTool]);
      expect(registry.get('search_catalog')).toBe(publicTool);
      expect(registry.get('delete_category')).toBe(adminTool);
    });
  });
});
