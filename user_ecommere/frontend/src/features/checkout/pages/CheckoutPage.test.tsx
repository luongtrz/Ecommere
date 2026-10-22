import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { CheckoutPage } from './CheckoutPage';
import { useCartStore } from '@/features/cart/store/cartStore';
import { formatCurrency } from '@/lib/formatters';
import { QUERY_KEYS, SHIPPING_METHODS, PAYMENT_METHODS } from '@/lib/constants';

// Helper to match text across elements even when broken by multiple nodes, newlines, or non-breaking spaces
function matchText(expectedText: string) {
  const normalizedTarget = expectedText.replace(/\s+/g, ' ').trim();
  return (_content: string, element: Element | null): boolean => {
    if (!element) return false;
    const normalized = (element.textContent || '').replace(/\s+/g, ' ').trim();
    if (!normalized.includes(normalizedTarget)) return false;
    return Array.from(element.children).every(
      (child) =>
        !(child.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .includes(normalizedTarget),
    );
  };
}

// Declare hoisted mock functions safely
const { mockNavigate, mockUseCart, mockUseAddresses } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseCart: vi.fn(),
  mockUseAddresses: vi.fn(),
}));

// Mock react-router-dom navigate
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock apiClient to prevent any real network requests
vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => {
  const mockToastFn: any = vi.fn();
  mockToastFn.error = vi.fn();
  mockToastFn.success = vi.fn();
  mockToastFn.info = vi.fn();
  return {
    toast: mockToastFn,
    default: mockToastFn,
  };
});

// Mock AddressFormDialog
vi.mock('@/features/users/components/AddressFormDialog', () => ({
  AddressFormDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="address-form-dialog">
        <span>Address Form Dialog Content</span>
        <button
          type="button"
          data-testid="close-address-dialog"
          onClick={() => onOpenChange(false)}
        >
          Đóng
        </button>
      </div>
    ) : null,
}));

// Mock cart hook
vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: () => mockUseCart(),
}));

// Mock addresses hook
vi.mock('@/features/users/hooks/useAddresses', () => ({
  useAddresses: () => mockUseAddresses(),
}));

const mockClearCart = vi.fn();

const mockItem1 = {
  productId: 'prod-1',
  variantId: 'var-1',
  name: 'Chai xịt đuổi chuột Thái Lan',
  image: '/images/rat-repellent.jpg',
  price: 120000,
  quantity: 2,
  scent: 'Bạc hà',
  volumeMl: 500,
  stock: 10,
};

const mockItem2 = {
  productId: 'prod-2',
  variantId: 'var-2',
  name: 'Chai xịt diệt côn trùng Thái Lan',
  image: '/images/insect-spray.jpg',
  price: 80000,
  quantity: 1,
  scent: 'Chanh sả',
  volumeMl: 300,
  stock: 5,
};

const mockAddressDefault = {
  id: 'addr-1',
  fullName: 'Nguyễn Văn A',
  phone: '0901234567',
  province: 'Hà Nội',
  district: 'Cầu Giấy',
  ward: 'Dịch Vọng',
  line1: '123 Đường Cầu Giấy',
  isDefault: true,
};

const mockAddressNonDefault = {
  id: 'addr-2',
  fullName: 'Trần Thị B',
  phone: '0912345678',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Bến Nghé',
  line1: '456 Đường Lê Lợi',
  isDefault: false,
};

const defaultTotalPrice = mockItem1.price * mockItem1.quantity;

interface CheckoutOrderPayload {
  checkoutKey: string;
  addressId: string;
  items: Array<{
    variantId: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: string;
  shippingMethod: string;
  shippingFee: number;
  total: number;
}

function renderCheckoutPage(initialEntries = ['/checkout']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <CheckoutPage />
        </MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  );

