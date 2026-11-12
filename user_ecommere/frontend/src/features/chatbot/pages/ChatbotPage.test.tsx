import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatbotPage } from './ChatbotPage';
import ChatbotPageDefault from './ChatbotPage';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../types';

// Mock SEO
vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title: string }) => <div data-testid="seo-title">{title}</div>,
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

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock chat agent hook
let mockIsStreaming = false;
const mockSend = vi.fn().mockResolvedValue(undefined);
const mockDecide = vi.fn().mockResolvedValue(undefined);
const mockCancel = vi.fn();
const mockNewThread = vi.fn();
const mockRetry = vi.fn();

vi.mock('../hooks/useChatAgent', () => ({
  useChatAgent: () => ({
    isStreaming: mockIsStreaming,
    send: mockSend,
    decide: mockDecide,
    cancel: mockCancel,
    newThread: mockNewThread,
    retry: mockRetry,
  }),
}));

// Mock chat owner sync hook
let mockMessages: ChatMessage[] = [];
vi.mock('../hooks/useChatOwnerSync', () => ({
  useChatOwnerSync: () => ({
    messages: mockMessages,
  }),
}));

// Mock stick to bottom hook
const mockScrollToBottom = vi.fn();
vi.mock('../hooks/useStickToBottom', () => ({
  useStickToBottom: () => ({
    scrollRef: { current: null },
    isAtBottom: true,
    scrollToBottom: mockScrollToBottom,
  }),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ChatbotPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ChatbotPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsStreaming = false;
    mockMessages = [];
  });

  it('exports ChatbotPage as both named and default export', () => {
    expect(ChatbotPage).toBeDefined();
    expect(ChatbotPageDefault).toBe(ChatbotPage);
  });

  it('renders page header with "Quay lại" button, font-sans title, and "Cuộc trò chuyện mới"', () => {
    renderPage();

    const backButton = screen.getByRole('button', { name: 'Quay lại' });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveClass('min-h-11', 'min-w-11');

    const heading = screen.getByRole('heading', { level: 1, name: 'Chuyên gia Mùi hương' });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('font-sans', 'text-sm', 'font-semibold');

    const newThreadButton = screen.getByRole('button', { name: 'Cuộc trò chuyện mới' });
    expect(newThreadButton).toBeInTheDocument();
    expect(newThreadButton).toHaveClass('min-h-11', 'min-w-11');
  });

  it('clicking "Quay lại" sets open in chatStore and navigates back', () => {
    renderPage();

    const backButton = screen.getByRole('button', { name: 'Quay lại' });
    fireEvent.click(backButton);

    expect(useChatStore.getState().open).toBe(true);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('clicking "Cuộc trò chuyện mới" calls newThread', () => {
    renderPage();

    const newThreadButton = screen.getByRole('button', { name: 'Cuộc trò chuyện mới' });
    fireEvent.click(newThreadButton);

    expect(mockNewThread).toHaveBeenCalledTimes(1);
  });

  it('renders centered empty state with suggestions when messages array is empty', () => {
    renderPage();

    expect(screen.getByText('Tôi có thể giúp gì cho bạn?')).toBeInTheDocument();
    const suggestions = screen.getAllByRole('button').filter((b) =>
      b.className.includes('min-h-11') && b !== screen.getByRole('button', { name: 'Quay lại' }) && b !== screen.getByRole('button', { name: 'Cuộc trò chuyện mới' })
    );
    expect(suggestions.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(suggestions[0]);
    expect(mockSend).toHaveBeenCalled();
  });

  it('renders messages when conversation is active', () => {
    mockMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Tìm xịt phòng tinh dầu cam',
        tools: [],
        createdAt: '2026-11-12T00:00:00Z',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Dưới đây là một số loại xịt phòng tinh dầu cam phù hợp.',
        tools: [],
        createdAt: '2026-11-12T00:00:05Z',
      },
    ];

    renderPage();

    expect(screen.getByText('Tìm xịt phòng tinh dầu cam')).toBeInTheDocument();
    expect(screen.getByText('Dưới đây là một số loại xịt phòng tinh dầu cam phù hợp.')).toBeInTheDocument();
  });

  it('renders AI safety disclaimer at the bottom', () => {
    renderPage();

    expect(
      screen.getByText('Trợ lý AI có thể nhầm lẫn. Vui lòng kiểm tra thông tin sản phẩm trước khi đặt hàng.')
    ).toBeInTheDocument();
  });
});
