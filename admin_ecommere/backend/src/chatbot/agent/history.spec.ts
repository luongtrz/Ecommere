import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { trimHistory } from './history';

describe('trimHistory', () => {
  it('returns a history shorter than the limit unchanged', () => {
    const messages = [
      new HumanMessage('Hello, I am looking for auto paint.'),
      new AIMessage('Hello! What color or car model are you looking for?'),
    ];
    const maxMessages = 5;

    const result = trimHistory(messages, maxMessages);

    expect(result).toEqual(messages);
    expect(result).not.toBe(messages);
  });

  it('returns a history with length equal to the limit unchanged', () => {
    const messages = [new HumanMessage('Hello'), new AIMessage('Hi there!')];
    const maxMessages = 2;

    const result = trimHistory(messages, maxMessages);

    expect(result).toEqual(messages);
    expect(result).not.toBe(messages);
  });

  it('returns an empty array unchanged when given an empty history', () => {
    const result = trimHistory([], 5);
    expect(result).toEqual([]);
  });

  it('trims a cut window starting with a tool message to the next human message', () => {
    const toolCallId = 'call_search_1';
    const messages = [
      new HumanMessage('Show me metallic black spray paint'),
      new AIMessage({
        content: 'Searching catalogue...',
        tool_calls: [
          {
            id: toolCallId,
            name: 'search_products',
            args: { query: 'metallic black spray' },
          },
        ],
      }),
      new ToolMessage({
        tool_call_id: toolCallId,
        content: JSON.stringify([{ id: 'sp-1', name: 'Metallic Black 400ml' }]),
      }),
      new HumanMessage('How much does it cost?'),
      new AIMessage('It is 150 THB per can.'),
    ];

    // Total length: 5 messages.
    // Keeping last 3 messages cuts to: [ToolMessage, HumanMessage, AIMessage].
    // Leading tool message must be dropped, window starts at the next HumanMessage.
    const result = trimHistory(messages, 3);

    expect(result).toHaveLength(2);
    expect(result[0].getType()).toBe('human');
    expect(result[0].content).toBe('How much does it cost?');
    expect(result[1].getType()).toBe('ai');
    expect(result[1].content).toBe('It is 150 THB per can.');
  });

  it('trims multiple leading tool messages to the next human message', () => {
    const messages = [
      new HumanMessage('Initial request'),
      new AIMessage({
        content: '',
        tool_calls: [
          { id: 'call_1', name: 'tool_one', args: {} },
          { id: 'call_2', name: 'tool_two', args: {} },
        ],
      }),
      new ToolMessage({ tool_call_id: 'call_1', content: 'Result 1' }),
      new ToolMessage({ tool_call_id: 'call_2', content: 'Result 2' }),
      new HumanMessage('Follow up request'),
    ];

    // maxMessages = 3 cuts to: [ToolMessage(call_2), HumanMessage] -> trimmed to [HumanMessage]
    // maxMessages = 4 cuts to: [ToolMessage(call_1), ToolMessage(call_2), HumanMessage] -> trimmed to [HumanMessage]
    const result = trimHistory(messages, 4);

    expect(result).toHaveLength(1);
    expect(result[0].getType()).toBe('human');
    expect(result[0].content).toBe('Follow up request');
  });

  it('trims a cut window starting with an AI tool-call message', () => {
    const toolCallId = 'call_check_stock';
    const messages = [
      new HumanMessage('First question: is Red Primer available?'),
      new AIMessage({
        content: 'Let me check stock for you.',
        tool_calls: [
          {
            id: toolCallId,
            name: 'check_stock',
            args: { sku: 'PRIMER-RED' },
          },
        ],
      }),
      new ToolMessage({
        tool_call_id: toolCallId,
        content: 'Stock: 12 available',
      }),
      new HumanMessage('Great, I also need clear coat.'),
      new AIMessage('We have Gloss and Matte clear coats in stock.'),
    ];

    // Total length: 5 messages.
    // Keeping last 4 messages cuts to: [AIMessage(tool_calls), ToolMessage, HumanMessage, AIMessage].
    // The cut window starts with an AI tool-call message.
    // Leading rule drops the AI tool-call message and the following ToolMessage,
    // trimming down to the next HumanMessage.
    const result = trimHistory(messages, 4);

    expect(result).toHaveLength(2);
    expect(result[0].getType()).toBe('human');
    expect(result[0].content).toBe('Great, I also need clear coat.');
    expect(result[1].getType()).toBe('ai');
    expect(result[1].content).toBe(
      'We have Gloss and Matte clear coats in stock.',
    );
  });

  it('keeps a complete tool round inside the window intact', () => {
    const toolCallId1 = 'call_stock_1';
    const toolCallId2 = 'call_price_1';

    const messages = [
      new HumanMessage('Initial conversation starter'),
      new AIMessage('Welcome to Thai Spray Shop!'),
      new HumanMessage('Check availability and price for Samurai 2K01.'),
      new AIMessage({
        content: 'Checking product details...',
        tool_calls: [
          {
            id: toolCallId1,
            name: 'check_stock',
            args: { sku: '2K01' },
          },
          {
            id: toolCallId2,
            name: 'check_price',
            args: { sku: '2K01' },
          },
        ],
      }),
      new ToolMessage({
        tool_call_id: toolCallId1,
        content: 'In stock: 5 cans',
      }),
      new ToolMessage({
        tool_call_id: toolCallId2,
        content: 'Price: 280 THB',
      }),
      new AIMessage('Samurai 2K01 is in stock (5 cans) at 280 THB.'),
    ];

    // Total length: 7 messages.
    // maxMessages = 5 keeps the last 5 messages:
    // [HumanMessage, AIMessage(tool_calls), ToolMessage 1, ToolMessage 2, AIMessage].
    // The tool round is fully contained inside the window and must be kept intact.
    const result = trimHistory(messages, 5);

    expect(result).toHaveLength(5);
    expect(result[0].getType()).toBe('human');
    expect(result[0].content).toBe(
      'Check availability and price for Samurai 2K01.',
    );
    expect(result[1].getType()).toBe('ai');
    expect((result[1] as AIMessage).tool_calls).toHaveLength(2);
    expect(result[2].getType()).toBe('tool');
    expect((result[2] as ToolMessage).tool_call_id).toBe(toolCallId1);
    expect(result[3].getType()).toBe('tool');
    expect((result[3] as ToolMessage).tool_call_id).toBe(toolCallId2);
    expect(result[4].getType()).toBe('ai');
    expect(result[4].content).toBe(
      'Samurai 2K01 is in stock (5 cans) at 280 THB.',
    );
  });

  it('removes an AI tool-call whose result is missing when tool results are completely absent', () => {
    const messages = [
      new HumanMessage('Can you check warehouse status?'),
      new AIMessage({
        content: 'Checking...',
        tool_calls: [
          {
            id: 'call_warehouse_missing',
            name: 'get_warehouse_status',
            args: {},
          },
        ],
      }),
    ];

    // History is short (2 <= 5) but the AI tool-call has no tool result in the window.
    // The orphan rule drops the AI tool-call message.
    const result = trimHistory(messages, 5);

    expect(result).toHaveLength(1);
    expect(result[0].getType()).toBe('human');
    expect(result[0].content).toBe('Can you check warehouse status?');
  });

  it('removes an AI tool-call and partial tool messages when any tool_call id is missing its result', () => {
    const toolCallId1 = 'call_part_1';
    const toolCallId2 = 'call_part_2';

    const messages = [
      new HumanMessage('Find matching primers and sandpaper'),
      new AIMessage({
        content: 'Calling lookup tools...',
        tool_calls: [
          {
            id: toolCallId1,
            name: 'find_primers',
            args: {},
          },
          {
            id: toolCallId2,
            name: 'find_sandpaper',
            args: {},
          },
        ],
      }),
      new ToolMessage({
        tool_call_id: toolCallId1,
        content: 'Primer results',
      }),
      // ToolMessage for toolCallId2 is missing!
      new HumanMessage('Nevermind, just tell me your store hours.'),
    ];

    // Because toolCallId2 has no result, the AI message and the directly following
    // ToolMessage for toolCallId1 must both be dropped.
    const result = trimHistory(messages, 5);

    expect(result).toHaveLength(2);
    expect(result[0].getType()).toBe('human');
    expect(result[0].content).toBe('Find matching primers and sandpaper');
    expect(result[1].getType()).toBe('human');
    expect(result[1].content).toBe('Nevermind, just tell me your store hours.');
  });

  it('throws RangeError naming maxMessages when maxMessages is 1 or 2.5', () => {
    const messages = [new HumanMessage('Hello'), new AIMessage('Hi')];

    expect(() => trimHistory(messages, 1)).toThrow(RangeError);
    expect(() => trimHistory(messages, 1)).toThrow(/maxMessages/);

    expect(() => trimHistory(messages, 2.5)).toThrow(RangeError);
    expect(() => trimHistory(messages, 2.5)).toThrow(/maxMessages/);

    expect(() => trimHistory(messages, 0)).toThrow(RangeError);
    expect(() => trimHistory(messages, 0)).toThrow(/maxMessages/);

    expect(() => trimHistory(messages, -1)).toThrow(RangeError);
    expect(() => trimHistory(messages, -1)).toThrow(/maxMessages/);

    expect(() => trimHistory(messages, NaN)).toThrow(RangeError);
    expect(() => trimHistory(messages, NaN)).toThrow(/maxMessages/);
  });

  it('does not mutate the input array or any message', () => {
    const humanMsg = new HumanMessage('Original user prompt');
    const aiToolMsg = new AIMessage({
      content: 'Original AI calling tool',
      tool_calls: [{ id: 'call_freeze', name: 'query_fn', args: { val: 42 } }],
    });
    const toolMsg = new ToolMessage({
      tool_call_id: 'call_freeze',
      content: 'Original tool output',
    });
    const finalAiMsg = new AIMessage('Original final response');

    const messages = [humanMsg, aiToolMsg, toolMsg, finalAiMsg];
    const messagesCopy = [...messages];

    Object.freeze(messages);
    Object.freeze(humanMsg);
    Object.freeze(aiToolMsg);
    Object.freeze(toolMsg);
    Object.freeze(finalAiMsg);

    // Call trimHistory with maxMessages = 2 (will trim the first 2)
    const result = trimHistory(messages, 2);

    // Verify input array unchanged
    expect(messages).toHaveLength(4);
    expect(messages).toEqual(messagesCopy);
    expect(result).not.toBe(messages);

    // Verify messages content / properties unchanged
    expect(humanMsg.content).toBe('Original user prompt');
    expect(aiToolMsg.tool_calls).toEqual([
      { id: 'call_freeze', name: 'query_fn', args: { val: 42 } },
    ]);
    expect(toolMsg.content).toBe('Original tool output');
    expect(finalAiMsg.content).toBe('Original final response');
  });

  it('preserves system messages at the start of the window', () => {
    const systemMsg = new SystemMessage('You are Thai Spray Shop Assistant.');
    const humanMsg = new HumanMessage('What brands do you carry?');
    const aiMsg = new AIMessage('We carry Samurai, Bosny, and Rust-Oleum.');

    const messages = [systemMsg, humanMsg, aiMsg];
    const result = trimHistory(messages, 3);

    expect(result).toHaveLength(3);
    expect(result[0].getType()).toBe('system');
    expect(result[0].content).toBe('You are Thai Spray Shop Assistant.');
  });

  it('preserves plain AI messages at the start of the window', () => {
    const plainAi = new AIMessage('Welcome! How can I assist you?');
    const human = new HumanMessage('I need spray adhesive.');

    const messages = [plainAi, human];
    const result = trimHistory(messages, 2);

    expect(result).toHaveLength(2);
    expect(result[0].getType()).toBe('ai');
    expect(result[0].content).toBe('Welcome! How can I assist you?');
    expect(result[1].getType()).toBe('human');
    expect(result[1].content).toBe('I need spray adhesive.');
  });
});
