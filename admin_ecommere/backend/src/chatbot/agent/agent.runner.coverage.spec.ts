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
  chunks: Array<[string, unknown]>,
  options?: {
    getState?: (config: unknown) => unknown;
    checkpointer?: unknown;
    onReturn?: () => Promise<void> | void;
  },
): AgentRunnerDeps['graph'] {
  return {
    async *stream() {
      try {
        for (const chunk of chunks) {
          yield chunk;
        }
      } finally {
        if (options?.onReturn) {
          await options.onReturn();
        }
      }
    },
    getState: options?.getState,
    checkpointer: options?.checkpointer,
  };
}

describe('AgentRunner Coverage Suite', () => {
  let registry: ToolRegistry;
  let testTool: AgentToolDef<{ query: string }>;
  let failingUiActionTool: AgentToolDef<{ val: number }>;
  let recommendProductsTool: AgentToolDef<{ category: string }>;

  const adminCtx: ToolContext = {
    userId: 'admin-cov-1',
    role: 'ADMIN',
    app: 'ADMIN',
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
      description: 'Search catalog',
      schema: z.object({ query: z.string() }).strict(),
      auth: 'admin',
      risk: 'READ',
      handler: jest.fn().mockResolvedValue({ items: ['Item 1'] }),
      summarize: (args) => `Tìm kiếm: ${args.query}`,
      uiAction: (data: any) => {
        if (data?.skip) return undefined;
        return { type: 'SHOW_MODAL', payload: data };
      },
    };

    failingUiActionTool = {
      name: 'failing_ui_tool',
      domain: 'system',
      description: 'Tool with throwing uiAction',
      schema: z.object({ val: z.number() }),
      auth: 'admin',
      risk: 'READ',
      handler: jest.fn().mockResolvedValue({ ok: true }),
      summarize: () => 'Failing UI tool',
      uiAction: () => {
        throw new Error('uiAction crashed');
      },
    };

    recommendProductsTool = {
      name: 'recommend_products',
      domain: 'catalog',
      description: 'Gợi ý sản phẩm',
      schema: z.object({ category: z.string() }).strict(),
      auth: 'public',
      risk: 'READ',
      handler: jest.fn().mockResolvedValue({}),
      summarize: () => 'Gợi ý',
    };

    registry = new ToolRegistry([
      testTool,
      failingUiActionTool,
      recommendProductsTool,
    ]);
  });

  describe('Custom Error Classes', () => {
    it('AgentBusyError defaults to Vietnamese message and preserves error name and prototype', () => {
      const err = new AgentBusyError();
      expect(err).toBeInstanceOf(AgentBusyError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('AgentBusyError');
      expect(err.message).toBe('Cuộc trò chuyện đang được xử lý');

      const customErr = new AgentBusyError('Custom busy message');
      expect(customErr.message).toBe('Custom busy message');
    });

    it('AgentNotPendingError defaults to Vietnamese message and preserves error name and prototype', () => {
      const err = new AgentNotPendingError();
      expect(err).toBeInstanceOf(AgentNotPendingError);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('AgentNotPendingError');
      expect(err.message).toBe('Không có thao tác nào đang chờ xác nhận');

      const customErr = new AgentNotPendingError('Custom not pending message');
      expect(customErr.message).toBe('Custom not pending message');
    });
  });

  describe('isThreadRunning and now dependency', () => {
    it('isThreadRunning reports false before and after run, and true during execution', async () => {
      let release!: () => void;
      const gate = new Promise<void>((r) => {
        release = r;
      });

      const blockingGraph: AgentRunnerDeps['graph'] = {
        async *stream() {
          await gate;
          yield ['updates', {}];
        },
      };

      const customNow = jest.fn().mockReturnValue(1700000000000);
      const runner = new AgentRunner({
        graph: blockingGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
        now: customNow,
      });

      expect(runner.isThreadRunning(adminCtx.threadId)).toBe(false);

      const runPromise = runner.run({
        ctx: adminCtx,
        message: 'Test running state',
        sink: () => {},
      });

      expect(runner.isThreadRunning(adminCtx.threadId)).toBe(true);

      release();
      await runPromise;

      expect(runner.isThreadRunning(adminCtx.threadId)).toBe(false);
    });

    it('isThreadRunning reports false after run fails with an error', async () => {
      const throwingGraph: AgentRunnerDeps['graph'] = {
        async *stream() {
          throw new Error('Graph crash');
        },
      };

      const runner = new AgentRunner({
        graph: throwingGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.run({
        ctx: adminCtx,
        message: 'Crash',
        sink: () => {},
      });

      expect(runner.isThreadRunning(adminCtx.threadId)).toBe(false);
    });
  });

  describe('readTranscript branches and edge cases', () => {
    it('returns empty array when rawMessages is not an array or state has no messages', async () => {
      const runnerNonArrayMessages = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({ messages: 'not-an-array' }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const res = await runnerNonArrayMessages.readTranscript('th-1');
      expect(res).toEqual([]);

      const runnerEmptyArray = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({ messages: [] }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const resEmpty = await runnerEmptyArray.readTranscript('th-2');
      expect(resEmpty).toEqual([]);
    });

    it('handles direct state.messages without values wrapper', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            messages: [
              { role: 'user', content: 'Tin nhắn trực tiếp', id: 'm-1' },
              { role: 'assistant', content: 'Phản hồi trực tiếp', id: 'm-2' },
            ],
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-direct');
      expect(transcript).toEqual([
        { id: 'm-1', role: 'user', content: 'Tin nhắn trực tiếp' },
        { id: 'm-2', role: 'assistant', content: 'Phản hồi trực tiếp' },
      ]);
    });

    it('resolves message types with _getType, .type, and .role, skipping unknown types or non-object items', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            messages: [
              null,
              123,
              'not-an-object',
              { _getType: () => 'human', content: 'From _getType', id: '1' },
              { type: 'ai', content: 'From type ai', id: '2' },
              { type: 'human', content: 'From type human', id: '3' },
              { role: 'assistant', content: 'From role assistant', id: '4' },
              { role: 'system', content: 'Ignored system' },
              { content: 'No type or role info' },
              {},
            ],
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-types');
      expect(transcript).toEqual([
        { id: '1', role: 'user', content: 'From _getType' },
        { id: '2', role: 'assistant', content: 'From type ai' },
        { id: '3', role: 'user', content: 'From type human' },
        { id: '4', role: 'assistant', content: 'From role assistant' },
      ]);
    });

    it('extractMessageContent handles string arrays, blocks with undefined type, non-text blocks, and invalid content types', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            messages: [
              {
                role: 'user',
                content: ['Chuỗi thứ 1, ', 'chuỗi thứ 2'],
                id: 'c-1',
              },
              {
                role: 'assistant',
                content: [
                  null,
                  42,
                  { text: 'Khối text không có type. ' },
                  { type: 'image_url', url: 'https://example.com' },
                  { type: 'text', text: 'Khối text có type.' },
                  { type: 'text', text: 999 },
                ],
                id: 'c-2',
              },
              {
                role: 'user',
                content: 12345, // Not string or array
                id: 'c-3',
              },
            ],
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-content-parts');
      expect(transcript).toEqual([
        { id: 'c-1', role: 'user', content: 'Chuỗi thứ 1, chuỗi thứ 2' },
        {
          id: 'c-2',
          role: 'assistant',
          content: 'Khối text không có type. Khối text có type.',
        },
        { id: 'c-3', role: 'user', content: '' },
      ]);
    });

    it('falls back to message index when message id is empty string or null', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            messages: [
              { role: 'user', content: 'Empty string id', id: '' },
              { role: 'assistant', content: 'Null id', id: null },
            ],
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-falsy-ids');
      expect(transcript).toEqual([
        { id: '0', role: 'user', content: 'Empty string id' },
        { id: '1', role: 'assistant', content: 'Null id' },
      ]);
    });

    it('parses JSON string args and preserves invalid JSON string args in tool calls', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            messages: [
              {
                role: 'assistant',
                content: 'Running tool',
                id: 'call-msg',
                tool_calls: [
                  {
                    id: 'c1',
                    name: 'search_catalog',
                    args: JSON.stringify({ query: 'sơn xịt' }),
                  },
                  {
                    id: 'c2',
                    name: 'unregistered_tool',
                    args: '{not valid json',
                  },
                  {
                    id: null,
                    name: null,
                    args: undefined,
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

      const transcript = await runner.readTranscript('th-args-parsing');
      expect(transcript).toHaveLength(1);
      const toolCalls = transcript[0].tool_calls!;
      expect(toolCalls).toHaveLength(3);

      expect(toolCalls[0]).toEqual({
        id: 'c1',
        name: 'search_catalog',
        args: { query: 'sơn xịt' },
        risk: 'READ',
        summary: 'Tìm kiếm: sơn xịt',
      });
      expect(toolCalls[1]).toEqual({
        id: 'c2',
        name: 'unregistered_tool',
        args: '{not valid json',
      });
      expect(toolCalls[2]).toEqual({
        name: '',
      });
    });

    it('handles tool summarization branches when schema validation fails or summarize throws', async () => {
      const toolWithFailingSchema: AgentToolDef<any> = {
        name: 'tool_fail_schema',
        domain: 'test',
        description: 'Tool',
        schema: {
          safeParse: () => ({ success: false, error: new Error('schema err') }),
        } as any,
        auth: 'public',
        risk: 'READ',
        handler: jest.fn(),
        summarize: (args) =>
          args?.query ? `Tóm tắt: ${args.query}` : undefined,
      };

      const toolWithThrowingSchema: AgentToolDef<any> = {
        name: 'tool_throw_schema',
        domain: 'test',
        description: 'Tool',
        schema: {
          safeParse: () => {
            throw new Error('Schema crash');
          },
        } as any,
        auth: 'public',
        risk: 'WRITE',
        handler: jest.fn(),
        summarize: () => {
          throw new Error('Summarize crash');
        },
      };

      const customRegistry = new ToolRegistry([
        toolWithFailingSchema,
        toolWithThrowingSchema,
      ]);

      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            messages: [
              {
                role: 'assistant',
                content: '',
                id: 'msg-sum',
                tool_calls: [
                  {
                    id: 'call-fail-schema',
                    name: 'tool_fail_schema',
                    args: { query: 'laptop' },
                  },
                  {
                    id: 'call-fail-schema-empty',
                    name: 'tool_fail_schema',
                    args: {},
                  },
                  {
                    id: 'call-throw',
                    name: 'tool_throw_schema',
                    args: { val: 1 },
                  },
                ],
              },
            ],
          }),
        },
        registry: customRegistry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-sum-branches');
      const calls = transcript[0].tool_calls!;

      expect(calls[0].summary).toBe('Tóm tắt: laptop');
      expect(calls[1].summary).toBe('tool_fail_schema');
      expect(calls[2].summary).toBe('tool_throw_schema');
    });

    it('sets hasToolMessageAfter true when a message has tool_call_id property', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({
            messages: [
              {
                role: 'assistant',
                id: 'ai-call',
                tool_calls: [
                  {
                    id: 'call-1',
                    name: 'search_catalog',
                    args: { query: 'abc' },
                  },
                ],
              },
              null, // non-object message in loop
              {
                role: 'other',
                tool_call_id: 'call-1',
                content: '{"ok":true}',
              },
            ],
          }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const transcript = await runner.readTranscript('th-tool-id-after');
      expect(transcript).toHaveLength(1);
      expect(transcript[0].pending).toBeUndefined();
    });
  });

  describe('assertResumable edge cases', () => {
    it('throws AgentNotPendingError when state.tasks is not an array or has non-matching tasks', async () => {
      const runnerNonArrayTasks = new AgentRunner({
        graph: {
          async *stream() {},
          getState: async () => ({ tasks: 'invalid-tasks' }),
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await expect(
        runnerNonArrayTasks.assertResumable('th-non-array', ['call-1']),
      ).rejects.toThrow(AgentNotPendingError);
    });

    it('ignores null tasks, non-array interrupts, non-array calls, or calls without string id', async () => {
      const runner = new AgentRunner({
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
                  { value: { calls: null } },
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

      await expect(
        runner.assertResumable('th-malformed', ['valid-call-1']),
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteCheckpoints branches', () => {
    it('defaults schema to agent when checkpointer schema is empty, whitespace, or undefined', async () => {
      const queryMock = jest.fn().mockResolvedValue({ rowCount: 0 });
      const mockPool = { query: queryMock };

      const runnerWhitespace = new AgentRunner({
        graph: {
          async *stream() {},
          checkpointer: { pool: mockPool, schema: '   ' },
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runnerWhitespace.deleteCheckpoints('th-schema-ws');
      expect(queryMock).toHaveBeenCalledWith(
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['th-schema-ws'],
      );

      queryMock.mockClear();
      const runnerUndefinedSchema = new AgentRunner({
        graph: {
          async *stream() {},
          checkpointer: { pool: mockPool, schema: undefined },
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runnerUndefinedSchema.deleteCheckpoints('th-schema-undef');
      expect(queryMock).toHaveBeenCalledWith(
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['th-schema-undef'],
      );
    });

    it('logs warning when checkpointer is null or has no pool and no deleteThread', async () => {
      const runner = new AgentRunner({
        graph: {
          async *stream() {},
          checkpointer: null,
        },
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const warnSpy = jest.spyOn((runner as any).logger, 'warn');
      await runner.deleteCheckpoints('th-no-checkpointer');

      expect(warnSpy).toHaveBeenCalledWith(
        'Không tìm thấy pool để xóa checkpoints cho thread th-no-checkpointer',
      );
    });
  });

  describe('handleToolMessages and tool results processing', () => {
    it('handles tool message with object content, fallback id, error object, and long error truncation', async () => {
      const longError = 'Error '.repeat(50); // 300 chars > 200
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            tools: {
              messages: [
                {
                  id: 'fallback-id-1', // no tool_call_id
                  name: '', // empty name
                  content: { ok: false, error: { detail: 'Database error' } },
                },
                {
                  tool_call_id: 'call-long-err',
                  name: 'test_tool',
                  content: JSON.stringify({ ok: false, error: longError }),
                },
                {
                  tool_call_id: 'call-empty-err',
                  name: 'test_tool',
                  content: JSON.stringify({ ok: false, error: '' }),
                },
                {
                  tool_call_id: 'call-bad-json',
                  name: 'test_tool',
                  content: '{not-json',
                },
                {
                  tool_call_id: 'call-num-content',
                  name: 'test_tool',
                  content: 42,
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
        ctx: adminCtx,
        message: 'Handle tool results',
        sink: (e) => events.push(e),
      });

      const toolResults = events.filter((e) => e.event === 'tool_result');
      expect(toolResults).toHaveLength(5);

      expect(toolResults[0].data).toEqual({
        id: 'fallback-id-1',
        name: '',
        ok: false,
        summary: JSON.stringify({ detail: 'Database error' }).slice(0, 200),
      });
      expect(toolResults[1].data.summary.length).toBe(200);
      expect(toolResults[2].data.summary).toBe('Thao tác không thành công.');
      expect(toolResults[3].data.summary).toBe('Thao tác không thành công.');
      expect(toolResults[4].data.summary).toBe('Thao tác không thành công.');
    });

    it('swallows uiAction exceptions and skips ui_action event when uiAction returns undefined', async () => {
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            tools: {
              messages: [
                {
                  tool_call_id: 'call-failing-ui',
                  name: 'failing_ui_tool',
                  content: JSON.stringify({ ok: true, data: {} }),
                },
                {
                  tool_call_id: 'call-skip-ui',
                  name: 'search_catalog',
                  content: JSON.stringify({ ok: true, data: { skip: true } }),
                },
                {
                  tool_call_id: 'call-rec-no-sources',
                  name: 'recommend_products',
                  content: JSON.stringify({
                    ok: true,
                    data: { sources: 'not-array' },
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
        ctx: adminCtx,
        message: 'Test uiAction fallbacks',
        sink: (e) => events.push(e),
      });

      expect(events.filter((e) => e.event === 'ui_action')).toHaveLength(0);
      expect(events.filter((e) => e.event === 'sources')).toHaveLength(0);
    });
  });

  describe('execute stream execution branches and edge cases', () => {
    it('disables timeout timer when timeoutMs is 0 or negative', async () => {
      const fakeGraph = createScriptedGraph([['updates', {}]]);
      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 0 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: adminCtx,
        message: 'No timeout timer',
        sink: (e) => events.push(e),
      });

      expect(events.some((e) => e.event === 'done')).toBe(true);
    });

    it('passes clientContext to ctx when provided in run params', async () => {
      let capturedCtx: any;
      const fakeGraph: AgentRunnerDeps['graph'] = {
        async *stream(_input: any, config: any) {
          capturedCtx = config.configurable.ctx;
          yield ['updates', {}];
        },
      };

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.run({
        ctx: adminCtx,
        message: 'Context test',
        clientContext: { currentTab: 'products' },
        sink: () => {},
      });

      expect(capturedCtx.clientContext).toEqual({ currentTab: 'products' });
    });

    it('uses empty string HumanMessage when params.message is undefined in normal run', async () => {
      let capturedInput: any;
      const fakeGraph: AgentRunnerDeps['graph'] = {
        async *stream(input: any) {
          capturedInput = input;
          yield ['updates', {}];
        },
      };

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.run({
        ctx: adminCtx,
        sink: () => {},
      });

      expect(capturedInput.messages).toBeDefined();
      expect(capturedInput.messages[0].content).toBe('');
    });

    it('ignores malformed stream chunks or messages chunks not matching agent node', async () => {
      const fakeGraph = createScriptedGraph([
        null as any,
        ['single-element'] as any,
        ['messages', [{ content: 'Ignore me' }, { langgraph_node: 'tools' }]],
        ['messages', [{ content: '' }, { langgraph_node: 'agent' }]],
        ['messages', [{ content: 123 }, { langgraph_node: 'agent' }]],
        ['messages', 'not-array-payload' as any],
      ]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await runner.run({
        ctx: adminCtx,
        message: 'Ignore chunks',
        sink: (e) => events.push(e),
      });

      expect(events.filter((e) => e.event === 'token')).toHaveLength(0);
    });

    it('handles tool calls in node agent updates with json args, unmapped tool, or throwing summarize', async () => {
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            agent: {
              messages: [
                {
                  usage_metadata: { total_tokens: 'not-a-number' }, // invalid tokens
                  tool_calls: [
                    {
                      id: null,
                      name: null,
                    },
                    {
                      id: 'c-valid-json',
                      name: 'search_catalog',
                      args: JSON.stringify({ query: 'áo thun' }),
                    },
                    {
                      id: 'c-bad-json',
                      name: 'unregistered',
                      args: '{bad-json',
                    },
                  ],
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
        ctx: adminCtx,
        message: 'Tool starts',
        sink: (e) => events.push(e),
      });

      const starts = events.filter((e) => e.event === 'tool_start');
      expect(starts).toHaveLength(3);
      expect(starts[0].data).toEqual({ id: '', name: '', summary: '' });
      expect(starts[1].data).toEqual({
        id: 'c-valid-json',
        name: 'search_catalog',
        summary: 'Tìm kiếm: áo thun',
      });
      expect(starts[2].data).toEqual({
        id: 'c-bad-json',
        name: 'unregistered',
        summary: 'unregistered',
      });
    });

    it('ignores non-confirm interrupts in payload.__interrupt__', async () => {
      const fakeGraph = createScriptedGraph([
        [
          'updates',
          {
            __interrupt__: [{ value: { kind: 'other_interrupt' } }],
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
        ctx: adminCtx,
        message: 'Non-confirm interrupt',
        sink: (e) => events.push(e),
      });

      expect(events.some((e) => e.event === 'confirm_required')).toBe(false);
      expect(events.some((e) => e.event === 'done')).toBe(true);
    });

    it('swallows errors when iterator.return throws in finally', async () => {
      let returnCalled = false;
      const fakeGraph: AgentRunnerDeps['graph'] = {
        stream() {
          return {
            [Symbol.asyncIterator]() {
              return {
                async next() {
                  return { done: true, value: undefined };
                },
                async return() {
                  returnCalled = true;
                  throw new Error('iterator.return crashed');
                },
              };
            },
          };
        },
      };

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads: createMockThreads(),
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      const events: AgentStreamEvent[] = [];
      await expect(
        runner.run({
          ctx: adminCtx,
          message: 'Safe return test',
          sink: (e) => events.push(e),
        }),
      ).resolves.toBeUndefined();

      expect(returnCalled).toBe(true);
      expect(events.some((e) => e.event === 'done')).toBe(true);
    });

    it('does not call recordUsage when totalTokens is 0 and does not call setTitleIfEmpty on resume', async () => {
      const threads = createMockThreads();
      const fakeGraph = createScriptedGraph([['updates', {}]]);

      const runner = new AgentRunner({
        graph: fakeGraph,
        registry,
        threads,
        limits: { maxSteps: 5, timeoutMs: 5000 },
      });

      await runner.run({
        ctx: adminCtx,
        resume: { decisions: [{ callId: 'c1', approve: true }] },
        sink: () => {},
      });

      expect(threads.recordUsage).not.toHaveBeenCalled();
      expect(threads.setTitleIfEmpty).not.toHaveBeenCalled();
    });

    it('returns silently when aborted signal fires after stream throws', async () => {
      const abortCtrl = new AbortController();
      const throwingGraph: AgentRunnerDeps['graph'] = {
        async *stream() {
          abortCtrl.abort();
          throw new Error('Post abort error');
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
        ctx: adminCtx,
        message: 'Abort during error',
        signal: abortCtrl.signal,
        sink: (e) => events.push(e),
      });

      expect(events.filter((e) => e.event === 'error')).toHaveLength(0);
    });
  });
});
