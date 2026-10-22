import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { MainLayout } from './MainLayout';

vi.mock('@/components/common/Header', () => ({
  Header: () => <header data-testid="mock-header">Mock Header</header>,
}));

vi.mock('@/components/common/Footer', () => ({
  Footer: () => <footer data-testid="mock-footer">Mock Footer</footer>,
}));

vi.mock('@/components/layout/MobileNav', () => ({
  MobileNav: () => <nav data-testid="mock-mobile-nav">Mock MobileNav</nav>,
}));

vi.mock('@/features/chatbot/components/ChatbotWidget', () => ({
  ChatbotWidget: () => <div data-testid="mock-chatbot">Mock ChatbotWidget</div>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderMainLayout(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              <div>
                <span>Nội dung trang chủ</span>
                <Link to="/catalog">Đi đến danh mục</Link>
              </div>
            }
          />
          <Route
            path="/catalog"
            element={
              <div>
                <span>Danh mục sản phẩm</span>
                <Link to="/">Quay về trang chủ</Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('MainLayout', () => {
  it('renders Header, Footer, MobileNav, ChatbotWidget and child outlet in correct structure', () => {
    const { container } = renderMainLayout('/');

    const rootDiv = container.firstElementChild;
    expect(rootDiv).toHaveClass('flex', 'min-h-screen', 'flex-col');

    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-mobile-nav')).toBeInTheDocument();
    expect(screen.getByTestId('mock-chatbot')).toBeInTheDocument();

    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('flex-1', 'pb-16', 'md:pb-0');
    expect(screen.getByText('Nội dung trang chủ')).toBeInTheDocument();
    expect(mainElement).toContainElement(
      screen.getByText('Nội dung trang chủ'),
    );
  });

  it('renders child routes properly in the Outlet', () => {
    renderMainLayout('/catalog');

    expect(screen.getByText('Danh mục sản phẩm')).toBeInTheDocument();
  });

  it('updates outlet content when navigating between routes', async () => {
    const user = userEvent.setup();
    renderMainLayout('/');

    expect(screen.getByText('Nội dung trang chủ')).toBeInTheDocument();
    expect(screen.queryByText('Danh mục sản phẩm')).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Đi đến danh mục' }));

    expect(screen.getByText('Danh mục sản phẩm')).toBeInTheDocument();
    expect(screen.queryByText('Nội dung trang chủ')).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Quay về trang chủ' }));

    expect(screen.getByText('Nội dung trang chủ')).toBeInTheDocument();
  });
});
