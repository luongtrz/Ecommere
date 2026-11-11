import type { ChatMessage } from '../types';

export const CHAT_MAX_MESSAGE_LENGTH = 4000;

export const CHAT_SUGGESTIONS: string[] = [
  'Tư vấn mùi xịt phòng cho phòng khách',
  'Nên chọn dung tích nào cho gia đình?',
  'Hướng dẫn sử dụng để mùi bền hơn',
];

export const CHAT_WELCOME_MESSAGE =
  'Xin chào! Tôi là chuyên gia tư vấn mùi hương của Thai Spray. Tôi có thể gợi ý mùi hương cho phòng khách, phòng ngủ, xe hơi hoặc quà tặng phù hợp nhất cho bạn.';

/**
 * Determines whether the typing indicator should be displayed.
 *
 * Returns true only while isStreaming is active AND the last message in the thread
 * is not an assistant message that already has non-whitespace content, tools,
 * a confirm card, or sources (i.e. the first token has not arrived yet).
 */
export function shouldShowTypingIndicator(
  messages: ChatMessage[],
  isStreaming: boolean
): boolean {
  if (!isStreaming) {
    return false;
  }

  if (messages.length === 0) {
    return true;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'assistant') {
    return true;
  }

  const hasNonWhitespaceContent = Boolean(
    lastMessage.content && lastMessage.content.trim().length > 0
  );
  const hasTools = Boolean(lastMessage.tools && lastMessage.tools.length > 0);
  const hasConfirm = Boolean(lastMessage.confirm);
  const hasSources = Boolean(lastMessage.sources && lastMessage.sources.length > 0);
  const hasError = Boolean(lastMessage.error);

  if (hasNonWhitespaceContent || hasTools || hasConfirm || hasSources || hasError) {
    return false;
  }

  return true;
}
