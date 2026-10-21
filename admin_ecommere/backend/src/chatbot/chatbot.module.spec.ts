import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ChatbotModule } from './chatbot.module';
import { AdminChatbotController } from './chatbot.controller';
import {
  adminAgentProviders,
  AGENT_CONFIG,
  AGENT_CHECKPOINTER,
  AGENT_GRAPH,
  ADMIN_TOOL_REGISTRY,
  ThreadService,
  AuditService,
  AgentRunner,
} from './agent/admin.providers';
import { PrismaService } from '@/prisma/prisma.service';
import { AdminModule } from '../admin/admin.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { CouponsModule } from '../coupons/coupons.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { InventoryModule } from '../inventory/inventory.module';
import { UploadsModule } from '../uploads/uploads.module';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      destroy: jest.fn(),
      upload_stream: jest.fn(),
    },
  },
}));

jest.mock('./agent/checkpointer.provider', () => ({
  createPostgresCheckpointer: jest.fn().mockResolvedValue({
    setup: jest.fn().mockResolvedValue(undefined),
    deleteThread: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('ChatbotModule', () => {
  let moduleRef: TestingModule;

  const mockPrismaService = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    chatThread: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    chatMessage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    toolAudit: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockCheckpointer = {
    setup: jest.fn().mockResolvedValue(undefined),
    deleteThread: jest.fn().mockResolvedValue(undefined),
  };

  const mockGraph = {
    invoke: jest.fn(),
  };

  const mockAgentRunner = {
    run: jest.fn(),
    assertResumable: jest.fn(),
    readTranscript: jest.fn(),
    deleteCheckpoints: jest.fn(),
    isThreadRunning: jest.fn().mockReturnValue(false),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              CLOUDINARY_CLOUD_NAME: 'test',
              CLOUDINARY_API_KEY: 'test',
              CLOUDINARY_API_SECRET: 'test',
            }),
          ],
        }),
        ChatbotModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(AGENT_CHECKPOINTER)
      .useValue(mockCheckpointer)
      .overrideProvider(AGENT_GRAPH)
      .useValue(mockGraph)
      .overrideProvider(AgentRunner)
      .useValue(mockAgentRunner)
      .compile();
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('can be instantiated directly', () => {
    const chatbotModule = new ChatbotModule();
    expect(chatbotModule).toBeDefined();
    expect(chatbotModule).toBeInstanceOf(ChatbotModule);
  });

  it('compiles the module and resolves ChatbotModule instance', () => {
    const chatbotModule = moduleRef.get<ChatbotModule>(ChatbotModule);
    expect(chatbotModule).toBeDefined();
    expect(chatbotModule).toBeInstanceOf(ChatbotModule);
  });

  it('resolves AdminChatbotController from the module', () => {
    const controller = moduleRef.get<AdminChatbotController>(
      AdminChatbotController,
    );
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AdminChatbotController);
  });

  it('resolves AGENT_CONFIG provider', () => {
    const config = moduleRef.get(AGENT_CONFIG);
    expect(config).toBeDefined();
    expect(config).toHaveProperty('model');
    expect(config).toHaveProperty('checkpointSchema');
  });

  it('resolves ThreadService provider', () => {
    const threadService = moduleRef.get<ThreadService>(ThreadService);
    expect(threadService).toBeDefined();
    expect(threadService).toBeInstanceOf(ThreadService);
  });

  it('resolves AuditService provider', () => {
    const auditService = moduleRef.get<AuditService>(AuditService);
    expect(auditService).toBeDefined();
    expect(auditService).toBeInstanceOf(AuditService);
  });

  it('resolves ADMIN_TOOL_REGISTRY provider', () => {
    const registry = moduleRef.get(ADMIN_TOOL_REGISTRY);
    expect(registry).toBeDefined();
    expect(typeof registry.forContext).toBe('function');
  });

  it('resolves overridden AGENT_CHECKPOINTER and AgentRunner', () => {
    const checkpointer = moduleRef.get(AGENT_CHECKPOINTER);
    expect(checkpointer).toBe(mockCheckpointer);

    const runner = moduleRef.get<AgentRunner>(AgentRunner);
    expect(runner).toBe(mockAgentRunner);
  });

  describe('Module metadata decoration', () => {
    it('declares all expected module imports', () => {
      const imports = Reflect.getMetadata('imports', ChatbotModule);
      expect(imports).toEqual([
        AdminModule,
        OrdersModule,
        ProductsModule,
        CategoriesModule,
        CouponsModule,
        ReferralsModule,
        ReviewsModule,
        InventoryModule,
        UploadsModule,
      ]);
    });

    it('declares AdminChatbotController as the controller', () => {
      const controllers = Reflect.getMetadata('controllers', ChatbotModule);
      expect(controllers).toEqual([AdminChatbotController]);
    });

    it('declares adminAgentProviders as providers', () => {
      const providers = Reflect.getMetadata('providers', ChatbotModule);
      expect(providers).toEqual(adminAgentProviders);
    });
  });
});
