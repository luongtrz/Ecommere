import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryNav } from './CategoryNav';
import { useCategories } from '@/features/catalog/hooks/useCategories';

// Mock API client to prevent network or axios usage
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  authToken: { get: vi.fn(), set: vi.fn(), remove: vi.fn() },
}));

vi.mock('@/features/catalog/hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

const mockCategoriesData = [
  {
    id: 'cat-1',
    name: 'Xịt thơm phòng',
    slug: 'xit-thom-phong',
    parentId: null,
  },
  {
    id: 'cat-2',
    name: 'Đuổi chuột & Côn trùng',
    slug: 'duoi-chuot-con-trung',
    parentId: null,
  },
  {
    id: 'cat-3',
    name: 'Xịt phòng tự động',
    slug: 'xit-phong-tu-dong',
    parentId: 'cat-1',
  },
  {
    id: 'cat-4',
    name: 'Tinh dầu thơm',
    slug: 'tinh-dau-thom',
    parentId: 'cat-1',
  },
];

let mockScrollBy: ReturnType<typeof vi.fn>;

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
    cleanup();
    vi.clearAllMocks();
    mockScrollBy = vi.fn();
    HTMLUListElement.prototype.scrollBy = mockScrollBy;

    // Define configurable scroll getters on HTMLUListElement.prototype
    Object.defineProperty(HTMLUListElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return (this as any)._clientWidth ?? 500;
      },
      set(val) {
        (this as any)._clientWidth = val;
      },
    });

    Object.defineProperty(HTMLUListElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return (this as any)._scrollWidth ?? 1000;
      },
      set(val) {
        (this as any)._scrollWidth = val;
      },
    });

    Object.defineProperty(HTMLUListElement.prototype, 'scrollLeft', {
      configurable: true,
      get() {
        return (this as any)._scrollLeft ?? 0;
      },
      set(val) {
        (this as any)._scrollLeft = val;
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders skeleton loading state when isLoading is true', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    const { container } = renderCategoryNav();

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(6);
    expect(screen.queryByText('Tất cả')).not.toBeInTheDocument();
  });

  it('renders root categories and "Tất cả" link when loaded', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
    } as any);

    renderCategoryNav();

    // "Tất cả" link
    const allLink = screen.getByRole('link', { name: 'Tất cả' });
    expect(allLink).toHaveAttribute('href', '/catalog');

    // Root categories are rendered
    expect(
      screen.getByRole('link', { name: 'Xịt thơm phòng' }),
    ).toHaveAttribute('href', '/c/xit-thom-phong');
    expect(
      screen.getByRole('link', { name: 'Đuổi chuột & Côn trùng' }),
    ).toHaveAttribute('href', '/c/duoi-chuot-con-trung');

    // Subcategories should not be in the root navigation bar
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(3); // "Tất cả", cat-1, cat-2
  });

  it('handles empty or undefined categories gracefully', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    renderCategoryNav();

    expect(screen.getByRole('link', { name: 'Tất cả' })).toHaveAttribute(
      'href',
      '/catalog',
    );
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(1);
  });

  it('applies active styling to "/catalog" when on /catalog route', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
    } as any);

    renderCategoryNav('/catalog');

    const allLink = screen.getByRole('link', { name: 'Tất cả' });
    expect(allLink.className).toContain('text-teal-700 bg-teal-50 font-semibold');

    const cat1Link = screen.getByRole('link', { name: 'Xịt thơm phòng' });
    expect(cat1Link.className).toContain('text-slate-600 hover:text-teal-700');
  });

  it('applies active styling to category link when matching category route', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
    } as any);

    renderCategoryNav('/c/xit-thom-phong');

    const cat1Link = screen.getByRole('link', { name: 'Xịt thơm phòng' });
    expect(cat1Link.className).toContain('text-teal-700 bg-teal-50 font-semibold');

    const allLink = screen.getByRole('link', { name: 'Tất cả' });
    expect(allLink.className).toContain('text-slate-600 hover:text-teal-700');
  });

  it('applies active styling when location starts with category path', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
    } as any);

    renderCategoryNav('/c/xit-thom-phong/detail');

    const cat1Link = screen.getByRole('link', { name: 'Xịt thơm phòng' });
    expect(cat1Link.className).toContain('text-teal-700 bg-teal-50 font-semibold');
  });

  it('shows subcategories dropdown on mouse hover and allows viewing all', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
    } as any);

    renderCategoryNav();

    const cat1Link = screen.getByRole('link', { name: 'Xịt thơm phòng' });

    // Mock getBoundingClientRect for position calculation
    vi.spyOn(cat1Link, 'getBoundingClientRect').mockReturnValue({
      left: 120,
      top: 0,
      right: 200,
      bottom: 40,
      width: 80,
      height: 40,
      x: 120,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.mouseEnter(cat1Link);

    // Subcategories should now be rendered
    expect(
      screen.getByRole('link', { name: 'Xịt phòng tự động' }),
    ).toHaveAttribute('href', '/c/xit-phong-tu-dong');
    expect(screen.getByRole('link', { name: 'Tinh dầu thơm' })).toHaveAttribute(
      'href',
      '/c/tinh-dau-thom',
    );
    expect(screen.getByRole('link', { name: 'Xem tất cả' })).toHaveAttribute(
      'href',
      '/c/xit-thom-phong',
    );

    // Hovering "Tất cả" closes the active category
    const allLink = screen.getByRole('link', { name: 'Tất cả' });
    fireEvent.mouseEnter(allLink);
    expect(screen.queryByText('Xem tất cả')).not.toBeInTheDocument();
  });

  it('shows "Chưa có danh mục con" when active category has no subcategories', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
    } as any);

    renderCategoryNav();

    const cat2Link = screen.getByRole('link', {
      name: 'Đuổi chuột & Côn trùng',
    });
    fireEvent.mouseEnter(cat2Link);

    expect(screen.getByText('Chưa có danh mục con')).toBeInTheDocument();
    expect(screen.queryByText('Xem tất cả')).not.toBeInTheDocument();
  });

  it('clears active category when mouse leaves navigation bar', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
    } as any);

    const { container } = renderCategoryNav();

    const cat1Link = screen.getByRole('link', { name: 'Xịt thơm phòng' });
    fireEvent.mouseEnter(cat1Link);
    expect(
      screen.getByRole('link', { name: 'Xem tất cả' }),
    ).toBeInTheDocument();

    const navContainer = container.firstElementChild!;
    fireEvent.mouseLeave(navContainer);

    expect(
      screen.queryByRole('link', { name: 'Xem tất cả' }),
    ).not.toBeInTheDocument();
  });

  it('supports scroll interaction with left and right chevron buttons', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
    } as any);

    const { container } = renderCategoryNav();
    const scrollUl = container.querySelector('ul')!;

    // Initially scrollLeft is 0, so right arrow is shown, left is hidden
    const rightButton = container.querySelector(
      'button.absolute.right-0',
    ) as HTMLButtonElement;
    expect(rightButton).toBeInTheDocument();
    expect(container.querySelector('button.absolute.left-0')).toBeNull();

    fireEvent.click(rightButton);
    expect(mockScrollBy).toHaveBeenCalledWith({
      left: 300,
      behavior: 'smooth',
    });

    // Simulate scrolled in the middle: scrollLeft = 200 (both arrows visible)
    (scrollUl as any)._scrollLeft = 200;
    fireEvent.scroll(scrollUl);

    const leftButton = container.querySelector(
      'button.absolute.left-0',
    ) as HTMLButtonElement;
    expect(leftButton).toBeInTheDocument();
    expect(
      container.querySelector('button.absolute.right-0'),
    ).toBeInTheDocument();

    // Click left arrow
    fireEvent.click(leftButton);
    expect(mockScrollBy).toHaveBeenCalledWith({
      left: -300,
      behavior: 'smooth',
    });

    // Simulate scrolled to the end: scrollLeft = 500
    // Math.ceil(500 + 500) < 1000 is false -> right arrow hides
    (scrollUl as any)._scrollLeft = 500;
    fireEvent.scroll(scrollUl);

    expect(
      container.querySelector('button.absolute.left-0'),
    ).toBeInTheDocument();
    expect(container.querySelector('button.absolute.right-0')).toBeNull();
  });

  it('responds to window resize event to recalculate scroll arrows', () => {
    vi.mocked(useCategories).mockReturnValue({
      data: mockCategoriesData,
      isLoading: false,
    } as any);

    const { container } = renderCategoryNav();
    const scrollUl = container.querySelector('ul')!;

    // Initially: left arrow is not present, right arrow is present
    expect(container.querySelector('button.absolute.left-0')).toBeNull();
    expect(
      container.querySelector('button.absolute.right-0'),
    ).toBeInTheDocument();

    // Set scrollLeft > 0 and trigger window resize
    (scrollUl as any)._scrollLeft = 150;
    fireEvent(window, new Event('resize'));

    // Both arrows now visible
    expect(
      container.querySelector('button.absolute.left-0'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('button.absolute.right-0'),
    ).toBeInTheDocument();
  });
});
