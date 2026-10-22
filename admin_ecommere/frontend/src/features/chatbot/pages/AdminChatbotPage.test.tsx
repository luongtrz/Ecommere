import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
  cleanup,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import AdminChatbotPageDefault, { AdminChatbotPage } from './AdminChatbotPage';
import { useChatStore } from '../store/chatStore';
import { agentApi, type AgentThreadSummary } from '../api/agent.api';
import * as utils from '@/lib/utils';

// Mock API layer
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  authToken: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}));

// Mock SEO component
vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="mock-seo" data-title={title} />
  ),
}));

// Mock Toast hook
const mockToast = {
  toast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  promise: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
};

vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

// Mock utils with formatDateTime spyable
vi.mock('@/lib/utils', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/utils')>('@/lib/utils');
  return {
    ...actual,
    formatDateTime: vi.fn((date) => actual.formatDateTime(date)),
  };
});

// Mock Auth hook
let mockUser: { id: string; name?: string; role?: string } | null | undefined =
  {
    id: 'admin-1',
    name: 'Admin Test',
    role: 'ADMIN',
  };

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    logout: vi.fn(),
  }),
}));

// Mock useChatAgent hook
const mockSend = vi.fn();
const mockDecide = vi.fn();
const mockCancel = vi.fn();
const mockNewThread = vi.fn();
let mockIsStreaming = false;

vi.mock('../hooks/useChatAgent', () => ({
  useChatAgent: () => ({
    isStreaming: mockIsStreaming,
    send: mockSend,
    decide: mockDecide,
    cancel: mockCancel,
    newThread: mockNewThread,
  }),
}));

