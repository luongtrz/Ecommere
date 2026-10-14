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
  { name: 'Dashboard', description: 'Tổng quan hiệu suất', href: '/admin', icon: LayoutDashboard },
  { name: 'Trợ lý AI', description: 'Điều hành cửa hàng bằng hội thoại', href: '/admin/chatbot', icon: Bot },
  { name: 'Sản phẩm', description: 'Danh mục và nội dung bán hàng', href: '/admin/products', icon: Package },
  { name: 'Đơn hàng', description: 'Theo dõi và xử lý đơn', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Mã giảm giá', description: 'Chiến dịch và ưu đãi', href: '/admin/coupons', icon: Ticket },
  { name: 'Kho hàng', description: 'Tồn kho và cảnh báo', href: '/admin/inventory', icon: Warehouse },
  { name: 'Danh mục', description: 'Cấu trúc sản phẩm', href: '/admin/categories', icon: FolderTree },
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
    <div className="min-h-screen bg-transparent lg:flex">
      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm flex-col border-r border-white/10 sidebar-glass text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-[320px] lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-white/5 p-6">
          <div className="flex items-start justify-between gap-3">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-400 text-sm font-bold text-white shadow-lg shadow-primary/25 border border-white/10">
                TS
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Thai Spray Admin</p>
                <p className="text-sm text-white/50">Điều phối nội dung, đơn hàng và doanh thu.</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-white hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
 
          <div className="mt-6 rounded-[1.5rem] border border-white/5 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.005)_100%)] p-4 text-sm text-slate-300 shadow-inner">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Phiên quản trị</p>
            <p className="mt-3 font-semibold text-white tracking-wide">{user?.name || user?.email}</p>
            <p className="mt-1 text-xs text-white/40 leading-relaxed">Theo dõi chỉ số quan trọng và xử lý công việc trong một luồng gọn.</p>
          </div>
        </div>
 
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4 scrollbar-hide">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  'group flex items-start gap-3 rounded-[1.35rem] px-4 py-3 transition duration-300 border-l-4',
                  active
                    ? 'bg-[linear-gradient(90deg,rgba(124,58,237,0.15)_0%,rgba(124,58,237,0.03)_100%)] text-white border-primary shadow-[0_0_20px_rgba(124,58,237,0.1)]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white border-transparent',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition duration-300',
                    active ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' : 'bg-white/5 group-hover:bg-white/10 group-hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-snug">{item.name}</p>
                  <p className={cn('mt-0.5 text-xs transition duration-300', active ? 'text-white/60' : 'text-white/40 group-hover:text-white/50')}>{item.description}</p>
                </div>
              </Link>
            );
          })}
        </nav>

  {/* Quick Link to Customer Store */}
          <div className="p-4 border-t border-slate-100">
            <a
              href={STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-200/80 hover:border-teal-200 p-3 text-xs text-slate-700 hover:text-teal-800 transition-all"
            >
              <span className="flex items-center gap-2 font-bold">
                <ExternalLink className="h-3.5 w-3.5 text-teal-600" />
                Xem Cửa Hàng
              </span>
              <span className="text-[10px] text-teal-700 font-mono font-bold">Live</span>
            </a>
          </div>
      </aside>
 
      <div className="flex min-h-screen flex-1 flex-col px-3 pb-3 pt-3 md:px-4 lg:pl-4 lg:pr-6">
        <header className="admin-surface sticky top-3 z-30 mb-4 flex min-h-[76px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Không gian vận hành</p>
              <h1 className="text-lg font-semibold text-foreground md:text-2xl">Bảng điều khiển Thai Spray</h1>
            </div>
          </div>
 
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden rounded-full border border-border bg-secondary/70 px-4 py-2 text-sm text-muted-foreground md:block">
              Dữ liệu đồng bộ theo phiên gần nhất
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 rounded-full px-2 hover:bg-secondary">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="hidden text-left md:block">
                    <p className="max-w-[180px] truncate text-sm font-semibold text-foreground">{user?.name || user?.email}</p>
                    <p className="max-w-[180px] truncate text-xs text-muted-foreground">Quyền quản trị viên</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl border-slate-800 bg-slate-950/95 p-2 shadow-2xl text-slate-200">
                <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Tài khoản
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-xl px-3 py-2.5 text-destructive focus:text-destructive hover:bg-white/5">
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
              <div className="admin-surface flex h-64 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
