import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/api';
import { streamAgentRequest } from './sse';
import {
  agentApi,
  streamTurn,
  resumeTurn,
  type AgentDecision,
  type AgentTurnBody,
  type AgentThreadSummary,
  type AgentTranscriptMessage,
} from './agent.api';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('./sse', () => ({
  streamAgentRequest: vi.fn(),
}));

describe('agent.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('streamTurn', () => {
    it('delegates to streamAgentRequest with correct url, body, and options', async () => {
      vi.mocked(streamAgentRequest).mockResolvedValueOnce(undefined);

      const onMessage = vi.fn();
      const controller = new AbortController();
      const body: AgentTurnBody = {
        prompt: 'Thống kê danh sách đơn hàng chờ xử lý',
        threadId: 'th-admin-001',
        clientContext: {
          currentPath: '/admin/orders',
          cart: [
            {
              variantId: 'v-101',
              quantity: 2,
              name: 'Chai xịt 500ml',
              price: 150000,
            },
          ],
        },
      };

      await streamTurn(body, onMessage, { signal: controller.signal });

      expect(streamAgentRequest).toHaveBeenCalledTimes(1);
      expect(streamAgentRequest).toHaveBeenCalledWith(
        '/admin/chatbot/stream',
        body,
        onMessage,
        { signal: controller.signal },
      );
    });

    it('works without options provided', async () => {
      vi.mocked(streamAgentRequest).mockResolvedValueOnce(undefined);

      const onMessage = vi.fn();
      const body: AgentTurnBody = {
        prompt: 'Tạo sản phẩm mới',
      };

      await streamTurn(body, onMessage);

      expect(streamAgentRequest).toHaveBeenCalledWith(
        '/admin/chatbot/stream',
        body,
        onMessage,
        undefined,
      );
    });

    it('propagates errors when streaming fails', async () => {
      const error = new Error('Kết nối mạng gián đoạn');
      vi.mocked(streamAgentRequest).mockRejectedValueOnce(error);

      const onMessage = vi.fn();
      const body: AgentTurnBody = { prompt: 'Thất bại' };

      await expect(streamTurn(body, onMessage)).rejects.toThrow(
        'Kết nối mạng gián đoạn',
      );
    });
  });

  describe('resumeTurn', () => {
    it('delegates to streamAgentRequest with URI-encoded threadId and decision payload', async () => {
      vi.mocked(streamAgentRequest).mockResolvedValueOnce(undefined);

      const onMessage = vi.fn();
      const controller = new AbortController();
      const decisions: AgentDecision[] = [
        { callId: 'call-update-status', approve: true },
        { callId: 'call-delete-item', approve: false },
      ];

      await resumeTurn('thread/admin:special', decisions, onMessage, {
        signal: controller.signal,
      });

      expect(streamAgentRequest).toHaveBeenCalledTimes(1);
      expect(streamAgentRequest).toHaveBeenCalledWith(
        '/admin/chatbot/threads/thread%2Fadmin%3Aspecial/resume',
        { decisions },
        onMessage,
        { signal: controller.signal },
      );
    });

    it('works without options argument', async () => {
      vi.mocked(streamAgentRequest).mockResolvedValueOnce(undefined);

      const onMessage = vi.fn();
      const decisions: AgentDecision[] = [{ callId: 'call-1', approve: true }];

      await resumeTurn('thread-123', decisions, onMessage);

      expect(streamAgentRequest).toHaveBeenCalledWith(
        '/admin/chatbot/threads/thread-123/resume',
        { decisions },
        onMessage,
        undefined,
      );
    });

    it('propagates rejection on failure', async () => {
      vi.mocked(streamAgentRequest).mockRejectedValueOnce(
        new Error('Không thể tiếp tục phiên chat'),
      );

      const onMessage = vi.fn();
      await expect(resumeTurn('thread-err', [], onMessage)).rejects.toThrow(
        'Không thể tiếp tục phiên chat',
      );
    });
  });

  describe('agentApi.listThreads', () => {
    const mockThreads: AgentThreadSummary[] = [
      {
        id: 'th-1',
        title: 'Tra cứu doanh số',
        app: 'ADMIN',
        totalTokens: 1250,
        createdAt: '2026-03-01T08:00:00Z',
        updatedAt: '2026-03-01T08:15:00Z',
      },
    ];

    it('fetches threads with limit parameter and extracts response.data.data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: mockThreads },
      });

      const result = await agentApi.listThreads(10);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/admin/chatbot/threads', {
        params: { limit: 10 },
      });
      expect(result).toEqual(mockThreads);
    });

    it('passes limit: 0 when limit is 0', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: [] },
      });

      const result = await agentApi.listThreads(0);

      expect(apiClient.get).toHaveBeenCalledWith('/admin/chatbot/threads', {
        params: { limit: 0 },
      });
      expect(result).toEqual([]);
    });

    it('passes undefined params when limit is omitted and falls back to response.data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockThreads,
      });

      const result = await agentApi.listThreads();

      expect(apiClient.get).toHaveBeenCalledWith('/admin/chatbot/threads', {
        params: undefined,
      });
      expect(result).toEqual(mockThreads);
    });

    it('throws error when apiClient.get fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Lỗi máy chủ'));

      await expect(agentApi.listThreads()).rejects.toThrow('Lỗi máy chủ');
    });
  });

  describe('agentApi.getThread', () => {
    const mockThread: AgentThreadSummary = {
      id: 'th-2',
      title: 'Hỗ trợ cập nhật kho',
      app: 'ADMIN',
      totalTokens: 600,
      createdAt: '2026-03-02T10:00:00Z',
      updatedAt: '2026-03-02T10:10:00Z',
    };

    it('fetches thread by id with URI encoding and returns response.data.data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: mockThread },
      });

      const result = await agentApi.getThread('th#2/part');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/admin/chatbot/threads/th%232%2Fpart',
      );
      expect(result).toEqual(mockThread);
    });

    it('falls back to response.data if response.data.data is absent', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockThread,
      });

      const result = await agentApi.getThread('th-plain');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/admin/chatbot/threads/th-plain',
      );
      expect(result).toEqual(mockThread);
    });

    it('propagates error when apiClient.get fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Không tìm thấy phiên làm việc'),
      );

      await expect(agentApi.getThread('th-not-found')).rejects.toThrow(
        'Không tìm thấy phiên làm việc',
      );
    });
  });

  describe('agentApi.getTranscript', () => {
    const mockTranscript: AgentTranscriptMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Cập nhật trạng thái đơn hàng ORD-55 sang SHIPPED',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Tôi sẽ cập nhật trạng thái đơn hàng.',
        pending: false,
        tool_calls: [
          {
            id: 'tc-1',
            name: 'update_order_status',
            args: { orderId: 'ORD-55', status: 'SHIPPED' },
            summary: 'Cập nhật đơn hàng ORD-55 thành Đang giao',
            risk: 'WRITE',
          },
        ],
      },
    ];

    it('fetches transcript messages with encoded id and returns response.data.data', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { data: mockTranscript },
      });

      const result = await agentApi.getTranscript('thread 123');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/admin/chatbot/threads/thread%20123/messages',
      );
      expect(result).toEqual(mockTranscript);
    });

    it('falls back to response.data when unwrapped', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockTranscript,
      });

      const result = await agentApi.getTranscript('thread-simple');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/admin/chatbot/threads/thread-simple/messages',
      );
      expect(result).toEqual(mockTranscript);
    });

    it('propagates error when fetching transcript fails', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new Error('Không thể tải lịch sử tin nhắn'),
      );

      await expect(agentApi.getTranscript('th-err')).rejects.toThrow(
        'Không thể tải lịch sử tin nhắn',
      );
    });
  });

  describe('agentApi.deleteThread', () => {
    it('sends delete request with encoded threadId and returns response.data.data', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        data: { data: { success: true } },
      });

      const result = await agentApi.deleteThread('thread/to-delete');

      expect(apiClient.delete).toHaveBeenCalledTimes(1);
      expect(apiClient.delete).toHaveBeenCalledWith(
        '/admin/chatbot/threads/thread%2Fto-delete',
      );
      expect(result).toEqual({ success: true });
    });

    it('falls back to response.data when response.data.data is absent', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        data: { message: 'Đã xóa thành công' },
      });

      const result = await agentApi.deleteThread('thread-deleted');

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/admin/chatbot/threads/thread-deleted',
      );
      expect(result).toEqual({ message: 'Đã xóa thành công' });
    });

    it('propagates error when delete request fails', async () => {
      vi.mocked(apiClient.delete).mockRejectedValueOnce(
        new Error('Không có quyền xóa'),
      );

      await expect(agentApi.deleteThread('thread-protected')).rejects.toThrow(
        'Không có quyền xóa',
      );
    });
  });
});
