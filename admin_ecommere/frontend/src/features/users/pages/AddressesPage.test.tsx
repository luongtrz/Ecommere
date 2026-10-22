import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddressesPage } from './AddressesPage';
import type { Address } from '../api/users.api';

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = MockResizeObserver as any;
}
if (
  typeof window !== 'undefined' &&
  typeof window.ResizeObserver === 'undefined'
) {
  window.ResizeObserver = MockResizeObserver as any;
}

const mockUseAddresses = vi.fn();
const mockDeleteMutateAsync = vi.fn();
let mockDeleteIsPending = false;

vi.mock('../hooks/useAddresses', () => ({
  useAddresses: () => mockUseAddresses(),
  useDeleteAddress: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: mockDeleteIsPending,
  }),
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title" data-title={title}>
      {title}
    </div>
  ),
}));

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../components/AddressFormDialog', () => ({
  AddressFormDialog: ({
    address,
    open,
    onOpenChange,
  }: {
    address?: Address;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div
      data-testid="mock-address-form-dialog"
      data-open={open ? 'true' : 'false'}
      data-address-id={address?.id || 'none'}
    >
      <span data-testid="dialog-selected-name">
        {address?.fullName || 'empty'}
      </span>
      <button
        data-testid="dialog-close-action"
        onClick={() => onOpenChange(false)}
      >
        Đóng Dialog
      </button>
    </div>
  ),
}));

