import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SEO } from '@/lib/seo';
import { AdminInventoryPage } from './AdminInventoryPage';

vi.mock('@/lib/seo', () => ({
  SEO: vi.fn(({ title }: { title?: string }) => (
    <div data-testid="mock-seo" data-title={title} />
  )),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin/inventory']}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminInventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the SEO component with the correct page title', () => {
    renderWithProviders(<AdminInventoryPage />);

    expect(SEO).toHaveBeenCalledTimes(1);
    expect(SEO).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Quản lý kho hàng - Admin',
      }),
      expect.anything(),
    );

    const seoElement = screen.getByTestId('mock-seo');
    expect(seoElement).toBeInTheDocument();
    expect(seoElement).toHaveAttribute(
      'data-title',
      'Quản lý kho hàng - Admin',
    );
  });

  it('renders the main heading with exact Vietnamese text', () => {
    renderWithProviders(<AdminInventoryPage />);

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Quản lý kho hàng',
    });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('text-3xl', 'font-bold', 'mb-8');
  });

  it('renders the placeholder message within the card container', () => {
    renderWithProviders(<AdminInventoryPage />);

    const placeholder = screen.getByText(
      'Danh sách kho hàng sẽ hiển thị tại đây',
    );
    expect(placeholder).toBeInTheDocument();
    expect(placeholder.tagName).toBe('P');
    expect(placeholder).toHaveClass(
      'text-muted-foreground',
      'text-center',
      'py-12',
    );
  });

  it('renders the Card and CardContent wrapper hierarchy correctly', () => {
    const { container } = renderWithProviders(<AdminInventoryPage />);

    const card = container.querySelector<HTMLElement>(
      '.rounded-lg.border.bg-card',
    );
    expect(card).toBeInTheDocument();

    const cardContent = container.querySelector<HTMLElement>('.p-6');
    expect(cardContent).toBeInTheDocument();
    expect(card).toContainElement(cardContent as HTMLElement | null);
  });
});
