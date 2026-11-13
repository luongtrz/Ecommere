import { Outlet, Link, useLocation } from 'react-router-dom';
import { Suspense, useState, useEffect } from 'react';
import {
  Bot,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Ticket,
  User as UserIcon,
  Warehouse,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STORE_URL } from '@/lib/constants';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const navigation = [
  {
    name: 'Bảng điều khiển',
    description: 'Tổng quan hiệu suất',
    href: '/admin',
    icon: LayoutDashboard,
    group: 'Điều hành',
  },
  {
    name: 'Trợ lý AI',
    description: 'Điều hành cửa hàng bằng hội thoại',
    href: '/admin/chatbot',
    icon: Bot,
    group: 'Điều hành',
  },
  {
    name: 'Sản phẩm',
    description: 'Danh mục và nội dung bán hàng',
    href: '/admin/products',
    icon: Package,
    group: 'Quản lý kinh doanh',
  },
  {
    name: 'Đơn hàng',
    description: 'Theo dõi và xử lý đơn',
    href: '/admin/orders',
    icon: ShoppingCart,
    group: 'Quản lý kinh doanh',
  },
  {
    name: 'Mã giảm giá & Referral',
    description: 'Chiến dịch và ưu đãi',
    href: '/admin/coupons',
    icon: Ticket,
    group: 'Quản lý kinh doanh',
  },
  {
    name: 'Kho hàng',
    description: 'Tồn kho và cảnh báo',
    href: '/admin/inventory',
    icon: Warehouse,
    group: 'Quản lý kinh doanh',
  },
  {
    name: 'Danh mục',
    description: 'Cấu trúc sản phẩm',
    href: '/admin/categories',
    icon: FolderTree,
    group: 'Quản lý kinh doanh',
  },
];

const navGroups = ['Điều hành', 'Quản lý kinh doanh'] as const;

interface RouteMeta {
  title: string;
  breadcrumbs: string[];
}

function getRouteMeta(pathname: string): RouteMeta {
  if (pathname === '/admin' || pathname === '/admin/') {
    return {
      title: 'Bảng điều khiển',
      breadcrumbs: ['Quản trị', 'Bảng điều khiển'],
    };
  }
  if (pathname === '/admin/chatbot' || pathname.startsWith('/admin/chatbot/')) {
    return {
      title: 'Trợ lý AI',
      breadcrumbs: ['Quản trị', 'Trợ lý AI'],
    };
  }
  if (pathname === '/admin/products/new') {
    return {
      title: 'Thêm sản phẩm mới',
      breadcrumbs: ['Quản trị', 'Sản phẩm', 'Thêm mới'],
    };
  }
  if (/^\/admin\/products\/[^/]+\/edit/.test(pathname)) {
    return {
      title: 'Chỉnh sửa sản phẩm',
      breadcrumbs: ['Quản trị', 'Sản phẩm', 'Chỉnh sửa'],
    };
  }
  if (
    pathname === '/admin/products' ||
    pathname.startsWith('/admin/products/')
  ) {
    return {
      title: 'Quản lý sản phẩm',
      breadcrumbs: ['Quản trị', 'Sản phẩm'],
    };
  }
  if (
    pathname === '/admin/categories' ||
    pathname.startsWith('/admin/categories/')
  ) {
    return {
      title: 'Quản lý danh mục',
      breadcrumbs: ['Quản trị', 'Danh mục'],
    };
  }
  if (
    /^\/admin\/orders\/[^/]+/.test(pathname) &&
    pathname !== '/admin/orders'
  ) {
    return {
      title: 'Chi tiết đơn hàng',
      breadcrumbs: ['Quản trị', 'Đơn hàng', 'Chi tiết'],
    };
  }
  if (pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')) {
    return {
      title: 'Quản lý đơn hàng',
      breadcrumbs: ['Quản trị', 'Đơn hàng'],
    };
  }
  if (pathname === '/admin/coupons' || pathname.startsWith('/admin/coupons/')) {
    return {
      title: 'Mã giảm giá & Referral',
      breadcrumbs: ['Quản trị', 'Mã giảm giá & Referral'],
    };
  }
  if (
    pathname === '/admin/inventory' ||
    pathname.startsWith('/admin/inventory/')
  ) {
    return {
      title: 'Quản lý kho hàng',
      breadcrumbs: ['Quản trị', 'Kho hàng'],
    };
  }
  if (pathname === '/admin/account' || pathname.startsWith('/admin/account/')) {
    return {
      title: 'Hồ sơ cá nhân',
      breadcrumbs: ['Quản trị', 'Hồ sơ cá nhân'],
    };
  }
  return {
    title: 'Bảng điều khiển',
    breadcrumbs: ['Quản trị', 'Bảng điều khiển'],
  };
}

