import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/features/cart/hooks/useCart';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const location = useLocation();
  const { totalItems, openCart } = useCart();
  const { user } = useAuth();

  const navItems = [
    { label: 'Trang chủ', icon: Home, href: '/' },
    { label: 'Sản phẩm', icon: Grid3X3, href: '/catalog' },
    { label: 'Giỏ hàng', icon: ShoppingBag, action: openCart, badge: totalItems },
    { label: 'Tài khoản', icon: User, href: user ? '/account' : '/login' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden pb-safe">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item, index) => {
          const isActive = item.href ? location.pathname === item.href : false;

          if (item.action) {
            return (
              <button
                key={index}
                onClick={item.action}
                className="flex flex-col items-center justify-center w-full h-full gap-0.5 text-muted-foreground"
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={index}
              to={item.href!}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className={cn("text-xs", isActive && "font-medium")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
