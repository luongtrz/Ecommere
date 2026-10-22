import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
} from '@langchain/core/messages';
import { z } from 'zod';
import {
  AgentRunner,
  AgentBusyError,
  AgentNotPendingError,
  type AgentRunnerDeps,
} from './agent.runner';
import type { AgentStreamEvent } from './sse.frames';
import { ToolRegistry } from '../tools/tool.registry';
import type { AgentToolDef, ToolContext } from '../tools/tool.types';

function createScriptedGraph(
  chunks: Array<[string, unknown] | unknown>,
  onStreamCalled?: (input: unknown, config: unknown) => void,
): AgentRunnerDeps['graph'] {
  return {
    async *stream(input: unknown, config: unknown) {
      if (onStreamCalled) {
        onStreamCalled(input, config);
      }
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

function createStateGraph(
  stateOrHandler: unknown,
  checkpointer?: unknown,
): AgentRunnerDeps['graph'] {
  const handler =
    typeof stateOrHandler === 'function'
      ? (stateOrHandler as (config: unknown) => unknown)
      : async () => stateOrHandler;
  return {
    async *stream() {},
    async getState(config: unknown) {
      return handler(config);
    },
    checkpointer,
  };
}

describe('AgentRunner (gaps coverage)', () => {
  let registry: ToolRegistry;
  let readCatalogTool: AgentToolDef<{ query: string }>;
  let recommendProductsTool: AgentToolDef<{ category: string }>;

  const customerCtx: ToolContext = {
    userId: 'cust-gap-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'thread-gap-1',
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
      description: 'Tìm kiếm sản phẩm',
      schema: z.object({ query: z.string().min(1) }).strict(),
      auth: 'public',
      risk: 'READ',
      handler: jest.fn().mockResolvedValue({ items: ['Sơn Samurai'] }),
      summarize: (args) => `Tìm kiếm: ${args.query}`,
      uiAction: (data) => ({
        type: 'NAVIGATE',
        payload: { path: '/search', data: data as Record<string, unknown> },
      }),
    };

    recommendProductsTool = {
      name: 'recommend_products',
      domain: 'catalog',
      description: 'Gợi ý sản phẩm',
      schema: z.object({ category: z.string() }).strict(),
      auth: 'public',
      risk: 'READ',
      handler: jest.fn().mockResolvedValue({
        sources: [{ id: 'prod-1' }],
      }),
      summarize: (args) => `Gợi ý: ${args.category}`,
    };

    registry = new ToolRegistry([readCatalogTool, recommendProductsTool]);
  });

  describe('Error constructors default and custom parameters', () => {
    it('instantiates AgentBusyError with default message when no argument is passed', () => {
      const err = new AgentBusyError();
      expect(err).toBeInstanceOf(AgentBusyError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('AgentBusyError');
      expect(err.message).toBe('Cuộc trò chuyện đang được xử lý');
    });

    it('instantiates AgentBusyError with custom message', () => {
      const err = new AgentBusyError('Tác vụ đang bận');
      expect(err.message).toBe('Tác vụ đang bận');
    });

    it('instantiates AgentNotPendingError with custom message', () => {
      const err = new AgentNotPendingError('Không có hành động chờ xác nhận');
      expect(err).toBeInstanceOf(AgentNotPendingError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('AgentNotPendingError');
      expect(err.message).toBe('Không có hành động chờ xác nhận');
    });
  });

  describe('Constructor deps.now and isThreadRunning method', () => {
    it('accepts custom now function in deps', () => {
      const customNow = () => 1700000000000;
      const runner = new AgentRunner({
        graph: { async *stream() {} },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
        now: customNow,
      });
      expect(runner.isThreadRunning('thread-check')).toBe(false);
    });

    it('reports isThreadRunning as true while thread executes and false after completion', async () => {
      let releaseGate!: () => void;
      const gatePromise = new Promise<void>((resolve) => {
        releaseGate = resolve;
      });

      const runner = new AgentRunner({
        graph: {
          async *stream() {
            await gatePromise;
            yield ['updates', {}];
          },
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const threadId = 'thread-running-test';
      expect(runner.isThreadRunning(threadId)).toBe(false);

      const runPromise = runner.run({
        ctx: { ...customerCtx, threadId },
        message: 'Chạy nền',
        sink: () => {},
      });

      expect(runner.isThreadRunning(threadId)).toBe(true);
      expect(runner.isThreadRunning('other-thread-id')).toBe(false);

      releaseGate();
      await runPromise;

      expect(runner.isThreadRunning(threadId)).toBe(false);
    });
  });

  describe('readTranscript gap branches', () => {
    it('uses state.messages when state.values is undefined', async () => {
      const fakeGraph = createStateGraph({
        messages: [
          new HumanMessage({ content: 'Xin chào', id: 'h-msg-1' }),
          new AIMessage({ content: 'Dạ chào bạn!', id: 'ai-msg-1' }),
        ],
      });
      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-values-undefined');
      expect(transcript).toEqual([
        { id: 'h-msg-1', role: 'user', content: 'Xin chào' },
        { id: 'ai-msg-1', role: 'assistant', content: 'Dạ chào bạn!' },
      ]);
    });

    it('returns empty array when messages is not an array or is empty', async () => {
      const runnerNonArray = new AgentRunner({
        graph: createStateGraph({ values: { messages: 'not an array' } }),
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });
      expect(await runnerNonArray.readTranscript('th-non-array')).toEqual([]);

      const runnerEmpty = new AgentRunner({
        graph: createStateGraph({ values: { messages: [] } }),
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });
      expect(await runnerEmpty.readTranscript('th-empty')).toEqual([]);
    });

    it('skips non-object elements and resolves message types via _getType, type, and role', async () => {
      const fakeGraph = createStateGraph({
        values: {
          messages: [
            null,
            'primitive-string',
            42,
            { _getType: () => 'human', content: 'Từ _getType user', id: 'm-1' },
            {
              _getType: () => 'ai',
              content: 'Từ _getType assistant',
              id: 'm-2',
            },
            { type: 'user', content: 'Từ type user', id: 'm-3' },
            { type: 'assistant', content: 'Từ type assistant', id: 'm-4' },
            { role: 'user', content: 'Từ role user', id: 'm-5' },
            { role: 'assistant', content: 'Từ role assistant', id: 'm-6' },
            { unknownField: true, content: 'Bị bỏ qua' },
          ],
        },
      });

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-types-test');
      expect(transcript).toEqual([
        { id: 'm-1', role: 'user', content: 'Từ _getType user' },
        { id: 'm-2', role: 'assistant', content: 'Từ _getType assistant' },
        { id: 'm-3', role: 'user', content: 'Từ type user' },
        { id: 'm-4', role: 'assistant', content: 'Từ type assistant' },
        { id: 'm-5', role: 'user', content: 'Từ role user' },
        { id: 'm-6', role: 'assistant', content: 'Từ role assistant' },
      ]);
    });

    it('keeps user message with empty content but skips assistant message with empty content', async () => {
      const fakeGraph = createStateGraph({
        values: {
          messages: [
            { type: 'user', content: '', id: 'user-empty' },
            { type: 'assistant', content: '', id: 'ai-empty' },
          ],
        },
      });

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-empty-content');
      expect(transcript).toEqual([
        { id: 'user-empty', role: 'user', content: '' },
      ]);
    });

    it('falls back to loop index string when rawId is null or empty string, and converts numeric id to string', async () => {
      const fakeGraph = createStateGraph({
        values: {
          messages: [
            { type: 'user', content: 'Tin nhắn null id', id: null },
            { type: 'user', content: 'Tin nhắn empty id', id: '' },
            { type: 'user', content: 'Tin nhắn numeric id', id: 456 },
          ],
        },
      });

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-ids-fallback');
      expect(transcript).toEqual([
        { id: '0', role: 'user', content: 'Tin nhắn null id' },
        { id: '1', role: 'user', content: 'Tin nhắn empty id' },
        { id: '456', role: 'user', content: 'Tin nhắn numeric id' },
      ]);
    });

    it('extractMessageContent handles string parts, untagged text blocks, invalid blocks, and non-string/array content', async () => {
      const fakeGraph = createStateGraph({
        values: {
          messages: [
            {
              type: 'user',
              content: ['Phần 1 ', 'Phần 2'],
              id: 'parts-strings',
            },
            {
              type: 'user',
              content: [{ text: 'Khối text không có type' }],
              id: 'parts-no-type',
            },
            {
              type: 'user',
              content: [
                null,
                123,
                { type: 'other', text: 'Bỏ qua' },
                { text: 9999 },
                { type: 'text', text: 'Khối hợp lệ' },
              ],
              id: 'parts-mixed',
            },
            {
              type: 'user',
              content: 12345,
              id: 'non-string-content',
            },
          ],
        },
      });

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-content-branches');
      expect(transcript).toEqual([
        { id: 'parts-strings', role: 'user', content: 'Phần 1 Phần 2' },
        {
          id: 'parts-no-type',
          role: 'user',
          content: 'Khối text không có type',
        },
        { id: 'parts-mixed', role: 'user', content: 'Khối hợp lệ' },
        { id: 'non-string-content', role: 'user', content: '' },
      ]);
    });
  });

  describe('assertResumable gap branches', () => {
    it('throws AgentNotPendingError when tasks contains null or non-array interrupts', async () => {
      const runner = new AgentRunner({
        graph: createStateGraph({
          tasks: [null, { interrupts: 'not-an-array' }],
        }),
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await expect(
        runner.assertResumable('th-invalid-tasks', ['call-1']),
      ).rejects.toThrow(AgentNotPendingError);
    });

    it('throws AgentNotPendingError when interrupt calls is not an array or call id is not a string', async () => {
      const runner = new AgentRunner({
        graph: createStateGraph({
          tasks: [
            {
              interrupts: [
                { value: { calls: 'not-array' } },
                { value: { calls: [{ id: 12345 }, { id: null }] } },
              ],
            },
          ],
        }),
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await expect(
        runner.assertResumable('th-invalid-calls', ['call-1']),
      ).rejects.toThrow(AgentNotPendingError);
    });
  });

  describe('deleteCheckpoints gap branches', () => {
    it('falls back to default schema "agent" when checkpointer schema is missing', async () => {
      const queryMock = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query: queryMock };

      const runner = new AgentRunner({
        graph: {
          ...createStateGraph({}),
          checkpointer: { pool: mockPool },
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.deleteCheckpoints('thread-no-schema');

      expect(queryMock).toHaveBeenCalledTimes(3);
      expect(queryMock).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['thread-no-schema'],
      );
    });

    it('falls back to default schema "agent" when checkpointer schema is whitespace', async () => {
      const queryMock = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query: queryMock };

      const runner = new AgentRunner({
        graph: {
          ...createStateGraph({}),
          checkpointer: { pool: mockPool, schema: '   ' },
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.deleteCheckpoints('thread-space-schema');

      expect(queryMock).toHaveBeenCalledTimes(3);
      expect(queryMock).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['thread-space-schema'],
      );
    });
  });

  describe('handleToolMessages gap branches', () => {
    it('uses id when tool_call_id is missing, and falls back to empty string when both are missing', async () => {
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            tools: {
              messages: [
                {
                  id: 'fallback-id-only',
                  name: 'read_catalog',
                  content: JSON.stringify({ ok: true }),
                },
                {
                  content: JSON.stringify({ ok: true }),
                },
              ],
            },
          },
        ],
      ]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: customerCtx,
        message: 'Kiểm tra id fallback',
        sink: (e) => events.push(e),
      });

      expect(events).toContainEqual({
        event: 'tool_result',
        data: {
          id: 'fallback-id-only',
          name: 'read_catalog',
          ok: true,
          summary: 'Đã thực hiện thao tác',
        },
      });

      expect(events).toContainEqual({
        event: 'tool_result',
        data: {
          id: '',
          name: '',
          ok: true,
          summary: 'Đã thực hiện thao tác',
        },
      });
    });

    it('handles content as object, invalid JSON string, and rawErr as object or empty', async () => {
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            tools: {
              messages: [
                // content as object
                {
                  tool_call_id: 'call-obj',
                  name: 'read_catalog',
                  content: { ok: true, data: { items: ['Sơn Samurai'] } },
                },
                // content as invalid JSON
                {
                  tool_call_id: 'call-bad-json',
                  name: 'read_catalog',
                  content: 'invalid-json-{broken',
                },
                // ok false with empty/null error
                {
                  tool_call_id: 'call-err-empty',
                  name: 'read_catalog',
                  content: JSON.stringify({ ok: false, error: '' }),
                },
                // ok false with object error
                {
                  tool_call_id: 'call-err-obj',
                  name: 'read_catalog',
                  content: JSON.stringify({
                    ok: false,
                    error: { code: 'NOT_FOUND', detail: 'Hết hàng' },
                  }),
                },
              ],
            },
          },
        ],
      ]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: customerCtx,
        message: 'Nhiều trường hợp tool_result',
        sink: (e) => events.push(e),
      });

      expect(events).toContainEqual({
        event: 'tool_result',
        data: {
          id: 'call-obj',
          name: 'read_catalog',
          ok: true,
          summary: 'Đã thực hiện thao tác',
        },
      });

      expect(events).toContainEqual({
        event: 'tool_result',
        data: {
          id: 'call-bad-json',
          name: 'read_catalog',
          ok: false,
          summary: 'Thao tác không thành công.',
        },
      });

      expect(events).toContainEqual({
        event: 'tool_result',
        data: {
          id: 'call-err-empty',
          name: 'read_catalog',
          ok: false,
          summary: 'Thao tác không thành công.',
        },
      });

      expect(events).toContainEqual({
        event: 'tool_result',
        data: {
          id: 'call-err-obj',
          name: 'read_catalog',
          ok: false,
          summary: JSON.stringify({ code: 'NOT_FOUND', detail: 'Hết hàng' }),
        },
      });
    });

    it('handles uiAction returning undefined or throwing, recommend_products with non-array sources, and unknown tool', async () => {
      const toolNoAction: AgentToolDef<{ id: string }> = {
        name: 'tool_no_action',
        domain: 'catalog',
        description: 'Test no action',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ ok: true }),
        summarize: () => 'Không action',
        uiAction: () => null as any,
      };

      const toolThrowAction: AgentToolDef<{ id: string }> = {
        name: 'tool_throw_action',
        domain: 'catalog',
        description: 'Test throw action',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ ok: true }),
        summarize: () => 'Action ném lỗi',
        uiAction: () => {
          throw new Error('UI blowup');
        },
      };

      const customRegistry = new ToolRegistry([
        toolNoAction,
        toolThrowAction,
        recommendProductsTool,
      ]);

      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            tools: {
              messages: [
                {
                  tool_call_id: 'call-null-action',
                  name: 'tool_no_action',
                  content: JSON.stringify({ ok: true }),
                },
                {
                  tool_call_id: 'call-throw-action',
                  name: 'tool_throw_action',
                  content: JSON.stringify({ ok: true }),
                },
                {
                  tool_call_id: 'call-rec-non-array',
                  name: 'recommend_products',
                  content: JSON.stringify({
                    ok: true,
                    data: { sources: 'string-instead-of-array' },
                  }),
                },
                {
                  tool_call_id: 'call-unknown-tool',
                  name: 'nonexistent_tool',
                  content: JSON.stringify({ ok: true }),
                },
              ],
            },
          },
        ],
      ]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry: customRegistry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: customerCtx,
        message: 'Kiểm tra xử lý ngoại lệ uiAction',
        sink: (e) => events.push(e),
      });

      expect(events.filter((e) => e.event === 'ui_action')).toHaveLength(0);
      expect(events.filter((e) => e.event === 'sources')).toHaveLength(0);
    });
  });

  describe('execute gap branches', () => {
    it('passes clientContext to configurable ctx when params.clientContext is provided', async () => {
      let passedConfig: any = null;
      const fakeGraph = createScriptedGraph([], (_input, config) => {
        passedConfig = config;
      });

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.run({
        ctx: customerCtx,
        clientContext: { currentUrl: '/cart', screen: 'mobile' },
        message: 'Xem ngữ cảnh',
        sink: () => {},
      });

      expect(passedConfig).toBeDefined();
      expect(passedConfig.configurable.ctx.clientContext).toEqual({
        currentUrl: '/cart',
        screen: 'mobile',
      });
    });

    it('defaults message to empty string and skips setTitleIfEmpty when params.message is undefined', async () => {
      let passedInput: any = null;
      const fakeGraph = createScriptedGraph([], (input) => {
        passedInput = input;
      });

      const threads = createMockThreads();
      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads,
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.run({
        ctx: customerCtx,
        sink: () => {},
      });

      expect(passedInput).toEqual({
        messages: [new HumanMessage('')],
      });
      expect(threads.setTitleIfEmpty).not.toHaveBeenCalled();
    });

    it('skips non-array chunks or chunks with length < 2, and non-agent or empty text message chunks', async () => {
      const fakeGraph = createScriptedGraph([
        null,
        'simple-string-chunk',
        ['messages'], // length < 2
        [
          'messages',
          [
            new AIMessageChunk({ content: 'Bỏ qua' }),
            { langgraph_node: 'tools' }, // not agent
          ],
        ],
        [
          'messages',
          [
            new AIMessageChunk({ content: '' }), // empty string
            { langgraph_node: 'agent' },
          ],
        ],
        [
          'messages',
          [
            new AIMessageChunk({ content: 'Hợp lệ' }),
            { langgraph_node: 'agent' },
          ],
        ],
      ]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: customerCtx,
        message: 'Lọc chunk',
        sink: (e) => events.push(e),
      });

      const tokenEvents = events.filter((e) => e.event === 'token');
      expect(tokenEvents).toEqual([
        { event: 'token', data: { text: 'Hợp lệ' } },
      ]);
    });

    it('handles tool_calls with string args, invalid string args, schema failure, summarize throwing, and missing names', async () => {
      const throwingSummaryTool: AgentToolDef<{ query: string }> = {
        name: 'throw_summary',
        domain: 'catalog',
        description: 'Throwing summary',
        schema: z.object({ query: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn(),
        summarize: () => {
          throw new Error('Summarize failure');
        },
      };

      const customRegistry = new ToolRegistry([
        readCatalogTool,
        throwingSummaryTool,
      ]);

      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            agent: {
              messages: [
                new AIMessage({
                  content: '',
                  tool_calls: [
                    // args as valid JSON string
                    {
                      id: 'call-str-json',
                      name: 'read_catalog',
                      args: JSON.stringify({ query: 'Sơn bóng' }),
                    },
                    // args as invalid JSON string
                    {
                      id: 'call-invalid-json',
                      name: 'read_catalog',
                      args: '{invalid json',
                    },
                    // schema safeParse failure
                    {
                      id: 'call-schema-fail',
                      name: 'read_catalog',
                      args: { query: '' }, // min(1) fails
                    },
                    // summarize throws
                    {
                      id: 'call-throw-summary',
                      name: 'throw_summary',
                      args: { query: 'test' },
                    },
                    // unknown tool name and missing id/name
                    {
                      args: {},
                    },
                  ] as any,
                } as any),
              ],
            },
          },
        ],
      ]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry: customRegistry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: customerCtx,
        message: 'Thử nghiệm tool_calls',
        sink: (e) => events.push(e),
      });

      const toolStartEvents = events.filter((e) => e.event === 'tool_start');
      expect(toolStartEvents).toEqual([
        {
          event: 'tool_start',
          data: {
            id: 'call-str-json',
            name: 'read_catalog',
            summary: 'Tìm kiếm: Sơn bóng',
          },
        },
        {
          event: 'tool_start',
          data: {
            id: 'call-invalid-json',
            name: 'read_catalog',
            summary: 'read_catalog',
          },
        },
        {
          event: 'tool_start',
          data: {
            id: 'call-schema-fail',
            name: 'read_catalog',
            summary: 'read_catalog',
          },
        },
        {
          event: 'tool_start',
          data: {
            id: 'call-throw-summary',
            name: 'throw_summary',
            summary: 'throw_summary',
          },
        },
        {
          event: 'tool_start',
          data: {
            id: '',
            name: '',
            summary: '',
          },
        },
      ]);
    });

    it('ignores non-confirm interrupts in payload.__interrupt__', async () => {
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            __interrupt__: [
              { value: { kind: 'notification', message: 'Thông báo' } },
            ],
          },
        ],
      ]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: customerCtx,
        message: 'Interrupt không phải confirm',
        sink: (e) => events.push(e),
      });

      expect(
        events.find((e) => e.event === 'confirm_required'),
      ).toBeUndefined();
      expect(events.find((e) => e.event === 'done')).toBeDefined();
    });

    it('handles totalTokens === 0 with hasUsage true by emitting done with 0 tokens and skipping recordUsage', async () => {
      const threads = createMockThreads();
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            agent: {
              messages: [
                new AIMessage({
                  content: 'Trả lời nhanh',
                  usage_metadata: {
                    input_tokens: 0,
                    output_tokens: 0,
                    total_tokens: 0,
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
        message: '0 tokens',
        sink: (e) => events.push(e),
      });

      expect(events).toContainEqual({
        event: 'done',
        data: { usage: { totalTokens: 0 } },
      });
      expect(threads.recordUsage).not.toHaveBeenCalled();
    });

    it('catches and ignores error thrown by iterator.return() in finally', async () => {
      const throwingReturnGraph: AgentRunnerDeps['graph'] = {
        stream() {
          let done = false;
          return {
            [Symbol.asyncIterator]() {
              return {
                async next() {
                  if (done) {
                    return { done: true, value: undefined };
                  }
                  done = true;
                  return { done: false, value: ['updates', {}] };
                },
                async return() {
                  throw new Error('Iterator return failed');
                },
              };
            },
          };
        },
      };

      const runner = new AgentRunner({
        graph: throwingReturnGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await expect(
        runner.run({
          ctx: customerCtx,
          message: 'Thử iterator.return ném lỗi',
          sink: () => {},
        }),
      ).resolves.toBeUndefined();
    });

    it('runs normally when timeoutMs is 0 (no timeout timer created)', async () => {
      const fakeGraph = createScriptedGraph([['updates', {}]]);
      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 0 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: customerCtx,
        message: 'Timeout bằng 0',
        sink: (e) => events.push(e),
      });

      expect(events).toContainEqual({
        event: 'done',
        data: { usage: null },
      });
    });
  });
});
