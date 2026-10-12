import { MemorySaver } from '@langchain/langgraph';
import {
  AIMessage,
  AIMessageChunk,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { z } from 'zod';
import {
  AgentRunner,
  AgentBusyError,
  type AgentRunnerDeps,
} from './agent.runner';
import type { AgentStreamEvent } from './sse.frames';
import {
  buildAgentGraph,
  type AgentModelLike,
  type AgentAuditSink,
} from './agent.graph';
import { ToolRegistry } from '../tools/tool.registry';
import type { AgentToolDef, ToolContext } from '../tools/tool.types';

class ScriptedFakeModel implements AgentModelLike {
  public invocations: BaseMessage[][] = [];
  public boundTools: unknown[][] = [];

  constructor(private responses: AIMessage[] = []) {}

  setResponses(responses: AIMessage[]) {
    this.responses = [...responses];
  }

  bindTools(tools: unknown[]) {
    this.boundTools.push(tools);
    return {
      invoke: async (messages: BaseMessage[]): Promise<AIMessage> => {
        this.invocations.push(messages);
        const next = this.responses.shift();
        if (!next) {
          throw new Error('ScriptedFakeModel: no scripted response available');
        }
        return next;
      },
    };
  }
}

function createScriptedGraph(
  chunks: Array<[string, unknown]>,
): AgentRunnerDeps['graph'] {
  return {
    async *stream() {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

describe('AgentRunner', () => {
  let registry: ToolRegistry;
  let readCatalogTool: AgentToolDef<{ query: string }>;
  let recommendProductsTool: AgentToolDef<{ category: string }>;
  let cancelOrderTool: AgentToolDef<{ orderId: string }>;

  const customerCtx: ToolContext = {
    userId: 'cust-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'thread-test-1',
  };

  const createMockThreads = () => ({
    recordUsage: jest.fn().mockResolvedValue(undefined),
    setTitleIfEmpty: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    readCatalogTool = {
      name: 'read_catalog',
      domain: 'catalog',
      description: 'Tìm kiếm sản phẩm trong danh mục',
      schema: z.object({ query: z.string().min(1) }).strict(),
      auth: 'public',
      risk: 'READ',
      handler: jest.fn().mockResolvedValue({ items: ['Sơn lót xịt'] }),
      summarize: (args) => `Tìm kiếm sản phẩm: ${args.query}`,
      uiAction: (data) => ({
        type: 'NAVIGATE',
        payload: { path: '/search', data: data as Record<string, unknown> },
      }),
    };

    recommendProductsTool = {
      name: 'recommend_products',
      domain: 'catalog',
      description: 'Gợi ý sản phẩm phù hợp',
      schema: z.object({ category: z.string() }).strict(),
      auth: 'public',
      risk: 'READ',
      handler: jest.fn().mockResolvedValue({
        sources: [{ id: 'prod-1', title: 'Sơn Samurai đen nhám' }],
      }),
      summarize: (args) => `Gợi ý sản phẩm cho danh mục: ${args.category}`,
    };

    cancelOrderTool = {
      name: 'cancel_order',
      domain: 'orders',
      description: 'Hủy đơn hàng của khách',
      schema: z.object({ orderId: z.string() }).strict(),
      auth: 'customer',
      risk: 'DESTRUCTIVE',
      handler: jest.fn().mockResolvedValue({ cancelled: true, orderId: 'ord-100' }),
      summarize: (args) => `Hủy đơn hàng ${args.orderId}`,
    };

    registry = new ToolRegistry([
      readCatalogTool,
      recommendProductsTool,
      cancelOrderTool,
    ]);
  });

  it('case a: a text-only turn emits thread, token(s), done with usage, and calls recordUsage and setTitleIfEmpty', async () => {
    const threads = createMockThreads();
    const fakeGraph = createScriptedGraph([
      ['messages', [new AIMessageChunk({ content: 'Xin ' }), { langgraph_node: 'agent' }]],
      ['messages', [new AIMessageChunk({ content: 'chào!' }), { langgraph_node: 'agent' }]],
      [
        'updates',
        {
          agent: {
            messages: [
              new AIMessage({
                content: 'Xin chào!',
                usage_metadata: {
                  input_tokens: 10,
                  output_tokens: 5,
                  total_tokens: 15,
                },
              }),
            ],
          },
        },
      ],
    ]);

    const runner = new AgentRunner({
      graph: fakeGraph,
      registry,
      threads,
      limits: { maxSteps: 5, timeoutMs: 5000 },
    });

    const events: AgentStreamEvent[] = [];
    await runner.run({
      ctx: customerCtx,
      message: 'Chào shop',
      sink: (e) => events.push(e),
    });

    expect(events).toEqual([
      { event: 'thread', data: { threadId: customerCtx.threadId } },
      { event: 'token', data: { text: 'Xin ' } },
      { event: 'token', data: { text: 'chào!' } },
      { event: 'done', data: { usage: { totalTokens: 15 } } },
    ]);

    expect(threads.recordUsage).toHaveBeenCalledTimes(1);
    expect(threads.recordUsage).toHaveBeenCalledWith(customerCtx.threadId, 15);
    expect(threads.setTitleIfEmpty).toHaveBeenCalledTimes(1);
    expect(threads.setTitleIfEmpty).toHaveBeenCalledWith(customerCtx.threadId, 'Chào shop');
  });

  it('case b: a read tool call emits tool_start, tool_result ok true, and the uiAction event when the tool defines uiAction; recommend_products emits sources', async () => {
    const threads = createMockThreads();
    const fakeGraph = createScriptedGraph([
      [
        'updates',
        {
          agent: {
            messages: [
              new AIMessage({
                content: '',
                tool_calls: [
                  { id: 'call-read-1', name: 'read_catalog', args: { query: 'sơn xịt' } },
                  { id: 'call-rec-1', name: 'recommend_products', args: { category: 'paint' } },
                ],
              }),
            ],
          },
        },
      ],
      [
        'updates',
        {
          tools: {
            messages: [
              new ToolMessage({
                tool_call_id: 'call-read-1',
                name: 'read_catalog',
                content: JSON.stringify({ ok: true, data: { items: ['Sơn lót xịt'] } }),
              }),
              new ToolMessage({
                tool_call_id: 'call-rec-1',
                name: 'recommend_products',
                content: JSON.stringify({
                  ok: true,
                  data: {
                    sources: [{ id: 'prod-1', title: 'Sơn Samurai đen nhám' }],
                  },
                }),
              }),
            ],
          },
        },
      ],
      [
        'messages',
        [new AIMessageChunk({ content: 'Đây là các sản phẩm bạn cần.' }), { langgraph_node: 'agent' }],
      ],
      [
        'updates',
        {
          agent: {
            messages: [
              new AIMessage({
                content: 'Đây là các sản phẩm bạn cần.',
              }),
            ],
          },
        },
      ],
    ]);

    const runner = new AgentRunner({
      graph: fakeGraph,
      registry,
      threads,
      limits: { maxSteps: 5, timeoutMs: 5000 },
    });

    const events: AgentStreamEvent[] = [];
    await runner.run({
      ctx: customerCtx,
      message: 'Tìm sơn xịt',
      sink: (e) => events.push(e),
    });

    expect(events).toEqual([
      { event: 'thread', data: { threadId: customerCtx.threadId } },
      {
        event: 'tool_start',
        data: {
          id: 'call-read-1',
          name: 'read_catalog',
          summary: 'Tìm kiếm sản phẩm: sơn xịt',
        },
      },
      {
        event: 'tool_start',
        data: {
          id: 'call-rec-1',
          name: 'recommend_products',
          summary: 'Gợi ý sản phẩm cho danh mục: paint',
        },
      },
      {
        event: 'tool_result',
        data: {
          id: 'call-read-1',
          name: 'read_catalog',
          ok: true,
          summary: 'Đã thực hiện thao tác',
        },
      },
      {
        event: 'ui_action',
        data: {
          type: 'NAVIGATE',
          payload: { path: '/search', data: { items: ['Sơn lót xịt'] } },
        },
      },
      {
        event: 'tool_result',
        data: {
          id: 'call-rec-1',
          name: 'recommend_products',
          ok: true,
          summary: 'Đã thực hiện thao tác',
        },
      },
      {
        event: 'sources',
        data: [{ id: 'prod-1', title: 'Sơn Samurai đen nhám' }],
      },
      {
        event: 'token',
        data: { text: 'Đây là các sản phẩm bạn cần.' },
      },
      {
        event: 'done',
        data: { usage: null },
      },
    ]);
  });

  it('case c: a confirm interrupt emits confirm_required and no done; a resume with approve true then emits tool_result and done', async () => {
    const cancelHandler = cancelOrderTool.handler;
    const audit: AgentAuditSink = { record: jest.fn().mockResolvedValue(undefined) };

    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [{ id: 'call_destr_1', name: 'cancel_order', args: { orderId: 'ord-100' } }],
      }),
      new AIMessage({
        content: 'Đã hủy đơn hàng thành công.',
        usage_metadata: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
      }),
    ]);

    const realGraph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const threads = createMockThreads();
    const runner = new AgentRunner({
      graph: realGraph,
      registry,
      threads,
      limits: { maxSteps: 5, timeoutMs: 5000 },
    });

    // Turn 1: request requiring confirmation
    const eventsTurn1: AgentStreamEvent[] = [];
    await runner.run({
      ctx: customerCtx,
      message: 'Hủy đơn ord-100',
      sink: (e) => eventsTurn1.push(e),
    });

    expect(eventsTurn1).toContainEqual({
      event: 'thread',
      data: { threadId: customerCtx.threadId },
    });
    expect(eventsTurn1).toContainEqual({
      event: 'tool_start',
      data: {
        id: 'call_destr_1',
        name: 'cancel_order',
        summary: 'Hủy đơn hàng ord-100',
      },
    });
    expect(eventsTurn1).toContainEqual({
      event: 'confirm_required',
      data: {
        calls: [
          {
            id: 'call_destr_1',
            name: 'cancel_order',
            summary: 'Hủy đơn hàng ord-100',
            risk: 'DESTRUCTIVE',
          },
        ],
      },
    });

    // No done event in turn 1
    expect(eventsTurn1.find((e) => e.event === 'done')).toBeUndefined();
    expect(cancelHandler).not.toHaveBeenCalled();

    // Turn 2: resume with approve: true
    const eventsTurn2: AgentStreamEvent[] = [];
    await runner.run({
      ctx: customerCtx,
      resume: { decisions: [{ callId: 'call_destr_1', approve: true }] },
      sink: (e) => eventsTurn2.push(e),
    });

    expect(cancelHandler).toHaveBeenCalledTimes(1);
    expect(cancelHandler).toHaveBeenCalledWith({ orderId: 'ord-100' }, customerCtx);

    expect(eventsTurn2).toContainEqual({
      event: 'thread',
      data: { threadId: customerCtx.threadId },
    });
    expect(eventsTurn2).toContainEqual({
      event: 'tool_result',
      data: {
        id: 'call_destr_1',
        name: 'cancel_order',
        ok: true,
        summary: 'Đã thực hiện thao tác',
      },
    });
    expect(eventsTurn2).toContainEqual({
      event: 'done',
      data: { usage: { totalTokens: 20 } },
    });
  });

  it('case d: a second run on the same threadId while the first is running throws AgentBusyError; the lock is released afterwards', async () => {
    let finishStream!: () => void;
    const gate = new Promise<void>((resolve) => {
      finishStream = resolve;
    });

    const blockingGraph: AgentRunnerDeps['graph'] = {
      async *stream() {
        await gate;
        yield ['updates', {}];
      },
    };

    const runner = new AgentRunner({
      graph: blockingGraph,
      registry,
      threads: createMockThreads(),
      limits: { maxSteps: 5, timeoutMs: 5000 },
    });

    const turnPromise = runner.run({
      ctx: customerCtx,
      message: 'Turn 1',
      sink: () => {},
    });

    // Calling run on same threadId throws synchronously
    expect(() =>
      runner.run({
        ctx: customerCtx,
        message: 'Turn 2',
        sink: () => {},
      }),
    ).toThrow(AgentBusyError);

    finishStream();
    await turnPromise;

    // After finish, lock is released: next run on same threadId succeeds
    await expect(
      runner.run({
        ctx: customerCtx,
        message: 'Turn 3',
        sink: () => {},
      }),
    ).resolves.toBeUndefined();
  });

  it('case e: a stream that throws emits one error event with code AGENT_ERROR and the Vietnamese message, and the lock is released', async () => {
    const failingGraph: AgentRunnerDeps['graph'] = {
      async *stream() {
        throw new Error('Graph exploded');
      },
    };

    const runner = new AgentRunner({
      graph: failingGraph,
      registry,
      threads: createMockThreads(),
      limits: { maxSteps: 5, timeoutMs: 5000 },
    });

    const events: AgentStreamEvent[] = [];
    await runner.run({
      ctx: customerCtx,
      message: 'Fail me',
      sink: (e) => events.push(e),
    });

    expect(events).toEqual([
      { event: 'thread', data: { threadId: customerCtx.threadId } },
      {
        event: 'error',
        data: {
          message: 'Trợ lý tạm thời không phản hồi, vui lòng thử lại sau.',
          code: 'AGENT_ERROR',
        },
      },
    ]);

    // Lock is released after error
    const eventsRetry: AgentStreamEvent[] = [];
    await runner.run({
      ctx: customerCtx,
      message: 'Retry',
      sink: (e) => eventsRetry.push(e),
    });
    expect(eventsRetry).toContainEqual({
      event: 'thread',
      data: { threadId: customerCtx.threadId },
    });
  });

  it('case f: a timeout (timeoutMs small) emits one error event with code AGENT_TIMEOUT', async () => {
    const hangingGraph: AgentRunnerDeps['graph'] = {
      async *stream() {
        await new Promise((r) => setTimeout(r, 1000));
        yield ['updates', {}];
      },
    };

    const runner = new AgentRunner({
      graph: hangingGraph,
      registry,
      threads: createMockThreads(),
      limits: { maxSteps: 5, timeoutMs: 25 },
    });

    const events: AgentStreamEvent[] = [];
    await runner.run({
      ctx: customerCtx,
      message: 'Timeout me',
      sink: (e) => events.push(e),
    });

    expect(events).toEqual([
      { event: 'thread', data: { threadId: customerCtx.threadId } },
      {
        event: 'error',
        data: {
          message: 'Yêu cầu quá thời gian, vui lòng thử lại.',
          code: 'AGENT_TIMEOUT',
        },
      },
    ]);
  });

  it('case g: an aborted signal emits no error event and returns', async () => {
    const abortController = new AbortController();
    const midStreamGraph: AgentRunnerDeps['graph'] = {
      async *stream() {
        yield ['messages', [new AIMessageChunk({ content: 'Khởi đầu' }), { langgraph_node: 'agent' }]];
        abortController.abort();
        await new Promise((r) => setTimeout(r, 50));
        yield ['messages', [new AIMessageChunk({ content: ' tiếp diễn' }), { langgraph_node: 'agent' }]];
      },
    };

    const runner = new AgentRunner({
      graph: midStreamGraph,
      registry,
      threads: createMockThreads(),
      limits: { maxSteps: 5, timeoutMs: 5000 },
    });

    const events: AgentStreamEvent[] = [];
    await runner.run({
      ctx: customerCtx,
      message: 'Abort me',
      signal: abortController.signal,
      sink: (e) => events.push(e),
    });

    expect(events.filter((e) => e.event === 'error')).toEqual([]);
    expect(events.filter((e) => e.event === 'done')).toEqual([]);

    // Pre-aborted signal emits no events at all and returns immediately
    const preAborted = new AbortController();
    preAborted.abort();
    const eventsPre: AgentStreamEvent[] = [];
    await runner.run({
      ctx: customerCtx,
      message: 'Pre-aborted turn',
      signal: preAborted.signal,
      sink: (e) => eventsPre.push(e),
    });
    expect(eventsPre).toEqual([]);
  });

  it('case h: ctx.userId or role never appears in any message sent to the model', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({ content: 'Phản hồi từ trợ lý.' }),
    ]);

    const audit: AgentAuditSink = { record: jest.fn().mockResolvedValue(undefined) };
    const realGraph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const runner = new AgentRunner({
      graph: realGraph,
      registry,
      threads: createMockThreads(),
      limits: { maxSteps: 5, timeoutMs: 5000 },
    });

    const secretUserId = 'super-secret-user-identity-4567';
    const privacyCtx: ToolContext = {
      userId: secretUserId,
      role: 'CUSTOMER',
      app: 'USER',
      threadId: 'th-privacy-check',
    };

    await runner.run({
      ctx: privacyCtx,
      message: 'Xin chào trợ lý',
      sink: () => {},
    });

    expect(model.invocations.length).toBeGreaterThan(0);
    for (const invocation of model.invocations) {
      // Secret userId never appears in any message sent to the model
      const serialized = JSON.stringify(invocation);
      expect(serialized).not.toContain(secretUserId);

      // Human message contains only the user message text, never role or userId
      const humanMsg = invocation.find((m) => m.getType() === 'human');
      expect(humanMsg).toBeDefined();
      expect(humanMsg!.content).toBe('Xin chào trợ lý');
      expect(humanMsg!.content).not.toContain(privacyCtx.role);
      expect(humanMsg!.content).not.toContain(secretUserId);
    }
  });

  it('ignores thread service errors without throwing or failing the run', async () => {
    const failingThreads = {
      recordUsage: jest.fn().mockRejectedValue(new Error('DB connection down')),
      setTitleIfEmpty: jest.fn().mockRejectedValue(new Error('DB timeout')),
    };

    const fakeGraph = createScriptedGraph([
      [
        'updates',
        {
          agent: {
            messages: [
              new AIMessage({
                content: 'Xong lượt.',
                usage_metadata: { total_tokens: 30, input_tokens: 20, output_tokens: 10 },
              }),
            ],
          },
        },
      ],
    ]);

    const runner = new AgentRunner({
      graph: fakeGraph,
      registry,
      threads: failingThreads,
      limits: { maxSteps: 5, timeoutMs: 5000 },
    });

    const events: AgentStreamEvent[] = [];
    await expect(
      runner.run({
        ctx: customerCtx,
        message: 'Lưu dữ liệu',
        sink: (e) => events.push(e),
      }),
    ).resolves.toBeUndefined();

    expect(events).toContainEqual({
      event: 'done',
      data: { usage: { totalTokens: 30 } },
    });
  });
});
