import apiClient from '@/lib/api';
import { streamAgentRequest, type SseMessage } from './sse';

export interface AgentDecision {
  callId: string;
  approve: boolean;
}

export interface AgentCartContextItem {
  variantId: string;
  quantity: number;
  price?: number;
  name?: string;
}

export interface AgentClientContext {
  cart?: AgentCartContextItem[];
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

/**
 * Streams assistant response for a new user turn using Server-Sent Events.
 */
export function streamTurn(
  body: AgentTurnBody,
  onMessage: (message: SseMessage) => void,
  options?: { signal?: AbortSignal }
): Promise<void> {
  return streamAgentRequest('/chatbot/stream', body, onMessage, options);
}

/**
 * Resumes assistant execution with tool call decisions using Server-Sent Events.
 */
export function resumeTurn(
  threadId: string,
  decisions: AgentDecision[],
  onMessage: (message: SseMessage) => void,
  options?: { signal?: AbortSignal }
): Promise<void> {
  return streamAgentRequest(
    `/chatbot/threads/${encodeURIComponent(threadId)}/resume`,
    { decisions },
    onMessage,
    options
  );
}

/**
 * Chatbot agent REST API endpoints for thread management.
 */
export const agentApi = {
  async listThreads(): Promise<AgentThreadSummary[]> {
    const response = await apiClient.get('/chatbot/threads');
    return (response.data?.data ?? response.data) as AgentThreadSummary[];
  },

  async getThread(threadId: string): Promise<AgentThreadSummary> {
    const response = await apiClient.get(
      `/chatbot/threads/${encodeURIComponent(threadId)}`
    );
    return (response.data?.data ?? response.data) as AgentThreadSummary;
  },

  async deleteThread(threadId: string): Promise<{ deleted: boolean }> {
    const response = await apiClient.delete(
      `/chatbot/threads/${encodeURIComponent(threadId)}`
    );
    return (response.data?.data ?? response.data) as { deleted: boolean };
  },
};
