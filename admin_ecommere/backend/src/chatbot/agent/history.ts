import { BaseMessage } from '@langchain/core/messages';

/**
 * Checks if a message is an AI message with non-empty tool_calls.
 */
function isAiToolCallMessage(message: BaseMessage): boolean {
  if (message.getType() !== 'ai') {
    return false;
  }
  const toolCalls = (message as { tool_calls?: unknown[] }).tool_calls;
  return Array.isArray(toolCalls) && toolCalls.length > 0;
}

/**
 * Applies the orphan rule to a window of messages:
 * Every 'ai' message with tool_calls must be followed by a 'tool' message for EACH of its tool_call ids.
 * If any id has no result in the window, drop that AI message and the tool messages that directly follow it.
 */
function applyOrphanRule(messages: BaseMessage[]): BaseMessage[] {
  const result: BaseMessage[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];

    if (isAiToolCallMessage(msg)) {
      // Collect tool messages directly following this AI message
      const followingTools: BaseMessage[] = [];
      let j = i + 1;
      while (j < messages.length && messages[j].getType() === 'tool') {
        followingTools.push(messages[j]);
        j++;
      }

      const toolCalls = (
        msg as { tool_calls?: Array<{ id?: string }> }
      ).tool_calls;
      const followingToolCallIds = new Set(
        followingTools
          .map((t) => (t as { tool_call_id?: string }).tool_call_id)
          .filter(Boolean),
      );

      const allResultsPresent =
        Array.isArray(toolCalls) &&
        toolCalls.length > 0 &&
        toolCalls.every(
          (tc) => Boolean(tc?.id) && followingToolCallIds.has(tc.id!),
        );

      if (allResultsPresent) {
        result.push(msg, ...followingTools);
      }
      // If any id has no result in the window, drop that AI message and the tool messages that directly follow it.

      i = j;
    } else {
      result.push(msg);
      i++;
    }
  }

  return result;
}

/**
 * Applies the leading rule to a window of messages:
 * While the first remaining message is 'tool', or is an 'ai' message with tool_calls, drop it.
 * The window must start at a 'human' message, a plain 'ai' message or a 'system' message.
 */
function applyLeadingRule(messages: BaseMessage[]): BaseMessage[] {
  let startIndex = 0;
  while (startIndex < messages.length) {
    const msg = messages[startIndex];
    if (msg.getType() === 'tool' || isAiToolCallMessage(msg)) {
      startIndex++;
    } else {
      break;
    }
  }
  return messages.slice(startIndex);
}

/**
 * Trims chat history sent to the model so an OpenAI tool-call history stays valid.
 * Pure function: never mutates the input array or any message.
 */
export function trimHistory(
  messages: BaseMessage[],
  maxMessages: number,
): BaseMessage[] {
  if (!Number.isInteger(maxMessages) || maxMessages < 2) {
    throw new RangeError(
      `maxMessages must be an integer >= 2, received ${maxMessages}`,
    );
  }

  const window =
    messages.length <= maxMessages
      ? [...messages]
      : messages.slice(-maxMessages);

  const withoutOrphans = applyOrphanRule(window);
  const trimmed = applyLeadingRule(withoutOrphans);

  return trimmed;
}
