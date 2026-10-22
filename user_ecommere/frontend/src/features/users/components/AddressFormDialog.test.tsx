import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AddressFormDialog } from './AddressFormDialog';
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

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateAddressMutateAsync = vi.fn();
const mockUpdateAddressMutateAsync = vi.fn();

let mockCreateAddressPending = false;
let mockUpdateAddressPending = false;

vi.mock('../hooks/useAddresses', () => ({
  useCreateAddress: () => ({
    mutateAsync: mockCreateAddressMutateAsync,
    isPending: mockCreateAddressPending,
  }),
  useUpdateAddress: () => ({
    mutateAsync: mockUpdateAddressMutateAsync,
    isPending: mockUpdateAddressPending,
  }),
}));

const mockAddress: Address = {
  id: 'addr-101',
  userId: 'user-001',
  fullName: 'Nguyễn Văn A',
  phone: '0912345678',
  line1: '123 Đường Lê Lợi',
  province: 'Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Bến Nghé',
  isDefault: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

const mockAddressNonDefault: Address = {
  id: 'addr-102',
  userId: 'user-001',
  fullName: 'Trần Thị B',
  phone: '0987654321',
  line1: '456 Hai Bà Trưng',
  province: 'Hà Nội',
  district: 'Hoàn Kiếm',
  ward: 'Tràng Tiền',
  isDefault: false,
  createdAt: '2024-02-01T00:00:00.000Z',
};

function renderAddressFormDialog(props: {
  address?: Address;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AddressFormDialog {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AddressFormDialog', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockCreateAddressPending = false;
    mockUpdateAddressPending = false;

    if (!globalThis.ResizeObserver) {
      globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));
    }
  });

  afterEach(() => {
    cleanup();
  });

  it('does not render dialog content when open is false', () => {
    renderAddressFormDialog({
      open: false,
      onOpenChange: vi.fn(),
    });

    expect(screen.queryByText('Thêm địa chỉ mới')).not.toBeInTheDocument();
    expect(screen.queryByText('Chỉnh sửa địa chỉ')).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Nguyễn Văn A'),
    ).not.toBeInTheDocument();
  });

  it('renders create mode with blank fields and correct title when open is true and address is undefined', () => {
    renderAddressFormDialog({
      open: true,
      address: undefined,
      onOpenChange: vi.fn(),
    });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Thêm địa chỉ mới' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Thêm địa chỉ' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toHaveValue('');
    expect(screen.getByPlaceholderText('0912345678')).toHaveValue('');
    expect(screen.getByPlaceholderText('Số nhà, tên đường...')).toHaveValue('');
    expect(screen.getByPlaceholderText('Hồ Chí Minh')).toHaveValue('');
    expect(screen.getByPlaceholderText('Quận 1')).toHaveValue('');
    expect(screen.getByPlaceholderText('Bến Nghé')).toHaveValue('');

    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('renders edit mode with prefilled values when open is true and address is provided', () => {
    renderAddressFormDialog({
      open: true,
      address: mockAddress,
      onOpenChange: vi.fn(),
    });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Chỉnh sửa địa chỉ' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cập nhật' }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toHaveValue(
      'Nguyễn Văn A',
    );
    expect(screen.getByPlaceholderText('0912345678')).toHaveValue('0912345678');
    expect(screen.getByPlaceholderText('Số nhà, tên đường...')).toHaveValue(
      '123 Đường Lê Lợi',
    );
    expect(screen.getByPlaceholderText('Hồ Chí Minh')).toHaveValue(
      'Hồ Chí Minh',
    );
    expect(screen.getByPlaceholderText('Quận 1')).toHaveValue('Quận 1');
    expect(screen.getByPlaceholderText('Bến Nghé')).toHaveValue('Bến Nghé');

    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('handles fallback default values when address has empty/falsy fields in edit mode', () => {
    const emptyAddress: Address = {
      id: 'addr-empty',
      userId: 'user-001',
      fullName: '',
      phone: '',
      line1: '',
      province: '',
      district: '',
      ward: '',
      isDefault: false,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    renderAddressFormDialog({
      open: true,
      address: emptyAddress,
      onOpenChange: vi.fn(),
    });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Chỉnh sửa địa chỉ' }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toHaveValue('');
    expect(screen.getByPlaceholderText('0912345678')).toHaveValue('');
    expect(screen.getByPlaceholderText('Số nhà, tên đường...')).toHaveValue('');
    expect(screen.getByPlaceholderText('Hồ Chí Minh')).toHaveValue('');
    expect(screen.getByPlaceholderText('Quận 1')).toHaveValue('');
    expect(screen.getByPlaceholderText('Bến Nghé')).toHaveValue('');

    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('resets form fields when transitioning from edit address to create mode (address becomes undefined)', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const handleOpenChange = vi.fn();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AddressFormDialog
            open={true}
            address={mockAddress}
            onOpenChange={handleOpenChange}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toHaveValue(
      'Nguyễn Văn A',
    );

    // Rerender with address=undefined (create mode)
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AddressFormDialog
            open={true}
            address={undefined}
            onOpenChange={handleOpenChange}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toHaveValue('');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Thêm địa chỉ mới' }),
    ).toBeInTheDocument();
  });

  it('updates form fields when transitioning to a different address in edit mode', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const handleOpenChange = vi.fn();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AddressFormDialog
            open={true}
            address={mockAddress}
            onOpenChange={handleOpenChange}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toHaveValue(
      'Nguyễn Văn A',
    );

    // Rerender with mockAddressNonDefault
    rerender(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AddressFormDialog
            open={true}
            address={mockAddressNonDefault}
            onOpenChange={handleOpenChange}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toHaveValue(
      'Trần Thị B',
    );
    expect(screen.getByPlaceholderText('0912345678')).toHaveValue('0987654321');
    expect(screen.getByPlaceholderText('Số nhà, tên đường...')).toHaveValue(
      '456 Hai Bà Trưng',
    );
    expect(screen.getByPlaceholderText('Hồ Chí Minh')).toHaveValue('Hà Nội');
    expect(screen.getByPlaceholderText('Quận 1')).toHaveValue('Hoàn Kiếm');
    expect(screen.getByPlaceholderText('Bến Nghé')).toHaveValue('Tràng Tiền');
    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('handles updating input fields via onChange events and toggles default checkbox', async () => {
    const user = userEvent.setup();
    renderAddressFormDialog({
      open: true,
      address: undefined,
      onOpenChange: vi.fn(),
    });

    const fullNameInput = screen.getByPlaceholderText('Nguyễn Văn A');
    const phoneInput = screen.getByPlaceholderText('0912345678');
    const line1Input = screen.getByPlaceholderText('Số nhà, tên đường...');
    const provinceInput = screen.getByPlaceholderText('Hồ Chí Minh');
    const districtInput = screen.getByPlaceholderText('Quận 1');
    const wardInput = screen.getByPlaceholderText('Bến Nghé');
    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });

    fireEvent.change(fullNameInput, { target: { value: 'Lê Văn C' } });
    expect(fullNameInput).toHaveValue('Lê Văn C');

    fireEvent.change(phoneInput, { target: { value: '0901112233' } });
    expect(phoneInput).toHaveValue('0901112233');

    fireEvent.change(line1Input, { target: { value: '789 Đường CMT8' } });
    expect(line1Input).toHaveValue('789 Đường CMT8');

    fireEvent.change(provinceInput, { target: { value: 'Cần Thơ' } });
    expect(provinceInput).toHaveValue('Cần Thơ');

    fireEvent.change(districtInput, { target: { value: 'Ninh Kiều' } });
    expect(districtInput).toHaveValue('Ninh Kiều');

    fireEvent.change(wardInput, { target: { value: 'An Cư' } });
    expect(wardInput).toHaveValue('An Cư');

    // Toggle checkbox to checked
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');

    // Toggle checkbox back to unchecked
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('submits form in create mode, calls createAddress.mutateAsync with form data, and closes dialog', async () => {
    const handleOpenChange = vi.fn();
    mockCreateAddressMutateAsync.mockResolvedValueOnce({});

    renderAddressFormDialog({
      open: true,
      address: undefined,
      onOpenChange: handleOpenChange,
    });

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Phạm Minh D' },
    });
    fireEvent.change(screen.getByPlaceholderText('0912345678'), {
      target: { value: '0933445566' },
    });
    fireEvent.change(screen.getByPlaceholderText('Số nhà, tên đường...'), {
      target: { value: '12 Nguyễn Huệ' },
    });
    fireEvent.change(screen.getByPlaceholderText('Hồ Chí Minh'), {
      target: { value: 'Đà Nẵng' },
    });
    fireEvent.change(screen.getByPlaceholderText('Quận 1'), {
      target: { value: 'Hải Châu' },
    });
    fireEvent.change(screen.getByPlaceholderText('Bến Nghé'), {
      target: { value: 'Thạch Thang' },
    });

    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });
    const user = userEvent.setup();
    await user.click(checkbox);

    const submitButton = screen.getByRole('button', { name: 'Thêm địa chỉ' });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(mockCreateAddressMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockCreateAddressMutateAsync).toHaveBeenCalledWith({
        fullName: 'Phạm Minh D',
        phone: '0933445566',
        line1: '12 Nguyễn Huệ',
        province: 'Đà Nẵng',
        district: 'Hải Châu',
        ward: 'Thạch Thang',
        isDefault: true,
      });
    });

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('submits form in edit mode, calls updateAddress.mutateAsync with address id and form data, and closes dialog', async () => {
    const handleOpenChange = vi.fn();
    mockUpdateAddressMutateAsync.mockResolvedValueOnce({});

    renderAddressFormDialog({
      open: true,
      address: mockAddress,
      onOpenChange: handleOpenChange,
    });

    // Edit fullName and phone
    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A Updated' },
    });
    fireEvent.change(screen.getByPlaceholderText('0912345678'), {
      target: { value: '0999888777' },
    });

    const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(mockUpdateAddressMutateAsync).toHaveBeenCalledTimes(1);
      expect(mockUpdateAddressMutateAsync).toHaveBeenCalledWith({
        id: mockAddress.id,
        data: {
          fullName: 'Nguyễn Văn A Updated',
          phone: '0999888777',
          line1: mockAddress.line1,
          province: mockAddress.province,
          district: mockAddress.district,
          ward: mockAddress.ward,
          isDefault: mockAddress.isDefault,
        },
      });
    });

    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('does not call onOpenChange when createAddress.mutateAsync rejects', async () => {
    const handleOpenChange = vi.fn();
    mockCreateAddressMutateAsync.mockRejectedValueOnce(
      new Error('Server error'),
    );

    renderAddressFormDialog({
      open: true,
      address: undefined,
      onOpenChange: handleOpenChange,
    });

    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Lỗi' },
    });

    const submitButton = screen.getByRole('button', { name: 'Thêm địa chỉ' });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(mockCreateAddressMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('does not call onOpenChange when updateAddress.mutateAsync rejects', async () => {
    const handleOpenChange = vi.fn();
    mockUpdateAddressMutateAsync.mockRejectedValueOnce(
      new Error('Server error'),
    );

    renderAddressFormDialog({
      open: true,
      address: mockAddress,
      onOpenChange: handleOpenChange,
    });

    const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
    fireEvent.submit(submitButton.closest('form')!);

    await waitFor(() => {
      expect(mockUpdateAddressMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('calls onOpenChange(false) when cancel button is clicked without submitting', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    renderAddressFormDialog({
      open: true,
      address: undefined,
      onOpenChange: handleOpenChange,
    });

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    await user.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(mockCreateAddressMutateAsync).not.toHaveBeenCalled();
    expect(mockUpdateAddressMutateAsync).not.toHaveBeenCalled();
  });

  it('calls onOpenChange(false) when Radix dialog close button is clicked', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    renderAddressFormDialog({
      open: true,
      address: mockAddress,
      onOpenChange: handleOpenChange,
    });

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables submit button when createAddress.isPending is true', () => {
    mockCreateAddressPending = true;
    mockUpdateAddressPending = false;

    renderAddressFormDialog({
      open: true,
      address: undefined,
      onOpenChange: vi.fn(),
    });

    const submitButton = screen.getByRole('button', { name: 'Thêm địa chỉ' });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when updateAddress.isPending is true', () => {
    mockCreateAddressPending = false;
    mockUpdateAddressPending = true;

    renderAddressFormDialog({
      open: true,
      address: mockAddress,
      onOpenChange: vi.fn(),
    });

    const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
    expect(submitButton).toBeDisabled();
  });
});
