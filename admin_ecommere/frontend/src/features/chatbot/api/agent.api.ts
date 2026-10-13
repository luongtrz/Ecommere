import { apiClient } from '@/lib/api';
import { streamAgentRequest, type SseMessage } from './sse';

export interface AgentDecision {
  callId: string;
  approve: boolean;
}

export interface AgentClientContext {
  cart?: Array<{
    variantId: string;
    quantity: number;
    name?: string;
    price?: number;
  }>;
  currentPath?: string;
}

export interface AgentTurnBody {
  prompt: string;
  threadId?: string;
  clientContext?: AgentClientContext;
}

export interface AgentThreadSummary {
  id: string;
  title: string | null;
  app: 'USER' | 'ADMIN';
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
}

export function streamTurn(
  body: AgentTurnBody,
  onMessage: (message: SseMessage) => void,
  options?: { signal?: AbortSignal }
): Promise<void> {
  return streamAgentRequest('/admin/chatbot/stream', body, onMessage, options);
}

export function resumeTurn(
  threadId: string,
  decisions: AgentDecision[],
  onMessage: (message: SseMessage) => void,
  options?: { signal?: AbortSignal }
): Promise<void> {
  return streamAgentRequest(
    `/admin/chatbot/threads/${encodeURIComponent(threadId)}/resume`,
    { decisions },
    onMessage,
    options
  );
}

export interface AgentTranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const agentApi = {
  async listThreads(limit?: number): Promise<AgentThreadSummary[]> {
    const response = await apiClient.get('/admin/chatbot/threads', {
      params: limit !== undefined ? { limit } : undefined,
    });
    return (response.data.data ?? response.data) as AgentThreadSummary[];
  },

  async getThread(threadId: string): Promise<AgentThreadSummary> {
    const response = await apiClient.get(
      `/admin/chatbot/threads/${encodeURIComponent(threadId)}`
    );
    return (response.data.data ?? response.data) as AgentThreadSummary;
  },

  async getTranscript(threadId: string): Promise<AgentTranscriptMessage[]> {
    const response = await apiClient.get(
      `/admin/chatbot/threads/${encodeURIComponent(threadId)}/messages`
    );
    return (response.data.data ?? response.data) as AgentTranscriptMessage[];
  },

  async deleteThread(threadId: string): Promise<void> {
    const response = await apiClient.delete(
      `/admin/chatbot/threads/${encodeURIComponent(threadId)}`
    );
    return response.data.data ?? response.data;
  },
};
