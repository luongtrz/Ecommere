import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  ),
}));

describe('NotFoundPage', () => {
  let backSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
  });

  afterEach(() => {
    backSpy.mockRestore();
  });

  it('exports NotFoundPage component', () => {
    expect(NotFoundPage).toBeDefined();
    expect(typeof NotFoundPage).toBe('function');
  });

  it('renders SEO title metadata correctly', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    const seoElement = screen.getByTestId('seo-title');
    expect(seoElement).toBeInTheDocument();
    expect(seoElement).toHaveAttribute(
      'data-title',
      '404 - Không tìm thấy trang',
    );
  });

  it('renders header banner with title and explanation', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. Có thể đường dẫn không chính xác hoặc trang đã bị xóa.',
      ),
    ).toBeInTheDocument();
  });

  it('renders main card with 404 badge, heading and detailed message', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Không tìm thấy trang',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. Có thể đường dẫn không chính xác hoặc trang đã bị xóa.',
      ),
    ).toBeInTheDocument();
  });

  it('renders action buttons with correct text and attributes', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    const homeLink = screen.getByRole('link', { name: /Về trang chủ/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    expect(backButton).toBeInTheDocument();
  });

  it('renders all popular navigation links with correct labels and destinations', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Có thể bạn đang tìm kiếm:',
      }),
    ).toBeInTheDocument();

    const catalogLink = screen.getByRole('link', { name: /Sản phẩm/i });
    expect(catalogLink).toBeInTheDocument();
    expect(catalogLink).toHaveAttribute('href', '/catalog');
    expect(screen.getByText('Xem danh mục sản phẩm')).toBeInTheDocument();

    const categoriesLink = screen.getByRole('link', {
      name: /Tìm theo danh mục/i,
    });
    expect(categoriesLink).toBeInTheDocument();
    expect(categoriesLink).toHaveAttribute('href', '/categories');
    expect(screen.getByText('Tìm theo danh mục')).toBeInTheDocument();

    const supportLink = screen.getByRole('link', { name: /Hỗ trợ/i });
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute('href', '/support');
    expect(screen.getByText('Liên hệ hỗ trợ')).toBeInTheDocument();
  });

  it('renders tip section at the bottom', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Mẹo:')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Kiểm tra lại đường dẫn URL hoặc sử dụng thanh tìm kiếm',
      ),
    ).toBeInTheDocument();
  });

  it('calls window.history.back when clicking "Quay lại" button with userEvent', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    await user.click(backButton);

    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(backSpy).toHaveBeenCalledWith();
  });

  it('calls window.history.back when clicking "Quay lại" button with fireEvent', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    const backButton = screen.getByRole('button', { name: /Quay lại/i });
    fireEvent.click(backButton);

    expect(backSpy).toHaveBeenCalledTimes(1);
    expect(backSpy).toHaveBeenCalledWith();
  });

  it('navigates to "/" when clicking "Về trang chủ" link', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <Routes>
          <Route path="/unknown-path" element={<NotFoundPage />} />
          <Route
            path="/"
            element={<div data-testid="home-target">Trang chủ</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const homeLink = screen.getByRole('link', { name: /Về trang chủ/i });
    await user.click(homeLink);

    await waitFor(() => {
      expect(screen.getByTestId('home-target')).toBeInTheDocument();
    });
  });

  it('navigates to "/catalog" when clicking "Sản phẩm" link', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <Routes>
          <Route path="/unknown-path" element={<NotFoundPage />} />
          <Route
            path="/catalog"
            element={<div data-testid="catalog-target">Trang sản phẩm</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const catalogLink = screen.getByRole('link', { name: /Sản phẩm/i });
    await user.click(catalogLink);

    await waitFor(() => {
      expect(screen.getByTestId('catalog-target')).toBeInTheDocument();
    });
  });

  it('navigates to "/categories" when clicking "Danh mục" link', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <Routes>
          <Route path="/unknown-path" element={<NotFoundPage />} />
          <Route
            path="/categories"
            element={<div data-testid="categories-target">Trang danh mục</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const categoriesLink = screen.getByRole('link', {
      name: /Tìm theo danh mục/i,
    });
    await user.click(categoriesLink);

    await waitFor(() => {
      expect(screen.getByTestId('categories-target')).toBeInTheDocument();
    });
  });

  it('navigates to "/support" when clicking "Hỗ trợ" link', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <Routes>
          <Route path="/unknown-path" element={<NotFoundPage />} />
          <Route
            path="/support"
            element={<div data-testid="support-target">Trang hỗ trợ</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    const supportLink = screen.getByRole('link', { name: /Hỗ trợ/i });
    await user.click(supportLink);

    await waitFor(() => {
      expect(screen.getByTestId('support-target')).toBeInTheDocument();
    });
  });
});
