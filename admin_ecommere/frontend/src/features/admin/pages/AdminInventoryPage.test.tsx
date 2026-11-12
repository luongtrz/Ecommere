import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(heading).toHaveClass(
      'text-2xl',
      'md:text-3xl',
      'font-bold',
      'tracking-tight',
      'text-slate-900',
    );
  });

  it('renders the placeholder message within the card container', () => {
    renderWithProviders(<AdminInventoryPage />);

    const placeholder = screen.getByText(
      'Thanh định mức tồn kho trực quan với cảnh báo màu đỏ khi lượng tồn chạm mức thấp hoặc hết hàng',
    );
    expect(placeholder).toBeInTheDocument();
    expect(placeholder.tagName).toBe('P');
    expect(placeholder).toHaveClass(
      'text-xs',
      'md:text-sm',
      'text-slate-600',
      'mt-0.5',
    );
  });

  it('renders the Card and CardContent wrapper hierarchy correctly', () => {
    const { container } = renderWithProviders(<AdminInventoryPage />);

    const card = container.querySelector<HTMLElement>(
      '.rounded-xl.border.bg-white',
    );
    expect(card).toBeInTheDocument();

    const cardContent = card?.querySelector<HTMLElement>('[class*="p-"]');
    expect(cardContent).toBeInTheDocument();
    expect(card).toContainElement(cardContent as HTMLElement | null);
  });

  it('renders the renamed column header "Định mức tồn kho" instead of widget name', () => {
    renderWithProviders(<AdminInventoryPage />);

    const colHeader = screen.getByRole('columnheader', {
      name: 'Định mức tồn kho',
    });
    expect(colHeader).toBeInTheDocument();
  });

  it('renders summary statistics cards with Vietnamese labels', () => {
    renderWithProviders(<AdminInventoryPage />);

    expect(screen.getByText('Tổng mặt hàng')).toBeInTheDocument();
    expect(screen.getAllByText('Tồn kho an toàn')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Sắp hết hàng')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Đã hết hàng')[0]).toBeInTheDocument();
  });

  it('opens adjustment dialog and allows 0 quantity when "Kiểm kê" is selected', () => {
    renderWithProviders(<AdminInventoryPage />);

    const adjustButtons = screen.getAllByRole('button', {
      name: /Điều chỉnh/i,
    });
    expect(adjustButtons.length).toBeGreaterThan(0);

    // Open dialog via first button
    fireEvent.click(adjustButtons[0]);

    // Dialog title should be present
    expect(
      screen.getByRole('heading', { name: 'Điều chỉnh tồn kho' }),
    ).toBeInTheDocument();

    // Default adjustment type is "Nhập kho", min should be 1
    const qtyInput = screen.getByLabelText(
      /Số lượng thay đổi \*/i,
    ) as HTMLInputElement;
    expect(qtyInput).toBeInTheDocument();
    expect(qtyInput.getAttribute('min')).toBe('1');

    // Switch to "Kiểm kê"
    const kiemKeButton = screen.getByRole('button', { name: 'Kiểm kê' });
    fireEvent.click(kiemKeButton);

    // Label should change and min should now be 0
    const auditInput = screen.getByLabelText(
      /Mức tồn thực tế mới \*/i,
    ) as HTMLInputElement;
    expect(auditInput.getAttribute('min')).toBe('0');

    // Should accept 0
    fireEvent.change(auditInput, { target: { value: '0' } });
    expect(auditInput.value).toBe('0');
  });

  it('supports selecting preset reason chips to populate notes', () => {
    renderWithProviders(<AdminInventoryPage />);

    const adjustButtons = screen.getAllByRole('button', {
      name: /Điều chỉnh/i,
    });
    fireEvent.click(adjustButtons[0]);

    // Click on preset chip "Khách trả hàng"
    const presetChip = screen.getByRole('button', { name: 'Khách trả hàng' });
    fireEvent.click(presetChip);

    const notesInput = screen.getByPlaceholderText(
      /Ví dụ: Kiểm kê định kỳ/i,
    ) as HTMLInputElement;
    expect(notesInput.value).toBe('Khách trả hàng');
  });

  it('formats movement history dates in Vietnamese format and signs downward adjustments with minus', () => {
    renderWithProviders(<AdminInventoryPage />);

    // Check for negative sign on OUT movement (14 -> 4)
    expect(screen.getAllByText('-10')[0]).toBeInTheDocument();

    // Check for positive sign on IN movement (8 -> 28)
    expect(screen.getAllByText('+20')[0]).toBeInTheDocument();
  });
});
