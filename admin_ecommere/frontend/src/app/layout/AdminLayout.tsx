import { Outlet, Link, useLocation } from 'react-router-dom';
import { Suspense, useState } from 'react';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
  {
    name: 'Dashboard',
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
    name: 'Mã giảm giá',
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

export function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

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
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-xs font-bold text-white shadow-sm transition-transform group-hover:scale-105">
                TS
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-slate-900">
                  Thai Spray Admin
                </p>
                <p className="text-[11px] leading-snug text-slate-500">
                  Điều phối nội dung, đơn hàng và doanh thu.
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Đóng thanh điều hướng"
              className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3 scrollbar-hide">
          {navGroups.map((group) => {
            const items = navigation.filter((item) => item.group === group);
            return (
              <div key={group} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
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
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200',
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
                              'truncate text-[11px] leading-normal mt-0.5',
                              active
                                ? 'text-teal-600/80'
                                : 'text-slate-400 group-hover:text-slate-500',
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

        <div className="border-t border-slate-200 p-3 space-y-2 mt-auto bg-white">
          {/* Quick Link to Customer Store */}
          <a
            href={STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 p-2.5 text-xs text-slate-600 hover:text-slate-900 transition-all group"
          >
            <span className="flex items-center gap-2 font-medium">
              <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
              Xem Cửa Hàng
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              Live
            </span>
          </a>

          {/* User Block */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Phiên quản trị
              </p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {user?.name || user?.email}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">
                    Quyền quản trị viên
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                aria-label="Đăng xuất"
                title="Đăng xuất"
                className="h-8 w-8 shrink-0 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed truncate">
              Theo dõi chỉ số quan trọng và xử lý công việc trong một luồng gọn.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col px-3 pb-6 pt-3 md:px-6 lg:pl-6 lg:pr-8">
        <header className="sticky top-3 z-30 mb-6 flex min-h-[64px] items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Mở thanh điều hướng"
              className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Admin</span>
                <span className="text-slate-300">/</span>
                <span>Không gian vận hành</span>
              </div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 md:text-xl">
                Bảng điều khiển Thai Spray
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-500 md:block">
              Dữ liệu đồng bộ theo phiên gần nhất
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 rounded-full px-2 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="hidden text-left md:block ml-2">
                    <p className="max-w-[160px] truncate text-xs font-semibold text-slate-900">
                      {user?.name || user?.email}
                    </p>
                    <p className="max-w-[160px] truncate text-[10px] text-slate-500">
                      Quyền quản trị viên
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 rounded-xl border-slate-200 bg-white p-1.5 shadow-lg text-slate-900"
              >
                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 px-2 py-1.5">
                  Tài khoản
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 hover:bg-rose-50"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1">
          <Suspense
            fallback={
              <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
