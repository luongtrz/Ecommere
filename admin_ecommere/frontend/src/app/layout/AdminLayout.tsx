import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Ticket,
  Warehouse,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  { name: 'Dashboard', description: 'Tổng quan hiệu suất', href: '/admin', icon: LayoutDashboard },
  { name: 'Sản phẩm', description: 'Danh mục & kho hàng bán', href: '/admin/products', icon: Package },
  { name: 'Đơn hàng', description: 'Theo dõi & xử lý đơn COD', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Kho hàng', description: 'Tồn kho & cảnh báo', href: '/admin/inventory', icon: Warehouse },
  { name: 'Danh mục', description: 'Cấu trúc sản phẩm Thái', href: '/admin/categories', icon: FolderTree },
  { name: 'Mã giảm giá', description: 'Chiến dịch & voucher', href: '/admin/coupons', icon: Ticket },
];

export function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 lg:flex admin-shell">
      {/* Mobile backdrop */}
      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm flex-col border-r border-slate-200/80 bg-white text-slate-900 shadow-xl lg:shadow-none transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-[290px] lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Sidebar Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-black text-base shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
              TS
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 block leading-tight">
                Thai Spray <span className="text-teal-700">Admin</span>
              </span>
              <span className="text-[10px] text-teal-800 font-bold uppercase tracking-widest">
                Control Platform
              </span>
            </div>
          </Link>

          <button
            type="button"
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Server Status Badge */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-2.5 text-xs">
            <span className="flex items-center gap-2 text-emerald-800 font-bold text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              Realme C3 • Port 5174
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-semibold">Ubuntu 26.04</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-4 py-3 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  'group flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-teal-50 to-emerald-50/70 text-teal-800 border border-teal-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all',
                    active ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block truncate">{item.name}</span>
                  <span className={cn("block text-[10px] font-normal truncate", active ? "text-teal-700/80" : "text-slate-400")}>
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Quick Link to Customer Store */}
        <div className="p-4 border-t border-slate-100">
          <a
            href="http://192.168.1.94:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-200/80 hover:border-teal-200 p-3 text-xs text-slate-700 hover:text-teal-800 transition-all"
          >
            <span className="flex items-center gap-2 font-bold">
              <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
              Xem Cửa Hàng (Port 5173)
            </span>
            <span className="text-[10px] text-teal-700 font-mono font-bold">Live</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400 font-medium">Trung tâm điều hành</p>
              <p className="text-sm font-extrabold text-slate-900">Tổng Kho Hàng Thái Lan Chính Ngạch</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-2 hover:bg-slate-50 text-left shadow-xs"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-800 font-bold text-xs">
                    AD
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-bold text-slate-900">{user?.name || 'Admin Shop'}</p>
                    <p className="text-[10px] text-teal-700 font-semibold">Quản trị viên tối cao</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 bg-white text-slate-900 shadow-xl">
                <DropdownMenuLabel className="text-xs font-bold text-slate-400">
                  Tài khoản đăng nhập
                </DropdownMenuLabel>
                <div className="px-2 py-1.5 text-xs">
                  <p className="font-bold text-slate-900">{user?.name || 'Admin Shop'}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{user?.phone || '0901234567'}</p>
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl m-1"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất hệ thống
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Viewport Outlet */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto space-y-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
