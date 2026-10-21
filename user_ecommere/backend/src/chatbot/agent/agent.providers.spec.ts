import { Test, TestingModule } from '@nestjs/testing';
import {
  agentProviders,
  buildModel,
  AGENT_CONFIG,
  AGENT_CHECKPOINTER,
  AGENT_GRAPH,
  USER_TOOL_REGISTRY,
  ThreadService,
  AuditService,
  AgentRunner,
} from './agent.providers';
import { AgentConfig } from './agent.config';
import * as llmFactory from './llm.factory';
import * as checkpointerProvider from './checkpointer.provider';
import * as agentGraph from './agent.graph';
import * as userRegistryFactory from '../tools/user-registry.factory';
import { ToolRegistry } from '../tools/tool.registry';
import { CheckpointRetentionService } from '../checkpoint-retention.service';
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

describe('agentProviders', () => {
  const originalEnv = { ...process.env };

  const mockConfig: AgentConfig = {
    apiKey: null,
    baseURL: null,
    model: 'gpt-4.1-mini',
    temperature: 0.2,
    maxOutputTokens: 800,
    timeoutMs: 90000,
    maxSteps: 24,
    maxToolCallsPerTurn: 6,
    historyMaxMessages: 30,
    checkpointSchema: 'test_schema',
  };

  const getProvider = (token: any): any => {
    return agentProviders.find((p: any) => p && p.provide === token);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('exported tokens and services', () => {
    it('exports expected token strings', () => {
      expect(AGENT_CONFIG).toBe('AGENT_CONFIG');
      expect(AGENT_CHECKPOINTER).toBe('AGENT_CHECKPOINTER');
      expect(AGENT_GRAPH).toBe('AGENT_GRAPH');
      expect(USER_TOOL_REGISTRY).toBe('USER_TOOL_REGISTRY');
    });

    it('includes class providers in agentProviders array', () => {
      expect(agentProviders).toContain(ThreadService);
      expect(agentProviders).toContain(AuditService);
      expect(agentProviders).toContain(CheckpointRetentionService);
    });
  });

  describe('buildModel', () => {
    it('returns fallback model with bindTools and invoke when apiKey is not configured', async () => {
      const model = buildModel({ ...mockConfig, apiKey: null });

      expect(model).toBeDefined();
      expect(typeof model.bindTools).toBe('function');

      const boundModel = model.bindTools([]);
      expect(boundModel).toBeDefined();
      expect(typeof boundModel.invoke).toBe('function');

      await expect(boundModel.invoke([])).rejects.toThrow(
        'OPENAI_API_KEY is not configured',
      );
    });

    it('returns fallback model when apiKey is an empty string', async () => {
      const model = buildModel({ ...mockConfig, apiKey: '' as any });
      const boundModel = model.bindTools([{ name: 'test_tool' }]);

      await expect(boundModel.invoke([])).rejects.toThrow(
        'OPENAI_API_KEY is not configured',
      );
    });

    it('calls createChatModel when apiKey is configured', () => {
      const configWithKey: AgentConfig = {
        ...mockConfig,
        apiKey: 'sk-test-valid-key',
      };
      const mockChatModel = {
        bindTools: jest.fn(),
      } as any;

      const createChatModelSpy = jest
        .spyOn(llmFactory, 'createChatModel')
        .mockReturnValue(mockChatModel);

      const result = buildModel(configWithKey);

      expect(createChatModelSpy).toHaveBeenCalledWith(configWithKey);
      expect(result).toBe(mockChatModel);
    });
  });

  describe('AGENT_CONFIG factory provider', () => {
    it('reads agent configuration from process.env', () => {
      process.env.OPENAI_API_KEY = 'sk-from-env';
      process.env.AGENT_MODEL = 'gpt-4o';

      const provider = getProvider(AGENT_CONFIG);
      expect(provider).toBeDefined();

      const config = provider.useFactory();
      expect(config.apiKey).toBe('sk-from-env');
      expect(config.model).toBe('gpt-4o');
      expect(config.temperature).toBe(0.2);
    });
  });

  describe('USER_TOOL_REGISTRY factory provider', () => {
    it('has the expected inject dependencies', () => {
      const provider = getProvider(USER_TOOL_REGISTRY);
      expect(provider.inject).toEqual([
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
      ]);
    });

    it('calls buildUserToolRegistry with provided services and returns a ToolRegistry', () => {
      const provider = getProvider(USER_TOOL_REGISTRY);
      const mockRegistry = new ToolRegistry([]);
      const spy = jest
        .spyOn(userRegistryFactory, 'buildUserToolRegistry')
        .mockReturnValue(mockRegistry);

      const mockProducts = {} as ProductsService;
      const mockCategories = {} as CategoriesService;
      const mockRetrieval = {} as ChatbotRetrievalService;
      const mockUsers = {} as UsersService;
      const mockReferrals = {} as ReferralsService;
      const mockOrders = {} as OrdersService;
      const mockReviews = {} as ReviewsService;
      const mockCoupons = {} as CouponsService;
      const mockPrisma = {} as PrismaService;
      const mockCart = {} as CartService;

      const result = provider.useFactory(
        mockProducts,
        mockCategories,
        mockRetrieval,
        mockUsers,
        mockReferrals,
        mockOrders,
        mockReviews,
        mockCoupons,
        mockPrisma,
        mockCart,
      );

      expect(spy).toHaveBeenCalledWith({
        products: mockProducts,
        categories: mockCategories,
        retrieval: mockRetrieval,
        users: mockUsers,
        referrals: mockReferrals,
        orders: mockOrders,
        reviews: mockReviews,
        coupons: mockCoupons,
        prisma: mockPrisma,
        cart: mockCart,
      });
      expect(result).toBe(mockRegistry);
    });
  });

  describe('AGENT_CHECKPOINTER factory provider', () => {
    it('has the expected inject dependencies', () => {
      const provider = getProvider(AGENT_CHECKPOINTER);
      expect(provider.inject).toEqual([AGENT_CONFIG]);
    });

    it('creates Postgres checkpointer using DATABASE_URL and config.checkpointSchema', async () => {
      const provider = getProvider(AGENT_CHECKPOINTER);
      const mockSaver = { setup: jest.fn() } as any;

      const spy = jest
        .spyOn(checkpointerProvider, 'createPostgresCheckpointer')
        .mockResolvedValue(mockSaver);

      const result = await provider.useFactory({
        ...mockConfig,
        checkpointSchema: 'custom_checkpoints',
      });

      expect(spy).toHaveBeenCalledWith(
        'postgresql://user:pass@localhost:5432/testdb',
        'custom_checkpoints',
      );
      expect(result).toBe(mockSaver);
    });
  });

  describe('AGENT_GRAPH factory provider', () => {
    it('has the expected inject dependencies', () => {
      const provider = getProvider(AGENT_GRAPH);
      expect(provider.inject).toEqual([
        AGENT_CONFIG,
        AGENT_CHECKPOINTER,
        AuditService,
        USER_TOOL_REGISTRY,
      ]);
    });

    it('builds the agent graph using provided config, checkpointer, audit, and registry', () => {
      const provider = getProvider(AGENT_GRAPH);
      const mockCheckpointer = {} as any;
      const mockAudit = {} as any;
      const mockRegistry = new ToolRegistry([]);
      const mockCompiledGraph = { invoke: jest.fn() } as any;

      const spy = jest
        .spyOn(agentGraph, 'buildAgentGraph')
        .mockReturnValue(mockCompiledGraph);

      const result = provider.useFactory(
        mockConfig,
        mockCheckpointer,
        mockAudit,
        mockRegistry,
      );

      expect(spy).toHaveBeenCalledWith({
        model: expect.objectContaining({
          bindTools: expect.any(Function),
        }),
        registry: mockRegistry,
        checkpointer: mockCheckpointer,
        audit: mockAudit,
        limits: {
          maxToolCallsPerTurn: mockConfig.maxToolCallsPerTurn,
          historyMaxMessages: mockConfig.historyMaxMessages,
        },
      });
      expect(result).toBe(mockCompiledGraph);
    });
  });

  describe('AgentRunner factory provider', () => {
    it('has the expected inject dependencies', () => {
      const provider = getProvider(AgentRunner);
      expect(provider.inject).toEqual([
        AGENT_GRAPH,
        USER_TOOL_REGISTRY,
        ThreadService,
        AGENT_CONFIG,
      ]);
    });

    it('instantiates and returns an AgentRunner with configured limits', () => {
      const provider = getProvider(AgentRunner);
      const mockGraph = {} as any;
      const mockRegistry = new ToolRegistry([]);
      const mockThreads = {} as ThreadService;

      const runner = provider.useFactory(
        mockGraph,
        mockRegistry,
        mockThreads,
        mockConfig,
      );

      expect(runner).toBeInstanceOf(AgentRunner);
    });
  });

  describe('TestingModule integration', () => {
    it('compiles and resolves all providers through NestJS DI without hitting real DB or network', async () => {
      const mockCheckpointer = { setup: jest.fn() };
      jest
        .spyOn(checkpointerProvider, 'createPostgresCheckpointer')
        .mockResolvedValue(mockCheckpointer as any);

      const mockPrisma = {
        agentThread: {
          create: jest.fn(),
          findUnique: jest.fn(),
        },
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          ...agentProviders,
          { provide: ProductsService, useValue: {} },
          { provide: CategoriesService, useValue: {} },
          { provide: ChatbotRetrievalService, useValue: {} },
          { provide: UsersService, useValue: {} },
          { provide: ReferralsService, useValue: {} },
          { provide: OrdersService, useValue: {} },
          { provide: ReviewsService, useValue: {} },
          { provide: CouponsService, useValue: {} },
          { provide: PrismaService, useValue: mockPrisma },
          { provide: CartService, useValue: {} },
        ],
      }).compile();

      const resolvedConfig = moduleRef.get(AGENT_CONFIG);
      expect(resolvedConfig).toBeDefined();

      const resolvedRegistry = moduleRef.get(USER_TOOL_REGISTRY);
      expect(resolvedRegistry).toBeInstanceOf(ToolRegistry);

      const resolvedCheckpointer = moduleRef.get(AGENT_CHECKPOINTER);
      expect(resolvedCheckpointer).toBe(mockCheckpointer);

      const resolvedGraph = moduleRef.get(AGENT_GRAPH);
      expect(resolvedGraph).toBeDefined();

      const resolvedRunner = moduleRef.get<AgentRunner>(AgentRunner);
      expect(resolvedRunner).toBeInstanceOf(AgentRunner);

      const resolvedThread = moduleRef.get<ThreadService>(ThreadService);
      expect(resolvedThread).toBeInstanceOf(ThreadService);

      const resolvedAudit = moduleRef.get<AuditService>(AuditService);
      expect(resolvedAudit).toBeInstanceOf(AuditService);

      const resolvedRetention = moduleRef.get<CheckpointRetentionService>(
        CheckpointRetentionService,
      );
      expect(resolvedRetention).toBeInstanceOf(CheckpointRetentionService);

      await moduleRef.close();
    });
  });
});
