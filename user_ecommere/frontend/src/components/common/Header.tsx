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
    <header className="sticky top-0 z-50 w-full bg-white">
      {/* Top promotional strip */}
      <div className="border-b border-teal-700/20 bg-teal-600 text-white">
        <div className="container flex min-h-9 items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-teal-50">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Hương thơm cho nhà ở, xe hơi và quà tặng mỗi ngày.</span>
          </div>
          <div className="hidden items-center gap-5 text-teal-100 md:flex">
            <span>Giao nhanh nội thành</span>
            <span>Đổi trả 7 ngày</span>
          </div>
        </div>
      </div>

      {/* Main header row */}
      <div className="border-b border-slate-200 bg-white">
        <div className="container py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] max-w-sm border-r border-slate-200 bg-white p-6">
                  <div className="mt-6 flex flex-col gap-6">
                    <Link to="/" className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 font-sans text-sm font-bold text-white shadow-sm">
                        TS
                      </div>
                      <div>
                        <p className="font-sans text-base font-bold text-slate-900 tracking-tight">Thai Spray</p>
                        <p className="text-xs text-slate-500 font-sans">Không gian có gu, hương thơm có dấu ấn.</p>
                      </div>
                    </Link>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                        Điều hướng nhanh
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {mobileLinks.map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">Tài khoản</p>
                      <div className="flex flex-col gap-1.5">
                        {user ? (
                          <>
                            <Link to="/account" className="rounded-lg px-3.5 py-2.5 transition hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-medium">Thông tin cá nhân</Link>
                            <Link to="/orders" className="rounded-lg px-3.5 py-2.5 transition hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-medium">Theo dõi đơn hàng</Link>
                            <Link to="/referral" className="rounded-lg px-3.5 py-2.5 transition hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-medium">Mời bạn bè</Link>
                            <button
                              onClick={logout}
                              className="rounded-lg px-3.5 py-2.5 text-left text-rose-600 font-medium transition hover:bg-rose-50"
                            >
                              Đăng xuất
                            </button>
                          </>
                        ) : (
                          <Link to="/login" className="rounded-lg px-3.5 py-2.5 transition hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-medium">Đăng nhập / Đăng ký</Link>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Link to="/" className="flex items-center gap-3 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 font-sans text-sm font-bold text-white shadow-sm transition duration-200 group-hover:bg-teal-700">
                  TS
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="font-sans text-base font-bold leading-none text-slate-900 transition duration-200 group-hover:text-teal-600 tracking-tight">Thai Spray</p>
                  <p className="mt-1 text-xs text-slate-500 font-sans">Mùi hương tinh gọn, hiện đại, dễ sống cùng.</p>
                </div>
              </Link>
            </div>

            <div className="hidden flex-1 max-w-lg mx-6 md:block">
              <SearchBox />
            </div>

            <nav className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className="hidden rounded-lg px-3.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:inline-flex"
              >
                <Link to="/catalog?sort=best_selling">Bán chạy</Link>
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="relative h-10 w-10 rounded-lg p-0 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                onClick={openCart}
              >
                <CartBadge />
              </Button>

              <CartDrawer />

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 rounded-lg px-2 hover:bg-slate-100">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 shadow-sm">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="hidden text-left md:block">
                        <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900">
                          {user.name || 'Tài khoản'}
                        </p>
                        <p className="max-w-[140px] truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-md">
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-teal-700">
                      <Link to="/account">Tài khoản</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-teal-700">
                      <Link to="/orders">Đơn hàng</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-teal-700">
                      <Link to="/referral">Mời bạn bè</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 bg-slate-100" />
                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 focus:text-rose-700"
                    >
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild className="h-9 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500">
                  <Link to="/login">Đăng nhập</Link>
                </Button>
              )}
            </nav>
          </div>

          <div className="mt-2.5 md:hidden">
            <SearchBox />
          </div>
        </div>
      </div>

      <CategoryNav />
    </header>
  );
}
