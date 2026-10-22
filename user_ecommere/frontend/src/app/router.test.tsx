import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppRouter, protectedRoutes, isProtectedRoute } from './router';

const { catalogPromise, resolveCatalog } = vi.hoisted(() => {
  let resolveCatalog!: (val: { CatalogPage: () => React.JSX.Element }) => void;
  const catalogPromise = new Promise<{
    CatalogPage: () => React.JSX.Element;
  }>((res) => {
    resolveCatalog = res;
  });
  return { catalogPromise, resolveCatalog };
});

vi.mock('./layout/MainLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    MainLayout: () => (
      <div data-testid="main-layout">
        <header data-testid="main-header">Main Header</header>
        <Outlet />
        <footer data-testid="main-footer">Main Footer</footer>
      </div>
    ),
  };
});

vi.mock('./layout/AuthLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    AuthLayout: () => (
      <div data-testid="auth-layout">
        <Outlet />
      </div>
    ),
  };
});

vi.mock('./guards/RequireAuth', () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="require-auth">{children}</div>
  ),
}));

vi.mock('@/components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => (
    <div data-testid="loading-spinner">Đang tải dữ liệu...</div>
  ),
}));

vi.mock('@/features/catalog/pages/HomePage', () => ({
  HomePage: () => <div data-testid="home-page">Trang chủ</div>,
}));

vi.mock('@/features/catalog/pages/CatalogPage', () => catalogPromise);

vi.mock('@/features/catalog/pages/CategoryPage', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    CategoryPage: () => {
      const { categorySlug } = useParams();
      return <div data-testid="category-page">Danh mục: {categorySlug}</div>;
    },
  };
});

vi.mock('@/features/catalog/pages/ProductDetailPage', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    ProductDetailPage: () => {
      const { productSlug } = useParams();
      return (
        <div data-testid="product-detail-page">Sản phẩm: {productSlug}</div>
      );
    },
  };
});

vi.mock('@/features/catalog/pages/SearchPage', async () => {
  const { useSearchParams } = await import('react-router-dom');
  return {
    SearchPage: () => {
      const [searchParams] = useSearchParams();
      return (
        <div data-testid="search-page">Tìm kiếm: {searchParams.get('q')}</div>
      );
    },
  };
});

vi.mock('@/features/auth/pages/LoginPage', () => ({
  LoginPage: () => <div data-testid="login-page">Đăng nhập</div>,
}));

vi.mock('@/features/auth/pages/RegisterPage', () => ({
  RegisterPage: () => <div data-testid="register-page">Đăng ký</div>,
}));

vi.mock('@/features/auth/pages/ForgotPasswordPage', () => ({
  ForgotPasswordPage: () => (
    <div data-testid="forgot-password-page">Quên mật khẩu</div>
  ),
}));

vi.mock('@/features/auth/pages/ResetPasswordPage', () => ({
  ResetPasswordPage: () => (
    <div data-testid="reset-password-page">Đặt lại mật khẩu</div>
  ),
}));

vi.mock('@/features/auth/pages/AccountPage', () => ({
  AccountPage: () => <div data-testid="account-page">Tài khoản của tôi</div>,
}));

vi.mock('@/features/users/pages/AddressesPage', () => ({
  AddressesPage: () => <div data-testid="addresses-page">Sổ địa chỉ</div>,
}));

vi.mock('@/features/cart/pages/CartPage', async () => {
  const { useNavigate } = await import('react-router-dom');
  return {
    CartPage: () => {
      const navigate = useNavigate();
      return (
        <div data-testid="cart-page">
          <span>Giỏ hàng</span>
          <button onClick={() => navigate('/checkout')}>
            Đi đến thanh toán
          </button>
        </div>
      );
    },
  };
});

vi.mock('@/features/catalog/pages/WishlistPage', () => ({
  WishlistPage: () => (
    <div data-testid="wishlist-page">Danh sách yêu thích</div>
  ),
}));

