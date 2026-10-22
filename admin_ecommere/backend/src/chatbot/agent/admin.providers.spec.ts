import { Test, TestingModule } from '@nestjs/testing';
import {
  AGENT_CONFIG,
  AGENT_CHECKPOINTER,
  AGENT_GRAPH,
  ADMIN_TOOL_REGISTRY,
  buildModel,
  adminAgentProviders,
  ThreadService,
  AuditService,
  AgentRunner,
} from './admin.providers';
import { AgentConfig, readAgentConfig } from './agent.config';
import { createChatModel } from './llm.factory';
import { createPostgresCheckpointer } from './checkpointer.provider';
import { buildAgentGraph } from './agent.graph';
import { buildAdminToolRegistry } from '../tools/admin-registry.factory';
import { ToolRegistry } from '../tools/tool.registry';
import { PrismaService } from '@/prisma/prisma.service';
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

jest.mock('./llm.factory', () => ({
  createChatModel: jest.fn(),
}));

jest.mock('./checkpointer.provider', () => ({
  createPostgresCheckpointer: jest.fn(),
}));

jest.mock('./agent.graph', () => ({
  buildAgentGraph: jest.fn(),
}));

jest.mock('../tools/admin-registry.factory', () => ({
  buildAdminToolRegistry: jest.fn(),
}));

jest.mock('./agent.config', () => ({
  readAgentConfig: jest.fn(),
}));

