import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ErrorPage } from './ErrorPage';

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  ),
}));

describe('ErrorPage', () => {
  const originalLocation = window.location;
  let mockReload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReload = vi.fn();

    try {
      delete (window as any).location;
    } catch {
      // ignore
    }

    const mockLocation = {
      ...originalLocation,
      reload: mockReload,
    };

    try {
      window.location = mockLocation as any;
    } catch {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: mockLocation,
      });
    }
  });

  afterEach(() => {
    try {
      window.location = originalLocation as any;
    } catch {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: originalLocation,
      });
    }
  });

  it('exports ErrorPage component', () => {
    expect(ErrorPage).toBeDefined();
    expect(typeof ErrorPage).toBe('function');
  });

  it('renders SEO title metadata correctly', () => {
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    const seoElement = screen.getByTestId('seo-title');
    expect(seoElement).toBeInTheDocument();
    expect(seoElement).toHaveAttribute('data-title', 'Lỗi - Đã có lỗi xảy ra');
  });

  it('renders header banner with title and explanation', () => {
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Oops! Đã có lỗi xảy ra' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Xin lỗi, chúng tôi đang gặp sự cố kỹ thuật và không thể tải trang. Đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn. Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.',
      ),
    ).toBeInTheDocument();
  });

  it('renders central error card with heading and detailed description', () => {
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Oops! Đã có lỗi xảy ra' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Xin lỗi, chúng tôi đang gặp sự cố kỹ thuật và không thể tải trang. Đã có lỗi xảy ra trong quá trình xử lý yêu cầu của bạn. Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.',
      ),
    ).toBeInTheDocument();
  });

  it('renders action buttons for returning home and retrying', () => {
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    const homeLink = screen.getAllByRole('link', { name: /Về trang chủ/i })[0];
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');

    const retryButton = screen.getByRole('button', { name: /Thử lại/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('renders help section with contact support link', () => {
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Cần hỗ trợ?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Nếu bạn tiếp tục gặp vấn đề, hãy liên hệ với đội ngũ hỗ trợ của chúng tôi',
      ),
    ).toBeInTheDocument();

    const supportLink = screen.getByRole('link', { name: 'Liên hệ hỗ trợ' });
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute('href', '/support');
  });

  it('renders additional help grid with three cards', () => {
    const { container } = render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    const grid = container.querySelector<HTMLElement>('.grid')!;

    // Card 1: Về trang chủ
    expect(within(grid).getByText('Về trang chủ')).toBeInTheDocument();
    expect(
      within(grid).getByText('Quay lại trang chủ để tiếp tục mua sắm'),
    ).toBeInTheDocument();

    // Card 2: Tải lại trang
    expect(within(grid).getByText('Tải lại trang')).toBeInTheDocument();
    expect(
      within(grid).getByText('Thử tải lại trang để khắc phục lỗi'),
    ).toBeInTheDocument();

    // Card 3: Liên hệ hỗ trợ
    expect(within(grid).getByText('Liên hệ hỗ trợ')).toBeInTheDocument();
    expect(
      within(grid).getByText('Nhận trợ giúp từ đội ngũ của chúng tôi'),
    ).toBeInTheDocument();
  });

  it('calls window.location.reload when clicking "Thử lại" button with userEvent', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    const retryButton = screen.getByRole('button', { name: /Thử lại/i });
    await user.click(retryButton);

    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(mockReload).toHaveBeenCalledWith();
  });

  it('calls window.location.reload when clicking "Thử lại" button with fireEvent', () => {
    render(
      <MemoryRouter>
        <ErrorPage />
      </MemoryRouter>,
    );

    const retryButton = screen.getByRole('button', { name: /Thử lại/i });
    fireEvent.click(retryButton);

    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(mockReload).toHaveBeenCalledWith();
  });

  it('navigates to "/" when clicking "Về trang chủ" action button link', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/error']}>
        <Routes>
          <Route path="/error" element={<ErrorPage />} />
          <Route
            path="/"
            element={<div data-testid="home-target">Trang chủ</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const homeLink = screen.getAllByRole('link', { name: /Về trang chủ/i })[0];
    await user.click(homeLink);

    await waitFor(() => {
      expect(screen.getByTestId('home-target')).toBeInTheDocument();
    });
  });

  it('navigates to "/support" when clicking "Liên hệ hỗ trợ" link button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/error']}>
        <Routes>
          <Route path="/error" element={<ErrorPage />} />
          <Route
            path="/support"
            element={<div data-testid="support-target">Trang hỗ trợ</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const supportLink = screen.getByRole('link', { name: 'Liên hệ hỗ trợ' });
    await user.click(supportLink);

    await waitFor(() => {
      expect(screen.getByTestId('support-target')).toBeInTheDocument();
    });
  });
});
