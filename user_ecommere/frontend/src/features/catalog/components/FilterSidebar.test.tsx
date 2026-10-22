import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { FilterSidebar } from './FilterSidebar';
import { useCategoryTree } from '../hooks/useCategories';
import { useFilterOptions } from '../hooks/useFilterOptions';
import type { CategoryTreeNode } from '../api/categories.api';

// Mock API module to ensure no real network requests occur
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('../hooks/useCategories', () => ({
  useCategoryTree: vi.fn(),
  useCategories: vi.fn(),
  useCategoryBySlug: vi.fn(),
}));

vi.mock('../hooks/useFilterOptions', () => ({
  useFilterOptions: vi.fn(),
}));

const mockUseCategoryTree = vi.mocked(useCategoryTree);
const mockUseFilterOptions = vi.mocked(useFilterOptions);

const mockCategoryTree: CategoryTreeNode[] = [
  {
    id: 'cat-1',
    name: 'Nước hoa nam',
    slug: 'nuoc-hoa-nam',
    parentId: null,
    productCount: 15,
    isLeaf: false,
    children: [
      {
        id: 'cat-1-1',
        name: 'Hương gỗ',
        slug: 'huong-go',
        parentId: 'cat-1',
        productCount: 5,
        isLeaf: true,
        children: [],
      },
      {
        id: 'cat-1-2',
        name: 'Hương biển',
        slug: 'huong-bien',
        parentId: 'cat-1',
        productCount: 0,
        isLeaf: true,
        children: [],
      },
      {
        id: 'cat-1-3',
        name: 'Hương thảo mộc',
        slug: 'huong-thao-moc',
        parentId: 'cat-1',
        productCount: 3,
        isLeaf: false,
        children: [
          {
            id: 'cat-1-3-1',
            name: 'Oải hương',
            slug: 'oai-huong',
            parentId: 'cat-1-3',
            productCount: 2,
            isLeaf: true,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'Nước hoa nữ',
    slug: 'nuoc-hoa-nu',
    parentId: null,
    productCount: 0,
    isLeaf: true,
    children: [],
  },
  {
    id: 'cat-3',
    name: 'Unisex',
    slug: 'unisex',
    parentId: null,
    productCount: 8,
    isLeaf: true,
    children: undefined as unknown as CategoryTreeNode[],
  },
];

const mockFilterOptions = {
  brands: ['Chanel', 'Dior', 'Gucci'],
  scents: ['Gỗ', 'Hoa hồng', 'Cam chanh'],
  volumes: [30, 50, 100],
  priceRange: {
    min: 10000,
    max: 1000000,
  },
};

function renderFilterSidebar(
  props: Partial<React.ComponentProps<typeof FilterSidebar>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const onFilterChange = props.onFilterChange || vi.fn();

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FilterSidebar
          currentFilters={{}}
          {...props}
          onFilterChange={onFilterChange}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return {
    ...utils,
    onFilterChange,
  };
}

function getFilterOptionSpan(text: string): HTMLElement {
  const elements = screen.getAllByText(text);
  const span = elements.find(
    (el) => el.tagName.toLowerCase() === 'span' && el.closest('label'),
  );
  if (!span) throw new Error(`Option span not found for ${text}`);
  return span as HTMLElement;
}

function getCheckboxByLabelText(labelText: string): HTMLButtonElement {
  const span = getFilterOptionSpan(labelText);
  const label = span.closest('label')!;
  const checkbox = label.querySelector('button[role="checkbox"]');
  if (!checkbox) {
    throw new Error(`Checkbox button not found inside label for ${labelText}`);
  }
  return checkbox as HTMLButtonElement;
}

function getActiveFilterBadge(badgePattern: string | RegExp) {
  const container = screen.getByText('Đang lọc').closest('div')!;
  const buttons = Array.from(container.querySelectorAll('button'));
  for (const button of buttons) {
    const badge = button.parentElement;
    if (badge) {
      const text = badge.textContent || '';
      const matches =
        typeof badgePattern === 'string'
          ? text.includes(badgePattern)
          : badgePattern.test(text);
      if (matches) {
        return { badgeDiv: badge as HTMLElement, removeButton: button };
      }
    }
  }
  throw new Error(`Active filter badge matching ${badgePattern} not found`);
}

describe('FilterSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCategoryTree.mockReturnValue({
      data: mockCategoryTree,
      isLoading: false,
      isError: false,
    } as any);
    mockUseFilterOptions.mockReturnValue({
      data: mockFilterOptions,
      isLoading: false,
      isError: false,
    } as any);
  });

  describe('Initial rendering & structure', () => {
    it('renders the header title and accordion sections by default', () => {
      renderFilterSidebar();

      expect(screen.getByText('Bộ lọc')).toBeInTheDocument();
      expect(screen.getByText('Danh mục')).toBeInTheDocument();
      expect(screen.getByText('Khoảng giá')).toBeInTheDocument();
      expect(screen.getByText('Hương')).toBeInTheDocument();
      expect(screen.getByText('Dung tích')).toBeInTheDocument();
      expect(screen.getByText('Thương hiệu')).toBeInTheDocument();
    });

    it('hides the category accordion when hideCategoryFilter is true', () => {
      renderFilterSidebar({ hideCategoryFilter: true });

      expect(screen.queryByText('Danh mục')).not.toBeInTheDocument();
      expect(screen.getByText('Khoảng giá')).toBeInTheDocument();
    });

    it('hides category section when categoryTree data is undefined or empty', () => {
      mockUseCategoryTree.mockReturnValue({ data: undefined } as any);
      const { rerender } = renderFilterSidebar();
      expect(screen.queryByText('Danh mục')).not.toBeInTheDocument();

      mockUseCategoryTree.mockReturnValue({ data: [] } as any);
      rerender(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <MemoryRouter>
            <FilterSidebar currentFilters={{}} onFilterChange={vi.fn()} />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.queryByText('Danh mục')).not.toBeInTheDocument();
    });

    it('hides scent, volume, and brand sections when filterOptions is undefined or arrays are empty', () => {
      mockUseFilterOptions.mockReturnValue({ data: undefined } as any);
      const { rerender } = renderFilterSidebar();

      expect(screen.queryByText('Hương')).not.toBeInTheDocument();
      expect(screen.queryByText('Dung tích')).not.toBeInTheDocument();
      expect(screen.queryByText('Thương hiệu')).not.toBeInTheDocument();

      mockUseFilterOptions.mockReturnValue({
        data: {
          scents: [],
          volumes: [],
          brands: [],
          priceRange: { min: 0, max: 0 },
        },
      } as any);

      rerender(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <MemoryRouter>
            <FilterSidebar currentFilters={{}} onFilterChange={vi.fn()} />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(screen.queryByText('Hương')).not.toBeInTheDocument();
      expect(screen.queryByText('Dung tích')).not.toBeInTheDocument();
      expect(screen.queryByText('Thương hiệu')).not.toBeInTheDocument();
    });

    it('allows toggling an accordion trigger', () => {
      renderFilterSidebar();

      const priceTrigger = screen.getByRole('button', { name: /Khoảng giá/i });
      expect(priceTrigger).toBeInTheDocument();
      fireEvent.click(priceTrigger);
    });
  });

  describe('CategoryTreeItem and category selection', () => {
    it('renders top-level categories, child items, and product count badges', () => {
      renderFilterSidebar();

      expect(screen.getByText('Nước hoa nam')).toBeInTheDocument();
      expect(screen.getByText('(15)')).toBeInTheDocument();
      expect(screen.getByText('Hương gỗ')).toBeInTheDocument();
      expect(screen.getByText('(5)')).toBeInTheDocument();
      expect(screen.getByText('Hương biển')).toBeInTheDocument();
      expect(screen.queryByText('(0)')).not.toBeInTheDocument();
      expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      expect(screen.getByText('Unisex')).toBeInTheDocument();
      expect(screen.getByText('(8)')).toBeInTheDocument();
    });

    it('collapses and re-expands a depth 0 category with children on click', () => {
      const { onFilterChange } = renderFilterSidebar();

      const parentBtn = screen.getByRole('button', { name: /Nước hoa nam/i });
      expect(screen.getByText('Hương gỗ')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(parentBtn);
      expect(onFilterChange).toHaveBeenCalledWith({
        categorySlug: 'nuoc-hoa-nam',
      });
      expect(screen.queryByText('Hương gỗ')).not.toBeInTheDocument();

      // Click to re-expand
      fireEvent.click(parentBtn);
      expect(screen.getByText('Hương gỗ')).toBeInTheDocument();
    });

    it('depth 1 categories with children start collapsed and expand on click', () => {
      const { onFilterChange } = renderFilterSidebar();

      // Grandchild should not be in the document initially
      expect(screen.queryByText('Oải hương')).not.toBeInTheDocument();

      const subCatBtn = screen.getByRole('button', { name: /Hương thảo mộc/i });
      fireEvent.click(subCatBtn);

      expect(onFilterChange).toHaveBeenCalledWith({
        categorySlug: 'huong-thao-moc',
      });
      // Grandchild is now visible
      expect(screen.getByText('Oải hương')).toBeInTheDocument();
      expect(screen.getByText('(2)')).toBeInTheDocument();

      // Click again to collapse
      fireEvent.click(subCatBtn);
      expect(screen.queryByText('Oải hương')).not.toBeInTheDocument();
    });

    it('handles clicking categories without children', () => {
      const { onFilterChange } = renderFilterSidebar();

      const leafBtn = screen.getByRole('button', { name: /Hương gỗ/i });
      fireEvent.click(leafBtn);
      expect(onFilterChange).toHaveBeenCalledWith({ categorySlug: 'huong-go' });

      const cat2Btn = screen.getByRole('button', { name: /Nước hoa nữ/i });
      fireEvent.click(cat2Btn);
      expect(onFilterChange).toHaveBeenCalledWith({
        categorySlug: 'nuoc-hoa-nu',
      });

      const unisexBtn = screen.getByRole('button', { name: /Unisex/i });
      fireEvent.click(unisexBtn);
      expect(onFilterChange).toHaveBeenCalledWith({ categorySlug: 'unisex' });
    });

    it('highlights selected category and deselects it on second click', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { categorySlug: 'nuoc-hoa-nam' },
      });

      const selectedBtn = screen.getByRole('button', { name: /Nước hoa nam/i });
      expect(selectedBtn).toHaveClass(
        'bg-teal-50',
        'text-teal-700',
        'font-semibold',
      );

      const unselectedBtn = screen.getByRole('button', {
        name: /Nước hoa nữ/i,
      });
      expect(unselectedBtn).toHaveClass('text-slate-700');

      fireEvent.click(selectedBtn);
      expect(onFilterChange).toHaveBeenCalledWith({ categorySlug: undefined });
    });
  });

  describe('Price presets', () => {
    it('renders all 5 preset price buttons with correct text', () => {
      renderFilterSidebar();

      expect(
        screen.getByRole('button', { name: 'Dưới 50.000đ' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '50.000đ - 100.000đ' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '100.000đ - 200.000đ' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '200.000đ - 500.000đ' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Trên 500.000đ' }),
      ).toBeInTheDocument();
    });

    it('handles clicking each price preset and updates inputs', () => {
      const { onFilterChange } = renderFilterSidebar();

      const minInput = screen.getByPlaceholderText('Từ');
      const maxInput = screen.getByPlaceholderText('Đến');

      fireEvent.click(screen.getByRole('button', { name: 'Dưới 50.000đ' }));
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '0',
        maxPrice: '50000',
      });
      expect(minInput).toHaveValue(0);
      expect(maxInput).toHaveValue(50000);

      fireEvent.click(
        screen.getByRole('button', { name: '50.000đ - 100.000đ' }),
      );
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '50000',
        maxPrice: '100000',
      });
      expect(minInput).toHaveValue(50000);
      expect(maxInput).toHaveValue(100000);

      fireEvent.click(
        screen.getByRole('button', { name: '100.000đ - 200.000đ' }),
      );
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '100000',
        maxPrice: '200000',
      });

      fireEvent.click(
        screen.getByRole('button', { name: '200.000đ - 500.000đ' }),
      );
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '200000',
        maxPrice: '500000',
      });

      fireEvent.click(screen.getByRole('button', { name: 'Trên 500.000đ' }));
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '500000',
        maxPrice: undefined,
      });
      expect(minInput).toHaveValue(500000);
      expect(maxInput).toHaveValue(null);
    });

    it('highlights active preset according to currentFilters', () => {
      const { rerender } = renderFilterSidebar({
        currentFilters: { minPrice: 0, maxPrice: 50000 },
      });

      expect(screen.getByRole('button', { name: 'Dưới 50.000đ' })).toHaveClass(
        'bg-teal-50',
        'text-teal-700',
        'font-semibold',
      );
      expect(
        screen.getByRole('button', { name: '50.000đ - 100.000đ' }),
      ).not.toHaveClass('bg-teal-50');

      // Preset 5 (min 500000, no max)
      rerender(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <MemoryRouter>
            <FilterSidebar
              currentFilters={{ minPrice: 500000 }}
              onFilterChange={vi.fn()}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.getByRole('button', { name: 'Trên 500.000đ' })).toHaveClass(
        'bg-teal-50',
      );

      // Preset 5 with maxPrice should not be active
      rerender(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <MemoryRouter>
            <FilterSidebar
              currentFilters={{ minPrice: 500000, maxPrice: 800000 }}
              onFilterChange={vi.fn()}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(
        screen.getByRole('button', { name: 'Trên 500.000đ' }),
      ).not.toHaveClass('bg-teal-50');

      // Arbitrary prices do not highlight presets
      rerender(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <MemoryRouter>
            <FilterSidebar
              currentFilters={{ minPrice: 12345, maxPrice: 67890 }}
              onFilterChange={vi.fn()}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(
        screen.getByRole('button', { name: 'Dưới 50.000đ' }),
      ).not.toHaveClass('bg-teal-50');
    });
  });

  describe('Custom price inputs and validation', () => {
    it('initializes input values from currentFilters', () => {
      renderFilterSidebar({
        currentFilters: { minPrice: 15000, maxPrice: 45000 },
      });

      expect(screen.getByPlaceholderText('Từ')).toHaveValue(15000);
      expect(screen.getByPlaceholderText('Đến')).toHaveValue(45000);
    });

    it('initializes inputs as empty when currentFilters has no price', () => {
      renderFilterSidebar();

      expect(screen.getByPlaceholderText('Từ')).toHaveValue(null);
      expect(screen.getByPlaceholderText('Đến')).toHaveValue(null);
    });

    it('applies custom price on button click and trims values', () => {
      const { onFilterChange } = renderFilterSidebar();

      const minInput = screen.getByPlaceholderText('Từ');
      const maxInput = screen.getByPlaceholderText('Đến');
      const applyBtn = screen.getByRole('button', { name: 'Áp dụng' });

      fireEvent.change(minInput, { target: { value: '25000' } });
      fireEvent.change(maxInput, { target: { value: '75000' } });
      fireEvent.click(applyBtn);

      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '25000',
        maxPrice: '75000',
      });
    });

    it('converts empty price input values to undefined on apply', () => {
      const { onFilterChange } = renderFilterSidebar();

      const minInput = screen.getByPlaceholderText('Từ');
      const maxInput = screen.getByPlaceholderText('Đến');
      const applyBtn = screen.getByRole('button', { name: 'Áp dụng' });

      // Only min entered
      fireEvent.change(minInput, { target: { value: '30000' } });
      fireEvent.change(maxInput, { target: { value: '' } });
      fireEvent.click(applyBtn);
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '30000',
        maxPrice: undefined,
      });

      // Only max entered
      fireEvent.change(minInput, { target: { value: '' } });
      fireEvent.change(maxInput, { target: { value: '90000' } });
      fireEvent.click(applyBtn);
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: undefined,
        maxPrice: '90000',
      });

      // Both empty
      fireEvent.change(minInput, { target: { value: '' } });
      fireEvent.change(maxInput, { target: { value: '' } });
      fireEvent.click(applyBtn);
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: undefined,
        maxPrice: undefined,
      });
    });

    it('applies custom price on Enter key press in min or max input', () => {
      const { onFilterChange } = renderFilterSidebar();

      const minInput = screen.getByPlaceholderText('Từ');
      const maxInput = screen.getByPlaceholderText('Đến');

      fireEvent.change(minInput, { target: { value: '40000' } });
      fireEvent.change(maxInput, { target: { value: '80000' } });

      fireEvent.keyDown(minInput, { key: 'Enter' });
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '40000',
        maxPrice: '80000',
      });

      vi.clearAllMocks();
      fireEvent.keyDown(maxInput, { key: 'Enter' });
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '40000',
        maxPrice: '80000',
      });
    });

    it('does not trigger apply on other key presses', () => {
      const { onFilterChange } = renderFilterSidebar();

      const minInput = screen.getByPlaceholderText('Từ');
      const maxInput = screen.getByPlaceholderText('Đến');

      fireEvent.change(minInput, { target: { value: '40000' } });
      fireEvent.change(maxInput, { target: { value: '80000' } });

      fireEvent.keyDown(minInput, { key: 'a' });
      fireEvent.keyDown(maxInput, { key: 'Escape' });

      expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('shows error and blocks applying when minPrice > maxPrice', () => {
      const { onFilterChange } = renderFilterSidebar();

      const minInput = screen.getByPlaceholderText('Từ');
      const maxInput = screen.getByPlaceholderText('Đến');
      const applyBtn = screen.getByRole('button', { name: 'Áp dụng' });

      fireEvent.change(minInput, { target: { value: '100000' } });
      fireEvent.change(maxInput, { target: { value: '50000' } });

      expect(
        screen.getByText('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa'),
      ).toBeInTheDocument();

      // Click apply should not trigger onFilterChange
      fireEvent.click(applyBtn);
      expect(onFilterChange).not.toHaveBeenCalled();

      // Enter key should not trigger onFilterChange
      fireEvent.keyDown(minInput, { key: 'Enter' });
      expect(onFilterChange).not.toHaveBeenCalled();

      // Fix max price
      fireEvent.change(maxInput, { target: { value: '200000' } });
      expect(
        screen.queryByText('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa'),
      ).not.toBeInTheDocument();

      fireEvent.click(applyBtn);
      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: '100000',
        maxPrice: '200000',
      });
    });

    it('treats non-numeric inputs gracefully (isPriceRangeInvalid returns false)', () => {
      renderFilterSidebar();

      const minInput = screen.getByPlaceholderText('Từ');
      const maxInput = screen.getByPlaceholderText('Đến');

      fireEvent.change(minInput, { target: { value: 'abc' } });
      fireEvent.change(maxInput, { target: { value: 'xyz' } });

      expect(
        screen.queryByText('Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Scent filter', () => {
    it('renders scent options with checked states reflecting currentFilters', () => {
      renderFilterSidebar({
        currentFilters: { scent: 'Gỗ,Hoa hồng' },
      });

      const woodCheckbox = getCheckboxByLabelText('Gỗ');
      const roseCheckbox = getCheckboxByLabelText('Hoa hồng');
      const citrusCheckbox = getCheckboxByLabelText('Cam chanh');

      expect(woodCheckbox).toHaveAttribute('data-state', 'checked');
      expect(roseCheckbox).toHaveAttribute('data-state', 'checked');
      expect(citrusCheckbox).toHaveAttribute('data-state', 'unchecked');

      expect(getFilterOptionSpan('Gỗ')).toHaveClass('font-semibold');
      expect(getFilterOptionSpan('Cam chanh')).toHaveClass('text-slate-600');
    });

    it('toggles scent selection on and off', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { scent: 'Gỗ' },
      });

      // Add 'Hoa hồng'
      const roseCheckbox = getCheckboxByLabelText('Hoa hồng');
      fireEvent.click(roseCheckbox);
      expect(onFilterChange).toHaveBeenCalledWith({ scent: 'Gỗ,Hoa hồng' });

      // Remove 'Gỗ' when it is the only scent selected -> returns undefined
      const woodCheckbox = getCheckboxByLabelText('Gỗ');
      fireEvent.click(woodCheckbox);
      expect(onFilterChange).toHaveBeenCalledWith({ scent: undefined });
    });

    it('removes scent from a multi-item list', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { scent: 'Gỗ,Hoa hồng' },
      });

      const woodCheckbox = getCheckboxByLabelText('Gỗ');
      fireEvent.click(woodCheckbox);
      expect(onFilterChange).toHaveBeenCalledWith({ scent: 'Hoa hồng' });
    });

    it('handles scent filter string with extra spaces and empty tokens', () => {
      renderFilterSidebar({
        currentFilters: { scent: '  Gỗ , , Hoa hồng  ' },
      });

      expect(getCheckboxByLabelText('Gỗ')).toHaveAttribute(
        'data-state',
        'checked',
      );
      expect(getCheckboxByLabelText('Hoa hồng')).toHaveAttribute(
        'data-state',
        'checked',
      );
    });
  });

  describe('Volume filter', () => {
    it('renders volume options and marks selected volume', () => {
      renderFilterSidebar({
        currentFilters: { volumeMl: '50' },
      });

      const vol30 = screen.getByRole('button', { name: '30ml' });
      const vol50 = screen.getByRole('button', { name: '50ml' });
      const vol100 = screen.getByRole('button', { name: '100ml' });

      expect(vol50).toHaveClass('bg-teal-600');
      expect(vol30).toHaveClass('bg-white');
      expect(vol100).toHaveClass('bg-white');
    });

    it('toggles volume selection on and off', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { volumeMl: '50' },
      });

      // Add '100'
      const vol100 = screen.getByRole('button', { name: '100ml' });
      fireEvent.click(vol100);
      expect(onFilterChange).toHaveBeenCalledWith({ volumeMl: '50,100' });

      // Deselect '50' when it is the only volume -> undefined
      const vol50 = screen.getByRole('button', { name: '50ml' });
      fireEvent.click(vol50);
      expect(onFilterChange).toHaveBeenCalledWith({ volumeMl: undefined });
    });

    it('removes volume from a multi-item list', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { volumeMl: '50,100' },
      });

      const vol50 = screen.getByRole('button', { name: '50ml' });
      fireEvent.click(vol50);
      expect(onFilterChange).toHaveBeenCalledWith({ volumeMl: '100' });
    });

    it('filters out invalid non-numeric tokens from volumeMl string', () => {
      renderFilterSidebar({
        currentFilters: { volumeMl: ' 30 , not-a-number , 50 ' },
      });

      expect(screen.getByRole('button', { name: '30ml' })).toHaveClass(
        'bg-teal-600',
      );
      expect(screen.getByRole('button', { name: '50ml' })).toHaveClass(
        'bg-teal-600',
      );
      expect(screen.getByRole('button', { name: '100ml' })).not.toHaveClass(
        'bg-teal-600',
      );
    });
  });

  describe('Brand filter', () => {
    it('renders brand options and marks selected brand', () => {
      renderFilterSidebar({
        currentFilters: { brand: 'Chanel' },
      });

      const chanelCb = getCheckboxByLabelText('Chanel');
      const diorCb = getCheckboxByLabelText('Dior');

      expect(chanelCb).toHaveAttribute('data-state', 'checked');
      expect(diorCb).toHaveAttribute('data-state', 'unchecked');
      expect(getFilterOptionSpan('Chanel')).toHaveClass('font-semibold');
      expect(getFilterOptionSpan('Dior')).toHaveClass('text-slate-600');
    });

    it('toggles brand selection on and off', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { brand: 'Chanel' },
      });

      // Add Dior
      const diorCb = getCheckboxByLabelText('Dior');
      fireEvent.click(diorCb);
      expect(onFilterChange).toHaveBeenCalledWith({ brand: 'Chanel,Dior' });

      // Remove Chanel when it is the only brand
      const chanelCb = getCheckboxByLabelText('Chanel');
      fireEvent.click(chanelCb);
      expect(onFilterChange).toHaveBeenCalledWith({ brand: undefined });
    });

    it('removes brand from a multi-item list', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { brand: 'Chanel,Dior' },
      });

      const chanelCb = getCheckboxByLabelText('Chanel');
      fireEvent.click(chanelCb);
      expect(onFilterChange).toHaveBeenCalledWith({ brand: 'Dior' });
    });

    it('handles brand string with extra spaces and empty tokens', () => {
      renderFilterSidebar({
        currentFilters: { brand: '  Chanel , , Dior  ' },
      });

      expect(getCheckboxByLabelText('Chanel')).toHaveAttribute(
        'data-state',
        'checked',
      );
      expect(getCheckboxByLabelText('Dior')).toHaveAttribute(
        'data-state',
        'checked',
      );
    });
  });

  describe('Active filter count, header clear button, and tags section', () => {
    it('does not render active badge, clear button, or "Đang lọc" section when no filters are active', () => {
      renderFilterSidebar({ currentFilters: {} });

      expect(screen.queryByText('Xóa')).not.toBeInTheDocument();
      expect(screen.queryByText('Đang lọc')).not.toBeInTheDocument();
    });

    it('calculates activeFilterCount correctly across all filter types', () => {
      const { rerender } = renderFilterSidebar({
        currentFilters: { categorySlug: 'nuoc-hoa-nam' },
      });
      expect(screen.getByText('1')).toBeInTheDocument();

      rerender(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <MemoryRouter>
            <FilterSidebar
              currentFilters={{
                categorySlug: 'nuoc-hoa-nam',
                minPrice: 50000,
              }}
              onFilterChange={vi.fn()}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.getByText('2')).toBeInTheDocument();

      rerender(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <MemoryRouter>
            <FilterSidebar
              currentFilters={{
                categorySlug: 'nuoc-hoa-nam',
                minPrice: 50000,
                scent: 'Gỗ',
              }}
              onFilterChange={vi.fn()}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.getByText('3')).toBeInTheDocument();

      rerender(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <MemoryRouter>
            <FilterSidebar
              currentFilters={{
                categorySlug: 'nuoc-hoa-nam',
                minPrice: 50000,
                scent: 'Gỗ',
                volumeMl: '50',
              }}
              onFilterChange={vi.fn()}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.getByText('4')).toBeInTheDocument();

      rerender(
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <MemoryRouter>
            <FilterSidebar
              currentFilters={{
                categorySlug: 'nuoc-hoa-nam',
                minPrice: 50000,
                scent: 'Gỗ',
                volumeMl: '50',
                brand: 'Chanel',
              }}
              onFilterChange={vi.fn()}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('clears all active filters when header "Xóa" button is clicked', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: {
          categorySlug: 'nuoc-hoa-nam',
          minPrice: 50000,
          maxPrice: 100000,
          scent: 'Gỗ',
          volumeMl: '50',
          brand: 'Chanel',
        },
      });

      const clearAllBtn = screen.getByRole('button', { name: 'Xóa' });
      fireEvent.click(clearAllBtn);

      expect(onFilterChange).toHaveBeenCalledWith({
        categorySlug: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        scent: undefined,
        volumeMl: undefined,
        brand: undefined,
      });

      expect(screen.getByPlaceholderText('Từ')).toHaveValue(null);
      expect(screen.getByPlaceholderText('Đến')).toHaveValue(null);
    });

    it('renders and removes active filter badge for category', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { categorySlug: 'nuoc-hoa-nam' },
      });

      const { removeButton } = getActiveFilterBadge(/Danh mục:\s*nuoc-hoa-nam/);
      fireEvent.click(removeButton);

      expect(onFilterChange).toHaveBeenCalledWith({ categorySlug: undefined });
    });

    it('renders and removes active filter badge for price with both min and max', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { minPrice: 50000, maxPrice: 100000 },
      });

      const { badgeDiv, removeButton } = getActiveFilterBadge('Giá:');
      expect(badgeDiv).toHaveTextContent(
        /Giá:\s*50\.000\s*₫\s*-\s*100\.000\s*₫/,
      );

      fireEvent.click(removeButton);

      expect(onFilterChange).toHaveBeenCalledWith({
        minPrice: undefined,
        maxPrice: undefined,
      });
      expect(screen.getByPlaceholderText('Từ')).toHaveValue(null);
      expect(screen.getByPlaceholderText('Đến')).toHaveValue(null);
    });

    it('renders price badge with only minPrice', () => {
      renderFilterSidebar({
        currentFilters: { minPrice: 50000 },
      });

      const { badgeDiv } = getActiveFilterBadge('Giá:');
      expect(badgeDiv).toHaveTextContent(/Giá:\s*50\.000\s*₫\s*-\s*\.\.\./);
    });

    it('renders price badge with only maxPrice', () => {
      renderFilterSidebar({
        currentFilters: { maxPrice: 100000 },
      });

      const { badgeDiv } = getActiveFilterBadge('Giá:');
      expect(badgeDiv).toHaveTextContent(/Giá:\s*0\s*-\s*100\.000\s*₫/);
    });

    it('renders and removes active filter badges for scents', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { scent: 'Gỗ,Hoa hồng' },
      });

      const { removeButton } = getActiveFilterBadge('Gỗ');
      fireEvent.click(removeButton);

      expect(onFilterChange).toHaveBeenCalledWith({ scent: 'Hoa hồng' });
    });

    it('removes the single remaining scent badge', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { scent: 'Gỗ' },
      });

      const { removeButton } = getActiveFilterBadge('Gỗ');
      fireEvent.click(removeButton);

      expect(onFilterChange).toHaveBeenCalledWith({ scent: undefined });
    });

    it('renders and removes active filter badges for volumes', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { volumeMl: '50,100' },
      });

      const { removeButton } = getActiveFilterBadge('50ml');
      fireEvent.click(removeButton);

      expect(onFilterChange).toHaveBeenCalledWith({ volumeMl: '100' });
    });

    it('removes the single remaining volume badge', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { volumeMl: '50' },
      });

      const { removeButton } = getActiveFilterBadge('50ml');
      fireEvent.click(removeButton);

      expect(onFilterChange).toHaveBeenCalledWith({ volumeMl: undefined });
    });

    it('renders and removes active filter badges for brands', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { brand: 'Chanel,Dior' },
      });

      const { removeButton } = getActiveFilterBadge('Chanel');
      fireEvent.click(removeButton);

      expect(onFilterChange).toHaveBeenCalledWith({ brand: 'Dior' });
    });

    it('removes the single remaining brand badge', () => {
      const { onFilterChange } = renderFilterSidebar({
        currentFilters: { brand: 'Chanel' },
      });

      const { removeButton } = getActiveFilterBadge('Chanel');
      fireEvent.click(removeButton);

      expect(onFilterChange).toHaveBeenCalledWith({ brand: undefined });
    });
  });
});
