import { Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  Warehouse,
  Home
} from 'lucide-react';

const navigation = [
  { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
  { name: 'Sản phẩm', href: '/admin/products', icon: Package },
  { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Mã giảm giá', href: '/admin/coupons', icon: Ticket },
  { name: 'Kho hàng', href: '/admin/inventory', icon: Warehouse },
];

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="flex h-16 items-center px-6 border-b">
          <h1 className="text-xl font-bold text-primary">Trang quản trị</h1>
        </div>
        <nav className="p-4 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100"
          >
            <Home className="h-5 w-5" />
            <span>Về trang chủ</span>
          </Link>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-primary transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white shadow-sm flex items-center px-8">
          <h2 className="text-lg font-semibold text-gray-800">Quản trị</h2>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
