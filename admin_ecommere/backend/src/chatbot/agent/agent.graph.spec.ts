import { MemorySaver, Command } from '@langchain/langgraph';
import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  type BaseMessage,
} from '@langchain/core/messages';
import { z } from 'zod';
import { ToolRegistry } from '../tools/tool.registry';
import type { AgentToolDef, ToolContext } from '../tools/tool.types';
import {
  buildAgentGraph,
  type AgentModelLike,
  type AgentAuditSink,
} from './agent.graph';
import type { ToolAuditEntry } from './audit.service';
import { createToolsNode, SINGLE_WRITE_PER_TURN_ERROR } from './agent.nodes';

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

describe('LangGraph Agent Graph', () => {
  let readCatalogHandler: jest.Mock;
  let addToCartHandler: jest.Mock;
  let cancelOrderHandler: jest.Mock;
  let updateStockHandler: jest.Mock;
  let customErrorToolHandler: jest.Mock;
  let registry: ToolRegistry;
  let audit: AgentAuditSink;

  const customerCtx: ToolContext = {
    userId: 'cust-123',
    role: 'CUSTOMER',
    app: 'USER',
    threadId: 'th-cust',
  };

  const adminCtx: ToolContext = {
    userId: 'adm-999',
    role: 'ADMIN',
    app: 'ADMIN',
    threadId: 'th-admin',
  };

  const guestCtx: ToolContext = {
    userId: null,
    role: 'GUEST',
    app: 'USER',
    threadId: 'th-guest',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    readCatalogHandler = jest
      .fn()
      .mockImplementation(async (args: { query: string }) => {
        return { items: [`Result for ${args.query}`] };
      });

    addToCartHandler = jest
      .fn()
      .mockImplementation(
        async (args: { itemId: string; quantity: number }) => {
          return { success: true, added: args.itemId };
        },
      );

    cancelOrderHandler = jest
      .fn()
      .mockImplementation(async (args: { orderId: string }) => {
        return { cancelled: true, orderId: args.orderId };
      });

    updateStockHandler = jest
      .fn()
      .mockImplementation(
        async (args: { productId: string; stock: number }) => {
          return {
            updated: true,
            productId: args.productId,
            stock: args.stock,
          };
        },
      );

    customErrorToolHandler = jest.fn().mockResolvedValue({ ok: true });

    const readCatalogTool: AgentToolDef<{ query: string }> = {
      name: 'read_catalog',
      domain: 'catalog',
      description: 'Tìm kiếm sản phẩm trong danh mục',
      schema: z.object({ query: z.string().min(1) }).strict(),
      auth: 'public',
      risk: 'READ',
      handler: readCatalogHandler,
      summarize: (args) => `Tìm kiếm sản phẩm: ${args.query}`,
    };

    const addToCartTool: AgentToolDef<{ itemId: string; quantity: number }> = {
      name: 'add_to_cart',
      domain: 'cart',
      description: 'Thêm sản phẩm vào giỏ hàng',
      schema: z
        .object({ itemId: z.string(), quantity: z.number().int() })
        .strict(),
      auth: 'customer',
      risk: 'WRITE',
      handler: addToCartHandler,
      summarize: (args) =>
        `Thêm sản phẩm ${args.itemId} số lượng ${args.quantity} vào giỏ`,
    };

    const cancelOrderTool: AgentToolDef<{ orderId: string }> = {
      name: 'cancel_order',
      domain: 'orders',
      description: 'Hủy đơn hàng',
      schema: z.object({ orderId: z.string() }).strict(),
      auth: 'customer',
      risk: 'DESTRUCTIVE',
      handler: cancelOrderHandler,
      summarize: (args) => `Hủy đơn hàng ${args.orderId}`,
    };

    const updateStockTool: AgentToolDef<{ productId: string; stock: number }> =
      {
        name: 'update_stock',
        domain: 'inventory',
        description: 'Cập nhật tồn kho sản phẩm',
        schema: z
          .object({ productId: z.string(), stock: z.number().int() })
          .strict(),
        auth: 'admin',
        risk: 'WRITE',
        handler: updateStockHandler,
        summarize: (args) =>
          `Cập nhật tồn kho ${args.productId} thành ${args.stock}`,
      };

    const customErrorTool: AgentToolDef<{ code: string }> = {
      name: 'custom_check',
      domain: 'check',
      description: 'Kiểm tra mã với thông báo tiếng Việt',
      schema: z
        .object({
          code: z
            .string({ message: 'Mã bắt buộc phải là chuỗi ký tự' })
            .min(2, { message: 'Mã phải có ít nhất 2 ký tự' }),
        })
        .strict(),
      auth: 'public',
      risk: 'READ',
      handler: customErrorToolHandler,
      summarize: () => 'Kiểm tra mã',
    };

    registry = new ToolRegistry([
      readCatalogTool,
      addToCartTool,
      cancelOrderTool,
      updateStockTool,
      customErrorTool,
    ]);

    audit = {
      record: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('case a: USER customer, READ tool then a final text answer', async () => {
    const model = new ScriptedFakeModel([
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
      new AIMessage({ content: 'Tìm thấy sản phẩm laptop.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'thread-a', ctx: customerCtx },
    };
    const result = await graph.invoke(
      { messages: [new HumanMessage('Tìm laptop')] },
      config,
    );

    expect(readCatalogHandler).toHaveBeenCalledTimes(1);
    expect(readCatalogHandler).toHaveBeenCalledWith(
      { query: 'laptop' },
      customerCtx,
    );
    expect((result as any).__interrupt__).toBeUndefined();

    const finalMsg = result.messages[result.messages.length - 1];
    expect(finalMsg.content).toBe('Tìm thấy sản phẩm laptop.');
    expect(finalMsg.getType()).toBe('ai');

    // Model never sees ctx.userId or raw tokens in messages
    for (const inv of model.invocations) {
      const raw = JSON.stringify(inv);
      expect(raw).not.toContain('cust-123');
    }
  });

  it('case b: USER customer, WRITE tool: no interrupt, handler called', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_write_1',
            name: 'add_to_cart',
            args: { itemId: 'p1', quantity: 2 },
          },
        ],
      }),
      new AIMessage({ content: 'Đã thêm vào giỏ hàng.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'thread-b', ctx: customerCtx },
    };
    const result = await graph.invoke(
      { messages: [new HumanMessage('Thêm p1')] },
      config,
    );

    expect((result as any).__interrupt__).toBeUndefined();
    expect(addToCartHandler).toHaveBeenCalledTimes(1);
    expect(addToCartHandler).toHaveBeenCalledWith(
      { itemId: 'p1', quantity: 2 },
      customerCtx,
    );
    expect(result.messages[result.messages.length - 1].content).toBe(
      'Đã thêm vào giỏ hàng.',
    );
  });

  it('case c: USER customer, DESTRUCTIVE tool: approve scenario runs handler, decline scenario does not', async () => {
    // Scenario 1: Approve
    const model1 = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_destr_1',
            name: 'cancel_order',
            args: { orderId: 'ord-100' },
          },
        ],
      }),
      new AIMessage({ content: 'Đã hủy đơn ord-100 thành công.' }),
    ]);
    const graph1 = buildAgentGraph({
      model: model1,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config1 = {
      configurable: { thread_id: 'thread-c1', ctx: customerCtx },
    };
    const res1 = await graph1.invoke(
      { messages: [new HumanMessage('Hủy đơn ord-100')] },
      config1,
    );

    expect((res1 as any).__interrupt__).toBeDefined();
    expect((res1 as any).__interrupt__.length).toBeGreaterThan(0);
    expect((res1 as any).__interrupt__[0].value.kind).toBe('confirm');
    expect((res1 as any).__interrupt__[0].value.calls[0].summary).toBe(
      'Hủy đơn hàng ord-100',
    );
    expect(cancelOrderHandler).not.toHaveBeenCalled();

    const res2 = await graph1.invoke(
      new Command({
        resume: { decisions: [{ callId: 'call_destr_1', approve: true }] },
      }),
      config1,
    );

    expect(cancelOrderHandler).toHaveBeenCalledTimes(1);
    expect(cancelOrderHandler).toHaveBeenCalledWith(
      { orderId: 'ord-100' },
      customerCtx,
    );
    expect(res2.messages[res2.messages.length - 1].content).toBe(
      'Đã hủy đơn ord-100 thành công.',
    );

    // Scenario 2: Decline
    const model2 = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_destr_2',
            name: 'cancel_order',
            args: { orderId: 'ord-200' },
          },
        ],
      }),
      new AIMessage({ content: 'Dạ, em đã giữ nguyên đơn hàng cho bạn.' }),
    ]);
    const graph2 = buildAgentGraph({
      model: model2,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config2 = {
      configurable: { thread_id: 'thread-c2', ctx: customerCtx },
    };
    const declineRes1 = await graph2.invoke(
      { messages: [new HumanMessage('Hủy đơn ord-200')] },
      config2,
    );

    expect((declineRes1 as any).__interrupt__).toBeDefined();
    expect(cancelOrderHandler).toHaveBeenCalledTimes(1); // from scenario 1 only

    const declineRes2 = await graph2.invoke(
      new Command({
        resume: { decisions: [{ callId: 'call_destr_2', approve: false }] },
      }),
      config2,
    );

    expect(cancelOrderHandler).toHaveBeenCalledTimes(1); // handler NOT called for scenario 2
    const toolMsg = declineRes2.messages.find(
      (m: any) => m.getType() === 'tool' && m.tool_call_id === 'call_destr_2',
    );
    expect(toolMsg).toBeDefined();
    const parsed = JSON.parse(toolMsg!.content as string);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe('Người dùng đã từ chối thao tác này');
    expect(declineRes2.messages[declineRes2.messages.length - 1].content).toBe(
      'Dạ, em đã giữ nguyên đơn hàng cho bạn.',
    );
  });

  it('case d: ADMIN app, admin WRITE tool: interrupt happens (confirm policy: admin WRITE confirms)', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_adm_1',
            name: 'update_stock',
            args: { productId: 'p1', stock: 10 },
          },
        ],
      }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = { configurable: { thread_id: 'thread-d', ctx: adminCtx } };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Cập nhật kho')] },
      config,
    );

    expect((res as any).__interrupt__).toBeDefined();
    expect((res as any).__interrupt__.length).toBeGreaterThan(0);
    expect((res as any).__interrupt__[0].value.calls[0].risk).toBe('WRITE');
    expect(updateStockHandler).not.toHaveBeenCalled();
  });

  it('case e: unknown tool name in model tool_calls: error ToolMessage, no exception, graph ends', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [{ id: 'call_unk_1', name: 'non_existent_tool', args: {} }],
      }),
      new AIMessage({ content: 'Công cụ không khả dụng.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'thread-e', ctx: customerCtx },
    };
    const res1 = await graph.invoke(
      { messages: [new HumanMessage('Gọi tool không tồn tại')] },
      config,
    );

    expect((res1 as any).__interrupt__).toBeDefined();

    const res2 = await graph.invoke(
      new Command({
        resume: { decisions: [{ callId: 'call_unk_1', approve: true }] },
      }),
      config,
    );

    const toolMsg = res2.messages.find(
      (m: any) => m.getType() === 'tool' && m.tool_call_id === 'call_unk_1',
    );
    expect(toolMsg).toBeDefined();
    const parsed = JSON.parse(toolMsg!.content as string);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe('Công cụ không khả dụng');
    expect(res2.messages[res2.messages.length - 1].content).toBe(
      'Công cụ không khả dụng.',
    );
  });

  it('case f: invalid args fails schema validation: handler not called, error ToolMessage produced', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_inv_1',
            name: 'read_catalog',
            args: { query: 'shoes', extraField: 'unrecognized' },
          },
        ],
      }),
      new AIMessage({ content: 'Báo lỗi tham số.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'thread-f', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Tìm giày với tham số sai')] },
      config,
    );

    expect(readCatalogHandler).not.toHaveBeenCalled();
    const toolMsg = res.messages.find(
      (m: any) => m.getType() === 'tool' && m.tool_call_id === 'call_inv_1',
    );
    expect(toolMsg).toBeDefined();
    const parsed = JSON.parse(toolMsg!.content as string);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe('Tham số không hợp lệ');
    expect(res.messages[res.messages.length - 1].content).toBe(
      'Báo lỗi tham số.',
    );
  });

  it('case f (custom message): Vietnamese zod issue message is preserved', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: 'call_custom_1', name: 'custom_check', args: { code: 'a' } },
        ],
      }),
      new AIMessage({ content: 'Báo lỗi độ dài mã.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'thread-f2', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Kiểm tra mã a')] },
      config,
    );

    expect(customErrorToolHandler).not.toHaveBeenCalled();
    const toolMsg = res.messages.find(
      (m: any) => m.getType() === 'tool' && m.tool_call_id === 'call_custom_1',
    );
    expect(toolMsg).toBeDefined();
    const parsed = JSON.parse(toolMsg!.content as string);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe('Mã phải có ít nhất 2 ký tự');
  });

  it('case g: limits.maxToolCallsPerTurn = 2 limits execution to 2 calls and errors the 3rd', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: 'call_g_1', name: 'read_catalog', args: { query: 'q1' } },
          { id: 'call_g_2', name: 'read_catalog', args: { query: 'q2' } },
          { id: 'call_g_3', name: 'read_catalog', args: { query: 'q3' } },
        ],
      }),
      new AIMessage({ content: 'Đã hoàn tất tìm kiếm.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 2, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'thread-g', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Tìm 3 món')] },
      config,
    );

    expect(readCatalogHandler).toHaveBeenCalledTimes(2);

    const toolMsg3 = res.messages.find(
      (m: any) => m.getType() === 'tool' && m.tool_call_id === 'call_g_3',
    );
    expect(toolMsg3).toBeDefined();
    const parsed3 = JSON.parse(toolMsg3!.content as string);
    expect(parsed3.ok).toBe(false);
    expect(parsed3.error).toBe('Vượt quá số lượt gọi công cụ trong một lượt');
  });

  it('case h: every AIMessage tool_call id has exactly one ToolMessage in the final state', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: 'call_h_1', name: 'read_catalog', args: { query: 'laptop' } },
          { id: 'call_h_2', name: 'read_catalog', args: { query: 'mouse' } },
        ],
      }),
      new AIMessage({ content: 'Đã hoàn tất.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'thread-h', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Tìm hai món')] },
      config,
    );

    const aiMessages = res.messages.filter(
      (m: any) =>
        m.getType() === 'ai' &&
        Array.isArray(m.tool_calls) &&
        m.tool_calls.length > 0,
    );
    const toolMessages = res.messages.filter(
      (m: any) => m.getType() === 'tool',
    );

    for (const aiMsg of aiMessages) {
      for (const tc of (aiMsg as AIMessage).tool_calls!) {
        const matching = toolMessages.filter(
          (tm: any) => (tm as ToolMessage).tool_call_id === tc.id,
        );
        expect(matching).toHaveLength(1);
      }
    }
  });

  it('case i: audit.record is called with status OK for executed calls and DECLINED for declined calls', async () => {
    // 1. Executed call
    const model1 = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: 'call_aud_1', name: 'read_catalog', args: { query: 'paint' } },
        ],
      }),
      new AIMessage({ content: 'Xong.' }),
    ]);
    const graph1 = buildAgentGraph({
      model: model1,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    await graph1.invoke(
      { messages: [new HumanMessage('Tìm sơn')] },
      { configurable: { thread_id: 'thread-i1', ctx: customerCtx } },
    );

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: 'read_catalog',
        status: 'OK',
        threadId: 'th-cust',
        userId: 'cust-123',
        role: 'CUSTOMER',
        app: 'USER',
        risk: 'READ',
        durationMs: expect.any(Number),
        resultSummary: expect.any(String),
      }),
    );

    // 2. Declined call
    const model2 = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_aud_2',
            name: 'cancel_order',
            args: { orderId: 'ord-999' },
          },
        ],
      }),
      new AIMessage({ content: 'Đã hủy theo yêu cầu.' }),
    ]);
    const graph2 = buildAgentGraph({
      model: model2,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config2 = {
      configurable: { thread_id: 'thread-i2', ctx: customerCtx },
    };
    await graph2.invoke({ messages: [new HumanMessage('Hủy đơn')] }, config2);

    await graph2.invoke(
      new Command({
        resume: { decisions: [{ callId: 'call_aud_2', approve: false }] },
      }),
      config2,
    );

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: 'cancel_order',
        status: 'DECLINED',
        threadId: 'th-cust',
        userId: 'cust-123',
        role: 'CUSTOMER',
        app: 'USER',
        risk: 'DESTRUCTIVE',
        error: 'Người dùng đã từ chối thao tác này',
      }),
    );

    // 3. Guest role mapped to null in audit
    const model3 = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: 'call_aud_3', name: 'read_catalog', args: { query: 'primer' } },
        ],
      }),
      new AIMessage({ content: 'Sản phẩm primer.' }),
    ]);
    const graph3 = buildAgentGraph({
      model: model3,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    await graph3.invoke(
      { messages: [new HumanMessage('Tìm primer')] },
      { configurable: { thread_id: 'thread-i3', ctx: guestCtx } },
    );

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: 'read_catalog',
        status: 'OK',
        threadId: 'th-guest',
        userId: null,
        role: null,
        app: 'USER',
      }),
    );
  });

  it('treats missing or malformed resume value as all declined', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_malformed_1',
            name: 'cancel_order',
            args: { orderId: 'ord-mal' },
          },
        ],
      }),
      new AIMessage({ content: 'Đã hủy thao tác.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'thread-malformed', ctx: customerCtx },
    };
    await graph.invoke({ messages: [new HumanMessage('Hủy đơn')] }, config);

    // Resume with null / malformed resume
    const res = await graph.invoke(
      new Command({ resume: { decisions: 'invalid-not-an-array' as any } }),
      config,
    );

    expect(cancelOrderHandler).not.toHaveBeenCalled();
    const toolMsg = res.messages.find(
      (m: any) =>
        m.getType() === 'tool' && m.tool_call_id === 'call_malformed_1',
    );
    expect(toolMsg).toBeDefined();
    const parsed = JSON.parse(toolMsg!.content as string);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe('Người dùng đã từ chối thao tác này');
  });

  it('case preview 1: tool with a preview uses the preview text as interrupt call summary', async () => {
    const previewHandler = jest.fn().mockResolvedValue({ ok: true });
    const previewFn = jest
      .fn()
      .mockResolvedValue(
        'Đơn hàng ord-100: giao tới 123 Lê Lợi, tổng 500.000đ',
      );

    const previewTool: AgentToolDef<{ orderId: string }> = {
      name: 'confirm_order_preview',
      domain: 'orders',
      description: 'Xác nhận đơn hàng',
      schema: z.object({ orderId: z.string() }).strict(),
      auth: 'customer',
      risk: 'DESTRUCTIVE',
      handler: previewHandler,
      summarize: (args) => `Xác nhận đơn hàng ${args.orderId}`,
      preview: previewFn,
    };

    const graph = buildAgentGraph({
      model: new ScriptedFakeModel([
        new AIMessage({
          content: '',
          tool_calls: [
            {
              id: 'call_prev_1',
              name: 'confirm_order_preview',
              args: { orderId: 'ord-100' },
            },
          ],
        }),
      ]),
      registry: new ToolRegistry([previewTool]),
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-prev-1', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Xác nhận')] },
      config,
    );

    expect(previewFn).toHaveBeenCalledTimes(1);
    expect(previewFn).toHaveBeenCalledWith({ orderId: 'ord-100' }, customerCtx);
    expect((res as any).__interrupt__).toBeDefined();
    expect((res as any).__interrupt__.length).toBeGreaterThan(0);
    expect((res as any).__interrupt__[0].value.kind).toBe('confirm');
    expect((res as any).__interrupt__[0].value.calls[0].summary).toBe(
      'Đơn hàng ord-100: giao tới 123 Lê Lợi, tổng 500.000đ',
    );
  });

  it('case preview 2: tool whose preview throws uses summarize(args) and run still reaches interrupt', async () => {
    const previewHandler = jest.fn().mockResolvedValue({ ok: true });
    const previewFn = jest
      .fn()
      .mockRejectedValue(new Error('Lỗi cơ sở dữ liệu'));

    const previewTool: AgentToolDef<{ orderId: string }> = {
      name: 'throwing_preview_tool',
      domain: 'orders',
      description: 'Xác nhận đơn hàng',
      schema: z.object({ orderId: z.string() }).strict(),
      auth: 'customer',
      risk: 'DESTRUCTIVE',
      handler: previewHandler,
      summarize: (args) => `Xác nhận đơn hàng ${args.orderId}`,
      preview: previewFn,
    };

    const graph = buildAgentGraph({
      model: new ScriptedFakeModel([
        new AIMessage({
          content: '',
          tool_calls: [
            {
              id: 'call_prev_2',
              name: 'throwing_preview_tool',
              args: { orderId: 'ord-200' },
            },
          ],
        }),
      ]),
      registry: new ToolRegistry([previewTool]),
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-prev-2', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Xác nhận')] },
      config,
    );

    expect(previewFn).toHaveBeenCalledTimes(1);
    expect(previewFn).toHaveBeenCalledWith({ orderId: 'ord-200' }, customerCtx);
    expect((res as any).__interrupt__).toBeDefined();
    expect((res as any).__interrupt__.length).toBeGreaterThan(0);
    expect((res as any).__interrupt__[0].value.kind).toBe('confirm');
    expect((res as any).__interrupt__[0].value.calls[0].summary).toBe(
      'Xác nhận đơn hàng ord-200',
    );
  });

  it('case preview 3: tool whose preview returns undefined uses summarize(args)', async () => {
    const previewHandler = jest.fn().mockResolvedValue({ ok: true });
    const previewFn = jest.fn().mockResolvedValue(undefined);

    const previewTool: AgentToolDef<{ orderId: string }> = {
      name: 'undefined_preview_tool',
      domain: 'orders',
      description: 'Xác nhận đơn hàng',
      schema: z.object({ orderId: z.string() }).strict(),
      auth: 'customer',
      risk: 'DESTRUCTIVE',
      handler: previewHandler,
      summarize: (args) => `Xác nhận đơn hàng ${args.orderId}`,
      preview: previewFn,
    };

    const graph = buildAgentGraph({
      model: new ScriptedFakeModel([
        new AIMessage({
          content: '',
          tool_calls: [
            {
              id: 'call_prev_3',
              name: 'undefined_preview_tool',
              args: { orderId: 'ord-300' },
            },
          ],
        }),
      ]),
      registry: new ToolRegistry([previewTool]),
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-prev-3', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Xác nhận')] },
      config,
    );

    expect(previewFn).toHaveBeenCalledTimes(1);
    expect(previewFn).toHaveBeenCalledWith({ orderId: 'ord-300' }, customerCtx);
    expect((res as any).__interrupt__).toBeDefined();
    expect((res as any).__interrupt__.length).toBeGreaterThan(0);
    expect((res as any).__interrupt__[0].value.kind).toBe('confirm');
    expect((res as any).__interrupt__[0].value.calls[0].summary).toBe(
      'Xác nhận đơn hàng ord-300',
    );
  });

  it('case empty id 1: a tool call with an empty or missing id requiring confirmation is treated as declined by confirm node and never reaches handler', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: '', name: 'cancel_order', args: { orderId: 'ord-empty-1' } },
        ],
      }),
      new AIMessage({ content: 'Đã giữ nguyên đơn hàng.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-empty-1', ctx: customerCtx },
    };
    const res1 = await graph.invoke(
      { messages: [new HumanMessage('Hủy đơn với id rỗng')] },
      config,
    );

    expect((res1 as any).__interrupt__).toBeDefined();
    expect(cancelOrderHandler).not.toHaveBeenCalled();

    const res2 = await graph.invoke(
      new Command({ resume: { decisions: [{ callId: '', approve: true }] } }),
      config,
    );

    expect(cancelOrderHandler).not.toHaveBeenCalled();
    const toolMsg = res2.messages.find(
      (m: any) =>
        m.getType() === 'tool' && (!m.tool_call_id || m.tool_call_id === ''),
    );
    expect(toolMsg).toBeDefined();
    const parsed = JSON.parse(toolMsg!.content as string);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe('Người dùng đã từ chối thao tác này');
  });

  it('case empty id 2: a read tool call without an id never reaches handler and returns tool error', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: '', name: 'read_catalog', args: { query: 'laptop' } },
        ],
      }),
      new AIMessage({ content: 'Lỗi công cụ.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-empty-2', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Tìm laptop')] },
      config,
    );

    expect(readCatalogHandler).not.toHaveBeenCalled();
    const toolMsg = res.messages.find(
      (m: any) =>
        m.getType() === 'tool' && (!m.tool_call_id || m.tool_call_id === ''),
    );
    expect(toolMsg).toBeDefined();
    const parsed = JSON.parse(toolMsg!.content as string);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe('Mã gọi công cụ không hợp lệ');
  });

  it('case sequential: calls run sequentially in the order the model returned them', async () => {
    const events: string[] = [];
    readCatalogHandler.mockImplementation(async (args: { query: string }) => {
      events.push(`start:${args.query}`);
      await new Promise((resolve) => setTimeout(resolve, 20));
      events.push(`end:${args.query}`);
      return { items: [args.query] };
    });

    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: 'call_seq_1', name: 'read_catalog', args: { query: 'item-1' } },
          { id: 'call_seq_2', name: 'read_catalog', args: { query: 'item-2' } },
        ],
      }),
      new AIMessage({ content: 'Đã tìm cả hai sản phẩm.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-seq-1', ctx: customerCtx },
    };
    await graph.invoke({ messages: [new HumanMessage('Tìm 2 món')] }, config);

    expect(readCatalogHandler).toHaveBeenCalledTimes(2);
    expect(events).toEqual([
      'start:item-1',
      'end:item-1',
      'start:item-2',
      'end:item-2',
    ]);
  });

  it('case ABA-07: batch with two write calls runs only the first; second gets skip result and is not executed', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_w_1',
            name: 'add_to_cart',
            args: { itemId: 'item-1', quantity: 1 },
          },
          {
            id: 'call_w_2',
            name: 'add_to_cart',
            args: { itemId: 'item-2', quantity: 2 },
          },
        ],
      }),
      new AIMessage({ content: 'Đã thêm sản phẩm.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-batch-w2', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Thêm 2 món')] },
      config,
    );

    expect(addToCartHandler).toHaveBeenCalledTimes(1);
    expect(addToCartHandler).toHaveBeenCalledWith(
      { itemId: 'item-1', quantity: 1 },
      customerCtx,
    );

    const toolMsg2 = res.messages.find(
      (m: any) => m.getType() === 'tool' && m.tool_call_id === 'call_w_2',
    );
    expect(toolMsg2).toBeDefined();
    const parsed2 = JSON.parse(toolMsg2!.content as string);
    expect(parsed2.ok).toBe(false);
    expect(parsed2.error).toBe(SINGLE_WRITE_PER_TURN_ERROR);
  });

  it('case ABA-07: batch with one write call and multiple read calls runs all', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: 'call_r_1', name: 'read_catalog', args: { query: 'laptop' } },
          {
            id: 'call_w_1',
            name: 'add_to_cart',
            args: { itemId: 'p1', quantity: 1 },
          },
          { id: 'call_r_2', name: 'read_catalog', args: { query: 'mouse' } },
        ],
      }),
      new AIMessage({ content: 'Đã hoàn tất.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-batch-w1-r2', ctx: customerCtx },
    };
    const res = await graph.invoke(
      { messages: [new HumanMessage('Tìm và thêm hàng')] },
      config,
    );

    expect(readCatalogHandler).toHaveBeenCalledTimes(2);
    expect(addToCartHandler).toHaveBeenCalledTimes(1);
    expect(addToCartHandler).toHaveBeenCalledWith(
      { itemId: 'p1', quantity: 1 },
      customerCtx,
    );

    const toolMsgW = res.messages.find(
      (m: any) => m.getType() === 'tool' && m.tool_call_id === 'call_w_1',
    );
    expect(toolMsgW).toBeDefined();
    const parsedW = JSON.parse(toolMsgW!.content as string);
    expect(parsedW.ok).toBe(true);
  });

  it('case ABA-07: batch of only read calls behaves as before', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: 'call_r_1', name: 'read_catalog', args: { query: 'laptop' } },
          { id: 'call_r_2', name: 'read_catalog', args: { query: 'mouse' } },
        ],
      }),
      new AIMessage({ content: 'Kết quả tìm kiếm.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-batch-r2', ctx: customerCtx },
    };
    await graph.invoke({ messages: [new HumanMessage('Tìm cả hai')] }, config);

    expect(readCatalogHandler).toHaveBeenCalledTimes(2);
  });

  it('case ABA-07: batch with two write calls requiring confirmation runs only the first upon approval', async () => {
    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_destr_1',
            name: 'cancel_order',
            args: { orderId: 'ord-1' },
          },
          {
            id: 'call_destr_2',
            name: 'cancel_order',
            args: { orderId: 'ord-2' },
          },
        ],
      }),
      new AIMessage({ content: 'Hoàn tất.' }),
    ]);
    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-batch-destr', ctx: customerCtx },
    };
    const res1 = await graph.invoke(
      { messages: [new HumanMessage('Hủy 2 đơn hàng')] },
      config,
    );

    expect((res1 as any).__interrupt__).toBeDefined();
    expect(cancelOrderHandler).not.toHaveBeenCalled();

    const res2 = await graph.invoke(
      new Command({
        resume: {
          decisions: [
            { callId: 'call_destr_1', approve: true },
            { callId: 'call_destr_2', approve: true },
          ],
        },
      }),
      config,
    );

    expect(cancelOrderHandler).toHaveBeenCalledTimes(1);
    expect(cancelOrderHandler).toHaveBeenCalledWith(
      { orderId: 'ord-1' },
      customerCtx,
    );

    const toolMsg2 = res2.messages.find(
      (m: any) => m.getType() === 'tool' && m.tool_call_id === 'call_destr_2',
    );
    expect(toolMsg2).toBeDefined();
    const parsed2 = JSON.parse(toolMsg2!.content as string);
    expect(parsed2.ok).toBe(false);
    expect(parsed2.error).toBe(SINGLE_WRITE_PER_TURN_ERROR);
  });

  it('write tool idempotency: confirmed write tool sent twice with same thread and tool call id runs handler once and returns stored result on second call', async () => {
    const memoryStore = new Map<string, string>();
    const customAudit: AgentAuditSink = {
      record: jest.fn().mockImplementation(async (entry: ToolAuditEntry) => {
        if (entry.status === 'OK' && entry.toolCallId) {
          memoryStore.set(
            `${entry.threadId}:${entry.toolCallId}`,
            entry.resultSummary ?? 'Đã thực hiện',
          );
        }
      }),
      findCompleted: jest
        .fn()
        .mockImplementation(async (threadId: string, toolCallId: string) => {
          return memoryStore.get(`${threadId}:${toolCallId}`) ?? null;
        }),
    };

    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_write_idem_1',
            name: 'update_stock',
            args: { productId: 'p1', stock: 10 },
          },
        ],
      }),
      new AIMessage({ content: 'Tồn kho đã được cập nhật lần 1.' }),
    ]);

    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit: customAudit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = { configurable: { thread_id: 'th-idem-1', ctx: adminCtx } };

    // Turn 1: request requiring confirmation
    await graph.invoke(
      { messages: [new HumanMessage('Cập nhật kho p1')] },
      config,
    );
    expect(updateStockHandler).not.toHaveBeenCalled();

    // First confirmation: handler runs once
    const res1 = await graph.invoke(
      new Command({
        resume: { decisions: [{ callId: 'call_write_idem_1', approve: true }] },
      }),
      config,
    );
    expect(updateStockHandler).toHaveBeenCalledTimes(1);
    expect(updateStockHandler).toHaveBeenCalledWith(
      { productId: 'p1', stock: 10 },
      adminCtx,
    );

    const toolMsg1 = res1.messages.find(
      (m: any) =>
        m.getType() === 'tool' && m.tool_call_id === 'call_write_idem_1',
    );
    expect(toolMsg1).toBeDefined();

    // Second call: simulate retried confirmation for the same thread and tool call id
    const res2 = await createToolsNode({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit: customAudit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    })(
      {
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_write_idem_1',
                name: 'update_stock',
                args: { productId: 'p1', stock: 10 },
              },
            ],
          }),
        ],
      } as any,
      config,
    );

    // Handler must NOT run a second time
    expect(updateStockHandler).toHaveBeenCalledTimes(1);

    // Stored summary must be returned as the tool result content
    expect(res2.messages).toHaveLength(1);
    expect((res2.messages[0] as ToolMessage).tool_call_id).toBe(
      'call_write_idem_1',
    );
    expect((res2.messages[0] as ToolMessage).content).toBe(
      (toolMsg1 as ToolMessage).content.slice(0, 300),
    );
  });

  it('write tool idempotency: a write call with a new tool call id still runs normally', async () => {
    const memoryStore = new Map<string, string>();
    const customAudit: AgentAuditSink = {
      record: jest.fn().mockImplementation(async (entry: ToolAuditEntry) => {
        if (entry.status === 'OK' && entry.toolCallId) {
          memoryStore.set(
            `${entry.threadId}:${entry.toolCallId}`,
            entry.resultSummary ?? 'Đã thực hiện',
          );
        }
      }),
      findCompleted: jest
        .fn()
        .mockImplementation(async (threadId: string, toolCallId: string) => {
          return memoryStore.get(`${threadId}:${toolCallId}`) ?? null;
        }),
    };

    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_write_new_1',
            name: 'add_to_cart',
            args: { itemId: 'p1', quantity: 2 },
          },
        ],
      }),
      new AIMessage({ content: 'Đã thêm p1.' }),
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_write_new_2',
            name: 'add_to_cart',
            args: { itemId: 'p2', quantity: 3 },
          },
        ],
      }),
      new AIMessage({ content: 'Đã thêm p2.' }),
    ]);

    const graph = buildAgentGraph({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit: customAudit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-new-id', ctx: customerCtx },
    };

    await graph.invoke({ messages: [new HumanMessage('Thêm p1')] }, config);
    expect(addToCartHandler).toHaveBeenCalledTimes(1);
    expect(addToCartHandler).toHaveBeenLastCalledWith(
      { itemId: 'p1', quantity: 2 },
      customerCtx,
    );

    await graph.invoke({ messages: [new HumanMessage('Thêm p2')] }, config);
    expect(addToCartHandler).toHaveBeenCalledTimes(2);
    expect(addToCartHandler).toHaveBeenLastCalledWith(
      { itemId: 'p2', quantity: 3 },
      customerCtx,
    );
  });

  it('write tool idempotency: read tools behave as before and are not deduplicated across calls', async () => {
    const memoryStore = new Map<string, string>();
    const customAudit: AgentAuditSink = {
      record: jest.fn().mockImplementation(async (entry: ToolAuditEntry) => {
        if (entry.status === 'OK' && entry.toolCallId) {
          memoryStore.set(
            `${entry.threadId}:${entry.toolCallId}`,
            entry.resultSummary ?? 'Đã thực hiện',
          );
        }
      }),
      findCompleted: jest
        .fn()
        .mockImplementation(async (threadId: string, toolCallId: string) => {
          return memoryStore.get(`${threadId}:${toolCallId}`) ?? null;
        }),
    };

    const model = new ScriptedFakeModel([
      new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_read_repeat',
            name: 'read_catalog',
            args: { query: 'laptop' },
          },
        ],
      }),
      new AIMessage({ content: 'Kết quả 1.' }),
    ]);

    const toolsNode = createToolsNode({
      model,
      registry,
      checkpointer: new MemorySaver(),
      audit: customAudit,
      limits: { maxToolCallsPerTurn: 5, historyMaxMessages: 10 },
    });

    const config = {
      configurable: { thread_id: 'th-read-repeat', ctx: customerCtx },
    };
    const state = {
      messages: [
        new AIMessage({
          content: '',
          tool_calls: [
            {
              id: 'call_read_repeat',
              name: 'read_catalog',
              args: { query: 'laptop' },
            },
          ],
        }),
      ],
    } as any;

    await toolsNode(state, config);
    expect(readCatalogHandler).toHaveBeenCalledTimes(1);

    // Call again with same thread and tool call id: handler for READ tool still runs!
    await toolsNode(state, config);
    expect(readCatalogHandler).toHaveBeenCalledTimes(2);
    expect(customAudit.findCompleted).not.toHaveBeenCalled();
  });
});