describe('AdminProviders', () => {
  const mockConfig: AgentConfig = {
    apiKey: 'test-openai-key',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    temperature: 0.2,
    maxOutputTokens: 800,
    timeoutMs: 90000,
    maxSteps: 24,
    maxToolCallsPerTurn: 6,
    historyMaxMessages: 30,
    checkpointSchema: 'agent_schema',
  };

  const mockConfigNoKey: AgentConfig = {
    ...mockConfig,
    apiKey: null,
  };

  const mockChatModel = {
    bindTools: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({ content: 'Mock response' }),
    }),
  };

  const mockCheckpointer = {
    setup: jest.fn().mockResolvedValue(undefined),
  };

  const mockGraph = {
    stream: jest.fn(),
    getState: jest.fn(),
  };

  const mockToolRegistry = new ToolRegistry([]);

  beforeEach(() => {
    jest.clearAllMocks();
    (readAgentConfig as jest.Mock).mockReturnValue(mockConfig);
    (createChatModel as jest.Mock).mockReturnValue(mockChatModel);
    (createPostgresCheckpointer as jest.Mock).mockReturnValue(mockCheckpointer);
    (buildAgentGraph as jest.Mock).mockReturnValue(mockGraph);
    (buildAdminToolRegistry as jest.Mock).mockReturnValue(mockToolRegistry);
  });

  describe('Tokens and Re-exports', () => {
    it('should export expected injection tokens', () => {
      expect(AGENT_CONFIG).toBe('AGENT_CONFIG');
      expect(AGENT_CHECKPOINTER).toBe('AGENT_CHECKPOINTER');
      expect(AGENT_GRAPH).toBe('AGENT_GRAPH');
      expect(ADMIN_TOOL_REGISTRY).toBe('ADMIN_TOOL_REGISTRY');
    });

    it('should re-export services and runner', () => {
      expect(ThreadService).toBeDefined();
      expect(AuditService).toBeDefined();
      expect(AgentRunner).toBeDefined();
    });
  });

  describe('buildModel', () => {
    it('should create and return chat model when apiKey is configured', () => {
      const model = buildModel(mockConfig);

      expect(createChatModel).toHaveBeenCalledWith(mockConfig);
      expect(model).toBe(mockChatModel);
    });

    it('should return fallback stub model when apiKey is null or empty', async () => {
      const model = buildModel(mockConfigNoKey);

      expect(createChatModel).not.toHaveBeenCalled();
      expect(model).toBeDefined();
      expect(typeof model.bindTools).toBe('function');

      const bound = model.bindTools([]);
      expect(typeof bound.invoke).toBe('function');

      await expect(bound.invoke([])).rejects.toThrow(Error);
      await expect(bound.invoke([])).rejects.toThrow(
        'OPENAI_API_KEY is not configured',
      );
    });
  });

  describe('adminAgentProviders factories', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = {
        ...originalEnv,
        DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb',
      };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('AGENT_CONFIG factory should call readAgentConfig with process.env', () => {
      const provider = adminAgentProviders.find(
        (p: any) => p.provide === AGENT_CONFIG,
      ) as any;

      expect(provider).toBeDefined();
      const config = provider.useFactory();

      expect(readAgentConfig).toHaveBeenCalledWith(process.env);
      expect(config).toEqual(mockConfig);
    });

    it('ADMIN_TOOL_REGISTRY factory should inject all 11 services and call buildAdminToolRegistry', () => {
      const provider = adminAgentProviders.find(
        (p: any) => p.provide === ADMIN_TOOL_REGISTRY,
      ) as any;

      expect(provider).toBeDefined();
      expect(provider.inject).toEqual([
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
      ]);

      const mockAdmin = {} as AdminService;
      const mockReports = {} as ReportsService;
      const mockCustomers = {} as CustomersService;
      const mockOrders = {} as OrdersService;
      const mockProducts = {} as ProductsService;
      const mockCategories = {} as CategoriesService;
      const mockCoupons = {} as CouponsService;
      const mockReferrals = {} as ReferralsService;
      const mockReviews = {} as ReviewsService;
      const mockInventory = {} as InventoryService;
      const mockUploads = {} as UploadsService;

      const registry = provider.useFactory(
        mockAdmin,
        mockReports,
        mockCustomers,
        mockOrders,
        mockProducts,
        mockCategories,
        mockCoupons,
        mockReferrals,
        mockReviews,
        mockInventory,
        mockUploads,
      );

      expect(buildAdminToolRegistry).toHaveBeenCalledWith({
        admin: mockAdmin,
        reports: mockReports,
        customers: mockCustomers,
        orders: mockOrders,
        products: mockProducts,
        categories: mockCategories,
        coupons: mockCoupons,
        referrals: mockReferrals,
        reviews: mockReviews,
        inventory: mockInventory,
        uploads: mockUploads,
      });
      expect(registry).toBe(mockToolRegistry);
    });

    it('AGENT_CHECKPOINTER factory should inject AGENT_CONFIG and call createPostgresCheckpointer', () => {
      const provider = adminAgentProviders.find(
        (p: any) => p.provide === AGENT_CHECKPOINTER,
      ) as any;

      expect(provider).toBeDefined();
      expect(provider.inject).toEqual([AGENT_CONFIG]);

      const checkpointer = provider.useFactory(mockConfig);

      expect(createPostgresCheckpointer).toHaveBeenCalledWith(
        process.env.DATABASE_URL,
        mockConfig.checkpointSchema,
      );
      expect(checkpointer).toBe(mockCheckpointer);
    });

    it('AGENT_GRAPH factory should inject dependencies and call buildAgentGraph with limits and model', () => {
      const provider = adminAgentProviders.find(
        (p: any) => p.provide === AGENT_GRAPH,
      ) as any;

      expect(provider).toBeDefined();
      expect(provider.inject).toEqual([
        AGENT_CONFIG,
        AGENT_CHECKPOINTER,
        AuditService,
        ADMIN_TOOL_REGISTRY,
      ]);

      const mockAudit = {} as AuditService;
      const graph = provider.useFactory(
        mockConfig,
        mockCheckpointer as any,
        mockAudit,
        mockToolRegistry,
      );

      expect(createChatModel).toHaveBeenCalledWith(mockConfig);
      expect(buildAgentGraph).toHaveBeenCalledWith({
        model: mockChatModel,
        registry: mockToolRegistry,
        checkpointer: mockCheckpointer,
        audit: mockAudit,
        limits: {
          maxToolCallsPerTurn: mockConfig.maxToolCallsPerTurn,
          historyMaxMessages: mockConfig.historyMaxMessages,
        },
      });
      expect(graph).toBe(mockGraph);
    });

    it('AGENT_GRAPH factory should pass stub model to buildAgentGraph when apiKey is missing', () => {
      const provider = adminAgentProviders.find(
        (p: any) => p.provide === AGENT_GRAPH,
      ) as any;

      const mockAudit = {} as AuditService;
      provider.useFactory(
        mockConfigNoKey,
        mockCheckpointer as any,
        mockAudit,
        mockToolRegistry,
      );

      expect(buildAgentGraph).toHaveBeenCalledWith(
        expect.objectContaining({
          registry: mockToolRegistry,
          checkpointer: mockCheckpointer,
          audit: mockAudit,
          limits: {
            maxToolCallsPerTurn: mockConfigNoKey.maxToolCallsPerTurn,
            historyMaxMessages: mockConfigNoKey.historyMaxMessages,
          },
        }),
      );
    });

    it('AgentRunner factory should inject dependencies and instantiate AgentRunner with limits', () => {
      const provider = adminAgentProviders.find(
        (p: any) => p.provide === AgentRunner,
      ) as any;

      expect(provider).toBeDefined();
      expect(provider.inject).toEqual([
        AGENT_GRAPH,
        ADMIN_TOOL_REGISTRY,
        ThreadService,
        AGENT_CONFIG,
      ]);

      const mockThreads = {
        recordUsage: jest.fn(),
        setTitleIfEmpty: jest.fn(),
      } as unknown as ThreadService;

      const runner = provider.useFactory(
        mockGraph,
        mockToolRegistry,
        mockThreads,
        mockConfig,
      );

      expect(runner).toBeInstanceOf(AgentRunner);
    });
  });

  describe('NestJS TestingModule Integration', () => {
    let moduleRef: TestingModule;

    const mockPrismaService = {
      agentThread: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      agentToolLog: {
        create: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    beforeEach(async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

      moduleRef = await Test.createTestingModule({
        providers: [
          ...adminAgentProviders,
          { provide: PrismaService, useValue: mockPrismaService },
          { provide: AdminService, useValue: {} },
          { provide: ReportsService, useValue: {} },
          { provide: CustomersService, useValue: {} },
          { provide: OrdersService, useValue: {} },
          { provide: ProductsService, useValue: {} },
          { provide: CategoriesService, useValue: {} },
          { provide: CouponsService, useValue: {} },
          { provide: ReferralsService, useValue: {} },
          { provide: ReviewsService, useValue: {} },
          { provide: InventoryService, useValue: {} },
          { provide: UploadsService, useValue: {} },
        ],
      }).compile();
    });

    it('should compile and resolve all agent providers correctly', () => {
      const config = moduleRef.get<AgentConfig>(AGENT_CONFIG);
      expect(config).toEqual(mockConfig);

      const registry = moduleRef.get<ToolRegistry>(ADMIN_TOOL_REGISTRY);
      expect(registry).toBe(mockToolRegistry);

      const checkpointer = moduleRef.get(AGENT_CHECKPOINTER);
      expect(checkpointer).toBe(mockCheckpointer);

      const graph = moduleRef.get(AGENT_GRAPH);
      expect(graph).toBe(mockGraph);

      const threadService = moduleRef.get<ThreadService>(ThreadService);
      expect(threadService).toBeInstanceOf(ThreadService);

      const auditService = moduleRef.get<AuditService>(AuditService);
      expect(auditService).toBeInstanceOf(AuditService);

      const runner = moduleRef.get<AgentRunner>(AgentRunner);
      expect(runner).toBeInstanceOf(AgentRunner);
    });
  });
});
