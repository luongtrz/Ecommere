import { AgentToolDef, ToolContext } from './tool.types';

export class ToolRegistry {
  private readonly tools = new Map<string, AgentToolDef>();

  constructor(defs: AgentToolDef[]) {
    for (const def of defs) {
      if (this.tools.has(def.name)) {
        throw new Error(`Duplicate tool name in registry: "${def.name}"`);
      }
      this.tools.set(def.name, def);
    }
  }

  get(name: string): AgentToolDef | undefined {
    return this.tools.get(name);
  }

  forContext(ctx: ToolContext): AgentToolDef[] {
    const allTools = Array.from(this.tools.values());

    if (ctx.role === 'GUEST') {
      return allTools.filter((tool) => tool.auth === 'public');
    }

    if (ctx.role === 'CUSTOMER') {
      return allTools.filter(
        (tool) => tool.auth === 'public' || tool.auth === 'customer',
      );
    }

    if (ctx.role === 'ADMIN') {
      if (ctx.app === 'ADMIN') {
        return allTools;
      }
      if (ctx.app === 'USER') {
        return allTools.filter((tool) => tool.auth !== 'admin');
      }
      return allTools.filter((tool) => tool.auth !== 'admin');
    }

    return [];
  }

  forCtx(ctx: ToolContext): AgentToolDef[] {
    return this.forContext(ctx);
  }
}