// Mock agentApi module
vi.mock('../api/agent.api', () => ({
  agentApi: {
    listThreads: vi.fn(),
    getThread: vi.fn(),
    getTranscript: vi.fn(),
    deleteThread: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  { queryClient = createTestQueryClient() } = {},
) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

describe('AdminChatbotPage', () => {
  beforeEach(() => {
    localStorage.clear();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    mockUser = {
      id: 'admin-1',
      name: 'Admin Test',
      role: 'ADMIN',
    };
    mockIsStreaming = false;

    useChatStore.setState({
      ownerId: 'admin-1',
      threadId: null,
      messages: [],
      open: false,
    });

    vi.mocked(agentApi.listThreads).mockReset();
    vi.mocked(agentApi.listThreads).mockResolvedValue([]);

    vi.mocked(agentApi.getTranscript).mockReset();
    vi.mocked(agentApi.getTranscript).mockResolvedValue([]);

    vi.mocked(agentApi.deleteThread).mockReset();
    vi.mocked(agentApi.deleteThread).mockResolvedValue(undefined);

    vi.mocked(utils.formatDateTime).mockReset();
    vi.mocked(utils.formatDateTime).mockImplementation((date) => {
      const d = new Date(date);
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    });

    mockSend.mockReset();
    mockSend.mockResolvedValue(undefined);

    mockDecide.mockReset();
    mockDecide.mockResolvedValue(undefined);

    mockCancel.mockReset();
    mockNewThread.mockReset();

    mockToast.toast.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
    mockToast.warning.mockReset();
    mockToast.info.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Exports and Initial Page Layout', () => {
    it('exports AdminChatbotPage as default and named export identically', () => {
      expect(AdminChatbotPageDefault).toBe(AdminChatbotPage);
    });

    it('renders header, SEO title, and description correctly', async () => {
      renderWithProviders(<AdminChatbotPage />);

      expect(screen.getByTestId('mock-seo')).toHaveAttribute(
        'data-title',
        'Trợ lý quản trị - Thai Spray Admin',
      );
      expect(
        screen.getByRole('heading', { level: 1, name: 'Trợ lý quản trị' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Điều hành cửa hàng bằng hội thoại. Mọi thao tác thay đổi dữ liệu đều cần xác nhận.',
        ),
      ).toBeInTheDocument();
    });

    it('renders empty conversation state with greeting, instructions, and all suggestions', () => {
      renderWithProviders(<AdminChatbotPage />);

      expect(
        screen.getByText('Xin chào! Tôi có thể giúp gì cho bạn?'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Chọn một trong các gợi ý bên dưới hoặc nhập yêu cầu quản trị cửa hàng của bạn.',
        ),
      ).toBeInTheDocument();

      const suggestions = [
        'Doanh thu tháng này',
        'Đơn hàng đang chờ thanh toán',
        'Sản phẩm tồn kho thấp',
        'Mã giảm giá đang hoạt động',
      ];

      for (const item of suggestions) {
        expect(
          screen.getByRole('button', { name: new RegExp(item, 'i') }),
        ).toBeInTheDocument();
      }
    });

    it('scrolls to bottom when messages or isStreaming state changes', () => {
      useChatStore.setState({
        ownerId: 'admin-1',
        messages: [
          {
            id: 'msg-scroll',
            role: 'user',
            content: 'Tin nhắn kiểm tra cuộn',
            tools: [],
            createdAt: '2026-10-22T08:00:00.000Z',
          },
        ],
      });

      renderWithProviders(<AdminChatbotPage />);

      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
      });
    });
  });

  describe('Thread List Sidebar (Desktop & Mobile)', () => {
    it('shows loading spinner when threads are loading', () => {
      vi.mocked(agentApi.listThreads).mockImplementation(
        () => new Promise(() => {}),
      );

      renderWithProviders(<AdminChatbotPage />);

      expect(screen.getByText('Đang tải danh sách…')).toBeInTheDocument();
    });

    it('shows empty thread list placeholder when no threads are returned', async () => {
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([]);

      renderWithProviders(<AdminChatbotPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Chưa có cuộc trò chuyện nào'),
        ).toBeInTheDocument();
      });
    });

    it('renders threads with titles, formatted dates, unselected and selected styles', async () => {
      const mockThreads: AgentThreadSummary[] = [
        {
          id: 'th-1',
          title: 'Kiểm tra đơn hàng hôm nay',
          app: 'ADMIN',
          totalTokens: 120,
          createdAt: '2026-10-22T08:00:00.000Z',
          updatedAt: '2026-10-22T08:30:00.000Z',
        },
        {
          id: 'th-2',
          title: null, // tests fallback title
          app: 'ADMIN',
          totalTokens: 80,
          createdAt: '2026-10-22T09:00:00.000Z',
          updatedAt: '', // tests empty dateText
        },
        {
          id: 'th-3',
          title: 'Chiến dịch khuyến mãi',
          app: 'ADMIN',
          totalTokens: 200,
          createdAt: '2026-10-22T10:00:00.000Z',
          updatedAt: 'invalid-date-string', // tests invalid dateText fallback
        },
      ];

      useChatStore.setState({ threadId: 'th-1' });
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce(mockThreads);

      renderWithProviders(<AdminChatbotPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Kiểm tra đơn hàng hôm nay'),
        ).toBeInTheDocument();
      });

      // Selected thread
      const selectedBtn = screen
        .getByText('Kiểm tra đơn hàng hôm nay')
        .closest('button');
      expect(selectedBtn).toHaveAttribute('aria-current', 'true');

      // Fallback title
      expect(
        screen.getByText('Cuộc trò chuyện chưa đặt tên'),
      ).toBeInTheDocument();

      // Invalid date rendered as-is
      expect(screen.getByText('invalid-date-string')).toBeInTheDocument();
    });

    it('handles formatDateTime throwing an exception in formatVietnameseDate', async () => {
      const mockThreads: AgentThreadSummary[] = [
        {
          id: 'th-err',
          title: 'Lỗi ngày tháng',
          app: 'ADMIN',
          totalTokens: 50,
          createdAt: '2026-10-22T08:00:00.000Z',
          updatedAt: '2026-10-22T08:30:00.000Z',
        },
      ];

      vi.mocked(utils.formatDateTime).mockImplementationOnce(() => {
        throw new Error('Formatting exception');
      });
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce(mockThreads);

      renderWithProviders(<AdminChatbotPage />);

      await waitFor(() => {
        expect(screen.getByText('Lỗi ngày tháng')).toBeInTheDocument();
      });
      // Fallback in catch block returns original dateStr
      expect(screen.getByText('2026-10-22T08:30:00.000Z')).toBeInTheDocument();
    });

    it('clicking "Cuộc trò chuyện mới" button starts a new conversation', async () => {
      renderWithProviders(<AdminChatbotPage />);

      const newThreadButtons = screen.getAllByRole('button', {
        name: /cuộc trò chuyện mới/i,
      });
      fireEvent.click(newThreadButtons[0]);

      expect(mockNewThread).toHaveBeenCalled();
    });

    it('opens mobile sheet and interacts with mobile history items', async () => {
      const mockThreads: AgentThreadSummary[] = [
        {
          id: 'th-mobile-1',
          title: 'Cuộc trò chuyện trên di động',
          app: 'ADMIN',
          totalTokens: 10,
          createdAt: '2026-10-22T08:00:00.000Z',
          updatedAt: '2026-10-22T08:30:00.000Z',
        },
      ];
      vi.mocked(agentApi.listThreads).mockResolvedValue(mockThreads);

      renderWithProviders(<AdminChatbotPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Cuộc trò chuyện trên di động'),
        ).toBeInTheDocument();
      });

      // Click "Lịch sử" button to open mobile sheet
      const mobileSheetTrigger = screen.getByRole('button', {
        name: /lịch sử/i,
      });
      fireEvent.click(mobileSheetTrigger);

      // Sheet title appears
      expect(screen.getByText('Lịch sử trò chuyện')).toBeInTheDocument();

      // Find buttons inside sheet
      const sheetNewThreadButtons = screen.getAllByRole('button', {
        name: /cuộc trò chuyện mới/i,
      });
      // Click "Cuộc trò chuyện mới" inside sheet
      fireEvent.click(sheetNewThreadButtons[sheetNewThreadButtons.length - 1]);
      expect(mockNewThread).toHaveBeenCalled();
    });

    it('handles pagination with "Tải thêm" button when threads length reaches threadLimit', async () => {
      const createThreads = (count: number): AgentThreadSummary[] =>
        Array.from({ length: count }, (_, i) => ({
          id: `thread-${i + 1}`,
          title: `Hội thoại số ${i + 1}`,
          app: 'ADMIN',
          totalTokens: 50,
          createdAt: '2026-10-22T08:00:00.000Z',
          updatedAt: '2026-10-22T08:00:00.000Z',
        }));

      vi.mocked(agentApi.listThreads).mockResolvedValueOnce(createThreads(20));

      renderWithProviders(<AdminChatbotPage />);

      const loadMoreBtn = await screen.findByRole('button', {
        name: /tải thêm/i,
      });
      expect(loadMoreBtn).toBeInTheDocument();

      // Click load more -> triggers fetch with limit 40
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce(createThreads(40));
      fireEvent.click(loadMoreBtn);

      await waitFor(() => {
        expect(agentApi.listThreads).toHaveBeenCalledWith(40);
      });
    });

    it('disables "Tải thêm" button and shows loader while fetching more threads', async () => {
      const createThreads = (count: number): AgentThreadSummary[] =>
        Array.from({ length: count }, (_, i) => ({
          id: `thread-${i + 1}`,
          title: `Hội thoại số ${i + 1}`,
          app: 'ADMIN',
          totalTokens: 50,
          createdAt: '2026-10-22T08:00:00.000Z',
          updatedAt: '2026-10-22T08:00:00.000Z',
        }));

      vi.mocked(agentApi.listThreads).mockResolvedValueOnce(createThreads(20));

      const { queryClient } = renderWithProviders(<AdminChatbotPage />);

      const loadMoreBtn = await screen.findByRole('button', {
        name: /tải thêm/i,
      });
      expect(loadMoreBtn).not.toBeDisabled();

      let resolveNext: (val: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolveNext = resolve;
      });
      vi.mocked(agentApi.listThreads).mockReturnValueOnce(
        pendingPromise as any,
      );

      // Trigger refetch while keeping limit=20 so hasMore remains true
      act(() => {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'chatbot', 'threads'],
        });
      });

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /tải thêm/i });
        expect(btn).toBeDisabled();
      });

      // Resolve pending fetch so promise cleanly finishes
      await act(async () => {
        resolveNext!(createThreads(20));
      });

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /tải thêm/i });
        expect(btn).not.toBeDisabled();
      });
    });

    it('hides "Tải thêm" button when threadLimit reaches MAX_THREAD_LIMIT (50)', async () => {
      const createThreads = (count: number): AgentThreadSummary[] =>
        Array.from({ length: count }, (_, i) => ({
          id: `thread-${i + 1}`,
          title: `Hội thoại số ${i + 1}`,
          app: 'ADMIN',
          totalTokens: 50,
          createdAt: '2026-10-22T08:00:00.000Z',
          updatedAt: '2026-10-22T08:00:00.000Z',
        }));

      vi.mocked(agentApi.listThreads).mockResolvedValueOnce(createThreads(20));
      renderWithProviders(<AdminChatbotPage />);

      const loadMoreBtn = await screen.findByRole('button', {
        name: /tải thêm/i,
      });

      // Increment limit from 20 -> 40
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce(createThreads(40));
      fireEvent.click(loadMoreBtn);

      // Wait for 40 items to be loaded and button to appear again
      const loadMoreBtn40 = await screen.findByRole('button', {
        name: /tải thêm/i,
      });
      expect(agentApi.listThreads).toHaveBeenCalledWith(40);

      // Increment limit from 40 -> 50
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce(createThreads(50));
      fireEvent.click(loadMoreBtn40);

      await waitFor(() => {
        expect(agentApi.listThreads).toHaveBeenCalledWith(50);
      });

      // At limit 50, hasMoreThreads is false (threadLimit < 50 is false)
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /tải thêm/i }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Thread Selection and Transcript Loading', () => {
    it('cancels active streaming when user selects another thread', async () => {
      mockIsStreaming = true;
      const thread: AgentThreadSummary = {
        id: 'th-select-stream',
        title: 'Cuộc trò chuyện đang chọn',
        app: 'ADMIN',
        totalTokens: 10,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);
      vi.mocked(agentApi.getTranscript).mockResolvedValueOnce([]);

      renderWithProviders(<AdminChatbotPage />);

      const threadBtn = await screen.findByText('Cuộc trò chuyện đang chọn');
      fireEvent.click(threadBtn);

      expect(mockCancel).toHaveBeenCalled();
    });

    it('loads and parses transcript messages with pending tools and default values', async () => {
      const thread: AgentThreadSummary = {
        id: 'th-transcript',
        title: 'Đơn hàng và công cụ',
        app: 'ADMIN',
        totalTokens: 15,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);

      vi.mocked(agentApi.getTranscript).mockResolvedValueOnce([
        {
          id: 'msg-u1',
          role: 'user',
          content: 'Xin chào, tôi muốn xóa sản phẩm',
        },
        {
          id: 'msg-a-confirm',
          role: 'assistant',
          content: 'Cần xác nhận thao tác nguy hiểm',
          pending: true,
          tool_calls: [
            {
              id: 'call-1',
              name: 'delete_product',
              summary: 'Xóa sản phẩm A',
              risk: 'DESTRUCTIVE',
            },
            {
              // missing id, summary, risk -> tests default fallbacks
              name: 'sync_inventory',
            },
          ],
        },
        {
          id: 'msg-a-empty',
          role: 'assistant',
          content: '   ', // whitespace only
          pending: false,
          tool_calls: [],
        },
        {
          id: 'msg-a-content',
          role: 'assistant',
          content: 'Thao tác đã được ghi nhận',
          pending: false,
        },
      ]);

      renderWithProviders(<AdminChatbotPage />);

      const threadBtn = await screen.findByText('Đơn hàng và công cụ');
      fireEvent.click(threadBtn);

      await waitFor(() => {
        expect(agentApi.getTranscript).toHaveBeenCalledWith('th-transcript');
      });

      await waitFor(() => {
        expect(
          screen.getByText('Xin chào, tôi muốn xóa sản phẩm'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('Cần xác nhận thao tác nguy hiểm'),
      ).toBeInTheDocument();
      expect(screen.getByText('Xóa sản phẩm A')).toBeInTheDocument();
      expect(screen.getByText('sync_inventory')).toBeInTheDocument();
      expect(screen.getByText('Thao tác đã được ghi nhận')).toBeInTheDocument();

      // Empty message should be skipped
      const messagesInStore = useChatStore.getState().messages;
      expect(
        messagesInStore.find((m) => m.id === 'msg-a-empty'),
      ).toBeUndefined();
    });

    it('shows loading indicator while transcript is being fetched', async () => {
      const thread: AgentThreadSummary = {
        id: 'th-loading',
        title: 'Cuộc trò chuyện đang tải',
        app: 'ADMIN',
        totalTokens: 5,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);

      let resolveTranscript: (v: any) => void;
      const transcriptPromise = new Promise((resolve) => {
        resolveTranscript = resolve;
      });
      vi.mocked(agentApi.getTranscript).mockReturnValueOnce(
        transcriptPromise as any,
      );

      renderWithProviders(<AdminChatbotPage />);

      const threadBtn = await screen.findByText('Cuộc trò chuyện đang tải');
      fireEvent.click(threadBtn);

      expect(screen.getByText('Đang tải cuộc trò chuyện…')).toBeInTheDocument();

      await act(async () => {
        resolveTranscript!([]);
      });

      await waitFor(() => {
        expect(
          screen.queryByText('Đang tải cuộc trò chuyện…'),
        ).not.toBeInTheDocument();
      });
    });

    it('ignores stale transcript response when another thread is selected (race condition guard)', async () => {
      const thread1: AgentThreadSummary = {
        id: 'th-1',
        title: 'Thứ nhất',
        app: 'ADMIN',
        totalTokens: 5,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      const thread2: AgentThreadSummary = {
        id: 'th-2',
        title: 'Thứ hai',
        app: 'ADMIN',
        totalTokens: 5,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread1, thread2]);

      let resolveTh1: (v: any) => void;
      const promiseTh1 = new Promise((resolve) => {
        resolveTh1 = resolve;
      });

      vi.mocked(agentApi.getTranscript).mockImplementation(
        (id: string): any => {
          if (id === 'th-1') return promiseTh1;
          return Promise.resolve([
            { id: 'm-th2', role: 'user', content: 'Tin nhắn hội thoại 2' },
          ]);
        },
      );

      renderWithProviders(<AdminChatbotPage />);

      const btn1 = await screen.findByText('Thứ nhất');
      fireEvent.click(btn1);

      const btn2 = await screen.findByText('Thứ hai');
      fireEvent.click(btn2);

      await waitFor(() => {
        expect(screen.getByText('Tin nhắn hội thoại 2')).toBeInTheDocument();
      });

      // Resolve stale request for th-1
      await act(async () => {
        resolveTh1!([
          { id: 'm-stale', role: 'user', content: 'Tin nhắn cũ lạc hậu' },
        ]);
      });

      expect(screen.queryByText('Tin nhắn cũ lạc hậu')).not.toBeInTheDocument();
    });

    it('handles 404 error with response.status === 404 when loading transcript', async () => {
      const thread: AgentThreadSummary = {
        id: 'th-404',
        title: 'Hội thoại đã mất',
        app: 'ADMIN',
        totalTokens: 5,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);
      vi.mocked(agentApi.getTranscript).mockRejectedValueOnce({
        response: { status: 404 },
      });

      renderWithProviders(<AdminChatbotPage />);

      const threadBtn = await screen.findByText('Hội thoại đã mất');
      fireEvent.click(threadBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Cuộc trò chuyện không còn khả dụng.',
        );
      });
      expect(mockNewThread).toHaveBeenCalled();
    });

    it('handles 404 error with err.status === 404 when loading transcript', async () => {
      const thread: AgentThreadSummary = {
        id: 'th-404-direct',
        title: 'Hội thoại lỗi 404 trực tiếp',
        app: 'ADMIN',
        totalTokens: 5,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);
      vi.mocked(agentApi.getTranscript).mockRejectedValueOnce({
        status: 404,
      });

      renderWithProviders(<AdminChatbotPage />);

      const threadBtn = await screen.findByText('Hội thoại lỗi 404 trực tiếp');
      fireEvent.click(threadBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Cuộc trò chuyện không còn khả dụng.',
        );
      });
      expect(mockNewThread).toHaveBeenCalled();
    });

    it('handles non-404 errors (status 500 or network failure) when loading transcript', async () => {
      const thread: AgentThreadSummary = {
        id: 'th-500',
        title: 'Hội thoại lỗi máy chủ',
        app: 'ADMIN',
        totalTokens: 5,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);
      vi.mocked(agentApi.getTranscript).mockRejectedValueOnce(
        new Error('Network error'),
      );

      renderWithProviders(<AdminChatbotPage />);

      const threadBtn = await screen.findByText('Hội thoại lỗi máy chủ');
      fireEvent.click(threadBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Không thể tải cuộc trò chuyện.',
        );
      });
      expect(mockNewThread).not.toHaveBeenCalled();
    });

    it('ignores transcript error when requestId is stale', async () => {
      const thread1: AgentThreadSummary = {
        id: 'th-err-stale',
        title: 'Hội thoại lỗi cũ',
        app: 'ADMIN',
        totalTokens: 5,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread1]);

      let rejectTh1: (err: any) => void;
      const promiseTh1 = new Promise((_, reject) => {
        rejectTh1 = reject;
      });
      vi.mocked(agentApi.getTranscript).mockReturnValueOnce(promiseTh1 as any);

      renderWithProviders(<AdminChatbotPage />);

      const btn1 = await screen.findByText('Hội thoại lỗi cũ');
      fireEvent.click(btn1);

      // Start new conversation to increment transcriptRequestIdRef
      const newThreadButtons = screen.getAllByRole('button', {
        name: /cuộc trò chuyện mới/i,
      });
      fireEvent.click(newThreadButtons[0]);

      await act(async () => {
        rejectTh1!({ response: { status: 500 } });
      });

      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });

  describe('Conversation Messages Rendering', () => {
    it('renders user messages with specific bubble styling', () => {
      useChatStore.setState({
        ownerId: 'admin-1',
        messages: [
          {
            id: 'u-1',
            role: 'user',
            content: 'Tin nhắn từ quản trị viên',
            tools: [],
            createdAt: '2026-10-22T08:00:00.000Z',
          },
        ],
      });

      renderWithProviders(<AdminChatbotPage />);

      expect(screen.getByText('Tin nhắn từ quản trị viên')).toBeInTheDocument();
    });

    it('renders assistant message with tool steps using ToolCallCard', () => {
      useChatStore.setState({
        ownerId: 'admin-1',
        messages: [
          {
            id: 'ast-tool',
            role: 'assistant',
            content: '',
            tools: [
              {
                id: 'step-1',
                name: 'fetch_data',
                summary: 'Đang tải dữ liệu tồn kho…',
                status: 'ok',
                resultSummary: 'Kho còn 15 sản phẩm',
              },
            ],
            createdAt: '2026-10-22T08:00:00.000Z',
          },
        ],
      });

      renderWithProviders(<AdminChatbotPage />);

      expect(screen.getByText('Đang tải dữ liệu tồn kho…')).toBeInTheDocument();
    });

    it('submits decisions from ConfirmActionCard and calls decide hook callback', () => {
      useChatStore.setState({
        ownerId: 'admin-1',
        messages: [
          {
            id: 'ast-confirm-action',
            role: 'assistant',
            content: 'Yêu cầu xóa sản phẩm khỏi kho',
            tools: [],
            confirm: {
              calls: [
                {
                  id: 'call-del-1',
                  name: 'delete_stock',
                  summary: 'Xóa 10 chai xịt phòng',
                  risk: 'DESTRUCTIVE',
                },
              ],
              decided: false,
            },
            createdAt: '2026-10-22T08:00:00.000Z',
          },
        ],
      });

      renderWithProviders(<AdminChatbotPage />);

      expect(
        screen.getByText('Yêu cầu xóa sản phẩm khỏi kho'),
      ).toBeInTheDocument();
      expect(screen.getByText('Xóa 10 chai xịt phòng')).toBeInTheDocument();

      // Click "Xác nhận tất cả"
      const confirmAllBtn = screen.getByRole('button', {
        name: 'Xác nhận tất cả',
      });
      fireEvent.click(confirmAllBtn);

      // Click "Gửi quyết định"
      const submitBtn = screen.getByRole('button', {
        name: 'Gửi quyết định',
      });
      fireEvent.click(submitBtn);

      expect(mockDecide).toHaveBeenCalledWith('ast-confirm-action', [
        { callId: 'call-del-1', approve: true },
      ]);
    });

    it('renders ConfirmActionCard without content (testing undefined margin class) and in decided state', () => {
      useChatStore.setState({
        ownerId: 'admin-1',
        messages: [
          {
            id: 'ast-confirm-no-content',
            role: 'assistant',
            content: '', // no content
            tools: [],
            confirm: {
              calls: [
                {
                  id: 'call-decided',
                  name: 'update_price',
                  summary: 'Cập nhật giá bán',
                  risk: 'WRITE',
                },
              ],
              decided: true,
            },
            createdAt: '2026-10-22T08:00:00.000Z',
          },
        ],
      });

      renderWithProviders(<AdminChatbotPage />);

      expect(screen.getByText('Cập nhật giá bán')).toBeInTheDocument();
      expect(screen.getByText('Đã phản hồi')).toBeInTheDocument();
    });

    it('renders assistant message with error in destructive alert', () => {
      useChatStore.setState({
        ownerId: 'admin-1',
        messages: [
          {
            id: 'ast-err',
            role: 'assistant',
            content: '',
            tools: [],
            error: 'Lỗi phản hồi từ AI Gateway.',
            createdAt: '2026-10-22T08:00:00.000Z',
          },
        ],
      });

      renderWithProviders(<AdminChatbotPage />);

      expect(
        screen.getByText('Lỗi phản hồi từ AI Gateway.'),
      ).toBeInTheDocument();
    });

    it('returns null for empty assistant message (!hasTools && !hasContent && !hasConfirm && !hasError)', () => {
      useChatStore.setState({
        ownerId: 'admin-1',
        messages: [
          {
            id: 'user-valid',
            role: 'user',
            content: 'Tin nhắn hợp lệ',
            tools: [],
            createdAt: '2026-10-22T08:00:00.000Z',
          },
          {
            id: 'ast-totally-empty',
            role: 'assistant',
            content: '   ',
            tools: [],
            createdAt: '2026-10-22T08:00:00.000Z',
          },
        ],
      });

      const { container } = renderWithProviders(<AdminChatbotPage />);

      expect(screen.getByText('Tin nhắn hợp lệ')).toBeInTheDocument();
      // Only one message element is rendered
      expect(container.querySelectorAll('.whitespace-pre-wrap')).toHaveLength(
        1,
      );
    });

    it('renders threadError alert and allows user to dismiss it with "Đóng" button', async () => {
      const thread: AgentThreadSummary = {
        id: 'th-err-dismiss',
        title: 'Hội thoại lỗi hiển thị',
        app: 'ADMIN',
        totalTokens: 1,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);
      vi.mocked(agentApi.getTranscript).mockRejectedValueOnce({
        status: 404,
      });

      renderWithProviders(<AdminChatbotPage />);

      const threadBtn = await screen.findByText('Hội thoại lỗi hiển thị');
      fireEvent.click(threadBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Cuộc trò chuyện không còn khả dụng.',
        );
      });
      // 404 handler immediately calls startNewConversation() which resets threadError and thread
      expect(mockNewThread).toHaveBeenCalled();
      expect(
        screen.queryByText('Cuộc trò chuyện không còn khả dụng.'),
      ).not.toBeInTheDocument();
    });

    it('renders streaming indicator with "Dừng" button and calls cancel on click', () => {
      mockIsStreaming = true;
      useChatStore.setState({
        ownerId: 'admin-1',
        messages: [
          {
            id: 'u-streaming',
            role: 'user',
            content: 'Tính doanh thu',
            tools: [],
            createdAt: '2026-10-22T08:00:00.000Z',
          },
        ],
      });

      renderWithProviders(<AdminChatbotPage />);

      expect(screen.getByText('Trợ lý đang phản hồi…')).toBeInTheDocument();

      const stopBtn = screen.getByRole('button', { name: /dừng/i });
      fireEvent.click(stopBtn);

      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('Message Input and Sending', () => {
    it('clicking a suggestion button sends the message and invalidates threads query', async () => {
      const { queryClient } = renderWithProviders(<AdminChatbotPage />);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const suggestionBtn = screen.getByRole('button', {
        name: /doanh thu tháng này/i,
      });
      fireEvent.click(suggestionBtn);

      expect(mockSend).toHaveBeenCalledWith('Doanh thu tháng này');

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['admin', 'chatbot', 'threads'],
        });
      });
    });

    it('typing into textarea and clicking send button sends trimmed message', async () => {
      renderWithProviders(<AdminChatbotPage />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập yêu cầu',
      });
      fireEvent.change(textarea, {
        target: { value: '   Cần kiểm tra sản phẩm sắp hết hàng   ' },
      });

      const sendBtn = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      expect(sendBtn).not.toBeDisabled();

      fireEvent.click(sendBtn);

      expect(mockSend).toHaveBeenCalledWith(
        'Cần kiểm tra sản phẩm sắp hết hàng',
      );
      // Textarea reset to empty
      expect(textarea).toHaveValue('');
    });

    it('disables send button when input is empty or whitespace only', () => {
      renderWithProviders(<AdminChatbotPage />);

      const sendBtn = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      expect(sendBtn).toBeDisabled();

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập yêu cầu',
      });
      fireEvent.change(textarea, { target: { value: '     ' } });

      expect(sendBtn).toBeDisabled();
    });

    it('shows toast error when message exceeds MAX_MESSAGE_LENGTH (4000 chars)', () => {
      renderWithProviders(<AdminChatbotPage />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập yêu cầu',
      });
      const tooLongText = 'A'.repeat(4001);
      fireEvent.change(textarea, { target: { value: tooLongText } });

      const sendBtn = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      fireEvent.click(sendBtn);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Tin nhắn không được vượt quá 4000 ký tự.',
      );
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('disables input, send button, and suggestion buttons when isStreaming is true', () => {
      mockIsStreaming = true;
      renderWithProviders(<AdminChatbotPage />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập yêu cầu',
      });
      expect(textarea).toBeDisabled();

      const sendBtn = screen.getByRole('button', { name: 'Gửi yêu cầu' });
      expect(sendBtn).toBeDisabled();

      const suggestionBtn = screen.getByRole('button', {
        name: /doanh thu tháng này/i,
      });
      expect(suggestionBtn).toBeDisabled();
    });

    it('pressing Enter without Shift sends message', () => {
      renderWithProviders(<AdminChatbotPage />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập yêu cầu',
      });
      fireEvent.change(textarea, {
        target: { value: 'Báo cáo bán hàng' },
      });

      fireEvent.keyDown(textarea, {
        key: 'Enter',
        shiftKey: false,
      });

      expect(mockSend).toHaveBeenCalledWith('Báo cáo bán hàng');
    });

    it('pressing Shift + Enter allows multiline and does NOT send message', () => {
      renderWithProviders(<AdminChatbotPage />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập yêu cầu',
      });
      fireEvent.change(textarea, {
        target: { value: 'Dòng 1' },
      });

      fireEvent.keyDown(textarea, {
        key: 'Enter',
        shiftKey: true,
      });

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('pressing Enter during Vietnamese IME composition (isComposing === true) does NOT send', () => {
      renderWithProviders(<AdminChatbotPage />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập yêu cầu',
      });
      fireEvent.change(textarea, {
        target: { value: 'Đang gõ tiếng Việt' },
      });

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, 'isComposing', { value: true });
      textarea.dispatchEvent(event);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('pressing Enter with empty or whitespace input does not call send', () => {
      renderWithProviders(<AdminChatbotPage />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập yêu cầu',
      });
      fireEvent.change(textarea, { target: { value: '   ' } });

      fireEvent.keyDown(textarea, {
        key: 'Enter',
        shiftKey: false,
      });

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('Thread Deletion Dialog', () => {
    it('opens delete dialog when trash icon is clicked on a thread', async () => {
      const thread: AgentThreadSummary = {
        id: 'th-del',
        title: 'Hội thoại cần xóa',
        app: 'ADMIN',
        totalTokens: 10,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);

      renderWithProviders(<AdminChatbotPage />);

      const deleteIconBtn = await screen.findByRole('button', {
        name: 'Xóa cuộc trò chuyện',
      });
      fireEvent.click(deleteIconBtn);

      expect(screen.getByText('Xóa cuộc trò chuyện')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Xóa cuộc trò chuyện này? Lịch sử sẽ không còn xem lại được.',
        ),
      ).toBeInTheDocument();
    });

    it('cancels deletion when clicking "Hủy" button in dialog', async () => {
      const thread: AgentThreadSummary = {
        id: 'th-del-cancel',
        title: 'Hội thoại không xóa',
        app: 'ADMIN',
        totalTokens: 10,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);

      renderWithProviders(<AdminChatbotPage />);

      const deleteIconBtn = await screen.findByRole('button', {
        name: 'Xóa cuộc trò chuyện',
      });
      fireEvent.click(deleteIconBtn);

      const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(
          screen.queryByText(
            'Xóa cuộc trò chuyện này? Lịch sử sẽ không còn xem lại được.',
          ),
        ).not.toBeInTheDocument();
      });
      expect(agentApi.deleteThread).not.toHaveBeenCalled();
    });

    it('confirms deletion of active thread: calls deleteThread, startNewConversation, invalidates query, shows success toast', async () => {
      useChatStore.setState({ threadId: 'th-del-active' });
      const thread: AgentThreadSummary = {
        id: 'th-del-active',
        title: 'Hội thoại đang hoạt động cần xóa',
        app: 'ADMIN',
        totalTokens: 10,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);
      vi.mocked(agentApi.deleteThread).mockResolvedValueOnce(undefined);

      const { queryClient } = renderWithProviders(<AdminChatbotPage />);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const deleteIconBtn = await screen.findByRole('button', {
        name: 'Xóa cuộc trò chuyện',
      });
      fireEvent.click(deleteIconBtn);

      const confirmDeleteBtn = screen.getByRole('button', { name: 'Xóa' });
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(agentApi.deleteThread).toHaveBeenCalledWith('th-del-active');
      });
      expect(mockNewThread).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['admin', 'chatbot', 'threads'],
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        'Đã xóa cuộc trò chuyện thành công',
      );
    });

    it('confirms deletion of inactive thread without calling startNewConversation', async () => {
      useChatStore.setState({ threadId: 'th-some-other' });
      const thread: AgentThreadSummary = {
        id: 'th-del-inactive',
        title: 'Hội thoại phụ cần xóa',
        app: 'ADMIN',
        totalTokens: 10,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);
      vi.mocked(agentApi.deleteThread).mockResolvedValueOnce(undefined);

      renderWithProviders(<AdminChatbotPage />);

      const deleteIconBtn = await screen.findByRole('button', {
        name: 'Xóa cuộc trò chuyện',
      });
      fireEvent.click(deleteIconBtn);

      const confirmDeleteBtn = screen.getByRole('button', { name: 'Xóa' });
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(agentApi.deleteThread).toHaveBeenCalledWith('th-del-inactive');
      });
      expect(mockNewThread).not.toHaveBeenCalled();
      expect(mockToast.success).toHaveBeenCalledWith(
        'Đã xóa cuộc trò chuyện thành công',
      );
    });

    it('shows error toast when thread deletion fails', async () => {
      const thread: AgentThreadSummary = {
        id: 'th-del-fail',
        title: 'Hội thoại xóa lỗi',
        app: 'ADMIN',
        totalTokens: 10,
        createdAt: '2026-10-22T08:00:00.000Z',
        updatedAt: '2026-10-22T08:00:00.000Z',
      };
      vi.mocked(agentApi.listThreads).mockResolvedValueOnce([thread]);
      vi.mocked(agentApi.deleteThread).mockRejectedValueOnce(
        new Error('Delete error'),
      );

      renderWithProviders(<AdminChatbotPage />);

      const deleteIconBtn = await screen.findByRole('button', {
        name: 'Xóa cuộc trò chuyện',
      });
      fireEvent.click(deleteIconBtn);

      const confirmDeleteBtn = screen.getByRole('button', { name: 'Xóa' });
      fireEvent.click(confirmDeleteBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Xóa cuộc trò chuyện thất bại. Vui lòng thử lại.',
        );
      });
    });
  });

  describe('Authentication and User Ownership', () => {
    it('returns early from auth effect when user is undefined', () => {
      mockUser = undefined;
      useChatStore.setState({ ownerId: 'admin-1' });

      renderWithProviders(<AdminChatbotPage />);

      expect(mockNewThread).not.toHaveBeenCalled();
      expect(useChatStore.getState().ownerId).toBe('admin-1');
    });

    it('claims owner and starts new thread when user changes from admin-1 to admin-2', () => {
      useChatStore.setState({ ownerId: 'admin-1' });
      mockUser = { id: 'admin-2', name: 'New Admin' };

      renderWithProviders(<AdminChatbotPage />);

      expect(mockNewThread).toHaveBeenCalled();
      expect(useChatStore.getState().ownerId).toBe('admin-2');
    });

    it('claims owner null and starts new thread when user logs out (user is null)', () => {
      useChatStore.setState({ ownerId: 'admin-1' });
      mockUser = null;

      renderWithProviders(<AdminChatbotPage />);

      expect(mockNewThread).toHaveBeenCalled();
      expect(useChatStore.getState().ownerId).toBeNull();
    });

    it('does not reset thread or claim owner when user matches current store ownerId', () => {
      useChatStore.setState({ ownerId: 'admin-1' });
      mockUser = { id: 'admin-1', name: 'Admin Test' };

      renderWithProviders(<AdminChatbotPage />);

      expect(mockNewThread).not.toHaveBeenCalled();
    });

    it('hides messages when user does not match store ownerId (isOwnerMatch is false)', () => {
      useChatStore.setState({
        ownerId: 'admin-different',
        messages: [
          {
            id: 'm-secret',
            role: 'user',
            content: 'Tin nhắn bảo mật của admin khác',
            tools: [],
            createdAt: '2026-10-22T08:00:00.000Z',
          },
        ],
      });
      mockUser = { id: 'admin-1' };

      renderWithProviders(<AdminChatbotPage />);

      expect(
        screen.queryByText('Tin nhắn bảo mật của admin khác'),
      ).not.toBeInTheDocument();
      // Empty state shown instead
      expect(
        screen.getByText('Xin chào! Tôi có thể giúp gì cho bạn?'),
      ).toBeInTheDocument();
    });
  });
});
