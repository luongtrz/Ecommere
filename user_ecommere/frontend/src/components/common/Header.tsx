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
      <div className="bg-white border-b">
        <div className="container flex h-14 items-center justify-between">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/" className="text-base font-medium hover:text-primary transition-colors">Trang chủ</Link>
                  <Link to="/catalog" className="text-base font-medium hover:text-primary transition-colors">Sản phẩm</Link>
                  <Link to="/cart" className="text-base font-medium hover:text-primary transition-colors">Giỏ hàng</Link>
                  {user ? (
                    <>
                      <Link to="/account" className="text-base font-medium hover:text-primary transition-colors">Tài khoản</Link>
                      <Link to="/orders" className="text-base font-medium hover:text-primary transition-colors">Đơn hàng</Link>
                      <Link to="/referral" className="text-base font-medium hover:text-primary transition-colors">Mời bạn bè</Link>
                      <button onClick={logout} className="text-base font-medium text-left text-destructive hover:text-destructive/80 transition-colors">Đăng xuất</button>
                    </>
                  ) : (
                    <Link to="/login" className="text-base font-medium hover:text-primary transition-colors">Đăng nhập</Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <span className="text-white font-bold text-xs">TS</span>
              </div>
              <span className="text-lg font-bold text-foreground">Thai Spray</span>
            </Link>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-6 hidden md:block">
            <SearchBox />
          </div>

          {/* Right: Actions */}
          <nav className="flex items-center gap-1">
            <div onClick={openCart} className="relative cursor-pointer">
              <CartBadge />
            </div>

            <CartDrawer />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 border-b mb-1">
                    <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/account">Tài khoản</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/orders">Đơn hàng</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/referral">Mời bạn bè</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="ml-2">
                <Link to="/login">Đăng nhập</Link>
              </Button>
            )}
          </nav>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <SearchBox />
        </div>
      </div>

      <CategoryNav />
    </header>
  );
}
