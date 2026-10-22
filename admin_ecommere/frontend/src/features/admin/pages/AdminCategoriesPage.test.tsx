import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  cleanup,
} from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AdminCategoriesPage } from './AdminCategoriesPage';
import {
  categoriesApi,
  type Category,
} from '@/features/admin/api/categories.api';
import { QUERY_KEYS } from '@/lib/constants';

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title} />
  ),
}));

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

vi.mock('@/features/admin/api/categories.api', () => ({
  categoriesApi: {
    getAll: vi.fn(),
    getTree: vi.fn(),
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
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockCategoriesTree: Category[] = [
  {
    id: 'cat-parent-1',
    name: 'Xịt thơm phòng Thái Lan',
    slug: 'xit-thom-phong-thai-lan',
    productCount: 12,
    isLeaf: false,
    children: [
      {
        id: 'cat-child-1',
        name: 'Hương Hoa Nhài',
        slug: 'huong-hoa-nhai',
        parentId: 'cat-parent-1',
        productCount: 5,
        isLeaf: true,
        children: [],
      },
      {
        id: 'cat-child-2',
        name: 'Hương Bạc Hà',
        slug: 'huong-bac-ha',
        parentId: 'cat-parent-1',
        productCount: 0,
        isLeaf: true,
        children: [],
      },
    ],
  },
  {
    id: 'cat-leaf-2',
    name: 'Xịt côn trùng ARS',
    slug: 'xit-con-trung-ars',
    productCount: 0,
    isLeaf: true,
    children: [],
  },
  {
    id: 'cat-leaf-3',
    name: 'Danh mục chưa phân loại',
    slug: 'danh-muc-chua-phan-loai',
    productCount: undefined,
    isLeaf: true,
    children: [],
  },
];

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const renderResult = render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );

  return {
    ...renderResult,
    queryClient,
    invalidateQueriesSpy,
  };
}

function getCategoryRow(name: string): HTMLElement {
  const nameElement = screen.getByText(name);
  const row = nameElement.closest('.group');
  if (!row) {
    throw new Error(`Could not find category row containing "${name}"`);
  }
  return row as HTMLElement;
}

describe('AdminCategoriesPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.mocked(categoriesApi.getAll).mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the layout container with standard admin padding and styling', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValueOnce([]);
    const { container } = renderWithProviders(<AdminCategoriesPage />);

    const rootWrapper = container.querySelector('div.min-h-screen.bg-slate-50');
    expect(rootWrapper).toBeInTheDocument();
  });

  it('displays loading state with spinner and text while categories are being loaded', () => {
    vi.mocked(categoriesApi.getTree).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<AdminCategoriesPage />);

    expect(screen.getByText('Đang tải sơ đồ danh mục...')).toBeInTheDocument();
  });

  it('renders empty state when categories tree is empty', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValueOnce([]);
    renderWithProviders(<AdminCategoriesPage />);

    expect(await screen.findByText('Quản lý danh mục')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cấu trúc danh mục sản phẩm theo mô hình phân cấp cha và con',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Thêm danh mục gốc/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Chưa có danh mục nào phù hợp. Hãy tạo danh mục đầu tiên để bắt đầu phân loại sản phẩm.',
      ),
    ).toBeInTheDocument();
  });

  it('renders category tree hierarchy with parent badges, child items, and product counts', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValueOnce(mockCategoriesTree);
    renderWithProviders(<AdminCategoriesPage />);

    expect(
      await screen.findByText('Xịt thơm phòng Thái Lan'),
    ).toBeInTheDocument();
    expect(screen.getByText('12 SP')).toBeInTheDocument();
    expect(screen.getByText('Mục cha')).toBeInTheDocument();

    expect(screen.getByText('Hương Hoa Nhài')).toBeInTheDocument();
    expect(screen.getByText('5 SP')).toBeInTheDocument();

    expect(screen.getByText('Hương Bạc Hà')).toBeInTheDocument();

    expect(screen.getByText('Xịt côn trùng ARS')).toBeInTheDocument();

    expect(screen.getByText('Danh mục chưa phân loại')).toBeInTheDocument();
    expect(screen.getAllByText('0 SP').length).toBeGreaterThanOrEqual(2);
  });

  it('expands and collapses child categories when chevron toggle is clicked', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValueOnce(mockCategoriesTree);
    renderWithProviders(<AdminCategoriesPage />);

    expect(await screen.findByText('Hương Hoa Nhài')).toBeInTheDocument();

    const parentRow = getCategoryRow('Xịt thơm phòng Thái Lan');
    const toggleButton = parentRow.querySelector(
      'button.p-1',
    ) as HTMLButtonElement;
    expect(toggleButton).toBeTruthy();

    // Click to collapse
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Hương Hoa Nhài')).not.toBeInTheDocument();
    expect(screen.queryByText('Hương Bạc Hà')).not.toBeInTheDocument();

    // Click again to expand
    fireEvent.click(toggleButton);
    expect(screen.getByText('Hương Hoa Nhài')).toBeInTheDocument();
    expect(screen.getByText('Hương Bạc Hà')).toBeInTheDocument();
  });

  it('opens add dialog and creates a new root category', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    vi.mocked(categoriesApi.create).mockResolvedValueOnce({
      id: 'cat-new-root',
      name: 'Chai xịt tinh dầu Thái',
      slug: 'chai-xit-tinh-dau-thai',
    });

    const { invalidateQueriesSpy } = renderWithProviders(
      <AdminCategoriesPage />,
    );

    expect(
      await screen.findByText('Xịt thơm phòng Thái Lan'),
    ).toBeInTheDocument();

    const addRootButton = screen.getByRole('button', {
      name: /Thêm danh mục gốc/i,
    });
    fireEvent.click(addRootButton);

    expect(
      await screen.findByText('Thêm danh mục gốc mới'),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/Tên danh mục/i);
    fireEvent.change(input, {
      target: { value: 'Chai xịt tinh dầu Thái' },
    });

    const submitButton = screen.getByRole('button', { name: 'Tạo mới' });
    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(categoriesApi.create).toHaveBeenCalledTimes(1);
      expect(categoriesApi.create).toHaveBeenCalledWith({
        name: 'Chai xịt tinh dầu Thái',
        parentId: undefined,
      });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.CATEGORIES],
    });
    expect(mockToast.success).toHaveBeenCalledWith(
      'Tạo danh mục "Chai xịt tinh dầu Thái" thành công',
    );
  });

  it('opens add dialog and creates a new child category for a parent node', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    vi.mocked(categoriesApi.create).mockResolvedValueOnce({
      id: 'cat-new-child',
      name: 'Hương Sả Chanh',
      slug: 'huong-sa-chanh',
      parentId: 'cat-parent-1',
    });

    const { invalidateQueriesSpy } = renderWithProviders(
      <AdminCategoriesPage />,
    );

    expect(
      await screen.findByText('Xịt thơm phòng Thái Lan'),
    ).toBeInTheDocument();

    const parentRow = getCategoryRow('Xịt thơm phòng Thái Lan');
    const addChildButton = within(parentRow).getByTitle('Thêm danh mục con');
    fireEvent.click(addChildButton);

    expect(
      await screen.findByText(
        'Thêm danh mục con cho "Xịt thơm phòng Thái Lan"',
      ),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/Tên danh mục/i);
    fireEvent.change(input, {
      target: { value: 'Hương Sả Chanh' },
    });

    const submitButton = screen.getByRole('button', { name: 'Tạo mới' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(categoriesApi.create).toHaveBeenCalledTimes(1);
      expect(categoriesApi.create).toHaveBeenCalledWith({
        name: 'Hương Sả Chanh',
        parentId: 'cat-parent-1',
      });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.CATEGORIES],
    });
    expect(mockToast.success).toHaveBeenCalledWith(
      'Tạo danh mục "Hương Sả Chanh" thành công',
    );
  });

  it('disables submit button and prevents creation when name input is empty or only whitespace', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    renderWithProviders(<AdminCategoriesPage />);

    expect(
      await screen.findByText('Xịt thơm phòng Thái Lan'),
    ).toBeInTheDocument();

    const addRootButton = screen.getByRole('button', {
      name: /Thêm danh mục gốc/i,
    });
    fireEvent.click(addRootButton);

    expect(
      await screen.findByText('Thêm danh mục gốc mới'),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/Tên danh mục/i);
    const submitButton = screen.getByRole('button', { name: 'Tạo mới' });

    expect(submitButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '    ' } });
    expect(submitButton).toBeDisabled();

    // Trigger form submit directly to verify early return
    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(categoriesApi.create).not.toHaveBeenCalled();
  });

  it('closes add dialog when clicking Hủy button without submitting', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    renderWithProviders(<AdminCategoriesPage />);

    expect(
      await screen.findByText('Xịt thơm phòng Thái Lan'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Thêm danh mục gốc/i }));

    expect(
      await screen.findByText('Thêm danh mục gốc mới'),
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Hủy / Bỏ chọn' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Thêm danh mục gốc mới'),
      ).not.toBeInTheDocument();
    });

    expect(categoriesApi.create).not.toHaveBeenCalled();
  });

  it('opens edit dialog with existing name and updates category successfully', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    vi.mocked(categoriesApi.update).mockResolvedValueOnce({
      id: 'cat-leaf-2',
      name: 'Xịt côn trùng ARS 600ml',
      slug: 'xit-con-trung-ars',
    });

    const { invalidateQueriesSpy } = renderWithProviders(
      <AdminCategoriesPage />,
    );

    expect(await screen.findByText('Xịt côn trùng ARS')).toBeInTheDocument();

    const row = getCategoryRow('Xịt côn trùng ARS');
    fireEvent.click(row);

    expect(
      await screen.findByText('Chỉnh sửa danh mục: Xịt côn trùng ARS'),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(/Tên danh mục/i) as HTMLInputElement;
    expect(input.value).toBe('Xịt côn trùng ARS');

    fireEvent.change(input, {
      target: { value: 'Xịt côn trùng ARS 600ml' },
    });

    const submitButton = screen.getByRole('button', { name: 'Lưu thay đổi' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(categoriesApi.update).toHaveBeenCalledTimes(1);
      expect(categoriesApi.update).toHaveBeenCalledWith('cat-leaf-2', {
        name: 'Xịt côn trùng ARS 600ml',
        parentId: undefined,
      });
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.CATEGORIES],
    });
    expect(mockToast.success).toHaveBeenCalledWith(
      'Cập nhật danh mục thành công',
    );
  });

  it('disables delete button for categories with children or with productCount > 0, and enables it for empty leaf categories', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValueOnce(mockCategoriesTree);
    renderWithProviders(<AdminCategoriesPage />);

    expect(
      await screen.findByText('Xịt thơm phòng Thái Lan'),
    ).toBeInTheDocument();

    // cat-parent-1: has children -> disabled
    const parentRow = getCategoryRow('Xịt thơm phòng Thái Lan');
    const parentDeleteBtn = within(parentRow).getByTitle('Xóa danh mục');
    expect(parentDeleteBtn).toBeDisabled();

    // cat-child-1: productCount = 5 -> disabled
    const child1Row = getCategoryRow('Hương Hoa Nhài');
    const child1DeleteBtn = within(child1Row).getByTitle('Xóa danh mục');
    expect(child1DeleteBtn).toBeDisabled();

    // cat-child-2: productCount = 0, no children -> enabled
    const child2Row = getCategoryRow('Hương Bạc Hà');
    const child2DeleteBtn = within(child2Row).getByTitle('Xóa danh mục');
    expect(child2DeleteBtn).not.toBeDisabled();

    // cat-leaf-2: productCount = 0, no children -> enabled
    const leaf2Row = getCategoryRow('Xịt côn trùng ARS');
    const leaf2DeleteBtn = within(leaf2Row).getByTitle('Xóa danh mục');
    expect(leaf2DeleteBtn).not.toBeDisabled();

    // cat-leaf-3: productCount = undefined, no children -> enabled
    const leaf3Row = getCategoryRow('Danh mục chưa phân loại');
    const leaf3DeleteBtn = within(leaf3Row).getByTitle('Xóa danh mục');
    expect(leaf3DeleteBtn).not.toBeDisabled();
  });

  it('opens delete confirmation dialog and cancels deletion when clicking Hủy', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    renderWithProviders(<AdminCategoriesPage />);

    expect(await screen.findByText('Xịt côn trùng ARS')).toBeInTheDocument();

    const row = getCategoryRow('Xịt côn trùng ARS');
    const deleteButton = within(row).getByTitle('Xóa danh mục');
    fireEvent.click(deleteButton);

    expect(
      await screen.findByText('Xác nhận xóa danh mục'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bạn có chắc chắn muốn xóa danh mục/),
    ).toBeInTheDocument();
    expect(screen.getByText('"Xịt côn trùng ARS"')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Xác nhận xóa danh mục'),
      ).not.toBeInTheDocument();
    });

    expect(categoriesApi.delete).not.toHaveBeenCalled();
  });

  it('confirms and deletes category successfully', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    vi.mocked(categoriesApi.delete).mockResolvedValueOnce();

    const { invalidateQueriesSpy } = renderWithProviders(
      <AdminCategoriesPage />,
    );

    expect(await screen.findByText('Xịt côn trùng ARS')).toBeInTheDocument();

    const row = getCategoryRow('Xịt côn trùng ARS');
    const deleteButton = within(row).getByTitle('Xóa danh mục');
    fireEvent.click(deleteButton);

    expect(
      await screen.findByText('Xác nhận xóa danh mục'),
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', {
      name: 'Xác nhận xóa',
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(categoriesApi.delete).toHaveBeenCalledTimes(1);
      expect(categoriesApi.delete).toHaveBeenCalledWith('cat-leaf-2');
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEYS.CATEGORIES],
    });
    expect(mockToast.success).toHaveBeenCalledWith('Xóa danh mục thành công');
  });

  it('shows error toast when fetching categories tree fails', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const networkError = new Error('Lỗi tải dữ liệu');
    vi.mocked(categoriesApi.getTree).mockRejectedValueOnce(networkError);

    renderWithProviders(<AdminCategoriesPage />);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Không thể tải sơ đồ danh mục.',
      );
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch categories tree:',
      networkError,
    );
    consoleErrorSpy.mockRestore();
  });

  it('shows error toast with backend message when category creation fails', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    vi.mocked(categoriesApi.create).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Tên danh mục đã tồn tại',
        },
      },
    });

    renderWithProviders(<AdminCategoriesPage />);

    expect(
      await screen.findByText('Xịt thơm phòng Thái Lan'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Thêm danh mục gốc/i }));

    const input = screen.getByLabelText(/Tên danh mục/i);
    fireEvent.change(input, { target: { value: 'Tên trùng' } });

    const submitButton = screen.getByRole('button', { name: 'Tạo mới' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Không thể tạo danh mục: Tên danh mục đã tồn tại',
      );
    });
  });

  it('shows error toast with fallback error message when category update fails without response data', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    vi.mocked(categoriesApi.update).mockRejectedValueOnce(
      new Error('Mất kết nối máy chủ'),
    );

    renderWithProviders(<AdminCategoriesPage />);

    expect(await screen.findByText('Xịt côn trùng ARS')).toBeInTheDocument();

    const row = getCategoryRow('Xịt côn trùng ARS');
    fireEvent.click(row);

    expect(
      await screen.findByText('Chỉnh sửa danh mục: Xịt côn trùng ARS'),
    ).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: 'Lưu thay đổi' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Không thể cập nhật danh mục: Mất kết nối máy chủ',
      );
    });
  });

  it('shows error toast with backend message when category deletion fails', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    vi.mocked(categoriesApi.delete).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Không thể xóa danh mục đang có sản phẩm',
        },
      },
    });

    renderWithProviders(<AdminCategoriesPage />);

    expect(await screen.findByText('Xịt côn trùng ARS')).toBeInTheDocument();

    const row = getCategoryRow('Xịt côn trùng ARS');
    fireEvent.click(within(row).getByTitle('Xóa danh mục'));

    expect(
      await screen.findByText('Xác nhận xóa danh mục'),
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', {
      name: 'Xác nhận xóa',
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Không thể xóa danh mục: Không thể xóa danh mục đang có sản phẩm',
      );
    });
  });

  it('shows error toast with fallback error message when category deletion fails without response data', async () => {
    vi.mocked(categoriesApi.getTree).mockResolvedValue(mockCategoriesTree);
    vi.mocked(categoriesApi.delete).mockRejectedValueOnce(
      new Error('Lỗi hệ thống khi xóa'),
    );

    renderWithProviders(<AdminCategoriesPage />);

    expect(await screen.findByText('Xịt côn trùng ARS')).toBeInTheDocument();

    const row = getCategoryRow('Xịt côn trùng ARS');
    fireEvent.click(within(row).getByTitle('Xóa danh mục'));

    expect(
      await screen.findByText('Xác nhận xóa danh mục'),
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', {
      name: 'Xác nhận xóa',
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        'Không thể xóa danh mục: Lỗi hệ thống khi xóa',
      );
    });
  });
});
