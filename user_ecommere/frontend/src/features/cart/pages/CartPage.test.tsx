import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartPage } from './CartPage';
import { useCartStore, type CartItem } from '../store/cartStore';
import { formatCurrency } from '@/lib/formatters';

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

// Mock API modules to prevent any network calls
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock data hooks for route-level page
const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();
const mockUseCart = vi.fn();
const mockUseRefreshCartPrices = vi.fn();

vi.mock('../hooks/useCart', () => ({
  useCart: () => mockUseCart(),
}));

vi.mock('../hooks/useRefreshCartPrices', () => ({
  useRefreshCartPrices: () => mockUseRefreshCartPrices(),
}));

function renderWithProviders(
  ui: React.ReactElement,
  initialEntries = ['/cart'],
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>,
  );
}

const mockItem1: CartItem = {
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

const mockItem2: CartItem = {
  productId: 'prod-2',
  variantId: 'var-2',
  name: 'Chai xịt diệt côn trùng',
  image: '/images/insect-spray.jpg',
  price: 80000,
  quantity: 1,
  scent: 'Chanh sả',
  volumeMl: 300,
  stock: 1,
};

const mockItem3: CartItem = {
  productId: 'prod-3',
  variantId: 'var-3',
  name: 'Chai xịt phòng tự nhiên',
  image: '',
  price: 150000,
  quantity: 3,
  scent: 'Hoa hồng',
  volumeMl: 250,
  stock: undefined,
};

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [], isOpen: false });
  });

  it('calls useRefreshCartPrices on render', () => {
    mockUseCart.mockReturnValue({
      items: [],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 0,
    });

    renderWithProviders(<CartPage />);

    expect(mockUseRefreshCartPrices).toHaveBeenCalledTimes(1);
  });

  it('renders empty state correctly when cart is empty', () => {
    mockUseCart.mockReturnValue({
      items: [],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 0,
    });

    renderWithProviders(<CartPage />);

    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Hãy khám phá bộ sưu tập nước hoa xịt thơm của chúng tôi',
      ),
    ).toBeInTheDocument();

    const startShoppingLink = screen.getByRole('link', {
      name: 'Bắt đầu mua sắm',
    });
    expect(startShoppingLink).toBeInTheDocument();
    expect(startShoppingLink).toHaveAttribute('href', '/catalog');

    // Order summary and items should not exist
    expect(screen.queryByText('Tổng đơn hàng')).not.toBeInTheDocument();
    expect(screen.queryByText('Giỏ hàng của bạn')).not.toBeInTheDocument();
  });

  it('renders cart items, header, and order summary when items exist', () => {
    const items = [mockItem1, mockItem2, mockItem3];
    const totalPrice =
      mockItem1.price * mockItem1.quantity +
      mockItem2.price * mockItem2.quantity +
      mockItem3.price * mockItem3.quantity;

    mockUseCart.mockReturnValue({
      items,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice,
    });

    renderWithProviders(<CartPage />);

    // Header checks
    const topContinueLinks = screen.getAllByRole('link', {
      name: /Tiếp tục mua sắm/i,
    });
    expect(topContinueLinks[0]).toHaveAttribute('href', '/catalog');
    expect(screen.getByText('Giỏ hàng của bạn')).toBeInTheDocument();
    expect(
      screen.getByText(`${items.length} sản phẩm trong giỏ hàng`),
    ).toBeInTheDocument();

    // Items checks
    expect(screen.getByText(mockItem1.name)).toBeInTheDocument();
    expect(screen.getByText(mockItem1.scent)).toBeInTheDocument();
    expect(screen.getByText(`${mockItem1.volumeMl}ml`)).toBeInTheDocument();
    expect(
      screen.getByText(
        matchText(`Đơn giá: ${formatCurrency(mockItem1.price)}`),
      ),
    ).toBeInTheDocument();

    expect(screen.getByText(mockItem2.name)).toBeInTheDocument();
    expect(screen.getByText(mockItem2.scent)).toBeInTheDocument();
    expect(screen.getByText(`${mockItem2.volumeMl}ml`)).toBeInTheDocument();
    expect(
      screen.getByText(
        matchText(`Đơn giá: ${formatCurrency(mockItem2.price)}`),
      ),
    ).toBeInTheDocument();

    expect(screen.getByText(mockItem3.name)).toBeInTheDocument();
    expect(screen.getByText(mockItem3.scent)).toBeInTheDocument();
    expect(screen.getByText(`${mockItem3.volumeMl}ml`)).toBeInTheDocument();
    expect(
      screen.getByText(
        matchText(`Đơn giá: ${formatCurrency(mockItem3.price)}`),
      ),
    ).toBeInTheDocument();

    // Order Summary checks
    expect(screen.getByText('Tổng đơn hàng')).toBeInTheDocument();
    expect(
      screen.getByText(`Tạm tính (${items.length} sản phẩm):`),
    ).toBeInTheDocument();
    expect(screen.getByText('Phí vận chuyển:')).toBeInTheDocument();
    expect(screen.getByText('Miễn phí')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng:')).toBeInTheDocument();

    const checkoutLink = screen.getByRole('link', {
      name: /Tiến hành thanh toán/i,
    });
    expect(checkoutLink).toHaveAttribute('href', '/checkout');

    expect(screen.getByText('Thanh toán an toàn')).toBeInTheDocument();
    expect(screen.getByText('Giao hàng tận nơi')).toBeInTheDocument();

    // Total price appears in header badge, subtotal, and total
    const formattedTotals = screen.getAllByText(
      matchText(formatCurrency(totalPrice)),
    );
    expect(formattedTotals.length).toBeGreaterThanOrEqual(3);
  });

  it('renders correct animation delays for items', () => {
    const items = [mockItem1, mockItem2];
    mockUseCart.mockReturnValue({
      items,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 200000,
    });

    renderWithProviders(<CartPage />);

    const card1 = screen.getByText(mockItem1.name).closest('div.bg-white');
    const card2 = screen.getByText(mockItem2.name).closest('div.bg-white');

    expect(card1).toHaveStyle({ animationDelay: '0ms' });
    expect(card2).toHaveStyle({ animationDelay: '80ms' });
  });

  it('handles quantity reduction when clicking minus button', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem1], // quantity: 2
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 240000,
    });

    renderWithProviders(<CartPage />);

    const itemCard = screen
      .getByText(mockItem1.name)
      .closest('div.bg-white') as HTMLElement;
    const minusBtn = (itemCard
      .querySelector('svg.lucide-minus')
      ?.closest('button') ||
      itemCard.querySelectorAll('button')[1]) as HTMLButtonElement;

    expect(minusBtn).not.toBeDisabled();
    fireEvent.click(minusBtn);

    expect(mockUpdateQuantity).toHaveBeenCalledTimes(1);
    expect(mockUpdateQuantity).toHaveBeenCalledWith(
      mockItem1.variantId,
      mockItem1.quantity - 1,
    );
  });

  it('disables minus button when item quantity is 1 or less', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem2], // quantity: 1
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 80000,
    });

    renderWithProviders(<CartPage />);

    const itemCard = screen
      .getByText(mockItem2.name)
      .closest('div.bg-white') as HTMLElement;
    const minusBtn = (itemCard
      .querySelector('svg.lucide-minus')
      ?.closest('button') ||
      itemCard.querySelectorAll('button')[1]) as HTMLButtonElement;

    expect(minusBtn).toBeDisabled();
  });

  it('handles quantity increase when clicking plus button', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem1], // quantity: 2, stock: 10
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 240000,
    });

    renderWithProviders(<CartPage />);

    const itemCard = screen
      .getByText(mockItem1.name)
      .closest('div.bg-white') as HTMLElement;
    const plusBtn = (itemCard
      .querySelector('svg.lucide-plus')
      ?.closest('button') ||
      itemCard.querySelectorAll('button')[2]) as HTMLButtonElement;

    expect(plusBtn).not.toBeDisabled();
    fireEvent.click(plusBtn);

    expect(mockUpdateQuantity).toHaveBeenCalledTimes(1);
    expect(mockUpdateQuantity).toHaveBeenCalledWith(
      mockItem1.variantId,
      mockItem1.quantity + 1,
    );
  });

  it('disables plus button when item quantity reaches stock', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem2], // quantity: 1, stock: 1
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 80000,
    });

    renderWithProviders(<CartPage />);

    const itemCard = screen
      .getByText(mockItem2.name)
      .closest('div.bg-white') as HTMLElement;
    const plusBtn = (itemCard
      .querySelector('svg.lucide-plus')
      ?.closest('button') ||
      itemCard.querySelectorAll('button')[2]) as HTMLButtonElement;

    expect(plusBtn).toBeDisabled();
  });

  it('enables plus button when item has undefined stock', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem3], // quantity: 3, stock: undefined
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 450000,
    });

    renderWithProviders(<CartPage />);

    const itemCard = screen
      .getByText(mockItem3.name)
      .closest('div.bg-white') as HTMLElement;
    const plusBtn = (itemCard
      .querySelector('svg.lucide-plus')
      ?.closest('button') ||
      itemCard.querySelectorAll('button')[2]) as HTMLButtonElement;

    expect(plusBtn).not.toBeDisabled();
    fireEvent.click(plusBtn);

    expect(mockUpdateQuantity).toHaveBeenCalledWith(
      mockItem3.variantId,
      mockItem3.quantity + 1,
    );
  });

  it('calls removeItem with exact variantId when clicking trash button', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem1],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 240000,
    });

    renderWithProviders(<CartPage />);

    const itemCard = screen
      .getByText(mockItem1.name)
      .closest('div.bg-white') as HTMLElement;
    const trashBtn = (itemCard
      .querySelector('svg.lucide-trash-2')
      ?.closest('button') ||
      itemCard.querySelectorAll('button')[0]) as HTMLButtonElement;

    fireEvent.click(trashBtn);

    expect(mockRemoveItem).toHaveBeenCalledTimes(1);
    expect(mockRemoveItem).toHaveBeenCalledWith(mockItem1.variantId);
  });

  it('reflects state changes when cart items change or become empty', () => {
    // Initial render with 2 items
    mockUseCart.mockReturnValue({
      items: [mockItem1, mockItem2],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 320000,
    });

    const { rerender } = renderWithProviders(<CartPage />);

    expect(screen.getByText('2 sản phẩm trong giỏ hàng')).toBeInTheDocument();
    expect(screen.getByText(mockItem1.name)).toBeInTheDocument();
    expect(screen.getByText(mockItem2.name)).toBeInTheDocument();

    // State change: item 1 removed, now 1 item
    mockUseCart.mockReturnValue({
      items: [mockItem2],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 80000,
    });

    rerender(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/cart']}>
          <CartPage />
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(screen.getByText('1 sản phẩm trong giỏ hàng')).toBeInTheDocument();
    expect(screen.queryByText(mockItem1.name)).not.toBeInTheDocument();
    expect(screen.getByText(mockItem2.name)).toBeInTheDocument();

    // State change: all items removed, cart empty
    mockUseCart.mockReturnValue({
      items: [],
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 0,
    });

    rerender(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/cart']}>
          <CartPage />
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument();
    expect(screen.queryByText(mockItem2.name)).not.toBeInTheDocument();
  });
});
