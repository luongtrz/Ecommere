import { Provider } from '@nestjs/common';
import type { BaseCheckpointSaver } from '@langchain/langgraph-checkpoint';
import { readAgentConfig, AgentConfig } from './agent.config';
import { createChatModel } from './llm.factory';
import { createPostgresCheckpointer } from './checkpointer.provider';
import { buildAgentGraph, AgentModelLike } from './agent.graph';
import { AgentRunner } from './agent.runner';
import { ThreadService } from './thread.service';
import { AuditService } from './audit.service';
import { ToolRegistry } from '../tools/tool.registry';
import { buildAdminToolRegistry } from '../tools/admin-registry.factory';
import { AdminService } from '../../admin/admin.service';
import { ReportsService } from '../../admin/reports.service';
import { CustomersService } from '../../admin/customers.service';
import { OrdersService } from '../../orders/orders.service';
import { ProductsService } from '../../products/products.service';
import { CategoriesService } from '../../categories/categories.service';
import { CouponsService } from '../../coupons/coupons.service';
import { ReferralsService } from '../../referrals/referrals.service';
import { ReviewsService } from '../../reviews/reviews.service';
import { InventoryService } from '../../inventory/inventory.service';
import { UploadsService } from '../../uploads/uploads.service';

export const AGENT_CONFIG = 'AGENT_CONFIG';
export const AGENT_CHECKPOINTER = 'AGENT_CHECKPOINTER';
export const AGENT_GRAPH = 'AGENT_GRAPH';
export const ADMIN_TOOL_REGISTRY = 'ADMIN_TOOL_REGISTRY';

export function buildModel(config: AgentConfig): AgentModelLike {
  if (!config.apiKey) {
    return {
      bindTools: () => ({
        invoke: async () => {
          throw new Error('OPENAI_API_KEY is not configured');
        },
      }),
    };
  }
  return createChatModel(config);
}

export const adminAgentProviders: Provider[] = [
  {
    provide: AGENT_CONFIG,
    useFactory: () => readAgentConfig(process.env),
  },
  ThreadService,
  AuditService,
  {
    provide: ADMIN_TOOL_REGISTRY,
    useFactory: (
      admin: AdminService,
      reports: ReportsService,
      customers: CustomersService,
      orders: OrdersService,
      products: ProductsService,
      categories: CategoriesService,
      coupons: CouponsService,
      referrals: ReferralsService,
      reviews: ReviewsService,
      inventory: InventoryService,
      uploads: UploadsService,
    ) =>
      buildAdminToolRegistry({
        admin,
        reports,
        customers,
        orders,
        products,
        categories,
        coupons,
        referrals,
        reviews,
        inventory,
        uploads,
      }),
    inject: [
      AdminService,
      ReportsService,
      CustomersService,
      OrdersService,
      ProductsService,
      CategoriesService,
      CouponsService,
      ReferralsService,
      ReviewsService,
      InventoryService,
      UploadsService,
    ],
  },
  {
    provide: AGENT_CHECKPOINTER,
    useFactory: (config: AgentConfig) =>
      createPostgresCheckpointer(
        process.env.DATABASE_URL as string,
        config.checkpointSchema,
      ),
    inject: [AGENT_CONFIG],
  },
  {
    provide: AGENT_GRAPH,
    useFactory: (
      config: AgentConfig,
      checkpointer: BaseCheckpointSaver,
      audit: AuditService,
      registry: ToolRegistry,
    ) =>
      buildAgentGraph({
        model: buildModel(config),
        registry,
        checkpointer,
        audit,
        limits: {
          maxToolCallsPerTurn: config.maxToolCallsPerTurn,
          historyMaxMessages: config.historyMaxMessages,
        },
      }),
    inject: [
      AGENT_CONFIG,
      AGENT_CHECKPOINTER,
      AuditService,
      ADMIN_TOOL_REGISTRY,
    ],
  },
  {
    provide: AgentRunner,
    useFactory: (
      graph: any,
      registry: ToolRegistry,
      threads: ThreadService,
      config: AgentConfig,
    ) =>
      new AgentRunner({
        graph,
        registry,
        threads,
        limits: {
          maxSteps: config.maxSteps,
          timeoutMs: config.timeoutMs,
        },
      }),
    inject: [AGENT_GRAPH, ADMIN_TOOL_REGISTRY, ThreadService, AGENT_CONFIG],
  },
];

export { ThreadService, AuditService, AgentRunner };
