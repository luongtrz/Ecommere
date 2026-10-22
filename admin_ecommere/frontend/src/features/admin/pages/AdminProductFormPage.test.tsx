import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminProductFormPage } from './AdminProductFormPage';

// Polyfill ResizeObserver for Radix UI useSize hook in jsdom
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

globalThis.ResizeObserver = MockResizeObserver as any;
if (typeof window !== 'undefined') {
  window.ResizeObserver = MockResizeObserver as any;
}

// Mocks
const mockNavigate = vi.fn();
let mockParams: { id?: string } = {};

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

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

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title">{title}</div>
  ),
}));

vi.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Đang tải...</div>,
}));

const mockUseAdminProduct = vi.fn();
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();

vi.mock('../hooks/useAdminProducts', () => ({
  useAdminProduct: (id: string | null) => mockUseAdminProduct(id),
  useCreateProduct: () => ({
    mutateAsync: mockCreateMutateAsync,
  }),
  useUpdateProduct: () => ({
    mutateAsync: mockUpdateMutateAsync,
  }),
  useDeleteProduct: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/features/admin/hooks/useAdminProducts', () => ({
  useAdminProduct: (id: string | null) => mockUseAdminProduct(id),
  useCreateProduct: () => ({
    mutateAsync: mockCreateMutateAsync,
  }),
  useUpdateProduct: () => ({
    mutateAsync: mockUpdateMutateAsync,
  }),
  useDeleteProduct: () => ({
    mutateAsync: vi.fn(),
  }),
}));

const mockGetTree = vi.fn();

vi.mock('../api/categories.api', () => ({
  categoriesApi: {
    getTree: () => mockGetTree(),
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/features/admin/api/categories.api', () => ({
  categoriesApi: {
    getTree: () => mockGetTree(),
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    create: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/components/common/ImageUpload', () => ({
  ImageUpload: ({
    images,
    onChange,
    maxImages,
  }: {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
  }) => (
    <div data-testid="image-upload" data-max={maxImages}>
      <span data-testid="image-count">{images.length}</span>
      <button
        type="button"
        data-testid="add-image-btn"
        onClick={() =>
          onChange([...images, 'https://example.com/test-image.jpg'])
        }
      >
        Thêm ảnh mock
      </button>
      <button
        type="button"
        data-testid="clear-images-btn"
        onClick={() => onChange([])}
      >
        Xóa hết ảnh mock
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children, className }: any) => (
    <div data-testid="dropdown-menu-content" className={className}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className }: any) => (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  ),
  DropdownMenuSub: ({ children }: any) => (
    <div data-testid="dropdown-menu-sub">{children}</div>
  ),
  DropdownMenuSubTrigger: ({ children, className }: any) => (
    <div data-testid="dropdown-menu-subtrigger" className={className}>
      {children}
    </div>
  ),
  DropdownMenuSubContent: ({ children, className }: any) => (
    <div data-testid="dropdown-menu-subcontent" className={className}>
      {children}
    </div>
  ),
}));

const mockCategoriesTree = [
  {
    id: 'cat-parent-1',
    name: 'Nước hoa',
    children: [
      {
        id: 'cat-leaf-1',
        name: 'Nước hoa Nam',
        children: [],
      },
      {
        id: 'cat-leaf-2',
        name: 'Nước hoa Nữ',
      },
    ],
  },
  {
    id: 'cat-leaf-3',
    name: 'Xịt khử mùi',
    children: [],
  },
];

