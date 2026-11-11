import { Link } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBox } from './SearchBox';
import { CartBadge } from './CartBadge';
import { CategoryNav } from './CategoryNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { useCart } from '@/features/cart/hooks/useCart';

const mobileLinks = [
  { to: '/', label: 'Trang chủ' },
  { to: '/catalog', label: 'Tất cả sản phẩm' },
  { to: '/catalog?sort=best_selling', label: 'Bán chạy nhất' },
  { to: '/search?q=x%E1%BB%8Bt%20ph%C3%B2ng', label: 'Xịt phòng nổi bật' },
];

export function Header() {
  const { user, logout } = useAuth();
  const { openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full bg-background">
      {/* Promo bar */}
      <div className="h-9 border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="container flex h-full items-center justify-between text-xs md:text-sm">
          <p className="truncate">
            Hương thơm cho nhà ở, xe hơi và quà tặng mỗi ngày.
          </p>
          <div className="hidden items-center gap-4 text-xs text-primary-foreground/80 md:flex">
            <span>Giao nhanh nội thành</span>
            <span>Đổi trả 7 ngày</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-border bg-background">
        <div className="container py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full md:hidden"
                    aria-label="Mở menu điều hướng"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[86vw] max-w-sm border-r border-border bg-card p-6">
                  <div className="mt-6 flex flex-col gap-6">
                    <Link to="/" className="flex flex-col">
                      <span className="font-serif text-xl font-bold tracking-tight text-foreground">
                        Thai Spray
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Không gian có gu, hương thơm có dấu ấn.
                      </span>
                    </Link>

                    <div>
                      <p className="eyebrow mb-2 text-muted-foreground">
                        Điều hướng nhanh
                      </p>
                      <div className="divide-y divide-border border-y border-border">
                        {mobileLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="block py-3 text-sm font-medium text-foreground transition-colors hover:text-primary"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="eyebrow mb-2 text-muted-foreground">
                        Tài khoản
                      </p>
                      <div className="divide-y divide-border border-y border-border text-sm">
                        {user ? (
                          <>
                            <Link
                              to="/account"
                              className="block py-3 font-medium text-foreground transition-colors hover:text-primary"
                            >
                              Thông tin cá nhân
                            </Link>
                            <Link
                              to="/orders"
                              className="block py-3 font-medium text-foreground transition-colors hover:text-primary"
                            >
                              Theo dõi đơn hàng
                            </Link>
                            <Link
                              to="/referral"
                              className="block py-3 font-medium text-foreground transition-colors hover:text-primary"
                            >
                              Mời bạn bè
                            </Link>
                            <button
                              type="button"
                              onClick={logout}
                              className="block w-full py-3 text-left font-medium text-destructive transition-colors hover:underline"
                            >
                              Đăng xuất
                            </button>
                          </>
                        ) : (
                          <Link
                            to="/login"
                            className="block py-3 font-medium text-foreground transition-colors hover:text-primary"
                          >
                            Đăng nhập / Đăng ký
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Link to="/" className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight text-foreground transition-colors hover:text-primary md:text-2xl">
                  Thai Spray
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline-block">
                  Mùi hương tinh gọn, hiện đại, dễ sống cùng.
                </span>
              </Link>
            </div>

            <div className="hidden flex-1 max-w-md mx-auto md:block">
              <SearchBox />
            </div>

            <nav className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className="hidden text-sm font-medium text-muted-foreground hover:text-foreground lg:inline-flex"
              >
                <Link to="/catalog?sort=best_selling">Bán chạy</Link>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative rounded-full text-muted-foreground hover:text-foreground"
                onClick={openCart}
                aria-label="Mở giỏ hàng"
              >
                <CartBadge />
              </Button>

              <CartDrawer />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 rounded-md px-2 hover:bg-muted">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="hidden text-left md:block">
                        <p className="max-w-[140px] truncate text-sm font-medium text-foreground">
                          {user.name || 'Tài khoản'}
                        </p>
                        <p className="max-w-[140px] truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-md border border-border bg-popover p-1 shadow-md">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-sm px-3 py-2 text-sm font-medium">
                      <Link to="/account">Tài khoản</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-sm px-3 py-2 text-sm font-medium">
                      <Link to="/orders">Đơn hàng</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-sm px-3 py-2 text-sm font-medium">
                      <Link to="/referral">Mời bạn bè</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer rounded-sm px-3 py-2 text-sm font-medium text-destructive focus:text-destructive"
                    >
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild size="sm">
                  <Link to="/login">Đăng nhập</Link>
                </Button>
              )}
            </nav>
          </div>

          <div className="mt-3 md:hidden">
            <SearchBox />
          </div>
        </div>
      </div>

      <CategoryNav />
    </header>
  );
}
