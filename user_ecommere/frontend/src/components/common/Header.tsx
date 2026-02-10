import { Link } from 'react-router-dom';
import { User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBox } from './SearchBox';
import { CartBadge } from './CartBadge';
import { CategoryNav } from './CategoryNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { useCart } from '@/features/cart/hooks/useCart';

export function Header() {
  const { user, logout } = useAuth();
  const { openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Main header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-glass">
        <div className="container flex h-16 items-center gap-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-lg font-semibold hover:text-primary transition-colors">Trang chủ</Link>
                <Link to="/catalog" className="text-lg font-semibold hover:text-primary transition-colors">Sản phẩm</Link>
                <Link to="/cart" className="text-lg font-semibold hover:text-primary transition-colors">Giỏ hàng</Link>
                {user ? (
                  <>
                    <Link to="/account" className="text-lg font-semibold hover:text-primary transition-colors">Tài khoản</Link>
                    <Link to="/orders" className="text-lg font-semibold hover:text-primary transition-colors">Đơn hàng</Link>
                    <button onClick={logout} className="text-lg font-semibold text-left hover:text-red-500 transition-colors">Đăng xuất</button>
                  </>
                ) : (
                  <Link to="/login" className="text-lg font-semibold hover:text-primary transition-colors">Đăng nhập</Link>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow duration-300">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              Thai Spray
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-auto hidden md:block relative z-50">
            <SearchBox />
          </div>

          {/* Actions */}
          <nav className="flex items-center gap-2">
            <button onClick={openCart} className="relative">
              <CartBadge />
            </button>

            <CartDrawer />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/80 backdrop-blur-2xl border border-white/30 shadow-xl rounded-xl p-1">
                  <div className="px-3 py-2 border-b mb-1">
                    <p className="text-sm font-semibold truncate">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/account">Tài khoản</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/orders">Đơn hàng</Link>
                  </DropdownMenuItem>
                  {user.role === 'ADMIN' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin">Quản trị</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="rounded-lg cursor-pointer text-red-500 focus:text-red-600">
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md text-sm px-5">
                <Link to="/login">Đăng nhập</Link>
              </Button>
            )}
          </nav>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3 relative z-50">
          <SearchBox />
        </div>
      </div>

      <CategoryNav />
    </header>
  );
}
