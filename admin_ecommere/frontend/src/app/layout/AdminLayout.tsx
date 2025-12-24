import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  Warehouse,
  LogOut,
  User as UserIcon,
  Menu,
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
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Sản phẩm', href: '/admin/products', icon: Package },
  { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Mã giảm giá', href: '/admin/coupons', icon: Ticket },
  { name: 'Kho hàng', href: '/admin/inventory', icon: Warehouse },
];

export function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white shadow-md transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className={cn(
          "flex h-16 items-center border-b shrink-0 transition-all duration-300",
          isSidebarOpen ? "px-6" : "justify-center px-0"
        )}>
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold text-primary truncate">Admin Panel</h1>
          ) : (
            <h1 className="text-xl font-bold text-primary truncate">AP</h1>
          )}
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap",
                isActive(item.href)
                  ? "bg-primary text-white font-medium"
                  : "text-gray-700 hover:bg-gray-100 hover:text-primary",
                !isSidebarOpen && "justify-center px-0"
              )}
              title={!isSidebarOpen ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn(
                "transition-all duration-300",
                !isSidebarOpen && "hidden"
              )}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Breadcrumb or Page Title usually goes here, logic depends on context but keeping simple for now */}
            <h2 className="text-lg font-semibold text-gray-800">Quản trị</h2>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>{user?.name || user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