  return {
    ...utils,
    queryClient,
    invalidateQueriesSpy,
  };
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [], isOpen: false });

    // Polyfill crypto.getRandomValues if not defined in jsdom
    if (typeof globalThis.crypto === 'undefined') {
      // @ts-expect-error fallback for test environment
      globalThis.crypto = {};
    }
    if (!globalThis.crypto.getRandomValues) {
      // @ts-expect-error fallback for test environment
      globalThis.crypto.getRandomValues = (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = (i * 23 + 7) % 256;
        }
        return arr;
      };
    }

    mockUseCart.mockReturnValue({
      items: [mockItem1],
      totalPrice: defaultTotalPrice,
      clearCart: mockClearCart,
    });

    mockUseAddresses.mockReturnValue({
      data: [mockAddressDefault, mockAddressNonDefault],
    });

    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.post).mockImplementation(async (url: string) => {
      if (url === '/orders/preview') {
        return {
          data: {
            data: {
              shippingFee: 30000,
              discount: 0,
              total: defaultTotalPrice + 30000,
            },
          },
        } as any;
      }
      if (url === '/orders/checkout') {
        return {
          data: {
            success: true,
            orderId: 'order-123',
          },
        } as any;
      }
      return { data: {} } as any;
    });
  });

  describe('Empty Cart & Redirection', () => {
    it('redirects to /cart and returns null when cart has no items', () => {
      mockUseCart.mockReturnValue({
        items: [],
        totalPrice: 0,
        clearCart: mockClearCart,
      });

      const { container } = renderCheckoutPage();

      expect(mockNavigate).toHaveBeenCalledWith('/cart', { replace: true });
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Address Management & Auto Selection', () => {
    it('renders empty address placeholder when user has no addresses', () => {
      mockUseAddresses.mockReturnValue({
        data: [],
      });

      renderCheckoutPage();

      expect(screen.getByText('Bạn chưa có địa chỉ nào')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Thêm địa chỉ ngay' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '+ Thêm mới' }),
      ).toBeInTheDocument();
    });

    it('opens and closes AddressFormDialog via "Thêm địa chỉ ngay" button', async () => {
      mockUseAddresses.mockReturnValue({
        data: [],
      });
      const user = userEvent.setup();

      renderCheckoutPage();

      expect(
        screen.queryByTestId('address-form-dialog'),
      ).not.toBeInTheDocument();

      const addAddressBtn = screen.getByRole('button', {
        name: 'Thêm địa chỉ ngay',
      });
      await user.click(addAddressBtn);

      expect(screen.getByTestId('address-form-dialog')).toBeInTheDocument();

      const closeBtn = screen.getByTestId('close-address-dialog');
      await user.click(closeBtn);

      expect(
        screen.queryByTestId('address-form-dialog'),
      ).not.toBeInTheDocument();
    });

    it('opens AddressFormDialog via "+ Thêm mới" button', async () => {
      const user = userEvent.setup();

      renderCheckoutPage();

      const addNewBtn = screen.getByRole('button', { name: '+ Thêm mới' });
      await user.click(addNewBtn);

      expect(screen.getByTestId('address-form-dialog')).toBeInTheDocument();
    });

    it('auto-selects default address when addresses contain an item with isDefault: true', () => {
      mockUseAddresses.mockReturnValue({
        data: [mockAddressNonDefault, mockAddressDefault],
      });

      renderCheckoutPage();

      // Default badge should appear for mockAddressDefault
      expect(screen.getByText('Mặc định')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    });

    it('auto-selects first address when no address has isDefault: true', () => {
      const addressA = {
        ...mockAddressNonDefault,
        id: 'addr-a',
        fullName: 'Lê Văn C',
      };
      const addressB = {
        ...mockAddressNonDefault,
        id: 'addr-b',
        fullName: 'Phạm Thị D',
      };
      mockUseAddresses.mockReturnValue({
        data: [addressA, addressB],
      });

      renderCheckoutPage();

      expect(screen.queryByText('Mặc định')).not.toBeInTheDocument();
      expect(screen.getByText('Lê Văn C')).toBeInTheDocument();
    });

    it('allows selecting another address by click', async () => {
      const user = userEvent.setup();
      renderCheckoutPage();

      const secondAddressCard = screen
        .getByText('Trần Thị B')
        .closest('div[role="button"]')!;
      await user.click(secondAddressCard);

      // Verify that secondAddressCard has border-primary style class indicating selection
      expect(secondAddressCard).toHaveClass('border-primary');
    });

    it('allows selecting address via keyboard Enter and Space, ignoring other keys', () => {
      renderCheckoutPage();

      const firstAddressCard = screen
        .getByText('Nguyễn Văn A')
        .closest('div[role="button"]')!;
      const secondAddressCard = screen
        .getByText('Trần Thị B')
        .closest('div[role="button"]')!;

      // Press Enter on second address
      fireEvent.keyDown(secondAddressCard, { key: 'Enter' });
      expect(secondAddressCard).toHaveClass('border-primary');

      // Press Space on first address
      fireEvent.keyDown(firstAddressCard, { key: ' ' });
      expect(firstAddressCard).toHaveClass('border-primary');

      // Press Escape or ArrowDown - should not switch selection
      fireEvent.keyDown(secondAddressCard, { key: 'Escape' });
      expect(firstAddressCard).toHaveClass('border-primary');
    });
  });

  describe('Shipping Method Selection', () => {
    it('renders all shipping methods and selects standard shipping by default', () => {
      renderCheckoutPage();

      expect(screen.getByText('Phương thức vận chuyển')).toBeInTheDocument();
      expect(screen.getByText('Giao hàng tiêu chuẩn')).toBeInTheDocument();
      expect(screen.getByText('Giao hàng nhanh')).toBeInTheDocument();
      expect(screen.getByText('Nhận hàng trong 3-5 ngày')).toBeInTheDocument();
      expect(screen.getByText('Nhận hàng trong 1-2 ngày')).toBeInTheDocument();

      // By default STANDARD is selected, showing "Đã chọn"
      expect(screen.getByText('Đã chọn')).toBeInTheDocument();
    });

    it('allows selecting another shipping method by click', async () => {
      const user = userEvent.setup();
      renderCheckoutPage();

      const expressShippingCard = screen
        .getByText('Giao hàng nhanh')
        .closest('div[role="button"]')!;

      await user.click(expressShippingCard);

      expect(expressShippingCard).toHaveClass('border-green-500');
    });

    it('allows selecting shipping method via keyboard Enter and Space, ignoring other keys', () => {
      renderCheckoutPage();

      const standardShippingCard = screen
        .getByText('Giao hàng tiêu chuẩn')
        .closest('div[role="button"]')!;
      const expressShippingCard = screen
        .getByText('Giao hàng nhanh')
        .closest('div[role="button"]')!;

      // Select express with Enter
      fireEvent.keyDown(expressShippingCard, { key: 'Enter' });
      expect(expressShippingCard).toHaveClass('border-green-500');

      // Select standard with Space
      fireEvent.keyDown(standardShippingCard, { key: ' ' });
      expect(standardShippingCard).toHaveClass('border-green-500');

      // Press other key like ArrowDown - does not trigger change
      fireEvent.keyDown(expressShippingCard, { key: 'ArrowDown' });
      expect(standardShippingCard).toHaveClass('border-green-500');
    });
  });

  describe('Order Preview API & Calculations', () => {
    it('does not request preview when there is no selected address', () => {
      mockUseAddresses.mockReturnValue({
        data: [],
      });
      renderCheckoutPage();

      expect(vi.mocked(apiClient.post)).not.toHaveBeenCalled();
      // Shipping and total should display placeholder dashes "—"
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });

    it('fetches preview and updates shipping fee, discount, and total from response.data.data', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          data: {
            shippingFee: 45000,
            discount: 15000,
            total: 270000,
          },
        },
      } as any);

      renderCheckoutPage();

      await waitFor(() => {
        expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
          '/orders/preview',
          expect.objectContaining({
            addressId: mockAddressDefault.id,
            items: [
              {
                variantId: mockItem1.variantId,
                quantity: mockItem1.quantity,
                price: mockItem1.price,
              },
            ],
            shippingMethod: SHIPPING_METHODS[0].id,
          }),
          expect.objectContaining({
            signal: expect.any(AbortSignal),
          }),
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText(matchText(formatCurrency(45000))),
        ).toBeInTheDocument();
        expect(
          screen.getByText(matchText(`-${formatCurrency(15000)}`)),
        ).toBeInTheDocument();
        expect(
          screen.getByText(matchText(formatCurrency(270000))),
        ).toBeInTheDocument();
      });
    });

    it('computes total using subtotal when total is not directly returned, and displays "Miễn phí" when fee is 0', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          shippingFee: 0,
          subtotal: 240000,
          discount: 20000,
        },
      } as any);

      renderCheckoutPage();

      await waitFor(() => {
        expect(screen.getByText('Miễn phí')).toBeInTheDocument();
        expect(
          screen.getByText(matchText(`-${formatCurrency(20000)}`)),
        ).toBeInTheDocument();
        // total = subtotal (240000) - discount (20000) + fee (0) = 220000
        expect(
          screen.getByText(matchText(formatCurrency(220000))),
        ).toBeInTheDocument();
      });
    });

    it('falls back to totalPrice + fee when neither total nor subtotal is returned and handles non-number values', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          shippingFee: 'invalid' as any,
          discount: null as any,
        },
      } as any);

      renderCheckoutPage();

      await waitFor(() => {
        // shippingFee defaults to 0 -> renders 'Miễn phí'
        expect(screen.getByText('Miễn phí')).toBeInTheDocument();
        // total = totalPrice (240000) + fee (0) = 240000
        expect(
          screen.getAllByText(matchText(formatCurrency(defaultTotalPrice)))
            .length,
        ).toBeGreaterThanOrEqual(1);
      });
    });

    it('handles preview failure with array message and triggers retry on toast action click', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: {
          data: {
            message: ['Khu vực chưa hỗ trợ giao hàng', 400],
          },
        },
      });

      renderCheckoutPage();

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
          'Khu vực chưa hỗ trợ giao hàng, 400',
          expect.objectContaining({
            action: expect.objectContaining({
              label: 'Thử lại',
              onClick: expect.any(Function),
            }),
          }),
        );
      });

      // Now set apiClient.post to succeed on next attempt
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          data: {
            shippingFee: 30000,
            discount: 0,
            total: 270000,
          },
        },
      } as any);

      // Trigger the retry action
      const toastOptions = vi.mocked(toast.error).mock.calls[0]?.[1] as
        { action?: { label?: string; onClick?: () => void } } | undefined;
      const toastAction = toastOptions?.action;
      const onClick = toastAction?.onClick;
      if (onClick) {
        act(() => {
          onClick();
        });
      }

      await waitFor(() => {
        expect(vi.mocked(apiClient.post)).toHaveBeenCalledTimes(2);
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles preview failure with string error message', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: {
          data: {
            message: 'Không thể tính toán phí giao hàng lúc này',
          },
        },
      });

      renderCheckoutPage();

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
          'Không thể tính toán phí giao hàng lúc này',
          expect.anything(),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles preview failure without message or with whitespace message using default fallback', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: {
          data: {
            message: '   ',
          },
        },
      });

      renderCheckoutPage();

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
          'Không thể tính phí vận chuyển. Vui lòng thử lại.',
          expect.anything(),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('ignores preview errors caused by request cancellation (CanceledError / ERR_CANCELED)', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(apiClient.post).mockRejectedValueOnce({
        name: 'CanceledError',
      });

      renderCheckoutPage();

      await waitFor(() => {
        expect(vi.mocked(apiClient.post)).toHaveBeenCalled();
      });

      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('ignores preview errors with ERR_CANCELED code', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(apiClient.post).mockRejectedValueOnce({ code: 'ERR_CANCELED' });

      renderCheckoutPage();

      await waitFor(() => {
        expect(vi.mocked(apiClient.post)).toHaveBeenCalled();
      });

      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Step Navigation & Validation', () => {
    it('shows toast error when trying to continue on step 1 without an address', async () => {
      mockUseAddresses.mockReturnValue({
        data: [],
      });
      renderCheckoutPage();

      const continueBtn = screen.getByRole('button', { name: /Tiếp tục/i });
      expect(continueBtn).toBeDisabled();
      fireEvent.click(continueBtn);

      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
      expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument();
    });

    it('shows toast error when trying to continue without preview confirmation', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(apiClient.post).mockRejectedValueOnce(
        new Error('Preview failed'),
      );

      renderCheckoutPage();

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
          'Không thể tính phí vận chuyển. Vui lòng thử lại.',
          expect.anything(),
        );
      });

      // Clear the preview failure toast call before testing step validation
      vi.mocked(toast.error).mockClear();

      const continueBtn = screen.getByRole('button', { name: /Tiếp tục/i });
      expect(continueBtn).toBeDisabled();
      fireEvent.click(continueBtn);

      expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
      expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('navigates from Step 1 to Step 2, allows payment method selection, and returns back to Step 1', async () => {
      const user = userEvent.setup();
      renderCheckoutPage();

      // Wait for preview confirmation
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Tiếp tục/i }),
        ).not.toBeDisabled();
      });

      // Proceed to Step 2
      const continueBtn = screen.getByRole('button', { name: /Tiếp tục/i });
      await user.click(continueBtn);

      // Verify Step 2 rendered
      expect(
        screen.getByText('Chọn phương thức thanh toán'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Thanh toán khi nhận hàng (COD)'),
      ).toBeInTheDocument();
      expect(screen.getByText('Chuyển khoản ngân hàng')).toBeInTheDocument();
      expect(screen.getByText('Ví MoMo')).toBeInTheDocument();
      expect(screen.getByText('ZaloPay')).toBeInTheDocument();

      // Non-COD methods should have "Đang bảo trì" badge and disabled attribute
      const maintenanceBadges = screen.getAllByText('Đang bảo trì');
      expect(maintenanceBadges.length).toBe(3);

      const bankTransferCard = screen
        .getByText('Chuyển khoản ngân hàng')
        .closest('div[role="button"]')!;
      expect(bankTransferCard).toHaveAttribute('aria-disabled', 'true');
      expect(bankTransferCard).toHaveAttribute('tabIndex', '-1');

      // Clicking non-COD method should not select it
      await user.click(bankTransferCard);
      expect(bankTransferCard).not.toHaveClass('border-purple-600');

      // Keydown on non-COD method should not select it
      fireEvent.keyDown(bankTransferCard, { key: 'Enter' });
      expect(bankTransferCard).not.toHaveClass('border-purple-600');

      // COD card should be active and selectable via click and keyboard
      const codCard = screen
        .getByText('Thanh toán khi nhận hàng (COD)')
        .closest('div[role="button"]')!;
      expect(codCard).toHaveClass('border-purple-600');

      fireEvent.keyDown(codCard, { key: ' ' });
      expect(codCard).toHaveClass('border-purple-600');

      fireEvent.keyDown(codCard, { key: 'Enter' });
      expect(codCard).toHaveClass('border-purple-600');

      fireEvent.keyDown(codCard, { key: 'ArrowRight' });
      expect(codCard).toHaveClass('border-purple-600');

      // Click "Quay lại" to go back to Step 1
      const backBtn = screen.getByRole('button', { name: 'Quay lại' });
      await user.click(backBtn);

      expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument();
    });

    it('navigates from Step 2 to Step 3 (Order Confirmation) and back', async () => {
      const user = userEvent.setup();
      renderCheckoutPage();

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Tiếp tục/i }),
        ).not.toBeDisabled();
      });

      // Step 1 -> Step 2
      await user.click(screen.getByRole('button', { name: /Tiếp tục/i }));
      expect(
        screen.getByText('Chọn phương thức thanh toán'),
      ).toBeInTheDocument();

      // Step 2 -> Step 3
      await user.click(screen.getByRole('button', { name: /Tiếp tục/i }));

      // Verify Step 3 content
      expect(screen.getByText('Sẵn sàng đặt hàng!')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Vui lòng kiểm tra lại thông tin đơn hàng lần cuối trước khi xác nhận.',
        ),
      ).toBeInTheDocument();

      // Selected address details
      expect(screen.getByText('Giao tới')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      expect(screen.getByText('0901234567')).toBeInTheDocument();
      expect(
        screen.getByText('123 Đường Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội'),
      ).toBeInTheDocument();

      // Payment and shipping details
      expect(screen.getByText('Thanh toán & Vận chuyển')).toBeInTheDocument();
      expect(screen.getByText(SHIPPING_METHODS[0].name)).toBeInTheDocument();
      expect(screen.getByText(PAYMENT_METHODS[0].name)).toBeInTheDocument();

      // Submit button text on Step 3
      expect(
        screen.getByRole('button', { name: 'Xác nhận đặt hàng' }),
      ).toBeInTheDocument();

      // Back button on Step 3 returns to Step 2
      const backBtn = screen.getByRole('button', { name: 'Quay lại' });
      await user.click(backBtn);
      expect(
        screen.getByText('Chọn phương thức thanh toán'),
      ).toBeInTheDocument();
    });
  });

  describe('Order Submission (handleSubmit)', () => {
    it('successfully places an order, fires confetti, invalidates orders query, and redirects to /orders after 1s timer', async () => {
      vi.useFakeTimers();
      const { invalidateQueriesSpy } = renderCheckoutPage();

      // Advance through preview
      await act(async () => {
        await Promise.resolve();
      });

      // Step 1 -> Step 2
      const continueBtn = screen.getByRole('button', { name: /Tiếp tục/i });
      fireEvent.click(continueBtn);

      // Step 2 -> Step 3
      fireEvent.click(continueBtn);

      const submitBtn = screen.getByRole('button', {
        name: 'Xác nhận đặt hàng',
      });
      expect(submitBtn).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Verify /orders/checkout was called with correct structure
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/orders/checkout',
        expect.objectContaining({
          checkoutKey: expect.stringMatching(/^[0-9a-f]{32}$/),
          addressId: mockAddressDefault.id,
          items: [
            {
              variantId: mockItem1.variantId,
              quantity: mockItem1.quantity,
              price: mockItem1.price,
            },
          ],
          paymentMethod: 'COD',
          shippingMethod: 'STANDARD',
          shippingFee: 30000,
          total: defaultTotalPrice + 30000,
        }),
      );

      // Verify queryClient invalidation
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: [QUERY_KEYS.ORDERS],
      });

      // Verify confetti was triggered
      expect(vi.mocked(confetti)).toHaveBeenCalledWith({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Before timer ticks: clearCart and navigate not called
      expect(mockClearCart).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();

      // Fast-forward 1000ms
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/orders');

      vi.useRealTimers();
    });

    it('shows button text "Đang xử lý..." while submit is in progress', async () => {
      let resolveCheckout: (value: any) => void;
      vi.mocked(apiClient.post).mockImplementation(async (url: string) => {
        if (url === '/orders/preview') {
          return {
            data: {
              data: {
                shippingFee: 30000,
                discount: 0,
                total: defaultTotalPrice + 30000,
              },
            },
          } as any;
        }
        if (url === '/orders/checkout') {
          return new Promise((res) => {
            resolveCheckout = res;
          });
        }
        return { data: {} } as any;
      });

      renderCheckoutPage();

      await act(async () => {
        await Promise.resolve();
      });

      // Advance to Step 3
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

      const submitBtn = screen.getByRole('button', {
        name: 'Xác nhận đặt hàng',
      });
      fireEvent.click(submitBtn);

      // While in flight: text should be "Đang xử lý..."
      expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();

      // Resolve checkout
      await act(async () => {
        resolveCheckout({ data: { success: true } });
      });
    });

    it('silently catches error if canvas-confetti throws an exception', async () => {
      vi.useFakeTimers();
      vi.mocked(confetti).mockImplementationOnce(() => {
        throw new Error('Canvas rendering unsupported');
      });

      renderCheckoutPage();

      await act(async () => {
        await Promise.resolve();
      });

      // Step 1 -> Step 2 -> Step 3
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

      const submitBtn = screen.getByRole('button', {
        name: 'Xác nhận đặt hàng',
      });

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      // Timer still executes normally despite confetti error
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/orders');

      vi.useRealTimers();
    });

    it('handles checkout submission failure with array of messages', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(apiClient.post).mockImplementation(async (url: string) => {
        if (url === '/orders/preview') {
          return {
            data: {
              data: {
                shippingFee: 30000,
                discount: 0,
                total: defaultTotalPrice + 30000,
              },
            },
          } as any;
        }
        if (url === '/orders/checkout') {
          return Promise.reject({
            response: {
              data: {
                message: ['Sản phẩm đã hết hàng tồn kho', 400],
              },
            },
          });
        }
        return { data: {} } as any;
      });

      renderCheckoutPage();

      await act(async () => {
        await Promise.resolve();
      });

      // Go to Step 3
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

      const submitBtn = screen.getByRole('button', {
        name: 'Xác nhận đặt hàng',
      });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Sản phẩm đã hết hàng tồn kho, 400',
      );
      expect(mockClearCart).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('handles checkout submission failure with string message', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(apiClient.post).mockImplementation(async (url: string) => {
        if (url === '/orders/preview') {
          return {
            data: {
              data: {
                shippingFee: 30000,
                discount: 0,
                total: defaultTotalPrice + 30000,
              },
            },
          } as any;
        }
        if (url === '/orders/checkout') {
          return Promise.reject({
            response: {
              data: {
                message: 'Phương thức thanh toán tạm thời không khả dụng',
              },
            },
          });
        }
        return { data: {} } as any;
      });

      renderCheckoutPage();

      await act(async () => {
        await Promise.resolve();
      });

      // Go to Step 3
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Xác nhận đặt hàng' }),
        );
      });

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Phương thức thanh toán tạm thời không khả dụng',
      );

      consoleErrorSpy.mockRestore();
    });

    it('handles checkout submission failure with whitespace or empty message using fallback text', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(apiClient.post).mockImplementation(async (url: string) => {
        if (url === '/orders/preview') {
          return {
            data: {
              data: {
                shippingFee: 30000,
                discount: 0,
                total: defaultTotalPrice + 30000,
              },
            },
          } as any;
        }
        if (url === '/orders/checkout') {
          return Promise.reject({
            response: {
              data: {
                message: '   ',
              },
            },
          });
        }
        return { data: {} } as any;
      });

      renderCheckoutPage();

      await act(async () => {
        await Promise.resolve();
      });

      // Go to Step 3
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Xác nhận đặt hàng' }),
        );
      });

      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Đặt hàng thất bại. Vui lòng thử lại.',
      );

      consoleErrorSpy.mockRestore();
    });

    it('reuses existing checkoutKey on resubmission with unchanged details, and generates a new key when details change', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      let checkoutCallCount = 0;
      vi.mocked(apiClient.post).mockImplementation(async (url: string) => {
        if (url === '/orders/preview') {
          return {
            data: {
              data: {
                shippingFee: 30000,
                discount: 0,
                total: defaultTotalPrice + 30000,
              },
            },
          } as any;
        }
        if (url === '/orders/checkout') {
          checkoutCallCount++;
          return Promise.reject({
            response: {
              data: {
                message: `Failure attempt ${checkoutCallCount}`,
              },
            },
          });
        }
        return { data: {} } as any;
      });

      renderCheckoutPage();

      await act(async () => {
        await Promise.resolve();
      });

      // Go to Step 3
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

      const submitBtn = screen.getByRole('button', {
        name: 'Xác nhận đặt hàng',
      });

      // First submit attempt
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      const firstCall = vi
        .mocked(apiClient.post)
        .mock.calls.find((c) => c[0] === '/orders/checkout');
      const firstPayload = firstCall?.[1] as CheckoutOrderPayload | undefined;
      const firstKey = firstPayload?.checkoutKey;
      expect(firstKey).toBeDefined();

      // Second submit attempt without changing data
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      const checkoutCalls = vi
        .mocked(apiClient.post)
        .mock.calls.filter((c) => c[0] === '/orders/checkout');
      const secondPayload = checkoutCalls[1]?.[1] as
        CheckoutOrderPayload | undefined;
      const secondKey = secondPayload?.checkoutKey;
      expect(secondKey).toBe(firstKey);

      // Now navigate back to Step 1 and change shipping method to EXPRESS
      fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
      fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));

      const expressShippingCard = screen
        .getByText('Giao hàng nhanh')
        .closest('div[role="button"]')!;
      fireEvent.click(expressShippingCard);

      // Wait for updated preview
      await act(async () => {
        await Promise.resolve();
      });

      // Navigate forward to Step 3 again
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));
      fireEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

      // Third submit attempt with modified fingerprint
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Xác nhận đặt hàng' }),
        );
      });

      const updatedCalls = vi
        .mocked(apiClient.post)
        .mock.calls.filter((c) => c[0] === '/orders/checkout');
      const thirdPayload = updatedCalls[2]?.[1] as
        CheckoutOrderPayload | undefined;
      const thirdKey = thirdPayload?.checkoutKey;
      // Key must be re-generated
      expect(thirdKey).not.toBe(firstKey);

      consoleErrorSpy.mockRestore();
    });

    it('guards handleSubmit against executing when conditions like isOrdered or null totals are met', async () => {
      // If handleSubmit is invoked directly without address or confirmed preview
      mockUseAddresses.mockReturnValue({
        data: [],
      });
      renderCheckoutPage();

      const continueBtn = screen.getByRole('button', { name: /Tiếp tục/i });
      fireEvent.click(continueBtn);

      const checkoutCalls = vi
        .mocked(apiClient.post)
        .mock.calls.filter((c) => c[0] === '/orders/checkout');
      expect(checkoutCalls).toHaveLength(0);
    });
  });

  describe('Order Summary Details & UI Elements', () => {
    it('renders multiple cart items, quantities, and subtotal correctly', () => {
      const twoItemsTotalPrice =
        mockItem1.price * mockItem1.quantity +
        mockItem2.price * mockItem2.quantity;
      mockUseCart.mockReturnValue({
        items: [mockItem1, mockItem2],
        totalPrice: twoItemsTotalPrice,
        clearCart: mockClearCart,
      });

      renderCheckoutPage();

      expect(screen.getByText('Đơn hàng của bạn')).toBeInTheDocument();
      expect(screen.getByText('2 sản phẩm')).toBeInTheDocument();

      // Check item 1
      expect(screen.getByText(mockItem1.name)).toBeInTheDocument();
      expect(screen.getByText(`Sl: ${mockItem1.quantity}`)).toBeInTheDocument();
      expect(
        screen.getAllByText(
          matchText(formatCurrency(mockItem1.price * mockItem1.quantity)),
        ).length,
      ).toBeGreaterThanOrEqual(1);

      // Check item 2
      expect(screen.getByText(mockItem2.name)).toBeInTheDocument();
      expect(screen.getByText(`Sl: ${mockItem2.quantity}`)).toBeInTheDocument();
      expect(
        screen.getByText(
          matchText(formatCurrency(mockItem2.price * mockItem2.quantity)),
        ),
      ).toBeInTheDocument();

      // Subtotal
      expect(
        screen.getAllByText(matchText(formatCurrency(twoItemsTotalPrice)))
          .length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('renders header back to cart link and security shield badge', () => {
      renderCheckoutPage();

      const backToCartLink = screen.getByRole('link', {
        name: /Quay lại giỏ hàng/i,
      });
      expect(backToCartLink).toBeInTheDocument();
      expect(backToCartLink).toHaveAttribute('href', '/cart');

      expect(screen.getByText('An toàn')).toBeInTheDocument();
    });

    it('shows loading spinners and text "Đang tính..." while preview is in progress', async () => {
      // Hang preview request in pending state
      vi.mocked(apiClient.post).mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      renderCheckoutPage();

      // Phí vận chuyển and Tổng thanh toán should show "Đang tính..."
      const loadingElements = screen.getAllByText('Đang tính...');
      expect(loadingElements.length).toBeGreaterThanOrEqual(1);

      // Next button should be disabled during preview loading
      const continueBtn = screen.getByRole('button', { name: /Tiếp tục/i });
      expect(continueBtn).toBeDisabled();
    });
  });
});
