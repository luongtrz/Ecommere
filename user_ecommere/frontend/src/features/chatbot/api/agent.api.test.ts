import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import apiClient from '@/lib/api';
import { streamAgentRequest } from './sse';
import { getChatSessionId as sessionGetChatSessionId } from '../lib/session';
import {
  streamTurn,
  resumeTurn,
  agentApi,
  getChatSessionId,
  type AgentTurnBody,
  type AgentDecision,
  type AgentThreadSummary,
} from './agent.api';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('./sse', () => ({
  streamAgentRequest: vi.fn(),
}));

vi.mock('../lib/session', () => ({
  getChatSessionId: vi.fn(() => 'mock-chat-session-xyz'),
}));

describe('agent.api', () => {
  const mockedApiClient = {
    get: apiClient.get as unknown as Mock,
    delete: apiClient.delete as unknown as Mock,
  };
  const mockedStreamAgentRequest = vi.mocked(streamAgentRequest);
  const mockedGetChatSessionId = vi.mocked(sessionGetChatSessionId);

  const mockThread: AgentThreadSummary = {
    id: 'thread-123',
    title: 'Hỗ trợ mua sắm',
    app: 'USER',
    totalTokens: 450,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:05:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetChatSessionId.mockReturnValue('mock-chat-session-xyz');
  });

  describe('streamTurn', () => {
    it('calls streamAgentRequest with correct path, full body, onMessage callback, and options', async () => {
      mockedStreamAgentRequest.mockResolvedValueOnce(undefined);

      const body: AgentTurnBody = {
        prompt: 'Tìm kiếm sản phẩm dưỡng ẩm',
        threadId: 'th-abc',
        clientContext: {
          cart: [
            {
              variantId: 'var-1',
              quantity: 2,
              price: 150000,
              name: 'Xịt khoáng Thái',
            },
          ],
          currentPath: '/products/spray',
        },
      };
      const onMessage = vi.fn();
      const controller = new AbortController();
      const options = { signal: controller.signal };

      const promise = streamTurn(body, onMessage, options);

      expect(mockedStreamAgentRequest).toHaveBeenCalledWith(
        '/chatbot/stream',
        body,
        onMessage,
        options,
      );
      await expect(promise).resolves.toBeUndefined();
    });

    it('calls streamAgentRequest without options when omitted', async () => {
      mockedStreamAgentRequest.mockResolvedValueOnce(undefined);

      const body: AgentTurnBody = {
        prompt: 'Xin chào trợ lý',
      };
      const onMessage = vi.fn();

      await streamTurn(body, onMessage);

      expect(mockedStreamAgentRequest).toHaveBeenCalledWith(
        '/chatbot/stream',
        body,
        onMessage,
        undefined,
      );
    });

    it('propagates stream error when streamAgentRequest rejects', async () => {
      const error = new Error('Mất kết nối SSE');
      mockedStreamAgentRequest.mockRejectedValueOnce(error);

      const body: AgentTurnBody = { prompt: 'Test error' };
      const onMessage = vi.fn();

      await expect(streamTurn(body, onMessage)).rejects.toThrow(
        'Mất kết nối SSE',
      );
    });
  });

  describe('resumeTurn', () => {
    it('calls streamAgentRequest with URL-encoded threadId, decisions body, onMessage callback, and options', async () => {
      mockedStreamAgentRequest.mockResolvedValueOnce(undefined);

      const decisions: AgentDecision[] = [
        { callId: 'call-1', approve: true },
        { callId: 'call-2', approve: false },
      ];
      const onMessage = vi.fn();
      const controller = new AbortController();
      const options = { signal: controller.signal };

      // threadId containing characters that require URL encoding
      const threadId = 'thread 123/special&key';
      const encodedId = encodeURIComponent(threadId);

      const promise = resumeTurn(threadId, decisions, onMessage, options);

      expect(mockedStreamAgentRequest).toHaveBeenCalledWith(
        `/chatbot/threads/${encodedId}/resume`,
        { decisions },
        onMessage,
        options,
      );
      await expect(promise).resolves.toBeUndefined();
    });

    it('calls streamAgentRequest without options when omitted', async () => {
      mockedStreamAgentRequest.mockResolvedValueOnce(undefined);

      const decisions: AgentDecision[] = [{ callId: 'call-1', approve: true }];
      const onMessage = vi.fn();

      await resumeTurn('thread-simple', decisions, onMessage);

      expect(mockedStreamAgentRequest).toHaveBeenCalledWith(
        '/chatbot/threads/thread-simple/resume',
        { decisions },
        onMessage,
        undefined,
      );
    });

    it('propagates error when resumeTurn streamAgentRequest rejects', async () => {
      const error = new Error('Lỗi tiếp tục hội thoại');
      mockedStreamAgentRequest.mockRejectedValueOnce(error);

      await expect(resumeTurn('thread-err', [], vi.fn())).rejects.toThrow(
        'Lỗi tiếp tục hội thoại',
      );
    });
  });

  describe('agentApi.listThreads', () => {
    it('fetches threads and unwraps wrapped response (.data.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: [mockThread] },
      });

      const result = await agentApi.listThreads();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/chatbot/threads', {
        headers: {
          'X-Chat-Session': 'mock-chat-session-xyz',
        },
      });
      expect(result).toEqual([mockThread]);
    });

    it('fetches threads and returns unwrapped response (.data) when data.data is not present', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: [mockThread],
      });

      const result = await agentApi.listThreads();

      expect(mockedApiClient.get).toHaveBeenCalledWith('/chatbot/threads', {
        headers: {
          'X-Chat-Session': 'mock-chat-session-xyz',
        },
      });
      expect(result).toEqual([mockThread]);
    });

    it('propagates error when listThreads fails', async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error('Lỗi tải danh sách'));

      await expect(agentApi.listThreads()).rejects.toThrow('Lỗi tải danh sách');
    });
  });

  describe('agentApi.getThread', () => {
    it('fetches thread with URL-encoded threadId and unwraps response (.data.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: mockThread },
      });

      const result = await agentApi.getThread('thread-123');

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/chatbot/threads/thread-123',
        {
          headers: {
            'X-Chat-Session': 'mock-chat-session-xyz',
          },
        },
      );
      expect(result).toEqual(mockThread);
    });

    it('fetches thread with special characters encoded and returns unwrapped response (.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: mockThread,
      });

      const specialThreadId = 'th/abc 456';
      const result = await agentApi.getThread(specialThreadId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        `/chatbot/threads/${encodeURIComponent(specialThreadId)}`,
        {
          headers: {
            'X-Chat-Session': 'mock-chat-session-xyz',
          },
        },
      );
      expect(result).toEqual(mockThread);
    });

    it('propagates error when getThread fails', async () => {
      mockedApiClient.get.mockRejectedValueOnce(
        new Error('Không tìm thấy hội thoại'),
      );

      await expect(agentApi.getThread('not-found')).rejects.toThrow(
        'Không tìm thấy hội thoại',
      );
    });
  });

  describe('agentApi.deleteThread', () => {
    it('deletes thread with URL-encoded threadId and unwraps response (.data.data)', async () => {
      mockedApiClient.delete.mockResolvedValueOnce({
        data: { data: { deleted: true } },
      });

      const result = await agentApi.deleteThread('thread-to-delete');

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        '/chatbot/threads/thread-to-delete',
        {
          headers: {
            'X-Chat-Session': 'mock-chat-session-xyz',
          },
        },
      );
      expect(result).toEqual({ deleted: true });
    });

    it('deletes thread with special characters encoded and returns unwrapped response (.data)', async () => {
      mockedApiClient.delete.mockResolvedValueOnce({
        data: { deleted: false },
      });

      const specialThreadId = 'delete/me 789';
      const result = await agentApi.deleteThread(specialThreadId);

      expect(mockedApiClient.delete).toHaveBeenCalledWith(
        `/chatbot/threads/${encodeURIComponent(specialThreadId)}`,
        {
          headers: {
            'X-Chat-Session': 'mock-chat-session-xyz',
          },
        },
      );
      expect(result).toEqual({ deleted: false });
    });

    it('propagates error when deleteThread fails', async () => {
      mockedApiClient.delete.mockRejectedValueOnce(
        new Error('Lỗi xóa hội thoại'),
      );

      await expect(agentApi.deleteThread('th-err')).rejects.toThrow(
        'Lỗi xóa hội thoại',
      );
    });
  });

  describe('agentApi.getTranscript', () => {
    const mockMessages = [
      { id: 'msg-1', role: 'user', content: 'Tìm kiếm kem chống nắng' },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Dưới đây là một số sản phẩm',
      },
    ];

    it('fetches transcript with URL-encoded threadId and unwraps response (.data.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: mockMessages },
      });

      const result = await agentApi.getTranscript('thread-transcript');

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/chatbot/threads/thread-transcript/messages',
        {
          headers: {
            'X-Chat-Session': 'mock-chat-session-xyz',
          },
        },
      );
      expect(result).toEqual(mockMessages);
    });

    it('fetches transcript and returns unwrapped response (.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: mockMessages,
      });

      const specialThreadId = 'transcript/sample 1';
      const result = await agentApi.getTranscript(specialThreadId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        `/chatbot/threads/${encodeURIComponent(specialThreadId)}/messages`,
        {
          headers: {
            'X-Chat-Session': 'mock-chat-session-xyz',
          },
        },
      );
      expect(result).toEqual(mockMessages);
    });

    it('propagates error when getTranscript fails', async () => {
      mockedApiClient.get.mockRejectedValueOnce(
        new Error('Lỗi lấy transcript'),
      );

      await expect(agentApi.getTranscript('th-transcript-err')).rejects.toThrow(
        'Lỗi lấy transcript',
      );
    });
  });

  describe('agentApi.getMessages', () => {
    const mockMessages = [{ id: 'msg-10', role: 'user', content: 'Xin chào' }];

    it('fetches messages with URL-encoded threadId and unwraps response (.data.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: { data: mockMessages },
      });

      const result = await agentApi.getMessages('thread-msg');

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/chatbot/threads/thread-msg/messages',
        {
          headers: {
            'X-Chat-Session': 'mock-chat-session-xyz',
          },
        },
      );
      expect(result).toEqual(mockMessages);
    });

    it('fetches messages and returns unwrapped response (.data)', async () => {
      mockedApiClient.get.mockResolvedValueOnce({
        data: mockMessages,
      });

      const specialThreadId = 'msg/detail 99';
      const result = await agentApi.getMessages(specialThreadId);

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        `/chatbot/threads/${encodeURIComponent(specialThreadId)}/messages`,
        {
          headers: {
            'X-Chat-Session': 'mock-chat-session-xyz',
          },
        },
      );
      expect(result).toEqual(mockMessages);
    });

    it('propagates error when getMessages fails', async () => {
      mockedApiClient.get.mockRejectedValueOnce(new Error('Lỗi lấy tin nhắn'));

      await expect(agentApi.getMessages('th-msg-err')).rejects.toThrow(
        'Lỗi lấy tin nhắn',
      );
    });
  });

  describe('re-exported getChatSessionId', () => {
    it('is exported from agent.api and delegates to lib/session', () => {
      expect(getChatSessionId).toBeDefined();
      expect(typeof getChatSessionId).toBe('function');
      expect(getChatSessionId()).toBe('mock-chat-session-xyz');
    });
  });
});
