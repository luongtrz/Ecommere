import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { Suspense } from 'react';
import {
  MemoryRouter,
  Routes,
  Route,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom';

// Fix jsdom vs Node undici AbortSignal mismatch during router.navigate / new Request()
if (typeof globalThis.Request !== 'undefined') {
  const OriginalRequest = globalThis.Request;
  const RequestProxy = new Proxy(OriginalRequest, {
    construct(target, args, newTarget) {
      const [input, init] = args;
      if (init && typeof init === 'object' && 'signal' in init) {
        try {
          return Reflect.construct(target, [input, init], newTarget);
        } catch {
          const { signal: _, ...rest } = init as RequestInit;
          return Reflect.construct(target, [input, rest], newTarget);
        }
      }
      return Reflect.construct(target, args, newTarget);
    },
  });
  globalThis.Request = RequestProxy;
  if (typeof window !== 'undefined') {
    window.Request = RequestProxy;
  }
}

if (typeof globalThis.fetch !== 'undefined') {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (init && typeof init === 'object' && 'signal' in init) {
      try {
        return originalFetch(input, init);
      } catch {
        const { signal: _, ...rest } = init;
        return originalFetch(input, rest);
      }
    }
    return originalFetch(input, init);
  };
  if (typeof window !== 'undefined') {
    window.fetch = globalThis.fetch;
  }
}

import { router } from './router';

const routes = router.routes as unknown as RouteObject[];

vi.mock('./layout/AdminLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    AdminLayout: () => (
      <div data-testid="admin-layout">
        <Suspense
          fallback={
            <div data-testid="admin-suspense">Đang tải trang admin...</div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    ),
  };
});

vi.mock('./layout/AuthLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return {
    AuthLayout: () => (
      <div data-testid="auth-layout">
        <Suspense
          fallback={
            <div data-testid="auth-suspense">Đang tải trang auth...</div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    ),
  };
});

vi.mock('./guards/RequireAuth', () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="require-auth">{children}</div>
  ),
}));

vi.mock('./guards/RequireAdmin', () => ({
  RequireAdmin: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="require-admin">{children}</div>
  ),
}));

vi.mock('@/features/auth/pages/LoginPage', () => ({
  LoginPage: () => <div data-testid="login-page">Đăng nhập Quản trị</div>,
}));

vi.mock('@/features/auth/pages/AccountPage', () => ({
  AccountPage: () => <div data-testid="account-page">Tài khoản của tôi</div>,
}));

vi.mock('@/features/admin/pages/DashboardPage', () => ({
  DashboardPage: () => (
    <div data-testid="dashboard-page">Tổng quan hiệu suất</div>
  ),
}));

vi.mock('@/features/admin/pages/AdminProductsPage', async () => {
  const { useNavigate } = await import('react-router-dom');
  return {
    AdminProductsPage: () => {
      const navigate = useNavigate();
      return (
        <div data-testid="admin-products-page">
          <span>Quản lý sản phẩm</span>
          <button onClick={() => navigate('/admin/products/new')}>
            Thêm sản phẩm mới
          </button>
        </div>
      );
    },
  };
});

vi.mock('@/features/admin/pages/AdminProductFormPage', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    AdminProductFormPage: () => {
      const { id } = useParams();
      return (
        <div data-testid="admin-product-form-page">
          {id ? `Chỉnh sửa sản phẩm: ${id}` : 'Thêm sản phẩm mới'}
        </div>
      );
    },
  };
});

vi.mock('@/features/admin/pages/AdminOrdersPage', () => ({
  AdminOrdersPage: () => (
    <div data-testid="admin-orders-page">Danh sách đơn hàng</div>
  ),
}));

vi.mock('@/features/admin/pages/AdminOrderDetailPage', async () => {
  const { useParams } = await import('react-router-dom');
  return {
    AdminOrderDetailPage: () => {
      const { id } = useParams();
      return (
        <div data-testid="admin-order-detail-page">Chi tiết đơn hàng: {id}</div>
      );
    },
  };
});

