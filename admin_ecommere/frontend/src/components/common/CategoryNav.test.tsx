import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryNav } from './CategoryNav';
import { useCategories } from '@/features/catalog/hooks/useCategories';

// Mock API client to prevent any network or axios calls
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    decode: vi.fn(),
  },
}));

vi.mock('@/features/catalog/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

const mockCategories = [
  { id: 'cat-1', name: 'Nước hoa ô tô', slug: 'nuoc-hoa-o-to' },
  { id: 'cat-2', name: 'Xịt thơm phòng', slug: 'xit-thom-phong' },
  { id: 'cat-3', name: 'Sáp thơm khử mùi', slug: 'sap-thom-khu-mui' },
];

function renderCategoryNav(initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <CategoryNav />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CategoryNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton loading state when isLoading is true', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    const { container } = renderCategoryNav();

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(5);
    expect(screen.queryByText('Tất cả sản phẩm')).not.toBeInTheDocument();
    expect(screen.queryByText('Nước hoa ô tô')).not.toBeInTheDocument();
  });

  it('renders "Tất cả sản phẩm" and category links when categories are loaded', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as any);

    renderCategoryNav('/');

    const allLink = screen.getByRole('link', { name: 'Tất cả sản phẩm' });
    expect(allLink).toBeInTheDocument();
    expect(allLink).toHaveAttribute('href', '/catalog');
    expect(allLink).toHaveClass('text-muted-foreground');
    expect(allLink).not.toHaveClass('bg-primary');

    mockCategories.forEach((cat) => {
      const catLink = screen.getByRole('link', { name: cat.name });
      expect(catLink).toBeInTheDocument();
      expect(catLink).toHaveAttribute('href', `/c/${cat.slug}`);
      expect(catLink).toHaveClass('text-muted-foreground');
      expect(catLink).not.toHaveClass('bg-primary');
    });
  });

  it('marks "Tất cả sản phẩm" as active when route is exactly "/catalog"', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as any);

    renderCategoryNav('/catalog');

    const allLink = screen.getByRole('link', { name: 'Tất cả sản phẩm' });
    expect(allLink).toHaveClass(
      'bg-primary',
      'text-primary-foreground',
      'shadow-md',
    );
    expect(allLink).not.toHaveClass('text-muted-foreground');

    const catLink = screen.getByRole('link', { name: 'Nước hoa ô tô' });
    expect(catLink).toHaveClass('text-muted-foreground');
    expect(catLink).not.toHaveClass('bg-primary');
  });

  it('does NOT mark "Tất cả sản phẩm" as active when route is a subpath such as "/catalog/search"', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as any);

    renderCategoryNav('/catalog/search');

    const allLink = screen.getByRole('link', { name: 'Tất cả sản phẩm' });
    expect(allLink).not.toHaveClass('bg-primary');
    expect(allLink).toHaveClass('text-muted-foreground');
  });

  it('marks category as active when route matches "/c/:slug"', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as any);

    renderCategoryNav('/c/xit-thom-phong');

    const activeCatLink = screen.getByRole('link', { name: 'Xịt thơm phòng' });
    expect(activeCatLink).toHaveClass(
      'bg-primary',
      'text-primary-foreground',
      'shadow-md',
    );
    expect(activeCatLink).not.toHaveClass('text-muted-foreground');

    const otherCatLink = screen.getByRole('link', { name: 'Nước hoa ô tô' });
    expect(otherCatLink).toHaveClass('text-muted-foreground');
    expect(otherCatLink).not.toHaveClass('bg-primary');

    const allLink = screen.getByRole('link', { name: 'Tất cả sản phẩm' });
    expect(allLink).toHaveClass('text-muted-foreground');
  });

  it('marks category as active when route is a subpath of "/c/:slug"', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as any);

    renderCategoryNav('/c/nuoc-hoa-o-to/page/2');

    const activeCatLink = screen.getByRole('link', { name: 'Nước hoa ô tô' });
    expect(activeCatLink).toHaveClass(
      'bg-primary',
      'text-primary-foreground',
      'shadow-md',
    );

    const otherCatLink = screen.getByRole('link', { name: 'Xịt thơm phòng' });
    expect(otherCatLink).toHaveClass('text-muted-foreground');
  });

  it('handles empty categories array gracefully', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderCategoryNav('/');

    const allLink = screen.getByRole('link', { name: 'Tất cả sản phẩm' });
    expect(allLink).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
  });

  it('handles undefined categories gracefully', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    renderCategoryNav('/');

    const allLink = screen.getByRole('link', { name: 'Tất cả sản phẩm' });
    expect(allLink).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
  });
});
