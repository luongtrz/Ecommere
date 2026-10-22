import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import {
  END,
  type LangGraphRunnableConfig,
  interrupt,
} from '@langchain/langgraph';
import { z } from 'zod';
import {
  getTodayVietnam,
  getContext,
  getZodErrorMessage,
  findLastAIMessage,
  routeAfterAgent,
  createAgentNode,
  createConfirmNode,
  createToolsNode,
} from './agent.nodes';
import { ToolRegistry } from '../tools/tool.registry';
import type { AgentToolDef, ToolContext } from '../tools/tool.types';
import type { AgentGraphDeps, AgentModelLike } from './agent.graph';

jest.mock('@langchain/langgraph', () => {
  const actual = jest.requireActual('@langchain/langgraph');
  return {
    __esModule: true,
    ...actual,
    interrupt: jest.fn(),
  };
});

describe('Agent Nodes', () => {
  const mockInterrupt = interrupt as unknown as jest.Mock;

  const guestCtx: ToolContext = {
    userId: null,
    role: 'GUEST',
    app: 'USER',
    threadId: 'th-guest',
  };

  const customerCtx: ToolContext = {
    userId: 'user-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'th-cust',
  };

  const adminCtx: ToolContext = {
    userId: 'admin-1',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'th-admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodayVietnam', () => {
    it('returns Vietnam date (UTC+7) using default parameter', () => {
      const today = getTodayVietnam();
      expect(typeof today).toBe('string');
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('calculates Vietnam date correctly with an explicit timestamp across midnight UTC', () => {
      // 2026-05-15 20:00:00 UTC + 7h = 2026-05-16 03:00:00 UTC+7
      const eveningUtc = new Date('2026-05-15T20:00:00.000Z').getTime();
      expect(getTodayVietnam(eveningUtc)).toBe('2026-05-16');

      // 2026-05-15 12:00:00 UTC + 7h = 2026-05-15 19:00:00 UTC+7
      const noonUtc = new Date('2026-05-15T12:00:00.000Z').getTime();
      expect(getTodayVietnam(noonUtc)).toBe('2026-05-15');
    });
  });

  describe('getContext', () => {
    it('returns default guest context when config is undefined', () => {
      expect(getContext(undefined)).toEqual({
        userId: null,
        role: 'GUEST',
        app: 'USER',
        threadId: '',
      });
    });

    it('returns default context when config or configurable has no ctx', () => {
      expect(getContext({})).toEqual({
        userId: null,
        role: 'GUEST',
        app: 'USER',
        threadId: '',
      });

      expect(getContext({ configurable: {} })).toEqual({
        userId: null,
        role: 'GUEST',
        app: 'USER',
        threadId: '',
      });

      expect(getContext({ configurable: { ctx: undefined } })).toEqual({
        userId: null,
        role: 'GUEST',
        app: 'USER',
        threadId: '',
      });
    });

    it('returns provided context when config.configurable.ctx is defined', () => {
      const config: LangGraphRunnableConfig = {
        configurable: { ctx: customerCtx },
      };
      expect(getContext(config)).toEqual(customerCtx);
    });
  });

  describe('getZodErrorMessage', () => {
    it('returns fallback message when issues array is empty or undefined', () => {
      expect(getZodErrorMessage({ issues: [] })).toBe('Tham số không hợp lệ');
      expect(getZodErrorMessage({ issues: undefined as any })).toBe(
        'Tham số không hợp lệ',
      );
    });

    it('returns fallback message when message is empty or does not contain Vietnamese characters', () => {
      expect(
        getZodErrorMessage({
          issues: [{ message: 'Invalid input string' }],
        }),
      ).toBe('Tham số không hợp lệ');

      expect(
        getZodErrorMessage({
          issues: [{ message: '' }],
        }),
      ).toBe('Tham số không hợp lệ');
    });

    it('returns message when it contains Vietnamese characters', () => {
      expect(
        getZodErrorMessage({
          issues: [{ message: 'Số điện thoại không hợp lệ' }],
        }),
      ).toBe('Số điện thoại không hợp lệ');

      expect(
        getZodErrorMessage({
          issues: [{ message: 'Trường này là bắt buộc' }],
        }),
      ).toBe('Trường này là bắt buộc');
    });
  });

  describe('findLastAIMessage', () => {
    it('returns undefined when message list is empty or has no AI messages', () => {
      expect(findLastAIMessage([])).toBeUndefined();
      expect(
        findLastAIMessage([
          new HumanMessage('hi'),
          new ToolMessage({ tool_call_id: 'call-1', content: 'ok' }),
        ]),
      ).toBeUndefined();
    });

    it('handles message objects without getType gracefully', () => {
      const plainObj = { content: 'test' } as any;
      expect(findLastAIMessage([plainObj])).toBeUndefined();
    });

    it('returns the last AI message when multiple exist', () => {
      const ai1 = new AIMessage('first AI');
      const human = new HumanMessage('reply');
      const ai2 = new AIMessage('second AI');
      expect(findLastAIMessage([ai1, human, ai2])).toBe(ai2);
    });
  });

  describe('routeAfterAgent', () => {
    it('returns END when state has no messages', () => {
      expect(routeAfterAgent({ messages: [] })).toBe(END);
    });

    it('returns END when last message is not an AIMessage', () => {
      expect(
        routeAfterAgent({ messages: [new HumanMessage('User message')] }),
      ).toBe(END);
    });

    it('returns END when last AIMessage has no tool_calls or empty tool_calls', () => {
      expect(
        routeAfterAgent({
          messages: [new AIMessage({ content: 'Just text' })],
        }),
      ).toBe(END);

      expect(
        routeAfterAgent({
          messages: [
            new AIMessage({ content: 'Text', tool_calls: null as any }),
          ],
        }),
      ).toBe(END);

      expect(
        routeAfterAgent({
          messages: [new AIMessage({ content: 'Text', tool_calls: [] })],
        }),
      ).toBe(END);
    });

    it('returns confirm when last AIMessage has at least one tool call', () => {
      expect(
        routeAfterAgent({
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                {
                  id: 'call-1',
                  name: 'test_tool',
                  args: {},
                },
              ],
            }),
          ],
        }),
      ).toBe('confirm');
    });
  });

  describe('createAgentNode', () => {
    it('creates agent node, invokes model with bound tools and trimmed history, and exercises tool dummy func', async () => {
      let boundToolsList: any[] = [];
      const mockModel: AgentModelLike = {
        bindTools: jest.fn().mockImplementation((specs: any[]) => {
          boundToolsList = specs;
          return {
            invoke: jest
              .fn()
              .mockResolvedValue(new AIMessage('agent response')),
          };
        }),
      };

      const testToolDef: AgentToolDef<{ query: string }> = {
        name: 'sample_tool',
        domain: 'catalog',
        description: 'Mô tả công cụ',
        schema: z.object({ query: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ result: 'ok' }),
        summarize: (args) => `Tìm kiếm: ${args.query}`,
      };
      const registry = new ToolRegistry([testToolDef]);

      const deps: AgentGraphDeps = {
        model: mockModel,
        registry,
        checkpointer: null as any,
        audit: { record: jest.fn().mockResolvedValue(undefined) },
        limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
      };

      const agentNode = createAgentNode(deps);

      // Call without config (tests getContext(undefined) branch in node)
      const resWithoutConfig = await agentNode({
        messages: [new HumanMessage('Hello')],
      });
      expect(resWithoutConfig.messages).toHaveLength(1);
      expect(resWithoutConfig.messages[0].content).toBe('agent response');

      // Call with config
      const resWithConfig = await agentNode(
        { messages: [new HumanMessage('Hello again')] },
        { configurable: { ctx: customerCtx } },
      );
      expect(resWithConfig.messages).toHaveLength(1);

      // Verify that specs passed to bindTools has the registered tool
      expect(boundToolsList).toHaveLength(1);
      const createdTool = boundToolsList[0];
      expect(createdTool.name).toBe('sample_tool');

      // CRITICAL: Exercise the dummy async function `async () => ''` in `tool(async () => '', ...)`
      if (typeof createdTool.func === 'function') {
        const dummyResult = await createdTool.func();
        expect(dummyResult).toBe('');
      }
      if (typeof createdTool.invoke === 'function') {
        const dummyInvokeRes = await createdTool.invoke({ query: 'test' });
        expect(dummyInvokeRes).toBe('');
      }
    });
  });

  describe('createConfirmNode', () => {
    let mockAuditRecord: jest.Mock;

    const createDeps = (tools: AgentToolDef[] = []): AgentGraphDeps => ({
      model: null as any,
      registry: new ToolRegistry(tools),
      checkpointer: null as any,
      audit: { record: mockAuditRecord },
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    beforeEach(() => {
      mockAuditRecord = jest.fn().mockResolvedValue(undefined);
    });

    it('returns empty object when last AIMessage is undefined or has no tool_calls', async () => {
      const confirmNode = createConfirmNode(createDeps());

      const res1 = await confirmNode({ messages: [] });
      expect(res1).toEqual({});

      const res2 = await confirmNode({
        messages: [new HumanMessage('hi')],
      });
      expect(res2).toEqual({});

      const res3 = await confirmNode({
        messages: [new AIMessage({ content: 'hi', tool_calls: [] })],
      });
      expect(res3).toEqual({});
    });

    it('returns empty object when tool calls do not require confirmation', async () => {
      const readTool: AgentToolDef<{ id: string }> = {
        name: 'read_info',
        domain: 'catalog',
        description: 'Read info',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn(),
        summarize: (args) => `Read ${args.id}`,
      };

      const confirmNode = createConfirmNode(createDeps([readTool]));
      const res = await confirmNode(
        {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                { id: 'call-1', name: 'read_info', args: { id: 'x' } },
              ],
            }),
          ],
        },
        { configurable: { ctx: customerCtx } },
      );

      expect(res).toEqual({});
      expect(mockInterrupt).not.toHaveBeenCalled();
    });

    it('defaults risk to DESTRUCTIVE and summary to name when tool is not registered', async () => {
      mockInterrupt.mockReturnValue({
        decisions: [{ callId: 'call-unregistered', approve: true }],
      });

      const confirmNode = createConfirmNode(createDeps());
      const res = await confirmNode(
        {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                {
                  id: 'call-unregistered',
                  name: 'unknown_tool',
                  args: { foo: 'bar' },
                },
              ],
            }),
          ],
        },
        { configurable: { ctx: customerCtx } },
      );

      expect(mockInterrupt).toHaveBeenCalledTimes(1);
      const payload = mockInterrupt.mock.calls[0][0];
      expect(payload.kind).toBe('confirm');
      expect(payload.calls[0]).toEqual({
        id: 'call-unregistered',
        name: 'unknown_tool',
        summary: 'unknown_tool',
        risk: 'DESTRUCTIVE',
      });
      expect(res).toEqual({ messages: [] });
    });

    it('falls back summary to name when def.schema.safeParse fails', async () => {
      const destructiveTool: AgentToolDef<{ target: string }> = {
        name: 'delete_target',
        domain: 'account',
        description: 'Delete target',
        schema: z.object({ target: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Delete ${args.target}`,
      };

      mockInterrupt.mockReturnValue({
        decisions: [{ callId: 'call-invalid-args', approve: true }],
      });

      const confirmNode = createConfirmNode(createDeps([destructiveTool]));
      await confirmNode(
        {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                {
                  id: 'call-invalid-args',
                  name: 'delete_target',
                  args: { target: 12345 as any }, // fails schema
                },
              ],
            }),
          ],
        },
        { configurable: { ctx: customerCtx } },
      );

      const payload = mockInterrupt.mock.calls[0][0];
      expect(payload.calls[0].summary).toBe('delete_target');
    });

    it('catches error thrown by schema safeParse and falls back summary to tool name', async () => {
      const faultyTool: AgentToolDef = {
        name: 'faulty_schema_tool',
        domain: 'account',
        description: 'Throws in safeParse',
        schema: {
          safeParse: () => {
            throw new Error('Schema crash');
          },
        } as any,
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: () => 'Faulty',
      };

      mockInterrupt.mockReturnValue({ decisions: [] });

      const confirmNode = createConfirmNode(createDeps([faultyTool]));
      await confirmNode(
        {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                { id: 'call-faulty', name: 'faulty_schema_tool', args: {} },
              ],
            }),
          ],
        },
        { configurable: { ctx: customerCtx } },
      );

      const payload = mockInterrupt.mock.calls[0][0];
      expect(payload.calls[0].summary).toBe('faulty_schema_tool');
    });

    it('uses preview text when preview succeeds with non-empty string, and falls back to summarize if preview throws or returns empty', async () => {
      const toolWithWorkingPreview: AgentToolDef<{ id: string }> = {
        name: 'tool_preview_ok',
        domain: 'account',
        description: 'Preview works',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        preview: jest.fn().mockResolvedValue('Chi tiết xem trước'),
        handler: jest.fn(),
        summarize: (args) => `Tóm tắt: ${args.id}`,
      };

      const toolWithFailingPreview: AgentToolDef<{ id: string }> = {
        name: 'tool_preview_err',
        domain: 'account',
        description: 'Preview throws',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        preview: jest.fn().mockRejectedValue(new Error('Preview error')),
        handler: jest.fn(),
        summarize: (args) => `Tóm tắt: ${args.id}`,
      };

      const toolWithEmptyPreview: AgentToolDef<{ id: string }> = {
        name: 'tool_preview_empty',
        domain: 'account',
        description: 'Preview returns empty string',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        preview: jest.fn().mockResolvedValue(''),
        handler: jest.fn(),
        summarize: (args) => `Tóm tắt: ${args.id}`,
      };

      mockInterrupt.mockReturnValue({ decisions: [] });

      const confirmNode = createConfirmNode(
        createDeps([
          toolWithWorkingPreview,
          toolWithFailingPreview,
          toolWithEmptyPreview,
        ]),
      );
      await confirmNode(
        {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                { id: 'c1', name: 'tool_preview_ok', args: { id: '1' } },
                { id: 'c2', name: 'tool_preview_err', args: { id: '2' } },
                { id: 'c3', name: 'tool_preview_empty', args: { id: '3' } },
                {
                  id: undefined,
                  name: 'tool_preview_empty',
                  args: { id: '4' },
                }, // c.id ?? ''
              ],
            }),
          ],
        },
        { configurable: { ctx: customerCtx } },
      );

      const payload = mockInterrupt.mock.calls[0][0];
      expect(payload.calls[0].summary).toBe('Chi tiết xem trước');
      expect(payload.calls[1].summary).toBe('Tóm tắt: 2');
      expect(payload.calls[2].summary).toBe('Tóm tắt: 3');
      expect(payload.calls[3].id).toBe('');
    });

    it('declines calls when resume is null, not an object, or decisions is not an array', async () => {
      const toolDef: AgentToolDef<{ id: string }> = {
        name: 'delete_item',
        domain: 'account',
        description: 'Delete item',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Delete ${args.id}`,
      };

      const confirmNode = createConfirmNode(createDeps([toolDef]));

      // resume is null
      mockInterrupt.mockReturnValue(null);
      const resNull = await confirmNode({
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'delete_item', args: { id: '1' } }],
          }),
        ],
      });
      expect(resNull.messages).toHaveLength(1);
      expect((resNull.messages[0] as ToolMessage).content).toContain(
        'Người dùng đã từ chối thao tác này',
      );

      // resume is a non-object primitive
      mockInterrupt.mockReturnValue('non-object');
      const resStr = await confirmNode({
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'delete_item', args: { id: '1' } }],
          }),
        ],
      });
      expect(resStr.messages).toHaveLength(1);

      // resume.decisions is not an array
      mockInterrupt.mockReturnValue({ decisions: 'not-array' });
      const resNotArray = await confirmNode({
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'delete_item', args: { id: '1' } }],
          }),
        ],
      });
      expect(resNotArray.messages).toHaveLength(1);
    });

    it('parses decisions array, skips malformed items, records audit on decline, and catches audit throw', async () => {
      const toolDef: AgentToolDef<{ id: string }> = {
        name: 'delete_item',
        domain: 'account',
        description: 'Delete item',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Delete ${args.id}`,
      };

      // Decision with invalid items: null, string, missing callId, empty callId, approve false
      mockInterrupt.mockReturnValue({
        decisions: [
          null,
          undefined,
          'invalid',
          {},
          { callId: 123 },
          { callId: '   ', approve: true },
          { callId: 'call-decline', approve: false },
          { callId: 'call-approve', approve: true },
        ],
      });

      // Audit throws error to test try/catch around deps.audit.record
      mockAuditRecord.mockRejectedValue(new Error('Audit logging failed'));

      const confirmNode = createConfirmNode(createDeps([toolDef]));
      const res = await confirmNode(
        {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                { id: 'call-decline', name: 'delete_item', args: { id: '1' } },
                { id: 'call-approve', name: 'delete_item', args: { id: '2' } },
                { id: undefined, name: 'delete_item', args: { id: '3' } }, // no id -> declined
              ],
            }),
          ],
        },
        { configurable: { ctx: guestCtx } }, // tests guest auditRole mapping to null
      );

      // call-approve should NOT be in declinedMessages
      // call-decline and empty id should be in declinedMessages
      expect(res.messages).toHaveLength(2);
      expect((res.messages[0] as ToolMessage).tool_call_id).toBe(
        'call-decline',
      );
      expect((res.messages[1] as ToolMessage).tool_call_id).toBe('');

      // Verify audit was called with role null for GUEST
      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          role: null,
          status: 'DECLINED',
          toolName: 'delete_item',
        }),
      );
    });
  });

  describe('createToolsNode', () => {
    let mockAuditRecord: jest.Mock;

    const createDeps = (
      tools: AgentToolDef[] = [],
      limits = { maxToolCallsPerTurn: 2, historyMaxMessages: 10 },
    ): AgentGraphDeps => ({
      model: null as any,
      registry: new ToolRegistry(tools),
      checkpointer: null as any,
      audit: { record: mockAuditRecord },
      limits,
    });

    beforeEach(() => {
      mockAuditRecord = jest.fn().mockResolvedValue(undefined);
    });

    it('returns empty messages when there is no last AI message', async () => {
      const toolsNode = createToolsNode(createDeps());
      const res = await toolsNode({ messages: [] });
      expect(res).toEqual({ messages: [] });
    });

    it('correctly filters already executed tool messages using doneIds', async () => {
      const sampleTool: AgentToolDef<{ id: string }> = {
        name: 'sample_tool',
        domain: 'catalog',
        description: 'Sample',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ status: 'done' }),
        summarize: () => 'sample',
      };

      const toolsNode = createToolsNode(createDeps([sampleTool]));

      // State messages contain:
      // 1. Non-tool message (Human)
      // 2. Tool message with no tool_call_id
      // 3. Tool message with whitespace tool_call_id
      // 4. Tool message with non-string tool_call_id
      // 5. Tool message with valid tool_call_id 'call-1'
      // 6. AIMessage with tool_calls 'call-1' (already done) and 'call-2' (pending)
      const res = await toolsNode({
        messages: [
          new HumanMessage('User ask'),
          new ToolMessage({ tool_call_id: '', content: 'empty' }),
          { getType: () => 'tool', tool_call_id: '   ' } as any,
          { getType: () => 'tool', tool_call_id: 123 as any } as any,
          new ToolMessage({ tool_call_id: 'call-1', content: 'already done' }),
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'call-1', name: 'sample_tool', args: { id: '1' } },
              { id: 'call-2', name: 'sample_tool', args: { id: '2' } },
            ],
          }),
        ],
      });

      // Only call-2 should be executed
      expect(res.messages).toHaveLength(1);
      expect((res.messages[0] as ToolMessage).tool_call_id).toBe('call-2');
    });

    it('matches empty-id calls against unmatched empty-id tool messages in current turn', async () => {
      const sampleTool: AgentToolDef<{ id: string }> = {
        name: 'matched_empty_tool',
        domain: 'catalog',
        description: 'Sample',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ status: 'done' }),
        summarize: () => 'sample',
      };

      const toolsNode = createToolsNode(createDeps([sampleTool]));

      // AI message has a call with empty id
      const aiMsg = new AIMessage({
        content: '',
        tool_calls: [
          { id: '', name: 'matched_empty_tool', args: { id: '1' } },
          { id: undefined, name: 'unmatched_empty_tool', args: { id: '2' } },
        ],
      });

      // Followed by a tool message in the current turn with matching name and empty id
      const toolMsg = new ToolMessage({
        name: 'matched_empty_tool',
        tool_call_id: '',
        content: 'done',
      });

      // Followed by a non-tool message in current turn to test m.getType !== 'tool'
      const followUpHuman = new HumanMessage('follow up');

      const res = await toolsNode({
        messages: [aiMsg, toolMsg, followUpHuman],
      });

      // matched_empty_tool was already handled, so unmatched_empty_tool is executed and fails id check
      expect(res.messages).toHaveLength(1);
      const msg = res.messages[0] as ToolMessage;
      expect(msg.name).toBe('unmatched_empty_tool');
      expect(msg.content).toContain('Mã gọi công cụ không hợp lệ');
    });

    it('rejects calls with missing or whitespace id with invalid code error', async () => {
      const toolsNode = createToolsNode(createDeps());

      const res = await toolsNode({
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: '   ', name: 'some_tool', args: {} },
              { id: undefined, name: 'some_tool', args: {} },
            ],
          }),
        ],
      });

      expect(res.messages).toHaveLength(2);
      expect((res.messages[0] as ToolMessage).content).toContain(
        'Mã gọi công cụ không hợp lệ',
      );
      expect((res.messages[1] as ToolMessage).content).toContain(
        'Mã gọi công cụ không hợp lệ',
      );
    });

    it('enforces maxToolCallsPerTurn limit', async () => {
      const dummyTool: AgentToolDef = {
        name: 'dummy_tool',
        domain: 'catalog',
        description: 'Dummy',
        schema: z.object({}).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ ok: true }),
        summarize: () => 'dummy',
      };

      // maxToolCallsPerTurn is set to 2 in createDeps
      const toolsNode = createToolsNode(
        createDeps([dummyTool], {
          maxToolCallsPerTurn: 2,
          historyMaxMessages: 10,
        }),
      );
      const res = await toolsNode({
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'c1', name: 'dummy_tool', args: {} },
              { id: 'c2', name: 'dummy_tool', args: {} },
              { id: 'c3', name: 'dummy_tool', args: {} },
            ],
          }),
        ],
      });

      expect(res.messages).toHaveLength(3);
      expect((res.messages[0] as ToolMessage).content).toContain('"ok":true');
      expect((res.messages[1] as ToolMessage).content).toContain('"ok":true');
      expect((res.messages[2] as ToolMessage).content).toContain(
        'Vượt quá số lượt gọi công cụ trong một lượt',
      );
    });

    it('returns error when tool is not available in registry for context', async () => {
      const toolsNode = createToolsNode(createDeps());
      const res = await toolsNode(
        {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [{ id: 'c1', name: 'non_existent_tool', args: {} }],
            }),
          ],
        },
        { configurable: { ctx: customerCtx } },
      );

      expect(res.messages).toHaveLength(1);
      expect((res.messages[0] as ToolMessage).content).toContain(
        'Công cụ không khả dụng',
      );
    });

    it('returns zod error message when tool arguments fail schema validation', async () => {
      const schemaTool: AgentToolDef<{ count: number }> = {
        name: 'count_tool',
        domain: 'catalog',
        description: 'Count',
        schema: z
          .object({
            count: z.number({ required_error: 'Số lượng là bắt buộc' }),
          })
          .strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn(),
        summarize: () => 'count',
      };

      const toolsNode = createToolsNode(createDeps([schemaTool]));
      const res = await toolsNode({
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'count_tool', args: {} }],
          }),
        ],
      });

      expect(res.messages).toHaveLength(1);
      expect((res.messages[0] as ToolMessage).content).toContain(
        'Số lượng là bắt buộc',
      );
    });

    it('executes tool handler successfully with def.project and records audit', async () => {
      const projectedTool: AgentToolDef<{ id: string }> = {
        name: 'projected_tool',
        domain: 'catalog',
        description: 'Projected',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest
          .fn()
          .mockResolvedValue({ rawSecret: '123', visible: 'test' }),
        project: (res) => ({ visible: (res as any).visible }),
        summarize: () => 'projected',
      };

      const toolsNode = createToolsNode(createDeps([projectedTool]));
      const res = await toolsNode(
        {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                { id: 'c1', name: 'projected_tool', args: { id: 'x' } },
              ],
            }),
          ],
        },
        { configurable: { ctx: customerCtx } },
      );

      expect(res.messages).toHaveLength(1);
      const content = JSON.parse(
        (res.messages[0] as ToolMessage).content as string,
      );
      expect(content).toEqual({ ok: true, data: { visible: 'test' } });
      expect((content as any).data).not.toHaveProperty('rawSecret');

      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'CUSTOMER',
          status: 'OK',
          toolName: 'projected_tool',
          args: { id: 'x' },
        }),
      );
    });

    it('executes tool handler successfully without def.project and records audit', async () => {
      const rawTool: AgentToolDef<{ id: string }> = {
        name: 'raw_tool',
        domain: 'catalog',
        description: 'Raw',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ simple: 'value' }),
        summarize: () => 'raw',
      };

      const toolsNode = createToolsNode(createDeps([rawTool]));
      const res = await toolsNode({
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'raw_tool', args: { id: 'x' } }],
          }),
        ],
      });

      expect(res.messages).toHaveLength(1);
      expect((res.messages[0] as ToolMessage).content).toContain(
        '"simple":"value"',
      );
      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'OK',
          role: null, // guest context
        }),
      );
    });

    it('handles handler throwing an error, records error in audit, and catches audit error', async () => {
      const failingTool: AgentToolDef<{ id: string }> = {
        name: 'failing_tool',
        domain: 'catalog',
        description: 'Fails',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockRejectedValue(new Error('Handler exploded')),
        summarize: () => 'failing',
      };

      // Audit recording also throws to exercise the catch around audit
      mockAuditRecord.mockRejectedValue(new Error('Audit fail'));

      const toolsNode = createToolsNode(createDeps([failingTool]));
      const res = await toolsNode(
        {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: [
                { id: 'c1', name: 'failing_tool', args: { id: 'x' } },
              ],
            }),
          ],
        },
        { configurable: { ctx: adminCtx } },
      );

      expect(res.messages).toHaveLength(1);
      const content = JSON.parse(
        (res.messages[0] as ToolMessage).content as string,
      );
      expect(content).toEqual({
        ok: false,
        error: 'Thao tác không thành công.',
      });

      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'ADMIN',
          status: 'ERROR',
          error: 'Thao tác không thành công.',
        }),
      );
    });
  });
});
