import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartDrawer } from './CartDrawer';
import { useCartStore, type CartItem } from '@/features/cart/store/cartStore';
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

// Mock useCart hook
const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();
const mockCloseCart = vi.fn();
const mockUseCart = vi.fn();

vi.mock('@/features/cart/hooks/useCart', () => ({
  useCart: () => mockUseCart(),
}));

function renderWithProviders(ui: React.ReactElement, initialEntries = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
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
  name: 'Chai xịt đa năng tiện ích',
  image: '',
  price: 60000,
  quantity: 2,
  scent: '', // no scent
  volumeMl: 0, // no volume
  stock: undefined,
};

describe('CartDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({ items: [], isOpen: false });
  });

  it('does not render drawer content when isOpen is false', () => {
    mockUseCart.mockReturnValue({
      items: [],
      isOpen: false,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 0,
    });

    renderWithProviders(<CartDrawer />);

    expect(screen.queryByText('Giỏ Hàng Của Bạn')).not.toBeInTheDocument();
  });

  it('renders empty cart drawer correctly when isOpen is true and cart is empty', () => {
    mockUseCart.mockReturnValue({
      items: [],
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 0,
    });

    renderWithProviders(<CartDrawer />);

    // Header
    expect(screen.getByText('Giỏ Hàng Của Bạn')).toBeInTheDocument();
    expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();

    // Freeship Progress Meter
    expect(screen.getByText(/Mua thêm/i)).toBeInTheDocument();
    expect(
      screen.getByText(matchText(formatCurrency(250000))),
    ).toBeInTheDocument();
    expect(screen.getByText(/để được Freeship/i)).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Empty state
    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Hãy khám phá các dòng chai xịt Thái Lan đuổi chuột, diệt côn trùng và tẩy rửa tiện ích.',
      ),
    ).toBeInTheDocument();

    const discoverBtn = screen.getByRole('link', {
      name: 'Khám Phá Sản Phẩm Ngay',
    });
    expect(discoverBtn).toBeInTheDocument();
    expect(discoverBtn).toHaveAttribute('href', '/catalog');

    fireEvent.click(discoverBtn);
    expect(mockCloseCart).toHaveBeenCalledTimes(1);
  });

  it('renders cart items, line totals, and footer when items exist below freeship threshold', () => {
    const items = [mockItem1];
    const totalPrice = mockItem1.price * mockItem1.quantity; // 240,000 (< 250,000)
    const freeshipRemaining = 250000 - totalPrice; // 10,000
    const freeshipProgress = Math.min(
      100,
      Math.round((totalPrice / 250000) * 100),
    ); // 96%

    mockUseCart.mockReturnValue({
      items,
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice,
    });

    renderWithProviders(<CartDrawer />);

    // Header
    expect(screen.getByText('Giỏ Hàng Của Bạn')).toBeInTheDocument();
    expect(screen.getByText('1 sản phẩm')).toBeInTheDocument();

    // Freeship meter below threshold
    expect(screen.getByText(/Mua thêm/i)).toBeInTheDocument();
    expect(
      screen.getByText(matchText(formatCurrency(freeshipRemaining))),
    ).toBeInTheDocument();
    expect(screen.getByText(/để được Freeship/i)).toBeInTheDocument();
    expect(screen.getByText(`${freeshipProgress}%`)).toBeInTheDocument();
    expect(
      screen.queryByText('🎉 Bạn đã đủ điều kiện FREESHIP!'),
    ).not.toBeInTheDocument();

    // Item details
    expect(screen.getByText(mockItem1.name)).toBeInTheDocument();
    expect(screen.getByText(mockItem1.scent)).toBeInTheDocument();
    expect(screen.getByText(`${mockItem1.volumeMl}ml`)).toBeInTheDocument();
    expect(
      screen.getAllByText(matchText(formatCurrency(totalPrice))).length,
    ).toBeGreaterThanOrEqual(1);

    // Footer summary
    expect(screen.getByText('Tạm tính (1 sản phẩm):')).toBeInTheDocument();
    expect(screen.getByText('Vận chuyển:')).toBeInTheDocument();

    const shippingFee = screen.getByText('Tính khi thanh toán');
    expect(shippingFee).toBeInTheDocument();
    expect(shippingFee).toHaveClass('text-slate-700');
    expect(shippingFee).not.toHaveClass('text-emerald-600');

    expect(screen.getByText('Tổng cộng:')).toBeInTheDocument();

    // Action buttons in footer
    const checkoutBtn = screen.getByRole('link', {
      name: /Tiến Hành Thanh Toán/i,
    });
    expect(checkoutBtn).toHaveAttribute('href', '/checkout');
    fireEvent.click(checkoutBtn);
    expect(mockCloseCart).toHaveBeenCalledTimes(1);

    const viewCartBtn = screen.getByRole('link', {
      name: 'Xem Trang Giỏ Hàng Chi Tiết',
    });
    expect(viewCartBtn).toHaveAttribute('href', '/cart');
    fireEvent.click(viewCartBtn);
    expect(mockCloseCart).toHaveBeenCalledTimes(2);
  });

  it('renders freeship qualified status and free shipping when totalPrice meets or exceeds threshold', () => {
    const items = [mockItem1];
    const totalPrice = 300000; // >= 250,000

    mockUseCart.mockReturnValue({
      items,
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice,
    });

    renderWithProviders(<CartDrawer />);

    // Freeship meter qualified
    expect(
      screen.getByText('🎉 Bạn đã đủ điều kiện FREESHIP!'),
    ).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.queryByText(/Mua thêm/i)).not.toBeInTheDocument();

    // Footer shipping qualified
    const freeShipping = screen.getByText('Miễn phí');
    expect(freeShipping).toBeInTheDocument();
    expect(freeShipping).toHaveClass('text-emerald-600 font-bold');
  });

  it('handles quantity reduction via minus button', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem1], // quantity: 2
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 240000,
    });

    renderWithProviders(<CartDrawer />);

    const drawerItem = screen
      .getByText(mockItem1.name)
      .closest('div.py-4') as HTMLElement;
    const minusBtn = (drawerItem
      .querySelector('svg.lucide-minus')
      ?.closest('button') ||
      drawerItem.querySelectorAll('button')[0]) as HTMLButtonElement;

    expect(minusBtn).not.toBeDisabled();
    fireEvent.click(minusBtn);

    expect(mockUpdateQuantity).toHaveBeenCalledTimes(1);
    expect(mockUpdateQuantity).toHaveBeenCalledWith(
      mockItem1.variantId,
      mockItem1.quantity - 1,
    );
  });

  it('disables minus button when item quantity is 1', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem2], // quantity: 1
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 80000,
    });

    renderWithProviders(<CartDrawer />);

    const drawerItem = screen
      .getByText(mockItem2.name)
      .closest('div.py-4') as HTMLElement;
    const minusBtn = (drawerItem
      .querySelector('svg.lucide-minus')
      ?.closest('button') ||
      drawerItem.querySelectorAll('button')[0]) as HTMLButtonElement;

    expect(minusBtn).toBeDisabled();
  });

  it('handles quantity increase via plus button', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem1], // quantity: 2, stock: 10
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 240000,
    });

    renderWithProviders(<CartDrawer />);

    const drawerItem = screen
      .getByText(mockItem1.name)
      .closest('div.py-4') as HTMLElement;
    const plusBtn = (drawerItem
      .querySelector('svg.lucide-plus')
      ?.closest('button') ||
      drawerItem.querySelectorAll('button')[1]) as HTMLButtonElement;

    expect(plusBtn).not.toBeDisabled();
    fireEvent.click(plusBtn);

    expect(mockUpdateQuantity).toHaveBeenCalledTimes(1);
    expect(mockUpdateQuantity).toHaveBeenCalledWith(
      mockItem1.variantId,
      mockItem1.quantity + 1,
    );
  });

  it('disables plus button when quantity reaches stock', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem2], // quantity: 1, stock: 1
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 80000,
    });

    renderWithProviders(<CartDrawer />);

    const drawerItem = screen
      .getByText(mockItem2.name)
      .closest('div.py-4') as HTMLElement;
    const plusBtn = (drawerItem
      .querySelector('svg.lucide-plus')
      ?.closest('button') ||
      drawerItem.querySelectorAll('button')[1]) as HTMLButtonElement;

    expect(plusBtn).toBeDisabled();
  });

  it('enables plus button when item stock is undefined', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem3], // quantity: 2, stock: undefined
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 120000,
    });

    renderWithProviders(<CartDrawer />);

    const drawerItem = screen
      .getByText(mockItem3.name)
      .closest('div.py-4') as HTMLElement;
    const plusBtn = (drawerItem
      .querySelector('svg.lucide-plus')
      ?.closest('button') ||
      drawerItem.querySelectorAll('button')[1]) as HTMLButtonElement;

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
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 240000,
    });

    renderWithProviders(<CartDrawer />);

    const deleteBtn = screen.getByRole('button', { name: 'Xóa sản phẩm' });
    fireEvent.click(deleteBtn);

    expect(mockRemoveItem).toHaveBeenCalledTimes(1);
    expect(mockRemoveItem).toHaveBeenCalledWith(mockItem1.variantId);
  });

  it('handles optional scent and volumeMl fields in items', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem3], // scent: '', volumeMl: 0
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 120000,
    });

    renderWithProviders(<CartDrawer />);

    const drawerItem = screen
      .getByText(mockItem3.name)
      .closest('div.py-4') as HTMLElement;

    // Badges or text for scent / volumeMl should not be rendered
    expect(drawerItem.querySelector('.bg-slate-100')).not.toBeInTheDocument();
    expect(drawerItem.textContent).not.toContain('0ml');
  });

  it('calls closeCart when clicking dialog close button', () => {
    mockUseCart.mockReturnValue({
      items: [mockItem1],
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 240000,
    });

    renderWithProviders(<CartDrawer />);

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);

    expect(mockCloseCart).toHaveBeenCalledTimes(1);
  });

  it('reflects state changes when opened, updated, and closed', () => {
    // Initial: drawer closed
    mockUseCart.mockReturnValue({
      items: [mockItem1, mockItem2],
      isOpen: false,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 320000,
    });

    const { rerender } = renderWithProviders(<CartDrawer />);
    expect(screen.queryByText('Giỏ Hàng Của Bạn')).not.toBeInTheDocument();

    // State change: drawer opens
    mockUseCart.mockReturnValue({
      items: [mockItem1, mockItem2],
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 320000,
    });

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <CartDrawer />
      </MemoryRouter>,
    );
    expect(screen.getByText('Giỏ Hàng Của Bạn')).toBeInTheDocument();
    expect(screen.getByText('2 sản phẩm')).toBeInTheDocument();

    // State change: 1 item removed
    mockUseCart.mockReturnValue({
      items: [mockItem2],
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 80000,
    });

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <CartDrawer />
      </MemoryRouter>,
    );
    expect(screen.getByText('1 sản phẩm')).toBeInTheDocument();
    expect(screen.queryByText(mockItem1.name)).not.toBeInTheDocument();
    expect(screen.getByText(mockItem2.name)).toBeInTheDocument();

    // State change: emptied
    mockUseCart.mockReturnValue({
      items: [],
      isOpen: true,
      closeCart: mockCloseCart,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      totalPrice: 0,
    });

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <CartDrawer />
      </MemoryRouter>,
    );
    expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument();
  });
});
