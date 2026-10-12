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
import { buildUserToolRegistry } from '../tools/user-registry.factory';
import { ProductsService } from '../../products/products.service';
import { CategoriesService } from '../../categories/categories.service';
import { ChatbotRetrievalService } from '../chatbot-retrieval.service';
import { UsersService } from '../../users/users.service';
import { ReferralsService } from '../../referrals/referrals.service';
import { OrdersService } from '../../orders/orders.service';
import { ReviewsService } from '../../reviews/reviews.service';
import { CouponsService } from '../../coupons/coupons.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from '../../cart/cart.service';

export const AGENT_CONFIG = 'AGENT_CONFIG';
export const AGENT_CHECKPOINTER = 'AGENT_CHECKPOINTER';
export const AGENT_GRAPH = 'AGENT_GRAPH';
export const USER_TOOL_REGISTRY = 'USER_TOOL_REGISTRY';

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

export const agentProviders: Provider[] = [
  {
    provide: AGENT_CONFIG,
    useFactory: () => readAgentConfig(process.env),
  },
  ThreadService,
  AuditService,
  {
    provide: USER_TOOL_REGISTRY,
    useFactory: (
      products: ProductsService,
      categories: CategoriesService,
      retrieval: ChatbotRetrievalService,
      users: UsersService,
      referrals: ReferralsService,
      orders: OrdersService,
      reviews: ReviewsService,
      coupons: CouponsService,
      prisma: PrismaService,
      cart: CartService,
    ) =>
      buildUserToolRegistry({
        products,
        categories,
        retrieval,
        users,
        referrals,
        orders,
        reviews,
        coupons,
        prisma,
        cart,
      }),
    inject: [
      ProductsService,
      CategoriesService,
      ChatbotRetrievalService,
      UsersService,
      ReferralsService,
      OrdersService,
      ReviewsService,
      CouponsService,
      PrismaService,
      CartService,
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
      USER_TOOL_REGISTRY,
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
    inject: [
      AGENT_GRAPH,
      USER_TOOL_REGISTRY,
      ThreadService,
      AGENT_CONFIG,
    ],
  },
];

export { ThreadService, AuditService, AgentRunner };
