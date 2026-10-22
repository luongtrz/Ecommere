import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatbotWidget } from './ChatbotWidget';
import ChatbotWidgetDefault from './ChatbotWidget';
import { useChatStore } from '../store/chatStore';

// Mock API client to prevent network or axios usage
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  authToken: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}));

// Mock auth hook
let mockUser: { id: string; name?: string } | null | undefined = null;
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// Mock toast hook
const mockToast = {
  toast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};
vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

// Mock chat agent hook
let mockIsStreaming = false;
const mockSend = vi.fn().mockResolvedValue(undefined);
const mockDecide = vi.fn().mockResolvedValue(undefined);
const mockNewThread = vi.fn();

vi.mock('../hooks/useChatAgent', () => ({
  useChatAgent: () => ({
    isStreaming: mockIsStreaming,
    send: mockSend,
    decide: mockDecide,
    newThread: mockNewThread,
  }),
}));

const { MOCK_SESSION_ID, GUEST_OWNER_KEY } = vi.hoisted(() => {
  const sessionId = 'test-session-uuid-1234';
  return {
    MOCK_SESSION_ID: sessionId,
    GUEST_OWNER_KEY: `guest:${sessionId}`,
  };
});

// Mock session helper functions to ensure consistent guest session ID
vi.mock('../lib/session', () => ({
  getChatSessionId: () => MOCK_SESSION_ID,
  formatChatOwnerKey: (userId?: string | null) => {
    if (userId && typeof userId === 'string' && userId.trim().length > 0) {
      const trimmed = userId.trim();
      if (trimmed.startsWith('user:') || trimmed.startsWith('guest:')) {
        return trimmed;
      }
      return `user:${trimmed}`;
    }
    return `guest:${MOCK_SESSION_ID}`;
  },
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChatbotWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockIsStreaming = false;

    // Mock scrollIntoView to prevent jsdom errors and verify invocation
    Element.prototype.scrollIntoView = vi.fn();

    // Mock localStorage to prevent unmocked browser storage access
    if (typeof window !== 'undefined') {
      if (window.localStorage) {
        vi.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
          if (key === 'thai-spray-chat-session') {
            return MOCK_SESSION_ID;
          }
          return null;
        });
        vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});
        vi.spyOn(window.localStorage, 'removeItem').mockImplementation(
          () => {},
        );
        vi.spyOn(window.localStorage, 'clear').mockImplementation(() => {});
      }
      if (typeof Storage !== 'undefined' && Storage.prototype) {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
          if (key === 'thai-spray-chat-session') {
            return MOCK_SESSION_ID;
          }
          return null;
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
        vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {});
      }
    }

    // Reset Zustand chat store
    useChatStore.setState({
      open: false,
      threadId: null,
      messages: [],
      ownerId: GUEST_OWNER_KEY,
    });
  });

  describe('Module exports', () => {
    it('exports ChatbotWidget as both named and default export', () => {
      expect(ChatbotWidget).toBeDefined();
      expect(ChatbotWidgetDefault).toBeDefined();
      expect(ChatbotWidget).toBe(ChatbotWidgetDefault);
    });
  });

  describe('Closed launcher state (open === false)', () => {
    it('renders the floating launcher button and does not render the chat window', () => {
      renderWithProviders(<ChatbotWidget />);

      const toggleButton = screen.getByRole('button', {
        name: 'Mở khung trò chuyện',
      });
      expect(toggleButton).toBeInTheDocument();
      expect(screen.getByText('Tư vấn')).toBeInTheDocument();

      // Chat window content is not present
      expect(
        screen.queryByText('Chuyên gia Mùi hương'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText('Nhập câu hỏi của bạn...'),
      ).not.toBeInTheDocument();
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });

    it('clicking the launcher button opens the chat widget', () => {
      renderWithProviders(<ChatbotWidget />);

      const toggleButton = screen.getByRole('button', {
        name: 'Mở khung trò chuyện',
      });
      fireEvent.click(toggleButton);

      expect(useChatStore.getState().open).toBe(true);
      expect(screen.getByText('Chuyên gia Mùi hương')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Mở khung trò chuyện' }),
      ).not.toBeInTheDocument();
    });

    it('pressing Escape on window does not throw or trigger state changes when closed', () => {
      renderWithProviders(<ChatbotWidget />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(useChatStore.getState().open).toBe(false);
    });
  });

  describe('Open panel header and controls (open === true)', () => {
    beforeEach(() => {
      useChatStore.setState({ open: true });
    });

    it('renders header title, subtitle, new thread button and close button', () => {
      renderWithProviders(<ChatbotWidget />);

      expect(screen.getByText('Chuyên gia Mùi hương')).toBeInTheDocument();
      expect(
        screen.getByText('Tư vấn mùi thơm cho nhà ở & xe hơi'),
      ).toBeInTheDocument();

      const newThreadButton = screen.getByRole('button', {
        name: 'Cuộc trò chuyện mới',
      });
      expect(newThreadButton).toBeInTheDocument();

      const closeButton = screen.getByRole('button', {
        name: 'Đóng cửa sổ trò chuyện',
      });
      expect(closeButton).toBeInTheDocument();
    });

    it('clicking the new thread button invokes newThread', () => {
      renderWithProviders(<ChatbotWidget />);

      const newThreadButton = screen.getByRole('button', {
        name: 'Cuộc trò chuyện mới',
      });
      fireEvent.click(newThreadButton);

      expect(mockNewThread).toHaveBeenCalledTimes(1);
    });

    it('clicking the close button sets open to false', () => {
      renderWithProviders(<ChatbotWidget />);

      const closeButton = screen.getByRole('button', {
        name: 'Đóng cửa sổ trò chuyện',
      });
      fireEvent.click(closeButton);

      expect(useChatStore.getState().open).toBe(false);
    });

    it('pressing Escape on window closes the chat panel', () => {
      renderWithProviders(<ChatbotWidget />);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(useChatStore.getState().open).toBe(false);
    });

    it('pressing other keys on window does not close the panel', () => {
      renderWithProviders(<ChatbotWidget />);

      fireEvent.keyDown(window, { key: 'Enter' });
      fireEvent.keyDown(window, { key: 'Tab' });
      expect(useChatStore.getState().open).toBe(true);
    });

    it('removes window keydown event listener on unmount', () => {
      const { unmount } = renderWithProviders(<ChatbotWidget />);
      unmount();

      // Pressing Escape after unmount should not trigger any state update or error
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    it('restores focus to the toggle button when panel is closed', () => {
      renderWithProviders(<ChatbotWidget />);

      const closeButton = screen.getByRole('button', {
        name: 'Đóng cửa sổ trò chuyện',
      });
      fireEvent.click(closeButton);

      const toggleButton = screen.getByRole('button', {
        name: 'Mở khung trò chuyện',
      });
      expect(toggleButton).toHaveFocus();
    });

    it('scrolls chat container into view on mount when open', () => {
      renderWithProviders(<ChatbotWidget />);
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'end',
      });
    });
  });

  describe('Owner synchronization and message visibility', () => {
    it('does not synchronize owner or reset thread when user is undefined (auth loading)', () => {
      mockUser = undefined;
      useChatStore.setState({
        open: true,
        ownerId: 'different-owner',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Tin nhắn cũ',
            tools: [],
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);

      expect(mockNewThread).not.toHaveBeenCalled();
      // visibleMessages should be empty because isOwnerMatch is false
      expect(screen.queryByText('Tin nhắn cũ')).not.toBeInTheDocument();
      // suggestions are shown when visibleMessages is empty
      expect(screen.getByText('Gợi ý nhanh')).toBeInTheDocument();
    });

    it('claims owner and starts new thread when guest ownerId does not match current guest session', () => {
      mockUser = null;
      useChatStore.setState({
        open: true,
        ownerId: 'guest:different-session',
      });

      renderWithProviders(<ChatbotWidget />);

      expect(mockNewThread).toHaveBeenCalledTimes(1);
      expect(useChatStore.getState().ownerId).toBe(GUEST_OWNER_KEY);
    });

    it('claims owner and starts new thread when authenticated user does not match store ownerId', () => {
      mockUser = { id: 'user-789' };
      useChatStore.setState({
        open: true,
        ownerId: GUEST_OWNER_KEY,
      });

      renderWithProviders(<ChatbotWidget />);

      expect(mockNewThread).toHaveBeenCalledTimes(1);
      expect(useChatStore.getState().ownerId).toBe('user:user-789');
    });

    it('does not trigger newThread or claimOwner when ownerId already matches authenticated user', () => {
      mockUser = { id: 'user-789' };
      useChatStore.setState({
        open: true,
        ownerId: 'user:user-789',
      });

      renderWithProviders(<ChatbotWidget />);

      expect(mockNewThread).not.toHaveBeenCalled();
    });

    it('shows messages when ownerId matches user session', () => {
      mockUser = { id: 'user-1' };
      useChatStore.setState({
        open: true,
        ownerId: 'user:user-1',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Chào shop, tư vấn giúp tôi',
            tools: [],
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);
      expect(
        screen.getByText('Chào shop, tư vấn giúp tôi'),
      ).toBeInTheDocument();
    });
  });

  describe('Welcome message and suggestions', () => {
    beforeEach(() => {
      useChatStore.setState({ open: true });
    });

    it('displays the welcome message greeting', () => {
      renderWithProviders(<ChatbotWidget />);
      expect(
        screen.getByText(
          'Xin chào! Tôi là chuyên gia tư vấn mùi hương của Thai Spray. Tôi có thể gợi ý mùi hương cho phòng khách, phòng ngủ, xe hơi hoặc quà tặng phù hợp nhất cho bạn.',
        ),
      ).toBeInTheDocument();
    });

    it('displays suggestions when there are no messages in the conversation', () => {
      renderWithProviders(<ChatbotWidget />);

      expect(screen.getByText('Gợi ý nhanh')).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: 'Tư vấn mùi xịt phòng cho phòng khách',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: 'Nên chọn dung tích nào cho gia đình?',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: 'Hướng dẫn sử dụng để mùi bền hơn',
        }),
      ).toBeInTheDocument();
    });

    it('clicking a suggestion invokes send with the suggestion text when not streaming', () => {
      renderWithProviders(<ChatbotWidget />);

      const suggestionBtn = screen.getByRole('button', {
        name: 'Tư vấn mùi xịt phòng cho phòng khách',
      });
      fireEvent.click(suggestionBtn);

      expect(mockSend).toHaveBeenCalledWith(
        'Tư vấn mùi xịt phòng cho phòng khách',
      );
    });

    it('disables suggestion buttons and prevents send when isStreaming is true', () => {
      mockIsStreaming = true;
      renderWithProviders(<ChatbotWidget />);

      const suggestionBtn = screen.getByRole('button', {
        name: 'Nên chọn dung tích nào cho gia đình?',
      });
      expect(suggestionBtn).toBeDisabled();

      fireEvent.click(suggestionBtn);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('does not display suggestions when visibleMessages is not empty', () => {
      useChatStore.setState({
        open: true,
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'Có mùi nào tươi mát không?',
            tools: [],
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);
      expect(screen.queryByText('Gợi ý nhanh')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: 'Tư vấn mùi xịt phòng cho phòng khách',
        }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Message list rendering', () => {
    beforeEach(() => {
      useChatStore.setState({ open: true });
    });

    it('renders user message with appropriate styling and text', () => {
      useChatStore.setState({
        open: true,
        messages: [
          {
            id: 'u-1',
            role: 'user',
            content: 'Xin chào bot',
            tools: [],
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);
      const userMsg = screen.getByText('Xin chào bot');
      expect(userMsg).toBeInTheDocument();
      // User message container has primary-to-emerald gradient
      expect(userMsg.parentElement).toHaveClass('from-primary');
    });

    it('returns null and does not render empty assistant message without tools, confirm, sources, or error', () => {
      useChatStore.setState({
        open: true,
        messages: [
          {
            id: 'a-empty',
            role: 'assistant',
            content: '',
            tools: [],
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      const { container } = renderWithProviders(<ChatbotWidget />);
      // Only the greeting bubble is rendered in the message area
      const bubbles = container.querySelectorAll(
        '.space-y-4 > div.flex.items-start',
      );
      expect(bubbles).toHaveLength(1);
    });

    it('renders assistant markdown content via ChatMarkdown', () => {
      useChatStore.setState({
        open: true,
        messages: [
          {
            id: 'a-text',
            role: 'assistant',
            content: 'Dưới đây là **gợi ý mùi hương** cho bạn.',
            tools: [],
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);
      const strongElement = screen.getByText('gợi ý mùi hương');
      expect(strongElement.tagName).toBe('STRONG');
    });

    it('renders tool calls in ToolCallCard for running, ok, and error statuses', () => {
      useChatStore.setState({
        open: true,
        messages: [
          {
            id: 'a-tools',
            role: 'assistant',
            content: '',
            tools: [
              {
                id: 'tool-run',
                name: 'search',
                summary: 'Đang tìm kiếm sản phẩm...',
                status: 'running',
              },
              {
                id: 'tool-ok',
                name: 'filter',
                summary: 'Đã tìm thấy 3 sản phẩm',
                status: 'ok',
                resultSummary: 'Kết quả: Sả chanh, Quế, Cam',
              },
              {
                id: 'tool-err',
                name: 'inventory',
                summary: 'Lỗi kiểm tra tồn kho',
                status: 'error',
                resultSummary: 'Kho không phản hồi',
              },
            ],
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);

      expect(screen.getByText('Đang tìm kiếm sản phẩm...')).toBeInTheDocument();
      expect(screen.getByText('Đã tìm thấy 3 sản phẩm')).toBeInTheDocument();
      expect(screen.getByText('Lỗi kiểm tra tồn kho')).toBeInTheDocument();
    });

    it('renders ConfirmActionCard and allows submitting decisions via decide', async () => {
      const user = userEvent.setup();
      useChatStore.setState({
        open: true,
        messages: [
          {
            id: 'a-confirm',
            role: 'assistant',
            content: 'Vui lòng xác nhận thêm sản phẩm vào giỏ hàng.',
            tools: [],
            confirm: {
              calls: [
                {
                  id: 'call-123',
                  name: 'addToCart',
                  summary: 'Thêm xịt phòng Oải hương 100ml vào giỏ hàng',
                  risk: 'WRITE',
                },
              ],
              decided: false,
            },
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);

      expect(
        screen.getByText('Thêm xịt phòng Oải hương 100ml vào giỏ hàng'),
      ).toBeInTheDocument();
      expect(screen.getByText('Thay đổi dữ liệu')).toBeInTheDocument();

      // Bulk approve and submit
      const approveAllBtn = screen.getByRole('button', {
        name: 'Xác nhận tất cả',
      });
      await user.click(approveAllBtn);

      const submitBtn = screen.getByRole('button', {
        name: 'Gửi quyết định',
      });
      await user.click(submitBtn);

      expect(mockDecide).toHaveBeenCalledWith('a-confirm', [
        { callId: 'call-123', approve: true },
      ]);
    });

    it('renders suggested sources as product cards via ChatbotSourceItem', () => {
      useChatStore.setState({
        open: true,
        messages: [
          {
            id: 'a-sources',
            role: 'assistant',
            content: 'Sản phẩm phù hợp với bạn:',
            tools: [],
            sources: [
              {
                id: 's-1',
                name: 'Nước Xịt Phòng Sả Chanh 100ml',
                slug: 'nuoc-xit-phong-sa-chanh-100ml',
              },
            ],
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);

      expect(screen.getByText('Sản phẩm được đề xuất:')).toBeInTheDocument();
      expect(
        screen.getByText('Nước Xịt Phòng Sả Chanh 100ml'),
      ).toBeInTheDocument();
      expect(screen.getByText('TS')).toBeInTheDocument();
      expect(screen.getByText('Xem chi tiết')).toBeInTheDocument();

      const sourceLink = screen.getByRole('link');
      expect(sourceLink).toHaveAttribute(
        'href',
        '/p/nuoc-xit-phong-sa-chanh-100ml',
      );
      expect(sourceLink).toHaveAttribute('target', '_blank');
      expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders error alert when message contains error', () => {
      useChatStore.setState({
        open: true,
        messages: [
          {
            id: 'a-error',
            role: 'assistant',
            content: '',
            tools: [],
            error: 'Máy chủ quá tải, vui lòng thử lại sau ít phút.',
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(
        screen.getByText('Máy chủ quá tải, vui lòng thử lại sau ít phút.'),
      ).toBeInTheDocument();
    });

    it('renders combined assistant message with tools, content, sources, and error', () => {
      useChatStore.setState({
        open: true,
        messages: [
          {
            id: 'a-full',
            role: 'assistant',
            content: 'Nội dung phản hồi',
            tools: [
              {
                id: 't-1',
                name: 'search',
                summary: 'Tìm kiếm đã hoàn thành',
                status: 'ok',
              },
            ],
            sources: [
              {
                id: 'src-1',
                name: 'Xịt quế',
                slug: 'xit-que',
              },
            ],
            error: 'Lỗi ghi nhận cảnh báo',
            createdAt: '2026-10-21T00:00:00Z',
          },
        ],
      });

      renderWithProviders(<ChatbotWidget />);

      expect(screen.getByText('Tìm kiếm đã hoàn thành')).toBeInTheDocument();
      expect(screen.getByText('Nội dung phản hồi')).toBeInTheDocument();
      expect(screen.getByText('Xịt quế')).toBeInTheDocument();
      expect(screen.getByText('Lỗi ghi nhận cảnh báo')).toBeInTheDocument();
    });
  });

  describe('Streaming indicator', () => {
    it('displays streaming indicator when isOwnerMatch and isStreaming are true', () => {
      mockIsStreaming = true;
      useChatStore.setState({ open: true });

      renderWithProviders(<ChatbotWidget />);

      expect(screen.getByText('Đang trả lời...')).toBeInTheDocument();
    });

    it('does not display streaming indicator when isStreaming is false', () => {
      mockIsStreaming = false;
      useChatStore.setState({ open: true });

      renderWithProviders(<ChatbotWidget />);

      expect(screen.queryByText('Đang trả lời...')).not.toBeInTheDocument();
    });

    it('does not display streaming indicator when ownerId does not match user session', () => {
      mockIsStreaming = true;
      mockUser = undefined; // isOwnerMatch becomes false
      useChatStore.setState({ open: true });

      renderWithProviders(<ChatbotWidget />);

      expect(screen.queryByText('Đang trả lời...')).not.toBeInTheDocument();
    });
  });

  describe('Composer input and message submission', () => {
    beforeEach(() => {
      useChatStore.setState({ open: true });
    });

    it('renders composer textarea and disabled send button when input is empty', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', { name: 'Nhập câu hỏi' });
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute(
        'placeholder',
        'Nhập câu hỏi của bạn...',
      );

      const sendButton = screen.getByRole('button', { name: 'Gửi tin nhắn' });
      expect(sendButton).toBeDisabled();

      expect(
        screen.getByText('Nhấn Enter để gửi · Shift+Enter để xuống dòng'),
      ).toBeInTheDocument();
    });

    it('disables send button when input contains only whitespace', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', { name: 'Nhập câu hỏi' });
      fireEvent.change(textarea, { target: { value: '    ' } });

      const sendButton = screen.getByRole('button', { name: 'Gửi tin nhắn' });
      expect(sendButton).toBeDisabled();
    });

    it('enables send button and submits message when clicking send button with valid text', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập câu hỏi',
      }) as HTMLTextAreaElement;
      fireEvent.change(textarea, {
        target: { value: 'Cho tôi hỏi giá xịt phòng hoa hồng' },
      });

      const sendButton = screen.getByRole('button', { name: 'Gửi tin nhắn' });
      expect(sendButton).not.toBeDisabled();

      fireEvent.click(sendButton);

      expect(mockSend).toHaveBeenCalledWith(
        'Cho tôi hỏi giá xịt phòng hoa hồng',
      );
      expect(textarea.value).toBe('');
    });

    it('shows loading spinner inside send button and disables it when isStreaming is true', () => {
      mockIsStreaming = true;
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', { name: 'Nhập câu hỏi' });
      fireEvent.change(textarea, {
        target: { value: 'Câu hỏi trong lúc stream' },
      });

      const sendButton = screen.getByRole('button', { name: 'Gửi tin nhắn' });
      expect(sendButton).toBeDisabled();

      // Submit attempt while streaming should do nothing
      fireEvent.click(sendButton);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('shows error toast and does not send when prompt exceeds 4000 characters', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập câu hỏi',
      }) as HTMLTextAreaElement;
      const longMessage = 'A'.repeat(4001);
      fireEvent.change(textarea, { target: { value: longMessage } });

      const sendButton = screen.getByRole('button', { name: 'Gửi tin nhắn' });
      fireEvent.click(sendButton);

      expect(mockToast.error).toHaveBeenCalledWith(
        'Tin nhắn không được vượt quá 4000 ký tự.',
      );
      expect(mockSend).not.toHaveBeenCalled();
      // Draft is not cleared when error occurs
      expect(textarea.value).toBe(longMessage);
    });

    it('submits successfully when prompt has exactly 4000 characters', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập câu hỏi',
      }) as HTMLTextAreaElement;
      const exactMessage = 'B'.repeat(4000);
      fireEvent.change(textarea, { target: { value: exactMessage } });

      const sendButton = screen.getByRole('button', { name: 'Gửi tin nhắn' });
      fireEvent.click(sendButton);

      expect(mockToast.error).not.toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledWith(exactMessage);
      expect(textarea.value).toBe('');
    });

    it('submits on Enter key without shift and without IME composition', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập câu hỏi',
      }) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Gửi qua Enter' } });

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockSend).toHaveBeenCalledWith('Gửi qua Enter');
      expect(textarea.value).toBe('');
    });

    it('does not submit on Shift+Enter keypress', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập câu hỏi',
      }) as HTMLTextAreaElement;
      fireEvent.change(textarea, {
        target: { value: 'Xuống dòng với Shift+Enter' },
      });

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(mockSend).not.toHaveBeenCalled();
      expect(textarea.value).toBe('Xuống dòng với Shift+Enter');
    });

    it('does not submit on Enter key when IME composition is active (Vietnamese Telex/VNI typing)', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập câu hỏi',
      }) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Đang gõ tiếng Việt' } });

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(enterEvent, 'isComposing', { value: true });
      textarea.dispatchEvent(enterEvent);

      expect(mockSend).not.toHaveBeenCalled();
      expect(textarea.value).toBe('Đang gõ tiếng Việt');
    });

    it('does not submit when pressing non-Enter keys', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập câu hỏi',
      }) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Test phím thường' } });

      fireEvent.keyDown(textarea, { key: 'a' });
      fireEvent.keyDown(textarea, { key: 'Backspace' });

      expect(mockSend).not.toHaveBeenCalled();
      expect(textarea.value).toBe('Test phím thường');
    });

    it('does not submit on Enter key when input is only whitespace', () => {
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập câu hỏi',
      }) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '   ' } });

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('does not submit on Enter key when streaming is in progress', () => {
      mockIsStreaming = true;
      renderWithProviders(<ChatbotWidget />);

      const textarea = screen.getByRole('textbox', {
        name: 'Nhập câu hỏi',
      }) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Câu hỏi mới' } });

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});