const sampleProduct = {
  id: 'prod-100',
  name: 'Nước hoa hồng Rosa',
  description: 'Nước hoa hồng chiết xuất từ hoa hồng Pháp thơm ngát quyến rũ',
  categoryId: 'cat-leaf-1',
  basePrice: 250000,
  active: true,
  images: ['https://example.com/rosa1.jpg', 'https://example.com/rosa2.jpg'],
  variants: [
    {
      id: 'var-1',
      scent: 'Hoa hồng Pháp',
      volumeMl: 50,
      price: 250000,
      salePrice: 200000,
      stock: 100,
      sku: 'SKU-ROSA-50',
      barcode: '8931234567890',
    },
    {
      id: 'var-2',
      scent: 'Hoa hồng Bulgaria',
      volumeMl: 100,
      price: 450000,
      salePrice: null,
      stock: 50,
      sku: 'SKU-ROSA-100',
      barcode: null,
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  rating: 4.8,
};

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
        <AdminProductFormPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  globalThis.ResizeObserver = MockResizeObserver as any;
  if (typeof window !== 'undefined') {
    window.ResizeObserver = MockResizeObserver as any;
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

beforeEach(() => {
  vi.clearAllMocks();
  document.body.style.pointerEvents = 'auto';
  mockParams = {};
  mockUseAdminProduct.mockReturnValue({
    data: undefined,
    isLoading: false,
  });
  mockCreateMutateAsync.mockResolvedValue({});
  mockUpdateMutateAsync.mockResolvedValue({});
  mockGetTree.mockResolvedValue(mockCategoriesTree);
});

describe('AdminProductFormPage', () => {
  describe('Loading and Not Found States in Edit Mode', () => {
    it('renders loading spinner and SEO title in edit mode while loading product', () => {
      mockParams = { id: 'prod-100' };
      mockUseAdminProduct.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      renderPage();

      expect(mockUseAdminProduct).toHaveBeenCalledWith('prod-100');
      expect(screen.getByTestId('seo-title')).toHaveTextContent('Đang tải...');
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Thông tin chung')).not.toBeInTheDocument();
    });

    it('renders not found state and link to product list when product is null in edit mode', () => {
      mockParams = { id: 'prod-not-found' };
      mockUseAdminProduct.mockReturnValue({
        data: null,
        isLoading: false,
      });

      renderPage();

      expect(mockUseAdminProduct).toHaveBeenCalledWith('prod-not-found');
      expect(screen.getByTestId('seo-title')).toHaveTextContent(
        'Không tìm thấy sản phẩm',
      );
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Không tìm thấy sản phẩm',
        }),
      ).toBeInTheDocument();

      const backLink = screen.getByRole('link', {
        name: 'Quay lại danh sách',
      });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/admin/products');
      expect(screen.queryByText('Thông tin chung')).not.toBeInTheDocument();
    });
  });

  describe('Create Mode - Rendering and User Interactions', () => {
    it('renders create mode with initial form state, SEO title, and default single variant', async () => {
      mockParams = {};

      renderPage();

      expect(mockUseAdminProduct).toHaveBeenCalledWith(null);
      expect(screen.getByTestId('seo-title')).toHaveTextContent(
        'Thêm sản phẩm mới',
      );
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Thêm sản phẩm mới',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Thêm ít nhất một mùi hương và dung tích trước khi lưu sản phẩm.',
        ),
      ).toBeInTheDocument();

      // Check header back link
      const backLink = screen.getByRole('link');
      expect(backLink).toHaveAttribute('href', '/admin/products');

      // Check initial inputs
      expect(screen.getByPlaceholderText('Nhập tên sản phẩm')).toHaveValue('');
      expect(screen.getByPlaceholderText('Nhập mô tả sản phẩm')).toHaveValue(
        '',
      );
      expect(screen.getByLabelText(/giá cơ bản/i)).toHaveValue(0);

      // Check active switch
      const activeSwitch = screen.getByLabelText('Hiển thị sản phẩm');
      expect(activeSwitch).toHaveAttribute('data-state', 'checked');

      // Check single default variant
      expect(screen.getByText('Biến thể 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Mùi hương')).toHaveValue('');
      expect(screen.getByLabelText('Dung tích (ml)')).toHaveValue(50);
      expect(screen.getByLabelText('Tồn kho')).toHaveValue(0);
      expect(screen.getByLabelText('Giá niêm yết')).toHaveValue(0);
      expect(screen.getByLabelText('Giá sale')).toHaveValue(null);
      expect(screen.getByLabelText('Barcode')).toHaveValue('');

      // In create mode with 1 variant, delete button should not be displayed
      expect(
        screen.queryByRole('button', { name: /xóa biến thể/i }),
      ).not.toBeInTheDocument();

      // "Thêm biến thể" button should be visible in create mode
      expect(
        screen.getByRole('button', { name: /thêm biến thể/i }),
      ).toBeInTheDocument();

      // Wait for categories to finish loading
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Chọn danh mục');
      });
    });

    it('handles category loading failure gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetTree.mockRejectedValueOnce(new Error('Lỗi tải danh mục'));

      renderPage();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load categories tree',
          expect.any(Error),
        );
      });

      expect(screen.getByRole('combobox')).toHaveTextContent(
        'Đang tải danh mục...',
      );

      consoleErrorSpy.mockRestore();
    });

    it('renders category tree and allows selecting a leaf category', async () => {
      renderPage();

      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Chọn danh mục');
      });
      const comboboxButton = screen.getByRole('combobox');
      expect(comboboxButton).toHaveClass('text-muted-foreground');

      // Dropdown contains rendered tree items
      expect(screen.getByText('Nước hoa')).toBeInTheDocument();
      expect(screen.getByText('Nước hoa Nam')).toBeInTheDocument();
      expect(screen.getByText('Nước hoa Nữ')).toBeInTheDocument();
      expect(screen.getByText('Xịt khử mùi')).toBeInTheDocument();

      // Leaf items are rendered as buttons with role="menuitem"
      const leafNam = screen.getByRole('menuitem', { name: 'Nước hoa Nam' });
      fireEvent.click(leafNam);

      // Trigger button updates with hierarchical displayName
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent(
          'Nước hoa > Nước hoa Nam',
        );
      });
      expect(screen.getByRole('combobox')).not.toHaveClass(
        'text-muted-foreground',
      );

      // Selected item span gets font-bold text-primary class
      const spanNam = screen.getByText('Nước hoa Nam');
      expect(spanNam).toHaveClass('font-bold', 'text-primary');

      const spanNu = screen.getByText('Nước hoa Nữ');
      expect(spanNu).not.toHaveClass('font-bold');
    });

    it('allows adding and removing product variants in create mode', async () => {
      renderPage();

      expect(screen.getByText('Biến thể 1')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /xóa biến thể/i }),
      ).not.toBeInTheDocument();

      const addVariantBtn = screen.getByRole('button', {
        name: /thêm biến thể/i,
      });

      // Add second variant
      fireEvent.click(addVariantBtn);
      expect(screen.getByText('Biến thể 1')).toBeInTheDocument();
      expect(screen.getByText('Biến thể 2')).toBeInTheDocument();

      // Both delete buttons appear
      const deleteBtn1 = screen.getByRole('button', {
        name: 'Xóa biến thể 1',
      });
      const deleteBtn2 = screen.getByRole('button', {
        name: 'Xóa biến thể 2',
      });
      expect(deleteBtn1).toBeInTheDocument();
      expect(deleteBtn2).toBeInTheDocument();

      // Fill scent for variant 1 and 2 to distinguish
      const scentInputs = screen.getAllByLabelText('Mùi hương');
      fireEvent.change(scentInputs[0], { target: { value: 'Hương Gỗ' } });
      fireEvent.change(scentInputs[1], { target: { value: 'Hương Biển' } });

      // Remove variant 2
      fireEvent.click(deleteBtn2);
      expect(screen.queryByText('Biến thể 2')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Mùi hương')).toHaveValue('Hương Gỗ');

      // Now only 1 variant left, delete button disappears
      expect(
        screen.queryByRole('button', { name: /xóa biến thể/i }),
      ).not.toBeInTheDocument();
    });

    it('allows toggling the active switch', () => {
      renderPage();

      const activeSwitch = screen.getByLabelText('Hiển thị sản phẩm');
      expect(activeSwitch).toHaveAttribute('data-state', 'checked');

      // Toggle off
      fireEvent.click(activeSwitch);
      expect(activeSwitch).toHaveAttribute('data-state', 'unchecked');

      // Toggle back on
      fireEvent.click(activeSwitch);
      expect(activeSwitch).toHaveAttribute('data-state', 'checked');
    });

    it('allows adding and removing images via ImageUpload', () => {
      renderPage();

      expect(screen.getByTestId('image-count')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('add-image-btn'));
      expect(screen.getByTestId('image-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByTestId('clear-images-btn'));
      expect(screen.getByTestId('image-count')).toHaveTextContent('0');
    });

    it('navigates back when clicking Cancel button', () => {
      renderPage();

      const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
      fireEvent.click(cancelBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
    });
  });

  describe('Form Validations', () => {
    it('displays validation errors when submitting an empty form in create mode', async () => {
      renderPage();

      // Click save with empty fields
      const saveBtn = screen.getByRole('button', { name: /lưu sản phẩm/i });
      fireEvent.click(saveBtn);

      expect(
        await screen.findByText('Tên sản phẩm là bắt buộc'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Mô tả phải có ít nhất 10 ký tự'),
      ).toBeInTheDocument();
      expect(screen.getByText('Vui lòng chọn danh mục')).toBeInTheDocument();
      expect(screen.getByText('Giá phải lớn hơn 0')).toBeInTheDocument();
      expect(screen.getByText('Mùi hương là bắt buộc')).toBeInTheDocument();
      expect(
        screen.getByText('Vui lòng thêm ít nhất 1 ảnh'),
      ).toBeInTheDocument();

      expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    });

    it('validates description min length and basePrice integer requirement', async () => {
      renderPage();

      fireEvent.change(screen.getByPlaceholderText('Nhập mô tả sản phẩm'), {
        target: { value: 'Quá ngắn' },
      });
      fireEvent.change(screen.getByLabelText(/giá cơ bản/i), {
        target: { value: '150.5' },
      });

      const saveBtn = screen.getByRole('button', { name: /lưu sản phẩm/i });
      fireEvent.click(saveBtn);

      expect(
        await screen.findByText('Mô tả phải có ít nhất 10 ký tự'),
      ).toBeInTheDocument();
      expect(screen.getByText('Giá phải là số nguyên')).toBeInTheDocument();
    });

    it('validates variant volumeMl, price, stock, and salePrice constraints', async () => {
      renderPage();

      // Set volumeMl to 0, price to -1, stock to -1
      fireEvent.change(screen.getByLabelText('Dung tích (ml)'), {
        target: { value: '0' },
      });
      fireEvent.change(screen.getByLabelText('Giá niêm yết'), {
        target: { value: '-10' },
      });
      fireEvent.change(screen.getByLabelText('Tồn kho'), {
        target: { value: '-5' },
      });

      const saveBtn = screen.getByRole('button', { name: /lưu sản phẩm/i });
      fireEvent.click(saveBtn);

      expect(
        await screen.findByText('Dung tích phải lớn hơn 0'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Giá phải lớn hơn hoặc bằng 0'),
      ).toBeInTheDocument();
      expect(screen.getByText('Tồn kho không được âm')).toBeInTheDocument();

      // Test negative salePrice
      fireEvent.change(screen.getByLabelText('Giá niêm yết'), {
        target: { value: '100000' },
      });
      fireEvent.change(screen.getByLabelText('Giá sale'), {
        target: { value: '-20' },
      });
      fireEvent.click(saveBtn);

      expect(
        await screen.findByText('Giá sale không được âm'),
      ).toBeInTheDocument();

      // Test salePrice greater than price
      fireEvent.change(screen.getByLabelText('Giá sale'), {
        target: { value: '120000' },
      });
      fireEvent.click(saveBtn);

      expect(
        await screen.findByText('Giá sale không được lớn hơn giá niêm yết'),
      ).toBeInTheDocument();
    });
  });

  describe('Create Mode - Successful Submission', () => {
    it('successfully creates a new product and navigates to admin products', async () => {
      renderPage();

      // Fill name and description
      fireEvent.change(screen.getByPlaceholderText('Nhập tên sản phẩm'), {
        target: { value: 'Chai xịt thơm phòng Thái Lan' },
      });
      fireEvent.change(screen.getByPlaceholderText('Nhập mô tả sản phẩm'), {
        target: {
          value: 'Chiết xuất từ hoa quả nhiệt đới mang lại cảm giác dễ chịu',
        },
      });

      // Select category
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Chọn danh mục');
      });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Nước hoa Nam' }));

      // Set base price
      fireEvent.change(screen.getByLabelText(/giá cơ bản/i), {
        target: { value: '150000' },
      });

      // Add image
      fireEvent.click(screen.getByTestId('add-image-btn'));

      // Fill variant
      fireEvent.change(screen.getByLabelText('Mùi hương'), {
        target: { value: 'Chanh Sả' },
      });
      fireEvent.change(screen.getByLabelText('Dung tích (ml)'), {
        target: { value: '100' },
      });
      fireEvent.change(screen.getByLabelText('Tồn kho'), {
        target: { value: '45' },
      });
      fireEvent.change(screen.getByLabelText('Giá niêm yết'), {
        target: { value: '150000' },
      });
      fireEvent.change(screen.getByLabelText('Giá sale'), {
        target: { value: '120000' },
      });
      fireEvent.change(screen.getByLabelText('Barcode'), {
        target: { value: '8930001234567' },
      });

      // Submit
      const saveBtn = screen.getByRole('button', { name: /lưu sản phẩm/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith({
          name: 'Chai xịt thơm phòng Thái Lan',
          description:
            'Chiết xuất từ hoa quả nhiệt đới mang lại cảm giác dễ chịu',
          categoryId: 'cat-leaf-1',
          basePrice: 150000,
          active: true,
          variants: [
            {
              scent: 'Chanh Sả',
              volumeMl: 100,
              stock: 45,
              price: 150000,
              salePrice: 120000,
              barcode: '8930001234567',
            },
          ],
          images: ['https://example.com/test-image.jpg'],
        });
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Sản phẩm "Chai xịt thơm phòng Thái Lan" đã được tạo thành công!',
      );
      expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
    });

    it('handles variant salePrice left blank (setValueAs converts empty string to undefined)', async () => {
      renderPage();

      fireEvent.change(screen.getByPlaceholderText('Nhập tên sản phẩm'), {
        target: { value: 'Chai xịt phòng không sale' },
      });
      fireEvent.change(screen.getByPlaceholderText('Nhập mô tả sản phẩm'), {
        target: {
          value: 'Mô tả hợp lệ cho sản phẩm không giảm giá niêm yết',
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Chọn danh mục');
      });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Xịt khử mùi' }));

      fireEvent.change(screen.getByLabelText(/giá cơ bản/i), {
        target: { value: '80000' },
      });
      fireEvent.click(screen.getByTestId('add-image-btn'));

      fireEvent.change(screen.getByLabelText('Mùi hương'), {
        target: { value: 'Bạc hà' },
      });
      fireEvent.change(screen.getByLabelText('Giá niêm yết'), {
        target: { value: '80000' },
      });
      fireEvent.change(screen.getByLabelText('Tồn kho'), {
        target: { value: '10' },
      });

      // Enter a value then clear it to empty string
      const salePriceInput = screen.getByLabelText('Giá sale');
      fireEvent.change(salePriceInput, { target: { value: '70000' } });
      fireEvent.change(salePriceInput, { target: { value: '' } });

      const saveBtn = screen.getByRole('button', { name: /lưu sản phẩm/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            variants: [
              expect.objectContaining({
                salePrice: undefined,
              }),
            ],
          }),
        );
      });
    });
  });

  describe('Edit Mode - Data Loading and Pre-filling', () => {
    it('pre-fills form fields with existing product data and disables variant editing', async () => {
      mockParams = { id: 'prod-100' };
      mockUseAdminProduct.mockReturnValue({
        data: sampleProduct,
        isLoading: false,
      });

      renderPage();

      expect(screen.getByTestId('seo-title')).toHaveTextContent(
        'Chỉnh sửa sản phẩm - Nước hoa hồng Rosa',
      );
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Chỉnh sửa sản phẩm',
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Các biến thể hiện có được hiển thị để đối chiếu.'),
      ).toBeInTheDocument();

      // "Thêm biến thể" button should NOT be in edit mode
      expect(
        screen.queryByRole('button', { name: /thêm biến thể/i }),
      ).not.toBeInTheDocument();

      // Pre-filled values
      expect(screen.getByPlaceholderText('Nhập tên sản phẩm')).toHaveValue(
        'Nước hoa hồng Rosa',
      );
      expect(screen.getByPlaceholderText('Nhập mô tả sản phẩm')).toHaveValue(
        'Nước hoa hồng chiết xuất từ hoa hồng Pháp thơm ngát quyến rũ',
      );
      expect(screen.getByLabelText(/giá cơ bản/i)).toHaveValue(250000);
      expect(screen.getByTestId('image-count')).toHaveTextContent('2');

      // Category combobox automatically set once product and categories are loaded
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent(
          'Nước hoa > Nước hoa Nam',
        );
      });

      // Both variants populated
      expect(screen.getByText('Biến thể 1')).toBeInTheDocument();
      expect(screen.getByText('Biến thể 2')).toBeInTheDocument();

      const scents = screen.getAllByLabelText('Mùi hương');
      expect(scents[0]).toHaveValue('Hoa hồng Pháp');
      expect(scents[1]).toHaveValue('Hoa hồng Bulgaria');

      // All variant fields should be disabled in edit mode
      expect(scents[0]).toBeDisabled();
      expect(scents[1]).toBeDisabled();

      const volumes = screen.getAllByLabelText('Dung tích (ml)');
      expect(volumes[0]).toBeDisabled();
      expect(volumes[1]).toBeDisabled();

      const stocks = screen.getAllByLabelText('Tồn kho');
      expect(stocks[0]).toBeDisabled();
      expect(stocks[1]).toBeDisabled();

      const prices = screen.getAllByLabelText('Giá niêm yết');
      expect(prices[0]).toBeDisabled();
      expect(prices[1]).toBeDisabled();

      const salePrices = screen.getAllByLabelText('Giá sale');
      expect(salePrices[0]).toHaveValue(200000);
      expect(salePrices[0]).toBeDisabled();
      expect(salePrices[1]).toHaveValue(null);
      expect(salePrices[1]).toBeDisabled();

      const barcodes = screen.getAllByLabelText('Barcode');
      expect(barcodes[0]).toHaveValue('8931234567890');
      expect(barcodes[0]).toBeDisabled();
      expect(barcodes[1]).toHaveValue('');
      expect(barcodes[1]).toBeDisabled();

      // No delete buttons in edit mode even with multiple variants
      expect(
        screen.queryByRole('button', { name: /xóa biến thể/i }),
      ).not.toBeInTheDocument();
    });

    it('handles product with empty name, null images, and variant with null barcode', async () => {
      mockParams = { id: 'prod-200' };
      mockUseAdminProduct.mockReturnValue({
        data: {
          ...sampleProduct,
          name: '',
          images: null,
          variants: [
            {
              ...sampleProduct.variants[0],
              barcode: null,
            },
          ],
        },
        isLoading: false,
      });

      renderPage();

      // Fallback for SEO title with empty product name
      expect(screen.getByTestId('seo-title').textContent).toBe(
        'Chỉnh sửa sản phẩm - ',
      );
      expect(screen.getByTestId('image-count')).toHaveTextContent('0');
      expect(screen.getByLabelText('Barcode')).toHaveValue('');
    });

    it('handles product with categoryId not found in loaded categories list', async () => {
      mockParams = { id: 'prod-300' };
      mockUseAdminProduct.mockReturnValue({
        data: {
          ...sampleProduct,
          categoryId: 'non-existent-cat-id',
        },
        isLoading: false,
      });

      renderPage();

      // Waits for categories to load
      await waitFor(() => {
        expect(mockGetTree).toHaveBeenCalled();
      });

      // Combobox button displays empty text before ChevronDown because category is not found
      const combobox = screen.getByRole('combobox');
      expect(combobox).not.toHaveTextContent('Chọn danh mục');
      expect(combobox).not.toHaveTextContent('Đang tải danh mục...');
    });

    it('displays root variant error when loaded product has no variants and submitted', async () => {
      mockParams = { id: 'prod-empty-variants' };
      mockUseAdminProduct.mockReturnValue({
        data: {
          ...sampleProduct,
          variants: [],
        },
        isLoading: false,
      });

      renderPage();

      const saveBtn = screen.getByRole('button', { name: /lưu sản phẩm/i });
      fireEvent.click(saveBtn);

      expect(
        await screen.findByText('Sản phẩm phải có ít nhất một biến thể'),
      ).toBeInTheDocument();
    });

    it('successfully updates an existing product (omitting variants) and navigates', async () => {
      mockParams = { id: 'prod-100' };
      mockUseAdminProduct.mockReturnValue({
        data: sampleProduct,
        isLoading: false,
      });

      renderPage();

      // Wait for prefill
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nhập tên sản phẩm')).toHaveValue(
          'Nước hoa hồng Rosa',
        );
      });

      // Update name
      const nameInput = screen.getByPlaceholderText('Nhập tên sản phẩm');
      fireEvent.change(nameInput, {
        target: { value: 'Nước hoa hồng Rosa Phiên Bản Mới' },
      });

      // Submit
      const saveBtn = screen.getByRole('button', { name: /lưu sản phẩm/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
          id: 'prod-100',
          data: {
            name: 'Nước hoa hồng Rosa Phiên Bản Mới',
            description:
              'Nước hoa hồng chiết xuất từ hoa hồng Pháp thơm ngát quyến rũ',
            categoryId: 'cat-leaf-1',
            basePrice: 250000,
            active: true,
            images: [
              'https://example.com/rosa1.jpg',
              'https://example.com/rosa2.jpg',
            ],
          },
        });
      });

      // Assert variants property is deleted from update payload
      const calledData = mockUpdateMutateAsync.mock.calls[0][0].data;
      expect(calledData.variants).toBeUndefined();

      expect(mockToast.success).toHaveBeenCalledWith(
        'Sản phẩm "Nước hoa hồng Rosa Phiên Bản Mới" đã được cập nhật thành công!',
      );
      expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
    });
  });

  describe('Submission Pending States and Error Handling', () => {
    it('shows loading state on save button and disables action buttons during submission', async () => {
      let resolveSubmit: (val?: any) => void = () => {};
      const pendingPromise = new Promise((resolve) => {
        resolveSubmit = resolve;
      });
      mockCreateMutateAsync.mockReturnValueOnce(pendingPromise);

      renderPage();

      // Fill valid form
      fireEvent.change(screen.getByPlaceholderText('Nhập tên sản phẩm'), {
        target: { value: 'Sản phẩm đang lưu test' },
      });
      fireEvent.change(screen.getByPlaceholderText('Nhập mô tả sản phẩm'), {
        target: { value: 'Mô tả đầy đủ chi tiết hơn mười ký tự' },
      });
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Chọn danh mục');
      });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Nước hoa Nam' }));
      fireEvent.change(screen.getByLabelText(/giá cơ bản/i), {
        target: { value: '200000' },
      });
      fireEvent.click(screen.getByTestId('add-image-btn'));
      fireEvent.change(screen.getByLabelText('Mùi hương'), {
        target: { value: 'Trầm hương' },
      });
      fireEvent.change(screen.getByLabelText('Giá niêm yết'), {
        target: { value: '200000' },
      });
      fireEvent.change(screen.getByLabelText('Tồn kho'), {
        target: { value: '10' },
      });

      const saveBtn = screen.getByRole('button', { name: /lưu sản phẩm/i });
      fireEvent.click(saveBtn);

      // During submission, button shows "Đang lưu..." and is disabled
      await waitFor(() => {
        expect(screen.getByText('Đang lưu...')).toBeInTheDocument();
      });
      expect(
        screen.getByRole('button', { name: /đang lưu\.\.\./i }),
      ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled();

      // Resolve the submission
      await act(async () => {
        resolveSubmit({});
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
      });
    });

    it('handles server error with array of messages', async () => {
      mockCreateMutateAsync.mockRejectedValueOnce({
        response: {
          data: {
            message: ['Tên sản phẩm trùng lặp', 'Mô tả không hợp lệ'],
          },
        },
      });

      renderPage();

      // Fill valid form
      fireEvent.change(screen.getByPlaceholderText('Nhập tên sản phẩm'), {
        target: { value: 'Sản phẩm lỗi mảng' },
      });
      fireEvent.change(screen.getByPlaceholderText('Nhập mô tả sản phẩm'), {
        target: { value: 'Mô tả đầy đủ chi tiết hơn mười ký tự' },
      });
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Chọn danh mục');
      });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Nước hoa Nam' }));
      fireEvent.change(screen.getByLabelText(/giá cơ bản/i), {
        target: { value: '200000' },
      });
      fireEvent.click(screen.getByTestId('add-image-btn'));
      fireEvent.change(screen.getByLabelText('Mùi hương'), {
        target: { value: 'Trầm hương' },
      });
      fireEvent.change(screen.getByLabelText('Giá niêm yết'), {
        target: { value: '200000' },
      });
      fireEvent.change(screen.getByLabelText('Tồn kho'), {
        target: { value: '10' },
      });

      fireEvent.click(screen.getByRole('button', { name: /lưu sản phẩm/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Lỗi: Tên sản phẩm trùng lặp, Mô tả không hợp lệ',
        );
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles server error with single string message', async () => {
      mockCreateMutateAsync.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Tên sản phẩm đã tồn tại trong hệ thống',
          },
        },
      });

      renderPage();

      fireEvent.change(screen.getByPlaceholderText('Nhập tên sản phẩm'), {
        target: { value: 'Sản phẩm lỗi chuỗi' },
      });
      fireEvent.change(screen.getByPlaceholderText('Nhập mô tả sản phẩm'), {
        target: { value: 'Mô tả đầy đủ chi tiết hơn mười ký tự' },
      });
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Chọn danh mục');
      });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Nước hoa Nam' }));
      fireEvent.change(screen.getByLabelText(/giá cơ bản/i), {
        target: { value: '200000' },
      });
      fireEvent.click(screen.getByTestId('add-image-btn'));
      fireEvent.change(screen.getByLabelText('Mùi hương'), {
        target: { value: 'Trầm hương' },
      });
      fireEvent.change(screen.getByLabelText('Giá niêm yết'), {
        target: { value: '200000' },
      });
      fireEvent.change(screen.getByLabelText('Tồn kho'), {
        target: { value: '10' },
      });

      fireEvent.click(screen.getByRole('button', { name: /lưu sản phẩm/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Lỗi: Tên sản phẩm đã tồn tại trong hệ thống',
        );
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles generic error with error.message', async () => {
      mockCreateMutateAsync.mockRejectedValueOnce(
        new Error('Lỗi kết nối máy chủ 500'),
      );

      renderPage();

      fireEvent.change(screen.getByPlaceholderText('Nhập tên sản phẩm'), {
        target: { value: 'Sản phẩm lỗi kết nối' },
      });
      fireEvent.change(screen.getByPlaceholderText('Nhập mô tả sản phẩm'), {
        target: { value: 'Mô tả đầy đủ chi tiết hơn mười ký tự' },
      });
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Chọn danh mục');
      });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Nước hoa Nam' }));
      fireEvent.change(screen.getByLabelText(/giá cơ bản/i), {
        target: { value: '200000' },
      });
      fireEvent.click(screen.getByTestId('add-image-btn'));
      fireEvent.change(screen.getByLabelText('Mùi hương'), {
        target: { value: 'Trầm hương' },
      });
      fireEvent.change(screen.getByLabelText('Giá niêm yết'), {
        target: { value: '200000' },
      });
      fireEvent.change(screen.getByLabelText('Tồn kho'), {
        target: { value: '10' },
      });

      fireEvent.click(screen.getByRole('button', { name: /lưu sản phẩm/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Lỗi: Lỗi kết nối máy chủ 500',
        );
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles unknown error fallback to default error message', async () => {
      mockCreateMutateAsync.mockRejectedValueOnce({});

      renderPage();

      fireEvent.change(screen.getByPlaceholderText('Nhập tên sản phẩm'), {
        target: { value: 'Sản phẩm lỗi không rõ' },
      });
      fireEvent.change(screen.getByPlaceholderText('Nhập mô tả sản phẩm'), {
        target: { value: 'Mô tả đầy đủ chi tiết hơn mười ký tự' },
      });
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toHaveTextContent('Chọn danh mục');
      });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Nước hoa Nam' }));
      fireEvent.change(screen.getByLabelText(/giá cơ bản/i), {
        target: { value: '200000' },
      });
      fireEvent.click(screen.getByTestId('add-image-btn'));
      fireEvent.change(screen.getByLabelText('Mùi hương'), {
        target: { value: 'Trầm hương' },
      });
      fireEvent.change(screen.getByLabelText('Giá niêm yết'), {
        target: { value: '200000' },
      });
      fireEvent.change(screen.getByLabelText('Tồn kho'), {
        target: { value: '10' },
      });

      fireEvent.click(screen.getByRole('button', { name: /lưu sản phẩm/i }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Lỗi: Không thể lưu sản phẩm',
        );
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
