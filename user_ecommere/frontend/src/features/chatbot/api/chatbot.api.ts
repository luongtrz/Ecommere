import apiClient from '@/lib/api';

export type ChatbotRole = 'user' | 'assistant';

export interface ChatbotHistoryMessage {
  role: ChatbotRole;
  content: string;
}

export interface SendChatbotMessagePayload {
  prompt: string;
  history?: ChatbotHistoryMessage[];
}

export interface ChatbotReply {
  message: string;
  model: string;
  usage: Record<string, number> | null;
}

export const chatbotApi = {
  async sendMessage(payload: SendChatbotMessagePayload) {
    const response = await apiClient.post('/chatbot/messages', payload);
    return (response.data.data || response.data) as ChatbotReply;
  },
};