export function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const routeMeta = getRouteMeta(location.pathname);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(href);
  };

  useEffect(() => {
    if (!isSidebarOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 lg:flex">
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Đóng thanh điều hướng"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-xs flex-col border-r border-slate-200 bg-white text-slate-900 shadow-xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:translate-x-0 lg:shadow-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/admin"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-xs font-bold text-white shadow-sm transition-transform group-hover:scale-105">
                TS
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  Thai Spray Admin
                </p>
                <p className="text-xs leading-snug text-slate-500">
                  Điều phối nội dung, đơn hàng và doanh thu.
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Đóng thanh điều hướng"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3 scrollbar-hide">
          {navGroups.map((group) => {
            const items = navigation.filter((item) => item.group === group);
            return (
              <div key={group} className="space-y-1">
                <p className="px-3 text-xs font-semibold text-slate-500 tracking-normal normal-case">
                  {group}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={cn(
                          'group relative flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200',
                          active
                            ? 'bg-teal-50 text-teal-700 font-semibold shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-teal-600" />
                        )}
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                            active
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900',
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold leading-tight">
                            {item.name}
                          </p>
                          <p
                            className={cn(
                              'truncate text-xs leading-normal mt-0.5',
                              active
                                ? 'text-teal-700'
                                : 'text-slate-500 group-hover:text-slate-600',
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-200 p-3 space-y-2 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Quick Link to Customer Store */}
          <a
            href={STORE_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setIsSidebarOpen(false)}
            className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-3 py-2 text-xs text-slate-700 hover:text-slate-900 transition-all group"
          >
            <span className="flex items-center gap-2 font-medium">
              <ExternalLink className="h-4 w-4 text-teal-600" />
              Xem Cửa Hàng
            </span>
          </a>

          {/* User Profile Block */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Phiên quản trị
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                Đang hoạt động
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Link
                to="/admin/account"
                onClick={() => setIsSidebarOpen(false)}
                className="flex min-h-[44px] flex-1 items-center gap-2.5 rounded-lg p-1 hover:bg-slate-100 transition-colors group"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-200 text-teal-700 group-hover:bg-teal-100 transition-colors">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {user?.name || user?.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Quyền quản trị viên
                  </p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLogoutDialogOpen(true)}
                aria-label="Đăng xuất"
                title="Đăng xuất"
                className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col px-3 pb-6 pt-3 md:px-6 lg:pl-6 lg:pr-8">
        <header className="sticky top-3 z-30 mb-6 flex min-h-[48px] md:min-h-[64px] items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 md:px-6 md:py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Mở thanh điều hướng"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
              >
                {routeMeta.breadcrumbs.map((crumb, idx) => (
                  <span key={crumb} className="flex items-center gap-1.5">
                    {idx > 0 && <span className="text-slate-400">/</span>}
                    <span>{crumb}</span>
                  </span>
                ))}
              </nav>
              <h2 className="text-base font-bold text-slate-900 md:text-xl">
                {routeMeta.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label="Tài khoản người dùng"
                  className="flex h-11 min-h-[44px] items-center rounded-full px-2 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="hidden text-left md:block ml-2">
                    <p className="max-w-[160px] truncate text-xs font-semibold text-slate-900">
                      {user?.name || user?.email}
                    </p>
                    <p className="max-w-[160px] truncate text-xs text-slate-500">
                      Quyền quản trị viên
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border-slate-200 bg-white p-1.5 shadow-lg text-slate-900"
              >
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {user?.name || user?.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Quyền quản trị viên
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem asChild>
                  <Link
                    to="/admin/account"
                    className="flex min-h-[36px] cursor-pointer items-center rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <UserIcon className="mr-2 h-4 w-4 text-slate-500" />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className="flex min-h-[36px] cursor-pointer items-center rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 hover:bg-rose-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1">
          <Suspense
            fallback={
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                <p className="text-xs font-medium text-slate-500">
                  Đang tải trang...
                </p>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận đăng xuất</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc quản trị? Các
              thay đổi chưa lưu có thể bị mất.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => {
                setIsLogoutDialogOpen(false);
                logout();
              }}
            >
              Đăng xuất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
