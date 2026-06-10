import { Link } from 'react-router-dom';
import { Menu, Sparkles, User } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-white/50 bg-foreground text-white">
        <div className="container flex min-h-10 items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-white/85">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Hương thơm cho nhà ở, xe hơi và quà tặng mỗi ngày.</span>
          </div>
          <div className="hidden items-center gap-4 text-white/70 md:flex">
            <span>Giao nhanh nội thành</span>
            <span>Đổi trả 7 ngày</span>
          </div>
        </div>
      </div>

      <div className="border-b border-white/40 bg-background/85 backdrop-blur-xl shadow-sm">
        <div className="container py-3.5 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full md:hidden hover:bg-secondary/60">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[86vw] max-w-sm border-white/70 bg-white/95">
                  <div className="mt-6 flex flex-col gap-6">
                    <Link to="/" className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 font-serif text-sm font-extrabold text-secondary shadow-lg shadow-primary/20">
                        TS
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">Thai Spray</p>
                        <p className="text-sm text-muted-foreground">Không gian có gu, hương thơm có dấu ấn.</p>
                      </div>
                    </Link>

                    <div className="section-shell p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Điều hướng nhanh
                      </p>
                      <div className="flex flex-col gap-2">
                        {mobileLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition hover:bg-secondary"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="section-shell p-4 text-sm text-muted-foreground">
                      <p className="mb-2 font-semibold text-foreground">Tài khoản</p>
                      <div className="flex flex-col gap-2">
                        {user ? (
                          <>
                            <Link to="/account" className="rounded-2xl px-4 py-3 transition hover:bg-secondary">Thông tin cá nhân</Link>
                            <Link to="/orders" className="rounded-2xl px-4 py-3 transition hover:bg-secondary">Theo dõi đơn hàng</Link>
                            <Link to="/referral" className="rounded-2xl px-4 py-3 transition hover:bg-secondary">Mời bạn bè</Link>
                            <button
                               onClick={logout}
                               className="rounded-2xl px-4 py-3 text-left text-destructive transition hover:bg-destructive/5"
                            >
                              Đăng xuất
                            </button>
                          </>
                        ) : (
                          <Link to="/login" className="rounded-2xl px-4 py-3 transition hover:bg-secondary">Đăng nhập / Đăng ký</Link>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Link to="/" className="flex items-center gap-3 group">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-950 font-serif text-sm font-extrabold text-secondary shadow-lg shadow-primary/25 transition duration-300 group-hover:scale-105">
                  TS
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="font-semibold leading-none text-foreground transition duration-300 group-hover:text-primary">Thai Spray</p>
                  <p className="mt-1 text-xs text-muted-foreground">Mùi hương tinh gọn, hiện đại, dễ sống cùng.</p>
                </div>
              </Link>
            </div>

            <div className="hidden flex-1 max-w-md mx-auto md:block">
              <SearchBox />
            </div>

            <nav className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className="hidden rounded-full px-4 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground lg:inline-flex"
              >
                <Link to="/catalog?sort=best_selling">Bán chạy</Link>
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="relative h-11 rounded-full px-3 text-muted-foreground hover:bg-secondary hover:text-foreground"
                onClick={openCart}
              >
                <CartBadge />
              </Button>

              <CartDrawer />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-11 rounded-full px-2 hover:bg-secondary">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="hidden text-left md:block">
                        <p className="max-w-[140px] truncate text-sm font-semibold text-foreground">
                          {user.name || 'Tài khoản'}
                        </p>
                        <p className="max-w-[140px] truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl border-white/70 bg-white/95 p-2 shadow-2xl">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5">
                      <Link to="/account">Tài khoản</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5">
                      <Link to="/orders">Đơn hàng</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5">
                      <Link to="/referral">Mời bạn bè</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer rounded-xl px-3 py-2.5 text-destructive focus:text-destructive"
                    >
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild className="h-11 rounded-full px-5">
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
