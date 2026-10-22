import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddressFormDialog } from './AddressFormDialog';
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

const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();
let mockCreateIsPending = false;
let mockUpdateIsPending = false;

vi.mock('../hooks/useAddresses', () => ({
  useCreateAddress: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: mockCreateIsPending,
  }),
  useUpdateAddress: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: mockUpdateIsPending,
  }),
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

describe('AddressFormDialog', () => {
  const sampleAddress: Address = {
    id: 'addr-001',
    userId: 'user-001',
    fullName: 'Nguyễn Văn A',
    phone: '0912345678',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    line1: 'Số 10 Lê Duẩn',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  };

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
    mockCreateIsPending = false;
    mockUpdateIsPending = false;
    mockCreateMutateAsync.mockResolvedValue({});
    mockUpdateMutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (props: {
    address?: Address;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <AddressFormDialog {...props} />
      </QueryClientProvider>,
    );
  };

  it('does not render dialog content when open is false', () => {
    renderComponent({
      open: false,
      onOpenChange: vi.fn(),
    });

    expect(screen.queryByText('Thêm địa chỉ mới')).not.toBeInTheDocument();
    expect(screen.queryByText('Chỉnh sửa địa chỉ')).not.toBeInTheDocument();
  });

  it('renders create mode with empty form fields and correct header title', () => {
    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
    });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Thêm địa chỉ mới' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Thêm địa chỉ' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument();

    expect(screen.getByLabelText('Họ và tên *')).toHaveValue('');
    expect(screen.getByLabelText('Số điện thoại *')).toHaveValue('');
    expect(screen.getByLabelText('Địa chỉ chi tiết *')).toHaveValue('');
    expect(screen.getByLabelText('Phường/Xã *')).toHaveValue('');
    expect(screen.getByLabelText('Quận/Huyện *')).toHaveValue('');
    expect(screen.getByLabelText('Tỉnh/Thành phố *')).toHaveValue('');

    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });
    expect(checkbox).not.toBeChecked();
  });

  it('renders edit mode with pre-filled address data and correct header title', () => {
    renderComponent({
      address: sampleAddress,
      open: true,
      onOpenChange: vi.fn(),
    });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Chỉnh sửa địa chỉ' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cập nhật' }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Họ và tên *')).toHaveValue('Nguyễn Văn A');
    expect(screen.getByLabelText('Số điện thoại *')).toHaveValue('0912345678');
    expect(screen.getByLabelText('Địa chỉ chi tiết *')).toHaveValue(
      'Số 10 Lê Duẩn',
    );
    expect(screen.getByLabelText('Phường/Xã *')).toHaveValue('Phường Bến Nghé');
    expect(screen.getByLabelText('Quận/Huyện *')).toHaveValue('Quận 1');
    expect(screen.getByLabelText('Tỉnh/Thành phố *')).toHaveValue(
      'Hồ Chí Minh',
    );

    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });
    expect(checkbox).toBeChecked();
  });

  it('handles fallback to empty strings and false when address fields are falsy or undefined', () => {
    const sparseAddress = {
      id: 'addr-sparse',
      userId: 'user-sparse',
      fullName: undefined as unknown as string,
      phone: undefined as unknown as string,
      province: undefined as unknown as string,
      district: undefined as unknown as string,
      ward: undefined as unknown as string,
      line1: undefined as unknown as string,
      isDefault: undefined as unknown as boolean,
      createdAt: '2026-01-01T00:00:00Z',
    };

    renderComponent({
      address: sparseAddress,
      open: true,
      onOpenChange: vi.fn(),
    });

    expect(screen.getByLabelText('Họ và tên *')).toHaveValue('');
    expect(screen.getByLabelText('Số điện thoại *')).toHaveValue('');
    expect(screen.getByLabelText('Địa chỉ chi tiết *')).toHaveValue('');
    expect(screen.getByLabelText('Phường/Xã *')).toHaveValue('');
    expect(screen.getByLabelText('Quận/Huyện *')).toHaveValue('');
    expect(screen.getByLabelText('Tỉnh/Thành phố *')).toHaveValue('');

    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });
    expect(checkbox).not.toBeChecked();
  });

  it('resets form fields when switching from edit mode to create mode while open', () => {
    const handleOpenChange = vi.fn();
    const { rerender } = renderComponent({
      address: sampleAddress,
      open: true,
      onOpenChange: handleOpenChange,
    });

    expect(screen.getByLabelText('Họ và tên *')).toHaveValue('Nguyễn Văn A');

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <AddressFormDialog
          address={undefined}
          open={true}
          onOpenChange={handleOpenChange}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText('Họ và tên *')).toHaveValue('');
    expect(screen.getByLabelText('Số điện thoại *')).toHaveValue('');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Thêm địa chỉ mới' }),
    ).toBeInTheDocument();
  });

  it('updates form inputs and submits creation form successfully', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    renderComponent({
      open: true,
      onOpenChange: handleOpenChange,
    });

    const fullNameInput = screen.getByLabelText('Họ và tên *');
    const phoneInput = screen.getByLabelText('Số điện thoại *');
    const line1Input = screen.getByLabelText('Địa chỉ chi tiết *');
    const wardInput = screen.getByLabelText('Phường/Xã *');
    const districtInput = screen.getByLabelText('Quận/Huyện *');
    const provinceInput = screen.getByLabelText('Tỉnh/Thành phố *');
    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });

    fireEvent.change(fullNameInput, { target: { value: 'Lê Hoàng Long' } });
    fireEvent.change(phoneInput, { target: { value: '0988776655' } });
    fireEvent.change(line1Input, {
      target: { value: '123 Đường Ba Tháng Hai' },
    });
    fireEvent.change(wardInput, { target: { value: 'Phường 12' } });
    fireEvent.change(districtInput, { target: { value: 'Quận 10' } });
    fireEvent.change(provinceInput, { target: { value: 'TP. Hồ Chí Minh' } });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    const submitButton = screen.getByRole('button', { name: 'Thêm địa chỉ' });
    await user.click(submitButton);

    expect(mockCreateMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockCreateMutateAsync).toHaveBeenCalledWith({
      fullName: 'Lê Hoàng Long',
      phone: '0988776655',
      line1: '123 Đường Ba Tháng Hai',
      ward: 'Phường 12',
      district: 'Quận 10',
      province: 'TP. Hồ Chí Minh',
      isDefault: true,
    });
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('updates form inputs and submits edit form successfully', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    renderComponent({
      address: sampleAddress,
      open: true,
      onOpenChange: handleOpenChange,
    });

    const fullNameInput = screen.getByLabelText('Họ và tên *');
    const checkbox = screen.getByRole('checkbox', {
      name: 'Đặt làm địa chỉ mặc định',
    });

    expect(checkbox).toBeChecked();
    fireEvent.change(fullNameInput, {
      target: { value: 'Nguyễn Văn A (Cập nhật)' },
    });

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
    await user.click(submitButton);

    expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      id: 'addr-001',
      data: {
        fullName: 'Nguyễn Văn A (Cập nhật)',
        phone: '0912345678',
        province: 'Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        line1: 'Số 10 Lê Duẩn',
        isDefault: false,
      },
    });
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when clicking the cancel button "Hủy"', async () => {
    const handleOpenChange = vi.fn();
    const user = userEvent.setup();

    renderComponent({
      open: true,
      onOpenChange: handleOpenChange,
    });

    const cancelButton = screen.getByRole('button', { name: 'Hủy' });
    await user.click(cancelButton);

    expect(handleOpenChange).toHaveBeenCalledTimes(1);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it('disables submit button when createAddress.isPending is true', () => {
    mockCreateIsPending = true;
    mockUpdateIsPending = false;

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
    });

    const submitButton = screen.getByRole('button', { name: 'Thêm địa chỉ' });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when updateAddress.isPending is true', () => {
    mockCreateIsPending = false;
    mockUpdateIsPending = true;

    renderComponent({
      address: sampleAddress,
      open: true,
      onOpenChange: vi.fn(),
    });

    const submitButton = screen.getByRole('button', { name: 'Cập nhật' });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when neither create nor update is pending', () => {
    mockCreateIsPending = false;
    mockUpdateIsPending = false;

    renderComponent({
      open: true,
      onOpenChange: vi.fn(),
    });

    const submitButton = screen.getByRole('button', { name: 'Thêm địa chỉ' });
    expect(submitButton).not.toBeDisabled();
  });
});
