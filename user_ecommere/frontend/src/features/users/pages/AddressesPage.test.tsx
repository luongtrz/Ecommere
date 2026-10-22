import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddressesPage } from './AddressesPage';
import type { Address } from '../api/users.api';

// Mock API and network layer to guarantee no real requests occur
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  },
}));

vi.mock('@/lib/seo', () => ({
  SEO: ({ title }: { title?: string }) => (
    <div data-testid="seo-title">{title}</div>
  ),
}));

const mockUseAddresses = vi.fn();
const mockDeleteAddressMutateAsync = vi.fn();
let mockDeleteAddressPending = false;

vi.mock('../hooks/useAddresses', () => ({
  useAddresses: () => mockUseAddresses(),
  useDeleteAddress: () => ({
    mutateAsync: mockDeleteAddressMutateAsync,
    isPending: mockDeleteAddressPending,
  }),
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
  }) =>
    open ? (
      <div data-testid="mock-address-form-dialog">
        <span data-testid="mock-dialog-address-prop">
          {address ? JSON.stringify(address) : 'null'}
        </span>
        <button
          type="button"
          data-testid="mock-dialog-close-btn"
          onClick={() => onOpenChange(false)}
        >
          Đóng
        </button>
      </div>
    ) : null,
}));

const sampleAddress1: Address = {
  id: 'addr-001',
  userId: 'user-001',
  fullName: 'Nguyễn Văn Mặc Định',
  phone: '0911111111',
  line1: '123 Phố Huế',
  ward: 'Hàng Bài',
  district: 'Hoàn Kiếm',
  province: 'Hà Nội',
  isDefault: true,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const sampleAddress2: Address = {
  id: 'addr-002',
  userId: 'user-001',
  fullName: 'Trần Thị Thường',
  phone: '0922222222',
  line1: '456 Lê Duẩn',
  ward: 'Hải Châu 1',
  district: 'Hải Châu',
  province: 'Đà Nẵng',
  isDefault: false,
  createdAt: '2024-02-01T00:00:00.000Z',
};

function renderAddressesPage() {
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
}

describe('AddressesPage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockDeleteAddressPending = false;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders loading pulse skeleton state when isLoading is true', () => {
    mockUseAddresses.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderAddressesPage();

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('Sổ địa chỉ')).not.toBeInTheDocument();
    expect(screen.queryByTestId('seo-title')).not.toBeInTheDocument();
  });

  it('renders empty state when data is undefined and isLoading is false', () => {
    mockUseAddresses.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderAddressesPage();

    expect(screen.getByTestId('seo-title')).toHaveTextContent(
      'Quản lý địa chỉ',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Sổ địa chỉ' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Quản lý địa chỉ giao hàng của bạn'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Thêm địa chỉ mới/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 3, name: 'Chưa có địa chỉ nào' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Hãy thêm địa chỉ giao hàng để thuận tiện hơn khi mua sắm tại Thai Spray Shop',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Thêm địa chỉ đầu tiên/i }),
    ).toBeInTheDocument();
  });

  it('renders empty state when data is an empty array', () => {
    mockUseAddresses.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderAddressesPage();

    expect(
      screen.getByRole('heading', { level: 3, name: 'Chưa có địa chỉ nào' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Thêm địa chỉ đầu tiên/i }),
    ).toBeInTheDocument();
  });

  it('opens dialog in add mode when clicking "Thêm địa chỉ đầu tiên" in empty state', async () => {
    const user = userEvent.setup();
    mockUseAddresses.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderAddressesPage();

    expect(
      screen.queryByTestId('mock-address-form-dialog'),
    ).not.toBeInTheDocument();

    const addFirstButton = screen.getByRole('button', {
      name: /Thêm địa chỉ đầu tiên/i,
    });
    await user.click(addFirstButton);

    expect(screen.getByTestId('mock-address-form-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dialog-address-prop')).toHaveTextContent(
      'null',
    );
  });

  it('opens dialog in add mode when clicking "Thêm địa chỉ mới" in header', async () => {
    const user = userEvent.setup();
    mockUseAddresses.mockReturnValue({
      data: [sampleAddress1],
      isLoading: false,
    });

    renderAddressesPage();

    expect(
      screen.queryByTestId('mock-address-form-dialog'),
    ).not.toBeInTheDocument();

    const addNewButton = screen.getByRole('button', {
      name: /Thêm địa chỉ mới/i,
    });
    await user.click(addNewButton);

    expect(screen.getByTestId('mock-address-form-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dialog-address-prop')).toHaveTextContent(
      'null',
    );
  });

  it('renders address list with details and proper styling for default and non-default items', () => {
    mockUseAddresses.mockReturnValue({
      data: [sampleAddress1, sampleAddress2],
      isLoading: false,
    });

    renderAddressesPage();

    // Address 1 (Default)
    expect(screen.getByText('Nguyễn Văn Mặc Định')).toBeInTheDocument();
    expect(screen.getByText('0911111111')).toBeInTheDocument();
    expect(
      screen.getByText('123 Phố Huế, Hàng Bài, Hoàn Kiếm, Hà Nội'),
    ).toBeInTheDocument();
    expect(screen.getByText('Mặc định')).toBeInTheDocument();

    // Card classes for default
    const card1 = screen
      .getByText('Nguyễn Văn Mặc Định')
      .closest('.rounded-xl')!;
    expect(card1).toHaveClass('border-teal-500');

    // Address 2 (Non-default)
    expect(screen.getByText('Trần Thị Thường')).toBeInTheDocument();
    expect(screen.getByText('0922222222')).toBeInTheDocument();
    expect(
      screen.getByText('456 Lê Duẩn, Hải Châu 1, Hải Châu, Đà Nẵng'),
    ).toBeInTheDocument();

    // Check that "Mặc định" badge only appears once (for address 1)
    expect(screen.getAllByText('Mặc định')).toHaveLength(1);

    // Card classes for non-default
    const card2 = screen.getByText('Trần Thị Thường').closest('.rounded-xl')!;
    expect(card2).toHaveClass('border-slate-200');
    expect(card2).not.toHaveClass('border-teal-500');
  });

  it('opens dialog in edit mode with selected address when clicking edit button', async () => {
    const user = userEvent.setup();
    mockUseAddresses.mockReturnValue({
      data: [sampleAddress1, sampleAddress2],
      isLoading: false,
    });

    renderAddressesPage();

    const card2 = screen.getByText('Trần Thị Thường').closest('.rounded-xl')!;
    const editButton =
      card2.querySelector('svg.lucide-edit')?.closest('button') ||
      card2.querySelectorAll('button')[0];

    await user.click(editButton!);

    expect(screen.getByTestId('mock-address-form-dialog')).toBeInTheDocument();

    const addressPropText = screen.getByTestId(
      'mock-dialog-address-prop',
    ).textContent;
    const passedAddress = JSON.parse(addressPropText || '{}');
    expect(passedAddress.id).toBe(sampleAddress2.id);
    expect(passedAddress.fullName).toBe('Trần Thị Thường');
  });

  it('closes dialog and resets selectedAddress when handleDialogClose is triggered', async () => {
    const user = userEvent.setup();
    mockUseAddresses.mockReturnValue({
      data: [sampleAddress1],
      isLoading: false,
    });

    renderAddressesPage();

    // Open in edit mode
    const card1 = screen
      .getByText('Nguyễn Văn Mặc Định')
      .closest('.rounded-xl')!;
    const editButton =
      card1.querySelector('svg.lucide-edit')?.closest('button') ||
      card1.querySelectorAll('button')[0];
    await user.click(editButton!);

    expect(screen.getByTestId('mock-address-form-dialog')).toBeInTheDocument();

    // Trigger dialog close
    const closeBtn = screen.getByTestId('mock-dialog-close-btn');
    await user.click(closeBtn);

    expect(
      screen.queryByTestId('mock-address-form-dialog'),
    ).not.toBeInTheDocument();

    // Now click header "Thêm địa chỉ mới" to ensure selectedAddress was reset to undefined
    const addNewButton = screen.getByRole('button', {
      name: /Thêm địa chỉ mới/i,
    });
    await user.click(addNewButton);

    expect(screen.getByTestId('mock-address-form-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dialog-address-prop')).toHaveTextContent(
      'null',
    );
  });

  it('deletes address when delete button is clicked and user confirms', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockDeleteAddressMutateAsync.mockResolvedValueOnce(undefined);

    mockUseAddresses.mockReturnValue({
      data: [sampleAddress1],
      isLoading: false,
    });

    renderAddressesPage();

    const card1 = screen
      .getByText('Nguyễn Văn Mặc Định')
      .closest('.rounded-xl')!;
    const deleteButton =
      card1.querySelector('svg.lucide-trash-2')?.closest('button') ||
      card1.querySelectorAll('button')[1];

    await user.click(deleteButton!);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Bạn có chắc chắn muốn xóa địa chỉ này?',
    );
    expect(mockDeleteAddressMutateAsync).toHaveBeenCalledWith(
      sampleAddress1.id,
    );
  });

  it('does not delete address when delete button is clicked and user cancels confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    mockUseAddresses.mockReturnValue({
      data: [sampleAddress1],
      isLoading: false,
    });

    renderAddressesPage();

    const card1 = screen
      .getByText('Nguyễn Văn Mặc Định')
      .closest('.rounded-xl')!;
    const deleteButton =
      card1.querySelector('svg.lucide-trash-2')?.closest('button') ||
      card1.querySelectorAll('button')[1];

    await user.click(deleteButton!);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Bạn có chắc chắn muốn xóa địa chỉ này?',
    );
    expect(mockDeleteAddressMutateAsync).not.toHaveBeenCalled();
  });

  it('disables delete buttons when deleteAddress.isPending is true', () => {
    mockDeleteAddressPending = true;

    mockUseAddresses.mockReturnValue({
      data: [sampleAddress1, sampleAddress2],
      isLoading: false,
    });

    renderAddressesPage();

    const card1 = screen
      .getByText('Nguyễn Văn Mặc Định')
      .closest('.rounded-xl')!;
    const deleteButton1 =
      card1.querySelector('svg.lucide-trash-2')?.closest('button') ||
      card1.querySelectorAll('button')[1];

    const card2 = screen.getByText('Trần Thị Thường').closest('.rounded-xl')!;
    const deleteButton2 =
      card2.querySelector('svg.lucide-trash-2')?.closest('button') ||
      card2.querySelectorAll('button')[1];

    expect(deleteButton1).toBeDisabled();
    expect(deleteButton2).toBeDisabled();
  });
});
