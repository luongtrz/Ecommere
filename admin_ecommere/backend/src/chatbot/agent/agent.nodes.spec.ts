import {
  END,
  interrupt,
  MessagesAnnotation,
  type LangGraphRunnableConfig,
} from '@langchain/langgraph';
import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
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
  SINGLE_WRITE_PER_TURN_ERROR,
} from './agent.nodes';
import { ToolRegistry } from '../tools/tool.registry';
import type { AgentToolDef, ToolContext } from '../tools/tool.types';
import type { AgentGraphDeps } from './agent.graph';

jest.mock('@langchain/langgraph', () => {
  const actual = jest.requireActual('@langchain/langgraph');
  return {
    ...actual,
    interrupt: jest.fn(),
  };
});

describe('agent.nodes', () => {
  const mockCustomerCtx: ToolContext = {
    userId: 'cust-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'th-cust-123',
  };

  const mockAdminCtx: ToolContext = {
    userId: 'admin-999',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'th-admin-999',
  };

  const mockGuestCtx: ToolContext = {
    userId: null,
    role: 'GUEST',
    app: 'USER',
    threadId: 'th-guest-000',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodayVietnam', () => {
    it('returns Vietnam date (UTC+7) in YYYY-MM-DD format for a given UTC timestamp', () => {
      // 2026-05-01 10:00:00 UTC -> 17:00:00 UTC+7 on 2026-05-01
      const now = Date.UTC(2026, 4, 1, 10, 0, 0);
      expect(getTodayVietnam(now)).toBe('2026-05-01');
    });

    it('crosses into the next day when UTC hour + 7 passes midnight', () => {
      // 2026-05-01 20:00:00 UTC -> 03:00:00 UTC+7 on 2026-05-02
      const now = Date.UTC(2026, 4, 1, 20, 0, 0);
      expect(getTodayVietnam(now)).toBe('2026-05-02');
    });

    it('uses Date.now() by default when now argument is omitted', () => {
      const today = getTodayVietnam();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getContext', () => {
    it('returns ctx from config.configurable.ctx when present', () => {
      const config: LangGraphRunnableConfig = {
        configurable: {
          ctx: mockCustomerCtx,
        },
      };
      const result = getContext(config);
      expect(result).toEqual(mockCustomerCtx);
    });

    it('returns default guest context when config is undefined', () => {
      const result = getContext(undefined);
      expect(result).toEqual({
        userId: null,
        role: 'GUEST',
        app: 'USER',
        threadId: '',
      });
    });

    it('returns default guest context when config.configurable is undefined', () => {
      const result = getContext({});
      expect(result).toEqual({
        userId: null,
        role: 'GUEST',
        app: 'USER',
        threadId: '',
      });
    });

    it('returns default guest context when config.configurable.ctx is undefined', () => {
      const result = getContext({ configurable: {} });
      expect(result).toEqual({
        userId: null,
        role: 'GUEST',
        app: 'USER',
        threadId: '',
      });
    });
  });

  describe('getZodErrorMessage', () => {
    it('returns the issue message when it contains Vietnamese characters', () => {
      const error = {
        issues: [{ message: 'Số lượng sản phẩm không hợp lệ' }],
      };
      expect(getZodErrorMessage(error)).toBe('Số lượng sản phẩm không hợp lệ');
    });

    it('returns fallback message when issue message contains only ASCII characters', () => {
      const error = {
        issues: [{ message: 'Quantity is invalid' }],
      };
      expect(getZodErrorMessage(error)).toBe('Tham số không hợp lệ');
    });

    it('returns fallback message when issues array is empty', () => {
      const error = { issues: [] };
      expect(getZodErrorMessage(error)).toBe('Tham số không hợp lệ');
    });

    it('returns fallback message when first issue has an empty or undefined message', () => {
      const error = { issues: [{ message: '' }] };
      expect(getZodErrorMessage(error)).toBe('Tham số không hợp lệ');
    });
  });

  describe('findLastAIMessage', () => {
    it('returns undefined for empty messages array', () => {
      expect(findLastAIMessage([])).toBeUndefined();
    });

    it('returns undefined when there are no AI messages', () => {
      const messages: BaseMessage[] = [
        new HumanMessage('Chào bạn'),
        new ToolMessage({ tool_call_id: 'call-1', content: 'ok' }),
      ];
      expect(findLastAIMessage(messages)).toBeUndefined();
    });

    it('returns the last AI message when multiple AI messages exist', () => {
      const firstAi = new AIMessage('First AI');
      const lastAi = new AIMessage('Last AI');
      const messages: BaseMessage[] = [
        new HumanMessage('User 1'),
        firstAi,
        new HumanMessage('User 2'),
        lastAi,
      ];
      expect(findLastAIMessage(messages)).toBe(lastAi);
    });

    it('safely skips message objects without a valid getType method', () => {
      const lastAi = new AIMessage('Valid AI');
      const malformedMessage = { content: 'raw' } as unknown as BaseMessage;
      expect(findLastAIMessage([malformedMessage, lastAi])).toBe(lastAi);
    });
  });

  describe('SINGLE_WRITE_PER_TURN_ERROR', () => {
    it('matches expected constant string', () => {
      expect(SINGLE_WRITE_PER_TURN_ERROR).toBe(
        'Chỉ cho phép một thao tác ghi trong mỗi lượt. Vui lòng gửi lại thao tác này trong tin nhắn tiếp theo',
      );
    });
  });

  describe('routeAfterAgent', () => {
    it('returns "confirm" when the last message is an AIMessage with non-empty tool_calls', () => {
      const aiMsg = new AIMessage({
        content: '',
        tool_calls: [{ id: 'call_1', name: 'search', args: {} }],
      });
      const state = {
        messages: [new HumanMessage('Hello'), aiMsg],
      } as typeof MessagesAnnotation.State;

      expect(routeAfterAgent(state)).toBe('confirm');
    });

    it('returns END when the last message is an AIMessage with empty tool_calls array', () => {
      const aiMsg = new AIMessage({
        content: 'No tools needed',
        tool_calls: [],
      });
      const state = {
        messages: [new HumanMessage('Hello'), aiMsg],
      } as typeof MessagesAnnotation.State;

      expect(routeAfterAgent(state)).toBe(END);
    });

    it('returns END when the last message is an AIMessage with undefined tool_calls', () => {
      const aiMsg = new AIMessage('Simple response');
      const state = {
        messages: [new HumanMessage('Hello'), aiMsg],
      } as typeof MessagesAnnotation.State;

      expect(routeAfterAgent(state)).toBe(END);
    });

    it('returns END when the last message is not an AIMessage', () => {
      const state = {
        messages: [new HumanMessage('Hello')],
      } as typeof MessagesAnnotation.State;

      expect(routeAfterAgent(state)).toBe(END);
    });

    it('returns END when messages array is empty', () => {
      const state = {
        messages: [],
      } as typeof MessagesAnnotation.State;

      expect(routeAfterAgent(state)).toBe(END);
    });
  });

  describe('createAgentNode', () => {
    it('binds tool specs to model, invokes model with system prompt and trimmed history, and returns messages', async () => {
      const mockModel = {
        bindTools: jest.fn().mockReturnValue({
          invoke: jest.fn().mockResolvedValue(new AIMessage('Agent reply')),
        }),
      };

      const testToolDef: AgentToolDef<{ query: string }> = {
        name: 'test_search',
        domain: 'catalog',
        description: 'Tìm kiếm sản phẩm',
        schema: z.object({ query: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ items: [] }),
        summarize: (args) => `Tìm: ${args.query}`,
      };

      const registry = new ToolRegistry([testToolDef]);
      const deps: AgentGraphDeps = {
        model: mockModel as any,
        registry,
        checkpointer: {} as any,
        audit: { record: jest.fn() },
        limits: {
          maxToolCallsPerTurn: 5,
          historyMaxMessages: 10,
        },
      };

      const agentNode = createAgentNode(deps);
      const state = {
        messages: [new HumanMessage('Tìm sản phẩm')],
      } as typeof MessagesAnnotation.State;
      const config: LangGraphRunnableConfig = {
        configurable: { ctx: mockCustomerCtx },
      };

      const result = await agentNode(state, config);

      expect(mockModel.bindTools).toHaveBeenCalledTimes(1);
      const boundSpecs = mockModel.bindTools.mock.calls[0][0];
      expect(boundSpecs).toHaveLength(1);
      expect(boundSpecs[0].name).toBe('test_search');
      expect(boundSpecs[0].description).toBe('Tìm kiếm sản phẩm');

      // Exercise the tool function created by tool(async () => '', ...)
      const toolFuncResult = await boundSpecs[0].func();
      expect(toolFuncResult).toBe('');

      expect(result).toEqual({
        messages: [expect.any(AIMessage)],
      });
      expect(result.messages[0].content).toBe('Agent reply');
    });

    it('uses default context when config is omitted', async () => {
      const mockModel = {
        bindTools: jest.fn().mockReturnValue({
          invoke: jest.fn().mockResolvedValue(new AIMessage('Default reply')),
        }),
      };
      const registry = new ToolRegistry([]);
      const deps: AgentGraphDeps = {
        model: mockModel as any,
        registry,
        checkpointer: {} as any,
        audit: { record: jest.fn() },
        limits: {
          maxToolCallsPerTurn: 5,
          historyMaxMessages: 10,
        },
      };

      const agentNode = createAgentNode(deps);
      const state = {
        messages: [new HumanMessage('Xin chào')],
      } as typeof MessagesAnnotation.State;

      const result = await agentNode(state);
      expect(result.messages[0].content).toBe('Default reply');
    });
  });

  describe('createConfirmNode', () => {
    let mockAuditRecord: jest.Mock;
    let mockDeps: AgentGraphDeps;

    beforeEach(() => {
      mockAuditRecord = jest.fn().mockResolvedValue(undefined);
      mockDeps = {
        model: {} as any,
        registry: new ToolRegistry([]),
        checkpointer: {} as any,
        audit: { record: mockAuditRecord },
        limits: {
          maxToolCallsPerTurn: 5,
          historyMaxMessages: 10,
        },
      };
    });

    it('returns empty object when there is no AI message in state', async () => {
      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [new HumanMessage('User message')],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state);
      expect(result).toEqual({});
      expect(interrupt).not.toHaveBeenCalled();
    });

    it('returns empty object when last AI message has no tool calls', async () => {
      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [new AIMessage({ content: 'No tools', tool_calls: [] })],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state);
      expect(result).toEqual({});
      expect(interrupt).not.toHaveBeenCalled();
    });

    it('returns empty object when no tool calls require confirmation', async () => {
      const readTool: AgentToolDef<{ query: string }> = {
        name: 'read_catalog',
        domain: 'catalog',
        description: 'Đọc danh mục',
        schema: z.object({ query: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn(),
        summarize: (args) => `Tìm: ${args.query}`,
      };
      mockDeps.registry = new ToolRegistry([readTool]);

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_read_1',
                name: 'read_catalog',
                args: { query: 'laptop' },
              },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });
      expect(result).toEqual({});
      expect(interrupt).not.toHaveBeenCalled();
    });

    it('interrupts with preview text when preview returns a non-empty string', async () => {
      const previewTool: AgentToolDef<{ orderId: string }> = {
        name: 'cancel_order',
        domain: 'orders',
        description: 'Hủy đơn hàng',
        schema: z.object({ orderId: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Hủy đơn hàng ${args.orderId}`,
        preview: jest
          .fn()
          .mockResolvedValue('Chi tiết đơn ord-123 cần hủy: 500.000đ'),
      };
      mockDeps.registry = new ToolRegistry([previewTool]);

      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [{ callId: 'call_destr_1', approve: true }],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_destr_1',
                name: 'cancel_order',
                args: { orderId: 'ord-123' },
              },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(interrupt).toHaveBeenCalledWith({
        kind: 'confirm',
        calls: [
          {
            id: 'call_destr_1',
            name: 'cancel_order',
            summary: 'Chi tiết đơn ord-123 cần hủy: 500.000đ',
            risk: 'DESTRUCTIVE',
          },
        ],
      });
      expect(result).toEqual({ messages: [] });
      expect(mockAuditRecord).not.toHaveBeenCalled();
    });

    it('falls back to def.summarize when preview throws an error', async () => {
      const previewTool: AgentToolDef<{ orderId: string }> = {
        name: 'cancel_order',
        domain: 'orders',
        description: 'Hủy đơn hàng',
        schema: z.object({ orderId: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Tóm tắt hủy đơn: ${args.orderId}`,
        preview: jest.fn().mockRejectedValue(new Error('Preview error')),
      };
      mockDeps.registry = new ToolRegistry([previewTool]);

      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [{ callId: 'call_destr_1', approve: true }],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_destr_1',
                name: 'cancel_order',
                args: { orderId: 'ord-999' },
              },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(interrupt).toHaveBeenCalledWith({
        kind: 'confirm',
        calls: [
          expect.objectContaining({
            summary: 'Tóm tắt hủy đơn: ord-999',
          }),
        ],
      });
    });

    it('falls back to def.summarize when preview returns an empty string or non-string', async () => {
      const previewTool: AgentToolDef<{ orderId: string }> = {
        name: 'cancel_order',
        domain: 'orders',
        description: 'Hủy đơn hàng',
        schema: z.object({ orderId: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Tóm tắt đơn: ${args.orderId}`,
        preview: jest.fn().mockResolvedValue(''),
      };
      mockDeps.registry = new ToolRegistry([previewTool]);

      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [{ callId: 'call_destr_1', approve: true }],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_destr_1',
                name: 'cancel_order',
                args: { orderId: 'ord-555' },
              },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(interrupt).toHaveBeenCalledWith({
        kind: 'confirm',
        calls: [
          expect.objectContaining({
            summary: 'Tóm tắt đơn: ord-555',
          }),
        ],
      });
    });

    it('falls back to tool name as summary when schema.safeParse fails', async () => {
      const toolDef: AgentToolDef<{ orderId: string }> = {
        name: 'cancel_order',
        domain: 'orders',
        description: 'Hủy đơn hàng',
        schema: z.object({ orderId: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Hủy ${args.orderId}`,
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [{ callId: 'call_destr_1', approve: true }],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_destr_1',
                name: 'cancel_order',
                args: { orderId: 12345 as any },
              },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(interrupt).toHaveBeenCalledWith({
        kind: 'confirm',
        calls: [
          expect.objectContaining({
            summary: 'cancel_order',
          }),
        ],
      });
    });

    it('falls back to tool name as summary when schema.safeParse throws an exception', async () => {
      const toolDef: AgentToolDef<any> = {
        name: 'fragile_tool',
        domain: 'orders',
        description: 'Công cụ nhạy cảm',
        schema: {
          safeParse: () => {
            throw new Error('Fatal parse exception');
          },
        } as any,
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: () => 'Tóm tắt',
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [{ callId: 'call_fragile_1', approve: true }],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_fragile_1',
                name: 'fragile_tool',
                args: {},
              },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(interrupt).toHaveBeenCalledWith({
        kind: 'confirm',
        calls: [
          expect.objectContaining({
            summary: 'fragile_tool',
          }),
        ],
      });
    });

    it('handles unknown tool by defaulting risk to DESTRUCTIVE, summary to name, and requiring confirmation', async () => {
      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [{ callId: 'call_unk_1', approve: false }],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_unk_1',
                name: 'unregistered_tool',
                args: { foo: 'bar' },
              },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(interrupt).toHaveBeenCalledWith({
        kind: 'confirm',
        calls: [
          {
            id: 'call_unk_1',
            name: 'unregistered_tool',
            summary: 'unregistered_tool',
            risk: 'DESTRUCTIVE',
          },
        ],
      });

      expect(result.messages).toHaveLength(1);
      const declinedMsg = result.messages![0] as ToolMessage;
      expect(declinedMsg.tool_call_id).toBe('call_unk_1');
      expect(JSON.parse(declinedMsg.content as string)).toEqual({
        ok: false,
        error: 'Người dùng đã từ chối thao tác này',
      });

      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          toolName: 'unregistered_tool',
          risk: 'DESTRUCTIVE',
          status: 'DECLINED',
        }),
      );
    });

    it('declines call when resume decisions does not approve it, and audits role mapping for CUSTOMER', async () => {
      const toolDef: AgentToolDef<{ id: string }> = {
        name: 'cancel_order',
        domain: 'orders',
        description: 'Hủy đơn',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Hủy đơn ${args.id}`,
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [{ callId: 'call_1', approve: false }],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'call_1', name: 'cancel_order', args: { id: 'ord-1' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(mockAuditRecord).toHaveBeenCalledWith({
        threadId: 'th-cust-123',
        toolCallId: 'call_1',
        userId: 'cust-123',
        role: 'CUSTOMER',
        app: 'USER',
        toolName: 'cancel_order',
        risk: 'DESTRUCTIVE',
        status: 'DECLINED',
        args: { id: 'ord-1' },
        error: 'Người dùng đã từ chối thao tác này',
      });
    });

    it('declines all pending calls when resume is undefined, null, or malformed', async () => {
      const toolDef: AgentToolDef<{ id: string }> = {
        name: 'delete_item',
        domain: 'cart',
        description: 'Xóa mục',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'admin',
        risk: 'WRITE',
        handler: jest.fn(),
        summarize: (args) => `Xóa ${args.id}`,
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      (interrupt as unknown as jest.Mock).mockReturnValue(undefined);

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'call_del_1', name: 'delete_item', args: { id: 'item-1' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state, {
        configurable: { ctx: mockAdminCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'ADMIN',
          status: 'DECLINED',
        }),
      );
    });

    it('handles resume decisions with malformed entries or whitespace callId', async () => {
      const toolDef: AgentToolDef<{ id: string }> = {
        name: 'delete_item',
        domain: 'cart',
        description: 'Xóa',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Xóa ${args.id}`,
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [
          null,
          undefined,
          123,
          { callId: '', approve: true },
          { callId: '   ', approve: true },
          { callId: 'call_valid', approve: false },
          { callId: 'call_valid', approve: 'true' as any }, // not strict boolean true
        ],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'call_valid', name: 'delete_item', args: { id: 'i1' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect((result.messages![0] as ToolMessage).tool_call_id).toBe(
        'call_valid',
      );
    });

    it('treats call with missing or non-string id as declined and audits with toolCallId undefined', async () => {
      const toolDef: AgentToolDef<any> = {
        name: 'destructive_action',
        domain: 'admin',
        description: 'Hành động nguy hiểm',
        schema: z.object({}).passthrough(),
        auth: 'public',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: () => 'Hành động nguy hiểm',
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [{ callId: '', approve: true }],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                id: undefined as any,
                name: 'destructive_action',
                args: {},
              },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state, {
        configurable: { ctx: mockGuestCtx },
      });

      expect(result.messages).toHaveLength(1);
      const msg = result.messages![0] as ToolMessage;
      expect(msg.tool_call_id).toBe('');

      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          toolCallId: undefined,
          role: null, // GUEST maps to null
          status: 'DECLINED',
        }),
      );
    });

    it('catches and ignores exceptions thrown by deps.audit.record during decline', async () => {
      const toolDef: AgentToolDef<{ id: string }> = {
        name: 'cancel_order',
        domain: 'orders',
        description: 'Hủy đơn',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'DESTRUCTIVE',
        handler: jest.fn(),
        summarize: (args) => `Hủy ${args.id}`,
      };
      mockDeps.registry = new ToolRegistry([toolDef]);
      mockAuditRecord.mockRejectedValue(new Error('Audit service unavailable'));

      (interrupt as unknown as jest.Mock).mockReturnValue({
        decisions: [{ callId: 'call_1', approve: false }],
      });

      const confirmNode = createConfirmNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'call_1', name: 'cancel_order', args: { id: 'ord-1' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await confirmNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
    });
  });

  describe('createToolsNode', () => {
    let mockAuditRecord: jest.Mock;
    let mockAuditFindCompleted: jest.Mock;
    let mockDeps: AgentGraphDeps;

    beforeEach(() => {
      mockAuditRecord = jest.fn().mockResolvedValue(undefined);
      mockAuditFindCompleted = jest.fn().mockResolvedValue(null);
      mockDeps = {
        model: {} as any,
        registry: new ToolRegistry([]),
        checkpointer: {} as any,
        audit: {
          record: mockAuditRecord,
          findCompleted: mockAuditFindCompleted,
        },
        limits: {
          maxToolCallsPerTurn: 5,
          historyMaxMessages: 10,
        },
      };
    });

    it('returns empty messages array when state contains no tool calls', async () => {
      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [new AIMessage('Plain text response')],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });
      expect(result).toEqual({ messages: [] });
    });

    it('returns empty messages array when state messages contains no AI message at all', async () => {
      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [new HumanMessage('Hello')],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });
      expect(result).toEqual({ messages: [] });
    });

    it('skips tool calls whose ids already appear in prior ToolMessages (doneIds)', async () => {
      const readTool: AgentToolDef<{ q: string }> = {
        name: 'read_catalog',
        domain: 'catalog',
        description: 'Tìm kiếm',
        schema: z.object({ q: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ items: ['item1'] }),
        summarize: (args) => `Tìm ${args.q}`,
      };
      mockDeps.registry = new ToolRegistry([readTool]);

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'call_done_1', name: 'read_catalog', args: { q: 'shoes' } },
            ],
          }),
          new ToolMessage({
            tool_call_id: 'call_done_1',
            name: 'read_catalog',
            content: '{"items":["item1"]}',
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });
      expect(result).toEqual({ messages: [] });
      expect(readTool.handler).not.toHaveBeenCalled();
    });

    it('ignores non-tool messages and tool messages with empty tool_call_id when collecting doneIds', async () => {
      const readTool: AgentToolDef<{ q: string }> = {
        name: 'read_catalog',
        domain: 'catalog',
        description: 'Tìm',
        schema: z.object({ q: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ items: [] }),
        summarize: () => 'Tìm',
      };
      mockDeps.registry = new ToolRegistry([readTool]);

      const toolsNode = createToolsNode(mockDeps);
      const malformedToolMsg = {
        getType: () => 'tool',
        tool_call_id: '   ',
        content: '{}',
      } as unknown as BaseMessage;
      const nonToolMsg = {
        getType: () => 'human',
        content: 'hello',
      } as unknown as BaseMessage;
      const rawMsgWithoutGetType = { content: 'raw' } as unknown as BaseMessage;

      const state = {
        messages: [
          malformedToolMsg,
          nonToolMsg,
          rawMsgWithoutGetType,
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'call_1', name: 'read_catalog', args: { q: 'shirt' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });
      expect(result.messages).toHaveLength(1);
      expect((result.messages[0] as ToolMessage).tool_call_id).toBe('call_1');
    });

    it('matches unmatched tool call with empty id against currentTurnToolMessages by tool name', async () => {
      const readTool: AgentToolDef<{ q: string }> = {
        name: 'read_catalog',
        domain: 'catalog',
        description: 'Tìm',
        schema: z.object({ q: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn(),
        summarize: () => 'Tìm',
      };
      mockDeps.registry = new ToolRegistry([readTool]);

      const toolsNode = createToolsNode(mockDeps);
      const aiMsg = new AIMessage({
        content: '',
        tool_calls: [{ id: '', name: 'read_catalog', args: { q: 'hat' } }],
      });
      const emptyIdToolMsg = new ToolMessage({
        tool_call_id: '',
        name: 'read_catalog',
        content: '{"items":[]}',
      });

      const state = {
        messages: [aiMsg, emptyIdToolMsg],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      // The call matched emptyIdToolMsg, so it was marked done and not executed again
      expect(result.messages).toHaveLength(0);
      expect(readTool.handler).not.toHaveBeenCalled();
    });

    it('returns error ToolMessage when a remaining call has an empty or invalid call id', async () => {
      const readTool: AgentToolDef<{ q: string }> = {
        name: 'read_catalog',
        domain: 'catalog',
        description: 'Tìm',
        schema: z.object({ q: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn(),
        summarize: () => 'Tìm',
      };
      mockDeps.registry = new ToolRegistry([readTool]);

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: '   ', name: 'read_catalog', args: { q: 'hat' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      const msg = result.messages[0];
      expect(JSON.parse(msg.content as string)).toEqual({
        ok: false,
        error: 'Mã gọi công cụ không hợp lệ',
      });
      expect(readTool.handler).not.toHaveBeenCalled();
    });

    it('returns error ToolMessage when call index exceeds maxToolCallsPerTurn limit', async () => {
      const readTool: AgentToolDef<{ q: string }> = {
        name: 'read_catalog',
        domain: 'catalog',
        description: 'Tìm',
        schema: z.object({ q: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ items: [] }),
        summarize: () => 'Tìm',
      };
      mockDeps.registry = new ToolRegistry([readTool]);
      mockDeps.limits.maxToolCallsPerTurn = 1;

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'c1', name: 'read_catalog', args: { q: 'first' } },
              { id: 'c2', name: 'read_catalog', args: { q: 'second' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(2);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: true,
        data: { items: [] },
      });
      expect(JSON.parse(result.messages[1].content as string)).toEqual({
        ok: false,
        error: 'Vượt quá số lượt gọi công cụ trong một lượt',
      });
      expect(readTool.handler).toHaveBeenCalledTimes(1);
    });

    it('returns error ToolMessage when tool is not available in registry for context', async () => {
      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'non_existent_tool', args: {} }],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: false,
        error: 'Công cụ không khả dụng',
      });
    });

    it('returns error ToolMessage when tool auth is admin and ctx.role is not ADMIN', async () => {
      const adminTool: AgentToolDef<any> = {
        name: 'admin_action',
        domain: 'admin',
        description: 'Chỉ cho admin',
        schema: z.object({}).passthrough(),
        auth: 'admin',
        risk: 'READ',
        handler: jest.fn(),
        summarize: () => 'Admin',
      };
      // Registry allows finding by context
      mockDeps.registry = {
        forContext: () => [adminTool],
        get: () => adminTool,
      } as any;

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'admin_action', args: {} }],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx }, // role: 'CUSTOMER'
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: false,
        error: 'Thao tác không được phép',
      });
      expect(adminTool.handler).not.toHaveBeenCalled();
    });

    it('enforces single write tool per turn within the current remaining calls batch', async () => {
      const writeTool: AgentToolDef<{ id: string }> = {
        name: 'write_action',
        domain: 'cart',
        description: 'Ghi',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'WRITE',
        handler: jest.fn().mockResolvedValue({ success: true }),
        summarize: () => 'Ghi',
      };
      mockDeps.registry = new ToolRegistry([writeTool]);

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'w1', name: 'write_action', args: { id: '1' } },
              { id: 'w2', name: 'write_action', args: { id: '2' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(2);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: true,
        data: { success: true },
      });
      expect(JSON.parse(result.messages[1].content as string)).toEqual({
        ok: false,
        error: SINGLE_WRITE_PER_TURN_ERROR,
      });
      expect(writeTool.handler).toHaveBeenCalledTimes(1);
    });

    it('blocks subsequent write tools if currentTurnToolMessages already contains an approved write call', async () => {
      const writeTool: AgentToolDef<{ id: string }> = {
        name: 'write_action',
        domain: 'cart',
        description: 'Ghi',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'WRITE',
        handler: jest.fn().mockResolvedValue({ success: true }),
        summarize: () => 'Ghi',
      };
      mockDeps.registry = new ToolRegistry([writeTool]);

      const toolsNode = createToolsNode(mockDeps);
      const aiMsg = new AIMessage({
        content: '',
        tool_calls: [
          { id: 'w1', name: 'write_action', args: { id: '1' } },
          { id: 'w2', name: 'write_action', args: { id: '2' } },
        ],
      });
      const previousTurnMsg = new ToolMessage({
        tool_call_id: 'w1',
        name: 'write_action',
        content: '{"success":true}',
      });

      const state = {
        messages: [aiMsg, previousTurnMsg],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: false,
        error: SINGLE_WRITE_PER_TURN_ERROR,
      });
      expect(writeTool.handler).not.toHaveBeenCalled();
    });

    it('resolves tool name from calls array when tool message in current turn omits name', async () => {
      const writeTool: AgentToolDef<{ id: string }> = {
        name: 'write_action',
        domain: 'cart',
        description: 'Ghi',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'WRITE',
        handler: jest.fn().mockResolvedValue({ success: true }),
        summarize: () => 'Ghi',
      };
      mockDeps.registry = new ToolRegistry([writeTool]);

      const toolsNode = createToolsNode(mockDeps);
      const aiMsg = new AIMessage({
        content: '',
        tool_calls: [
          { id: 'w1', name: 'write_action', args: { id: '1' } },
          { id: 'w2', name: 'write_action', args: { id: '2' } },
        ],
      });
      const previousTurnMsgWithoutName = new ToolMessage({
        tool_call_id: 'w1',
        name: '',
        content: '{"success":true}',
      });

      const state = {
        messages: [aiMsg, previousTurnMsgWithoutName],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: false,
        error: SINGLE_WRITE_PER_TURN_ERROR,
      });
    });

    it('allows write tool if prior tool in currentTurnToolMessages was declined', async () => {
      const writeTool: AgentToolDef<{ id: string }> = {
        name: 'write_action',
        domain: 'cart',
        description: 'Ghi',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'WRITE',
        handler: jest.fn().mockResolvedValue({ success: true }),
        summarize: () => 'Ghi',
      };
      mockDeps.registry = new ToolRegistry([writeTool]);

      const toolsNode = createToolsNode(mockDeps);
      const aiMsg = new AIMessage({
        content: '',
        tool_calls: [
          { id: 'w1', name: 'write_action', args: { id: '1' } },
          { id: 'w2', name: 'write_action', args: { id: '2' } },
        ],
      });
      const declinedMsg = new ToolMessage({
        tool_call_id: 'w1',
        name: 'write_action',
        content: JSON.stringify({
          ok: false,
          error: 'Người dùng đã từ chối thao tác này',
        }),
      });

      const state = {
        messages: [aiMsg, declinedMsg],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: true,
        data: { success: true },
      });
      expect(writeTool.handler).toHaveBeenCalledTimes(1);
    });

    it('safely handles non-string and invalid JSON content in currentTurnToolMessages', async () => {
      const writeTool: AgentToolDef<{ id: string }> = {
        name: 'write_action',
        domain: 'cart',
        description: 'Ghi',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'WRITE',
        handler: jest.fn().mockResolvedValue({ ok: true }),
        summarize: () => 'Ghi',
      };
      mockDeps.registry = new ToolRegistry([writeTool]);

      const toolsNode = createToolsNode(mockDeps);
      const aiMsg = new AIMessage({
        content: '',
        tool_calls: [{ id: 'w1', name: 'write_action', args: { id: '1' } }],
      });
      const malformedJsonMsg = new ToolMessage({
        tool_call_id: 'other',
        name: 'other_tool',
        content: '{not-json',
      });
      const objectContentMsg = new ToolMessage({
        tool_call_id: 'w_declined',
        name: 'write_action',
        content: {
          ok: false,
          error: 'Người dùng đã từ chối thao tác này',
        } as any,
      });

      const state = {
        messages: [aiMsg, malformedJsonMsg, objectContentMsg],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: true,
        data: { ok: true },
      });
    });

    it('returns error ToolMessage when call args fail schema validation with Vietnamese message', async () => {
      const toolDef: AgentToolDef<{ quantity: number }> = {
        name: 'set_qty',
        domain: 'cart',
        description: 'Đặt số lượng',
        schema: z
          .object({
            quantity: z.number().min(1, { message: 'Số lượng phải lớn hơn 0' }),
          })
          .strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn(),
        summarize: () => 'Đặt số lượng',
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'set_qty', args: { quantity: 0 } }],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: false,
        error: 'Số lượng phải lớn hơn 0',
      });
      expect(toolDef.handler).not.toHaveBeenCalled();
    });

    it('write tool idempotency: returns stored result when deps.audit.findCompleted returns existing result', async () => {
      const writeTool: AgentToolDef<{ id: string }> = {
        name: 'write_action',
        domain: 'cart',
        description: 'Ghi',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'customer',
        risk: 'WRITE',
        handler: jest.fn(),
        summarize: () => 'Ghi',
      };
      mockDeps.registry = new ToolRegistry([writeTool]);
      mockAuditFindCompleted.mockResolvedValue('{"cachedResult":true}');

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'w1', name: 'write_action', args: { id: 'x' } }],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toBe('{"cachedResult":true}');
      expect(writeTool.handler).not.toHaveBeenCalled();
      expect(mockAuditRecord).not.toHaveBeenCalled();
    });

    it('runs tool handler and applies def.project when defined', async () => {
      const toolDef: AgentToolDef<{ id: string }> = {
        name: 'projected_tool',
        domain: 'catalog',
        description: 'Tool with project',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest
          .fn()
          .mockResolvedValue({ id: '1', secret: '12345', name: 'Product' }),
        project: (res: any) => ({ id: res.id, name: res.name }),
        summarize: () => 'Projected',
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'c1', name: 'projected_tool', args: { id: '1' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: true,
        data: {
          id: '1',
          name: 'Product',
        },
      });
      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'OK',
          toolName: 'projected_tool',
          durationMs: expect.any(Number),
          resultSummary: expect.stringContaining('"Product"'),
        }),
      );
    });

    it('catches handler error, returns error ToolMessage, and audits status ERROR with handler error', async () => {
      const toolDef: AgentToolDef<{ id: string }> = {
        name: 'failing_tool',
        domain: 'catalog',
        description: 'Failing tool',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest
          .fn()
          .mockRejectedValue(new Error('Lỗi kết nối cơ sở dữ liệu')),
        summarize: () => 'Failing',
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'failing_tool', args: { id: '1' } }],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: false,
        error: 'Thao tác không thành công.',
      });

      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ERROR',
          error: 'Thao tác không thành công.',
          toolName: 'failing_tool',
        }),
      );
    });

    it('catches ToolError, returns error ToolMessage with custom error message, and audits status ERROR', async () => {
      const toolDef: AgentToolDef<{ id: string }> = {
        name: 'tool_error_tool',
        domain: 'catalog',
        description: 'ToolError tool',
        schema: z.object({ id: z.string() }).strict(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockImplementation(() => {
          const err = new Error('Lỗi nghiệp vụ công cụ');
          err.name = 'ToolError';
          return Promise.reject(err);
        }),
        summarize: () => 'ToolError',
      };
      mockDeps.registry = new ToolRegistry([toolDef]);

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              { id: 'c1', name: 'tool_error_tool', args: { id: '1' } },
            ],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: false,
        error: 'Lỗi nghiệp vụ công cụ',
      });

      expect(mockAuditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ERROR',
          error: 'Lỗi nghiệp vụ công cụ',
          toolName: 'tool_error_tool',
        }),
      );
    });

    it('silently ignores exceptions thrown by deps.audit.record during tool execution', async () => {
      const toolDef: AgentToolDef<any> = {
        name: 'ok_tool',
        domain: 'catalog',
        description: 'Ok tool',
        schema: z.object({}).passthrough(),
        auth: 'public',
        risk: 'READ',
        handler: jest.fn().mockResolvedValue({ done: true }),
        summarize: () => 'Ok',
      };
      mockDeps.registry = new ToolRegistry([toolDef]);
      mockAuditRecord.mockRejectedValue(new Error('Audit write failed'));

      const toolsNode = createToolsNode(mockDeps);
      const state = {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [{ id: 'c1', name: 'ok_tool', args: {} }],
          }),
        ],
      } as typeof MessagesAnnotation.State;

      const result = await toolsNode(state, {
        configurable: { ctx: mockCustomerCtx },
      });

      expect(result.messages).toHaveLength(1);
      expect(JSON.parse(result.messages[0].content as string)).toEqual({
        ok: true,
        data: { done: true },
      });
    });
  });
});
