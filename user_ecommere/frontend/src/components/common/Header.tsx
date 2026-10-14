import { Link } from 'react-router-dom';
import { Menu, Phone, ShieldCheck, Truck, User } from 'lucide-react';
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
  { to: '/', label: '🏠 Trang chủ' },
  { to: '/catalog', label: '📦 Tất cả sản phẩm' },
  { to: '/catalog?sort=best_selling', label: '🔥 Bán chạy nhất' },
  { to: '/search?q=chu%E1%BB%99t', label: '🐭 Xịt đuổi chuột' },
  { to: '/search?q=th%E1%BA%B1n%20l%E1%BA%B1n', label: '🦎 Xịt thằn lằn' },
  { to: '/search?q=b%E1%BB%93n%20c%E1%BA%A7u', label: '🚽 Tẩy bồn cầu' },
];

export function Header() {
  const { user, logout } = useAuth();
  const { openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-white text-xs py-2 border-b border-slate-800">
        <div className="container flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] tracking-wider uppercase">
              100% Nội Địa Thái
            </span>
            <span className="text-slate-300 hidden sm:inline text-xs">
              Cam kết hàng chính hãng 100% có hóa đơn | Đổi trả 7 ngày nếu lỗi
            </span>
            <span className="text-slate-300 sm:hidden text-xs">
              Hàng Thái Lan chính hãng 100%
            </span>
          </div>

          <div className="flex items-center gap-5 text-slate-300 text-xs">
            <div className="hidden md:flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-teal-400" />
              <span>Giao hỏa tốc nội thành</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>Bảo hành chính hãng</span>
            </div>
            <a href="tel:0901234567" className="flex items-center gap-1 font-semibold text-amber-400 hover:text-amber-300 transition-colors">
              <Phone className="h-3 w-3" />
              <span>0901.234.567</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all duration-300">
        <div className="container py-3">
          <div className="flex items-center justify-between gap-4 lg:gap-8">
            {/* Mobile Menu & Logo */}
            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl md:hidden text-slate-700 hover:bg-slate-100">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-sm bg-white p-6">
                  <div className="flex flex-col gap-6">
                    <Link to="/" className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 font-black text-base text-white shadow-md shadow-teal-600/20">
                        TS
                      </div>
                      <div>
                        <p className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">THAI SPRAY</p>
                        <p className="text-[11px] font-semibold text-teal-700 mt-1">Chai Xịt Thái Lan Chính Hãng</p>
                      </div>
                    </Link>

                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Danh mục nhanh</p>
                      {mobileLinks.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-black text-lg shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform duration-300">
                  TS
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black tracking-tight text-slate-900 leading-none group-hover:text-teal-700 transition-colors">
                      THAI SPRAY
                    </span>
                    <span className="rounded bg-teal-100 text-teal-800 text-[10px] font-extrabold px-1.5 py-0.5 uppercase tracking-wide">
                      THÁI LAN
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">
                    Chai xịt tiện ích & hàng tiêu dùng
                  </p>
                </div>
              </Link>
            </div>

            {/* Central Search Box */}
            <div className="hidden md:flex flex-1 max-w-xl">
              <SearchBox />
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden xl:flex flex-col text-right pr-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hỗ trợ 24/7</span>
                <span className="text-xs font-bold text-slate-800">Miễn phí tư vấn</span>
              </div>

              {/* Cart Drawer Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={openCart}
                className="relative h-11 gap-2 rounded-xl border-slate-200 bg-white px-3.5 hover:border-teal-300 hover:bg-teal-50/60 transition-all duration-300 shadow-xs"
              >
                <CartBadge />
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-11 gap-2 rounded-xl px-3 hover:bg-slate-100 border border-slate-200/80 bg-white shadow-xs">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-bold text-xs">
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                      <span className="hidden text-sm font-bold text-slate-800 lg:inline max-w-[100px] truncate">
                        {user.name || 'Tài khoản'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 bg-white shadow-xl border-slate-200">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">Đã đăng nhập</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.phone}</p>
                    </div>
                    <DropdownMenuItem asChild className="rounded-xl mt-1">
                      <Link to="/account" className="w-full cursor-pointer py-2 font-semibold text-slate-700">
                        Thông tin tài khoản
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl">
                      <Link to="/orders" className="w-full cursor-pointer py-2 font-semibold text-slate-700">
                        Đơn hàng của tôi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={logout}
                      className="rounded-xl cursor-pointer py-2 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild className="h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 shadow-md shadow-teal-700/20 transition-all duration-300">
                  <Link to="/login" className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Đăng nhập</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search Box */}
          <div className="mt-2.5 md:hidden">
            <SearchBox />
          </div>
        </div>

        {/* Category Nav Bar */}
        <CategoryNav />
      </div>

      <CartDrawer />
    </header>
  );
}