vi.mock('@/features/admin/pages/AdminCouponsPage', () => ({
  AdminCouponsPage: () => (
    <div data-testid="admin-coupons-page">Quản lý mã giảm giá và Referral</div>
  ),
}));

vi.mock('@/features/admin/pages/AdminInventoryPage', () => ({
  AdminInventoryPage: () => (
    <div data-testid="admin-inventory-page">Quản lý kho hàng</div>
  ),
}));

vi.mock('@/features/admin/pages/AdminCategoriesPage', () => ({
  AdminCategoriesPage: () => (
    <div data-testid="admin-categories-page">Quản lý danh mục</div>
  ),
}));

vi.mock('@/features/chatbot/pages/AdminChatbotPage', () => ({
  AdminChatbotPage: () => <div data-testid="admin-chatbot-page">Trợ lý AI</div>,
}));

vi.mock('@/pages/ErrorPage', () => ({
  ErrorPage: () => <div data-testid="error-page">Oops! Đã có lỗi xảy ra</div>,
}));

vi.mock('@/pages/NotFoundPage', () => ({
  NotFoundPage: () => (
    <div data-testid="not-found-page">Không tìm thấy trang</div>
  ),
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('router route configurations', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('exports a valid router instance with routes', () => {
    expect(router).toBeDefined();
    expect(routes).toHaveLength(5);
    expect(typeof router.navigate).toBe('function');
  });

  it('defines root redirect route to /admin with replace', () => {
    const rootRoute = routes[0];
    expect(rootRoute.path).toBe('/');
    const element = rootRoute.element as React.ReactElement<{
      to: string;
      replace?: boolean;
    }>;
    expect(element.props.to).toBe('/admin');
    expect(element.props.replace).toBe(true);
  });

  it('defines /chatbot redirect route to /admin/chatbot with replace', () => {
    const chatbotRoute = routes[1];
    expect(chatbotRoute.path).toBe('/chatbot');
    const element = chatbotRoute.element as React.ReactElement<{
      to: string;
      replace?: boolean;
    }>;
    expect(element.props.to).toBe('/admin/chatbot');
    expect(element.props.replace).toBe(true);
  });

  it('defines /login route with AuthLayout and LoginPage child', () => {
    const loginRoute = routes[2];
    expect(loginRoute.path).toBe('/login');
    expect(loginRoute.children).toHaveLength(1);
    expect(loginRoute.children?.[0].index).toBe(true);
  });

  it('defines /admin route with all expected child paths in order', () => {
    const adminRoute = routes[3];
    expect(adminRoute.path).toBe('/admin');
    expect(adminRoute.errorElement).toBeDefined();

    const expectedPaths = [
      'index',
      'chatbot',
      'products',
      'products/new',
      'products/:id/edit',
      'categories',
      'orders',
      'orders/:id',
      'coupons',
      'inventory',
      'account',
    ];

    const actualPaths = adminRoute.children?.map((child) =>
      child.index ? 'index' : child.path,
    );
    expect(actualPaths).toEqual(expectedPaths);
  });

  it('defines wildcard route pointing to NotFoundPage', () => {
    const notFoundRoute = routes[4];
    expect(notFoundRoute.path).toBe('*');
  });
});

describe('isolated route element rendering', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders LoginPage element in isolation', async () => {
    const loginElement = routes[2].children?.[0]?.element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{loginElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Đăng nhập Quản trị')).toBeInTheDocument();
  });

  it('renders DashboardPage index element in isolation', async () => {
    const dashboardElement = routes[3].children?.[0]?.element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{dashboardElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Tổng quan hiệu suất')).toBeInTheDocument();
  });

  it('renders AdminChatbotPage element in isolation', async () => {
    const chatbotElement = routes[3].children?.[1]?.element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{chatbotElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-chatbot-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Trợ lý AI')).toBeInTheDocument();
  });

  it('renders AdminProductsPage element in isolation', async () => {
    const productsElement = routes[3].children?.[2]?.element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{productsElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-products-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Quản lý sản phẩm')).toBeInTheDocument();
  });

  it('renders AdminProductFormPage element for new product in isolation', async () => {
    const productFormElement = routes[3].children?.[3]?.element;
    render(
      <MemoryRouter initialEntries={['/admin/products/new']}>
        <Routes>
          <Route
            path="/admin/products/new"
            element={<Suspense fallback={null}>{productFormElement}</Suspense>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Thêm sản phẩm mới')).toBeInTheDocument();
  });

  it('renders AdminProductFormPage element for edit product in isolation', async () => {
    const productFormElement = routes[3].children?.[4]?.element;
    render(
      <MemoryRouter initialEntries={['/admin/products/PROD-123/edit']}>
        <Routes>
          <Route
            path="/admin/products/:id/edit"
            element={<Suspense fallback={null}>{productFormElement}</Suspense>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Chỉnh sửa sản phẩm: PROD-123'),
    ).toBeInTheDocument();
  });

  it('renders AdminCategoriesPage element in isolation', async () => {
    const categoriesElement = routes[3].children?.[5]?.element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{categoriesElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-categories-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Quản lý danh mục')).toBeInTheDocument();
  });

  it('renders AdminOrdersPage element in isolation', async () => {
    const ordersElement = routes[3].children?.[6]?.element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{ordersElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-orders-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Danh sách đơn hàng')).toBeInTheDocument();
  });

  it('renders AdminOrderDetailPage element in isolation with params', async () => {
    const orderDetailElement = routes[3].children?.[7]?.element;
    render(
      <MemoryRouter initialEntries={['/admin/orders/ORD-999']}>
        <Routes>
          <Route
            path="/admin/orders/:id"
            element={<Suspense fallback={null}>{orderDetailElement}</Suspense>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-order-detail-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Chi tiết đơn hàng: ORD-999')).toBeInTheDocument();
  });

  it('renders AdminCouponsPage element in isolation', async () => {
    const couponsElement = routes[3].children?.[8]?.element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{couponsElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-coupons-page')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Quản lý mã giảm giá và Referral'),
    ).toBeInTheDocument();
  });

  it('renders AdminInventoryPage element in isolation', async () => {
    const inventoryElement = routes[3].children?.[9]?.element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{inventoryElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-inventory-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Quản lý kho hàng')).toBeInTheDocument();
  });

  it('renders AccountPage element in isolation', async () => {
    const accountElement = routes[3].children?.[10]?.element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{accountElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('account-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Tài khoản của tôi')).toBeInTheDocument();
  });

  it('renders ErrorPage element in isolation', async () => {
    const errorElement = routes[3].errorElement;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{errorElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('error-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Oops! Đã có lỗi xảy ra')).toBeInTheDocument();
  });

  it('renders NotFoundPage element in isolation', async () => {
    const notFoundElement = routes[4].element;
    render(
      <MemoryRouter>
        <Suspense fallback={null}>{notFoundElement}</Suspense>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Không tìm thấy trang')).toBeInTheDocument();
  });

  it('renders admin guard and layout wrapper tree in isolation', () => {
    render(<MemoryRouter>{routes[3].element}</MemoryRouter>);

    const requireAuth = screen.getByTestId('require-auth');
    const requireAdmin = screen.getByTestId('require-admin');
    const adminLayout = screen.getByTestId('admin-layout');

    expect(requireAuth).toBeInTheDocument();
    expect(requireAdmin).toBeInTheDocument();
    expect(adminLayout).toBeInTheDocument();

    expect(requireAuth).toContainElement(requireAdmin);
    expect(requireAdmin).toContainElement(adminLayout);
  });

  it('renders auth layout wrapper in isolation', () => {
    render(<MemoryRouter>{routes[2].element}</MemoryRouter>);
    expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
  });

  it('renders root Navigate element in isolation', () => {
    render(<MemoryRouter>{routes[0].element}</MemoryRouter>);
    const element = routes[0].element as React.ReactElement<{
      to: string;
      replace?: boolean;
    }>;
    expect(element.props.to).toBe('/admin');
    expect(element.props.replace).toBe(true);
  });

  it('renders chatbot Navigate element in isolation', () => {
    render(<MemoryRouter>{routes[1].element}</MemoryRouter>);
    const element = routes[1].element as React.ReactElement<{
      to: string;
      replace?: boolean;
    }>;
    expect(element.props.to).toBe('/admin/chatbot');
    expect(element.props.replace).toBe(true);
  });
});

describe('router navigation with RouterProvider', () => {
  beforeEach(async () => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('renders LoginPage at "/login" inside AuthLayout', async () => {
    await act(async () => {
      await router.navigate('/login');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Đăng nhập Quản trị')).toBeInTheDocument();
    expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument();
  });

  it('redirects "/" to "/admin" and renders DashboardPage', async () => {
    await act(async () => {
      await router.navigate('/login');
    });
    await act(async () => {
      await router.navigate('/');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Tổng quan hiệu suất')).toBeInTheDocument();
    expect(screen.getByTestId('require-auth')).toBeInTheDocument();
    expect(screen.getByTestId('require-admin')).toBeInTheDocument();
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin');
  });

  it('redirects "/chatbot" to "/admin/chatbot" and renders AdminChatbotPage', async () => {
    await act(async () => {
      await router.navigate('/login');
    });
    await act(async () => {
      await router.navigate('/chatbot');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-chatbot-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Trợ lý AI')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/chatbot');
  });

  it('renders AdminProductsPage at "/admin/products"', async () => {
    await act(async () => {
      await router.navigate('/admin/products');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-products-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Quản lý sản phẩm')).toBeInTheDocument();
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
  });

  it('renders AdminProductFormPage for new product at "/admin/products/new"', async () => {
    await act(async () => {
      await router.navigate('/admin/products/new');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Thêm sản phẩm mới')).toBeInTheDocument();
  });

  it('renders AdminProductFormPage for edit product at "/admin/products/:id/edit"', async () => {
    await act(async () => {
      await router.navigate('/admin/products/PROD-55/edit');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Chỉnh sửa sản phẩm: PROD-55')).toBeInTheDocument();
  });

  it('renders AdminCategoriesPage at "/admin/categories"', async () => {
    await act(async () => {
      await router.navigate('/admin/categories');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-categories-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Quản lý danh mục')).toBeInTheDocument();
  });

  it('renders AdminOrdersPage at "/admin/orders"', async () => {
    await act(async () => {
      await router.navigate('/admin/orders');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-orders-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Danh sách đơn hàng')).toBeInTheDocument();
  });

  it('renders AdminOrderDetailPage at "/admin/orders/:id"', async () => {
    await act(async () => {
      await router.navigate('/admin/orders/ORD-321');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-order-detail-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Chi tiết đơn hàng: ORD-321')).toBeInTheDocument();
  });

  it('renders AdminCouponsPage at "/admin/coupons"', async () => {
    await act(async () => {
      await router.navigate('/admin/coupons');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-coupons-page')).toBeInTheDocument();
    });
    expect(
      screen.getByText('Quản lý mã giảm giá và Referral'),
    ).toBeInTheDocument();
  });

  it('renders AdminInventoryPage at "/admin/inventory"', async () => {
    await act(async () => {
      await router.navigate('/admin/inventory');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-inventory-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Quản lý kho hàng')).toBeInTheDocument();
  });

  it('renders AccountPage at "/admin/account"', async () => {
    await act(async () => {
      await router.navigate('/admin/account');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('account-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Tài khoản của tôi')).toBeInTheDocument();
  });

  it('renders NotFoundPage at unknown wildcard path', async () => {
    await act(async () => {
      await router.navigate('/duong-dan-khong-ton-tai-404');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Không tìm thấy trang')).toBeInTheDocument();
  });

  it('allows user interaction to navigate between routes', async () => {
    const user = userEvent.setup();
    await act(async () => {
      await router.navigate('/admin/products');
    });

    render(
      <Suspense
        fallback={<div data-testid="suspense-fallback">Đang tải...</div>}
      >
        <RouterProvider router={router} />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-products-page')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: 'Thêm sản phẩm mới' });
    await user.click(addBtn);

    await waitFor(() => {
      expect(screen.getByTestId('admin-product-form-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Thêm sản phẩm mới')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/products/new');
  });
});
