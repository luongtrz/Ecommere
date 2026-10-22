import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MemorySaver } from '@langchain/langgraph';
import { ChatbotModule } from './chatbot.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotRetrievalService } from './chatbot-retrieval.service';
import { CheckpointRetentionService } from './checkpoint-retention.service';
import {
  AgentRunner,
  ThreadService,
  AuditService,
  AGENT_CONFIG,
  AGENT_CHECKPOINTER,
  AGENT_GRAPH,
  USER_TOOL_REGISTRY,
} from './agent/agent.providers';
import { PrismaService } from '@/prisma/prisma.service';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { OrdersModule } from '../orders/orders.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { CouponsModule } from '../coupons/coupons.module';
import { CartModule } from '../cart/cart.module';
import { OptionalJwtAuthGuard } from './guards/optional-jwt.guard';

const mockPrismaService = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  category: { findMany: jest.fn().mockResolvedValue([]) },
  product: { findMany: jest.fn().mockResolvedValue([]) },
  user: { findUnique: jest.fn().mockResolvedValue(null) },
  order: { findMany: jest.fn().mockResolvedValue([]) },
  review: { findMany: jest.fn().mockResolvedValue([]) },
  coupon: { findMany: jest.fn().mockResolvedValue([]) },
  cart: { findMany: jest.fn().mockResolvedValue([]) },
  referral: { findMany: jest.fn().mockResolvedValue([]) },
};

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useValue: mockPrismaService,
    },
  ],
  exports: [PrismaService],
})
class MockPrismaModule {}

describe('ChatbotModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();

    moduleRef = await Test.createTestingModule({
      imports: [MockPrismaModule, ChatbotModule],
    })
      .overrideProvider(AGENT_CHECKPOINTER)
      .useValue(new MemorySaver())
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('should compile the module and instantiate ChatbotModule', () => {
    const chatbotModule = moduleRef.get<ChatbotModule>(ChatbotModule);
    expect(chatbotModule).toBeDefined();
    expect(chatbotModule).toBeInstanceOf(ChatbotModule);
  });

  it('should resolve ChatbotController', () => {
    const controller = moduleRef.get<ChatbotController>(ChatbotController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(ChatbotController);
  });

  it('should resolve ChatbotRetrievalService', () => {
    const service = moduleRef.get<ChatbotRetrievalService>(
      ChatbotRetrievalService,
    );
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ChatbotRetrievalService);
  });

  it('should resolve CheckpointRetentionService and export it', () => {
    const retentionService = moduleRef.get<CheckpointRetentionService>(
      CheckpointRetentionService,
    );
    expect(retentionService).toBeDefined();
    expect(retentionService).toBeInstanceOf(CheckpointRetentionService);
  });

  it('should resolve AgentRunner', () => {
    const runner = moduleRef.get<AgentRunner>(AgentRunner);
    expect(runner).toBeDefined();
    expect(runner).toBeInstanceOf(AgentRunner);
  });

  it('should resolve ThreadService and AuditService', () => {
    const threadService = moduleRef.get<ThreadService>(ThreadService);
    expect(threadService).toBeDefined();
    expect(threadService).toBeInstanceOf(ThreadService);

    const auditService = moduleRef.get<AuditService>(AuditService);
    expect(auditService).toBeDefined();
    expect(auditService).toBeInstanceOf(AuditService);
  });

  it('should resolve injection tokens: AGENT_CONFIG, USER_TOOL_REGISTRY, AGENT_GRAPH, AGENT_CHECKPOINTER', () => {
    const config = moduleRef.get(AGENT_CONFIG);
    expect(config).toBeDefined();

    const registry = moduleRef.get(USER_TOOL_REGISTRY);
    expect(registry).toBeDefined();

    const graph = moduleRef.get(AGENT_GRAPH);
    expect(graph).toBeDefined();

    const checkpointer = moduleRef.get(AGENT_CHECKPOINTER);
    expect(checkpointer).toBeDefined();
  });

  it('should have the expected Module metadata definition', () => {
    const imports = Reflect.getMetadata('imports', ChatbotModule);
    expect(imports).toEqual([
      ProductsModule,
      CategoriesModule,
      UsersModule,
      ReferralsModule,
      OrdersModule,
      ReviewsModule,
      CouponsModule,
      CartModule,
    ]);

    const controllers = Reflect.getMetadata('controllers', ChatbotModule);
    expect(controllers).toEqual([ChatbotController]);

    const providers = Reflect.getMetadata('providers', ChatbotModule);
    expect(providers).toContain(ChatbotRetrievalService);
    expect(providers).toContain(CheckpointRetentionService);

    const exportsList = Reflect.getMetadata('exports', ChatbotModule);
    expect(exportsList).toEqual([CheckpointRetentionService]);
  });
});