describe('AddressesPage', () => {
  const mockAddresses: Address[] = [
    {
      id: 'addr-001',
      userId: 'user-001',
      fullName: 'Nguyễn Văn A',
      phone: '0912345678',
      province: 'Hà Nội',
      district: 'Hoàn Kiếm',
      ward: 'Hàng Bạc',
      line1: '12 Tràng Tiền',
      isDefault: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'addr-002',
      userId: 'user-001',
      fullName: 'Trần Thị B',
      phone: '0987654321',
      province: 'TP Hồ Chí Minh',
      district: 'Quận 3',
      ward: 'Phường 6',
      line1: '78 Võ Văn Tần',
      isDefault: false,
      createdAt: '2026-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    if (typeof globalThis.ResizeObserver === 'undefined') {
      globalThis.ResizeObserver = MockResizeObserver as any;
    }
    if (
      typeof window !== 'undefined' &&
      typeof window.ResizeObserver === 'undefined'
    ) {
      window.ResizeObserver = MockResizeObserver as any;
    }
    cleanup();
    vi.clearAllMocks();
    mockDeleteIsPending = false;
    mockDeleteMutateAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AddressesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders loading state when isLoading is true', () => {
    mockUseAddresses.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderComponent();

    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    expect(screen.queryByText('Sổ địa chỉ')).not.toBeInTheDocument();
    expect(screen.queryByTestId('seo-title')).not.toBeInTheDocument();
  });

  it('renders SEO, header, and empty state when addresses array is empty', () => {
    mockUseAddresses.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderComponent();

    const seoElement = screen.getByTestId('seo-title');
    expect(seoElement).toHaveAttribute('data-title', 'Quản lý địa chỉ');
    expect(seoElement).toHaveTextContent('Quản lý địa chỉ');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sổ địa chỉ' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Quản lý địa chỉ giao hàng của bạn'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Thêm địa chỉ' }),
    ).toBeInTheDocument();

    expect(screen.getByText('Chưa có địa chỉ nào')).toBeInTheDocument();
    expect(
      screen.getByText('Thêm địa chỉ để thuận tiện cho việc đặt hàng'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Thêm địa chỉ đầu tiên' }),
    ).toBeInTheDocument();

    const dialog = screen.getByTestId('mock-address-form-dialog');
    expect(dialog).toHaveAttribute('data-open', 'false');
    expect(dialog).toHaveAttribute('data-address-id', 'none');
  });

  it('renders empty state when addresses data is undefined or null', () => {
    mockUseAddresses.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderComponent();

    expect(screen.getByText('Chưa có địa chỉ nào')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Thêm địa chỉ đầu tiên' }),
    ).toBeInTheDocument();
  });

  it('opens create address dialog when clicking "Thêm địa chỉ" header button', async () => {
    const user = userEvent.setup();
    mockUseAddresses.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderComponent();

    const addHeaderButton = screen.getByRole('button', {
      name: 'Thêm địa chỉ',
    });
    await user.click(addHeaderButton);

    const dialog = screen.getByTestId('mock-address-form-dialog');
    expect(dialog).toHaveAttribute('data-open', 'true');
    expect(dialog).toHaveAttribute('data-address-id', 'none');
    expect(screen.getByTestId('dialog-selected-name')).toHaveTextContent(
      'empty',
    );
  });

  it('opens create address dialog when clicking "Thêm địa chỉ đầu tiên" button in empty state', async () => {
    const user = userEvent.setup();
    mockUseAddresses.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderComponent();

    const addFirstButton = screen.getByRole('button', {
      name: 'Thêm địa chỉ đầu tiên',
    });
    await user.click(addFirstButton);

    const dialog = screen.getByTestId('mock-address-form-dialog');
    expect(dialog).toHaveAttribute('data-open', 'true');
    expect(dialog).toHaveAttribute('data-address-id', 'none');
    expect(screen.getByTestId('dialog-selected-name')).toHaveTextContent(
      'empty',
    );
  });

  it('closes dialog and resets selected address when handleDialogClose is triggered', async () => {
    const user = userEvent.setup();
    mockUseAddresses.mockReturnValue({
      data: mockAddresses,
      isLoading: false,
    });

    renderComponent();

    const editCard = screen
      .getByRole('heading', { level: 3, name: 'Nguyễn Văn A' })
      .closest('div.shadow-sm')!;
    const editButton = editCard.querySelectorAll('button')[0];
    await user.click(editButton);

    const dialog = screen.getByTestId('mock-address-form-dialog');
    expect(dialog).toHaveAttribute('data-open', 'true');
    expect(dialog).toHaveAttribute('data-address-id', 'addr-001');

    const closeButton = screen.getByTestId('dialog-close-action');
    await user.click(closeButton);

    expect(dialog).toHaveAttribute('data-open', 'false');
    expect(dialog).toHaveAttribute('data-address-id', 'none');
    expect(screen.getByTestId('dialog-selected-name')).toHaveTextContent(
      'empty',
    );
  });

  it('renders all address cards with details and displays default badge only for default address', () => {
    mockUseAddresses.mockReturnValue({
      data: mockAddresses,
      isLoading: false,
    });

    renderComponent();

    expect(screen.queryByText('Chưa có địa chỉ nào')).not.toBeInTheDocument();

    const card1 = screen
      .getByRole('heading', { level: 3, name: 'Nguyễn Văn A' })
      .closest('div.shadow-sm')!;
    expect(card1).toBeInTheDocument();
    expect(card1).toHaveTextContent('Mặc định');
    expect(card1).toHaveTextContent('SĐT:0912345678');
    expect(card1).toHaveTextContent('Địa chỉ: 12 Tràng Tiền');
    expect(card1).toHaveTextContent('Hàng Bạc, Hoàn Kiếm, Hà Nội');

    const card2 = screen
      .getByRole('heading', { level: 3, name: 'Trần Thị B' })
      .closest('div.shadow-sm')!;
    expect(card2).toBeInTheDocument();
    expect(card2).not.toHaveTextContent('Mặc định');
    expect(card2).toHaveTextContent('SĐT:0987654321');
    expect(card2).toHaveTextContent('Địa chỉ: 78 Võ Văn Tần');
    expect(card2).toHaveTextContent('Phường 6, Quận 3, TP Hồ Chí Minh');
  });

  it('opens edit dialog with address details when clicking edit button', async () => {
    const user = userEvent.setup();
    mockUseAddresses.mockReturnValue({
      data: mockAddresses,
      isLoading: false,
    });

    renderComponent();

    const card2 = screen
      .getByRole('heading', { level: 3, name: 'Trần Thị B' })
      .closest('div.shadow-sm')!;
    const editButton = card2.querySelectorAll('button')[0];
    await user.click(editButton);

    const dialog = screen.getByTestId('mock-address-form-dialog');
    expect(dialog).toHaveAttribute('data-open', 'true');
    expect(dialog).toHaveAttribute('data-address-id', 'addr-002');
    expect(screen.getByTestId('dialog-selected-name')).toHaveTextContent(
      'Trần Thị B',
    );
  });

  it('deletes address when delete button is clicked and user confirms', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    mockUseAddresses.mockReturnValue({
      data: mockAddresses,
      isLoading: false,
    });

    renderComponent();

    const card1 = screen
      .getByRole('heading', { level: 3, name: 'Nguyễn Văn A' })
      .closest('div.shadow-sm')!;
    const deleteButton = card1.querySelectorAll('button')[1];
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledWith(
      'Bạn có chắc chắn muốn xóa địa chỉ này?',
    );
    expect(mockDeleteMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockDeleteMutateAsync).toHaveBeenCalledWith('addr-001');

    confirmSpy.mockRestore();
  });

  it('does not delete address when delete button is clicked and user cancels confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    mockUseAddresses.mockReturnValue({
      data: mockAddresses,
      isLoading: false,
    });

    renderComponent();

    const card1 = screen
      .getByRole('heading', { level: 3, name: 'Nguyễn Văn A' })
      .closest('div.shadow-sm')!;
    const deleteButton = card1.querySelectorAll('button')[1];
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledWith(
      'Bạn có chắc chắn muốn xóa địa chỉ này?',
    );
    expect(mockDeleteMutateAsync).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('disables delete buttons when deleteAddress.isPending is true', () => {
    mockDeleteIsPending = true;
    mockUseAddresses.mockReturnValue({
      data: mockAddresses,
      isLoading: false,
    });

    renderComponent();

    const card1 = screen
      .getByRole('heading', { level: 3, name: 'Nguyễn Văn A' })
      .closest('div.shadow-sm')!;
    const deleteButton1 = card1.querySelectorAll('button')[1];
    expect(deleteButton1).toBeDisabled();

    const card2 = screen
      .getByRole('heading', { level: 3, name: 'Trần Thị B' })
      .closest('div.shadow-sm')!;
    const deleteButton2 = card2.querySelectorAll('button')[1];
    expect(deleteButton2).toBeDisabled();
  });
});
