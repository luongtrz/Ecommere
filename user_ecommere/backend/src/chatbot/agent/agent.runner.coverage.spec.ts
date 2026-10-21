import { Command } from '@langchain/langgraph';
import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { z } from 'zod';
import {
  AgentRunner,
  AgentBusyError,
  AgentNotPendingError,
  type AgentRunnerDeps,
  type AgentTranscriptMessage,
} from './agent.runner';
import type { AgentStreamEvent } from './sse.frames';
import { ToolRegistry } from '../tools/tool.registry';
import type { AgentToolDef, ToolContext } from '../tools/tool.types';

function createScriptedGraph(
  chunks: Array<[string, unknown] | unknown>,
  options?: {
    getState?: (config: unknown) => unknown;
    checkpointer?: unknown;
    onStream?: (input: unknown, config: unknown) => void;
  },
): AgentRunnerDeps['graph'] {
  return {
    async *stream(input: unknown, config: unknown) {
      if (options?.onStream) {
        options.onStream(input, config);
      }
      for (const chunk of chunks) {
        yield chunk as any;
      }
    },
    getState: options?.getState,
    checkpointer: options?.checkpointer,
  };
}

describe('AgentRunner (coverage)', () => {
  let registry: ToolRegistry;
  let testTool: AgentToolDef<{ query: string }>;

  const baseCtx: ToolContext = {
    userId: 'user-cov-1',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'thread-cov-1',
  };

  const createMockThreads = () => ({
    recordUsage: jest.fn().mockResolvedValue(undefined),
    setTitleIfEmpty: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    testTool = {
      name: 'search_catalog',
      domain: 'catalog',
      description: 'Tìm kiếm sản phẩm',
      schema: z.object({ query: z.string().min(1) }).strict(),
      auth: 'public',
      risk: 'READ',
      handler: jest.fn().mockResolvedValue({ items: ['Item 1'] }),
      summarize: (args) => `Tìm kiếm: ${args.query}`,
    };

    registry = new ToolRegistry([testTool]);
  });

  describe('AgentBusyError & AgentNotPendingError', () => {
    it('AgentBusyError instantiates with default and custom messages and preserves prototype', () => {
      const defaultErr = new AgentBusyError();
      expect(defaultErr.message).toBe('Cuộc trò chuyện đang được xử lý');
      expect(defaultErr.name).toBe('AgentBusyError');
      expect(defaultErr).toBeInstanceOf(AgentBusyError);
      expect(defaultErr).toBeInstanceOf(Error);

      const customErr = new AgentBusyError('Custom busy message');
      expect(customErr.message).toBe('Custom busy message');
      expect(customErr.name).toBe('AgentBusyError');
    });

    it('AgentNotPendingError instantiates with default and custom messages and preserves prototype', () => {
      const defaultErr = new AgentNotPendingError();
      expect(defaultErr.message).toBe('Không có thao tác nào đang chờ xác nhận');
      expect(defaultErr.name).toBe('AgentNotPendingError');
      expect(defaultErr).toBeInstanceOf(AgentNotPendingError);
      expect(defaultErr).toBeInstanceOf(Error);

      const customErr = new AgentNotPendingError('Custom not pending message');
      expect(customErr.message).toBe('Custom not pending message');
      expect(customErr.name).toBe('AgentNotPendingError');
    });
  });

  describe('isThreadRunning & thread lifecycle', () => {
    it('tracks thread execution state from start to finish', async () => {
      let resolveStream!: () => void;
      const streamGate = new Promise<void>((r) => {
        resolveStream = r;
      });

      const blockingGraph: AgentRunnerDeps['graph'] = {
        async *stream() {
          await streamGate;
          yield ['updates', {}];
        },
      };

      const runner = new AgentRunner({
        graph: blockingGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const threadId = 'lifecycle-thread-1';
      expect(runner.isThreadRunning(threadId)).toBe(false);

      const runPromise = runner.run({
        ctx: { ...baseCtx, threadId },
        message: 'Hello',
        sink: () => {},
      });

      expect(runner.isThreadRunning(threadId)).toBe(true);

      resolveStream();
      await runPromise;

      expect(runner.isThreadRunning(threadId)).toBe(false);
    });

    it('clears thread running state even when execution throws', async () => {
      const failingGraph: AgentRunnerDeps['graph'] = {
        async *stream() {
          throw new Error('Fatal stream failure');
        },
      };

      const runner = new AgentRunner({
        graph: failingGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const threadId = 'failing-thread-1';
      expect(runner.isThreadRunning(threadId)).toBe(false);

      await runner.run({
        ctx: { ...baseCtx, threadId },
        message: 'Hello',
        sink: () => {},
      });

      expect(runner.isThreadRunning(threadId)).toBe(false);
    });

    it('accepts custom now function in deps', () => {
      const customNow = jest.fn().mockReturnValue(1700000000000);
      const runner = new AgentRunner({
        graph: createScriptedGraph([]),
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
        now: customNow,
      });

      expect(runner).toBeDefined();
    });
  });

  describe('run parameter variations', () => {
    it('merges clientContext into ToolContext when provided', async () => {
      let capturedConfig: any;
      const fakeGraph = createScriptedGraph([['updates', {}]], {
        onStream: (_, config) => {
          capturedConfig = config;
        },
      });

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const clientContext = { ip: '127.0.0.1', userAgent: 'test-agent' };
      await runner.run({
        ctx: baseCtx,
        message: 'Test message',
        clientContext,
        sink: () => {},
      });

      expect(capturedConfig.configurable.ctx).toEqual({
        ...baseCtx,
        clientContext,
      });
    });

    it('handles undefined params.message when not resuming by using empty HumanMessage and skips setTitleIfEmpty', async () => {
      let capturedInput: any;
      const threads = createMockThreads();
      const fakeGraph = createScriptedGraph([['updates', {}]], {
        onStream: (input) => {
          capturedInput = input;
        },
      });

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads,
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.run({
        ctx: baseCtx,
        // message is omitted / undefined
        sink: () => {},
      });

      expect(capturedInput).toEqual({
        messages: [new HumanMessage('')],
      });
      expect(threads.setTitleIfEmpty).not.toHaveBeenCalled();
    });

    it('does not set thread title when params.resume is present', async () => {
      const threads = createMockThreads();
      const fakeGraph = createScriptedGraph([['updates', {}]]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads,
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.run({
        ctx: baseCtx,
        message: 'Ignore title on resume',
        resume: { decisions: [{ callId: 'c-1', approve: true }] },
        sink: () => {},
      });

      expect(threads.setTitleIfEmpty).not.toHaveBeenCalled();
    });

    it('runs without setting a timeout timer when limits.timeoutMs is 0', async () => {
      const fakeGraph = createScriptedGraph([['updates', {}]]);
      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 0 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: baseCtx,
        message: 'No timeout',
        sink: (e) => events.push(e),
      });

      expect(events).toContainEqual({
        event: 'done',
        data: { usage: null },
      });
    });

    it('does not record usage when totalTokens is 0', async () => {
      const threads = createMockThreads();
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            agent: {
              messages: [
                new AIMessage({
                  content: 'Hello',
                  usage_metadata: {
                    total_tokens: 0,
                    input_tokens: 0,
                    output_tokens: 0,
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

      await runner.run({
        ctx: baseCtx,
        message: 'Zero token message',
        sink: () => {},
      });

      expect(threads.recordUsage).not.toHaveBeenCalled();
    });
  });

  describe('stream chunk and message filtering', () => {
    it('skips non-array chunks or chunks with fewer than 2 elements without throwing', async () => {
      const fakeGraph = createScriptedGraph([
        null,
        'non-array-chunk',
        123,
        [],
        ['messages'], // only 1 element
        [
          'messages',
          [
            new AIMessageChunk({ content: 'Valid token' }),
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
        ctx: baseCtx,
        message: 'Test chunks',
        sink: (e) => events.push(e),
      });

      expect(events).toContainEqual({
        event: 'token',
        data: { text: 'Valid token' },
      });
    });

    it('ignores message chunks from nodes other than "agent" and chunks with empty content', async () => {
      const fakeGraph = createScriptedGraph([
        ['messages', null],
        ['messages', ['not-enough-elements']],
        [
          'messages',
          [
            new AIMessageChunk({ content: 'From tools node' }),
            { langgraph_node: 'tools' }, // not 'agent'
          ],
        ],
        [
          'messages',
          [
            new AIMessageChunk({ content: '' }), // empty content
            { langgraph_node: 'agent' },
          ],
        ],
        [
          'messages',
          [
            { content: null }, // non-string content
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
        ctx: baseCtx,
        message: 'Filter test',
        sink: (e) => events.push(e),
      });

      expect(events.filter((e) => e.event === 'token')).toEqual([]);
    });

    it('ignores non-object or null updates payload', async () => {
      const fakeGraph = createScriptedGraph([
        ['updates', null],
        ['updates', 'string-payload'],
        ['updates', 12345],
      ]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: baseCtx,
        message: 'Null updates test',
        sink: (e) => events.push(e),
      });

      expect(events).toContainEqual({
        event: 'done',
        data: { usage: null },
      });
    });

    it('ignores usage_metadata when total_tokens is not a number', async () => {
      const threads = createMockThreads();
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            agent: {
              messages: [
                new AIMessage({
                  content: 'Test',
                  usage_metadata: { total_tokens: 'not-a-number' as any },
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
        ctx: baseCtx,
        message: 'Invalid usage metadata',
        sink: (e) => events.push(e),
      });

      expect(threads.recordUsage).not.toHaveBeenCalled();
      expect(events).toContainEqual({
        event: 'done',
        data: { usage: null },
      });
    });

    it('handles tool_calls with string args, invalid JSON args, validation failure, and summarize throwing', async () => {
      const throwingTool: AgentToolDef<{ query: string }> = {
        name: 'throwing_tool',
        domain: 'catalog',
        description: 'Tool whose summarize throws',
        schema: z.object({ query: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ ok: true }),
        summarize: () => {
          throw new Error('Summarize crashed');
        },
      };

      const customRegistry = new ToolRegistry([testTool, throwingTool]);

      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            agent: {
              messages: [
                new AIMessage({
                  content: '',
                  tool_calls: [
                    // Case 1: call.args is a valid JSON string
                    {
                      id: 'call-json-string',
                      name: 'search_catalog',
                      args: JSON.stringify({ query: 'áo sơ mi' }),
                    },
                    // Case 2: call.args is invalid JSON string
                    {
                      id: 'call-invalid-json',
                      name: 'search_catalog',
                      args: '{not-json',
                    },
                    // Case 3: call.args fails schema validation (query is not a string)
                    {
                      id: 'call-schema-fail',
                      name: 'search_catalog',
                      args: { query: 999 },
                    },
                    // Case 4: summarize throws error
                    {
                      id: 'call-throw-summarize',
                      name: 'throwing_tool',
                      args: { query: 'test' },
                    },
                    // Case 5: tool not in registry
                    {
                      id: 'call-unregistered',
                      name: 'unknown_tool',
                      args: { foo: 'bar' },
                    },
                    // Case 6: missing id and name
                    {
                      id: undefined,
                      name: undefined,
                      args: {},
                    },
                  ],
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
        ctx: baseCtx,
        message: 'Tool call edge cases',
        sink: (e) => events.push(e),
      });

      const toolStartEvents = events.filter((e) => e.event === 'tool_start');
      expect(toolStartEvents).toEqual([
        {
          event: 'tool_start',
          data: {
            id: 'call-json-string',
            name: 'search_catalog',
            summary: 'Tìm kiếm: áo sơ mi',
          },
        },
        {
          event: 'tool_start',
          data: {
            id: 'call-invalid-json',
            name: 'search_catalog',
            summary: 'search_catalog',
          },
        },
        {
          event: 'tool_start',
          data: {
            id: 'call-schema-fail',
            name: 'search_catalog',
            summary: 'search_catalog',
          },
        },
        {
          event: 'tool_start',
          data: {
            id: 'call-throw-summarize',
            name: 'throwing_tool',
            summary: 'throwing_tool',
          },
        },
        {
          event: 'tool_start',
          data: {
            id: 'call-unregistered',
            name: 'unknown_tool',
            summary: 'unknown_tool',
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

    it('ignores __interrupt__ items whose kind is not "confirm"', async () => {
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            __interrupt__: [
              null,
              { value: { kind: 'some_other_interrupt' } },
              { value: null },
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
        ctx: baseCtx,
        message: 'Non-confirm interrupt',
        sink: (e) => events.push(e),
      });

      expect(
        events.find((e) => e.event === 'confirm_required'),
      ).toBeUndefined();
      expect(events).toContainEqual({
        event: 'done',
        data: { usage: null },
      });
    });
  });

  describe('handleToolMessages edge cases', () => {
    it('handles content as pre-parsed object, invalid JSON string, error as object, and error > 200 chars', async () => {
      const longError = 'E'.repeat(300);

      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            tools: {
              messages: [
                // Case 1: content is already an object
                {
                  id: 'msg-id-1',
                  name: 'search_catalog',
                  content: { ok: true, data: { items: ['Test'] } },
                },
                // Case 2: content is invalid JSON string
                {
                  id: 'msg-id-2',
                  name: 'search_catalog',
                  content: 'invalid json string {',
                },
                // Case 3: error is an object
                {
                  id: 'msg-id-3',
                  name: 'search_catalog',
                  content: JSON.stringify({
                    ok: false,
                    error: { code: 'NOT_FOUND', detail: 'Missing record' },
                  }),
                },
                // Case 4: error is longer than 200 characters
                {
                  id: 'msg-id-4',
                  name: 'search_catalog',
                  content: JSON.stringify({
                    ok: false,
                    error: longError,
                  }),
                },
                // Case 5: missing tool_call_id, id, and name
                {
                  content: JSON.stringify({ ok: false, error: '' }),
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
        ctx: baseCtx,
        message: 'Tool message parsing test',
        sink: (e) => events.push(e),
      });

      const results = events.filter((e) => e.event === 'tool_result');
      expect(results).toEqual([
        {
          event: 'tool_result',
          data: {
            id: 'msg-id-1',
            name: 'search_catalog',
            ok: true,
            summary: 'Đã thực hiện thao tác',
          },
        },
        {
          event: 'tool_result',
          data: {
            id: 'msg-id-2',
            name: 'search_catalog',
            ok: false,
            summary: 'Thao tác không thành công.',
          },
        },
        {
          event: 'tool_result',
          data: {
            id: 'msg-id-3',
            name: 'search_catalog',
            ok: false,
            summary: '{"code":"NOT_FOUND","detail":"Missing record"}',
          },
        },
        {
          event: 'tool_result',
          data: {
            id: 'msg-id-4',
            name: 'search_catalog',
            ok: false,
            summary: longError.slice(0, 200),
          },
        },
        {
          event: 'tool_result',
          data: {
            id: '',
            name: '',
            ok: false,
            summary: 'Thao tác không thành công.',
          },
        },
      ]);
    });

    it('swallows error when def.uiAction throws or returns null', async () => {
      const toolWithThrowingUiAction: AgentToolDef<{ query: string }> = {
        name: 'ui_throw_tool',
        domain: 'catalog',
        description: 'Tool whose uiAction throws',
        schema: z.object({ query: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ ok: true }),
        summarize: (a) => a.query,
        uiAction: () => {
          throw new Error('uiAction failed');
        },
      };

      const toolWithNullUiAction: AgentToolDef<{ query: string }> = {
        name: 'ui_null_tool',
        domain: 'catalog',
        description: 'Tool whose uiAction returns null',
        schema: z.object({ query: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ ok: true }),
        summarize: (a) => a.query,
        uiAction: () => null as any,
      };

      const customRegistry = new ToolRegistry([
        toolWithThrowingUiAction,
        toolWithNullUiAction,
      ]);

      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            tools: {
              messages: [
                {
                  id: 'call-throw',
                  name: 'ui_throw_tool',
                  content: JSON.stringify({ ok: true, data: { q: '1' } }),
                },
                {
                  id: 'call-null',
                  name: 'ui_null_tool',
                  content: JSON.stringify({ ok: true, data: { q: '2' } }),
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
        ctx: baseCtx,
        message: 'uiAction edge cases',
        sink: (e) => events.push(e),
      });

      expect(events.filter((e) => e.event === 'ui_action')).toEqual([]);
    });

    it('does not emit sources if recommend_products returns sources that is not an array', async () => {
      const recommendTool: AgentToolDef<{ category: string }> = {
        name: 'recommend_products',
        domain: 'catalog',
        description: 'Gợi ý sản phẩm',
        schema: z.object({ category: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ ok: true }),
        summarize: (a) => a.category,
      };

      const customRegistry = new ToolRegistry([recommendTool]);

      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            tools: {
              messages: [
                {
                  id: 'call-rec',
                  name: 'recommend_products',
                  content: JSON.stringify({
                    ok: true,
                    data: { sources: 'not-an-array' },
                  }),
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
        ctx: baseCtx,
        message: 'Recommend not array sources',
        sink: (e) => events.push(e),
      });

      expect(events.filter((e) => e.event === 'sources')).toEqual([]);
    });
  });

  describe('stream cleanup and abort handling', () => {
    it('handles iterator.return throwing an exception without crashing runner', async () => {
      const graphWithFailingReturn: AgentRunnerDeps['graph'] = {
        stream() {
          return {
            [Symbol.asyncIterator]() {
              return {
                async next() {
                  return { done: true as const, value: undefined };
                },
                async return() {
                  throw new Error('Iterator return exploded');
                },
              };
            },
          };
        },
      };

      const runner = new AgentRunner({
        graph: graphWithFailingReturn,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await expect(
        runner.run({
          ctx: baseCtx,
          message: 'Clean iterator return test',
          sink: (e) => events.push(e),
        }),
      ).resolves.toBeUndefined();

      expect(events).toContainEqual({
        event: 'done',
        data: { usage: null },
      });
    });

    it('returns silently when aborted signal error occurs in catch block', async () => {
      const abortController = new AbortController();

      const throwingGraph: AgentRunnerDeps['graph'] = {
        async *stream() {
          abortController.abort();
          throw new Error('Stream failed after abort');
        },
      };

      const runner = new AgentRunner({
        graph: throwingGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: baseCtx,
        message: 'Abort in stream catch',
        signal: abortController.signal,
        sink: (e) => events.push(e),
      });

      expect(events.filter((e) => e.event === 'error')).toEqual([]);
    });
  });

  describe('readTranscript edge cases', () => {
    it('returns empty array when getState is not defined on graph', async () => {
      const runner = new AgentRunner({
        graph: { async *stream() {} }, // no getState
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      expect(await runner.readTranscript('th-1')).toEqual([]);
    });

    it('returns empty array when getState resolves to null or undefined', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => null,
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      expect(await runner.readTranscript('th-2')).toEqual([]);
    });

    it('reads messages from state.messages when state.values is undefined', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            messages: [
              new HumanMessage({ content: 'Xin chào', id: 'm-1' }),
              new AIMessage({ content: 'Chào bạn', id: 'm-2' }),
            ],
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-fallback');
      expect(transcript).toEqual([
        { id: 'm-1', role: 'user', content: 'Xin chào' },
        { id: 'm-2', role: 'assistant', content: 'Chào bạn' },
      ]);
    });

    it('returns empty array when rawMessages is not an array or has length 0', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            values: { messages: 'not-array' as any },
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      expect(await runner.readTranscript('th-empty')).toEqual([]);
    });

    it('skips non-object or null entries in rawMessages', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            values: {
              messages: [
                null,
                undefined,
                123,
                'a string',
                new HumanMessage({ content: 'Hợp lệ', id: 'valid-1' }),
              ],
            },
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-skips-primitives');
      expect(transcript).toEqual([
        { id: 'valid-1', role: 'user', content: 'Hợp lệ' },
      ]);
    });

    it('resolves message types via _getType, type property, role property, and ignores unknown types', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            values: {
              messages: [
                // _getType()
                {
                  _getType: () => 'human',
                  content: 'Message from _getType',
                  id: 'msg-1',
                },
                // type: 'user'
                {
                  type: 'user',
                  content: 'Message from type user',
                  id: 'msg-2',
                },
                // type: 'assistant'
                {
                  type: 'assistant',
                  content: 'Message from type assistant',
                  id: 'msg-3',
                },
                // role: 'user'
                {
                  role: 'user',
                  content: 'Message from role user',
                  id: 'msg-4',
                },
                // role: 'assistant'
                {
                  role: 'assistant',
                  content: 'Message from role assistant',
                  id: 'msg-5',
                },
                // Unknown role / type
                {
                  role: 'developer',
                  content: 'Ignore developer role',
                  id: 'msg-6',
                },
                {
                  type: 'function',
                  content: 'Ignore function type',
                  id: 'msg-7',
                },
              ],
            },
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-type-resolution');
      expect(transcript).toEqual([
        { id: 'msg-1', role: 'user', content: 'Message from _getType' },
        { id: 'msg-2', role: 'user', content: 'Message from type user' },
        {
          id: 'msg-3',
          role: 'assistant',
          content: 'Message from type assistant',
        },
        { id: 'msg-4', role: 'user', content: 'Message from role user' },
        {
          id: 'msg-5',
          role: 'assistant',
          content: 'Message from role assistant',
        },
      ]);
    });

    it('retains user messages even with empty content, and falls back id to index when id is null or empty string', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            values: {
              messages: [
                // User message with empty content and null id
                {
                  role: 'user',
                  content: '',
                  id: null,
                },
                // Assistant message with empty string id
                {
                  role: 'assistant',
                  content: 'Phản hồi',
                  id: '',
                },
                // Message with numeric id
                {
                  role: 'user',
                  content: 'Tin nhắn thứ 3',
                  id: 999,
                },
              ],
            },
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-id-fallback');
      expect(transcript).toEqual([
        { id: '0', role: 'user', content: '' },
        { id: '1', role: 'assistant', content: 'Phản hồi' },
        { id: '999', role: 'user', content: 'Tin nhắn thứ 3' },
      ]);
    });

    it('extractMessageContent handles plain strings array, block.type undefined, and non-text parts', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            values: {
              messages: [
                // Array of plain strings
                {
                  role: 'user',
                  content: ['Xin ', 'chào ', 'bạn'],
                  id: 'str-arr',
                },
                // Block with type undefined and block.text string
                {
                  role: 'assistant',
                  content: [
                    { text: 'Phần 1. ' },
                    null, // non-object part
                    'Phần 2. ', // string part
                    { type: 'image_url', url: 'https://img' }, // non-text block
                    { text: 'Phần 3.' },
                  ],
                  id: 'mixed-parts',
                },
                // Content is not string and not array
                {
                  role: 'user',
                  content: { nonString: true } as any,
                  id: 'invalid-content',
                },
              ],
            },
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-extract-content');
      expect(transcript).toEqual([
        { id: 'str-arr', role: 'user', content: 'Xin chào bạn' },
        {
          id: 'mixed-parts',
          role: 'assistant',
          content: 'Phần 1. Phần 2. Phần 3.',
        },
        { id: 'invalid-content', role: 'user', content: '' },
      ]);
    });
  });

  describe('assertResumable edge cases', () => {
    it('throws AgentNotPendingError when state is not an object or state.tasks is not an array', async () => {
      const runnerNonObject = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => 'not-an-object',
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await expect(
        runnerNonObject.assertResumable('th-non-obj', ['call-1']),
      ).rejects.toThrow(AgentNotPendingError);
    });

    it('handles tasks with null task, non-array interrupts, non-array calls, and non-string call ids', async () => {
      const runnerMalformed = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            tasks: [
              null,
              { interrupts: null },
              {
                interrupts: [
                  null,
                  { value: null },
                  { value: { calls: 'not-array' } },
                  {
                    value: {
                      calls: [
                        null,
                        { id: 123 }, // non-string id
                        { id: 'valid-call-1' },
                      ],
                    },
                  },
                ],
              },
            ],
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      // Valid call matches
      await expect(
        runnerMalformed.assertResumable('th-malformed', ['valid-call-1']),
      ).resolves.toBeUndefined();

      // Mismatch throws
      await expect(
        runnerMalformed.assertResumable('th-malformed', ['other-call']),
      ).rejects.toThrow(AgentNotPendingError);
    });

    it('throws AgentNotPendingError when duplicate callIds or mismatched sizes are provided', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            tasks: [
              {
                interrupts: [
                  {
                    value: {
                      calls: [{ id: 'call-1' }, { id: 'call-2' }],
                    },
                  },
                ],
              },
            ],
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      // Too few IDs
      await expect(
        runner.assertResumable('th-1', ['call-1']),
      ).rejects.toThrow(AgentNotPendingError);

      // Too many IDs
      await expect(
        runner.assertResumable('th-1', ['call-1', 'call-2', 'call-3']),
      ).rejects.toThrow(AgentNotPendingError);

      // Duplicate IDs
      await expect(
        runner.assertResumable('th-1', ['call-1', 'call-1']),
      ).rejects.toThrow(AgentNotPendingError);

      // Wrong ID
      await expect(
        runner.assertResumable('th-1', ['call-1', 'call-99']),
      ).rejects.toThrow(AgentNotPendingError);
    });
  });

  describe('deleteCheckpoints edge cases', () => {
    it('uses "agent" schema when checkpointer schema is empty string or only whitespace', async () => {
      const queryMock = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query: queryMock };

      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          checkpointer: { pool: mockPool, schema: '   ' },
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.deleteCheckpoints('thread-whitespace-schema');

      expect(queryMock).toHaveBeenCalledTimes(3);
      expect(queryMock).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['thread-whitespace-schema'],
      );
    });

    it('uses "agent" schema when checkpointer schema is not a string', async () => {
      const queryMock = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query: queryMock };

      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          checkpointer: { pool: mockPool, schema: 12345 },
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.deleteCheckpoints('thread-numeric-schema');

      expect(queryMock).toHaveBeenCalledTimes(3);
      expect(queryMock).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['thread-numeric-schema'],
      );
    });

    it('logs warning when checkpointer is null or has neither pool nor deleteThread', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          checkpointer: null,
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await expect(
        runner.deleteCheckpoints('thread-null-checkpointer'),
      ).resolves.toBeUndefined();
    });
  });
});