vi.mock('@/features/checkout/pages/CheckoutPage', () => ({
  CheckoutPage: () => (
    <div data-testid="checkout-page">Thanh toán đơn hàng</div>
  ),
}));

vi.mock('@/features/orders/pages/OrdersPage', () => ({
  OrdersPage: () => <div data-testid="orders-page">Lịch sử đơn hàng</div>,
}));

vi.mock('@/features/orders/pages/OrderDetailPage', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    OrderDetailPage: () => {
      const { orderId } = useParams();
      return (
        <div data-testid="order-detail-page">Chi tiết đơn hàng: {orderId}</div>
      );
    },
  };
});

vi.mock('@/features/referrals/pages/ReferralPage', () => ({
  ReferralPage: () => (
    <div data-testid="referral-page">Mã giới thiệu bạn bè</div>
  ),
}));

vi.mock('@/pages/NotFoundPage', () => ({
  NotFoundPage: () => (
    <div data-testid="not-found-page">Không tìm thấy trang</div>
  ),
}));

vi.mock('@/pages/ErrorPage', () => ({
  ErrorPage: () => <div data-testid="error-page">Đã xảy ra lỗi</div>,
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('isProtectedRoute', () => {
  it('returns false for falsy or empty path inputs', () => {
    expect(isProtectedRoute('')).toBe(false);
    expect(isProtectedRoute(null as unknown as string)).toBe(false);
    expect(isProtectedRoute(undefined as unknown as string)).toBe(false);
  });

  it('returns false specifically for /login path', () => {
    expect(isProtectedRoute('/login')).toBe(false);
  });

  it('returns false for login path with queries or hashes', () => {
    expect(isProtectedRoute('/login?redirect=/account')).toBe(false);
    expect(isProtectedRoute('/login#top')).toBe(false);
    expect(isProtectedRoute('login')).toBe(false);
  });

  it('handles paths with and without leading slash for all protected routes', () => {
    expect(isProtectedRoute('/account')).toBe(true);
    expect(isProtectedRoute('account')).toBe(true);

    expect(isProtectedRoute('/addresses')).toBe(true);
    expect(isProtectedRoute('addresses')).toBe(true);

    expect(isProtectedRoute('/checkout')).toBe(true);
    expect(isProtectedRoute('checkout')).toBe(true);

    expect(isProtectedRoute('/orders')).toBe(true);
    expect(isProtectedRoute('orders')).toBe(true);

    expect(isProtectedRoute('/orders/ORD-001')).toBe(true);
    expect(isProtectedRoute('orders/ORD-001')).toBe(true);

    expect(isProtectedRoute('/referral')).toBe(true);
    expect(isProtectedRoute('referral')).toBe(true);
  });

  it('strips query parameters when matching protected routes', () => {
    expect(isProtectedRoute('/account?tab=security')).toBe(true);
    expect(isProtectedRoute('account?section=general&lang=vi')).toBe(true);
    expect(isProtectedRoute('/orders?status=processing&page=1')).toBe(true);
    expect(isProtectedRoute('orders/ORD-12345?receipt=1')).toBe(true);
    expect(isProtectedRoute('/referral?ref=VIP2024')).toBe(true);
  });

  it('strips hash fragments when matching protected routes', () => {
    expect(isProtectedRoute('/addresses#default-shipping')).toBe(true);
    expect(isProtectedRoute('addresses#edit-section')).toBe(true);
    expect(isProtectedRoute('/checkout#step-payment')).toBe(true);
    expect(isProtectedRoute('checkout#summary')).toBe(true);
  });

  it('strips both query parameters and hash fragments', () => {
    expect(isProtectedRoute('/orders/ORD-999?sort=desc#item-list')).toBe(true);
    expect(isProtectedRoute('referral?source=fb#rewards')).toBe(true);
  });

  it('returns false for public, auth and non-matching paths', () => {
    expect(isProtectedRoute('/')).toBe(false);
    expect(isProtectedRoute('/catalog')).toBe(false);
    expect(isProtectedRoute('catalog')).toBe(false);
    expect(isProtectedRoute('/c/nuoc-hoa')).toBe(false);
    expect(isProtectedRoute('/p/xit-khoang')).toBe(false);
    expect(isProtectedRoute('/search')).toBe(false);
    expect(isProtectedRoute('/cart')).toBe(false);
    expect(isProtectedRoute('/wishlist')).toBe(false);
    expect(isProtectedRoute('/register')).toBe(false);
    expect(isProtectedRoute('/forgot-password')).toBe(false);
    expect(isProtectedRoute('/reset-password')).toBe(false);
    expect(isProtectedRoute('/error')).toBe(false);
    expect(isProtectedRoute('/404')).toBe(false);
    expect(isProtectedRoute('/duong-dan-khong-ton-tai')).toBe(false);
  });

  it('returns false for unmatched sub-routes of protected routes', () => {
    expect(isProtectedRoute('/orders/ORD-123/items')).toBe(false);
    expect(isProtectedRoute('/account/settings/details')).toBe(false);
    expect(isProtectedRoute('orders/ORD-123/extra')).toBe(false);
  });
});

describe('protectedRoutes', () => {
  it('contains the expected list of protected paths', () => {
    const paths = protectedRoutes.map((route) => route.path);
    expect(paths).toEqual([
      'account',
      'addresses',
      'checkout',
      'orders',
      'orders/:orderId',
      'referral',
    ]);
  });

  it('renders each protected route element in isolation', async () => {
    for (const route of protectedRoutes) {
      const { unmount } = render(
        <MemoryRouter>
          <Suspense fallback={null}>{route.element}</Suspense>
        </MemoryRouter>,
      );

      const expectedTestId =
        route.path === 'account'
          ? 'account-page'
          : route.path === 'addresses'
            ? 'addresses-page'
            : route.path === 'checkout'
              ? 'checkout-page'
              : route.path === 'orders'
                ? 'orders-page'
                : route.path === 'orders/:orderId'
                  ? 'order-detail-page'
                  : 'referral-page';

      await waitFor(() => {
        expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
      });

      unmount();
    }
  });
});

describe('AppRouter', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders fallback loading spinner while route is loading, then displays page after resolution', async () => {
    window.history.pushState({}, '', '/catalog');
    render(<AppRouter />);

    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveTextContent('Đang tải dữ liệu...');
    expect(spinner.parentElement).toHaveClass(
      'min-h-screen',
      'flex',
      'items-center',
      'justify-center',
    );

    act(() => {
      resolveCatalog({
        CatalogPage: () => (
          <div data-testid="catalog-page">Tất cả sản phẩm</div>
        ),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('catalog-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Tất cả sản phẩm')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  describe('Public routes under MainLayout', () => {
    it('renders HomePage at "/" index route', async () => {
      window.history.pushState({}, '', '/');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Trang chủ')).toBeInTheDocument();
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('renders CategoryPage with slug param at "/c/:categorySlug"', async () => {
      window.history.pushState({}, '', '/c/cham-soc-da');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('category-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Danh mục: cham-soc-da')).toBeInTheDocument();
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('renders ProductDetailPage with slug param at "/p/:productSlug"', async () => {
      window.history.pushState({}, '', '/p/nuoc-hoa-hong-duong-am');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('product-detail-page')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Sản phẩm: nuoc-hoa-hong-duong-am'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('renders SearchPage with search parameters at "/search"', async () => {
      window.history.pushState({}, '', '/search?q=xit-thom');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('search-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Tìm kiếm: xit-thom')).toBeInTheDocument();
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('renders CartPage at "/cart"', async () => {
      window.history.pushState({}, '', '/cart');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('cart-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Giỏ hàng')).toBeInTheDocument();
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('renders WishlistPage at "/wishlist"', async () => {
      window.history.pushState({}, '', '/wishlist');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('wishlist-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Danh sách yêu thích')).toBeInTheDocument();
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });
  });

  describe('Auth routes under AuthLayout', () => {
    it('renders LoginPage at "/login" inside AuthLayout without MainLayout', async () => {
      window.history.pushState({}, '', '/login');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
      expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
      expect(screen.queryByTestId('main-layout')).not.toBeInTheDocument();
    });

    it('renders RegisterPage at "/register" inside AuthLayout', async () => {
      window.history.pushState({}, '', '/register');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('register-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Đăng ký')).toBeInTheDocument();
      expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
    });

    it('renders ForgotPasswordPage at "/forgot-password" inside AuthLayout', async () => {
      window.history.pushState({}, '', '/forgot-password');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Quên mật khẩu')).toBeInTheDocument();
      expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
    });

    it('renders ResetPasswordPage at "/reset-password" inside AuthLayout', async () => {
      window.history.pushState({}, '', '/reset-password');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('reset-password-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Đặt lại mật khẩu')).toBeInTheDocument();
      expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
    });
  });

  describe('Protected User routes under RequireAuth and MainLayout', () => {
    it('renders AccountPage at "/account"', async () => {
      window.history.pushState({}, '', '/account');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('account-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Tài khoản của tôi')).toBeInTheDocument();
      expect(screen.getByTestId('require-auth')).toBeInTheDocument();
      expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('renders AddressesPage at "/addresses"', async () => {
      window.history.pushState({}, '', '/addresses');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('addresses-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Sổ địa chỉ')).toBeInTheDocument();
      expect(screen.getByTestId('require-auth')).toBeInTheDocument();
    });

    it('renders CheckoutPage at "/checkout"', async () => {
      window.history.pushState({}, '', '/checkout');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Thanh toán đơn hàng')).toBeInTheDocument();
      expect(screen.getByTestId('require-auth')).toBeInTheDocument();
    });

    it('renders OrdersPage at "/orders"', async () => {
      window.history.pushState({}, '', '/orders');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('orders-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Lịch sử đơn hàng')).toBeInTheDocument();
      expect(screen.getByTestId('require-auth')).toBeInTheDocument();
    });

    it('renders OrderDetailPage with orderId param at "/orders/:orderId"', async () => {
      window.history.pushState({}, '', '/orders/DH-98765');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('order-detail-page')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Chi tiết đơn hàng: DH-98765'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('require-auth')).toBeInTheDocument();
    });

    it('renders ReferralPage at "/referral"', async () => {
      window.history.pushState({}, '', '/referral');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('referral-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Mã giới thiệu bạn bè')).toBeInTheDocument();
      expect(screen.getByTestId('require-auth')).toBeInTheDocument();
    });
  });

  describe('Error and fallback routes', () => {
    it('renders ErrorPage at "/error" without layout wrappers', async () => {
      window.history.pushState({}, '', '/error');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('error-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();
      expect(screen.queryByTestId('main-layout')).not.toBeInTheDocument();
      expect(screen.queryByTestId('auth-layout')).not.toBeInTheDocument();
    });

    it('renders NotFoundPage at "/404"', async () => {
      window.history.pushState({}, '', '/404');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Không tìm thấy trang')).toBeInTheDocument();
      expect(screen.queryByTestId('main-layout')).not.toBeInTheDocument();
      expect(screen.queryByTestId('auth-layout')).not.toBeInTheDocument();
    });

    it('renders NotFoundPage for any unmatched wildcard route "*"', async () => {
      window.history.pushState({}, '', '/duong-dan-khong-ton-tai-123');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
      });
      expect(screen.getByText('Không tìm thấy trang')).toBeInTheDocument();
    });
  });

  describe('User interaction and navigation', () => {
    it('allows the user to interact and navigate between routes', async () => {
      const user = userEvent.setup();
      window.history.pushState({}, '', '/cart');
      render(<AppRouter />);

      await waitFor(() => {
        expect(screen.getByTestId('cart-page')).toBeInTheDocument();
      });

      const checkoutBtn = screen.getByRole('button', {
        name: 'Đi đến thanh toán',
      });
      await user.click(checkoutBtn);

      await waitFor(() => {
        expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
      });
      expect(window.location.pathname).toBe('/checkout');
    });
  });
});
