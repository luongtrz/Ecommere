import { z } from 'zod';

export type ToolRisk = 'READ' | 'WRITE' | 'SENSITIVE' | 'DESTRUCTIVE';
export type ToolAuth = 'public' | 'customer' | 'admin';
export type AgentRole = 'GUEST' | 'CUSTOMER' | 'ADMIN'; // GUEST = no token. Do not reuse the Prisma Role enum for guests.
export type AgentApp = 'USER' | 'ADMIN';

export interface UiAction {
  type: string;
  payload: Record<string, unknown>;
}

export interface ToolContext {
  userId: string | null;
  role: AgentRole;
  app: AgentApp;
  threadId: string;
  clientContext?: Record<string, unknown>;
}

export interface AgentToolDef<A = any> {
  name: string; // snake_case, unique across the registry
  domain: string; // e.g. 'catalog', 'orders'
  description: string; // shown to the model: short, factual, mention the gotchas that matter
  schema: z.ZodObject<any>; // zod v3 object schema the model sees; must be .strict()
  auth: ToolAuth;
  risk: ToolRisk;
  handler: (args: A, ctx: ToolContext) => Promise<unknown>;
  summarize: (args: A) => string; // one Vietnamese line, used on confirmation cards
  project?: (result: unknown) => unknown; // optional trimming before the result goes back to the model
  uiAction?: (result: unknown) => UiAction | undefined;
}
