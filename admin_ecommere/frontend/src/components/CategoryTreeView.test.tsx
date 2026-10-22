import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CategoryTreeView } from './CategoryTreeView';
import { categoriesApi, Category } from '@/features/admin/api/categories.api';
import { QUERY_KEYS } from '@/lib/constants';

// Mock API client to ensure axios never executes
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  authToken: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    decode: vi.fn(),
  },
}));

// Mock categories API module
vi.mock('@/features/admin/api/categories.api', () => ({
  categoriesApi: {
    getTree: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock toast notifications
const mockToast = {
  toast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  promise: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
};

vi.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

const mockCategoriesData: Category[] = [
  {
    id: 'cat-1',
    name: 'Nước hoa',
    slug: 'nuoc-hoa',
    isLeaf: false,
    productCount: 12,
    children: [
      {
        id: 'cat-1-1',
        name: 'Nước hoa nam',
        slug: 'nuoc-hoa-nam',
        parentId: 'cat-1',
        isLeaf: true,
        productCount: 5,
        children: [],
      },
      {
        id: 'cat-1-2',
        name: 'Nước hoa nữ',
        slug: 'nuoc-hoa-nu',
        parentId: 'cat-1',
        isLeaf: true,
        productCount: 0,
        children: [],
      },
      {
        id: 'cat-1-3',
        name: 'Nước hoa mini',
        slug: 'nuoc-hoa-mini',
        parentId: 'cat-1',
        isLeaf: true,
        productCount: undefined,
        children: undefined,
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'Xịt thơm ô tô',
    slug: 'xit-thom-o-to',
    isLeaf: true,
    productCount: 0,
    children: [],
  },
];

function renderCategoryTreeView(queryClient?: QueryClient) {
  const client =
    queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

  const invalidateQueriesSpy = vi.spyOn(client, 'invalidateQueries');

  const renderResult = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CategoryTreeView />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return {
    ...renderResult,
    queryClient: client,
    invalidateQueriesSpy,
  };
}

describe('CategoryTreeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(categoriesApi.getTree).mockResolvedValue(
      JSON.parse(JSON.stringify(mockCategoriesData)),
    );
    vi.mocked(categoriesApi.create).mockResolvedValue({
      id: 'cat-new',
      name: 'Danh mục mới',
      slug: 'danh-muc-moi',
    });
    vi.mocked(categoriesApi.update).mockResolvedValue({
      id: 'cat-1-2',
      name: 'Nước hoa nữ cập nhật',
      slug: 'nuoc-hoa-nu-cap-nhat',
    });
    vi.mocked(categoriesApi.delete).mockResolvedValue(undefined);
  });

  describe('Initial loading and error states', () => {
    it('renders loading spinner and text while fetching tree', () => {
      vi.mocked(categoriesApi.getTree).mockReturnValue(new Promise(() => {}));
      renderCategoryTreeView();

      expect(
        screen.getByText('Đang tải sơ đồ danh mục...'),
      ).toBeInTheDocument();
    });

    it('handles fetch tree failure, logs error, shows toast, and renders empty state', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const error = new Error('Network failure');
      vi.mocked(categoriesApi.getTree).mockRejectedValueOnce(error);

      renderCategoryTreeView();

      await waitFor(() => {
        expect(
          screen.queryByText('Đang tải sơ đồ danh mục...'),
        ).not.toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch categories tree:',
        error,
      );
      expect(mockToast.error).toHaveBeenCalledWith(
        'Không thể tải sơ đồ danh mục.',
      );
      expect(
        screen.getByText(
          'Chưa có danh mục nào. Hãy tạo danh mục đầu tiên để bắt đầu phân loại sản phẩm.',
        ),
      ).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Empty state', () => {
    it('renders empty view when categories list is empty', async () => {
      vi.mocked(categoriesApi.getTree).mockResolvedValueOnce([]);

      renderCategoryTreeView();

      await waitFor(() => {
        expect(
          screen.queryByText('Đang tải sơ đồ danh mục...'),
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText('Cấu trúc danh mục')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Kéo sản phẩm theo nhánh cha/con để tối ưu hóa điều hướng',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Chưa có danh mục nào. Hãy tạo danh mục đầu tiên để bắt đầu phân loại sản phẩm.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Thêm danh mục gốc/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Tree hierarchy rendering and interactions', () => {
    it('renders categories, product counts, parent badge, and indentation', async () => {
      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa')).toBeInTheDocument();
      });

      // Root node cat-1
      expect(screen.getByText('12 sản phẩm')).toBeInTheDocument();
      expect(screen.getByText('Mục cha')).toBeInTheDocument();

      // Root node cat-2
      expect(screen.getByText('Xịt thơm ô tô')).toBeInTheDocument();

      // Child nodes
      expect(screen.getByText('Nước hoa nam')).toBeInTheDocument();
      expect(screen.getByText('5 sản phẩm')).toBeInTheDocument();

      expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      expect(screen.getByText('Nước hoa mini')).toBeInTheDocument();

      // Product count with 0 or undefined renders "0 sản phẩm"
      const zeroCountElements = screen.getAllByText('0 sản phẩm');
      expect(zeroCountElements.length).toBe(3);

      // Level indentations: root is 0px, child is 12px
      const rootRow = screen
        .getByText('Nước hoa')
        .closest('.group') as HTMLElement;
      expect(rootRow).toHaveStyle({ marginLeft: '0px' });

      const childRow = screen
        .getByText('Nước hoa nam')
        .closest('.group') as HTMLElement;
      expect(childRow).toHaveStyle({ marginLeft: '12px' });
    });

    it('collapses and expands child nodes on chevron click', async () => {
      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa nam')).toBeInTheDocument();
      });

      const rootRow = screen
        .getByText('Nước hoa')
        .closest('.group') as HTMLElement;
      const toggleBtn = rootRow.querySelector('button')!;

      // Collapse children
      fireEvent.click(toggleBtn);
      expect(screen.queryByText('Nước hoa nam')).not.toBeInTheDocument();
      expect(screen.queryByText('Nước hoa nữ')).not.toBeInTheDocument();
      expect(screen.queryByText('Nước hoa mini')).not.toBeInTheDocument();

      // Expand children again
      fireEvent.click(toggleBtn);
      expect(screen.getByText('Nước hoa nam')).toBeInTheDocument();
      expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      expect(screen.getByText('Nước hoa mini')).toBeInTheDocument();
    });

    it('enables or disables delete button depending on children and productCount', async () => {
      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa')).toBeInTheDocument();
      });

      // cat-1 has children: delete is disabled
      const rootRow = screen
        .getByText('Nước hoa')
        .closest('.group') as HTMLElement;
      expect(within(rootRow).getByTitle('Xóa')).toBeDisabled();

      // cat-1-1 has productCount > 0 (5): delete is disabled
      const child1Row = screen
        .getByText('Nước hoa nam')
        .closest('.group') as HTMLElement;
      expect(within(child1Row).getByTitle('Xóa')).toBeDisabled();

      // cat-1-2 has no children and productCount == 0: delete is enabled
      const child2Row = screen
        .getByText('Nước hoa nữ')
        .closest('.group') as HTMLElement;
      expect(within(child2Row).getByTitle('Xóa')).not.toBeDisabled();

      // cat-1-3 has no children and productCount == undefined: delete is enabled
      const child3Row = screen
        .getByText('Nước hoa mini')
        .closest('.group') as HTMLElement;
      expect(within(child3Row).getByTitle('Xóa')).not.toBeDisabled();

      // cat-2 has no children and productCount == 0: delete is enabled
      const root2Row = screen
        .getByText('Xịt thơm ô tô')
        .closest('.group') as HTMLElement;
      expect(within(root2Row).getByTitle('Xóa')).not.toBeDisabled();
    });
  });

  describe('Add Category dialog', () => {
    it('opens add root category dialog, verifies initial state, and cancels', async () => {
      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Cấu trúc danh mục')).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /Thêm danh mục gốc/i }),
      );

      expect(
        screen.getByRole('heading', { name: 'Thêm danh mục mới' }),
      ).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Nhập tên danh mục...');
      expect(input).toHaveValue('');
      expect(screen.getByRole('button', { name: 'Tạo mới' })).toBeDisabled();

      // Cancel dialog via Hủy button
      fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Thêm danh mục mới' }),
        ).not.toBeInTheDocument();
      });
    });

    it('closes add dialog when clicking the built-in Close button', async () => {
      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Cấu trúc danh mục')).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /Thêm danh mục gốc/i }),
      );
      expect(
        screen.getByRole('heading', { name: 'Thêm danh mục mới' }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Thêm danh mục mới' }),
        ).not.toBeInTheDocument();
      });
    });

    it('creates root category successfully with userEvent and verifies API call and cache invalidation', async () => {
      const user = userEvent.setup();
      vi.mocked(categoriesApi.create).mockResolvedValueOnce({
        id: 'cat-new-root',
        name: 'Chăm sóc nhà cửa',
        slug: 'cham-soc-nha-cua',
      });

      const { invalidateQueriesSpy } = renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Cấu trúc danh mục')).toBeInTheDocument();
      });

      await user.click(
        screen.getByRole('button', { name: /Thêm danh mục gốc/i }),
      );
      const input = screen.getByPlaceholderText('Nhập tên danh mục...');
      await user.type(input, 'Chăm sóc nhà cửa');

      const submitBtn = screen.getByRole('button', { name: 'Tạo mới' });
      expect(submitBtn).not.toBeDisabled();
      await user.click(submitBtn);

      await waitFor(() => {
        expect(categoriesApi.create).toHaveBeenCalledWith({
          name: 'Chăm sóc nhà cửa',
          parentId: undefined,
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        'Tạo danh mục "Chăm sóc nhà cửa" thành công',
      );

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Thêm danh mục mới' }),
        ).not.toBeInTheDocument();
      });
      expect(categoriesApi.getTree).toHaveBeenCalledTimes(2);
    });

    it('creates child category successfully with parentId set to active category id', async () => {
      vi.mocked(categoriesApi.create).mockResolvedValueOnce({
        id: 'cat-child-new',
        name: 'Nước hoa unisex',
        slug: 'nuoc-hoa-unisex',
        parentId: 'cat-1',
      });

      const { invalidateQueriesSpy } = renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa')).toBeInTheDocument();
      });

      const rootRow = screen
        .getByText('Nước hoa')
        .closest('.group') as HTMLElement;
      fireEvent.click(within(rootRow).getByTitle('Thêm danh mục con'));

      expect(
        screen.getByRole('heading', { name: 'Thêm danh mục mới' }),
      ).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Nhập tên danh mục...');
      fireEvent.change(input, { target: { value: 'Nước hoa unisex' } });

      fireEvent.click(screen.getByRole('button', { name: 'Tạo mới' }));

      await waitFor(() => {
        expect(categoriesApi.create).toHaveBeenCalledWith({
          name: 'Nước hoa unisex',
          parentId: 'cat-1',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        'Tạo danh mục "Nước hoa unisex" thành công',
      );
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Thêm danh mục mới' }),
        ).not.toBeInTheDocument();
      });
    });

    it('does not call create when submitting input that trims to empty string', async () => {
      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Cấu trúc danh mục')).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /Thêm danh mục gốc/i }),
      );
      const input = screen.getByPlaceholderText('Nhập tên danh mục...');
      fireEvent.change(input, { target: { value: '    ' } });

      const form = input.closest('form') as HTMLFormElement;
      fireEvent.submit(form);

      expect(categoriesApi.create).not.toHaveBeenCalled();
    });

    it('handles create category failure with server error message', async () => {
      vi.mocked(categoriesApi.create).mockRejectedValueOnce({
        response: { data: { message: 'Tên danh mục đã tồn tại' } },
      });

      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Cấu trúc danh mục')).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /Thêm danh mục gốc/i }),
      );
      fireEvent.change(screen.getByPlaceholderText('Nhập tên danh mục...'), {
        target: { value: 'Nước hoa' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Tạo mới' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Thao tác thất bại: Tên danh mục đã tồn tại',
        );
      });
      expect(
        screen.getByRole('heading', { name: 'Thêm danh mục mới' }),
      ).toBeInTheDocument();
    });

    it('handles create category failure with error.message fallback', async () => {
      vi.mocked(categoriesApi.create).mockRejectedValueOnce(
        new Error('Mất kết nối mạng'),
      );

      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Cấu trúc danh mục')).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /Thêm danh mục gốc/i }),
      );
      fireEvent.change(screen.getByPlaceholderText('Nhập tên danh mục...'), {
        target: { value: 'Tên mới' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Tạo mới' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Thao tác thất bại: Mất kết nối mạng',
        );
      });
    });

    it('shows loader and disables submit button while create request is in flight', async () => {
      let resolveCreate: (value: Category) => void;
      const pendingPromise = new Promise<Category>((resolve) => {
        resolveCreate = resolve;
      });
      vi.mocked(categoriesApi.create).mockReturnValueOnce(pendingPromise);

      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Cấu trúc danh mục')).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /Thêm danh mục gốc/i }),
      );
      fireEvent.change(screen.getByPlaceholderText('Nhập tên danh mục...'), {
        target: { value: 'Danh mục pending' },
      });

      const submitBtn = screen.getByRole('button', { name: 'Tạo mới' });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitBtn).toBeDisabled();
      });

      resolveCreate!({
        id: 'done',
        name: 'Danh mục pending',
        slug: 'danh-muc-pending',
      });
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Thêm danh mục mới' }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Category dialog', () => {
    it('opens edit dialog prefilled with category name and cancels', async () => {
      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      });

      const row = screen
        .getByText('Nước hoa nữ')
        .closest('.group') as HTMLElement;
      fireEvent.click(within(row).getByTitle('Chỉnh sửa'));

      expect(
        screen.getByRole('heading', { name: 'Chỉnh sửa tên danh mục' }),
      ).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Nhập tên danh mục...');
      expect(input).toHaveValue('Nước hoa nữ');
      expect(
        screen.getByRole('button', { name: 'Cập nhật' }),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Chỉnh sửa tên danh mục' }),
        ).not.toBeInTheDocument();
      });
    });

    it('updates category name successfully and invalidates queries', async () => {
      vi.mocked(categoriesApi.update).mockResolvedValueOnce({
        id: 'cat-1-2',
        name: 'Nước hoa nữ EDP',
        slug: 'nuoc-hoa-nu-edp',
      });

      const { invalidateQueriesSpy } = renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      });

      const row = screen
        .getByText('Nước hoa nữ')
        .closest('.group') as HTMLElement;
      fireEvent.click(within(row).getByTitle('Chỉnh sửa'));

      const input = screen.getByPlaceholderText('Nhập tên danh mục...');
      fireEvent.change(input, { target: { value: 'Nước hoa nữ EDP' } });

      fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));

      await waitFor(() => {
        expect(categoriesApi.update).toHaveBeenCalledWith('cat-1-2', {
          name: 'Nước hoa nữ EDP',
        });
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        'Cập nhật tên danh mục thành công',
      );
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Chỉnh sửa tên danh mục' }),
        ).not.toBeInTheDocument();
      });
      expect(categoriesApi.getTree).toHaveBeenCalledTimes(2);
    });

    it('handles edit failure with server message and fallback message', async () => {
      vi.mocked(categoriesApi.update).mockRejectedValueOnce({
        response: { data: { message: 'Tên danh mục không hợp lệ' } },
      });

      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      });

      const row = screen
        .getByText('Nước hoa nữ')
        .closest('.group') as HTMLElement;
      fireEvent.click(within(row).getByTitle('Chỉnh sửa'));

      const input = screen.getByPlaceholderText('Nhập tên danh mục...');
      fireEvent.change(input, { target: { value: 'Tên lỗi' } });
      fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Thao tác thất bại: Tên danh mục không hợp lệ',
        );
      });

      // Fallback message test
      vi.mocked(categoriesApi.update).mockRejectedValueOnce(
        new Error('Lỗi cập nhật máy chủ'),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Thao tác thất bại: Lỗi cập nhật máy chủ',
        );
      });
    });
  });

  describe('Delete Category dialog', () => {
    it('opens delete confirmation dialog with category details and cancels', async () => {
      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      });

      const row = screen
        .getByText('Nước hoa nữ')
        .closest('.group') as HTMLElement;
      fireEvent.click(within(row).getByTitle('Xóa'));

      expect(
        screen.getByRole('heading', { name: 'Xóa danh mục này?' }),
      ).toBeInTheDocument();
      expect(screen.getByText('"Nước hoa nữ"')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Hành động này không thể hoàn tác và chỉ có thể thực hiện nếu danh mục không có chứa sản phẩm hoặc danh mục con nào/i,
        ),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Xóa danh mục này?' }),
        ).not.toBeInTheDocument();
      });
      expect(categoriesApi.delete).not.toHaveBeenCalled();
    });

    it('confirms delete, calls API, invalidates queries, and shows success toast', async () => {
      vi.mocked(categoriesApi.delete).mockResolvedValueOnce(undefined);

      const { invalidateQueriesSpy } = renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      });

      const row = screen
        .getByText('Nước hoa nữ')
        .closest('.group') as HTMLElement;
      fireEvent.click(within(row).getByTitle('Xóa'));

      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận xóa' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(categoriesApi.delete).toHaveBeenCalledWith('cat-1-2');
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.CATEGORIES],
      });
      expect(mockToast.success).toHaveBeenCalledWith(
        'Xóa danh mục "Nước hoa nữ" thành công',
      );

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Xóa danh mục này?' }),
        ).not.toBeInTheDocument();
      });
      expect(categoriesApi.getTree).toHaveBeenCalledTimes(2);
    });

    it('handles delete failure with response.data.message and fallback error.message', async () => {
      vi.mocked(categoriesApi.delete).mockRejectedValueOnce({
        response: { data: { message: 'Không thể xóa do ràng buộc dữ liệu' } },
      });

      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      });

      const row = screen
        .getByText('Nước hoa nữ')
        .closest('.group') as HTMLElement;
      fireEvent.click(within(row).getByTitle('Xóa'));

      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận xóa' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Không thể xóa danh mục: Không thể xóa do ràng buộc dữ liệu',
        );
      });

      // Fallback message test
      vi.mocked(categoriesApi.delete).mockRejectedValueOnce(
        new Error('Lỗi máy chủ khi xóa'),
      );
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Không thể xóa danh mục: Lỗi máy chủ khi xóa',
        );
      });
    });

    it('disables buttons while delete request is in flight', async () => {
      let resolveDelete: (value: void) => void;
      const pendingPromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      vi.mocked(categoriesApi.delete).mockReturnValueOnce(pendingPromise);

      renderCategoryTreeView();

      await waitFor(() => {
        expect(screen.getByText('Nước hoa nữ')).toBeInTheDocument();
      });

      const row = screen
        .getByText('Nước hoa nữ')
        .closest('.group') as HTMLElement;
      fireEvent.click(within(row).getByTitle('Xóa'));

      const confirmBtn = screen.getByRole('button', { name: 'Xác nhận xóa' });
      const cancelBtn = screen.getByRole('button', { name: 'Hủy' });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(confirmBtn).toBeDisabled();
        expect(cancelBtn).toBeDisabled();
      });

      resolveDelete!(undefined);
      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: 'Xóa danh mục này?' }),
        ).not.toBeInTheDocument();
      });
    });
  });
});
