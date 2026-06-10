import apiClient from '@/lib/api';

export type ChatbotRole = 'user' | 'assistant';

export interface SendChatbotMessagePayload {
  prompt: string;
  sessionId: string;
}

export interface ChatbotSource {
  id: string;
  name: string;
  slug: string;
  score: number;
}

export interface ChatbotReply {
  message: string;
  model: string;
  usage: Record<string, number> | null;
  sessionId?: string | null;
  sources?: ChatbotSource[];
}

export const chatbotApi = {
  async sendMessage(payload: SendChatbotMessagePayload) {
    const response = await apiClient.post('/chatbot/messages', payload);
    return (response.data.data || response.data) as ChatbotReply;
  },

  async clearHistory(sessionId: string) {
    const response = await apiClient.delete(`/chatbot/sessions/${encodeURIComponent(sessionId)}/history`);
    return response.data.data || response.data;
  },
};
